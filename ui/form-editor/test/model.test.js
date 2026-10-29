import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseCondition, serializeCondition, summarize } from '../modules/conditions.js';
import { addField, addNamedCondition, copyRule, fieldsOfRule, pasteRule, addStep, emptyForm, emptyRules, fieldId, nameCondition, newRule, renameField, renameStep, rulesUsingField, slugify, usesOfVariable } from '../modules/model.js';
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
	assert.deepEqual(validate(result.form, result.rules), { valid: true, errors: [], warnings: [] });
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
	assert.equal(summarize(form, health, rules), 'When Is senior customer: fetch extra steps from health after Your cover.');
	assert.equal(summarize(form, { when: true, then: [{ goto: { step: 'review', from: 'you' } }] }), 'Always: go to Review after About you.');
});

test('text operators ignore case unless match case is on, and survive a round trip', () => {
	const contains = { in: ['example', { lower: { var: 'values.zip' } }] };
	const node = parseCondition(contains).items[0];
	assert.deepEqual([node.op, node.value, node.matchCase], ['contains', 'example', false]);
	assert.deepEqual(serializeCondition(parseCondition(contains)), contains);
	const starts = { startsWith: [{ var: 'values.zip' }, 'DK'] };
	assert.deepEqual(serializeCondition(parseCondition(starts)), starts);
	assert.equal(parseCondition(starts).items[0].matchCase, true);
	const not = { '!': { in: ['x', { lower: { var: 'values.zip' } }] } };
	assert.equal(parseCondition(not).items[0].op, 'notcontains');
	assert.deepEqual(serializeCondition(parseCondition(not)), not);
	const typed = { kind: 'group', mode: 'and', wrapped: true, items: [{ kind: 'cond', path: 'values.zip', num: false, op: 'endsWith', value: 'AB' }] };
	assert.deepEqual(serializeCondition(typed), { endsWith: [{ lower: { var: 'values.zip' } }, 'ab'] });
	assert.equal(summarize(form, { when: starts, then: [] }), 'When Zip code starts with “DK” (match case): do nothing.');
	/* Upper-case text against a lowered field could never match, so it stays raw. */
	assert.equal(parseCondition({ startsWith: [{ lower: { var: 'values.zip' } }, 'DK'] }).items[0].kind, 'raw');
});

test('a field can be compared with another field', () => {
	const logic = { '>': [{ num: { var: 'values.zip' } }, { num: { var: 'values.age' } }] };
	const node = parseCondition(logic).items[0];
	assert.deepEqual([node.path, node.other, node.num], ['values.zip', 'values.age', true]);
	assert.deepEqual(serializeCondition(parseCondition(logic)), logic);
	assert.match(summarize(form, { when: { '===': [{ var: 'values.plan' }, { var: 'values.zip' }] }, then: [] }), /^When Plan is Zip code/);
});

test('row rules read as sentences and follow a renamed list', () => {
	const order = load('../../form-rules/examples/order.form.json');
	const orderRules = load('../../form-rules/examples/order.rules.json');
	const cake = orderRules.fields.rules.find(r => r.id === 'cake-note');
	assert.deepEqual(serializeCondition(parseCondition(cake.when)), cake.when);
	assert.match(summarize(order, cake), /^For each row of [^:]+: when Product is Cake: make Note for the baker required\. Otherwise hide Note for the baker\.$/);
	const result = renameField(order, orderRules, 'lines', 'basket');
	const renamed = result.rules.fields.rules.find(r => r.id === 'cake-note');
	assert.equal(renamed.forEach, 'basket');
	assert.deepEqual(renamed.then, [{ require: 'basket.note' }]);
	assert.ok(rulesUsingField(orderRules, 'lines').includes('many-cakes'));
	assert.deepEqual(validate(result.form, result.rules).errors, []);
});

test('a condition can be named, and rules read it by its name', () => {
	const result = nameCondition(rules, 'senior-north', 'Older and north');
	assert.equal(result.name, 'olderAndNorth');
	const rule = result.rules.fields.rules.find(r => r.id === 'senior-north');
	assert.deepEqual(rule.when, { '===': [{ var: 'vars.olderAndNorth' }, true] });
	assert.deepEqual(result.rules.fields.variables.olderAndNorth.compute, rules.fields.rules[0].when);
	assert.match(summarize(form, rule, result.rules), /^When Older and north: /);
	assert.match(summarize(form, { when: { '===': [{ var: 'vars.isSenior' }, false] }, then: [] }, rules), /^When not Is senior customer:/);
	assert.deepEqual(usesOfVariable(result.rules, 'olderAndNorth'), ['senior-north']);
	assert.deepEqual(validate(form, result.rules).errors, []);
	const added = addNamedCondition(rules, 'Is senior customer');
	assert.equal(added.name, 'isSeniorCustomer');
	assert.equal(added.rules.fields.variables.isSeniorCustomer.compute, true);
});

test('a rule is copied with what it needs and pasted into another form', () => {
	const copied = copyRule(rules, 'senior-health');
	assert.deepEqual(Object.keys(copied.variables), ['isSenior']);
	assert.deepEqual(Object.keys(copied.services), ['health']);
	assert.deepEqual(fieldsOfRule(rules.fields.rules[0]).sort(), ['ageGroup', 'plan', 'zip']);
	const again = pasteRule(form, rules, copied);
	assert.equal(again.id, 'senior-health-2');
	assert.deepEqual(again.missing, []);
	const other = emptyForm('other');
	const pasted = pasteRule(other, emptyRules('other'), copied);
	assert.deepEqual(pasted.rules.fields.rules.map(rule => rule.id), ['senior-health']);
	assert.deepEqual(pasted.missing, ['ageGroup'], 'read through the named condition');
	assert.deepEqual(pasted.rules.fields.variables.isSenior, rules.fields.variables.isSenior);
	assert.deepEqual(pasteRule(other, emptyRules('other'), copyRule(rules, 'senior-north')).missing.sort(), ['ageGroup', 'plan', 'zip']);
});
