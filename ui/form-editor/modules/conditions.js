/**
 * Converts between a rule's JSON Logic condition and the editor's row tree, and writes
 * plain-language summaries of rules. A condition the builder cannot draw stays as a raw block.
 *
 * Tree nodes:
 *   { kind: 'group', mode: 'and' | 'or', items: [ … ], wrapped? }
 *   { kind: 'cond', path, num, op, value }     op: === !== > >= < <= in notin filled empty
 *   { kind: 'raw', logic }
 */
import { isRule } from '../../form-rules/modules/logic.js';
import { actionName } from '../../form-rules/modules/actions.js';

export const COMPARE = ['===', '!==', '>', '>=', '<', '<='];
export const OPERATOR_WORDS = {
	'===': 'is', '!==': 'is not', '>': 'is above', '>=': 'is at least', '<': 'is below', '<=': 'is at most',
	in: 'is one of', notin: 'is not one of', filled: 'is filled in', empty: 'is empty'
};

const varPath = node => {
	if (!isRule(node) || !('var' in node)) return null;
	const args = node.var;
	if (typeof args === 'string') return args;
	if (Array.isArray(args) && args.length === 1 && typeof args[0] === 'string') return args[0];
	return null;
};

/* A read of a variable, optionally converted with num: { path, num } or null. */
const readOf = node => {
	const path = varPath(node);
	if (path) return { path, num: false };
	if (isRule(node) && 'num' in node) {
		const inner = Array.isArray(node.num) ? node.num[0] : node.num;
		const innerPath = varPath(inner);
		if (innerPath) return { path: innerPath, num: true };
	}
	return null;
};

const isLiteral = value => value === null || ['string', 'number', 'boolean'].includes(typeof value);

function parseNode(logic) {
	if (logic === true || logic === undefined) return { kind: 'group', mode: 'and', items: [] };
	if (!isRule(logic)) return { kind: 'raw', logic };
	const [op] = Object.keys(logic);
	const args = Array.isArray(logic[op]) ? logic[op] : [logic[op]];

	if (op === 'and' || op === 'or') return { kind: 'group', mode: op, items: args.map(parseNode) };
	if ((op === '!!' || op === '!') && args.length === 1) {
		const read = readOf(args[0]);
		if (read && !read.num) return { kind: 'cond', path: read.path, num: false, op: op === '!!' ? 'filled' : 'empty', value: null };
		const inner = op === '!' && parseNode(args[0]);
		if (inner?.kind === 'cond' && inner.op === 'in') return { ...inner, op: 'notin' };
	}
	if (COMPARE.includes(op) && args.length === 2) {
		const read = readOf(args[0]);
		if (read && isLiteral(args[1])) return { kind: 'cond', ...read, op, value: args[1] };
	}
	if (op === 'in' && args.length === 2) {
		const read = readOf(args[0]);
		if (read && Array.isArray(args[1]) && args[1].every(isLiteral)) return { kind: 'cond', ...read, op: 'in', value: args[1] };
	}
	return { kind: 'raw', logic };
}

/* The tree is always a group at the top; a bare condition is wrapped and unwrapped again. */
export function parseCondition(logic) {
	const node = parseNode(logic);
	return node.kind === 'group' ? node : { kind: 'group', mode: 'and', items: [node], wrapped: true };
}

function serializeNode(node) {
	if (node.kind === 'raw') return node.logic;
	if (node.kind === 'group') return { [node.mode]: node.items.map(serializeNode) };
	const read = node.num ? { num: { var: node.path } } : { var: node.path };
	if (node.op === 'filled') return { '!!': { var: node.path } };
	if (node.op === 'empty') return { '!': { var: node.path } };
	if (node.op === 'in') return { in: [read, node.value ?? []] };
	if (node.op === 'notin') return { '!': { in: [read, node.value ?? []] } };
	return { [node.op]: [read, node.value ?? null] };
}

export function serializeCondition(tree) {
	if (tree.wrapped && tree.items.length === 1 && tree.mode === 'and') return serializeNode(tree.items[0]);
	return serializeNode(tree);
}

