/**
 * A strict subset of JSON Logic (https://jsonlogic.com).
 *
 * Differences from the reference implementation, so every runtime can agree:
 * - `==` and `!=` are not supported: use `===` and `!==`.
 * - Comparisons between values of different types are false, never coerced.
 * - `num` converts explicitly: a numeric string becomes a number, anything else null.
 * - A missing variable is null, and an unknown operator throws.
 * - Text operators are case-sensitive; wrap both sides in `lower` to compare without case.
 */

import { datePart, daysBetween, yearsBetween } from './dates.js';

/* Where data carries the host's functions (input.functions): operators and field checks by name. */
export const FUNCTIONS = Symbol('functions');

const isPlainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

/* Reads a dotted path. Keys that contain dots ("offers.travelCover") are matched before nested ones. */
export function getPath(source, path) {
	if (path === '' || path === undefined || path === null) return source ?? null;
	const parts = String(path).split('.');
	let current = source;
	let index = 0;
	while (index < parts.length) {
		if (current === null || typeof current !== 'object') return null;
		let found = false;
		for (let end = parts.length; end > index; end--) {
			const key = parts.slice(index, end).join('.');
			if (Object.hasOwn(current, key)) {
				current = current[key];
				index = end;
				found = true;
				break;
			}
		}
		if (!found) return null;
	}
	return current === undefined ? null : current;
}

export const truthy = value => Array.isArray(value) ? value.length > 0 : Boolean(value);

const sameType = (a, b) => (typeof a === 'number' && typeof b === 'number' && !Number.isNaN(a) && !Number.isNaN(b))
	|| (typeof a === 'string' && typeof b === 'string');

const compare = test => (a, b, c) => {
	if (c !== undefined) return sameType(a, b) && sameType(b, c) && test(a, b) && test(b, c);
	return sameType(a, b) && test(a, b);
};

const numeric = values => values.every(v => typeof v === 'number' && !Number.isNaN(v));

const strictEqual = (a, b) => {
	if (Array.isArray(a) || Array.isArray(b) || isPlainObject(a) || isPlainObject(b)) return JSON.stringify(a) === JSON.stringify(b);
	return a === b;
};

/* Operators whose arguments are evaluated before the call. */
const operators = {
	'===': (a, b) => strictEqual(a, b),
	'!==': (a, b) => !strictEqual(a, b),
	'>': compare((a, b) => a > b),
	'>=': compare((a, b) => a >= b),
	'<': compare((a, b) => a < b),
	'<=': compare((a, b) => a <= b),
	'!': a => !truthy(a),
	'!!': a => truthy(a),
	in: (a, b) => {
		if (Array.isArray(b)) return b.some(item => strictEqual(item, a));
		if (typeof a === 'string' && typeof b === 'string') return b.includes(a);
		return false;
	},
	num: a => {
		if (typeof a === 'number') return Number.isFinite(a) ? a : null;
		if (typeof a === 'string' && a.trim() !== '' && Number.isFinite(Number(a))) return Number(a);
		return null;
	},
	cat: (...args) => args.map(a => a ?? '').join(''),
	'+': (...args) => numeric(args) ? args.reduce((sum, v) => sum + v, 0) : null,
	'*': (...args) => numeric(args) ? args.reduce((product, v) => product * v, 1) : null,
	'-': (a, b) => {
		if (b === undefined) return numeric([a]) ? -a : null;
		return numeric([a, b]) ? a - b : null;
	},
	'/': (a, b) => numeric([a, b]) && b !== 0 ? a / b : null,
	'%': (a, b) => numeric([a, b]) && b !== 0 ? a % b : null,
	min: (...args) => args.length && numeric(args) ? Math.min(...args) : null,
	max: (...args) => args.length && numeric(args) ? Math.max(...args) : null,
	/* Negative places round to tens, hundreds, …: dividing by a power of ten keeps whole numbers exact. */
	round: (a, places = 0) => {
		if (!numeric([a, places])) return null;
		return places < 0 ? Math.round(a / 10 ** -places) * 10 ** -places : Math.round(a * 10 ** places) / 10 ** places;
	},
	/* Anything that is not a number counts as nothing, so one empty item does not empty the total. */
	sum: (...args) => args.flat().filter(v => typeof v === 'number' && Number.isFinite(v)).reduce((total, v) => total + v, 0),
	/* Text */
	startsWith: (a, b) => typeof a === 'string' && typeof b === 'string' && a.startsWith(b),
	endsWith: (a, b) => typeof a === 'string' && typeof b === 'string' && a.endsWith(b),
	lower: a => typeof a === 'string' ? a.toLowerCase() : null,
	upper: a => typeof a === 'string' ? a.toUpperCase() : null,
	trim: a => typeof a === 'string' ? a.trim() : null,
	length: a => Array.isArray(a) ? a.length : typeof a === 'string' ? Array.from(a).length : null,
	substr: (a, start = 0, length) => {
		if (typeof a !== 'string' || !numeric([start])) return null;
		const chars = Array.from(a);
		const from = start < 0 ? Math.max(chars.length + start, 0) : start;
		if (length === undefined) return chars.slice(from).join('');
		if (!numeric([length])) return null;
		return chars.slice(from, length < 0 ? chars.length + length : from + length).join('');
	},
	/* Dates are ISO strings; pass "today" in with { "var": "today" }. */
	yearsBetween: (a, b) => yearsBetween(a, b),
	daysBetween: (a, b) => daysBetween(a, b),
	datePart: (a, part) => datePart(a, part)
};

