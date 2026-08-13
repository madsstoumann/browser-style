/* Unit tests for the SSR renderer. Run: node --test ui/card/render.test.js
 * Complements render.snapshot.js — the snapshot catches CHANGES, these assert CORRECTNESS. */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import renderCard, { resolveItemtype, SUBTYPES } from './render.js';

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

const VARIANTS = {
	variesBy: ['color', 'size'],
	productGroupID: 'AB123',
	items: [
		{ name: 'Small green coat', sku: 'AB123-S-GRN', color: 'Green', size: 'small', price: 39.99, currency: 'USD' },
		{ name: 'Large green coat', sku: 'AB123-L-GRN', color: 'Green', size: 'large', price: 44.99, currency: 'USD', availability: 'Out of stock' }
	]
};
/* the message names the ITEMTYPE, because the itemtype is what the gate consults —
   naming details.subtype would misdirect on the flipside path, where the subtype is
   the flipside's but the itemtype is the host's */
const VARIANTS_IGNORED = '<!-- variants ignored: itemtype did not resolve to ProductGroup -->';
const count = (html, needle) => html.split(needle).length - 1;

/* ProductGroup is the `product` type + subtype + a variants block — not a new card type.
   Docs: docs/schema.md § Product */
describe('product variants', () => {
	const variants = VARIANTS;
	const group = (extra = {}) => render({ schemaType: 'product', headline: 'Wool coat', details: { subtype: 'ProductGroup', variants, ...extra } });

	test('the subtype sharpens the itemtype to ProductGroup', () => {
		assert.match(group(), /itemtype="https:\/\/schema\.org\/ProductGroup"/);
	});

	test('hasVariant appears once per item, variesBy once per axis', () => {
		const html = group();
		assert.equal(count(html, 'itemprop="hasVariant" itemscope itemtype="https://schema.org/Product"'), 2);
		assert.equal(count(html, 'itemprop="variesBy"'), 2);
		assert.equal(count(html, '<meta itemprop="productGroupID" content="AB123">'), 1);
		assert.match(html, /itemprop="name">Small green coat</);
		assert.match(html, /<meta itemprop="sku" content="AB123-S-GRN">/);
		assert.match(html, /<meta itemprop="color" content="Green">/);
		assert.match(html, /<meta itemprop="size" content="small">/);
	});

	/* Google: variesBy references a property "through their full Schema.org URL" */
	test('variesBy carries full schema.org URLs, never bare property names', () => {
		const html = group();
		assert.match(html, /<meta itemprop="variesBy" content="https:\/\/schema\.org\/color">/);
		assert.match(html, /<meta itemprop="variesBy" content="https:\/\/schema\.org\/size">/);
		assert.ok(!html.includes('content="color"'), 'a bare property name is not a variesBy value');
	});

	/* the axis list is an allowlist: it also names what the items may emit */
	test('an axis the renderer cannot emit is dropped from variesBy', () => {
		const html = group({ variants: { ...variants, variesBy: ['color', 'flavour'] } });
		assert.equal(count(html, 'itemprop="variesBy"'), 1);
		assert.ok(!html.includes('flavour'), 'an unknown axis never reaches the output');
	});

	test('each variant offer carries currency, availability and a machine price', () => {
		const html = group();
		assert.equal(count(html, 'itemprop="offers" itemscope itemtype="https://schema.org/Offer"'), 2);
		assert.match(html, /<data itemprop="price" value="39\.99">\$39\.99<\/data>/);
		assert.match(html, /<meta itemprop="availability" content="https:\/\/schema\.org\/InStock">/);
		assert.match(html, /<meta itemprop="availability" content="https:\/\/schema\.org\/OutOfStock">/);
	});

	/* THE gate. hasVariant/variesBy/productGroupID are ProductGroup-ONLY properties, so the
	   block is gated on the RESOLVED itemtype — details.subtype and details.variants can
	   never disagree. Skipping is not silent: a fixed comment says why they vanished. */
	const IGNORED = VARIANTS_IGNORED;
	test('variants on a plain Product are skipped, with a diagnostic', () => {
		const html = render({ schemaType: 'product', headline: 'Wool coat', details: { variants } });
		assert.match(html, /itemtype="https:\/\/schema\.org\/Product"/);
		assert.ok(!html.includes('hasVariant'), 'hasVariant is not a Product property');
		assert.ok(!html.includes('variesBy'), 'variesBy is not a Product property');
		assert.ok(!html.includes('productGroupID'), 'productGroupID is not a Product property');
		assert.ok(html.includes(IGNORED), 'the skip must leave a signal in the output');
	});
	test('variants under a sibling product subtype are skipped too', () => {
		const html = render({ schemaType: 'product', headline: 'Coupe', details: { subtype: 'Vehicle', variants } });
		assert.match(html, /itemtype="https:\/\/schema\.org\/Vehicle"/);
		assert.ok(!html.includes('hasVariant'));
		assert.ok(html.includes(IGNORED));
	});
	/* an unallowlisted subtype falls back to Product — the gate must catch that too */
	test('a misspelled ProductGroup subtype does not smuggle the block through', () => {
		const html = render({ schemaType: 'product', headline: 'Coat', details: { subtype: 'Productgroup', variants } });
		assert.match(html, /itemtype="https:\/\/schema\.org\/Product"/);
		assert.ok(!html.includes('hasVariant'));
		assert.ok(html.includes(IGNORED));
	});
	/* sweep the whole product allowlist: the block follows the RESOLVER, so exactly the
	   subtypes that resolve to ProductGroup get it — no hand-listed exceptions */
	test('across every product subtype, hasVariant tracks the resolved itemtype', () => {
		for (const subtype of [...SUBTYPES.product, 'Productgroup', 'ProductGroup ', undefined]) {
			const fields = { schemaType: 'product', headline: 'X', details: { subtype, variants } };
			assert.equal(render(fields).includes('hasVariant'), resolveItemtype(fields) === 'ProductGroup', String(subtype));
		}
	});
	test('the diagnostic never rides a correctly typed group', () => {
		assert.ok(!group().includes(IGNORED));
		assert.ok(!render({ schemaType: 'product', headline: 'Coat', details: { sku: 'X' } }).includes('variants ignored'));
	});

	/* name/sku/productGroupID all route through esc() and were never at risk; price and
	   currency reach a TEXT NODE through fmtPrice() and are the fields that can bite */
	test('escapes hostile input in a variant field', () => {
		const html = group({
			variants: {
				...variants,
				productGroupID: '"><script>alert(1)</script>',
				items: [{ name: '"><img src=x onerror=alert(1)>', sku: '</ul><script>x</script>', color: 'Green', price: '<img src=x onerror=alert(1)>', currency: '<script>alert(2)</script>' }]
			}
		});
		assert.ok(!html.includes('<script>'), 'raw <script> must never reach output');
		assert.ok(!html.includes('<img'), 'attribute breakout must be escaped');
		/* positives: absence alone passes if the field simply stops rendering */
		assert.match(html, /itemprop="name">&quot;&gt;&lt;img src=x onerror=alert\(1\)&gt;</, 'name present and escaped');
		assert.match(html, /content="&lt;\/ul&gt;&lt;script&gt;x&lt;\/script&gt;"/, 'sku present and escaped');
		assert.match(html, /content="&quot;&gt;&lt;script&gt;alert\(1\)&lt;\/script&gt;"/, 'productGroupID present and escaped');
		/* the price TEXT NODE beside the escaped value= attribute */
		assert.match(html, /<data itemprop="price" value="[^"]*">&lt;script&gt;alert\(2\)&lt;\/script&gt; &lt;img src=x onerror=alert\(1\)&gt;<\/data>/, 'price text node present and escaped');
	});
});

