/**
 * Converts between a rule's JSON Logic condition and the editor's row tree, and writes
 * plain-language summaries of rules. A condition the builder cannot draw stays as a raw block.
 *
 * Tree nodes:
 *   { kind: 'group', mode: 'and' | 'or', items: [ … ], wrapped? }
 *   { kind: 'cond', path, num, op, value, other?, matchCase? }
 *     op: === !== > >= < <= in notin filled empty contains notcontains startsWith endsWith
 *     other: a second path, compared instead of value (field-to-field)
 *     matchCase: text operators ignore case unless this is true
 *   { kind: 'raw', logic }
 */
import { isRule } from '../../form-rules/modules/logic.js';
import { actionName } from '../../form-rules/modules/actions.js';

export const COMPARE = ['===', '!==', '>', '>=', '<', '<='];
export const OPERATOR_WORDS = {
	'===': 'is', '!==': 'is not', '>': 'is above', '>=': 'is at least', '<': 'is below', '<=': 'is at most',
	in: 'is one of', notin: 'is not one of', filled: 'is filled in', empty: 'is empty',
	contains: 'contains', notcontains: 'does not contain', startsWith: 'starts with', endsWith: 'ends with'
};
export const TEXT_OPS = ['contains', 'notcontains', 'startsWith', 'endsWith'];

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

