/**
 * visibleWhen on a form: the content models' condition grammar run as rules. The conformance cases are copied from
 * universal-content-model (tests/fixtures/visible-when/conformance.json); a form must read each one as the CMS does.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { apply, evaluate, validate, visibleWhenLogic } from '../index.js';

const conformance = JSON.parse(readFileSync(new URL('../fixtures/visible-when/conformance.json', import.meta.url), 'utf8'));

/* A form with the conformance fields on one step and a "target" text block shown by the condition. */
const formWith = (condition, extra = {}) => ({
	id: 'vw', title: 'visibleWhen',
	structure: { layout: [{ type: 'step', id: 'one', fields: [...Object.keys(conformance.fields), 'target'] }] },
	properties: { ...structuredClone(conformance.fields), target: { type: 'content', content: 'Shown', visibleWhen: condition }, ...extra }
});
const noRules = { id: 'vw-rules', form: 'vw', rules: [] };

test('every conformance case: the compiled logic reads the values as the CMS does', () => {
	for (const c of conformance.cases) {
		const values = Object.fromEntries(Object.keys(conformance.fields).map(k => [k, c.values[k] ?? null]));
		assert.equal(Boolean(apply(visibleWhenLogic(c.condition), { values })), c.holds, `${JSON.stringify(c.condition)} on ${JSON.stringify(c.values)}`);
	}
});

test('every conformance case: evaluate() shows the field exactly when the condition holds', () => {
	for (const c of conformance.cases) {
		const state = evaluate(formWith(c.condition), noRules, { values: c.values });
		assert.equal(state.fields.target.visible, c.holds, `${JSON.stringify(c.condition)} on ${JSON.stringify(c.values)}`);
	}
});

test('the conformance cases validate', () => {
	for (const condition of new Set(conformance.cases.map(c => JSON.stringify(c.condition)))) {
		assert.deepEqual(validate(formWith(JSON.parse(condition)), noRules).errors, [], condition);
	}
});

test('a hidden field reads as no value, and explain names the visibleWhen rule', () => {
	const form = formWith({ field: 'kind', is: 'video' }, { url: { type: 'string', title: 'Link', visibleWhen: { field: 'kind', in: ['video', 'map'] } } });
	form.properties.target.visibleWhen = { field: 'url', empty: false };
	const state = evaluate(form, noRules, { values: { kind: 'image', url: 'https://x' } });
	assert.equal(state.fields.url.visible, false);
	assert.ok(!('url' in state.values));
	assert.equal(state.fields.target.visible, false, 'a hidden url reads as empty');
	assert.deepEqual(state.explain['url.visible'], ['visibleWhen:url']);
});

test('a step and a panel take visibleWhen; showWhen beside it must hold as well', () => {
	const form = {
		id: 'vw', title: 'Steps',
		structure: { layout: [
			{ type: 'step', id: 'one', fields: ['kind'] },
			{ type: 'step', id: 'two', fields: ['note'], visibleWhen: { field: 'kind', is: 'video' } },
			{ type: 'panel', id: 'side', fields: ['hint'], visibleWhen: { not: { field: 'kind', empty: true } } }
		] },
		properties: {
			kind: { type: 'select', title: 'Kind', options: { choices: [{ value: 'video', label: 'Video' }, { value: 'image', label: 'Image' }] } },
			note: { type: 'string', title: 'Note', visibleWhen: { field: 'kind', is: 'video' }, showWhen: { '===': [{ var: 'values.kind' }, 'image'] } },
			hint: { type: 'content', content: 'Hint' }
		}
	};
	assert.deepEqual(validate(form, noRules).errors, []);
	const video = evaluate(form, noRules, { values: { kind: 'video' } });
	assert.deepEqual(video.path, ['one', 'two']);
	assert.equal(video.fields.note.visible, false, 'showWhen does not hold');
	assert.equal(video.panels.find(p => p.id === 'side')?.visible ?? video.panels.side?.visible, true);
	const none = evaluate(form, noRules, { values: {} });
	assert.deepEqual(none.path, ['one']);
});

test('a name is a named condition of the rule set', () => {
	const form = formWith('isVideo');
	const rules = { ...noRules, variables: { isVideo: { type: 'boolean', title: 'Is video', compute: { '===': [{ var: 'values.kind' }, 'video'] } } } };
	assert.deepEqual(validate(form, rules).errors, []);
	assert.equal(evaluate(form, rules, { values: { kind: 'video' } }).fields.target.visible, true);
	assert.equal(evaluate(form, rules, { values: { kind: 'map' } }).fields.target.visible, false);
	const both = formWith({ all: ['isVideo', { field: 'title', empty: false }] });
	assert.equal(evaluate(both, rules, { values: { kind: 'video', title: 'Hi' } }).fields.target.visible, true);
	assert.match(JSON.stringify(validate(formWith('isVidoe'), rules).errors), /vars.isVidoe/);
});

test('a row field reads its own row', () => {
	const form = {
		id: 'vw', title: 'Rows',
		structure: { layout: [{ type: 'step', id: 'one', fields: ['lines'] }] },
		properties: { lines: { type: 'list', title: 'Lines', items: { properties: {
			product: { type: 'select', title: 'Product', options: { choices: [{ value: 'cake', label: 'Cake' }, { value: 'tea', label: 'Tea' }] } },
			qty: { type: 'integer', title: 'Quantity' },
			note: { type: 'string', title: 'Message on the cake', visibleWhen: { all: [{ field: 'product', is: 'cake' }, { field: 'qty', gte: 1 }] } }
		} } } }
	};
	assert.deepEqual(validate(form, noRules).errors, []);
	const state = evaluate(form, noRules, { values: { lines: [{ product: 'cake', qty: 2, note: 'Hi' }, { product: 'tea', qty: 1, note: 'x' }] } });
	assert.equal(state.rows.lines[0].note.visible, true);
	assert.equal(state.rows.lines[1].note.visible, false);
	assert.deepEqual(state.values.lines, [{ product: 'cake', qty: 2, note: 'Hi' }, { product: 'tea', qty: 1 }]);
});

test('a form fails closed: a condition it cannot read hides the field, and validate() says why', () => {
	for (const [condition, message] of [
		[{ field: 'kind', is: ['video'] }, /is: one value/],
		[{ field: 'kind', equals: 'video' }, /"equals" is not a key/],
		[{ field: 'count', gt: '1' }, /gt: a number/],
		[{ field: 'kind', is: 'audio' }, /tests "kind" for "audio", which it does not offer/],
		[{ field: 'title', gte: 2 }, /"gte" tests a number, and "title" holds text/],
		[{ field: 'count', contains: '1' }, /"contains" tests text, and "count" holds a number/],
		[{ field: 'live', startsWith: 't' }, /"live" is neither text nor a number/],
		[{ field: 'kindd', is: 'video' }, /unknown field "kindd"/]
	]) {
		assert.match(validate(formWith(condition), noRules).errors.map(e => e.message).join("\n"), message, JSON.stringify(condition));
	}
	assert.equal(evaluate(formWith({ field: 'kind', equals: 'video' }), noRules, { values: { kind: 'video' } }).fields.target.visible, false);
	const self = formWith({ field: 'kind', is: 'video' });
	self.properties.title.visibleWhen = { field: 'title', empty: false };
	assert.match(validate(self, noRules).errors.map(e => e.message).join("\n"), /reads only the field it is on/);
});
