import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { insertSnippet, snippetProblems } from '../modules/snippets.js';
import { emptyForm, emptyRules, addField } from '../modules/model.js';
import { validate } from '../../form-rules/index.js';

const load = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));

test('a snippet is inserted with its rules, and validates', () => {
	const form = emptyForm('f');
	const result = insertSnippet(form, emptyRules('f'), load('../snippets/contact.json'), 'step-1');
	assert.deepEqual(result.fields, ['name', 'email', 'phone']);
	assert.deepEqual(result.rules.fields.rules.map(rule => rule.id), ['contact-way']);
	assert.deepEqual(validate(result.form, result.rules).errors, []);
});

test('taken ids are renamed, and rules and texts follow', () => {
	let form = emptyForm('f');
	({ form } = addField(form, 'step-1', 'Email'));
	const contact = load('../snippets/contact.json');
	contact.properties.name.description = 'We write to {values.email}';
	let rules = emptyRules('f');
	let result = insertSnippet(form, rules, contact, 'step-1');
	assert.deepEqual(result.renamed, { email: 'email2' });
	assert.deepEqual(result.rules.fields.rules[0].when, { and: [{ '!': { var: 'values.email2' } }, { '!': { var: 'values.phone' } }] });
	assert.deepEqual(result.rules.fields.rules[0].then, [{ require: ['email2'] }]);
	assert.equal(result.form.fields.properties.name.description, 'We write to {values.email2}');
	/* Twice: rule ids and every field id stay unique. */
	result = insertSnippet(result.form, result.rules, load('../snippets/contact.json'), 'step-1');
	assert.deepEqual(result.rules.fields.rules.map(rule => rule.id), ['contact-way', 'contact-way-2']);
	assert.deepEqual(validate(result.form, result.rules).errors, []);
});

test('every bundled snippet is well formed and validates on its own', () => {
	for (const name of ['address', 'contact', 'consent']) {
		const snippet = load(`../snippets/${name}.json`);
		assert.deepEqual(snippetProblems(snippet), [], name);
		const result = insertSnippet(emptyForm('f'), emptyRules('f'), snippet, 'step-1');
		assert.deepEqual(validate(result.form, result.rules).errors, [], name);
	}
	assert.ok(snippetProblems({ properties: {}, fields: ['x'] }).length === 2);
});

test('fields become a snippet with the rules that use only them', async () => {
	const { extractSnippet, insertSnippet: insert } = await import('../modules/snippets.js');
	const order = JSON.parse(readFileSync(new URL('../../form-rules/examples/order.form.json', import.meta.url), 'utf8'));
	const orderRules = JSON.parse(readFileSync(new URL('../../form-rules/examples/order.rules.json', import.meta.url), 'utf8'));
	const { snippet, skipped } = extractSnippet(order, orderRules, ['lines', 'items', 'subtotal'], { title: 'Order lines' });
	assert.equal(snippet.snippet, 'order-lines');
	assert.deepEqual(snippet.fields, ['lines', 'items', 'subtotal']);
	assert.ok(snippet.rules.some(rule => rule.id === 'cake-note'));
	assert.ok(snippet.variables.items, 'the variable a calculated field shows comes along');
	assert.ok(Array.isArray(skipped));
	const empty = { id: 'x', fields: { structure: { layout: [{ type: 'step', id: 'one', name: 'One', fields: [] }] }, properties: {} } };
	const result = insert(empty, { fields: { rules: [] } }, snippet, 'one');
	assert.deepEqual(result.fields, ['lines', 'items', 'subtotal']);
});
