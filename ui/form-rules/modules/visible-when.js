/**
 * `visibleWhen` on a form field, a row field of a repeating group, a step or a panel: the condition grammar the
 * content models use (universal-content-model, docs/UCM.md "Conditional fields"), so one way of writing "show this
 * when" serves a CMS's own fields and a visitor's form alike. The engine runs it as JSON Logic, as a rule of its own,
 * so it is checked again on the server like any other rule.
 *
 *   { "field": "kind", "is": "video" }               the value is this one
 *   { "field": "kind", "in": ["video", "map"] }      one of these;  "notIn": none of these (an empty field is none)
 *   { "field": "title", "empty": true }              nothing is written or picked (false: something is)
 *   { "field": "count", "gt": 1 }                    a number above 1 (gte, lt, lte)
 *   { "field": "url", "startsWith": "https://" }     text that starts so (contains, endsWith); any case unless
 *                                                    "matchCase": true
 *   { "all": [ … ] }  { "any": [ … ] }  { "not": … }
 *   "isSenior"                                       a named condition of the rule set (vars.isSenior === true)
 *
 * Values compare as a CMS compares them, as text: "3" and 3, "true" and true are the same. The compile writes every
 * spelling a value may have, so a form gives what the CMS reading gives on the same values; the conformance cases in
 * fixtures/visible-when/ (copied from universal-content-model) hold the two together. Unlike a CMS, which shows a
 * field it cannot read the condition of, a form hides it, and validate() names what is wrong.
 */

export const NUMBER_TESTS = ['gt', 'gte', 'lt', 'lte'];
export const TEXT_TESTS = ['contains', 'startsWith', 'endsWith'];
export const TESTS = ['is', 'in', 'notIn', 'empty', ...NUMBER_TESTS, ...TEXT_TESTS];
export const JOINS = ['all', 'any', 'not'];
const NAME = /^[A-Za-z_][\w]*$/;
const COMPARE = { gt: '>', gte: '>=', lt: '<', lte: '<=' };

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isScalar = value => ['string', 'number', 'boolean'].includes(typeof value);

/* Every value a form may hold that prints as this one: "3" is also 3, "true" also true. */
function spellings(value) {
	const text = String(value);
	const out = [text];
	if (text.trim() !== '' && Number.isFinite(Number(text)) && String(Number(text)) === text) out.push(Number(text));
	if (text === 'true') out.push(true);
	if (text === 'false') out.push(false);
	return out;
}

/* A test on the value, or on any item of it when it is a list (a multiple choice). */
const onValueOrItems = (read, test) => ({ or: [test(read), { some: [read, test({ var: '' })] }] });

/**
 * The JSON Logic a condition runs as. `base` is where a field's value is read: "values." on the form, "row." in a
 * row of a repeating group. A condition that cannot be read is false, so its field stays hidden.
 */
export function visibleWhenLogic(condition, { base = 'values.' } = {}) {
	if (typeof condition === 'string') return NAME.test(condition) ? { '===': [{ var: `vars.${condition}` }, true] } : false;
	if (problemsOf(condition).length) return false;
	return compile(condition, base);
}

function compile(condition, base) {
	if (Array.isArray(condition.all)) return { and: condition.all.map(c => (typeof c === 'string' ? visibleWhenLogic(c) : compile(c, base))) };
	if (Array.isArray(condition.any)) return { or: condition.any.map(c => (typeof c === 'string' ? visibleWhenLogic(c) : compile(c, base))) };
	if ('not' in condition) return { '!': typeof condition.not === 'string' ? visibleWhenLogic(condition.not) : compile(condition.not, base) };
	const read = { var: `${base}${condition.field}` };
	if ('empty' in condition) {
		const empty = { or: [{ '===': [read, null] }, { '===': [{ trim: read }, ''] }, { '===': [{ length: read }, 0] }] };
		return condition.empty ? empty : { '!': empty };
	}
	if ('is' in condition || 'in' in condition || 'notIn' in condition) {
		const list = 'is' in condition ? [condition.is] : condition.in ?? condition.notIn;
		const literals = [...new Set(list.flatMap(spellings))];
		const test = onValueOrItems(read, value => ({ in: [value, literals] }));
		return 'notIn' in condition ? { '!': test } : test;
	}
	const number = NUMBER_TESTS.find(k => k in condition);
	if (number) return onValueOrItems(read, value => ({ [COMPARE[number]]: [{ num: value }, condition[number]] }));
	const text = TEXT_TESTS.find(k => k in condition);
	const fold = value => (condition.matchCase === true ? value : { lower: value });
	const needle = condition.matchCase === true ? condition[text] : condition[text].toLowerCase();
	return onValueOrItems(read, value => (text === 'contains' ? { in: [needle, fold(value)] } : { [text]: [fold(value), needle] }));
}

