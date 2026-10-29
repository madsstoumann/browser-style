/**
 * The closed list of actions a rule can take. An action is an object with one key:
 * { "show": "plan" }, { "hide": ["a", "b"] }, { "options": { "field": "plan", "only": [ … ] } }, …
 */

import { readsOf } from './logic.js';

const list = value => (Array.isArray(value) ? value : [value]).filter(item => typeof item === 'string');

/* Field flags: the action name, the flag it sets and the value it sets it to. */
export const FLAG_ACTIONS = {
	show: ['visible', true],
	hide: ['visible', false],
	enable: ['enabled', true],
	disable: ['enabled', false],
	require: ['required', true],
	optional: ['required', false]
};

/* When two rules of equal priority disagree on a flag, this value wins. */
export const RESTRICTIVE = { visible: false, enabled: false, required: true };

export const STEP_ACTIONS = { skip: false, include: true };

/* Actions on variables: { "add": { "var": "score", "value": 10 } }, { "set": { "var": "tier", "value": "A" } }. */
export const VARIABLE_ACTIONS = ['add', 'set'];

export const ACTIONS = Object.freeze([...Object.keys(FLAG_ACTIONS), 'setValue', 'clear', 'options', ...Object.keys(STEP_ACTIONS), 'goto', ...VARIABLE_ACTIONS, 'invalid', 'fetch', 'emit']);

/* What a rule for each row ("forEach") may do: only the row's own fields, written "list.item". */
export const ROW_ACTIONS = new Set([...Object.keys(FLAG_ACTIONS), 'setValue', 'clear', 'invalid']);
export const rowTarget = (list, target) => (typeof target === 'string' && target.startsWith(`${list}.`) ? target.slice(list.length + 1) : null);

/* What a patch rule may do to a field or step that belongs to the base form: only narrow it. */
export const NARROWING = new Set(['hide', 'disable', 'require', 'options', 'skip', 'goto', 'invalid', 'emit', 'fetch']);

export function actionName(action) {
	if (!action || typeof action !== 'object' || Array.isArray(action)) return null;
	const keys = Object.keys(action);
	return keys.length === 1 ? keys[0] : null;
}

/* A goto as { step, from }: { "goto": "review" } or { "goto": { "step": "review", "from": "where" } }. */
export function gotoOf(action) {
	const value = action?.goto;
	if (typeof value === 'string') return { step: value, from: null };
	if (value && typeof value === 'object') return { step: value.step ?? null, from: value.from ?? null };
	return null;
}

/* The step a goto jumps from: its own "from", else the step of the last field the rule reads. */
export function gotoFrom(steps, rule, action) {
	const goto = gotoOf(action);
	if (goto?.from) return goto.from;
	const read = new Set([...readsOf(rule.when ?? true)].filter(path => path.startsWith('values.')).map(path => path.slice(7)));
	let from = null;
	for (const step of steps) if (step.fields.some(id => read.has(id) || [...read].some(path => path.startsWith(`${id}.`)))) from = step.id;
	return from;
}

/* The fields and steps an action writes to. */
export function actionTargets(action) {
	const name = actionName(action);
	const value = name ? action[name] : undefined;
	if (name in FLAG_ACTIONS || name === 'clear') return { name, fields: list(value), steps: [] };
	if (name === 'setValue' || name === 'options' || name === 'invalid') return { name, fields: list(value?.field), steps: [] };
	if (name in STEP_ACTIONS) return { name, fields: [], steps: list(value) };
	return { name, fields: [], steps: [] };
}

/* Returns a copy of an action with every field and step id passed through `rename`. */
export function renameTargets(action, renameField, renameStep = id => id) {
	const name = actionName(action);
	if (!name) return action;
	const value = action[name];
	const map = (input, fn) => (Array.isArray(input) ? input.map(fn) : fn(input));
	if (name in FLAG_ACTIONS || name === 'clear') return { [name]: map(value, renameField) };
	if (name === 'setValue' || name === 'options' || name === 'invalid') return { [name]: { ...value, field: renameField(value.field) } };
	if (name in STEP_ACTIONS) return { [name]: map(value, renameStep) };
	if (name === 'goto') {
		const { step, from } = gotoOf(action);
		return { goto: from ? { step: renameStep(step), from: renameStep(from) } : renameStep(step) };
	}
	if (name === 'fetch') return { [name]: { ...value, ...(value.after ? { after: renameStep(value.after) } : {}) } };
	return action;
}
