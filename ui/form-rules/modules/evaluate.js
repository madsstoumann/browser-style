/**
 * evaluate(form, ruleSet, input) → state
 *
 * A pure function: no I/O, no clock, no randomness. The same inputs give the same
 * output in the browser and on a server. Fetching and emitting are returned as
 * `effects` for the host to carry out.
 */

import { apply, FUNCTIONS, getPath, runCheck, truthy } from './logic.js';
import { actionName, actionTargets, FLAG_ACTIONS, gotoFrom, gotoOf, RESTRICTIVE, rowTarget, STEP_ACTIONS } from './actions.js';
import { normalizeForm, normalizeRuleSet, withPatchFields } from './form.js';

const MAX_PASSES = 16;

const isEmpty = value => value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);

const stableKey = value => {
	if (Array.isArray(value)) return `[${value.map(stableKey).join(',')}]`;
	if (value && typeof value === 'object') {
		return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableKey(value[key])}`).join(',')}}`;
	}
	return JSON.stringify(value ?? null);
};

/* Highest priority wins. On a tie between different values, the restrictive one wins. */
function decide(contributions, restrictive) {
	const top = Math.max(...contributions.map(c => c.priority));
	const winners = contributions.filter(c => c.priority === top);
	const agreed = winners.every(c => c.value === winners[0].value);
	const value = agreed ? winners[0].value : restrictive;
	return { value, rules: winners.filter(c => c.value === value).map(c => c.rule) };
}

/* A choice field (select) whose list comes from a service: options.source names it. On a text field the service only suggests. */
export const sourceOf = property => (typeof property?.options?.source === 'string' ? property.options.source : null);
const isSuggest = property => property?.type !== 'select';
/* The list a host fetched for a sourced field (input.choices[id]): [{ value, label }] or plain values. */
const suppliedChoices = list => (Array.isArray(list) ? list.map(choice => (choice && typeof choice === 'object' ? choice.value : choice)) : null);