/* === Plain language === */

const propertyOf = (form, path) => (path.startsWith('values.') ? form.fields.properties?.[path.slice(7)] : null);

export function pathLabel(form, path) {
	const property = propertyOf(form, path);
	if (property) return property.title ?? path.slice(7);
	const [root, ...rest] = path.split('.');
	return `${root} ${rest.join('.')}`.trim();
}

export function valueLabel(form, path, value) {
	if (Array.isArray(value)) return value.map(item => valueLabel(form, path, item)).join(', ');
	const choice = propertyOf(form, path)?.options?.choices?.find(c => c.value === value);
	if (choice) return choice.label;
	if (value === true) return 'yes';
	if (value === false) return 'no';
	return value === null || value === '' ? '(nothing)' : String(value);
}

function conditionText(form, node, nested = false) {
	if (node.kind === 'raw') return 'a custom condition';
	if (node.kind === 'group') {
		if (!node.items.length) return 'always';
		const text = node.items.map(item => conditionText(form, item, true)).join(node.mode === 'and' ? ' and ' : ' or ');
		return nested && node.items.length > 1 ? `(${text})` : text;
	}
	const label = pathLabel(form, node.path);
	const word = OPERATOR_WORDS[node.op];
	if (node.op === 'filled' || node.op === 'empty') return `${label} ${word}`;
	return `${label} ${word} ${valueLabel(form, node.path, node.value)}`;
}

const fieldTitle = (form, id) => form.fields.properties?.[id]?.title ?? id;
const stepName = (form, id) => (form.fields.structure?.layout ?? []).find(step => step.id === id)?.name ?? id;
const list = value => (Array.isArray(value) ? value : [value]);

export function actionText(form, action) {
	const name = actionName(action);
	const value = action[name];
	const fields = () => list(value).map(id => fieldTitle(form, id)).join(', ');
	const steps = () => list(value).map(id => stepName(form, id)).join(', ');
	switch (name) {
		case 'show': return `show ${fields()}`;
		case 'hide': return `hide ${fields()}`;
		case 'enable': return `enable ${fields()}`;
		case 'disable': return `disable ${fields()}`;
		case 'require': return `make ${fields()} required`;
		case 'optional': return `make ${fields()} optional`;
		case 'clear': return `clear ${fields()}`;
		case 'setValue': return `set ${fieldTitle(form, value.field)} to ${valueLabel(form, `values.${value.field}`, value.value)}`;
		case 'options': {
			const field = fieldTitle(form, value.field);
			const parts = [];
			if (value.only) parts.push(`offer only ${valueLabel(form, `values.${value.field}`, value.only)} in ${field}`);
			if (value.exclude) parts.push(`remove ${valueLabel(form, `values.${value.field}`, value.exclude)} from ${field}`);
			return parts.join(' and ') || `keep all options in ${field}`;
		}
		case 'skip': return `skip ${steps()}`;
		case 'include': return `include ${steps()}`;
		case 'goto': {
			const goto = typeof value === 'string' ? { step: value } : value;
			return `go to ${stepName(form, goto.step)}${goto.from ? ` after ${stepName(form, goto.from)}` : ''}`;
		}
		case 'fetch': return value.after ? `fetch extra steps from ${value.service} after ${stepName(form, value.after)}` : `fetch extra fields from ${value.service} into ${value.into}`;
		case 'emit': return `send the event ${value.type}`;
		default: return 'do something custom';
	}
}

const capitalize = text => text.charAt(0).toUpperCase() + text.slice(1);

export function summarize(form, rule) {
	const condition = conditionText(form, parseCondition(rule.when));
	const then = (rule.then ?? []).map(action => actionText(form, action));
	const otherwise = (rule.else ?? []).map(action => actionText(form, action));
	let text = condition === 'always' ? 'Always' : `When ${condition}`;
	text += then.length ? `: ${then.join(', ')}.` : ': do nothing.';
	if (otherwise.length) text += ` ${capitalize(`otherwise ${otherwise.join(', ')}`)}.`;
	return text;
}
