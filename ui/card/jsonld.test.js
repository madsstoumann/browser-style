/* Unit tests for the microdata -> JSON-LD extractor. Run: node --test ui/card/jsonld.test.js
 * The extractor is the ONE source of structured data: it reads the microdata the renderer
 * already emits, so jsonld mode cannot drift from micro mode. Docs: docs/card.md § Schema mode */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { microdataToJsonLd, jsonLdGraph, jsonLdScript } from './jsonld.js';

describe('microdataToJsonLd — a single item', () => {
	test('reads itemtype as @type and a meta itemprop as a property', () => {
		const html = '<div itemscope itemtype="https://schema.org/Person">'
			+ '<meta itemprop="name" content="Ada">'
			+ '</div>';
		assert.deepEqual(microdataToJsonLd(html), [
			{ '@type': 'Person', name: 'Ada' }
		]);
	});
});

describe('microdataToJsonLd — how a property takes its value', () => {
	const one = (inner) => microdataToJsonLd(`<div itemscope itemtype="https://schema.org/Thing">${inner}</div>`)[0];

	test('an ordinary element uses its text', () => {
		assert.equal(one('<span itemprop="name">Ada</span>').name, 'Ada');
	});

	test('text is unescaped back to characters', () => {
		assert.equal(one('<span itemprop="name">Tom &amp; Jerry &lt;b&gt; &quot;x&quot;</span>').name, 'Tom & Jerry <b> "x"');
	});

	test('nested markup inside a property contributes only its text', () => {
		assert.equal(one('<p itemprop="description">A <b>bold</b> claim</p>').description, 'A bold claim');
	});

	test('an anchor uses href, not its text', () => {
		assert.equal(one('<a itemprop="url" href="/a.html">Read</a>').url, '/a.html');
	});

	test('an image uses src', () => {
		assert.equal(one('<img itemprop="image" src="/a.png" alt="">').image, '/a.png');
	});

	test('a time element uses datetime', () => {
		assert.equal(one('<time itemprop="datePublished" datetime="2026-01-02">Jan 2</time>').datePublished, '2026-01-02');
	});

	test('a link element uses href', () => {
		assert.equal(one('<link itemprop="sameAs" href="https://example.com/a">').sameAs, 'https://example.com/a');
	});

	test('a repeated property becomes an array', () => {
		assert.deepEqual(one('<meta itemprop="keywords" content="a"><meta itemprop="keywords" content="b">').keywords, ['a', 'b']);
	});
});

describe('microdataToJsonLd — nesting', () => {
	test('a nested itemscope with an itemprop becomes that property value', () => {
		const html = '<div itemscope itemtype="https://schema.org/Product">'
			+ '<meta itemprop="name" content="Gown">'
			+ '<div itemprop="offers" itemscope itemtype="https://schema.org/Offer">'
			+ '<meta itemprop="price" content="10">'
			+ '</div></div>';
		assert.deepEqual(microdataToJsonLd(html), [{
			'@type': 'Product', name: 'Gown',
			offers: { '@type': 'Offer', price: '10' }
		}]);
	});

	test('properties of a nested scope do not leak to the parent', () => {
		const html = '<div itemscope itemtype="https://schema.org/Product">'
			+ '<div itemprop="offers" itemscope itemtype="https://schema.org/Offer">'
			+ '<meta itemprop="price" content="10">'
			+ '</div>'
			+ '<meta itemprop="sku" content="X1">'
			+ '</div>';
		const [item] = microdataToJsonLd(html);
		assert.equal(item.price, undefined, 'price belongs to the Offer');
		assert.equal(item.sku, 'X1', 'sku belongs to the Product');
	});

	test('an itemscope with no itemprop is a second top-level node', () => {
		/* the job card does exactly this — EmployerAggregateRating is a sibling item,
		   because JobPosting has no aggregateRating property at all */
		const html = '<div itemscope itemtype="https://schema.org/JobPosting"></div>'
			+ '<div itemscope itemtype="https://schema.org/EmployerAggregateRating"></div>';
		assert.deepEqual(microdataToJsonLd(html).map((i) => i['@type']),
			['JobPosting', 'EmployerAggregateRating']);
	});

	test('hidden elements still carry their data', () => {
		const html = '<div itemscope itemtype="https://schema.org/Place">'
			+ '<div itemprop="geo" itemscope itemtype="https://schema.org/GeoCoordinates" hidden>'
			+ '<meta itemprop="latitude" content="55.7"></div></div>';
		assert.equal(microdataToJsonLd(html)[0].geo.latitude, '55.7');
	});
});

