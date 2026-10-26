import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { apply, merge, safeUrl, validate } from '../index.js';

const load = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const form = load('../examples/insurance.form.json');
const rules = load('../examples/insurance.rules.json');
const patch = load('../examples/offers.patch.json');

test('safeUrl lets http(s) and relative links through, and nothing that runs', () => {
	for (const url of ['https://example.com/privacy', 'http://example.com', '/privacy', 'privacy.html', '#notice', '?a=1']) assert.equal(safeUrl(url), url);
	for (const url of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', ' javascript:alert(1)', 'java\tscript:alert(1)', 'data:text/html,<script>', 'vbscript:x', '//evil.example', '\\\\evil', '', null, 42, {}]) {
		assert.equal(safeUrl(url), null, String(url));
	}
});

test('Object.prototype methods are not host functions', () => {
	assert.throws(() => apply({ constructor: ['x'] }, {}), /Unknown operator "constructor"/);
	assert.throws(() => apply({ toString: [] }, {}), /Unknown operator "toString"/);
	assert.throws(() => apply({ check: ['toString', 'x'] }, {}), /Unknown function "toString"/);
	assert.throws(() => apply({ check: ['constructor', 'x'] }, {}), /Unknown function "constructor"/);
});

test('a service reply may add plain questions, but not a password, hidden value, consent or upload', () => {
	assert.deepEqual(merge(form, rules, patch, { owner: 'senior-north' }).errors, []);
	for (const property of [
		{ type: 'string', ui: { widget: 'password' } },
		{ type: 'string', ui: { widget: 'hidden' }, default: 'x' },
		{ type: 'boolean', ui: { widget: 'consent' }, consent: { text: 'Yes', notice: { url: 'javascript:alert(1)' } } },
		{ type: 'file' }
	]) {
		const result = merge(form, rules, { ...patch, fields: { ...patch.fields, sneaky: property }, place: { 'cover.extra': ['travelCover', 'sneaky'] } }, { owner: 'senior-north' });
		assert.deepEqual(result.errors.map(error => error.code), ['field-kind']);
		assert.equal(result.ruleSet, rules);
	}
});

test('a service named for a kind of field may add it', () => {
	const allowed = structuredClone(rules);
	const body = allowed.fields ?? allowed;
	body.services.offers.fields = ['boolean', 'consent'];
	const consent = { type: 'boolean', ui: { widget: 'consent' }, consent: { text: 'Yes' } };
	const result = merge(form, allowed, { ...patch, fields: { ...patch.fields, agree: consent }, place: { 'cover.extra': ['travelCover', 'agree'] } }, { owner: 'senior-north' });
	assert.deepEqual(result.errors, []);
});

test('answers sent to a service: special ones need a processor, personal ones warn', () => {
	const marked = structuredClone(form);
	const properties = marked.fields?.properties ?? marked.properties;
	properties.zip = { ...properties.zip, privacy: 'personal' };
	properties.ageGroup = { ...properties.ageGroup, privacy: 'special' };
	const result = validate(marked, rules);
	assert.deepEqual(result.errors.map(error => `${error.code}:${error.path}`), ['privacy:services.offers.send', 'privacy:services.health.send']);
	assert.deepEqual(result.warnings.map(error => `${error.code}:${error.path}`), ['privacy:services.offers.send']);
	const processor = structuredClone(rules);
	const body = processor.fields ?? processor;
	Object.values(body.services).forEach(service => { service.processor = true; });
	assert.deepEqual(validate(marked, processor), { valid: true, errors: [], warnings: [] });
});
