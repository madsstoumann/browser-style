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

test('goto passes over steps, prefers the nearest target on a tie, and ignores a hidden target', () => {
	const three = {
		id: 'three',
		structure: { layout: [
			{ type: 'step', id: 'one', fields: ['a'] },
			{ type: 'step', id: 'two', fields: ['b'] },
			{ type: 'step', id: 'three', fields: ['c'] },
			{ type: 'step', id: 'four', hidden: true, fields: [] }
		] },
		properties: { a: { type: 'string' }, b: { type: 'string' }, c: { type: 'string' } }
	};
	const jump = to => ({ id: `to-${to}`, when: { '===': [{ var: 'values.a' }, 'x'] }, then: [{ goto: to }] });
	const rules = { rules: [jump('three'), jump('two')] };
	let state = evaluate(three, rules, { values: { a: 'x', b: 'kept in memory' } });
	assert.deepEqual(state.path, ['one', 'two', 'three']);
	assert.deepEqual(state.jumps, [{ from: 'one', to: 'two', rules: ['to-two'] }]);

	state = evaluate(three, { rules: [jump('three')] }, { values: { a: 'x', b: 'kept in memory' } });
	assert.deepEqual(state.path, ['one', 'three']);
	assert.equal('b' in state.values, false);

	state = evaluate(three, { rules: [jump('four')] }, { values: { a: 'x' } });
	assert.deepEqual(state.path, ['one', 'two', 'three']);
	assert.deepEqual(state.issues, [{ step: 'one', code: 'goto-target', target: 'four', rule: 'to-four' }]);
});

test('a tracked rule reports rule.enter and rule.leave on its edges only', () => {
	const rules = { id: 'r', rules: [
		{ id: 'long', track: true, when: { '>': [{ var: 'values.a' }, 'm'] }, then: [{ show: 'b' }] },
		{ id: 'quiet', when: true, then: [] }
	] };
	const tracks = state => state.effects.filter(effect => effect.type === 'track');
	const first = evaluate(form, rules, { values: { a: 'x' } });
	assert.deepEqual(tracks(first), [{ type: 'track', event: 'rule.enter', rule: 'long' }]);
	const again = evaluate(form, rules, { values: { a: 'y' }, previous: { matched: first.matched } });
	assert.deepEqual(tracks(again), []);
	const left = evaluate(form, rules, { values: { a: 'b' }, previous: { matched: again.matched } });
	assert.deepEqual(tracks(left), [{ type: 'track', event: 'rule.leave', rule: 'long' }]);
	assert.deepEqual(tracks(evaluate(form, rules, { values: { a: 'b' } })), []);
});