function resolve(form, results, input) {
	const { previousMatched, hasPrevious, data, choices = {} } = input;
	const fieldFlags = new Map();
	const stepFlags = new Map();
	const optionRules = new Map();
	const assigned = new Map();
	const gotos = new Map();
	const varSets = new Map();
	const varAdds = new Map();
	const invalid = new Map();
	const effects = [];
	const explain = {};

	const push = (map, key, entry) => {
		if (!map.has(key)) map.set(key, []);
		map.get(key).push(entry);
	};

	for (const { rule, matched } of results) {
		const priority = rule.priority ?? 0;
		const wasMatched = previousMatched.has(rule.id);
		/* A tracked rule reports its own edges, for analytics (ids only). */
		if (rule.track && matched !== (hasPrevious && wasMatched) && (matched || hasPrevious)) {
			effects.push({ type: 'track', event: matched ? 'rule.enter' : 'rule.leave', rule: rule.id });
		}
		const lists = [
			{ actions: rule.then ?? [], active: matched, before: hasPrevious && wasMatched, source: rule.id },
			{ actions: rule.else ?? [], active: !matched, before: hasPrevious && !wasMatched, source: `${rule.id}:else` }
		];

		for (const list of lists) {
			for (const action of list.actions) {
				const name = actionName(action);
				const value = action[name];

				/* Emit fires on the edge, so recomputing the same state never sends it twice. */
				if (name === 'emit') {
					const on = value.on ?? 'enter';
					const fires = on === 'enter' ? list.active && !list.before : !list.active && list.before;
					if (fires) {
						effects.push({ type: 'emit', rule: rule.id, event: value.type, data: value.data ?? null, where: value.where ?? 'any' });
					}
					continue;
				}
				if (!list.active) continue;

				if (name in FLAG_ACTIONS) {
					const [flag, flagValue] = FLAG_ACTIONS[name];
					actionTargets(action).fields.forEach(field => push(fieldFlags, `${field}|${flag}`, { value: flagValue, priority, rule: list.source }));
				} else if (name in STEP_ACTIONS) {
					actionTargets(action).steps.forEach(step => push(stepFlags, step, { value: STEP_ACTIONS[name], priority, rule: list.source }));
				} else if (name === 'options') {
					push(optionRules, value.field, { only: value.only, exclude: value.exclude, rule: list.source });
				} else if (name === 'setValue') {
					push(assigned, value.field, { value: value.value ?? null, priority, rule: list.source });
				} else if (name === 'clear') {
					actionTargets(action).fields.forEach(field => push(assigned, field, { value: null, priority, rule: list.source }));
				} else if (name === 'goto') {
					const from = gotoFrom(form.steps, rule, action);
					if (from) push(gotos, from, { to: gotoOf(action).step, priority, rule: list.source });
				} else if (name === 'set') {
					push(varSets, value.var, { value: apply(value.value ?? null, data), priority, rule: list.source });
				} else if (name === 'add') {
					push(varAdds, value.var, { value: apply(value.value ?? 0, data), rule: list.source });
				} else if (name === 'invalid') {
					push(invalid, value.field, { code: value.code ?? 'invalid', message: value.message ?? null, level: value.level, rule: list.source });
				} else if (name === 'fetch') {
					effects.push({ type: 'fetch', rule: rule.id, service: value.service, into: value.into ?? null, ...(value.after ? { after: value.after } : {}), ...(value.wait ? { wait: true } : {}) });
				}
			}
		}
	}

	const steps = form.steps.map(step => {
		let visible = !step.hidden;
		if (stepFlags.has(step.id)) {
			const decision = decide(stepFlags.get(step.id), false);
			visible = decision.value;
			explain[`step:${step.id}`] = decision.rules;
		}
		return { id: step.id, name: step.name, source: step.source ?? 'form', visible, fields: [...step.fields] };
	});

	/* goto: walking the visible steps, a jump from a step hides the steps between it and its target. */
	const jumps = [];
	const issues = [];
	for (let index = 0; index < steps.length; index++) {
		const step = steps[index];
		if (!step.visible || !gotos.has(step.id)) continue;
		const options = gotos.get(step.id);
		const top = Math.max(...options.map(option => option.priority));
		const targets = options.filter(option => option.priority === top)
			.map(option => ({ ...option, at: steps.findIndex(s => s.id === option.to) }))
			.filter(option => {
				const valid = option.at > index && steps[option.at].visible;
				if (!valid) issues.push({ step: step.id, code: 'goto-target', target: option.to, rule: option.rule });
				return valid;
			})
			.sort((a, b) => a.at - b.at);
		if (!targets.length) continue;
		/* On a tie, the nearest target wins: it passes over the fewest steps. */
		const target = targets[0];
		const rules = targets.filter(option => option.at === target.at).map(option => option.rule);
		for (let between = index + 1; between < target.at; between++) {
			if (!steps[between].visible) continue;
			steps[between].visible = false;
			explain[`step:${steps[between].id}`] = rules;
		}
		jumps.push({ from: step.id, to: target.to, rules });
		index = target.at - 1;
	}
	const stepVisible = new Map(steps.map(step => [step.id, step.visible]));

	const fields = {};
	for (const [id, field] of form.fields) {
		const supplied = sourceOf(field.property) ? suppliedChoices(choices[id]) : null;
		const state = { step: field.step, source: field.source, visible: !field.hidden, enabled: true, required: field.required, options: field.choices ? [...field.choices] : supplied };
		for (const flag of ['visible', 'enabled', 'required']) {
			const key = `${id}|${flag}`;
			if (!fieldFlags.has(key)) continue;
			const decision = decide(fieldFlags.get(key), RESTRICTIVE[flag]);
			state[flag] = decision.value;
			explain[`${id}.${flag}`] = decision.rules;
		}
		if (!stepVisible.get(field.step)) {
			state.visible = false;
			explain[`${id}.visible`] = [`step:${field.step}`];
		}
		if (optionRules.has(id) && state.options) {
			for (const { only, exclude } of optionRules.get(id)) {
				if (Array.isArray(only)) state.options = state.options.filter(option => only.includes(option));
				if (Array.isArray(exclude)) state.options = state.options.filter(option => !exclude.includes(option));
			}
			explain[`${id}.options`] = optionRules.get(id).map(entry => entry.rule);
		}
		fields[id] = state;
	}

	return { steps, fields, assigned, effects, explain, jumps, issues, varSets, varAdds, invalid };
}

/* A row rule ("forEach": "lines") runs once per row of a repeating group, reading the row as row.* and its
   position as index. Its actions target the row's own fields as "lines.note". Cell keys: "lines|0|note". */
