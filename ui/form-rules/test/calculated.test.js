import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, fillText, validate } from '../index.js';

const form = {
	id: 'order',
	structure: { layout: [{ type: 'step', id: 'one', fields: ['qty', 'price', 'total', 'note'] }] },
	properties: {
		qty: { type: 'integer' },
		price: { type: 'number' },
		total: { type: 'number', title: 'Total', from: 'vars.total', ui: { widget: 'output' } },
		note: { type: 'content', content: 'You pay {values.total} for {values.qty} items.' }
	}
};
const rules = {
	id: 'order-rules',
	variables: { total: { type: 'number', compute: { round: [{ '*': [{ var: 'values.qty' }, { var: 'values.price' }] }, 2] } } },
	rules: [{ id: 'big', when: { '>': [{ var: 'values.total' }, 100] }, then: [{ invalid: { field: 'total', message: 'At most 100, not {values.total}', level: 'warning' } }] }]
};

test('a calculated field shows its variable, is submitted, and can steer rules', () => {
	const state = evaluate(form, rules, { values: { qty: 3, price: 40.5 } });
	assert.equal(state.values.total, 121.5);
	assert.deepEqual(state.matched, ['big']);
	assert.deepEqual(validate(form, rules).errors, []);
});

test('a posted value for a calculated field is ignored', () => {
	const state = evaluate(form, rules, { values: { qty: 1, price: 2, total: 99999 } });
	assert.equal(state.values.total, 2);
	assert.equal(evaluate(form, rules, { values: { total: 5 } }).values.total, undefined);
});

test('calculated fields validate: declared variable, not required, not set by rules, no loops', () => {
	const bad = structuredClone(form);
	bad.properties.total.from = 'vars.nope';
	assert.ok(validate(bad, rules).errors.some(error => error.code === 'variable'));
	const required = structuredClone(form);
	required.properties.total.required = true;
	assert.ok(validate(required, rules).errors.some(error => error.code === 'calculated'));
	const set = { ...rules, rules: [{ id: 's', when: true, then: [{ setValue: { field: 'total', value: 1 } }] }] };
	assert.ok(validate(form, set).errors.some(error => error.code === 'calculated'));
	const loop = { ...rules, variables: { total: { type: 'number', compute: { '+': [{ var: 'values.total' }, 1] } } }, rules: [] };
	assert.ok(validate(form, loop).errors.some(error => error.code === 'cycle'));
});

test('placeholders fill from values and variables; unknown ones are validation errors', () => {
	assert.equal(fillText('You pay {values.total} for {values.qty} items.', { values: { total: 12, qty: 3 } }), 'You pay 12 for 3 items.');
	assert.equal(fillText('{values.missing}|{{literal}}', { values: {} }), '|{literal}');
	assert.equal(fillText('{vars.x}', { vars: { x: 1234.5 } }, { format: value => value.toFixed(2) }), '1234.50');
	assert.equal(fillText('{values.tags}, {values.ok}', { values: { tags: ['a', 'b'], ok: true } }), 'a, b, yes');
	const bad = structuredClone(form);
	bad.properties.note.content = 'Hi {values.name} {vars.score}';
	assert.deepEqual(validate(bad, rules).errors.map(error => error.code), ['placeholder', 'placeholder']);
});
