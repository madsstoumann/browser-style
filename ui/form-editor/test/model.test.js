import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseCondition, serializeCondition, summarize } from '../modules/conditions.js';
import { addField, addStep, emptyForm, emptyRules, fieldId, newRule, renameField, renameStep, rulesUsingField, slugify } from '../modules/model.js';
import { validate } from '../../form-rules/index.js';

const load = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const form = load('../../form-rules/examples/insurance.form.json');
const rules = load('../../form-rules/examples/insurance.rules.json');

test('every example condition survives a round trip through the builder', () => {
	for (const rule of rules.fields.rules) {
		assert.deepEqual(serializeCondition(parseCondition(rule.when)), rule.when, rule.id);
	}
});

test('conditions the builder can draw become rows; others stay raw', () => {
	const tree = parseCondition(rules.fields.rules[0].when);
	assert.deepEqual(tree.items.map(item => [item.kind, item.op, item.num]), [['cond', '>=', false], ['cond', '>', true]]);
	const roadside = parseCondition(rules.fields.rules.find(r => r.id === 'roadside-region').when);
	assert.equal(roadside.items[0].kind, 'raw');
	assert.deepEqual(parseCondition({ '!': { in: [{ var: 'values.zip' }, ['1000', '2000']] } }).items[0].op, 'notin');
});

test('rules read as sentences', () => {
	assert.equal(summarize(form, rules.fields.rules[0]),
		'When Age group is at least 30–49 and Zip code is above 2000: offer only Plus, Senior in Plan, fetch extra fields from offers into cover.extra, send the event quote.segment. Otherwise offer only Basic, Plus in Plan.');
	assert.equal(summarize(form, { id: 'x', when: { and: [] }, then: [] }), 'Always: do nothing.');
});

test('ids are generated from names', () => {
	assert.equal(slugify('Over 30, zip > 2000'), 'over-30-zip-2000');
	assert.equal(slugify('Step', ['step']), 'step-2');
	assert.equal(fieldId('Zip code'), 'zipCode');
	assert.equal(fieldId('Zip code', ['zipCode']), 'zipCode2');
});

test('renaming a field updates steps, rules and services', () => {
	const result = renameField(form, rules, 'zip', 'postcode');
	assert.equal(result.renamed, true);
	assert.ok(result.form.fields.properties.postcode);
	assert.deepEqual(result.rules.fields.services.offers.send, ['ageGroup', 'postcode']);
	assert.deepEqual(validate(result.form, result.rules), { valid: true, errors: [] });
	assert.deepEqual(rulesUsingField(result.rules, 'postcode'), ['senior-north', 'roadside-region', 'outside-area']);
	assert.equal(renameField(form, rules, 'zip', 'plan').renamed, false);
});

test('renaming a step updates skip actions', () => {
	const result = renameStep(form, rules, 'review', 'check');
	assert.deepEqual(result.rules.fields.rules.find(r => r.id === 'partner-skips-review').then, [{ skip: 'check' }]);
	assert.deepEqual(validate(result.form, result.rules).errors, []);
});

test('a new form, step, field and rule validate', () => {
	let doc = emptyForm('form-test');
	({ form: doc } = addStep(doc, 'Contact'));
	({ form: doc } = addField(doc, 'contact', 'Email address'));
	let ruleSet = emptyRules('form-test');
	({ rules: ruleSet } = newRule(ruleSet, 'Always require email'));
	ruleSet.fields.rules[0].then = [{ require: 'emailAddress' }];
	assert.deepEqual(validate(doc, ruleSet).errors, []);
});

test('goto and step-inserting fetches read as sentences', () => {
	const goto = rules.fields.rules.find(rule => rule.id === 'outside-area');
	assert.equal(summarize(form, goto), 'When Zip code is at least 9000: go to Review.');
	const health = rules.fields.rules.find(rule => rule.id === 'senior-health');
	assert.equal(summarize(form, health), 'When Age group is at least 50+: fetch extra steps from health after Your cover.');
	assert.equal(summarize(form, { when: true, then: [{ goto: { step: 'review', from: 'you' } }] }), 'Always: go to Review after About you.');
});