const ROW_FLAGS = ['visible', 'enabled', 'required'];

function resolveRows(form, rowRules, data) {
	const flags = new Map();
	const assigned = new Map();
	const invalid = new Map();
	const matched = new Set();
	const push = (map, key, entry) => {
		if (!map.has(key)) map.set(key, []);
		map.get(key).push(entry);
	};
	for (const rule of rowRules) {
		const list = rule.forEach;
		const rows = data.values[list];
		if (!Array.isArray(rows)) continue;
		const priority = rule.priority ?? 0;
		rows.forEach((row, index) => {
			const hit = truthy(apply(rule.when ?? true, { ...data, row, index }));
			if (hit) matched.add(rule.id);
			for (const action of (hit ? rule.then : rule.else) ?? []) {
				const name = actionName(action);
				const value = action[name];
				const source = hit ? rule.id : `${rule.id}:else`;
				const cell = item => `${list}|${index}|${item}`;
				if (name in FLAG_ACTIONS) {
					const [flag, flagValue] = FLAG_ACTIONS[name];
					actionTargets(action).fields.map(target => rowTarget(list, target)).filter(Boolean)
						.forEach(item => push(flags, `${cell(item)}|${flag}`, { value: flagValue, priority, rule: source }));
				} else if (name === 'setValue' || name === 'clear') {
					actionTargets(action).fields.map(target => rowTarget(list, target)).filter(Boolean)
						.forEach(item => push(assigned, cell(item), { value: name === 'clear' ? null : value.value ?? null, priority, rule: source }));
				} else if (name === 'invalid') {
					const item = rowTarget(list, value.field);
					if (item) push(invalid, cell(item), { code: value.code ?? 'invalid', message: value.message ?? null, level: value.level, rule: source });
				}
			}
		});
	}

	/* Every cell of a list some row rule targets: its own required and hidden, then the rules' decisions. */
	const rows = {};
	const explain = {};
	for (const list of new Set(rowRules.map(rule => rule.forEach))) {
		const items = form.fields.get(list)?.property?.items?.properties ?? {};
		const count = Array.isArray(data.values[list]) ? data.values[list].length : 0;
		rows[list] = Array.from({ length: count }, (_, index) => Object.fromEntries(Object.entries(items).map(([item, property]) => {
			const state = { visible: property?.ui?.hidden !== true, enabled: true, required: property?.required === true };
			for (const flag of ROW_FLAGS) {
				const key = `${list}|${index}|${item}|${flag}`;
				if (!flags.has(key)) continue;
				const decision = decide(flags.get(key), RESTRICTIVE[flag]);
				state[flag] = decision.value;
				explain[`${list}[${index}].${item}.${flag}`] = decision.rules;
			}
			return [item, state];
		})));
	}
	return { rows, assigned, invalid, matched, explain };
}

/* A list's rows as rules read them: cells a row rule hides or disables are absent. */
const rowsView = (rows, cells) => (Array.isArray(rows) && cells ? rows.map((row, index) => Object.fromEntries(
	Object.entries(row).filter(([item]) => !cells[index] || !cells[index][item] || (cells[index][item].visible && cells[index][item].enabled))
)) : rows);

/* Variables a rule set declares: computed ones from their expression, the others from rules (set, then add). */
function computeVars(declared, base, accumulated) {
	const vars = { ...accumulated };
	for (const [name, definition] of Object.entries(declared)) {
		if (definition && 'compute' in definition) vars[name] = apply(definition.compute, { ...base, vars });
	}
	return vars;
}

function accumulate(declared, state) {
	const vars = {};
	for (const [name, definition] of Object.entries(declared)) {
		if (definition && 'compute' in definition) continue;
		let value = definition?.initial ?? null;
		const sources = [];
		const sets = state.varSets.get(name);
		if (sets) {
			const top = Math.max(...sets.map(entry => entry.priority));
			const winner = sets.find(entry => entry.priority === top);
			value = winner.value;
			sources.push(winner.rule);
		}
		for (const add of state.varAdds.get(name) ?? []) {
			if (typeof add.value !== 'number' || !Number.isFinite(add.value)) continue;
			value = (typeof value === 'number' ? value : 0) + add.value;
			sources.push(add.rule);
		}
		if (sources.length) state.explain[`vars.${name}`] = sources;
		vars[name] = value;
	}
	return vars;
}

