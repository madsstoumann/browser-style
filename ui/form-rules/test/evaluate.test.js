import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate } from '../index.js';

const form = {
	id: 'tiny',
	structure: { layout: [
		{ type: 'step', id: 'one', fields: ['a', 'b'] },
		{ type: 'step', id: 'two', hidden: true, fields: ['c'] }
	] },
	properties: {
		a: { type: 'string' },
		b: { type: 'string', ui: { hidden: true } },
		c: { type: 'string' }
	}
};

test('the higher priority wins; on a tie the restrictive action wins', () => {
	const tie = evaluate(form, { id: 'r', rules: [
		{ id: 'show', when: true, then: [{ show: 'b' }] },
		{ id: 'hide', when: true, then: [{ hide: 'b' }] }
	] });
	assert.equal(tie.fields.b.visible, false);
	assert.deepEqual(tie.explain['b.visible'], ['hide']);

	const ranked = evaluate(form, { id: 'r', rules: [
		{ id: 'show', priority: 5, when: true, then: [{ show: 'b' }] },
		{ id: 'hide', when: true, then: [{ hide: 'b' }] }
	] });
	assert.equal(ranked.fields.b.visible, true);
});

test('hidden steps and fields stay out until a rule includes or shows them', () => {
	const base = evaluate(form, { id: 'r', rules: [] }, { values: { a: 'x', b: 'y', c: 'z' } });
	assert.deepEqual(base.path, ['one']);
	assert.deepEqual(base.values, { a: 'x' });

	const opened = evaluate(form, { id: 'r', rules: [
		{ id: 'open', when: { '===': [{ var: 'values.a' }, 'x'] }, then: [{ include: 'two' }, { show: 'b' }] }
	] }, { values: { a: 'x', b: 'y', c: 'z' } });
	assert.deepEqual(opened.path, ['one', 'two']);
	assert.deepEqual(opened.values, { a: 'x', b: 'y', c: 'z' });
});

test('a value hidden by one rule reads as absent in another, settling over passes', () => {
	const state = evaluate(form, { id: 'r', rules: [
		{ id: 'hide-a', when: true, then: [{ hide: 'a' }] },
		{ id: 'needs-a', when: { var: 'values.a' }, then: [{ include: 'two' }] }
	] }, { values: { a: 'x' } });
	assert.deepEqual(state.matched, ['hide-a']);
	assert.deepEqual(state.path, ['one']);
});

test('rules that keep flipping each other are refused instead of looping', () => {
	assert.throws(() => evaluate(form, { id: 'r', rules: [
		{ id: 'flip', when: { var: 'values.a' }, then: [{ hide: 'a' }] }
	] }, { values: { a: 'x' } }), /do not settle/);
});

test('emit can fire when a rule stops matching', () => {
	const rules = { id: 'r', rules: [{ id: 'watch', when: { var: 'values.a' }, then: [{ emit: { type: 'a.cleared', on: 'leave' } }] }] };
	assert.deepEqual(evaluate(form, rules, { values: { a: 'x' }, previous: { matched: [] } }).effects, []);
	assert.deepEqual(evaluate(form, rules, { values: {}, previous: { matched: ['watch'] } }).effects,
		[{ type: 'emit', rule: 'watch', event: 'a.cleared', data: null, where: 'any' }]);
});

test('plain (non-UCF) documents work the same', () => {
	const state = evaluate({ ...form }, { id: 'r', rules: [{ id: 'req', when: true, then: [{ require: 'a' }] }] });
	assert.deepEqual(state.issues, [{ field: 'a', code: 'required' }]);
});