/* A <ui-reveal> back panel renders the FLIPSIDE's content column into the HOST's
   itemscope, so a subtype-only property must be gated on the itemtype that was
   actually written — the host's. Docs: docs/schema.md § Product */
describe('flipside itemscope', () => {
	const presets = { rev: { element: 'ui-reveal', variant: 'col' } };
	const flip = { id: 'f', fields: { schemaType: 'product', headline: 'Coat', details: { subtype: 'ProductGroup', variants: VARIANTS } } };
	const host = (schemaType, details) => renderCard(
		{ fields: { schemaType, headline: 'Host', details, preset: { $ref: 'card-preset/rev' }, flipside: { $ref: 'card/f' } } },
		presets, { f: flip });

	test('a ProductGroup flipside cannot hang hasVariant on a non-group host', () => {
		for (const [schemaType, itemtype] of [['article', 'Article'], ['product', 'Product'], ['event', 'Event']]) {
			const html = host(schemaType);
			assert.match(html, new RegExp(`itemtype="https://schema\\.org/${itemtype}"`), schemaType);
			assert.ok(!html.includes('hasVariant'), `${schemaType}: hasVariant is not a ${itemtype} property`);
			assert.ok(!html.includes('variesBy'), `${schemaType}: variesBy is not a ${itemtype} property`);
			assert.ok(!html.includes('productGroupID'), `${schemaType}: productGroupID is not a ${itemtype} property`);
			assert.ok(html.includes(VARIANTS_IGNORED), `${schemaType}: the skip must leave a signal`);
			/* the host scope is the only scope — nothing re-opened a ProductGroup inside it */
			assert.ok(!html.includes('schema.org/ProductGroup'), `${schemaType}: no nested group scope`);
		}
	});

	test('a ProductGroup host does render its flipside variants', () => {
		const html = host('product', { subtype: 'ProductGroup' });
		assert.match(html, /itemtype="https:\/\/schema\.org\/ProductGroup"/);
		assert.equal(count(html, 'itemprop="hasVariant"'), 2);
		assert.ok(!html.includes(VARIANTS_IGNORED));
	});

	/* the derived back panel (no flipside) renders the HOST's own details — same gate */
	test('a derived reveal back panel renders variants for a group host', () => {
		const html = renderCard(
			{ fields: { schemaType: 'product', headline: 'Coat', details: { subtype: 'ProductGroup', variants: VARIANTS }, preset: { $ref: 'card-preset/rev' } } },
			presets);
		assert.match(html, /itemtype="https:\/\/schema\.org\/ProductGroup"/);
		assert.equal(count(html, 'itemprop="hasVariant"'), 2);
		assert.ok(!html.includes(VARIANTS_IGNORED));
	});
	test('a derived reveal back panel on a plain Product host does not', () => {
		const html = renderCard(
			{ fields: { schemaType: 'product', headline: 'Coat', details: { variants: VARIANTS }, preset: { $ref: 'card-preset/rev' } } },
			presets);
		assert.match(html, /itemtype="https:\/\/schema\.org\/Product"/);
		assert.ok(!html.includes('hasVariant'));
		assert.ok(html.includes(VARIANTS_IGNORED));
	});
});

