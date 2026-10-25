import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { changeType, consentRecords, createSession, defineTypes, fieldFromType, groupTypes, loadPackages, searchTypes, snapshot, typeOf, validate, evaluate } from '../index.js';

const load = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const core = load('../types/core.json');
const dk = load('../../form-types/dk/types.json');
const banking = load('../../form-types/banking/types.json');
const registry = defineTypes(core, dk, banking);
const loan = load('../examples/loan.form.json');
const contact = load('../examples/contact.form.json');
const contactRules = load('../examples/contact.rules.json');

test('the installed packages merge into one registry without errors', () => {
	assert.deepEqual(registry.errors, []);
	assert.deepEqual(registry.packages.map(entry => entry.package), ['core', 'dk', 'banking']);
	assert.ok(registry.kinds['dk/cpr'] && registry.kinds['banking/iban'] && registry.kinds.consent);
	assert.ok(!core.types.some(type => /cpr|cvr|iban|national/i.test(type.kind)), 'country types stay out of core');
});

test('package kinds must be prefixed and unique', () => {
	const { errors } = defineTypes(core, { package: 'se', types: [{ kind: 'personnummer', title: 'Personnummer', template: { type: 'string' } }] }, { package: 'core', types: [] });
	assert.deepEqual(errors.map(error => error.code), ['kind', 'package']);
	assert.equal(defineTypes(core, { package: 'x', types: [{ kind: 'x/a', title: 'A', template: { type: 'string' } }, { kind: 'x/a', title: 'A', template: { type: 'string' } }] }).errors[0].code, 'kind');
});

test('typeOf uses kind, and infers it for older fields', () => {
	const kinds = Object.fromEntries(Object.entries(loan.fields.properties).map(([id, property]) => [id, typeOf(property, registry)?.kind]));
	assert.deepEqual(kinds, {
		cpr: 'dk/cpr', name: 'text', email: 'email', employment: 'radio', cvr: 'dk/cvr', income: 'integer', debt: 'integer',
		housing: 'select', dependants: 'integer', amount: 'integer', purpose: kinds.purpose, term: kinds.term, startDate: 'date',
		coApplicant: 'boolean', incomeNote: kinds.incomeNote, consent: 'boolean'
	});
	assert.equal(typeOf({ type: 'boolean', ui: { widget: 'toggle' } }, registry).kind, 'boolean');
	assert.equal(typeOf({ type: 'select', options: { multiple: true, choices: [] } }, registry).kind, 'checkboxes');
	assert.equal(typeOf({ kind: 'dk/cpr', type: 'string' }, registry).package, 'dk');
	assert.equal(typeOf({ type: 'string' }, defineTypes(dk)), null, 'no core installed, no plain text type');
});

test('fieldFromType and changeType', () => {
	assert.deepEqual(fieldFromType(registry.kinds['dk/cpr']), { kind: 'dk/cpr', type: 'string', title: 'CPR number', description: 'DDMMYY-XXXX', privacy: 'special', validation: { check: 'dk-cpr' } });
	assert.equal(fieldFromType(registry.kinds.email, { title: 'Work email' }).privacy, 'personal');
	const changed = changeType({ kind: 'text', type: 'string', title: 'Pick', required: true, ui: { hidden: true } }, registry.kinds.radio);
	assert.deepEqual([changed.kind, changed.title, changed.required, changed.ui], ['radio', 'Pick', true, { widget: 'radio', hidden: true }]);
	assert.equal(changeType({ type: 'string', title: 'Note', required: true }, registry.kinds['text-block']).required, undefined);
});

test('search finds types by title, keywords and package, best match first', () => {
	assert.deepEqual(searchTypes(registry, 'national id').map(type => type.kind), ['dk/cpr']);
	assert.deepEqual(searchTypes(registry, 'denmark').map(type => type.kind), ['dk/cpr', 'dk/cvr']);
	assert.equal(searchTypes(registry, 'upload')[0].kind, 'file');
	assert.equal(searchTypes(registry, 'gdpr')[0].kind, 'consent');
	assert.equal(searchTypes(registry, '').length, registry.types.length);
	assert.deepEqual(groupTypes(registry).map(group => group.group), ['Answers', 'Choices', 'Contact', 'Content', 'Advanced']);
});

test('loadPackages fetches types and imports their functions', async () => {
	const fetch = async url => ({ ok: true, url: String(url), json: async () => JSON.parse(readFileSync(url, 'utf8')) });
	const loaded = await loadPackages(['../types/core.json', '../../form-types/dk/types.json', '../../form-types/banking/types.json'], { fetch, base: import.meta.url });
	assert.deepEqual(loaded.errors, []);
	assert.deepEqual(Object.keys(loaded.functions).sort(), ['cprDate', 'dk-cpr', 'dk-cvr', 'iban', 'luhn']);
	assert.deepEqual(validate(loan, load('../examples/loan.rules.json'), loaded).errors, []);
});

test('validate checks kinds against the registry and the new types', () => {
	assert.deepEqual(validate(contact, contactRules, { types: registry }).errors, []);
	const broken = structuredClone(contact);
	Object.assign(broken.fields.properties, {
		cpr: { kind: 'dk/cpr', type: 'string' },
		intro: { type: 'content', content: 'x', required: true },
		campaign: { type: 'string', ui: { widget: 'hidden' }, from: 'values.other' },
		newsletter: { type: 'boolean', ui: { widget: 'consent' } },
		odd: { type: 'date' }
	});
	broken.fields.structure.layout[0].fields.push('cpr', 'odd');
	const codes = validate(broken, contactRules, { types: defineTypes(core) }).errors.map(error => error.code);
	assert.deepEqual(codes.sort(), ['consent', 'content', 'from', 'kind', 'type']);
});

test('consent records carry the wording and notice version', () => {
	const state = evaluate(contact, contactRules, { values: { contactConsent: true, newsletter: false } });
	assert.deepEqual(consentRecords(contact, state.values), [{
		field: 'contactConsent',
		text: 'I agree that you may store my details to answer my enquiry.',
		notice: { label: 'Privacy notice', url: 'https://example.com/privacy', version: '2026-10' },
		form: { id: 'form-contact', version: 1 }
	}]);
});

test('drafts never hold file uploads', () => {
	const now = '2026-10-25T10:00:00Z';
	const state = evaluate(contact, contactRules, { values: { name: 'Ada', attachment: [{ name: 'a.pdf', size: 10, type: 'application/pdf' }] } });
	const saved = snapshot(createSession({ id: 's', definition: contact, ruleSet: contactRules, now }), { definition: contact, ruleSet: contactRules, state, now });
	assert.equal(saved.values.name, 'Ada');
	assert.ok(!('attachment' in saved.values));
});
