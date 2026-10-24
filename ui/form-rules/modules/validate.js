/**
 * validate(form, ruleSet) → { valid, errors: [{ code, message, path }] }
 *
 * Checks a form definition and its rule set together, before anything runs:
 * unknown fields, steps, slots, services, operators and actions, duplicate ids,
 * option values that do not exist, and cycles between rules.
 */

import { operatorsOf, readsOf, OPERATORS } from './logic.js';
import { actionName, actionTargets, ACTIONS, gotoFrom, gotoOf, VARIABLE_ACTIONS } from './actions.js';
import { normalizeForm, normalizeRuleSet, unwrap } from './form.js';

const INPUT_ROOTS = ['values', 'context', 'facts', 'step', 'today', 'vars', 'services'];
/* Only these change what a condition can read, since hidden values read as absent. */
const VISIBILITY = new Set(['show', 'hide', 'skip', 'include']);

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

export function validate(formDefinition, ruleSetDocument, { functions = {} } = {}) {
	const errors = [];
	const fail = (code, message, path) => errors.push({ code, message, path });
	const rawForm = unwrap(formDefinition);
	const form = normalizeForm(formDefinition);
	const ruleSet = normalizeRuleSet(ruleSetDocument);

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
		[].concat(property?.validation?.check ?? []).forEach(name => {
			if (typeof functions[name] !== 'function') fail('function', `Field "${id}" uses the check "${name}", which no function provides`, `properties.${id}.validation.check`);
		});
	}

	/* The rule set */
	const formId = form.id;
	if (ruleSet.form && formId && ruleSet.form !== formId) fail('target', `Rule set is for form "${ruleSet.form}", not "${formId}"`, 'form');

	for (const [name, service] of Object.entries(ruleSet.services)) {
		if (typeof service?.url !== 'string') fail('service', `Service "${name}" needs a url`, `services.${name}`);
		if (service?.method && !['GET', 'POST'].includes(service.method)) fail('service', `Service "${name}" method must be GET or POST`, `services.${name}.method`);
		(service?.send ?? []).forEach(id => {
			if (!form.fields.has(id)) fail('field', `Service "${name}" sends unknown field "${id}"`, `services.${name}.send`);
		});
	}

	ruleSet.listen.forEach((listener, index) => {
		const path = `listen[${index}]`;
		if (typeof listener?.type !== 'string') fail('listener', 'A listener needs an event type', path);
		const kinds = ['set', 'replace', 'patch'].filter(key => listener?.[key]);
		if (kinds.length !== 1) fail('listener', 'A listener needs exactly one of set, replace or patch', path);
		if (listener?.set && !String(listener.set).startsWith('facts.')) fail('listener', '"set" may only write under facts.', path);
		if (listener?.patch && !slotIds.has(listener.patch.into)) fail('slot', `Unknown slot "${listener.patch.into}"`, `${path}.patch.into`);
	});

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

	ruleSet.rules.forEach((rule, index) => {
		const path = `rules[${index}]`;
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
			if (op === '==' || op === '!=') fail('operator', `"${op}" coerces types; use "${op}="`, `${path}.when`);
			else if (!OPERATORS.includes(op) && typeof functions[op] !== 'function') fail('operator', `Unknown operator "${op}"`, `${path}.when`);
		});
		checksOf(rule.when ?? true).forEach(name => {
			if (typeof name !== 'string' || typeof functions[name] !== 'function') fail('function', `"check" uses "${name}", which no function provides`, `${path}.when`);
		});
		const fieldReads = new Set();
		readsOf(rule.when ?? true).forEach(variable => {
			const [root, ...rest] = variable.split('.');
			if (!INPUT_ROOTS.includes(root)) {
				fail('variable', `"${variable}" must start with ${INPUT_ROOTS.join(', ')}`, `${path}.when`);
				return;
			}
			if (root === 'values') {
				const field = rest.join('.');
				if (!form.fields.has(field)) fail('field', `Condition reads unknown field "${field}"`, `${path}.when`);
				fieldReads.add(field);
			}
			if (root === 'vars') {
				if (!Object.hasOwn(variables, rest[0])) fail('variable', `"${variable}" is not a declared variable`, `${path}.when`);
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
			fields.forEach(id => {
				if (!form.fields.has(id)) fail('field', `Action targets unknown field "${id}"`, at);
				else if (VISIBILITY.has(name)) ruleWrites.add(id);
			});
			steps.forEach(id => {
				if (!stepIds.has(id)) fail('step', `Action targets unknown step "${id}"`, at);
				else form.steps.find(step => step.id === id).fields.forEach(field => ruleWrites.add(field));
			});
			if (name === 'setValue' || name === 'clear') fields.forEach(id => assignedFields.add(id));
			if (name === 'options') {
				const choices = form.fields.get(value?.field)?.choices;
				if (form.fields.has(value?.field) && !choices) fail('options', `Field "${value.field}" has no choices to narrow`, at);
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

	return { valid: errors.length === 0, errors };
}
