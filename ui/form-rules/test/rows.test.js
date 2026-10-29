import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, validate } from '../index.js';

const form = {
	id: 'party',
	structure: { layout: [{ type: 'step', id: 'one', fields: ['guests', 'count'] }] },
	properties: {
		guests: {
			type: 'list', title: 'Guests',
			items: { properties: {
				name: { type: 'string', title: 'Name', required: true },
				child: { type: 'boolean', title: 'Child' },
				age: { type: 'integer', title: 'Age' },
				diet: { type: 'string', title: 'Diet' },
				seat: { type: 'string', title: 'Seat' }
			} }
		},
		count: { type: 'integer', title: 'Children', from: 'vars.children', ui: { widget: 'output' } }
	}
};

const rules = {
	id: 'party-rules',
	variables: { children: { type: 'number', compute: { sum: { map: [{ var: 'values.guests' }, { if: [{ var: 'age' }, 1, 0] }] } } } },
	rules: [
		{ id: 'child-age', forEach: 'guests', when: { '===': [{ var: 'row.child' }, true] }, then: [{ require: 'guests.age' }], else: [{ hide: 'guests.age' }] },
		{ id: 'first-seat', forEach: 'guests', when: { '===': [{ var: 'index' }, 0] }, then: [{ setValue: { field: 'guests.seat', value: 'head' } }] },
		{ id: 'teen', forEach: 'guests', when: { '>': [{ var: 'row.age' }, 12] }, then: [{ invalid: { field: 'guests.diet', code: 'teen', level: 'warning', message: 'Teens get the adult menu' } }] }
	]
};

test('row rules decide each row on its own', () => {
	const state = evaluate(form, rules, { values: { guests: [
		{ name: 'Ada', age: 40 },
		{ name: 'Bo', child: true },
		{ name: 'Cy', child: true, age: 14 }
	] } });
	assert.deepEqual(state.values.guests, [
		{ name: 'Ada', seat: 'head' },
		{ name: 'Bo', child: true },
		{ name: 'Cy', child: true, age: 14 }
	]);
	assert.equal(state.rows.guests[0].age.visible, false);
	assert.equal(state.rows.guests[1].age.required, true);
	assert.deepEqual(state.issues, [
		{ field: 'guests', row: 1, item: 'age', code: 'required' },
		{ field: 'guests', row: 2, item: 'diet', code: 'teen', message: 'Teens get the adult menu', level: 'warning', rule: 'teen' }
	]);
	assert.deepEqual(state.matched, ['child-age', 'first-seat', 'teen']);
	assert.deepEqual(state.explain['guests[0].age.visible'], ['child-age:else']);
});

test('a hidden cell is absent for other rules and variables', () => {
	const state = evaluate(form, rules, { values: { guests: [{ name: 'Ada', age: 40 }, { name: 'Bo', child: true, age: 6 }] } });
	assert.equal(state.vars.children, 1);
	assert.equal(state.values.count, 1);
});

test('validate checks row rules', () => {
	assert.deepEqual(validate(form, rules).errors, []);
	const bad = { ...rules, rules: [
		{ id: 'a', forEach: 'count', when: true, then: [] },
		{ id: 'b', forEach: 'guests', when: { var: 'row.colour' }, then: [{ hide: 'guests.diet' }] },
		{ id: 'c', forEach: 'guests', when: true, then: [{ hide: 'diet' }, { goto: 'one' }] },
		{ id: 'd', forEach: 'guests', when: { var: 'row.diet' }, then: [{ hide: 'guests.diet' }] },
		{ id: 'e', forEach: 'guests', when: { '>': [{ length: { var: 'values.guests' } }, 2] }, then: [{ disable: 'guests.seat' }] }
	] };
	const codes = validate(form, bad).errors.map(error => `${error.path}:${error.code}`);
	assert.deepEqual(codes, [
		'rules[0].forEach:row-rule',
		'rules[1].when:field',
		'rules[2].then[0]:field',
		'rules[2].then[1]:row-rule',
		'rules[3].then[0]:cycle',
		'rules[4].then[0]:cycle'
	]);
});