/* Array operators run their logic once per item, with the item as data (JSON Logic semantics). */
const scoped = (item, data) => {
	const scope = item !== null && typeof item === 'object' && !Array.isArray(item) ? { ...item } : item;
	if (scope && typeof scope === 'object' && data?.[FUNCTIONS]) Object.defineProperty(scope, FUNCTIONS, { value: data[FUNCTIONS] });
	return scope;
};
const listOf = (arg, data) => {
	const list = apply(arg, data);
	return Array.isArray(list) ? list : [];
};
const SCOPED = new Set(['map', 'filter', 'reduce', 'some', 'all', 'none']);

/* Runs a host function used as a field check: null when the value passes, else { code, message, level? }. */
export function runCheck(functions, name, value) {
	const fn = functions && Object.hasOwn(functions, name) ? functions[name] : undefined;
	if (typeof fn !== 'function') throw new Error(`Unknown function "${name}"`);
	return fn(value) ?? null;
}

/* Operators that control evaluation of their own arguments. */
const special = {
	var: (args, data) => {
		const [path, fallback = null] = Array.isArray(args) ? args : [args];
		const value = getPath(data, apply(path, data));
		return value === null ? apply(fallback, data) : value;
	},
	and: (args, data) => {
		let value = true;
		for (const arg of args) {
			value = apply(arg, data);
			if (!truthy(value)) return value;
		}
		return value;
	},
	or: (args, data) => {
		let value = false;
		for (const arg of args) {
			value = apply(arg, data);
			if (truthy(value)) return value;
		}
		return value;
	},
	if: (args, data) => {
		let index = 0;
		for (; index < args.length - 1; index += 2) {
			if (truthy(apply(args[index], data))) return apply(args[index + 1], data);
		}
		return index === args.length - 1 ? apply(args[index], data) : null;
	},
	/* True when the named host check passes; warnings pass. */
	check: (args, data) => {
		const [name, value] = args.map(arg => apply(arg, data));
		const result = runCheck(data?.[FUNCTIONS], name, value);
		return !result || result.level === 'warning';
	},
	map: ([list, logic], data) => listOf(list, data).map(item => apply(logic, scoped(item, data))),
	filter: ([list, logic], data) => listOf(list, data).filter(item => truthy(apply(logic, scoped(item, data)))),
	reduce: ([list, logic, initial = null], data) => listOf(list, data).reduce((accumulator, current) => apply(logic, scoped({ current, accumulator }, data)), apply(initial, data)),
	some: ([list, logic], data) => listOf(list, data).some(item => truthy(apply(logic, scoped(item, data)))),
	/* Like JSON Logic, "all" of an empty list is false. */
	all: ([list, logic], data) => {
		const items = listOf(list, data);
		return items.length > 0 && items.every(item => truthy(apply(logic, scoped(item, data))));
	},
	none: ([list, logic], data) => !listOf(list, data).some(item => truthy(apply(logic, scoped(item, data)))),
	missing: (args, data) => args.map(arg => apply(arg, data)).flat().filter(path => getPath(data, path) === null || getPath(data, path) === '')
};

export const OPERATORS = Object.freeze([...Object.keys(operators), ...Object.keys(special)]);

/* A rule is an object with exactly one key, the operator. Everything else is a literal. */
export function isRule(value) {
	return isPlainObject(value) && Object.keys(value).length === 1;
}

export function apply(logic, data = {}) {
	if (Array.isArray(logic)) return logic.map(item => apply(item, data));
	if (!isRule(logic)) return logic;

	const [op] = Object.keys(logic);
	let args = logic[op];
	if (!Array.isArray(args)) args = op === 'var' ? args : [args];

	if (Object.hasOwn(special, op)) return special[op](args, data);
	if (Object.hasOwn(operators, op)) return operators[op](...args.map(arg => apply(arg, data)));
	const functions = data?.[FUNCTIONS];
	/* Own properties only: Object.prototype methods ("constructor", "toString") are not host functions. */
	const fn = functions && Object.hasOwn(functions, op) ? functions[op] : undefined;
	if (typeof fn === 'function') return fn(...args.map(arg => apply(arg, data))) ?? null;
	throw new Error(`Unknown operator "${op}"`);
}

/* Lists every variable path a condition reads, for validation and dependency tracking. */
export function readsOf(logic, found = new Set()) {
	if (Array.isArray(logic)) {
		logic.forEach(item => readsOf(item, found));
		return found;
	}
	if (!isRule(logic)) return found;
	const [op] = Object.keys(logic);
	const args = logic[op];
	if (op === 'var') {
		const path = Array.isArray(args) ? args[0] : args;
		if (typeof path === 'string') found.add(path);
		if (Array.isArray(args) && args.length > 1) readsOf(args[1], found);
		return found;
	}
	/* Logic inside an array operator reads the item, not the form, so only the list is a read. */
	if (SCOPED.has(op)) return readsOf(Array.isArray(args) ? args[0] : args, found);
	if (op === 'missing') {
		(Array.isArray(args) ? args : [args]).forEach(path => typeof path === 'string' && found.add(path));
		return found;
	}
	return readsOf(args, found);
}

/* Lists every operator a condition uses, so validation can reject unknown ones before running. */
export function operatorsOf(logic, found = new Set()) {
	if (Array.isArray(logic)) {
		logic.forEach(item => operatorsOf(item, found));
		return found;
	}
	if (!isRule(logic)) return found;
	const [op] = Object.keys(logic);
	found.add(op);
	return operatorsOf(logic[op], found);
}