describe('microdataToJsonLd — real markup', () => {
	test('script and style contents are not parsed as markup', () => {
		/* schema.html inlines the attr() polyfill; its JS is full of < > and quotes */
		const html = '<script>var a = {"x": "<b>"}; if (1 < 2) {}</script>'
			+ '<div itemscope itemtype="https://schema.org/Thing"><meta itemprop="name" content="ok"></div>';
		assert.deepEqual(microdataToJsonLd(html), [{ '@type': 'Thing', name: 'ok' }]);
	});

	test('comments are ignored', () => {
		const html = '<!-- <div itemscope itemtype="https://schema.org/Fake"></div> -->'
			+ '<div itemscope itemtype="https://schema.org/Thing"></div>';
		assert.deepEqual(microdataToJsonLd(html).map((i) => i['@type']), ['Thing']);
	});

	test('an unclosed fragment does not swallow the following properties', () => {
		/* floorSize() returns an UNCLOSED <span> its caller closes — render.js:1420 */
		const html = '<div itemscope itemtype="https://schema.org/Accommodation">'
			+ '<span itemprop="floorSize" itemscope itemtype="https://schema.org/QuantitativeValue">'
			+ '<meta itemprop="value" content="180">180</span>'
			+ '<meta itemprop="numberOfBedrooms" content="3">'
			+ '</div>';
		const [home] = microdataToJsonLd(html);
		assert.equal(home.floorSize.value, '180');
		assert.equal(home.numberOfBedrooms, '3', 'the bedroom count belongs to the home');
	});
});

describe('jsonLdGraph — the page-level block', () => {
	const html = '<div itemscope itemtype="https://schema.org/Thing"><meta itemprop="name" content="a"></div>'
		+ '<div itemscope itemtype="https://schema.org/Person"></div>';

	test('wraps the nodes in one @graph with a schema.org context', () => {
		const g = jsonLdGraph(html);
		assert.equal(g['@context'], 'https://schema.org');
		assert.equal(g['@graph'].length, 2);
		assert.equal(g['@graph'][0].name, 'a');
	});

	test('returns null when the markup carries no microdata', () => {
		assert.equal(jsonLdGraph('<p>nothing here</p>'), null);
	});

	test('the script tag escapes < so a value cannot close it early', () => {
		const risky = '<div itemscope itemtype="https://schema.org/Thing">'
			+ '<span itemprop="name">a &lt;/script&gt; b</span></div>';
		const tag = jsonLdScript(risky);
		assert.doesNotMatch(tag, /<\/script>[\s\S]*<\/script>/, 'only one closing tag');
		assert.match(tag, /^<script type="application\/ld\+json">/);
		const payload = tag.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '');
		assert.equal(JSON.parse(payload)['@graph'][0].name, 'a </script> b');
	});

	test('jsonLdScript emits nothing when there is no microdata', () => {
		assert.equal(jsonLdScript('<p>nothing</p>'), '');
	});
});

describe('the shipped pages', () => {
	const demo = new URL('./demo/', import.meta.url);
	const read = (f) => readFileSync(new URL(f, demo), 'utf8');
	const body = (h) => h.slice(h.indexOf('<body'));
	const micro = read('schema.html');
	const jsonld = read('schema.jsonld.html');
	const raw = read('schema.raw.html');

	test('schema.html yields a node for every top-level item', () => {
		const nodes = microdataToJsonLd(body(micro));
		assert.ok(nodes.length > 50, `expected the full page, got ${nodes.length}`);
		assert.deepEqual(nodes.filter((n) => !n['@type']), [], 'every node must carry @type');
	});

	test('schema.jsonld.html carries exactly one ld+json block, and it is valid JSON', () => {
		const found = jsonld.match(/<script type="application\/ld\+json">/g) || [];
		assert.equal(found.length, 1);
		const payload = jsonld.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1];
		const graph = JSON.parse(payload);
		assert.equal(graph['@context'], 'https://schema.org');
		assert.ok(Array.isArray(graph['@graph']));
	});

	test('the ld+json block is not marked render-blocking', () => {
		/* a data block is never executed — there is nothing for blocking="render" to wait on */
		assert.doesNotMatch(jsonld.match(/<script type="application\/ld\+json"[^>]*>/)[0], /blocking=/);
	});

	test('the shipped graph still matches schema.html — the page is not stale', () => {
		const payload = jsonld.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1];
		assert.deepEqual(JSON.parse(payload)['@graph'], microdataToJsonLd(body(micro)),
			'run node ui/card/demo/schema.modes.build.js');
	});

	test('jsonld and raw ship identical markup apart from the block and its prose', () => {
		const strip = (h) => h.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/, '')
			.replace(/<title>[\s\S]*?<\/title>/, '').replace(/<meta name="description"[^>]*>/, '')
			.replace(/<h1>[\s\S]*?<\/p>/, '').replace(/<span>Schema mode[^<]*<\/span>/, '')
			.replace(/\s+/g, ' ');
		assert.equal(strip(jsonld), strip(raw));
	});

	test('neither twin carries inline microdata', () => {
		for (const [name, page] of [['raw', raw], ['jsonld', jsonld]]) {
			const markup = page.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '');
			assert.doesNotMatch(markup, / itemprop="/, `${name} still has itemprop`);
			assert.doesNotMatch(markup, / itemscope[ >]/, `${name} still has itemscope`);
		}
	});
});
