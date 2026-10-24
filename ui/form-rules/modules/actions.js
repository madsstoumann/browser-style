/**
 * The closed list of actions a rule can take. An action is an object with one key:
 * { "show": "plan" }, { "hide": ["a", "b"] }, { "options": { "field": "plan", "only": [ … ] } }, …
 */

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

export const ACTIONS = Object.freeze([...Object.keys(FLAG_ACTIONS), 'setValue', 'clear', 'options', ...Object.keys(STEP_ACTIONS), 'fetch', 'emit']);

/* What a patch rule may do to a field or step that belongs to the base form: only narrow it. */
export const NARROWING = new Set(['hide', 'disable', 'require', 'options', 'skip', 'emit', 'fetch']);

export function actionName(action) {
	if (!action || typeof action !== 'object' || Array.isArray(action)) return null;
	const keys = Object.keys(action);
	return keys.length === 1 ? keys[0] : null;
}

/* The fields and steps an action writes to. */
export function actionTargets(action) {
	const name = actionName(action);
	const value = name ? action[name] : undefined;
	if (name in FLAG_ACTIONS || name === 'clear') return { name, fields: list(value), steps: [] };
	if (name === 'setValue' || name === 'options') return { name, fields: list(value?.field), steps: [] };
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
	if (name === 'setValue' || name === 'options') return { [name]: { ...value, field: renameField(value.field) } };
	if (name in STEP_ACTIONS) return { [name]: map(value, renameStep) };
	if (name === 'fetch') return { [name]: { ...value, send: value.send?.map(renameField) } };
	return action;
}