/** What is wrong with a condition's shape, as messages; `at` names where it sits. Names are not looked up here. */
export function problemsOf(condition, at = 'visibleWhen') {
	if (typeof condition === 'string') return NAME.test(condition) ? [] : [`${at}: "${condition}" is not a name of a named condition`];
	if (!isObject(condition)) return [`${at}: a condition is an object, or the name of a named condition`];
	const out = [];
	const joins = JOINS.filter(k => k in condition);
	const tests = TESTS.filter(k => k in condition);
	const known = new Set([...JOINS, ...TESTS, 'field', 'matchCase']);
	for (const k of Object.keys(condition)) if (!known.has(k)) out.push(`${at}: "${k}" is not a key of a condition (${[...known].join(', ')})`);
	if (joins.length) {
		if (joins.length > 1 || tests.length || 'field' in condition) out.push(`${at}: a condition is one of all, any, not, or a field with one test`);
		for (const k of ['all', 'any']) {
			if (!(k in condition)) continue;
			if (!Array.isArray(condition[k]) || !condition[k].length) out.push(`${at}.${k}: a list of conditions`);
			else condition[k].forEach((c, i) => out.push(...problemsOf(c, `${at}.${k}[${i}]`)));
		}
		if ('not' in condition) out.push(...problemsOf(condition.not, `${at}.not`));
		return out;
	}
	if (typeof condition.field !== 'string' || !condition.field) out.push(`${at}: names the field it reads in "field"`);
	if (tests.length !== 1) out.push(`${at}: one test of ${TESTS.join(', ')}`);
	if ('is' in condition && !isScalar(condition.is)) out.push(`${at}.is: one value (a list is "in")`);
	for (const k of ['in', 'notIn']) if (k in condition && (!Array.isArray(condition[k]) || !condition[k].length || !condition[k].every(isScalar))) out.push(`${at}.${k}: a list of values`);
	if ('empty' in condition && typeof condition.empty !== 'boolean') out.push(`${at}.empty: true or false`);
	for (const k of NUMBER_TESTS) if (k in condition && (typeof condition[k] !== 'number' || !Number.isFinite(condition[k]))) out.push(`${at}.${k}: a number`);
	for (const k of TEXT_TESTS) if (k in condition && (typeof condition[k] !== 'string' || condition[k] === '')) out.push(`${at}.${k}: some text`);
	if ('matchCase' in condition && (typeof condition.matchCase !== 'boolean' || !TEXT_TESTS.some(k => k in condition))) out.push(`${at}.matchCase: true or false, beside ${TEXT_TESTS.join(', ')}`);
	return out;
}

/** The tests on single fields, each { field, test, values? }, joins and names left out. Pure. */
export function testsOf(condition, out = []) {
	if (!isObject(condition)) return out;
	for (const k of ['all', 'any']) if (Array.isArray(condition[k])) condition[k].forEach(c => testsOf(c, out));
	if ('not' in condition) testsOf(condition.not, out);
	if (typeof condition.field === 'string') {
		const test = TESTS.find(k => k in condition);
		if (test) out.push({ field: condition.field, test, values: 'is' in condition ? [condition.is] : condition.in ?? condition.notIn });
	}
	return out;
}

/** The named conditions a condition uses. Pure. */
export function namesOf(condition, out = []) {
	if (typeof condition === 'string') { if (!out.includes(condition)) out.push(condition); return out; }
	if (!isObject(condition)) return out;
	for (const k of ['all', 'any']) if (Array.isArray(condition[k])) condition[k].forEach(c => namesOf(c, out));
	if ('not' in condition) namesOf(condition.not, out);
	return out;
}

/* What a field holds, for the tests that read a kind of value: number, text, or neither. */
function kindOf(property) {
	const choices = property?.options?.choices;
	if (property?.type === 'select' && Array.isArray(choices) && choices.length) {
		const values = choices.map(c => (isObject(c) ? c.value : c));
		if (values.every(v => typeof v === 'number')) return 'number';
		if (values.every(v => typeof v === 'string')) return 'text';
		return null;
	}
	if (['number', 'integer'].includes(property?.type)) return 'number';
	if (property?.type === 'string') return 'text';
	return null;
}

/**
 * What validate() says about one visibleWhen, beyond what it says of every rule: its shape, a value a choice does not
 * offer, a number test on what is not a number, a text test on what is not text, and a condition that reads only
 * the field it hides (hidden, it could never be filled). `fields` gives a field's definition by id. Pure.
 */
export function visibleWhenProblems(condition, { fields, self = null, at = 'visibleWhen' } = {}) {
	const out = problemsOf(condition, at);
	if (out.length) return out;
	for (const t of testsOf(condition)) {
		const property = fields(t.field);
		if (!property) continue; /* an unknown field is reported where the rule reads it */
		const choices = property.options?.choices;
		if (t.values && Array.isArray(choices) && choices.length) {
			const offered = new Set(choices.map(c => String(isObject(c) ? c.value : c)));
			const missing = t.values.filter(v => !offered.has(String(v)));
			if (missing.length) out.push(`${at}: tests "${t.field}" for ${missing.map(v => JSON.stringify(v)).join(', ')}, which it does not offer`);
		}
		const wanted = NUMBER_TESTS.includes(t.test) ? 'number' : TEXT_TESTS.includes(t.test) ? 'text' : null;
		const kind = kindOf(property);
		if (wanted && kind !== wanted) out.push(`${at}: "${t.test}" tests ${wanted === 'number' ? 'a number' : 'text'}, and "${t.field}" ${kind ? `holds ${kind === 'number' ? 'a number' : 'text'}` : 'is neither text nor a number'}`);
	}
	const read = [...new Set(testsOf(condition).map(t => t.field))];
	if (self && !namesOf(condition).length && read.length === 1 && read[0] === self) out.push(`${at}: reads only the field it is on: hidden, it could never be filled`);
	return out;
}
