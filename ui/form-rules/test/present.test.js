import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, normalizeForm, presentOf, validate } from '../index.js';

const form = {
	id: 'calc',
	structure: {
		present: { mode: 'page', submit: false },
		layout: [
			{ type: 'step', id: 'ask', fields: ['qty'] },
			{ type: 'panel', id: 'result', name: 'Result', fields: ['total', 'note'] }
		]
	},
	properties: {
		qty: { type: 'integer' },
		total: { type: 'number', title: 'Total', from: 'vars.total', ui: { widget: 'output' } },
		note: { type: 'content', content: 'You pay {values.total}.' }
	}
};
const rules = {
	id: 'calc-rules',
	variables: { total: { type: 'number', compute: { '*': [{ var: 'values.qty' }, 10] } } },
	rules: [{ id: 'none-yet', when: { '!': { var: 'values.qty' } }, then: [{ skip: 'result' }] }]
};

test('structure.present has defaults and keeps known values', () => {
	assert.deepEqual(presentOf({}), { mode: 'steps', advance: 'manual', submit: true });
	assert.deepEqual(presentOf(form), { mode: 'page', advance: 'manual', submit: false });
	assert.deepEqual(presentOf({ structure: { present: { mode: 'nope', advance: 'auto' } } }), { mode: 'steps', advance: 'auto', submit: true });
});

test('a panel is not a step: never on the path, its fields are shown and calculated', () => {
	const normalized = normalizeForm(form);
	assert.deepEqual(normalized.steps.map(step => step.id), ['ask']);
	assert.deepEqual(normalized.panels.map(panel => [panel.id, panel.place]), [['result', 'aside']]);
	const state = evaluate(form, rules, { values: { qty: 3 } });
	assert.deepEqual(state.path, ['ask']);
	assert.equal(state.panels[0].visible, true);
	assert.equal(state.fields.total.visible, true);
	assert.equal(state.values.total, 30);
	assert.deepEqual(validate(form, rules).errors, []);
});

test('skip hides a panel and its calculated values', () => {
	const state = evaluate(form, rules, { values: {} });
	assert.equal(state.panels[0].visible, false);
	assert.equal(state.fields.total.visible, false);
	assert.equal(state.values.total, undefined);
	assert.deepEqual(state.explain['step:result'], ['none-yet']);
});

test('validate: panels hold no questions, ids are unique, settings are known', () => {
	const question = structuredClone(form);
	question.structure.layout[1].fields.push('qty');
	assert.ok(validate(question, rules).errors.some(error => error.code === 'duplicate'));
	question.properties.extra = { type: 'string' };
	question.structure.layout[1].fields = ['extra'];
	assert.ok(validate(question, rules).errors.some(error => error.code === 'panel'));
	const clash = structuredClone(form);
	clash.structure.layout[1].id = 'ask';
	assert.ok(validate(clash, rules).errors.some(error => error.code === 'duplicate'));
	const bad = structuredClone(form);
	bad.structure.present = { mode: 'slides', submit: 'no' };
	bad.structure.layout[1].place = 'left';
	const codes = validate(bad, rules).errors.map(error => error.code);
	assert.equal(codes.filter(code => code === 'present').length, 2);
	assert.ok(codes.includes('panel'));
});