/* A text read: { path, matchCase } for { var } or { lower: { var } }. */
const textReadOf = node => {
	const path = varPath(node);
	if (path) return { path, matchCase: true };
	if (isRule(node) && 'lower' in node) {
		const innerPath = varPath(Array.isArray(node.lower) ? node.lower[0] : node.lower);
		if (innerPath) return { path: innerPath, matchCase: false };
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
		if (inner?.kind === 'cond' && inner.op === 'contains') return { ...inner, op: 'notcontains' };
	}
	if (COMPARE.includes(op) && args.length === 2) {
		const read = readOf(args[0]);
		if (read && isLiteral(args[1])) return { kind: 'cond', ...read, op, value: args[1] };
		const other = readOf(args[1]);
		if (read && other && read.num === other.num) return { kind: 'cond', ...read, op, value: null, other: other.path };
	}
	if (op === 'in' && args.length === 2) {
		const read = readOf(args[0]);
		if (read && Array.isArray(args[1]) && args[1].every(isLiteral)) return { kind: 'cond', ...read, op: 'in', value: args[1] };
		const text = textReadOf(args[1]);
		if (text && typeof args[0] === 'string' && (text.matchCase || args[0] === args[0].toLowerCase())) return { kind: 'cond', path: text.path, num: false, op: 'contains', value: args[0], matchCase: text.matchCase };
	}
	if ((op === 'startsWith' || op === 'endsWith') && args.length === 2) {
		const text = textReadOf(args[0]);
		if (text && typeof args[1] === 'string' && (text.matchCase || args[1] === args[1].toLowerCase())) return { kind: 'cond', path: text.path, num: false, op, value: args[1], matchCase: text.matchCase };
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
	if (TEXT_OPS.includes(node.op)) {
		const text = String(node.value ?? '');
		const subject = node.matchCase ? { var: node.path } : { lower: { var: node.path } };
		const needle = node.matchCase ? text : text.toLowerCase();
		if (node.op === 'contains') return { in: [needle, subject] };
		if (node.op === 'notcontains') return { '!': { in: [needle, subject] } };
		return { [node.op]: [subject, needle] };
	}
	if (node.other) return { [node.op]: [read, node.num ? { num: { var: node.other } } : { var: node.other }] };
	return { [node.op]: [read, node.value ?? null] };
}

export function serializeCondition(tree) {
	if (tree.wrapped && tree.items.length === 1 && tree.mode === 'and') return serializeNode(tree.items[0]);
	return serializeNode(tree);
}

/* === Plain language === */

/* In a row rule (forEach), row.x reads an item of the current row and index its position. */
const itemsOf = (form, list) => form.fields.properties?.[list]?.items?.properties ?? {};
/* scope: { list, rules } — the row rule's list, and the rule set for variable titles. */
export const namedCondition = (rules, path) => {
	const definition = path?.startsWith('vars.') ? rules?.fields?.variables?.[path.slice(5)] : null;
	return definition?.type === 'boolean' && 'compute' in definition ? definition : null;
};
const propertyOf = (form, path, scope) => {
	if (path.startsWith('values.')) return form.fields.properties?.[path.slice(7)];
	if (scope?.list && path.startsWith('row.')) return itemsOf(form, scope.list)[path.slice(4)];
	return null;
};

export function pathLabel(form, path, scope) {
	const property = propertyOf(form, path, scope);
	if (property) return property.title ?? path.slice(path.indexOf('.') + 1);
	if (scope?.list && path === 'index') return 'row number (from 0)';
	const [root, ...rest] = path.split('.');
	if (root === 'vars') return scope?.rules?.fields?.variables?.[rest.join('.')]?.title ?? rest.join('.');
	return `${root} ${rest.join('.')}`.trim();
}

export function valueLabel(form, path, value, scope) {
	if (Array.isArray(value)) return value.map(item => valueLabel(form, path, item, scope)).join(', ');
	const choice = propertyOf(form, path, scope)?.options?.choices?.find(c => c.value === value);
	if (choice) return choice.label;
	if (value === true) return 'yes';
	if (value === false) return 'no';
	return value === null || value === '' ? '(nothing)' : String(value);
}

const WORDS = { ...OPERATOR_WORDS, '*': '×', '/': '÷', '+': '+', '-': '−', and: 'and', or: 'or' };

/* Any JSON Logic as readable text, for conditions the builder cannot draw. */
function logicText(form, logic, scope) {
	if (!isRule(logic)) return Array.isArray(logic) ? logic.map(item => logicText(form, item, scope)).join(', ') : valueLabel(form, '', logic);
	const [op] = Object.keys(logic);
	const args = Array.isArray(logic[op]) ? logic[op] : [logic[op]];
	if (op === 'var') return typeof args[0] === 'string' ? pathLabel(form, args[0], scope) : 'a value';
	if (op === 'num' || op === 'lower') return logicText(form, args[0], scope);
	if (op === '!') return `not (${logicText(form, args[0], scope)})`;
	if (op === '!!') return `${logicText(form, args[0], scope)} is filled in`;
	if (op === 'check') return `${logicText(form, args[1], scope)} passes ${args[0]}`;
	if (op in WORDS && args.length >= 2) return args.map(arg => logicText(form, arg, scope)).join(` ${WORDS[op]} `);
	return `${op}(${args.map(arg => logicText(form, arg, scope)).join(', ')})`;
}

function conditionText(form, node, nested = false, scope) {
	if (node.kind === 'raw') return logicText(form, node.logic, scope);
	if (node.kind === 'group') {
		if (!node.items.length) return 'always';
		const text = node.items.map(item => conditionText(form, item, true, scope)).join(node.mode === 'and' ? ' and ' : ' or ');
		return nested && node.items.length > 1 ? `(${text})` : text;
	}
	const label = pathLabel(form, node.path, scope);
	/* A named condition reads as its title: "Is senior customer", "not Is senior customer". */
	if (namedCondition(scope?.rules, node.path) && (node.op === '===' || node.op === '!==') && typeof node.value === 'boolean') {
		return (node.op === '===') === node.value ? label : `not ${label}`;
	}
	const word = OPERATOR_WORDS[node.op];
	if (node.op === 'filled' || node.op === 'empty') return `${label} ${word}`;
	if (node.other) return `${label} ${word} ${pathLabel(form, node.other, scope)}`;
	if (TEXT_OPS.includes(node.op)) return `${label} ${word} “${node.value ?? ''}”${node.matchCase ? ' (match case)' : ''}`;
	return `${label} ${word} ${valueLabel(form, node.path, node.value, scope)}`;
}

/* A row rule targets list.item: named by the item's title. */
const fieldTitle = (form, id) => {
	const [list, item] = String(id).split('.');
	if (item && form.fields.properties?.[list]?.type === 'list') return itemsOf(form, list)[item]?.title ?? item;
	return form.fields.properties?.[id]?.title ?? id;
};
const valuePath = id => (String(id).includes('.') ? `row.${String(id).split('.')[1]}` : `values.${id}`);
const stepName = (form, id) => (form.fields.structure?.layout ?? []).find(step => step.id === id)?.name ?? id;
const asList = value => (Array.isArray(value) ? value : [value]);

export function actionText(form, action, scope) {
	const name = actionName(action);
	const value = action[name];
	const fields = () => asList(value).map(id => fieldTitle(form, id)).join(', ');
	const steps = () => asList(value).map(id => stepName(form, id)).join(', ');
	switch (name) {
		case 'show': return `show ${fields()}`;
		case 'hide': return `hide ${fields()}`;
		case 'enable': return `enable ${fields()}`;
		case 'disable': return `disable ${fields()}`;
		case 'require': return `make ${fields()} required`;
		case 'optional': return `make ${fields()} optional`;
		case 'clear': return `clear ${fields()}`;
		case 'setValue': return `set ${fieldTitle(form, value.field)} to ${valueLabel(form, valuePath(value.field), value.value, scope)}`;
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
		case 'add': return `add ${typeof value.value === 'object' && value.value !== null ? 'a calculated value' : value.value} to ${value.var}`;
		case 'set': return `set ${value.var} to ${typeof value.value === 'object' && value.value !== null ? 'a calculated value' : valueLabel(form, '', value.value)}`;
		case 'invalid': return `${value.level === 'warning' ? 'warn on' : 'mark'} ${fieldTitle(form, value.field)}${value.level === 'warning' ? '' : ' invalid'}: “${value.message}”`;
		case 'fetch': return (value.after ? `fetch extra steps from ${value.service} after ${stepName(form, value.after)}` : value.into ? `fetch extra fields from ${value.service} into ${value.into}` : `ask ${value.service}`) + (value.wait ? ' and wait for the answer' : '');
		case 'emit': return `send the event ${value.type}`;
		default: return 'do something custom';
	}
}

const capitalize = text => text.charAt(0).toUpperCase() + text.slice(1);

export function summarize(form, rule, rules) {
	const list = rule.forEach;
	const scope = { list, rules };
	const condition = conditionText(form, parseCondition(rule.when), false, scope);
	const then = (rule.then ?? []).map(action => actionText(form, action, scope));
	const otherwise = (rule.else ?? []).map(action => actionText(form, action, scope));
	let text = condition === 'always' ? 'Always' : `When ${condition}`;
	if (list) text = `For each row of ${fieldTitle(form, list)}: ${condition === 'always' ? 'always' : `when ${condition}`}`;
	text += then.length ? `: ${then.join(', ')}.` : ': do nothing.';
	if (otherwise.length) text += ` ${capitalize(`otherwise ${otherwise.join(', ')}`)}.`;
	return text;
}
