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

/* Properties that differ between a base type and its subtype. Validity is not the bar
   here — the pre-fix markup was valid, it just wasn't what Google reads. */
describe('subtype-aware properties', () => {
	/* WatchAction is "dynamic/moving visual content"; a thread and an article are static.
	   Google's DiscussionForumPosting interactionType list has ViewAction, not WatchAction. */
	test('viewCount is a ViewAction unless the root is video/audio', () => {
		const views = { engagement: { viewCount: 10 } };
		for (const [schemaType, action] of [['video', 'WatchAction'], ['podcast', 'WatchAction'], ['movie', 'WatchAction'], ['article', 'ViewAction'], ['social', 'ViewAction'], ['content', 'ViewAction']])
			assert.match(render({ schemaType, headline: 'X', ...views }),
				new RegExp(`interactionType" content="https://schema\\.org/${action}"`), schemaType);
	});
	test('a video subtype still watches, a social subtype views', () => {
		assert.match(render({ schemaType: 'social', headline: 'T', details: { subtype: 'DiscussionForumPosting' }, engagement: { viewCount: 10 } }),
			/interactionType" content="https:\/\/schema\.org\/ViewAction"/);
	});
	/* the other three counters are type-independent — pin that the change didn't leak */
	test('the non-view counters are unchanged by type', () => {
		const html = render({ schemaType: 'video', headline: 'X', engagement: { likeCount: 1, shareCount: 2, commentCount: 3 } });
		for (const a of ['LikeAction', 'ShareAction', 'CommentAction'])
			assert.match(html, new RegExp(`interactionType" content="https://schema\\.org/${a}"`), a);
	});

	/* Google: headline is "not recommended for a SocialMediaPosting" but is the title
	   property for DiscussionForumPosting — so base and subtype genuinely differ */
	test('headline itemprop resolves from the subtype, not just the schemaType', () => {
		assert.match(render({ schemaType: 'social', headline: 'Thread', details: { subtype: 'DiscussionForumPosting' } }),
			/data-part="headline" itemprop="headline"/);
		assert.match(render({ schemaType: 'social', headline: 'Post' }), /data-part="headline" itemprop="name"/);
		/* a sibling social subtype is NOT swept along — only the forum spelling differs */
		assert.match(render({ schemaType: 'social', headline: 'Post', details: { subtype: 'BlogPosting' } }),
			/data-part="headline" itemprop="name"/);
		/* the schemaType keying still applies where no subtype override exists */
		assert.match(render({ schemaType: 'job', headline: 'Dev' }), /data-part="headline" itemprop="title"/);
		assert.match(render({ schemaType: 'article', headline: 'A' }), /data-part="headline" itemprop="headline"/);
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
		/* inherited Object.prototype keys are not schema types: a truthiness test on
		   SCHEMA_TYPES[schemaType] let these through as a Function/Object, which then
		   stringified into the itemtype attribute (and threw on `__proto__`) */
		for (const schemaType of ['constructor', 'toString', '__proto__', 'hasOwnProperty', 'valueOf']) {
			assert.equal(resolveItemtype({ schemaType, headline: 'X' }), 'CreativeWork', schemaType);
			assert.match(render({ schemaType, headline: 'X' }), /itemtype="https:\/\/schema\.org\/CreativeWork"/, schemaType);
		}
	});
});
