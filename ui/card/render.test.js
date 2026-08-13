/* Unit tests for the SSR renderer. Run: node --test ui/card/render.test.js
 * Complements render.snapshot.js — the snapshot catches CHANGES, these assert CORRECTNESS. */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import renderCard, { resolveItemtype } from './render.js';

/* Render a bare fields object with no preset — the DEFAULT_PRESET stack card. */
export const render = (fields) => renderCard({ fields });

describe('review', () => {
	test('emits Review itemtype and reviewer jobTitle', () => {
		const html = render({
			schemaType: 'review',
			headline: 'Great',
			summary: 'Solid product.',
			details: { rating: { value: 4 }, reviewer: { name: 'Alex Chen', title: 'Buyer' } }
		});
		assert.match(html, /itemtype="https:\/\/schema\.org\/Review"/);
		assert.match(html, /itemprop="jobTitle">Buyer</);
		assert.match(html, /itemprop="reviewBody"/);
	});

	test('escapes hostile input', () => {
		const html = render({
			schemaType: 'review',
			headline: '<script>alert(1)</script>',
			details: { reviewer: { name: '"><img src=x onerror=alert(1)>' } }
		});
		assert.ok(!html.includes('<script>'), 'raw <script> must never reach output');
		/* keep this fixture media-free — a rendered <img> would false-fail the next assert */
		assert.ok(!html.includes('<img'), 'attribute breakout must be escaped');
		/* positives: absence alone passes if the field simply stops rendering */
		assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/, 'headline present and escaped');
		assert.match(html, /&quot;&gt;&lt;img src=x onerror=alert\(1\)&gt;/, 'name present and escaped');
	});
});

describe('subtype sharpening', () => {
	test('legacy businessType still works', () => {
		const html = render({ schemaType: 'business', headline: 'Brew', details: { businessType: 'CafeOrCoffeeShop' } });
		assert.match(html, /itemtype="https:\/\/schema\.org\/CafeOrCoffeeShop"/);
	});
	test('generic subtype sharpens a social post to a forum posting', () => {
		const html = render({ schemaType: 'social', headline: 'Thread', details: { subtype: 'DiscussionForumPosting' } });
		assert.match(html, /itemtype="https:\/\/schema\.org\/DiscussionForumPosting"/);
	});
	test('generic subtype sharpens an event', () => {
		const html = render({ schemaType: 'event', headline: 'Final', details: { subtype: 'SportsEvent' } });
		assert.match(html, /itemtype="https:\/\/schema\.org\/SportsEvent"/);
	});
	test('a subtype from another type is refused', () => {
		const html = render({ schemaType: 'event', headline: 'X', details: { subtype: 'BlogPosting' } });
		assert.match(html, /itemtype="https:\/\/schema\.org\/Event"/);
	});
	test('an arbitrary string can never reach the itemtype', () => {
		const html = render({ schemaType: 'event', headline: 'X', details: { subtype: 'Evil"><script>' } });
		assert.match(html, /itemtype="https:\/\/schema\.org\/Event"/);
		assert.ok(!html.includes('<script>'));
	});
	test('subtype wins when both spellings are set', () => {
		const html = render({ schemaType: 'business', headline: 'Brew', details: { subtype: 'Bakery', businessType: 'CafeOrCoffeeShop' } });
		assert.match(html, /itemtype="https:\/\/schema\.org\/Bakery"/);
	});
	/* the two cross-list values (docs/schema.md § Subtypes) resolve under EITHER
	   base type — same itemtype, different DETAILS renderer */
	test('a cross-list subtype resolves under both its base types', () => {
		for (const schemaType of ['business', 'location'])
			assert.match(render({ schemaType, headline: 'Pine Ridge', details: { subtype: 'Campground' } }),
				/itemtype="https:\/\/schema\.org\/Campground"/);
		for (const schemaType of ['article', 'social'])
			assert.match(render({ schemaType, headline: 'Post', details: { subtype: 'BlogPosting' } }),
				/itemtype="https:\/\/schema\.org\/BlogPosting"/);
	});

	/* the exported resolver is the seam every other itemtype producer calls
	   (articles/build.js, demo/render.html) — it always returns a plain schema.org type name */
	test('the exported resolver normalises an unknown schemaType', () => {
		assert.equal(resolveItemtype({ schemaType: 'nonesuch', headline: 'X' }), 'CreativeWork');
		assert.equal(resolveItemtype({ headline: 'X' }), 'CreativeWork');
		assert.equal(resolveItemtype({ schemaType: 'social', details: { subtype: 'DiscussionForumPosting' } }), 'DiscussionForumPosting');
	});
});
