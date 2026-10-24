import { test } from 'node:test';
import assert from 'node:assert/strict';
import { daysBetween, yearsBetween } from '../modules/dates.js';
import { apply, FUNCTIONS } from '../modules/logic.js';
import CHECKS, { cprDate } from '../examples/functions/checks.js';

test('example function dk-cpr checks the date strictly and only warns on modulus 11', () => {
	assert.equal(CHECKS['dk-cpr']('070761-4285'), null);
	assert.equal(CHECKS['dk-cpr']('2902011234').code, 'dk-cpr');
	assert.equal(CHECKS['dk-cpr']('12345').code, 'dk-cpr');
	assert.deepEqual(CHECKS['dk-cpr']('0101011234').level, 'warning');
	assert.equal(cprDate('0707614285'), '1961-07-07');
	assert.equal(cprDate('0101104000'), '2010-01-01');
	assert.equal(cprDate('0101585000'), '1858-01-01');
});

test('dk-cvr, luhn and iban', () => {
	assert.equal(CHECKS['dk-cvr']('10150817'), null);
	assert.equal(CHECKS['dk-cvr']('12345678').code, 'dk-cvr');
	assert.equal(CHECKS.luhn('4111 1111 1111 1111'), null);
	assert.equal(CHECKS.luhn('4111111111111112').code, 'luhn');
	assert.equal(CHECKS.iban('DK50 0040 0440 1162 43'), null);
	assert.equal(CHECKS.iban('DK5000400440116244').code, 'iban');
});

test('date helpers take today as input; host functions work as operators and checks', () => {
	assert.equal(yearsBetween('2000-10-25', '2026-10-24'), 25);
	assert.equal(yearsBetween('2000-10-24', '2026-10-24'), 26);
	assert.equal(daysBetween('2026-10-24', '2026-10-20'), -4);
	assert.equal(yearsBetween('2026-02-30', '2026-10-24'), null);
	const data = { values: { cpr: '070761-4285' }, today: '2026-10-24', [FUNCTIONS]: CHECKS };
	assert.equal(apply({ yearsBetween: [{ cprDate: { var: 'values.cpr' } }, { var: 'today' }] }, data), 65);
	assert.equal(apply({ check: ['dk-cpr', { var: 'values.cpr' }] }, data), true);
	assert.throws(() => apply({ check: ['nope', 'x'] }, data), /Unknown function/);
	assert.throws(() => apply({ cprDate: '0707614285' }, { values: {} }), /Unknown operator/);
});
