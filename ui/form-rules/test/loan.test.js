/* The advanced example: variables, computed values, cross-field and backend checks. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { evaluate as run, merge, validate } from '../index.js';
import functions from '../examples/functions/checks.js';

const load = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const form = load('../examples/loan.form.json');
const rules = load('../examples/loan.rules.json');
const today = '2026-10-24';
/* The host passes its functions on every call. */
const evaluate = (f, r, input) => run(f, r, { ...input, functions });
const applicant = { cpr: '070761-4285', name: 'Ib Hansen', email: 'ib@example.dk', employment: 'employed', income: 45000, debt: 100000, housing: 'own', amount: 200000, purpose: 'car', term: 10, startDate: '2026-11-01' };
const codes = state => state.issues.map(issue => `${issue.field}:${issue.code}`);

test('the loan example is valid with its functions, and names the ones missing without them', () => {
	assert.deepEqual(validate(form, rules, { functions }), { valid: true, errors: [] });
	assert.deepEqual(validate(form, rules).errors.map(error => error.code).sort(), ['function', 'function', 'function', 'operator']);
});

test('variables: computed ones follow the answers, the score adds up from matching rules', () => {
	const state = evaluate(form, rules, { today, values: applicant });
	assert.deepEqual(state.vars, { score: 80, risk: 'low', age: 65, yearlyIncome: 540000, debtRatio: 0.19 });
	assert.deepEqual(state.explain['vars.score'], ['score-income-high', 'score-owner']);
	assert.deepEqual(state.explain['vars.risk'], ['low-risk']);
	assert.deepEqual(state.path, ['you', 'economy', 'loan', 'review']);
});

test('a low score sets the risk, includes documentation and shortens the term', () => {
	const state = evaluate(form, rules, { today, values: { ...applicant, income: 15000, debt: 150000, housing: 'rent', term: 15 } });
	assert.equal(state.vars.score, 10);
	assert.equal(state.vars.risk, 'high');
	assert.deepEqual(state.path, ['you', 'economy', 'loan', 'documents', 'review']);
	assert.deepEqual(state.fields.term.options, [1, 3, 5]);
	assert.ok(codes(state).includes('term:option-unavailable'));
	assert.deepEqual(state.effects.find(effect => effect.type === 'emit').event, 'loan.manual-review');
});

test('cross-field rules and field constraints become issues with messages', () => {
	const state = evaluate(form, rules, { today, values: { ...applicant, cpr: '070710-4234', income: 6000, amount: 400000, startDate: '2026-01-01', name: 'I' } });
	assert.equal(state.vars.age, 16);
	assert.deepEqual(codes(state).filter(code => !/required|option-unavailable/.test(code)).sort(), ['amount:income', 'cpr:dk-cpr-mod11', 'cpr:too-young', 'name:minLength', 'startDate:past']);
	assert.equal(state.issues.find(issue => issue.code === 'income').message, 'You can borrow at most five times your yearly income');
	assert.equal(evaluate(form, rules, { today, values: { ...applicant, cpr: '0101011234' } }).issues.find(issue => issue.field === 'cpr').level, 'warning');
	assert.deepEqual(state.explain['amount.invalid'], ['amount-vs-income']);
});

test('the backend answer is data the rules read, and a wait fetch is marked', () => {
	let state = evaluate(form, rules, { today, values: { ...applicant, amount: 400000, income: 90000 } });
	const fetch = state.effects.find(effect => effect.service === 'eligibility');
	assert.equal(fetch.wait, true);
	assert.deepEqual(fetch.send, { cpr: '070761-4285', amount: 400000, income: 90000 });
	assert.ok(!codes(state).includes('amount:partner-limit'));

	const merged = merge(form, rules, load('../examples/api/eligibility.json'), { owner: 'check-eligibility' });
	assert.deepEqual(merged.errors, []);
	state = evaluate(form, merged.ruleSet, { today, values: { ...applicant, amount: 400000, income: 90000 } });
	assert.ok(codes(state).includes('amount:partner-limit'));
	state = evaluate(form, merged.ruleSet, { today, values: { ...applicant, amount: 250000, income: 90000 } });
	assert.ok(!codes(state).includes('amount:partner-limit'));
	assert.deepEqual(state.patches, ['eligibility/eligibility']);
});

test('a co-applicant step is inserted after the loan step, with namespaced fields', () => {
	const merged = merge(form, rules, load('../examples/api/co-applicant.json'), { owner: 'co-applicant' });
	assert.deepEqual(merged.errors, []);
	const state = evaluate(form, merged.ruleSet, { today, values: { ...applicant, coApplicant: true, 'partner.cpr': '0707614285' } });
	assert.deepEqual(state.path, ['you', 'economy', 'loan', 'partner.person', 'review']);
	assert.ok(codes(state).includes('partner.name:required'));
});
