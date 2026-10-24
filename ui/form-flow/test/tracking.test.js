import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FlowTracking } from '../tracking.js';
import { beacon, combine, toDataLayer } from '../trackers/index.js';

const state = (extra = {}) => ({
	form: 'f', rules: 'r', version: 2, path: ['a', 'b', 'c'], jumps: [], patches: [], values: {}, issues: [],
	fields: { name: { step: 'a' }, plan: { step: 'b' } }, ...extra
});

test('a run is a session of ordered events with ids, never typed values', () => {
	const events = [];
	const properties = { plan: { type: 'select', track: true }, name: { type: 'string' } };
	const tracking = new FlowTracking(event => events.push(event), {
		contextOf: () => ({ channel: 'mail', email: 'x@y.z' }),
		propertyOf: id => properties[id]
	});
	tracking.update(state(), 'a', [{ type: 'track', event: 'rule.enter', rule: 'senior' }]);
	tracking.input('name');
	tracking.step('a', 'b', 'next');
	tracking.input('name');
	tracking.update(state({ issues: [{ field: 'plan', code: 'income', message: 'Too much', rule: 'cap' }] }), 'b');
	tracking.update(state({ issues: [{ field: 'plan', code: 'income', message: 'Too much', rule: 'cap' }] }), 'b');
	tracking.submit(state({ values: { name: 'Mads', plan: 'plus' }, jumps: [{ from: 'b', to: 'c', rules: ['x'] }] }));

	assert.deepEqual(events.map(event => event.type), ['form.view', 'step.view', 'rule.enter', 'form.start', 'step.leave', 'step.view', 'field.revisit', 'field.error', 'form.submit']);
	assert.deepEqual(events.map(event => event.seq), events.map((_, i) => i + 1));
	assert.ok(events.every(event => event.session === events[0].session && event.version === 2));
	assert.deepEqual(events[3].data, { entry: 'a', context: { channel: 'mail' } });
	assert.equal(events[4].step, 'a');
	assert.equal(events[5].step, 'b');
	assert.deepEqual(events[7].data, { field: 'plan', code: 'income', level: 'error', rule: 'cap' });
	const submit = events.at(-1).data;
	assert.deepEqual(submit.choices, { plan: 'plus' });
	assert.deepEqual(submit.jumps, [{ from: 'b', to: 'c' }]);
	assert.ok(!JSON.stringify(events).includes('Mads'));
	assert.equal(tracking.abandon(), false, 'a sent form is not abandoned');
});

test('abandon fires once per hide, only after the form was started', () => {
	const events = [];
	const tracking = new FlowTracking(event => events.push(event));
	tracking.update(state(), 'a');
	assert.equal(tracking.abandon(), false);
	tracking.focus('name');
	tracking.input('name');
	assert.equal(tracking.abandon(), true);
	assert.equal(tracking.abandon(), false);
	tracking.resume();
	assert.equal(tracking.abandon(), true);
	assert.equal(events.at(-1).data.lastField, 'name');
});

test('beacon batches, waits for consent and drops the buffer on revoke', () => {
	const sent = [];
	const tracker = beacon('/collect', { batch: 2, interval: 60000, consent: false, send: (url, events) => sent.push([url, events.length]) });
	tracker({ type: 'a' });
	tracker({ type: 'b' });
	assert.equal(sent.length, 0);
	tracker.grant();
	assert.deepEqual(sent, [['/collect', 2]]);
	tracker({ type: 'c' });
	tracker({ type: 'd' });
	assert.deepEqual(sent.at(-1), ['/collect', 2]);
	tracker({ type: 'e' });
	tracker.revoke();
	tracker.flush();
	assert.equal(sent.length, 2);
	assert.equal(tracker.pending, 0);
});

test('dataLayer events are flat GA4 parameters', () => {
	const pushed = toDataLayer({
		type: 'step.leave', form: 'f', rules: 'r', version: 1, session: 's_1', seq: 3, step: 'a', index: 0, path: ['a', 'b'],
		data: { ms: 900, direction: 'next', choices: { coverPlan: 'plus' }, jumps: [{ from: 'a', to: 'c' }] }
	});
	assert.equal(pushed.event, 'form_step_leave');
	assert.equal(pushed.form_path, 'a>b');
	assert.equal(pushed.choices_cover_plan, 'plus');
	assert.equal(pushed.jumps, 'a>c');
	assert.equal(pushed.ms, 900);
});

test('combine hands every event to each tracker', () => {
	const a = [], b = [];
	const both = combine(event => a.push(event), Object.assign(event => b.push(event), { flush: () => b.push('flushed') }));
	both({ type: 'x' });
	both.flush();
	assert.equal(a.length, 1);
	assert.deepEqual(b, [{ type: 'x' }, 'flushed']);
});
