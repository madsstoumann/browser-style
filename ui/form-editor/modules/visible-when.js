/**
 * The content models' `visibleWhen` (form-rules modules/visible-when.js) drawn with the same condition rows a rule's
 * When uses: toTree turns a visibleWhen into the builder's tree, fromTree turns the tree back, or gives null when a row
 * says something visibleWhen cannot (a variable, a context value, one field against another, a raw condition).
 */
const TO_TEST = { '===': 'is', '>': 'gt', '>=': 'gte', '<': 'lt', '<=': 'lte', in: 'in', notin: 'notIn', contains: 'contains', startsWith: 'startsWith', endsWith: 'endsWith' };
const FROM_TEST = Object.fromEntries(Object.entries(TO_TEST).map(([op, test]) => [test, op]));
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

function nodeOf(condition) {
	if (typeof condition === 'string') return { kind: 'cond', path: `vars.${condition}`, num: false, op: '===', value: true };
	if (!isObject(condition)) return null;
	if (Array.isArray(condition.all) || Array.isArray(condition.any)) {
		const items = (condition.all ?? condition.any).map(nodeOf);
		return items.every(Boolean) ? { kind: 'group', mode: condition.all ? 'and' : 'or', items } : null;
	}
	if ('not' in condition) {
		const inner = nodeOf(condition.not);
		if (inner?.kind !== 'cond') return null;
		const negated = { '===': '!==', contains: 'notcontains', filled: 'empty', empty: 'filled', in: 'notin', notin: 'in' }[inner.op];
		if (inner.path.startsWith('vars.')) return { ...inner, value: false };
		return negated ? { ...inner, op: negated } : null;
	}
	if (typeof condition.field !== 'string') return null;
	const path = `values.${condition.field}`;
	if ('empty' in condition) return { kind: 'cond', path, num: false, op: condition.empty ? 'empty' : 'filled', value: null };
	const test = Object.keys(FROM_TEST).find(k => k in condition);
	if (!test) return null;
	return { kind: 'cond', path, num: false, op: FROM_TEST[test], value: condition[test], ...(condition.matchCase ? { matchCase: true } : {}) };
}

/** The builder's tree for a visibleWhen, or null when the rows cannot draw it. */
export function toTree(condition) {
	const node = nodeOf(condition);
	if (!node) return null;
	return node.kind === 'group' ? node : { kind: 'group', mode: 'and', items: [node], wrapped: true };
}

function conditionOf(node) {
	if (node.kind === 'group') {
		const items = node.items.map(conditionOf);
		if (items.some(item => item === null)) return null;
		return items.length === 1 && node.wrapped ? items[0] : { [node.mode === 'and' ? 'all' : 'any']: items };
	}
	if (node.kind !== 'cond' || node.other) return null;
	if (node.path?.startsWith('vars.')) {
		if (node.op !== '===' || typeof node.value !== 'boolean') return null;
		return node.value ? node.path.slice(5) : { not: node.path.slice(5) };
	}
	if (!node.path?.startsWith('values.')) return null;
	/* A row not filled in yet is written as it stands: validate() names it until it is. */
	const field = node.path.slice(7);
	const value = node.value ?? null;
	const matchCase = node.matchCase ? { matchCase: true } : {};
	if (node.op === 'filled' || node.op === 'empty') return { field, empty: node.op === 'empty' };
	if (node.op === '!==') return { not: { field, is: value } };
	if (node.op === 'notcontains') return { not: { field, contains: value ?? '', ...matchCase } };
	const test = TO_TEST[node.op];
	if (!test) return null;
	if (['in', 'notIn'].includes(test)) return { field, [test]: Array.isArray(value) ? value : [] };
	if (['contains', 'startsWith', 'endsWith'].includes(test)) return { field, [test]: value ?? '', ...matchCase };
	return { field, [test]: value };
}

/**
 * The visibleWhen a tree says: undefined for no rows (always), null when a row says something visibleWhen cannot.
 */
export function fromTree(tree) {
	if (tree?.kind === 'group' && !tree.items.length) return undefined;
	return conditionOf(tree);
}

/** visibleWhen with each field it reads renamed. Pure. */
export function renameVisibleWhen(condition, from, to) {
	if (!isObject(condition)) return condition;
	const out = { ...condition };
	for (const k of ['all', 'any']) if (Array.isArray(out[k])) out[k] = out[k].map(c => renameVisibleWhen(c, from, to));
	if ('not' in out) out.not = renameVisibleWhen(out.not, from, to);
	if (out.field === from) out.field = to;
	return out;
}

/** Whether a visibleWhen uses the named condition `name`. Pure. */
export function usesName(condition, name) {
	if (condition === name) return true;
	if (!isObject(condition)) return false;
	return ['all', 'any'].some(k => Array.isArray(condition[k]) && condition[k].some(c => usesName(c, name))) || ('not' in condition && usesName(condition.not, name));
}
