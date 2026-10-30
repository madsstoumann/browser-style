/**
 * validate(form, ruleSet) → { valid, errors: [{ code, message, path }], warnings: [same shape] }
 *
 * Checks a form definition and its rule set together, before anything runs:
 * unknown fields, steps, slots, services, operators and actions, duplicate ids,
 * option values that do not exist, and cycles between rules.
 */

import { operatorsOf, readsOf, OPERATORS } from './logic.js';
import { actionName, actionTargets, ACTIONS, gotoFrom, gotoOf, ROW_ACTIONS, rowTarget, VARIABLE_ACTIONS } from './actions.js';
import { normalizeForm, normalizeRuleSet, unwrap } from './form.js';
import { CONTEXT_SOURCES } from './context.js';
import { placeholdersOf } from './text.js';
import { conditionOf, implicitRules } from './show.js';

const INPUT_ROOTS = ['values', 'context', 'facts', 'step', 'today', 'vars', 'services'];
/* Only these change what a condition can read, since hidden values read as absent. */
const VISIBILITY = new Set(['show', 'hide', 'skip', 'include']);
/* Row actions that take a cell out of what rules read. */
const CELL_HIDING = new Set(['show', 'hide', 'enable', 'disable']);

/* Names used by the "check" operator. */
function checksOf(logic, found = []) {
	if (Array.isArray(logic)) logic.forEach(item => checksOf(item, found));
	else if (logic && typeof logic === 'object') {
		const [op] = Object.keys(logic);
		if (op === 'check' && Array.isArray(logic.check)) found.push(logic.check[0]);
		Object.values(logic).forEach(value => checksOf(value, found));
	}
	return found;
}

const PROPERTY_TYPES = ['string', 'number', 'integer', 'boolean', 'select', 'content', 'file', 'list'];
const ITEM_TYPES = ['string', 'number', 'integer', 'boolean', 'select'];
const PREFILL_ROOTS = ['context', 'facts', 'vars'];