/* fmtPrice()/num() are DISPLAY formatters whose output lands in text nodes. Their
   fallback branches echo author data verbatim, so every call site was an injection
   point. They now return HTML-safe strings — see ui/card/AGENTS.md § conventions. */
describe('price and number formatters', () => {
	const render_ = render;
	const XSS = '<img src=x onerror=alert(1)>';
	const noRaw = (html, where) => {
		assert.ok(!html.includes('<img'), `${where}: raw <img must never reach output`);
		assert.ok(!html.includes('<script>'), `${where}: raw <script> must never reach output`);
	};

	/* one case per distinct sink SHAPE, not per call site */
	test('a hostile price is escaped in every price row shape', () => {
		const rows = [
			['variant offer', { schemaType: 'product', headline: 'X', details: { subtype: 'ProductGroup', variants: { variesBy: ['color'], productGroupID: 'G', items: [{ name: 'V', sku: 'S', price: XSS, currency: '' }] } } }],
			['main product', { schemaType: 'product', headline: 'X', details: { price: { current: XSS, original: XSS, currency: '' } } }],
			['event offer', { schemaType: 'event', headline: 'X', details: { offers: [{ price: XSS, currency: '' }] } }],
			['membership', { schemaType: 'membership', headline: 'X', details: { price: { monthly: XSS, yearly: XSS, currency: '' } } }],
			['booking rate', { schemaType: 'booking', headline: 'X', details: { price: { hourlyRate: XSS, currency: '' } } }],
			['howto cost', { schemaType: 'howto', headline: 'X', details: { estimatedCost: { value: XSS, currency: '' } } }]
		];
		for (const [where, fields] of rows) {
			const html = render_(fields);
			noRaw(html, where);
			assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/, `${where}: the price must still render, escaped`);
		}
	});

	test('a hostile number is escaped in every num() row shape', () => {
		const rows = [
			['rating count', { schemaType: 'product', headline: 'X', details: { rating: { value: 4, count: XSS } } }],
			['rating max', { schemaType: 'product', headline: 'X', details: { rating: { value: 4, max: XSS } } }],
			['engagement', { schemaType: 'article', headline: 'X', engagement: { viewCount: XSS } }],
			['salary', { schemaType: 'job', headline: 'X', details: { company: 'C', location: 'L', salaryRange: { min: XSS, max: 2, currency: 'USD' } } }],
			['poll votes', { schemaType: 'poll', headline: 'X', details: { options: [{ headline: 'a', votes: 1 }], totalVotes: XSS } }],
			['qa upvotes', { schemaType: 'qa', headline: 'X', details: { question: 'q', answers: [{ text: 'a', upvotes: XSS }] } }]
		];
		for (const [where, fields] of rows) {
			const html = render_(fields);
			noRaw(html, where);
			assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/, `${where}: the number must still render, escaped`);
		}
	});

	/* the formatters escape, so a caller that ALSO escapes would double-escape —
	   these are the three joined-"bits" rows plus the rating label that do exactly that */
	test('formatter output is escaped exactly once', () => {
		const once = [
			['howto', { schemaType: 'howto', headline: 'X', details: { estimatedCost: { value: XSS, currency: '' }, difficulty: 'Easy' } }],
			['organization', { schemaType: 'organization', headline: 'X', details: { numberOfEmployees: XSS } }],
			['book', { schemaType: 'book', headline: 'X', details: { numberOfPages: XSS } }],
			['rating label', { schemaType: 'product', headline: 'X', details: { rating: { value: 4, count: XSS } } }]
		];
		for (const [where, fields] of once) {
			const html = render_(fields);
			assert.ok(!html.includes('&amp;lt;'), `${where}: double-escaped output`);
			assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/, `${where}: single-escaped output`);
		}
		/* …and the sibling fields in those joined rows are still escaped exactly once */
		const html = render_({ schemaType: 'book', headline: 'X', details: { numberOfPages: 3, bookFormatDisplay: '<b>Hardcover</b>' } });
		assert.match(html, /&lt;b&gt;Hardcover&lt;\/b&gt;/, 'sibling bits field escaped');
		assert.ok(!html.includes('&amp;lt;'), 'sibling bits field not double-escaped');
	});

	/* Intl.NumberFormat throws RangeError on anything that is not a 3-letter code.
	   One typo'd currency must not crash a whole page render. */
	test('a malformed currency degrades instead of throwing', () => {
		for (const currency of ['$', 'US', 'USDD', '978', '', null, '<img>', 'U$D']) {
			const fields = { schemaType: 'product', headline: 'X', details: { price: { current: 10, currency } } };
			const html = assert.doesNotThrow(() => render_(fields)) ?? render_(fields);
			assert.match(html, /data-part="price"/, `${currency}: the price row must still render`);
			assert.match(html, /10/, `${currency}: the amount must survive`);
		}
		assert.ok(!render_({ schemaType: 'product', headline: 'X', details: { price: { current: 10, currency: '<img src=x>' } } }).includes('<img'));
	});

	/* the guard must not swallow real currencies — pin the formatted output */
	test('well-formed currencies still format through Intl', () => {
		assert.match(render_({ schemaType: 'product', headline: 'X', details: { price: { current: 279, currency: 'USD' } } }), />\$279</);
		assert.match(render_({ schemaType: 'product', headline: 'X', details: { price: { current: 279, currency: 'usd' } } }), />\$279</, 'lowercase is a valid code');
		assert.match(render_({ schemaType: 'product', headline: 'X', details: { rating: { value: 4.5, count: 1247 } } }), /1,247 ratings/, 'thousands separator survives escaping');
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
