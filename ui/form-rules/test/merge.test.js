import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { evaluate, merge, expirePatches, handleEvent } from '../index.js';

const load = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const form = load('../examples/insurance.form.json');
const rules = load('../examples/insurance.rules.json');
const patch = load('../examples/offers.patch.json');
const codes = result => result.errors.map(error => error.code);

test('a patch is namespaced and placed below the priority ceiling', () => {
	const { ruleSet, errors } = merge(form, rules, patch, { owner: 'senior-north' });
	assert.deepEqual(errors, []);
	const [mounted] = ruleSet.patches;
	assert.equal(mounted.id, 'offers/senior-north');
	assert.deepEqual(Object.keys(mounted.fields), ['offers.travelCover']);
	assert.deepEqual(mounted.place, { 'cover.extra': ['offers.travelCover'] });
	assert.equal(mounted.rules[0].id, 'offers/travel-needs-plus');
	assert.equal(mounted.rules[0].priority, -1);
	assert.deepEqual(mounted.rules[0].when, { '===': [{ var: 'values.offers.travelCover' }, true] });
});

test('merging the same owner again replaces the patch', () => {
	const once = merge(form, rules, patch, { owner: 'senior-north' }).ruleSet;
	const twice = merge(form, once, { ...patch, patch: 'again' }, { owner: 'senior-north' }).ruleSet;
	assert.deepEqual(twice.patches.map(p => p.id), ['offers/again']);
});

test('a patch cannot widen the base form', () => {
	const result = merge(form, rules, {
		...patch,
		rules: [{ id: 'unlock', when: true, then: [{ show: 'consent' }, { enable: 'plan' }] }]
	}, { owner: 'senior-north' });
	assert.deepEqual(codes(result), ['widen', 'widen']);
	assert.equal(result.ruleSet, rules);
});

test('a patch can only use the slot its fetch named', () => {
	const result = merge(form, rules, { ...patch, place: { 'somewhere.else': ['travelCover'] } }, { owner: 'senior-north' });
	assert.deepEqual(codes(result), ['slot', 'slot']);
});

test('a patch needs an owner with a fetch, and the right form and version', () => {
	assert.deepEqual(codes(merge(form, rules, patch, { owner: 'email-needed' })), ['owner']);
	assert.deepEqual(codes(merge(form, rules, { ...patch, for: { form: 'other', minVersion: 9 } }, { owner: 'senior-north' })), ['target', 'version']);
});

test('expired patches are removed', () => {
	const { ruleSet } = merge(form, rules, patch, { owner: 'senior-north' });
	assert.equal(expirePatches(ruleSet, '2026-10-24T07:00:00Z').patches.length, 1);
	assert.equal(expirePatches(ruleSet, '2026-10-24T09:00:00Z').patches.length, 0);
});

test('a pricing event sets facts, which the next evaluation reads', () => {
	const event = { id: 'e1', source: 'pricing', sequence: 4, type: 'pricing.updated', data: { roadsideZips: ['2100'] } };
	const result = handleEvent(form, rules, {}, event);
	assert.equal(result.changed, true);
	assert.deepEqual(result.store.facts, { pricing: { roadsideZips: ['2100'] } });
	const state = evaluate(form, rules, { values: { ageGroup: 30, zip: '2100' }, facts: result.store.facts });
	assert.deepEqual(state.fields.addOns.options, ['glass', 'roadside']);

	assert.equal(handleEvent(form, rules, result.store, event).reason, 'duplicate');
	assert.equal(handleEvent(form, rules, result.store, { ...event, id: 'e0', sequence: 3 }).reason, 'out-of-order');
	assert.equal(handleEvent(form, rules, result.store, { ...event, type: 'unknown' }).reason, 'not-listening');
});

test('a rules.published event replaces the rule set only with a newer version', () => {
	const newer = { ...rules, fields: { ...rules.fields, version: 5, rules: [] } };
	const result = handleEvent(form, rules, {}, { id: 'r1', type: 'rules.published', data: newer });
	assert.equal(result.changed, true);
	assert.equal(result.ruleSet.version, 5);
	assert.equal(handleEvent(form, result.ruleSet, result.store, { id: 'r2', type: 'rules.published', data: newer }).reason, 'not-newer');
});

test('a campaign event mounts an always-active patch', () => {
	const campaign = {
		patch: 'autumn',
		fields: { voucher: { type: 'string', title: 'Voucher code' } },
		place: { 'cover.extra': ['voucher'] }
	};
	const result = handleEvent(form, rules, {}, { id: 'c1', type: 'campaign.started', data: campaign });
	assert.deepEqual(result.errors, []);
	const state = evaluate(form, result.ruleSet, { values: { ageGroup: 18, 'campaign.voucher': 'AUTUMN' } });
	assert.equal(state.fields['campaign.voucher'].visible, true);
	assert.equal(state.values['campaign.voucher'], 'AUTUMN');
});

test('a patch can insert steps only after the step its fetch named', () => {
	const health = load('../examples/api/health.json');
	const result = merge(form, rules, health, { owner: 'senior-health' });
	assert.deepEqual(result.errors, []);
	const mounted = result.ruleSet.patches.find(p => p.id === 'health/senior-health');
	assert.deepEqual(mounted.steps, [{ id: 'health.health', name: 'Health', after: 'cover', fields: ['health.conditions', 'health.details', 'health.doctor'] }]);
	assert.deepEqual(mounted.rules[0].then, [{ show: 'health.details' }, { require: 'health.details' }]);
	assert.deepEqual(codes(merge(form, rules, health, { owner: 'senior-north' })), ['step']);
});
