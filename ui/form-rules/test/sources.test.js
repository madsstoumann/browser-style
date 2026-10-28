import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, validate } from '../index.js';

const form = {
	id: 'address',
	structure: { layout: [{ type: 'step', id: 'one', fields: ['country', 'city', 'street'] }] },
	properties: {
		country: { type: 'select', options: { choices: [{ value: 'dk', label: 'Denmark' }, { value: 'se', label: 'Sweden' }] } },
		city: { type: 'select', title: 'City', options: { source: 'cities' } },
		street: { type: 'string', title: 'Street', ui: { widget: 'suggest' }, options: { source: 'streets' } }
	}
};
const rules = {
	id: 'address-rules',
	services: {
		cities: { url: '/api/cities.json', method: 'GET', send: ['country'] },
		streets: { url: '/api/streets', method: 'GET', send: ['city'] }
	},
	rules: [{ id: 'no-malmo', when: true, then: [{ options: { field: 'city', exclude: ['malmo'] } }] }]
};

test('a sourced list is asked for with the answers it depends on', () => {
	const state = evaluate(form, rules, { values: { country: 'dk' } });
	const asks = state.effects.filter(effect => effect.type === 'options');
	assert.deepEqual(asks, [{ type: 'options', field: 'city', service: 'cities', url: '/api/cities.json', send: { country: 'dk' }, key: 'cities:{"country":"dk"}' }]);
	assert.equal(state.fields.city.options, null);
	assert.deepEqual(validate(form, rules).errors, []);
});

test('the fetched list is checked like static choices, and rules can narrow it', () => {
	const choices = { city: [{ value: 'cph', label: 'Copenhagen' }, { value: 'malmo', label: 'Malmö' }] };
	const ok = evaluate(form, rules, { values: { country: 'dk', city: 'cph' }, choices });
	assert.deepEqual(ok.fields.city.options, ['cph']);
	assert.equal(ok.values.city, 'cph');
	const gone = evaluate(form, rules, { values: { country: 'dk', city: 'malmo' }, choices });
	assert.deepEqual(gone.issues, [{ field: 'city', code: 'option-unavailable' }]);
	/* Without the list (a server that did not fetch it) the answer is only type-checked. */
	assert.equal(evaluate(form, rules, { values: { city: 'anything' } }).values.city, 'anything');
});

test('sources must name a service', () => {
	const bad = structuredClone(form);
	bad.properties.city.options.source = 'nope';
	bad.properties.street.type = 'number';
	assert.deepEqual(validate(bad, rules).errors.map(error => error.code), ['service', 'options']);
});
