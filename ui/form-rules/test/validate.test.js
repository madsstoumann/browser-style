import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validate } from '../index.js';

const load = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const form = load('../examples/insurance.form.json');
const rules = load('../examples/insurance.rules.json');
const withRules = (...extra) => ({ ...rules.fields, id: rules.id, rules: [...rules.fields.rules, ...extra] });
const codes = result => result.errors.map(error => error.code);

test('the insurance example is valid', () => {
	assert.deepEqual(validate(form, rules), { valid: true, errors: [] });
});

test('unknown fields, steps, actions and operators are reported', () => {
	const result = validate(form, withRules({
		id: 'broken',
		when: { '==': [{ var: 'values.nope' }, 1] },
		then: [{ show: 'ghost' }, { skip: 'nowhere' }, { explode: true }]
	}));
	assert.equal(result.valid, false);
	assert.deepEqual(codes(result).sort(), ['action', 'field', 'field', 'operator', 'step']);
});

test('options must exist and services must be declared', () => {
	const result = validate(form, withRules({
		id: 'bad-options',
		when: true,
		then: [{ options: { field: 'plan', only: ['gold'] } }, { fetch: { service: 'missing', into: 'cover.nowhere' } }]
	}));
	assert.deepEqual(codes(result).sort(), ['options', 'service', 'slot']);
});

test('duplicate rule ids and variables outside the inputs are reported', () => {
	const result = validate(form, withRules(
		{ id: 'senior-north', when: { var: 'secret.x' }, then: [] }
	));
	assert.deepEqual(codes(result).sort(), ['duplicate', 'variable']);
});

test('a rule may not read a field that setValue writes', () => {
	const result = validate(form, withRules({ id: 'reads-plan', when: { var: 'values.plan' }, then: [{ require: 'email' }] }));
	assert.deepEqual(codes(result), ['cycle']);
});

test('visibility loops between fields are reported', () => {
	const result = validate(form, withRules(
		{ id: 'a', when: { var: 'values.email' }, then: [{ hide: 'zip' }] },
		{ id: 'b', when: { var: 'values.zip' }, then: [{ hide: 'email' }] }
	));
	assert.ok(codes(result).includes('cycle'));
});

test('a form without steps is reported', () => {
	const result = validate({ id: 'empty', structure: { layout: [] }, properties: {} }, { id: 'r', rules: [] });
	assert.deepEqual(codes(result), ['form-steps']);
});

test('goto must target a known step after the step it jumps from', () => {
	const result = validate(form, withRules(
		{ id: 'back', when: { '!!': { var: 'values.addOns' } }, then: [{ goto: 'you' }] },
		{ id: 'no-read', when: { '===': [{ var: 'context.channel' }, 'x'] }, then: [{ goto: 'review' }] },
		{ id: 'ghost', when: { '!!': { var: 'values.addOns' } }, then: [{ goto: 'nowhere' }] },
		{ id: 'explicit', when: { '===': [{ var: 'context.channel' }, 'x'] }, then: [{ goto: { step: 'review', from: 'where' } }] }
	));
	assert.deepEqual(codes(result).sort(), ['goto', 'goto', 'step']);
});

test('a fetch may name a step to insert after, which must exist', () => {
	const result = validate(form, withRules(
		{ id: 'data-only', when: true, then: [{ fetch: { service: 'offers' } }, { fetch: { service: 'health', after: 'ghost' } }] }
	));
	assert.deepEqual(codes(result).sort(), ['step']);
});

test('variables must be declared, and rules may not write computed ones or feed their own input', () => {
	const result = validate(form, {
		...rules.fields, id: rules.id,
		variables: { score: { type: 'number', initial: 0 }, age: { compute: { yearsBetween: ['2000-01-01', { var: 'today' }] } } },
		rules: [...rules.fields.rules,
			{ id: 'ghost-var', when: { '>': [{ var: 'vars.nope' }, 1] }, then: [] },
			{ id: 'write-computed', when: true, then: [{ set: { var: 'age', value: 3 } }] },
			{ id: 'loop', when: { '>': [{ var: 'vars.score' }, 1] }, then: [{ add: { var: 'score', value: 1 } }] },
			{ id: 'no-message', when: true, then: [{ invalid: { field: 'zip' } }] }]
	});
	assert.deepEqual(codes(result).sort(), ['cycle', 'invalid', 'variable', 'variable']);
});
