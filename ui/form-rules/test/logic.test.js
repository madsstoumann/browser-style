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
