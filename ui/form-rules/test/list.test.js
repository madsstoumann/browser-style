import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, validate } from '../index.js';

const form = {
	id: 'order',
	structure: { layout: [{ type: 'step', id: 'one', fields: ['lines', 'total'] }] },
	properties: {
		lines: {
			type: 'list', title: 'Order lines', ui: { widget: 'table' },
			items: { properties: {
				product: { type: 'select', title: 'Product', required: true, options: { choices: [{ value: 'tea', label: 'Tea' }, { value: 'cake', label: 'Cake' }] } },
				qty: { type: 'integer', title: 'Quantity', validation: { minimum: 1 } },
				price: { type: 'number', title: 'Price' }
			} },
			validation: { minItems: 1, maxItems: 3 }
		},
		total: { type: 'number', title: 'Total', from: 'vars.total', ui: { widget: 'output' } }
	}
};
const rules = {
	id: 'order-rules',
	variables: { total: { type: 'number', compute: { sum: { map: [{ var: 'values.lines' }, { '*': [{ var: 'qty' }, { var: 'price' }] }] } } } },
	rules: [{ id: 'cake', when: { some: [{ var: 'values.lines' }, { '===': [{ var: 'product' }, 'cake'] }] }, then: [{ emit: { type: 'order.cake' } }] }]
};

test('rows are cleaned, checked per row and summed', () => {
	const state = evaluate(form, rules, { values: { lines: [
		{ product: 'tea', qty: 2, price: 10, extra: 'dropped' },
		{},
		{ product: 'cake', qty: 0, price: 25 },
		{ product: 'soup', qty: '3' }
	] } });
	assert.deepEqual(state.values.lines, [{ product: 'tea', qty: 2, price: 10 }, { product: 'cake', qty: 0, price: 25 }, {}]);
	assert.deepEqual(state.issues.map(({ row, item, code }) => [row, item, code]), [[1, 'qty', 'minimum'], [2, 'product', 'option-unavailable'], [2, 'qty', 'type']]);
	assert.deepEqual(state.matched, ['cake']);
	assert.equal(state.vars.total, null);
	assert.equal(evaluate(form, rules, { values: { lines: [{ product: 'tea', qty: 2, price: 10 }, { product: 'cake', qty: 1, price: 25 }] } }).values.total, 45);
	assert.deepEqual(validate(form, rules).errors, []);
});

test('row counts and required rows', () => {
	const none = evaluate(form, rules, { values: { lines: [] } });
	assert.deepEqual(none.issues.map(issue => issue.code), []);
	const required = structuredClone(form);
	required.properties.lines.required = true;
	assert.deepEqual(evaluate(required, rules, { values: {} }).issues.map(issue => issue.code), ['required']);
	const many = Array.from({ length: 4 }, () => ({ product: 'tea', qty: 1 }));
	assert.deepEqual(evaluate(form, rules, { values: { lines: many } }).issues.map(issue => issue.code), ['maxItems']);
	assert.deepEqual(evaluate(form, rules, { values: { lines: 'x' } }).issues.map(issue => issue.code), ['type']);
	const messages = evaluate(form, rules, { values: { lines: many }, messages: { maxItems: 'Højst {limit} rækker' } });
	assert.equal(messages.issues[0].message, 'Højst 3 rækker');
});

test('a repeating group validates its row fields', () => {
	const bad = structuredClone(form);
	bad.properties.lines.items.properties.nested = { type: 'list' };
	bad.properties.lines.validation = { minItems: 4, maxItems: 3 };
	assert.deepEqual(validate(bad, rules).errors.map(error => error.code), ['list', 'list']);
	const empty = structuredClone(form);
	delete empty.properties.lines.items;
	assert.ok(validate(empty, rules).errors.some(error => error.code === 'list'));
});