/* `types`: a registry from defineTypes()/loadTypes(); when given, every `kind` must be one of its types. */
export function validate(formDefinition, ruleSetDocument, { functions = {}, types = null } = {}) {
	const errors = [];
	const warnings = [];
	const fail = (code, message, path) => errors.push({ code, message, path });
	const warn = (code, message, path) => warnings.push({ code, message, path });
	const rawForm = unwrap(formDefinition);
	const form = normalizeForm(formDefinition);
	const ruleSet = normalizeRuleSet(ruleSetDocument);
	const ruleSetVariables = ruleSet.variables ?? {};
	const calculatedFields = new Map();

	/* The form */
	if (!form.steps.length) fail('form-steps', 'The form has no steps (structure.layout entries of type "step")', 'structure.layout');
	const stepIds = new Set();
	form.steps.forEach((step, index) => {
		if (stepIds.has(step.id)) fail('duplicate', `Step id "${step.id}" is used twice`, `structure.layout[${index}]`);
		stepIds.add(step.id);
	});
	const placed = new Map();
	form.steps.forEach(step => step.fields.forEach(id => {
		if (!rawForm.properties?.[id]) fail('field', `Step "${step.id}" lists "${id}", which is not in properties`, `structure.layout.${step.id}`);
		if (placed.has(id)) fail('duplicate', `Field "${id}" is in steps "${placed.get(id)}" and "${step.id}"`, `structure.layout.${step.id}`);
		placed.set(id, step.id);
	}));
	const slotIds = new Set();
	form.steps.forEach(step => step.slots.forEach(slot => {
		if (slotIds.has(slot)) fail('duplicate', `Slot "${slot}" is declared twice`, `structure.layout.${step.id}`);
		slotIds.add(slot);
	}));
	for (const [id, property] of Object.entries(rawForm.properties ?? {})) {
		if (property?.track !== undefined && (property.track !== true || property.type !== 'select')) fail('track', `Field "${id}" can only send its value to analytics as a choice field (select), with "track": true`, `properties.${id}.track`);
		else if (property?.track && ['personal', 'special'].includes(property.privacy)) fail('track', `Field "${id}" is ${property.privacy} data, so its value may not be sent to analytics`, `properties.${id}.track`);
		const at = `properties.${id}`;
		if (!PROPERTY_TYPES.includes(property?.type)) fail('type', `Field "${id}" has the type "${property?.type}"; use one of ${PROPERTY_TYPES.join(', ')}`, `${at}.type`);
		if (property?.kind !== undefined && types && !types.kinds[property.kind]) fail('kind', `Field "${id}" is a "${property.kind}", which no installed type package provides`, `${at}.kind`);
		if (property?.from !== undefined && !(typeof property.from === 'string' && PREFILL_ROOTS.includes(property.from.split('.')[0]) && property.from.includes('.'))) fail('from', `Field "${id}" can only take its value from context.*, facts.* or vars.*`, `${at}.from`);
		if (typeof property?.from === 'string' && property.from.startsWith('vars.')) {
			const name = property.from.slice(5);
			if (!Object.hasOwn(ruleSetVariables, name)) fail('variable', `Field "${id}" shows "${property.from}", which the rule set does not declare`, `${at}.from`);
			if (property.required) fail('calculated', `"${id}" is calculated, so it cannot be required`, `${at}.required`);
			if (property.type === 'content' || property.type === 'file') fail('calculated', `A ${property.type === 'file' ? 'file field' : 'text block'} cannot be calculated`, `${at}.type`);
			calculatedFields.set(id, `vars.${name}`);
		} else if (property?.ui?.widget === 'output') fail('calculated', `Calculated field "${id}" needs the variable it shows ("from": "vars.<name>")`, `${at}.from`);
		if (property?.type === 'content') {
			if (property.required) fail('content', `"${id}" is a text block, so it cannot be required`, `${at}.required`);
			if (property.validation) fail('content', `"${id}" is a text block, so it has nothing to validate`, `${at}.validation`);
		}
		if (property?.ui?.widget === 'consent') {
			if (property.type !== 'boolean') fail('consent', `Consent field "${id}" must be a boolean`, `${at}.type`);
			if (typeof property.consent?.text !== 'string' || !property.consent.text.trim()) fail('consent', `Consent field "${id}" needs the wording the person agrees to (consent.text)`, `${at}.consent.text`);
		}
		if (property?.options?.source !== undefined) {
			const source = property.options.source;
			if (typeof source !== 'string' || !normalizeRuleSet(ruleSetDocument).services[source]) fail('service', `Field "${id}" takes its choices from unknown service "${source}"`, `${at}.options.source`);
			if (property.type !== 'select' && property.type !== 'string') fail('options', `Field "${id}" takes its choices from a service, so it must be a choice field (select) or text with suggestions (string)`, `${at}.type`);
			if (property.options.choices) warn('options', `Field "${id}" has both choices and a source; the source is ignored`, `${at}.options`);
		}
		if (property?.type === 'list') {
			const items = property.items?.properties;
			if (!items || typeof items !== 'object' || !Object.keys(items).length) fail('list', `Repeating group "${id}" needs the fields of a row (items.properties)`, `${at}.items`);
			else for (const [key, item] of Object.entries(items)) {
				if (!/^[A-Za-z][\w]*$/.test(key)) fail('list', `Row field "${key}" in "${id}" must be a plain identifier`, `${at}.items.properties.${key}`);
				if (!ITEM_TYPES.includes(item?.type)) fail('list', `Row field "${key}" in "${id}" has the type "${item?.type}"; use one of ${ITEM_TYPES.join(', ')}`, `${at}.items.properties.${key}.type`);
				[].concat(item?.validation?.check ?? []).forEach(name => {
					if (typeof functions[name] !== 'function') fail('function', `Row field "${key}" in "${id}" uses the check "${name}", which no function provides`, `${at}.items.properties.${key}.validation.check`);
				});
			}
			const { minItems, maxItems } = property.validation ?? {};
			if (minItems !== undefined && !(Number.isInteger(minItems) && minItems >= 0)) fail('list', `minItems of "${id}" must be a whole number`, `${at}.validation.minItems`);
			if (maxItems !== undefined && !(Number.isInteger(maxItems) && maxItems >= 1)) fail('list', `maxItems of "${id}" must be a whole number above 0`, `${at}.validation.maxItems`);
			if (Number.isInteger(minItems) && Number.isInteger(maxItems) && minItems > maxItems) fail('list', `"${id}" asks for more rows than it allows`, `${at}.validation`);
		}
		if (property?.type === 'file' && property.default !== undefined) fail('file', `File field "${id}" cannot have a default`, `${at}.default`);
		[].concat(property?.validation?.check ?? []).forEach(name => {
			if (typeof functions[name] !== 'function') fail('function', `Field "${id}" uses the check "${name}", which no function provides`, `properties.${id}.validation.check`);
		});
	}

	/* Conditions of text cases, checked with the rules' conditions below. */
	const caseConditions = [];
	/* Placeholders in texts ({values.x}, {vars.x}) must read a field or a declared variable. */
	const checkPlaceholders = (text, at) => placeholdersOf(text).forEach(path => {
		const [root, name] = path.split('.');
		/* {values.x.note} reads the note of the choice made in x. */
		const noteOf = path.endsWith('.note') ? path.slice(7, -5) : null;
		if (root === 'values' && noteOf && !form.fields.has(path.slice(7))) {
			if (!form.fields.get(noteOf)?.choices) fail('placeholder', `"{${path}}" reads the note of "${noteOf}", which is not a field with choices`, at);
		} else if (root === 'values' && !form.fields.has(path.slice(7))) fail('placeholder', `"{${path}}" reads unknown field "${path.slice(7)}"`, at);
		if (root === 'vars' && !Object.hasOwn(ruleSetVariables, name)) fail('placeholder', `"{${path}}" reads undeclared variable "${name}"`, at);
	});
	for (const [id, property] of Object.entries(rawForm.properties ?? {})) {
		['title', 'description', 'content'].forEach(key => checkPlaceholders(property?.[key], `properties.${id}.${key}`));
		Object.entries(property?.validation?.messages ?? {}).forEach(([code, text]) => checkPlaceholders(text, `properties.${id}.validation.messages.${code}`));
		(property?.options?.choices ?? []).forEach((choice, i) => {
			if (choice?.note === undefined) return;
			if (typeof choice.note !== 'string') fail('note', `The note on choice "${choice.value}" of "${id}" must be text`, `properties.${id}.options.choices[${i}].note`);
			else checkPlaceholders(choice.note, `properties.${id}.options.choices[${i}].note`);
		});
		if (property?.cases !== undefined || property?.show !== undefined) {
			if (property.type !== 'content') fail('cases', `Only a text block can have cases; "${id}" is a ${property.type}`, `properties.${id}.cases`);
			if (!Array.isArray(property.cases)) fail('cases', `The cases of "${id}" must be a list`, `properties.${id}.cases`);
			if (property.show !== undefined && !['all', 'first'].includes(property.show)) fail('cases', `"show" of "${id}" must be "all" or "first"`, `properties.${id}.show`);
			(Array.isArray(property.cases) ? property.cases : []).forEach((entry, i) => {
				const at = `properties.${id}.cases[${i}]`;
				if (typeof entry?.content !== 'string') fail('cases', `Case ${i + 1} of "${id}" needs its text (content)`, `${at}.content`);
				else checkPlaceholders(entry.content, `${at}.content`);
				if (entry?.when === undefined || entry.when === null || (typeof entry.when !== 'string' && typeof entry.when !== 'object')) fail('cases', `Case ${i + 1} of "${id}" needs a condition (when): a named condition or JSON Logic`, `${at}.when`);
				else caseConditions.push({ when: conditionOf(entry.when), at: `${at}.when` });
			});
		}
	}
	ruleSet.rules.forEach((rule, index) => ['then', 'else'].forEach(branch => (rule?.[branch] ?? []).forEach((action, i) => {
		if (action?.invalid) checkPlaceholders(action.invalid.message, `rules[${index}].${branch}[${i}].invalid.message`);
	})));

	/* The rule set */
	const formId = form.id;
	if (ruleSet.form && formId && ruleSet.form !== formId) fail('target', `Rule set is for form "${ruleSet.form}", not "${formId}"`, 'form');

	for (const [name, service] of Object.entries(ruleSet.services)) {
		if (typeof service?.url !== 'string') fail('service', `Service "${name}" needs a url`, `services.${name}`);
		if (service?.method && !['GET', 'POST'].includes(service.method)) fail('service', `Service "${name}" method must be GET or POST`, `services.${name}.method`);
		(service?.send ?? []).forEach(id => {
			if (!form.fields.has(id)) fail('field', `Service "${name}" sends unknown field "${id}"`, `services.${name}.send`);
			/* Answers that leave the site: special-category ones only to a service named as a processor, personal ones with a warning. */
			const privacy = rawForm.properties?.[id]?.privacy ?? 'none';
			if (privacy === 'special' && service.processor !== true) fail('privacy', `Service "${name}" sends "${id}", which is special-category data; mark the service "processor": true if it may receive it`, `services.${name}.send`);
			else if (privacy === 'personal' && service.processor !== true) warn('privacy', `Service "${name}" receives personal data ("${id}"); mark it "processor": true once it is covered by a data processing agreement`, `services.${name}.send`);
		});
		if (service?.fields !== undefined && !(Array.isArray(service.fields) && service.fields.every(kind => typeof kind === 'string'))) fail('service', `Service "${name}" fields must be a list of field types or widgets`, `services.${name}.fields`);
	}

	ruleSet.listen.forEach((listener, index) => {
		const path = `listen[${index}]`;
		if (typeof listener?.type !== 'string') fail('listener', 'A listener needs an event type', path);
		const kinds = ['set', 'replace', 'patch'].filter(key => listener?.[key]);
		if (kinds.length !== 1) fail('listener', 'A listener needs exactly one of set, replace or patch', path);
		if (listener?.set && !String(listener.set).startsWith('facts.')) fail('listener', '"set" may only write under facts.', path);
		if (listener?.patch && !slotIds.has(listener.patch.into)) fail('slot', `Unknown slot "${listener.patch.into}"`, `${path}.patch.into`);
	});

	/* Context keys: where each may come from when a server re-checks a submit (page or server). */
	for (const [key, entry] of Object.entries(ruleSet.context ?? {})) {
		if (!/^[A-Za-z_][\w]*$/.test(key)) fail('context', `Context key "${key}" must be a plain identifier`, `context.${key}`);
		if (!entry || typeof entry !== 'object' || !CONTEXT_SOURCES.includes(entry.from ?? 'page')) fail('context', `Context key "${key}" must come "from" one of: ${CONTEXT_SOURCES.join(', ')}`, `context.${key}`);
	}

	/* Variables: computed from an expression, or written by rules (set / add) from an initial value. */
	const variables = ruleSet.variables ?? {};
	const varReads = (logic, at) => {
		const found = new Set();
		readsOf(logic).forEach(variable => {
			const [root, ...rest] = variable.split('.');
			if (root === 'vars') {
				if (!Object.hasOwn(variables, rest[0])) fail('variable', `"${variable}" is not a declared variable`, at);
				found.add(`vars.${rest[0]}`);
			} else if (root === 'values') found.add(rest.join('.'));
		});
		return found;
	};
	const computedReads = new Map();
	for (const [name, definition] of Object.entries(variables)) {
		const at = `variables.${name}`;
		if (!/^[A-Za-z_][\w]*$/.test(name)) fail('variable', `Variable name "${name}" must be a plain identifier`, at);
		if (definition && 'compute' in definition) {
			if ('initial' in definition) fail('variable', `"${name}" is computed, so it cannot have an initial value`, at);
			operatorsOf(definition.compute).forEach(op => { if (!OPERATORS.includes(op) && typeof functions[op] !== 'function') fail('operator', `Unknown operator "${op}"`, at); });
			computedReads.set(`vars.${name}`, varReads(definition.compute, at));
		}
	}

	const ruleIds = new Set();
	const writes = new Map();
	const reads = new Map();
	const assignedFields = new Set();

	/* showWhen on fields and steps runs as rules; they are checked as rules, at the place they were written. */
	[...ruleSet.rules, ...implicitRules(form)].forEach((rule, index) => {
		const path = rule?.at ?? `rules[${index}]`;
		const whenAt = rule?.at ?? `${path}.when`;
		if (typeof rule?.id !== 'string' || !rule.id) {
			fail('rule-id', 'Every rule needs an id', path);
			return;
		}
		if (ruleIds.has(rule.id)) fail('duplicate', `Rule id "${rule.id}" is used twice`, path);
		ruleIds.add(rule.id);
		if (rule.priority !== undefined && !Number.isFinite(rule.priority)) fail('priority', 'Priority must be a number', `${path}.priority`);
		if (rule.track !== undefined && typeof rule.track !== 'boolean') fail('track', 'Track must be true or false', `${path}.track`);

		/* Conditions */
		operatorsOf(rule.when ?? true).forEach(op => {
			if (op === '==' || op === '!=') fail('operator', `"${op}" coerces types; use "${op}="`, whenAt);
			else if (!OPERATORS.includes(op) && typeof functions[op] !== 'function') fail('operator', `Unknown operator "${op}"`, whenAt);
		});
		checksOf(rule.when ?? true).forEach(name => {
			if (typeof name !== 'string' || typeof functions[name] !== 'function') fail('function', `"check" uses "${name}", which no function provides`, whenAt);
		});
		const fieldReads = new Set();
		/* A row rule runs once per row of a repeating group: it reads row.* and index, and acts on that row's fields. */
		const list = rule.forEach;
		const isRowRule = list !== undefined;
		const items = isRowRule ? form.fields.get(list)?.property?.items?.properties : null;
		if (isRowRule && (typeof list !== 'string' || form.fields.get(list)?.property?.type !== 'list')) fail('row-rule', `"forEach" must name a repeating group; "${list}" is not one`, `${path}.forEach`);
		const rowReads = new Set();
		readsOf(rule.when ?? true).forEach(variable => {
			const [root, ...rest] = variable.split('.');
			if (isRowRule && (root === 'row' || root === 'index')) {
				if (root === 'row' && items && !Object.hasOwn(items, rest[0])) fail('field', `Condition reads "${variable}", but "${list}" has no row field "${rest[0]}"`, whenAt);
				if (root === 'row') rowReads.add(rest[0]);
				return;
			}
			if (!INPUT_ROOTS.includes(root)) {
				fail('variable', `"${variable}" must start with ${INPUT_ROOTS.join(', ')}`, whenAt);
				return;
			}
			if (root === 'values') {
				const field = rest.join('.');
				if (!form.fields.has(field)) fail('field', `Condition reads unknown field "${field}"`, whenAt);
				fieldReads.add(field);
			}
			if (root === 'vars') {
				if (!Object.hasOwn(variables, rest[0])) fail('variable', `"${variable}" is not a declared variable`, whenAt);
				fieldReads.add(`vars.${rest[0]}`);
			}
		});
		reads.set(rule.id, fieldReads);

		/* Actions */
		const ruleWrites = new Set();
		['then', 'else'].forEach(branch => (rule[branch] ?? []).forEach((action, i) => {
			const at = `${path}.${branch}[${i}]`;
			const name = actionName(action);
			if (!ACTIONS.includes(name)) {
				fail('action', `Unknown action "${name ?? JSON.stringify(action)}"`, at);
				return;
			}
			const value = action[name];
			const { fields, steps } = actionTargets(action);
			if (isRowRule) {
				if (!ROW_ACTIONS.has(name)) {
					fail('row-rule', `A rule for each row can only show, hide, enable, disable, require, make optional, set, clear or mark the row's own fields; not "${name}"`, at);
					return;
				}
				fields.forEach(target => {
					const item = rowTarget(list, target);
					if (!item || !items || !Object.hasOwn(items, item)) fail('field', `Action targets "${target}"; a rule for each row of "${list}" targets "${list}.<row field>"`, at);
					else if (rowReads.has(item) && (CELL_HIDING.has(name) || name === 'setValue' || name === 'clear')) fail('cycle', `Rule "${rule.id}" reads row.${item} and also changes it`, at);
					else if (fieldReads.has(list) && CELL_HIDING.has(name)) fail('cycle', `Rule "${rule.id}" reads values.${list} and also hides or disables its row fields`, at);
				});
				if (name === 'invalid' && typeof value?.message !== 'string') fail('invalid', 'invalid needs a message', at);
				return;
			}
			fields.forEach(id => {
				if (!form.fields.has(id)) fail('field', `Action targets unknown field "${id}"`, at);
				else if (VISIBILITY.has(name)) ruleWrites.add(id);
			});
			steps.forEach(id => {
				if (!stepIds.has(id)) fail('step', `Action targets unknown step "${id}"`, at);
				else form.steps.find(step => step.id === id).fields.forEach(field => ruleWrites.add(field));
			});
			if (name === 'setValue' || name === 'clear') fields.forEach(id => {
				assignedFields.add(id);
				if (calculatedFields.has(id)) fail('calculated', `${name} cannot target "${id}": it is calculated from ${calculatedFields.get(id)}`, at);
			});
			if (['setValue', 'clear', 'require'].includes(name)) fields.forEach(id => {
				const type = form.fields.get(id)?.property?.type;
				if (type === 'content' || (type === 'file' && name === 'setValue')) fail('action', `${name} cannot target "${id}", a ${type === 'content' ? 'text block' : 'file field'}`, at);
			});
			if (name === 'options') {
				const choices = form.fields.get(value?.field)?.choices;
				const sourced = typeof form.fields.get(value?.field)?.property?.options?.source === 'string';
				if (form.fields.has(value?.field) && !choices && !sourced) fail('options', `Field "${value.field}" has no choices to narrow`, at);
				[...(value?.only ?? []), ...(value?.exclude ?? [])].forEach(option => {
					if (choices && !choices.includes(option)) fail('options', `"${option}" is not a choice of "${value.field}"`, at);
				});
			}
			if (name === 'fetch') {
				if (!ruleSet.services[value?.service]) fail('service', `Unknown service "${value?.service}"`, at);
				if (value?.into && !slotIds.has(value.into)) fail('slot', `Unknown slot "${value.into}"`, at);
				if (value?.after && !stepIds.has(value.after)) fail('step', `Unknown step "${value.after}"`, at);
			}
			if (name === 'goto') {
				const goto = gotoOf(action);
				const from = gotoFrom(form.steps, rule, action);
				const order = form.steps.map(step => step.id);
				if (!stepIds.has(goto?.step)) fail('step', `goto targets unknown step "${goto?.step}"`, at);
				else if (!from) fail('goto', 'This rule reads no field, so goto needs "from": the step to jump from', at);
				else if (!stepIds.has(from)) fail('step', `goto jumps from unknown step "${from}"`, at);
				else if (order.indexOf(goto.step) <= order.indexOf(from)) fail('goto', `goto may only jump forward: "${goto.step}" is not after "${from}"`, at);
				else form.steps.slice(order.indexOf(from) + 1, order.indexOf(goto.step)).forEach(step => step.fields.forEach(field => ruleWrites.add(field)));
			}
			if (VARIABLE_ACTIONS.includes(name)) {
				const definition = variables[value?.var];
				if (!definition) fail('variable', `${name} writes undeclared variable "${value?.var}"`, at);
				else if ('compute' in definition) fail('variable', `"${value.var}" is computed; rules cannot ${name} it`, at);
				else if (name === 'add' && definition.type && definition.type !== 'number') fail('variable', `add needs a number variable; "${value.var}" is ${definition.type}`, at);
				else ruleWrites.add(`vars.${value.var}`);
				varReads(value?.value ?? null, at).forEach(read => fieldReads.add(read));
			}
			if (name === 'invalid' && typeof value?.message !== 'string') fail('invalid', 'invalid needs a message', at);
			if (name === 'emit') {
				if (typeof value?.type !== 'string') fail('emit', 'emit needs an event type', at);
				if (value?.on && !['enter', 'leave'].includes(value.on)) fail('emit', '"on" must be "enter" or "leave"', at);
			}
		}));
		writes.set(rule.id, ruleWrites);
	});

	/* A text case reads like a condition, but changes nothing, so it can take part in no loop. */
	caseConditions.forEach(({ when, at }) => {
		operatorsOf(when).forEach(op => {
			if (op === '==' || op === '!=') fail('operator', `"${op}" coerces types; use "${op}="`, at);
			else if (!OPERATORS.includes(op) && typeof functions[op] !== 'function') fail('operator', `Unknown operator "${op}"`, at);
		});
		readsOf(when).forEach(variable => {
			const [root, ...rest] = variable.split('.');
			if (!INPUT_ROOTS.includes(root)) fail('variable', `"${variable}" must start with ${INPUT_ROOTS.join(', ')}`, at);
			else if (root === 'values' && !form.fields.has(rest.join('.'))) fail('field', `Condition reads unknown field "${rest.join('.')}"`, at);
			else if (root === 'vars' && !Object.hasOwn(variables, rest[0])) fail('variable', `"${variable}" is not a declared named condition or variable`, at);
		});
	});

	/* A field set by setValue must not steer any rule, or a rule could change its own input. */
	reads.forEach((fields, ruleId) => fields.forEach(field => {
		if (assignedFields.has(field)) fail('cycle', `Rule "${ruleId}" reads "${field}", which another rule sets with setValue or clear`, 'rules');
	}));

	/* Visibility cycles: rule A hides a field rule B reads, and B hides one A reads. */
	const fieldGraph = new Map();
	reads.forEach((readFields, ruleId) => readFields.forEach(from => {
		if (!fieldGraph.has(from)) fieldGraph.set(from, new Set());
		writes.get(ruleId).forEach(to => fieldGraph.get(from).add(to));
	}));
	calculatedFields.forEach((variable, id) => computedReads.set(id, new Set([variable])));
	computedReads.forEach((readNodes, node) => readNodes.forEach(from => {
		if (!fieldGraph.has(from)) fieldGraph.set(from, new Set());
		fieldGraph.get(from).add(node);
	}));
	const state = new Map();
	const visit = (node, trail) => {
		if (state.get(node) === 'done') return;
		if (state.get(node) === 'active') {
			fail('cycle', `Fields depend on each other in a loop: ${[...trail.slice(trail.indexOf(node)), node].join(' → ')}`, 'rules');
			return;
		}
		state.set(node, 'active');
		(fieldGraph.get(node) ?? []).forEach(next => visit(next, [...trail, node]));
		state.set(node, 'done');
	};
	[...fieldGraph.keys()].forEach(node => visit(node, []));

	return { valid: errors.length === 0, errors, warnings };
}