const DEFAULT_MESSAGES = {
	minimum: rule => `Must be at least ${rule}`,
	maximum: rule => `Must be at most ${rule}`,
	minLength: rule => `Must be at least ${rule} characters`,
	maxLength: rule => `Must be at most ${rule} characters`,
	pattern: () => 'Does not match the expected format',
	maxFiles: rule => (rule === 1 ? 'Choose one file' : `Choose at most ${rule} files`),
	maxSize: rule => `Each file must be at most ${formatSize(rule)}`,
	accept: rule => `Allowed file types: ${rule}`,
	minItems: rule => (rule === 1 ? 'Add at least one row' : `Add at least ${rule} rows`),
	maxItems: rule => (rule === 1 ? 'Only one row is allowed' : `At most ${rule} rows`)
};

/* Input messages (input.messages, for example from a language pack) are text with {limit} for the rule's number. */
const messageFor = (messages, code, rule) => {
	const text = messages?.[code];
	if (typeof text === 'string') return text.replaceAll('{limit}', code === 'maxSize' ? formatSize(rule) : String(rule ?? ''));
	return DEFAULT_MESSAGES[code](rule);
};

export const ITEM_TYPES = ['string', 'number', 'integer', 'boolean', 'select'];

const formatSize = bytes => (bytes >= 1048576 ? `${Math.round(bytes / 104857.6) / 10} MB` : `${Math.ceil(bytes / 1024)} KB`);

/* Whether a file ({ name, type }) matches an accept list like ".pdf,image/*". */
export function accepts(accept, file) {
	const list = String(accept ?? '').split(',').map(item => item.trim().toLowerCase()).filter(Boolean);
	if (!list.length) return true;
	const name = String(file?.name ?? '').toLowerCase();
	const type = String(file?.type ?? '').toLowerCase();
	return list.some(item => (item.startsWith('.') ? name.endsWith(item) : item.endsWith('/*') ? type.startsWith(item.slice(0, -1)) : type === item));
}

/* Whether a posted value has the JSON shape its field's type gives it. Anything can be posted, so a server
   must not run text constraints only when the value happens to be text: an array posted for an email field
   would skip its pattern and be stored. A field without a type takes one plain value (or a list, when multiple). */
const isChoice = item => typeof item === 'string' || (typeof item === 'number' && Number.isFinite(item));
export function hasValueType(property, value) {
	const multiple = property?.options?.multiple === true;
	switch (property?.type) {
		case 'string': return typeof value === 'string';
		case 'number': return typeof value === 'number' && Number.isFinite(value);
		case 'integer': return Number.isInteger(value);
		case 'boolean': return typeof value === 'boolean';
		case 'select': return multiple ? Array.isArray(value) && value.every(isChoice) : isChoice(value);
		case 'file': return Array.isArray(value) && value.every(file => file && typeof file === 'object' && !Array.isArray(file) && typeof file.name === 'string');
		case 'list': return Array.isArray(value) && value.every(row => row !== null && typeof row === 'object' && !Array.isArray(row));
		default: {
			const plain = item => isChoice(item) || typeof item === 'boolean';
			return multiple ? Array.isArray(value) && value.every(plain) : plain(value);
		}
	}
}

