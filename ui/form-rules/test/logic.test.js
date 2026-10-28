import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apply, getPath } from '../modules/logic.js';

test('var reads dotted paths, flat dotted keys first', () => {
	const data = { values: { zip: '2100', 'offers.travelCover': true, nested: { a: 1 } } };
	assert.equal(apply({ var: 'values.zip' }, data), '2100');
	assert.equal(apply({ var: 'values.offers.travelCover' }, data), true);
	assert.equal(apply({ var: 'values.nested.a' }, data), 1);
	assert.equal(apply({ var: 'values.missing' }, data), null);
	assert.equal(apply({ var: ['values.missing', 'fallback'] }, data), 'fallback');
	assert.equal(getPath(null, 'a'), null);
});

test('comparisons never coerce between types', () => {
	assert.equal(apply({ '>': ['2100', 2000] }), false);
	assert.equal(apply({ '>': [{ num: '2100' }, 2000] }), true);
	assert.equal(apply({ '<': [null, 1] }), false);
	assert.equal(apply({ '===': [1, '1'] }), false);
	assert.equal(apply({ '<=': [1, 2, 3] }), true);
	assert.equal(apply({ '<': [1, 3, 2] }), false);
});

test('num converts only clean numbers', () => {
	assert.equal(apply({ num: '42' }), 42);
	assert.equal(apply({ num: ' ' }), null);
	assert.equal(apply({ num: 'abc' }), null);
	assert.equal(apply({ num: true }), null);
});

test('loose equality is refused', () => {
	assert.throws(() => apply({ '==': [1, 1] }), /Unknown operator "=="/);
});

test('logic, membership and arithmetic', () => {
	assert.equal(apply({ and: [true, 1, 'x'] }), 'x');
	assert.equal(apply({ or: [0, '', 'y'] }), 'y');
	assert.equal(apply({ if: [false, 'a', true, 'b', 'c'] }), 'b');
	assert.equal(apply({ in: ['b', ['a', 'b']] }), true);
	assert.equal(apply({ in: ['ell', 'hello'] }), true);
	assert.equal(apply({ '+': [1, 2, 3] }), 6);
	assert.equal(apply({ '+': [1, '2'] }), null);
	assert.equal(apply({ '/': [1, 0] }), null);
	assert.equal(apply({ '!!': [[]] }), false);
	assert.deepEqual(apply({ missing: ['a', 'b'] }, { a: 1 }), ['b']);
});

test('text operators are case-sensitive; lower makes them case-insensitive', () => {
	const data = { values: { email: 'Ada@Example.com', zip: '2100' } };
	assert.equal(apply({ startsWith: [{ var: 'values.zip' }, '21'] }, data), true);
	assert.equal(apply({ endsWith: [{ var: 'values.email' }, '.com'] }, data), true);
	assert.equal(apply({ endsWith: [{ var: 'values.email' }, '@example.com'] }, data), false);
	assert.equal(apply({ endsWith: [{ lower: { var: 'values.email' } }, '@example.com'] }, data), true);
	assert.equal(apply({ in: ['example', { lower: { var: 'values.email' } }] }, data), true);
	assert.equal(apply({ startsWith: [2100, '21'] }), false);
	assert.equal(apply({ lower: 5 }), null);
	assert.equal(apply({ upper: 'ab' }), 'AB');
	assert.equal(apply({ trim: '  a ' }), 'a');
	assert.equal(apply({ length: 'æøå' }), 3);
	assert.equal(apply({ length: [[1, 2]] }), 2);
	assert.equal(apply({ length: 4 }), null);
	assert.equal(apply({ substr: ['2100', 0, 2] }), '21');
	assert.equal(apply({ substr: ['2100', -2] }), '00');
	assert.equal(apply({ substr: ['abcdef', 1, -1] }), 'bcde');
});

test('datePart reads year, month, day, ISO weekday and ISO week', () => {
	assert.equal(apply({ datePart: ['2026-10-28', 'year'] }), 2026);
	assert.equal(apply({ datePart: ['2026-10-28', 'month'] }), 10);
	assert.equal(apply({ datePart: ['2026-10-28', 'day'] }), 28);
	assert.equal(apply({ datePart: ['2026-10-28', 'weekday'] }), 3);
	assert.equal(apply({ datePart: ['2026-11-01', 'weekday'] }), 7);
	assert.equal(apply({ datePart: ['2026-10-28', 'week'] }), 44);
	assert.equal(apply({ datePart: ['2027-01-01', 'week'] }), 53);
	assert.equal(apply({ datePart: ['2026-02-30', 'day'] }), null);
	assert.equal(apply({ datePart: ['2026-10-28', 'hour'] }), null);
});

test('array operators run their logic per item', () => {
	const data = { values: { rows: [{ price: 10, qty: 2 }, { price: 5, qty: 1 }] } };
	const rows = { var: 'values.rows' };
	assert.deepEqual(apply({ map: [rows, { '*': [{ var: 'price' }, { var: 'qty' }] }] }, data), [20, 5]);
	assert.equal(apply({ sum: { map: [rows, { '*': [{ var: 'price' }, { var: 'qty' }] }] } }, data), 25);
	assert.equal(apply({ reduce: [rows, { '+': [{ var: 'accumulator' }, { var: 'current.qty' }] }, 0] }, data), 3);
	assert.equal(apply({ some: [rows, { '>': [{ var: 'price' }, 8] }] }, data), true);
	assert.equal(apply({ all: [rows, { '>': [{ var: 'price' }, 8] }] }, data), false);
	assert.equal(apply({ all: [[], true] }), false);
	assert.equal(apply({ none: [rows, { '>': [{ var: 'price' }, 80] }] }, data), true);
	assert.equal(apply({ length: { filter: [rows, { '<': [{ var: 'price' }, 8] }] } }, data), 1);
	assert.deepEqual(apply({ map: [null, { var: 'x' }] }), []);
	assert.equal(apply({ sum: [1, 2, 3] }), 6);
	assert.equal(apply({ sum: [[]] }), 0);
});

test('readsOf skips logic that reads array items', async () => {
	const { readsOf } = await import('../modules/logic.js');
	assert.deepEqual([...readsOf({ some: [{ var: 'values.rows' }, { '>': [{ var: 'price' }, 8] }] })], ['values.rows']);
});
