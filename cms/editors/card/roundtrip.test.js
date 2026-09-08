/* Round-trip + value-contract tests for <editor-card>'s pure state helpers (src/state.js).
 * DOM-free: the guarantees the CMS wrappers rely on — value in ⇔ value out unchanged,
 * legacy payload adoption, path edits preserving key order — hold as pure functions.
 * Run: node --test cms/editors/card/roundtrip.test.js */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { esc, parseValue, serializeValue, getPath, setPath, deletePath, emptyItemFor } from './src/state.js';

const dir = new URL('.', import.meta.url).pathname;
const DATA = dir + '../../../ui/card/data/';

test('esc neutralises attribute breakouts', () => {
	assert.equal(esc('a"b<c>&\''), 'a&quot;b&lt;c&gt;&amp;&#39;');
	assert.equal(esc(undefined), '');
	assert.equal(esc(0), '0');
});

test('current payloads parse and serialize unchanged', () => {
	const payload = { schemaType: 'product', details: { sku: 'X', price: { current: 9, currency: 'EUR' } } };
	const parsed = parseValue(JSON.stringify(payload));
	assert.deepEqual(parsed, payload);
	assert.equal(serializeValue(parsed.schemaType, parsed.details), JSON.stringify(payload));
	/* object input too (Contentful hands the object straight over) */
	assert.deepEqual(parseValue(payload), payload);
});

test('unknown details keys pass through verbatim, order preserved', () => {
	const details = { zeta: 1, custom: { deep: [1, 2] }, alpha: 'a' };
	const parsed = parseValue({ schemaType: 'event', details });
	assert.deepEqual(Object.keys(parsed.details), ['zeta', 'custom', 'alpha']);
	assert.deepEqual(JSON.parse(serializeValue(parsed.schemaType, parsed.details)).details, details);
});

test('legacy {type, …} payloads adopt the type and keep everything under details', () => {
	const legacy = { type: 'article', article: { authors: [{ name: 'A' }] }, media: { src: 'x.jpg' } };
	const parsed = parseValue(legacy);
	assert.equal(parsed.schemaType, 'article');
	assert.deepEqual(parsed.details, { article: legacy.article, media: legacy.media });
	/* unknown legacy type falls back to no selection, data kept */
	const unknown = parseValue({ type: 'ribbonThing', foo: 1 });
	assert.equal(unknown.schemaType, '');
	assert.deepEqual(unknown.details, { foo: 1 });
});

test('malformed input: bad JSON is rejected, empty string is a blank card', () => {
	assert.equal(parseValue('{nope'), null);
	assert.deepEqual(parseValue(''), { schemaType: '', details: {} });
	assert.deepEqual(parseValue([1, 2]), { schemaType: '', details: {} });
});

test('setPath appends new keys after existing ones; edits update in place', () => {
	const data = { b: 1, a: 2 };
	setPath(data, 'c.d', 3);
	assert.deepEqual(Object.keys(data), ['b', 'a', 'c']);
	setPath(data, 'a', 9);
	assert.deepEqual(Object.keys(data), ['b', 'a', 'c']);
	setPath(data, 'list.0', 'x');
	assert.deepEqual(data.list, ['x']);
});

test('deletePath removes keys, splices arrays and prunes emptied parents', () => {
	const data = { keep: 1, obj: { only: 2 }, arr: ['a', 'b', 'c'] };
	deletePath(data, 'obj.only');
	assert.equal('obj' in data, false);
	deletePath(data, 'arr.1');
	assert.deepEqual(data.arr, ['a', 'c']);
	assert.equal(getPath(data, 'keep'), 1);
});

test('emptyItemFor: object rows get {}, scalar rows get ""', () => {
	assert.deepEqual(emptyItemFor({ fields: { name: {} } }), {});
	assert.equal(emptyItemFor({ type: 'string' }), '');
	assert.equal(emptyItemFor({ fields: { text: {} }, scalar: 'text' }), '');
});

test('every corpus instance round-trips byte-equal through the value contract', () => {
	let count = 0;
	for (const folder of ['', 'demo/']) {
		for (const file of readdirSync(DATA + folder).filter((f) => f.endsWith('.json'))) {
			let doc;
			try { doc = JSON.parse(readFileSync(DATA + folder + file, 'utf8')); } catch { continue; }
			if (doc?.model !== 'card' || !doc.fields?.details) continue;
			const input = { schemaType: doc.fields.schemaType ?? 'content', details: doc.fields.details };
			const parsed = parseValue(JSON.stringify(input));
			assert.equal(serializeValue(parsed.schemaType, parsed.details), JSON.stringify(input), `${folder}${file}`);
			count++;
		}
	}
	assert.ok(count > 50, `only ${count} instances checked`);
});

test('referenced detail rows ($ref) pass through the value contract verbatim', () => {
	const payload = { schemaType: 'faq', details: { items: [
		{ $ref: 'card/faq-shared-1' },
		{ $ref: 'card/faq-shared-2', question: 'Override?' },
		{ question: 'Inline?', answer: 'Yes.' }
	] } };
	const parsed = parseValue(JSON.stringify(payload));
	assert.equal(serializeValue(parsed.schemaType, parsed.details), JSON.stringify(payload));
	/* an override edit writes beside $ref without touching it */
	setPath(parsed.details, 'items.0.answer', 'Local answer');
	assert.equal(parsed.details.items[0].$ref, 'card/faq-shared-1');
	assert.deepEqual(Object.keys(parsed.details.items[0]), ['$ref', 'answer']);
});
