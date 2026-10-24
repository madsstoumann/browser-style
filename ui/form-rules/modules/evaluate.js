/**
 * evaluate(form, ruleSet, input) → state
 *
 * A pure function: no I/O, no clock, no randomness. The same inputs give the same
 * output in the browser and on a server. Fetching and emitting are returned as
 * `effects` for the host to carry out.
 */

import { apply, FUNCTIONS, runCheck, truthy } from './logic.js';
import { actionName, actionTargets, FLAG_ACTIONS, gotoFrom, gotoOf, RESTRICTIVE, STEP_ACTIONS } from './actions.js';
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

function resolve(form, results, input) {
	const { previousMatched, hasPrevious, data } = input;
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
		const state = { step: field.step, source: field.source, visible: !field.hidden, enabled: true, required: field.required, options: field.choices ? [...field.choices] : null };
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
	pattern: () => 'Does not match the expected format'
};

/* The field's own constraints (validation in the form definition), as issues. */
function constraintIssues(id, property, value, functions) {
	const validation = property?.validation ?? {};
	const messages = validation.messages ?? {};
	const found = [];
	const fail = (code, rule) => found.push({ field: id, code, message: messages[code] ?? DEFAULT_MESSAGES[code](rule) });
	if (typeof value === 'number') {
		if (typeof validation.minimum === 'number' && value < validation.minimum) fail('minimum', validation.minimum);
		if (typeof validation.maximum === 'number' && value > validation.maximum) fail('maximum', validation.maximum);
	}
	if (typeof value === 'string') {
		if (typeof validation.minLength === 'number' && value.length < validation.minLength) fail('minLength', validation.minLength);
		if (typeof validation.maxLength === 'number' && value.length > validation.maxLength) fail('maxLength', validation.maxLength);
		if (typeof validation.pattern === 'string' && !new RegExp(`^(?:${validation.pattern.replace(/^\^|\$$/g, '')})$`, 'u').test(value)) fail('pattern');
	}
	for (const name of [].concat(validation.check ?? [])) {
		const result = runCheck(functions, name, value);
		if (result) found.push({ field: id, code: result.code, message: messages[result.code] ?? messages[name] ?? result.message, ...(result.level ? { level: result.level } : {}) });
	}
	return found;
}

/* Values a condition can read: only fields that are currently visible. */
const visibleValues = (values, fields) => Object.fromEntries(
	Object.entries(values).filter(([id]) => fields[id]?.visible)
);

export function evaluate(formDefinition, ruleSetDocument, input = {}) {
	const baseForm = normalizeForm(formDefinition);
	const ruleSet = normalizeRuleSet(ruleSetDocument);
	const values = input.values ?? {};
	const hasPrevious = Array.isArray(input.previous?.matched);
	const previousMatched = new Set(input.previous?.matched ?? []);
	const baseRules = ruleSet.rules;

	const declared = ruleSet.variables ?? {};
	let accumulated = accumulate(declared, { varSets: new Map(), varAdds: new Map(), explain: {} });
	let vars = {};
	let patches = [];
	let fieldsSeen = Object.fromEntries([...baseForm.fields].map(([id, field]) => [id, { visible: !field.hidden && !baseForm.steps.find(step => step.id === field.step)?.hidden }]));
	let lastKey = null;
	let state;
	let matched;
	let form;

	for (let pass = 0; pass <= MAX_PASSES; pass++) {
		if (pass === MAX_PASSES) throw new Error('Rules do not settle: a rule keeps hiding a field another rule reads');

		form = withPatchFields(baseForm, patches);
		const rules = [...baseRules, ...patches.flatMap(patch => patch.rules ?? [])];
		const base = {
			values: visibleValues(values, fieldsSeen),
			context: input.context ?? {},
			facts: input.facts ?? {},
			step: input.step ?? null,
			today: input.today ?? null,
			services: Object.fromEntries(patches.filter(patch => patch.data !== undefined).map(patch => [patch.service, patch.data])),
			[FUNCTIONS]: input.functions ?? {}
		};
		vars = computeVars(declared, base, accumulated);
		const data = { ...base, vars };
		const results = rules.map(rule => ({ rule, matched: truthy(apply(rule.when ?? true, data)) }));
		matched = results.filter(result => result.matched).map(result => result.rule.id);

		state = resolve(form, results, { previousMatched, hasPrevious, data });
		const nextAccumulated = accumulate(declared, state);
		const matchedSet = new Set(matched);
		const nextPatches = ruleSet.patches.filter(patch => patch.owner == null || matchedSet.has(patch.owner));
		const key = stableKey({
			matched,
			patches: nextPatches.map(patch => patch.id),
			steps: state.steps.filter(step => step.visible).map(step => step.id),
			vars: nextAccumulated,
			visible: Object.entries(state.fields).filter(([, field]) => field.visible).map(([id]) => id)
		});
		if (key === lastKey) break;
		lastKey = key;
		patches = nextPatches;
		fieldsSeen = state.fields;
		accumulated = nextAccumulated;
	}

	/* What would be submitted: visible, enabled fields only. */
	const submit = {};
	const issues = [...state.issues];
	for (const [id, field] of Object.entries(state.fields)) {
		if (!field.visible || !field.enabled) continue;
		let value = values[id];
		if (state.assigned.has(id)) {
			const decision = decide(state.assigned.get(id), null);
			value = decision.value;
			state.explain[`${id}.value`] = decision.rules;
		}
		if (!isEmpty(value) && field.options) {
			const chosen = Array.isArray(value) ? value : [value];
			if (!chosen.every(option => field.options.includes(option))) {
				issues.push({ field: id, code: 'option-unavailable' });
				value = undefined;
			}
		}
		if (field.required && isEmpty(value)) issues.push({ field: id, code: 'required' });
		if (!isEmpty(value)) issues.push(...constraintIssues(id, form.fields.get(id)?.property, value, input.functions));
		for (const entry of state.invalid.get(id) ?? []) {
			issues.push({ field: id, code: entry.code, message: entry.message, ...(entry.level ? { level: entry.level } : {}), rule: entry.rule });
		}
		if (state.invalid.has(id)) state.explain[`${id}.invalid`] = state.invalid.get(id).map(entry => entry.rule);
		if (value !== undefined) submit[id] = value;
	}

	const visibleView = visibleValues(values, state.fields);
	const effects = state.effects.map(effect => {
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
		values: submit,
		matched,
		patches: patches.map(patch => patch.id),
		effects,
		issues,
		explain: state.explain
	};
}
