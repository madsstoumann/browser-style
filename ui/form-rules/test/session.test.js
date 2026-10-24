import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSession, snapshot, keep, complete, discard, expire, resume, evaluate, privacyOf } from '../index.js';

const NOW = '2026-10-24T09:00:00.000Z';
const LATER = '2026-10-25T09:00:00.000Z';

const form = {
	id: 'apply',
	version: 1,
	structure: { layout: [
		{ type: 'step', id: 'you', fields: ['name', 'cpr', 'smoker'] },
		{ type: 'step', id: 'plan', fields: ['plan', 'note'] }
	] },
	properties: {
		name: { type: 'string', privacy: 'personal' },
		cpr: { type: 'string', privacy: 'special' },
		smoker: { type: 'boolean' },
		plan: { type: 'select', options: { choices: [{ value: 'basic', label: 'Basic' }, { value: 'plus', label: 'Plus' }] } },
		note: { type: 'string', ui: { hidden: true } }
	}
};
const rules = { id: 'apply-rules', version: 3, rules: [
	{ id: 'smoker-note', when: { var: 'values.smoker' }, then: [{ show: 'note' }] }
] };

const draft = (owner) => createSession({ id: 'fs_1', definition: form, ruleSet: rules, owner, now: NOW });
const saved = (values, session = draft()) => {
	const state = evaluate(form, rules, { values });
	return snapshot(session, { definition: form, ruleSet: rules, state, step: 'plan', facts: { segment: 'new' }, now: LATER });
};

test('a new anonymous draft pins the form and rule versions and expires after 30 days', () => {
	const session = draft();
	assert.equal(session.status, 'draft');
	assert.deepEqual(session.form, { id: 'apply', version: 1, resetDrafts: 0 });
	assert.deepEqual(session.rules, { id: 'apply-rules', version: 3 });
	assert.equal(session.storage, 'tab');
	assert.equal(session.expires, '2026-11-23T09:00:00.000Z');
});

test('a snapshot keeps visible values only and never a special field', () => {
	const session = saved({ name: 'Ada', cpr: '0101011234', smoker: false, plan: 'plus', note: 'hidden' });
	assert.deepEqual(session.values, { name: 'Ada', smoker: false, plan: 'plus' });
	assert.equal(session.rev, 1);
	assert.equal(session.step, 'plan');
	assert.deepEqual(session.facts, { segment: 'new' });
	assert.deepEqual(session.matched, []);
});

test('a user draft expires 90 days after its last save; an anonymous one keeps its expiry', () => {
	assert.equal(saved({}, draft({ kind: 'user', sub: 'u-1' })).expires, '2027-01-23T09:00:00.000Z');
	assert.equal(saved({}).expires, '2026-11-23T09:00:00.000Z');
	assert.deepEqual(draft({ kind: 'user', sub: 'u-1', email: 'x@y.z' }).owner, { kind: 'user', sub: 'u-1' });
});

test('keeping a draft records the consent', () => {
	const kept = keep(draft(), { storage: 'device', now: NOW });
	assert.equal(kept.storage, 'device');
	assert.deepEqual(kept.consent, { device: true, at: NOW });
});

test('submitting leaves a tombstone without answers, and is idempotent', () => {
	const done = complete(saved({ name: 'Ada', smoker: true }), { now: LATER, receipt: { reference: 'AB-1' } });
	assert.equal(done.status, 'submitted');
	assert.equal(done.submitted, LATER);
	assert.deepEqual(done.receipt, { reference: 'AB-1' });
	for (const key of ['values', 'facts', 'matched', 'step']) assert.equal(key in done, false, key);
	assert.equal(complete(done, { now: '2026-12-01T00:00:00.000Z', receipt: { reference: 'other' } }), done);
	assert.throws(() => snapshot(done, { definition: form, ruleSet: rules, state: { values: {} }, now: LATER }), /submitted/);
});

test('discarded, expired and submitted sessions cannot be resumed', () => {
	const input = { definition: form, ruleSet: rules, now: LATER };
	assert.deepEqual(resume(discard(saved({}), { now: LATER }), input), { ok: false, reason: 'discarded' });
	assert.deepEqual(resume(expire(saved({}), { now: LATER }), input), { ok: false, reason: 'expired' });
	assert.deepEqual(resume(complete(saved({}), { now: LATER }), input), { ok: false, reason: 'submitted' });
	assert.deepEqual(resume(saved({}), { ...input, now: '2026-12-01T00:00:00.000Z' }), { ok: false, reason: 'expired' });
	assert.equal(discard(complete(saved({}), { now: LATER }), { now: LATER }).status, 'submitted');
});

test('resuming the same versions returns values, facts, step and matched rules', () => {
	const result = resume(saved({ name: 'Ada', smoker: true, note: 'x' }), { definition: form, ruleSet: rules, now: LATER });
	assert.equal(result.ok, true);
	assert.equal(result.migrated, false);
	assert.deepEqual(result.values, { name: 'Ada', smoker: true, note: 'x' });
	assert.deepEqual(result.previous, { matched: ['smoker-note'] });
	assert.equal(result.step, 'plan');
	assert.deepEqual(result.changes, []);
});

test('resuming against a new version drops removed fields and reports unavailable options', () => {
	const session = saved({ name: 'Ada', smoker: false, plan: 'plus' });
	const next = structuredClone(form);
	next.version = 2;
	delete next.properties.name;
	next.structure.layout[0].fields = ['cpr', 'smoker'];
	const nextRules = { ...rules, version: 4, rules: [{ id: 'no-plus', when: true, then: [{ options: { field: 'plan', only: ['basic'] } }] }] };
	const result = resume(session, { definition: next, ruleSet: nextRules, now: LATER });
	assert.equal(result.ok, true);
	assert.equal(result.migrated, true);
	assert.deepEqual(result.values, { smoker: false, plan: 'plus' });
	assert.deepEqual(result.changes, [{ field: 'name', change: 'removed' }, { field: 'plan', change: 'option-unavailable' }]);
});

test('a field newly marked special is dropped on resume; resetDrafts starts drafts over', () => {
	const session = saved({ name: 'Ada' });
	const next = structuredClone(form);
	next.properties.name.privacy = 'special';
	assert.deepEqual(resume(session, { definition: next, ruleSet: rules, now: LATER }).changes, [{ field: 'name', change: 'special' }]);
	next.resetDrafts = 1;
	assert.deepEqual(resume(session, { definition: next, ruleSet: rules, now: LATER }), { ok: false, reason: 'reset' });
});

test('patch fields default to personal; unknown ids too', () => {
	const withPatch = { ...rules, patches: [{ id: 'offers/x', fields: { 'offers.cover': { type: 'boolean' } } }] };
	assert.equal(privacyOf(form, withPatch, 'offers.cover'), 'personal');
	assert.equal(privacyOf(form, rules, 'smoker'), 'none');
	assert.equal(privacyOf(form, rules, 'nope'), 'personal');
});
