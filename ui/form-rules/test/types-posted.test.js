import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, hasValueType } from '../index.js';

/* A server re-check gets whatever was posted: a value of the wrong JSON type is refused, not stored. */
const form = {
	id: 'f',
	properties: {
		email: { type: 'string', validation: { pattern: '[^@]+@[^@]+', maxLength: 40 } },
		age: { type: 'integer', validation: { minimum: 18 } },
		amount: { type: 'number' },
		agree: { type: 'boolean' },
		plan: { type: 'select', options: { choices: ['a', 'b'] } },
		extras: { type: 'select', options: { multiple: true, choices: ['x', 'y'] } },
		note: {},
		campaign: { type: 'string', ui: { widget: 'hidden' }, from: 'context.campaign' }
	},
	structure: { layout: [{ type: 'step', id: 'one', fields: ['email', 'age', 'amount', 'agree', 'plan', 'extras', 'note', 'campaign'] }] }
};
const run = values => evaluate(form, { rules: [] }, { values });
const typeIssues = state => state.issues.filter(issue => issue.code === 'type').map(issue => issue.field).sort();

test('well-typed answers pass', () => {
	const state = run({ email: 'a@x.dk', age: 30, amount: 1.5, agree: true, plan: 'a', extras: ['x'], note: 'hi' });
	assert.deepEqual(typeIssues(state), []);
	assert.equal(state.values.email, 'a@x.dk');
});

test('an array for a text field is refused and not submitted, so its pattern cannot be skipped', () => {
	const state = run({ email: ['a@x.dk', 'b@y.dk'] });
	assert.deepEqual(typeIssues(state), ['email']);
	assert.equal('email' in state.values, false);
});

test('numbers, yes/no, choices and plain fields are held to their type', () => {
	const state = run({ age: '30', amount: 'NaN', agree: 'yes', plan: ['a'], extras: 'x', note: { a: 1 } });
	assert.deepEqual(typeIssues(state), ['age', 'agree', 'amount', 'extras', 'note', 'plan']);
	assert.deepEqual(run({ age: 17.5 }).issues.map(issue => issue.code), ['type'], 'a fraction is not an integer, and its range is not checked');
});

test('a text field prefilled from a number keeps it as text', () => {
	const state = evaluate(form, { rules: [] }, { values: {}, context: { campaign: 2026 } });
	assert.equal(state.values.campaign, '2026');
	assert.deepEqual(typeIssues(state), []);
});

test('hasValueType() for files', () => {
	assert.equal(hasValueType({ type: 'file' }, [{ name: 'a.pdf', size: 1, type: 'application/pdf' }]), true);
	assert.equal(hasValueType({ type: 'file' }, 'a.pdf'), false);
});
