import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, serverContextKeys, trustedContext, validate } from '../index.js';

const rules = {
	context: { segment: { from: 'server' }, campaign: { from: 'page' } },
	variables: { rate: { type: 'number', compute: { if: [{ '===': [{ var: 'context.segment' }, 'gold'] }, 2, 5] } } },
	rules: []
};

test('serverContextKeys lists the keys only the server may supply', () => {
	assert.deepEqual(serverContextKeys(rules), ['segment']);
	assert.deepEqual(serverContextKeys({ rules: [] }), []);
	assert.deepEqual(serverContextKeys({ id: 'r', model: 'form-rules', fields: rules }), ['segment'], 'UCF-wrapped');
});

test('a key declared from the server is never taken from the page', () => {
	assert.deepEqual(trustedContext(rules, { page: { segment: 'gold', campaign: 'spring', channel: 'web' } }), { campaign: 'spring', channel: 'web' });
	assert.deepEqual(trustedContext(rules, { page: { segment: 'gold' }, server: { segment: 'basic' } }), { segment: 'basic' });
});

test('a key the server supplies wins, declared or not', () => {
	assert.deepEqual(trustedContext({ rules: [] }, { page: { user: { signedIn: true }, channel: 'web' }, server: { user: { signedIn: false } } }), { channel: 'web', user: { signedIn: false } });
});

test('odd input gives an empty or partial context, never a polluted one', () => {
	assert.deepEqual(trustedContext(rules, { page: null, server: 'x' }), {});
	assert.deepEqual(trustedContext(rules, { page: [1, 2] }), {});
	const page = JSON.parse('{"__proto__": {"segment": "gold"}, "channel": "web"}');
	const context = trustedContext(rules, { page });
	assert.deepEqual(Object.keys(context), ['channel']);
	assert.equal(context.segment, undefined);
});

test('a variable computed from a server key ignores a forged page value', () => {
	const form = { id: 'f', properties: { name: { type: 'string' } }, structure: { layout: [{ type: 'step', id: 'one', fields: ['name'] }] } };
	assert.equal(evaluate(form, rules, { context: { segment: 'gold' } }).vars.rate, 2, 'the browser trusts its page');
	assert.equal(evaluate(form, rules, { context: trustedContext(rules, { page: { segment: 'gold' } }) }).vars.rate, 5, 'the server does not');
});

test('validate() checks the context declaration', () => {
	const form = { id: 'f', properties: { name: { type: 'string' } }, structure: { layout: [{ type: 'step', id: 'one', fields: ['name'] }] } };
	assert.equal(validate(form, rules).valid, true);
	const result = validate(form, { context: { segment: { from: 'cookie' }, 'bad-key': {} }, rules: [] });
	assert.deepEqual(result.errors.map(error => error.code), ['context', 'context']);
});
