import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { evaluate, validate } from '../index.js';

const load = name => JSON.parse(readFileSync(new URL(`../examples/${name}`, import.meta.url)));
const form = load('bmi.form.json');
const rules = load('bmi.rules.json');
const names = ['underweight', 'normal', 'preObesity', 'obese1', 'obese2', 'obese3'];
const run = (height, weight) => evaluate(form, rules, { values: { height, weight } });

test('the BMI example is valid', () => {
	assert.deepEqual(validate(form, rules), { valid: true, errors: [], warnings: [] });
});

test('BMI is weight over height in metres squared, rounded to two places', () => {
	assert.equal(run(180, 75).vars.bmi, 23.15);
	assert.equal(run(200, 35.9).vars.bmi, 8.98, 'an exact half rounds up');
});

test('exactly one category holds, and the text block shows it', () => {
	for (const [height, weight, expected] of [
		[150, 41.6, 'underweight'], [180, 59.9, 'underweight'], [200, 74, 'normal'], [150.5, 56.6, 'normal'],
		[200, 100, 'preObesity'], [152, 69.3, 'preObesity'], [200, 120, 'obese1'], [200, 140, 'obese2'], [150, 200, 'obese3']
	]) {
		const state = run(height, weight);
		const holding = names.filter(name => state.vars[name] === true);
		assert.deepEqual(holding, [expected], `${height} cm, ${weight} kg (BMI ${state.vars.bmi})`);
		assert.deepEqual(state.fields.category.cases, [names.indexOf(expected)]);
	}
});