/* The field's own constraints (validation in the form definition), as issues. */
function constraintIssues(id, property, value, { functions, messages: inputMessages } = {}) {
	const validation = property?.validation ?? {};
	const messages = validation.messages ?? {};
	const found = [];
	const fail = (code, rule) => found.push({ field: id, code, message: messages[code] ?? messageFor(inputMessages, code, rule) });
	if (typeof value === 'number') {
		if (typeof validation.minimum === 'number' && value < validation.minimum) fail('minimum', validation.minimum);
		if (typeof validation.maximum === 'number' && value > validation.maximum) fail('maximum', validation.maximum);
	}
	if (typeof value === 'string') {
		if (typeof validation.minLength === 'number' && value.length < validation.minLength) fail('minLength', validation.minLength);
		if (typeof validation.maxLength === 'number' && value.length > validation.maxLength) fail('maxLength', validation.maxLength);
		if (typeof validation.pattern === 'string' && !new RegExp(`^(?:${validation.pattern.replace(/^\^|\$$/g, '')})$`, 'u').test(value)) fail('pattern');
	}
	if (property?.type === 'list' && Array.isArray(value)) {
		if (typeof validation.minItems === 'number' && value.length < validation.minItems) fail('minItems', validation.minItems);
		if (typeof validation.maxItems === 'number' && value.length > validation.maxItems) fail('maxItems', validation.maxItems);
		return found;
	}
	if (property?.type === 'file' && Array.isArray(value)) {
		if (typeof validation.maxFiles === 'number' && value.length > validation.maxFiles) fail('maxFiles', validation.maxFiles);
		if (typeof validation.maxSize === 'number' && value.some(file => file?.size > validation.maxSize)) fail('maxSize', validation.maxSize);
		if (validation.accept && !value.every(file => accepts(validation.accept, file))) fail('accept', validation.accept);
		return found;
	}
	for (const name of [].concat(validation.check ?? [])) {
		const result = runCheck(functions, name, value);
		if (result) found.push({ field: id, code: result.code, message: messages[result.code] ?? messages[name] ?? result.message, ...(result.level ? { level: result.level } : {}) });
	}
	return found;
}

/* A calculated field shows a variable: `from: "vars.total"`. Its value is always the variable's, never an answer. */
export const calculatedFrom = property => (typeof property?.from === 'string' && property.from.startsWith('vars.') ? property.from.slice(5) : null);

const calculatedValue = (property, vars) => {
	const value = vars[calculatedFrom(property)] ?? null;
	return value !== null && hasValueType(property, value) ? value : null;
};

/* A repeating group's rows, cleaned: only its item keys, each of its type. Wholly empty rows are dropped.
   Issues carry { row, item } besides the field. */
function listRows(id, property, rows, input, cellOf = () => null) {
	const items = property?.items?.properties ?? {};
	const issues = [];
	const kept = [];
	for (const row of rows) {
		const clean = {};
		const rowIssues = [];
		const at = { row: kept.length };
		for (const [key, item] of Object.entries(items)) {
			const cell = cellOf(at.row, key);
			if (cell && (!cell.visible || !cell.enabled)) continue;
			const required = cell ? cell.required : item?.required === true;
			const value = cell?.assigned ? cell.assigned.value : row[key];
			const where = { ...at, item: key };
			for (const entry of cell?.invalid ?? []) rowIssues.push({ field: id, ...where, code: entry.code, message: entry.message, ...(entry.level ? { level: entry.level } : {}), rule: entry.rule });
			if (isEmpty(value)) {
				if (required) rowIssues.push({ field: id, ...where, code: 'required' });
				continue;
			}
			if (!ITEM_TYPES.includes(item?.type) || !hasValueType(item, value)) {
				rowIssues.push({ field: id, ...where, code: 'type' });
				continue;
			}
			const choices = item.options?.choices?.map(choice => choice?.value ?? choice);
			if (choices && !(Array.isArray(value) ? value : [value]).every(option => choices.includes(option))) {
				rowIssues.push({ field: id, ...where, code: 'option-unavailable' });
				continue;
			}
			if (item.type === 'boolean' && required && value !== true) rowIssues.push({ field: id, ...where, code: 'required' });
			rowIssues.push(...constraintIssues(id, item, value, input).map(issue => ({ ...issue, ...where })));
			clean[key] = value;
		}
		if (!Object.keys(clean).length && Object.keys(items).every(key => isEmpty(row[key]))) continue;
		kept.push(clean);
		issues.push(...rowIssues);
	}
	return { rows: kept, issues };
}

/* Prefills: a field with no answer yet (no key in values) reads `from` (context.* or facts.*), then its `default`. */
function withPrefill(form, values, input) {
	const filled = { ...values };
	for (const [id, field] of form.fields) {
		const property = field.property ?? {};
		if (calculatedFrom(property)) {
			delete filled[id];
			continue;
		}
		if (Object.hasOwn(values, id) || property.type === 'content') continue;
		let value = typeof property.from === 'string' ? getPath({ context: input.context ?? {}, facts: input.facts ?? {} }, property.from) : null;
		if (value === null && property.default !== undefined) value = property.default;
		/* A text field prefilled from a number or a yes/no keeps it as text, so it passes the type check. */
		if (property.type === 'string' && (typeof value === 'number' || typeof value === 'boolean')) value = String(value);
		if (value !== null && value !== undefined) filled[id] = value;
	}
	return filled;
}

