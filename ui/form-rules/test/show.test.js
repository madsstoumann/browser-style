import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { evaluate, fillText, textData, validate } from '../index.js';

const example = name => JSON.parse(readFileSync(new URL(`../examples/${name}`, import.meta.url), 'utf8'));
const form = example('drug-ticket.form.json');
const rules = example('drug-ticket.rules.json');

/* The original calculator's logic, to compare with the example built from notes, cases and showWhen. */
function original(income, drug, level, over3) {
	const thc = drug === 'cannabis';
	const low = thc && level === 'low';
	const medium = thc && level === 'medium';
	const total = Math.max(500, Math.round(income / 25 / (low ? 2 : 1))) + 20 + (thc ? 300 : 400) + (low ? 0 : 780);
	const sanctions = [low, medium && !over3, medium && over3, !low && !medium, !low, !low];
	return { total, rounded: Math.round(total / 10) * 10, license: medium, level: thc, cases: sanctions.flatMap((on, i) => (on ? [i] : [])) };
}

test('the drug-ticket example validates and matches the original for every combination', () => {
	assert.deepEqual(validate(form, rules).errors, []);
	for (const income of [0, 12345, 50000, 200000]) for (const drug of ['cannabis', 'opioids', 'nitrous', 'other']) for (const level of ['low', 'medium', 'high']) for (const over3 of [true, false]) {
		const state = evaluate(form, rules, { values: { income, drug, thcLevel: level, licenseYears: over3 ? 'over3' : 'under3' } });
		const expected = original(income, drug, level, over3);
		const at = `${income} ${drug} ${level} ${over3}`;
		assert.equal(state.values.total, expected.total, at);
		assert.equal(state.values.headline, expected.rounded, at);
		assert.equal(state.fields.licenseYears.visible, expected.license, at);
		assert.equal(state.fields.thcLevel.visible, expected.level, at);
		assert.deepEqual(state.fields.sanctions.cases, expected.cases, at);
	}
});

test('showWhen hides a field as a rule of its own, and explain names it', () => {
	const state = evaluate(form, rules, { values: { drug: 'cocaine' } });
	assert.equal(state.fields.thcLevel.visible, false);
	assert.deepEqual(state.explain['thcLevel.visible'], ['showWhen:thcLevel']);
	assert.ok(!('thcLevel' in state.values), 'a hidden field is not submitted');
	const inline = structuredClone(form);
	inline.fields.properties.thcLevel.showWhen = { '===': [{ var: 'values.drug' }, 'cannabis'] };
	assert.equal(evaluate(inline, rules, { values: { drug: 'cannabis' } }).fields.thcLevel.visible, true);
});

test('showWhen on a step skips it', () => {
	const two = { properties: { a: { type: 'boolean' }, b: { type: 'string' } }, structure: { layout: [
		{ type: 'step', id: 'one', fields: ['a'] }, { type: 'step', id: 'two', fields: ['b'], showWhen: { var: 'values.a' } }] } };
	assert.deepEqual(evaluate(two, { rules: [] }, { values: {} }).path, ['one']);
	assert.deepEqual(evaluate(two, { rules: [] }, { values: { a: true } }).path, ['one', 'two']);
	assert.deepEqual(validate(two, { rules: [] }).errors, []);
});

test('cases: all matching or only the first; none when the text block is hidden', () => {
	const first = structuredClone(form);
	first.fields.properties.sanctions.show = 'first';
	assert.deepEqual(evaluate(first, rules, { values: { drug: 'cannabis', thcLevel: 'high' } }).fields.sanctions.cases, [3]);
	first.fields.properties.sanctions.showWhen = 'isThc';
	assert.deepEqual(evaluate(first, rules, { values: { drug: 'other' } }).fields.sanctions.cases, []);
});

test('the chosen choice\'s note, also as {values.x.note}', () => {
	const state = evaluate(form, rules, { values: { drug: 'other' } });
	assert.equal(state.notes.drug, 'E.g.: amphetamine, ecstasy, benzodiazepines, ketamine etc.');
	assert.ok(!('thcLevel' in state.notes), 'a hidden field has no note');
	assert.equal(fillText('Note: {values.drug.note}', textData(state)), 'Note: E.g.: amphetamine, ecstasy, benzodiazepines, ketamine etc.');
	assert.equal(evaluate(form, rules, { values: { drug: 'cocaine' } }).notes.drug, undefined);
	const multiple = { properties: { x: { type: 'select', options: { multiple: true, choices: [{ value: 'a', note: 'A' }, { value: 'b' }, { value: 'c', note: 'C' }] } } }, structure: { layout: [{ type: 'step', id: 's', fields: ['x'] }] } };
	assert.deepEqual(evaluate(multiple, { rules: [] }, { values: { x: ['a', 'c'] } }).notes.x, ['A', 'C']);
});

test('validation of notes, cases and showWhen', () => {
	const broken = structuredClone(form);
	const p = broken.fields.properties;
	p.thcLevel.showWhen = 'unknownCondition';
	p.sanctions.show = 'some';
	p.sanctions.cases.push({ content: 'No condition' }, { when: { '==': [1, 1] }, content: 'x' }, { when: 'lowThc', content: '{values.nope}' });
	p.drug.options.choices[0].note = '{values.income.note}';
	p.fine.cases = [];
	const codes = validate(broken, rules).errors.map(error => `${error.code} ${error.path}`);
	assert.deepEqual(codes, [
		'placeholder properties.drug.options.choices[0].note',
		'cases properties.sanctions.show',
		'cases properties.sanctions.cases[6].when',
		'placeholder properties.sanctions.cases[8].content',
		'cases properties.fine.cases',
		'variable properties.thcLevel.showWhen',
		'operator properties.sanctions.cases[7].when'
	]);
});