/* A field with no value of its own (a text block). */
export const hasNoValue = property => property?.type === 'content';

/* Values a condition can read: only fields that are currently visible. */
const visibleValues = (values, fields) => Object.fromEntries(
	Object.entries(values).filter(([id]) => fields[id]?.visible)
);

export function evaluate(formDefinition, ruleSetDocument, input = {}) {
	const baseForm = normalizeForm(formDefinition);
	const ruleSet = normalizeRuleSet(ruleSetDocument);
	const values = withPrefill(baseForm, input.values ?? {}, input);
	/* Rules read a repeating group's rows as they would be submitted: only its item keys, each of its type. */
	const readable = { ...values };
	for (const [id, field] of baseForm.fields) {
		if (field.property?.type === 'list' && Array.isArray(values[id])) readable[id] = listRows(id, field.property, values[id], input).rows;
	}
	const hasPrevious = Array.isArray(input.previous?.matched);
	const previousMatched = new Set(input.previous?.matched ?? []);
	const baseRules = ruleSet.rules;

	const declared = ruleSet.variables ?? {};
	let accumulated = accumulate(declared, { varSets: new Map(), varAdds: new Map(), explain: {} });
	let vars = {};
	let patches = [];
	let cellsSeen = {};
	let rowState = { rows: {}, assigned: new Map(), invalid: new Map(), matched: new Set(), explain: {} };
	let fieldsSeen = Object.fromEntries([...baseForm.fields].map(([id, field]) => [id, { visible: !field.hidden && !baseForm.steps.find(step => step.id === field.step)?.hidden }]));
	let lastKey = null;
	let state;
	let matched;
	let form;

	for (let pass = 0; pass <= MAX_PASSES; pass++) {
		if (pass === MAX_PASSES) throw new Error('Rules do not settle: a rule keeps hiding a field another rule reads');

		form = withPatchFields(baseForm, patches);
		const allRules = [...baseRules, ...patches.flatMap(patch => patch.rules ?? [])];
		const rules = allRules.filter(rule => typeof rule.forEach !== 'string');
		const rowRules = allRules.filter(rule => typeof rule.forEach === 'string');
		const shown = visibleValues(readable, fieldsSeen);
		for (const list of Object.keys(cellsSeen)) if (Object.hasOwn(shown, list)) shown[list] = rowsView(shown[list], cellsSeen[list]);
		const base = {
			values: shown,
			context: input.context ?? {},
			facts: input.facts ?? {},
			step: input.step ?? null,
			today: input.today ?? null,
			services: Object.fromEntries(patches.filter(patch => patch.data !== undefined).map(patch => [patch.service, patch.data])),
			[FUNCTIONS]: input.functions ?? {}
		};
		vars = computeVars(declared, base, accumulated);
		for (const [id, field] of form.fields) {
			if (calculatedFrom(field.property) && fieldsSeen[id]?.visible) base.values[id] = calculatedValue(field.property, vars);
		}
		const data = { ...base, vars };
		const results = rules.map(rule => ({ rule, matched: truthy(apply(rule.when ?? true, data)) }));
		rowState = resolveRows(form, rowRules, data);
		const hits = new Set([...results.filter(result => result.matched).map(result => result.rule.id), ...rowState.matched]);
		matched = allRules.filter(rule => hits.has(rule.id)).map(rule => rule.id);

		state = resolve(form, results, { previousMatched, hasPrevious, data, choices: input.choices });
		const nextAccumulated = accumulate(declared, state);
		const matchedSet = new Set(matched);
		const nextPatches = ruleSet.patches.filter(patch => patch.owner == null || matchedSet.has(patch.owner));
		const key = stableKey({
			matched,
			patches: nextPatches.map(patch => patch.id),
			steps: state.steps.filter(step => step.visible).map(step => step.id),
			vars: nextAccumulated,
			visible: Object.entries(state.fields).filter(([, field]) => field.visible).map(([id]) => id),
			cells: rowState.rows
		});
		if (key === lastKey) break;
		lastKey = key;
		patches = nextPatches;
		fieldsSeen = state.fields;
		cellsSeen = rowState.rows;
		accumulated = nextAccumulated;
	}

	/* What would be submitted: visible, enabled fields only. */
	const submit = {};
	const issues = [...state.issues];
	for (const [id, field] of Object.entries(state.fields)) {
		if (!field.visible || !field.enabled) continue;
		const property = form.fields.get(id)?.property;
		if (hasNoValue(property)) continue;
		let value = values[id];
		if (calculatedFrom(property)) {
			value = calculatedValue(property, vars) ?? undefined;
		} else if (state.assigned.has(id)) {
			const decision = decide(state.assigned.get(id), null);
			value = decision.value;
			state.explain[`${id}.value`] = decision.rules;
		} else if (!isEmpty(value) && !hasValueType(property, value)) {
			issues.push({ field: id, code: 'type' });
			value = undefined;
		}
		if (property?.type === 'list' && Array.isArray(value)) {
			const cells = rowState.rows[id];
			const cellOf = cells ? (index, item) => {
				const cell = cells[index]?.[item];
				if (!cell) return null;
				const key = `${id}|${index}|${item}`;
				const assigned = rowState.assigned.has(key) ? decide(rowState.assigned.get(key), null) : null;
				if (assigned) state.explain[`${id}[${index}].${item}.value`] = assigned.rules;
				return { ...cell, assigned, invalid: rowState.invalid.get(key) ?? [] };
			} : undefined;
			const list = listRows(id, property, value, input, cellOf);
			issues.push(...list.issues);
			value = list.rows;
		}
		if (!isEmpty(value) && field.options) {
			const chosen = Array.isArray(value) ? value : [value];
			if (!chosen.every(option => field.options.includes(option))) {
				issues.push({ field: id, code: 'option-unavailable' });
				value = undefined;
			}
		}
		/* A required yes/no or consent must be ticked, as the browser's own required checkbox. */
		if (field.required && (isEmpty(value) || (property?.type === 'boolean' && value !== true))) issues.push({ field: id, code: 'required' });
		if (!isEmpty(value)) issues.push(...constraintIssues(id, property, value, input));
		for (const entry of state.invalid.get(id) ?? []) {
			issues.push({ field: id, code: entry.code, message: entry.message, ...(entry.level ? { level: entry.level } : {}), rule: entry.rule });
		}
		if (state.invalid.has(id)) state.explain[`${id}.invalid`] = state.invalid.get(id).map(entry => entry.rule);
		if (value !== undefined) submit[id] = value;
	}

	const visibleView = visibleValues(readable, state.fields);
	/* A visible field with a sourced list asks for it; the key changes when the answers it sends do. */
	for (const [id, field] of Object.entries(state.fields)) {
		const property = form.fields.get(id)?.property;
		const name = sourceOf(property);
		if (!name || !field.visible || isSuggest(property) || form.fields.get(id).choices) continue;
		state.effects.push({ type: 'options', field: id, service: name });
	}
	const effects = state.effects.map(effect => {
		if (effect.type === 'options') {
			const service = ruleSet.services[effect.service] ?? {};
			const send = Object.fromEntries((service.send ?? []).map(field => [field, visibleView[field] ?? null]));
			return { ...effect, url: service.url ?? null, send, key: `${effect.service}:${stableKey(send)}` };
		}
		if (effect.type !== 'fetch') return effect;
		const service = ruleSet.services[effect.service] ?? {};
		const send = Object.fromEntries((service.send ?? []).map(field => [field, visibleView[field] ?? null]));
		const mounted = ruleSet.patches.some(patch => patch.owner === effect.rule && patch.service === effect.service);
		return { ...effect, url: service.url ?? null, send, key: `${effect.service}:${stableKey(send)}`, mounted };
	});

	return {
		form: baseForm.id ?? null,
		rules: ruleSet.id ?? null,
		version: ruleSet.version ?? null,
		steps: state.steps,
		path: state.steps.filter(step => step.visible).map(step => step.id),
		jumps: state.jumps,
		vars,
		fields: state.fields,
		rows: rowState.rows,
		values: submit,
		matched,
		patches: patches.map(patch => patch.id),
		effects,
		issues,
		explain: { ...state.explain, ...rowState.explain }
	};
}
