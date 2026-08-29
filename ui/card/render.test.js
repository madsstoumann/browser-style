/* Unit tests for the SSR renderer. Run: node --test ui/card/render.test.js
 * Complements render.snapshot.js — the snapshot catches CHANGES, these assert CORRECTNESS. */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import renderCard, { resolveItemtype, SUBTYPES, EYEBROW_PROP, vacationrentalSections } from './render.js';
import { buildSrcset, maxUsableWidth } from './srcset.js';

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

	/* the collage: same hasVariant set, rendered as linked tiles in the MEDIA area.
	   The mode is data-derived — every variant needs its own image — so these tests
	   pin the capacity rule, not a preset word. */
	const withImages = (items) => ({
		...VARIANTS,
		control: 'collage',
		items: items.map((item, i) => ({ ...item, label: `V${i}`, url: `/p?v=${i}`, image: { src: `/img/v${i}.png`, alt: `Variant ${i}` } }))
	});

	test('every variant carrying an image renders the collage, not the list', () => {
		const html = group({ variants: withImages(VARIANTS.items) });
		assert.match(html, /<lay-out[^>]*md="columns\(2\)"/, 'tiles sit in a lay-out grid');
		assert.ok(!html.includes('<ul data-part="list">'), 'the list presentation is replaced, not duplicated');
		assert.equal(count(html, 'itemprop="hasVariant"'), 2, 'one tile per variant');
		/* the group's own machine metas stay in the text column, where its scope is */
		assert.match(html, /<meta itemprop="productGroupID" content="AB123">/);
		assert.equal(count(html, 'itemprop="variesBy"'), 2);
	});

	/* control: 'collage' ASKS for the collage; the images are what make it possible. When
	   the precondition fails the request is not honoured half-way. */
	test('one variant without an image falls back to the list, control notwithstanding', () => {
		const asked = withImages(VARIANTS.items);
		delete asked.items[1].image;
		const html = group({ variants: asked });
		assert.equal(asked.control, 'collage', 'the control still asks for a collage');
		assert.match(html, /<ul data-part="list">/, 'a ragged grid is never rendered');
		assert.ok(!html.includes('<lay-out'), 'no partial collage');
	});

	test('each tile is one whole-tile link carrying the variant URL', () => {
		const html = group({ variants: withImages(VARIANTS.items) });
		/* Google requires each variant be preselectable at a distinct URL, and only a
		   crawlable <a> satisfies that — the tile chip is a label, not the link. The name
		   says NAVIGATE ("view"), not select, and keeps the chip's visible text inside it */
		assert.match(html, /<a data-part="cover" href="\/p\?v=0" itemprop="url" aria-label="Green — view this colourway"><\/a>/);
		assert.equal(count(html, 'data-part="cover"'), 2);
		/* the tile's link affordance: a trailing chevron on the chip (the CTA convention) and
		   hov(zoom) on the frame — docs/schema.md § Product */
		assert.match(html, /<ui-chip data-icon="chevron-right" data-icon-at="end">V0<\/ui-chip>/);
		assert.match(html, /<ui-card variant="rds\(non\)" media="asr\(1\/1\) hov\(zoom\) chip\(bs\) chip\(blue\) chip\(pale\) chip\(sm\)"/);
	});

	test('tile images get srcset only when the CDN pipeline is armed', () => {
		const fields = { schemaType: 'product', headline: 'Wool coat', details: { subtype: 'ProductGroup', variants: withImages(VARIANTS.items) } };
		assert.ok(!renderCard({ fields }).includes('srcset='), 'off by default — byte-identical legacy output');
		const armed = renderCard({ fields }, {}, {}, { images: { cdnBase: 'https://cdn.test' } });
		assert.match(armed, /srcset="[^"]*cdn\.test[^"]*width=240,height=240[^"]*240w/, 'tiles are square, so the ratio is 1');
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

	/* the allowlist drives BOTH sides — this is the item half (variesBy is tested above) */
	test('an item property outside the axis allowlist is never emitted', () => {
		const html = group({ variants: { ...variants, items: [{ ...variants.items[0], flavour: 'mint', brand: 'Acme' }] } });
		assert.ok(!html.includes('flavour'), 'an unknown item axis never reaches the output');
		assert.ok(!html.includes('mint'), 'nor its value');
		assert.ok(!html.includes('Acme'), 'the item is not spread wholesale into metas');
		assert.match(html, /<meta itemprop="color" content="Green">/, 'allowlisted axes still emit');
	});

	/* one of the two live-docs corrections: nested hasVariant must NOT repeat the group id.
	   `productGroupID` is not a substring of `inProductGroupWithID`, so this needs its own test */
	test('nested variants never carry inProductGroupWithID', () => {
		const html = group();
		assert.ok(!html.includes('inProductGroupWithID'), 'that property is for the unnested isVariantOf form');
		assert.match(html, /<meta itemprop="productGroupID" content="AB123">/, 'the group id rides the group alone');
	});

	/* `item.price == null` is deliberate: a free variant has a price of 0, which is falsy */
	test('a zero-priced variant still renders an offer', () => {
		const html = group({ variants: { ...variants, items: [{ name: 'Free sample', sku: 'S0', color: 'Green', price: 0, currency: 'USD' }] } });
		assert.equal(count(html, 'itemprop="offers" itemscope itemtype="https://schema.org/Offer"'), 1);
		assert.match(html, /<meta itemprop="price" content="0">\$0/);
	});

	/* Google: "The site must have the ability to preselect each variant directly with a
	   distinct URL" — a real anchor, not a meta, is what makes that crawlable */
	test('a variant url becomes a real crawlable anchor', () => {
		const html = group({ variants: { ...variants, items: [{ ...variants.items[0], url: '/coat?size=s&color=green' }] } });
		assert.match(html, /<a itemprop="url" href="\/coat\?size=s&amp;color=green"><span itemprop="name">Small green coat<\/span><\/a>/);
		/* no url → a bare name, no empty anchor */
		assert.ok(!group().includes('<a itemprop="url"'));
		assert.match(group(), /<li[^>]*><span itemprop="name">Small green coat<\/span>/);
	});

	test('a hostile variant url cannot break out of the href', () => {
		const html = group({ variants: { ...variants, items: [{ ...variants.items[0], url: '"><img src=x onerror=alert(1)>' } ] } });
		assert.ok(!html.includes('<img'), 'attribute breakout must be escaped');
		assert.match(html, /href="&quot;&gt;&lt;img src=x onerror=alert\(1\)&gt;"/, 'url present and escaped');
	});

	/* the block-level skip is loud; an unknown axis was silently deleted — including
	   suggestedGender, a Google-documented axis this renderer deliberately excludes */
	test('a dropped axis leaves a diagnostic too', () => {
		const html = group({ variants: { ...variants, variesBy: ['color', 'suggestedGender'] } });
		assert.ok(html.includes('<!-- variesBy axes ignored: not one of color, size, material, pattern -->'));
		assert.equal(count(html, 'itemprop="variesBy"'), 1);
		/* and never on a clean group */
		assert.ok(!group().includes('variesBy axes ignored'));
	});

	test('each variant offer carries currency, availability and a machine price', () => {
		const html = group();
		assert.equal(count(html, 'itemprop="offers" itemscope itemtype="https://schema.org/Offer"'), 2);
		assert.match(html, /<meta itemprop="price" content="39\.99">\$39\.99/);
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
		/* the price TEXT NODE beside the escaped machine content= attribute */
		assert.match(html, /<meta itemprop="price" content="[^"]*">&lt;script&gt;alert\(2\)&lt;\/script&gt; &lt;img src=x onerror=alert\(1\)&gt;/, 'price text node present and escaped');
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
		assert.match(render_({ schemaType: 'product', headline: 'X', details: { price: { current: 279, currency: 'USD' } } }), /content="279">\$279/);
		assert.match(render_({ schemaType: 'product', headline: 'X', details: { price: { current: 279, currency: 'usd' } } }), /content="279">\$279/, 'lowercase is a valid code');
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
	/* 2026-08 usage-stats round (docs/schema.md § Subtypes): software gets its first
	   allowlist, the local-service trades join business. Off-list values keep the base. */
	test('software sharpens to its application subtypes', () => {
		for (const subtype of ['MobileApplication', 'WebApplication', 'VideoGame'])
			assert.match(render({ schemaType: 'software', headline: 'App', details: { subtype } }),
				new RegExp(`itemtype="https://schema\\.org/${subtype}"`), subtype);
		/* Game is a CreativeWork, not a SoftwareApplication — refused, base type kept */
		assert.match(render({ schemaType: 'software', headline: 'App', details: { subtype: 'Game' } }),
			/itemtype="https:\/\/schema\.org\/SoftwareApplication"/);
	});
	test('the local-service verticals sharpen business', () => {
		for (const subtype of ['ProfessionalService', 'HomeAndConstructionBusiness', 'MedicalBusiness', 'Plumber', 'Attorney', 'Hospital', 'HairSalon', 'ShoppingCenter'])
			assert.match(render({ schemaType: 'business', headline: 'B', details: { subtype } }),
				new RegExp(`itemtype="https://schema\\.org/${subtype}"`), subtype);
		/* TaxiService is a Service; Casino is deliberately unlisted — both stay LocalBusiness */
		for (const subtype of ['TaxiService', 'Casino'])
			assert.match(render({ schemaType: 'business', headline: 'B', details: { subtype } }),
				/itemtype="https:\/\/schema\.org\/LocalBusiness"/, subtype);
	});
	test('venues sharpen location, a broadcast sharpens event', () => {
		for (const subtype of ['EventVenue', 'StadiumOrArena'])
			assert.match(render({ schemaType: 'location', headline: 'V', details: { subtype } }),
				new RegExp(`itemtype="https://schema\\.org/${subtype}"`), subtype);
		assert.match(render({ schemaType: 'event', headline: 'E', details: { subtype: 'BroadcastEvent' } }),
			/itemtype="https:\/\/schema\.org\/BroadcastEvent"/);
		/* StadiumOrArena is also a LocalBusiness, but it is listed under location only */
		assert.match(render({ schemaType: 'business', headline: 'S', details: { subtype: 'StadiumOrArena' } }),
			/itemtype="https:\/\/schema\.org\/LocalBusiness"/);
	});
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
			const html = render({ schemaType, headline: 'X' });
			assert.match(html, /itemtype="https:\/\/schema\.org\/CreativeWork"/, schemaType);
			/* resolveItemtype is not the only consumer: baseType() also keys the type-keyed
			   maps (HEADLINE_PROP, SUMMARY_PROP, EYEBROW_PROP, PUBLISHED_PROP…). A truthiness
			   test there returns Object.prototype members, which stringify INTO an attribute —
			   the raw-JS-in-an-attribute defect relocated from itemtype to itemprop. */
			assert.match(html, /data-part="headline" itemprop="name"/, schemaType);
			assert.doesNotMatch(html, /\[native code\]|\[object Object\]/, schemaType);
		}
	});
});

/* ── the markup-first types: demo/schema.html is the specification, render.js the
   implementation. Each test pins a decision that was made IN the markup and would
   otherwise be re-litigated by the next person to touch the renderer. ── */

describe('loyalty — MemberProgram', () => {
	const tiers = [
		{ name: 'Blue', pointsEarned: 1, requirement: 'free, no minimum spend', benefits: [{ type: 'TierBenefitLoyaltyPoints', text: '1 point per €1' }] },
		{ name: 'Gold', pointsEarned: 3, requirementAmount: { currency: 'EUR', value: 2000 }, requirementNote: 'a year', benefits: [{ type: 'TierBenefitLoyaltyPrice', text: '12% off' }] }
	];
	const card = (extra = {}) => render({ schemaType: 'loyalty', headline: 'Rewards', details: { hostingOrganization: 'Nordlys Retail', tiers, ...extra } });

	test('tiers ride hasTiers → MemberProgramTier, points inside the summary', () => {
		const html = card();
		assert.match(html, /itemtype="https:\/\/schema\.org\/MemberProgram"/);
		assert.equal(count(html, 'itemprop="hasTiers" itemscope itemtype="https://schema.org/MemberProgramTier"'), 2);
		/* <summary> must be the first child of <details>, so the meta cannot precede it */
		assert.match(html, /<summary><span itemprop="name">Blue<\/span><meta itemprop="membershipPointsEarned" content="1">/);
	});

	test('hasTierBenefit takes TierBenefitEnumeration members only', () => {
		const html = card({ tiers: [{ name: 'X', benefits: [{ type: 'TierBenefitLoyaltyPoints', text: 'ok' }, { type: 'TierBenefitFreeHugs', text: 'nope' }] }] });
		assert.match(html, /<meta itemprop="hasTierBenefit" content="https:\/\/schema\.org\/TierBenefitLoyaltyPoints">/);
		assert.ok(!html.includes('TierBenefitFreeHugs'), 'an invented benefit never reaches an enumeration URL');
		assert.match(html, />nope</, 'but its visible text still renders');
	});

	test('hasTierRequirement is polymorphic — free text or a MonetaryAmount scope', () => {
		const html = card();
		assert.match(html, /<span itemprop="hasTierRequirement">free, no minimum spend<\/span>/);
		assert.match(html, /<span itemprop="hasTierRequirement" itemscope itemtype="https:\/\/schema\.org\/MonetaryAmount"><meta itemprop="currency" content="EUR"><meta itemprop="value" content="2000">€2,000<\/span> a year/);
	});

	/* Google lists url as recommended on each TIER, not only the programme */
	test('a tier url rides the tier', () => {
		assert.match(card({ tiers: [{ name: 'Blue', url: 'https://x.example/blue' }] }), /<meta itemprop="url" content="https:\/\/x\.example\/blue">/);
	});

	/* MemberProgram is an Intangible — no keywords property */
	test('tags render as chips with no itemprop', () => {
		const html = render({ schemaType: 'loyalty', headline: 'R', tags: ['Points'] });
		assert.match(html, /<ui-chip>Points<\/ui-chip>/);
		assert.ok(!html.includes('keywords'), 'MemberProgram has no keywords property');
	});
});

describe('quiz — Quiz', () => {
	const cards = [{ question: 'What is a qubit?', answer: 'The quantum unit of information.' }];
	const card = (extra = {}) => render({ schemaType: 'quiz', headline: 'Flashcards', details: { subject: 'Quantum computing', pace: 'self-paced', cards, ...extra } });

	/* eduQuestionType's domain is Question (and SolveMathAction) — Quiz owns NO properties */
	test('eduQuestionType rides the Question, never the Quiz', () => {
		const html = card();
		assert.match(html, /itemtype="https:\/\/schema\.org\/Quiz"/);
		assert.match(html, /<summary><span itemprop="text">What is a qubit\?<\/span><meta itemprop="eduQuestionType" content="Flashcard">/);
		/* the only eduQuestionType on the card is the one inside the Question scope */
		assert.equal(count(html, 'eduQuestionType'), 1);
		assert.equal(count(html, 'itemprop="hasPart" itemscope itemtype="https://schema.org/Question"'), 1);
		assert.match(html, /<div itemprop="acceptedAnswer" itemscope itemtype="https:\/\/schema\.org\/Answer"><p itemprop="text">The quantum unit of information\.<\/p><\/div>/);
	});

	test('the subject is an about → Thing scope and the count is derived', () => {
		const html = card({ cards: [...cards, { question: 'b', answer: 'c' }] });
		assert.match(html, /Subject: <span itemprop="about" itemscope itemtype="https:\/\/schema\.org\/Thing"><span itemprop="name">Quantum computing<\/span><\/span> · 2 cards · self-paced/);
	});
});

/* The SECOND Quiz shape. `Question` accepts suggestedAnswer AND acceptedAnswer at
   once, so a Quiz is either a flashcard deck (one acceptedAnswer, revealed) or a
   graded multiple-choice set. `details.format` chooses — explicitly, never inferred
   from the presence of options. Docs: docs/schema.md § Quiz */
describe('quiz — multiple choice', () => {
	const cards = [{
		question: 'What can a qubit hold that a classical bit cannot?',
		options: [{ text: 'Two values at once' }, { text: 'A superposition', correct: true }, { text: 'Nothing' }]
	}];
	const card = (extra = {}) => render({ schemaType: 'quiz', headline: 'Check yourself', details: { format: 'multiple-choice', subject: 'Quantum computing', cards, ...extra } });
	/* one card in the fixture, so the meta row must read "1 question", not "1 questions" */

	/* schema.org documents exactly three eduQuestionType spellings; Google's retired
	   Practice Problems feature read "Multiple choice" with a "Practice problem" resource */
	test('the graded shape uses the Multiple choice / Practice problem wording', () => {
		const html = card();
		assert.match(html, /itemtype="https:\/\/schema\.org\/Quiz"/);
		assert.match(html, /<meta itemprop="learningResourceType" content="Practice problem">/);
		assert.match(html, /<meta itemprop="eduQuestionType" content="Multiple choice">/);
		assert.ok(!html.includes('Flashcard'), 'the flashcard wording must not leak into the graded deck');
		assert.match(html, /· 1 question(?!s)/, 'and the noun follows the shape, singular included');
	});

	/* the correct option is the acceptedAnswer, the rest suggestedAnswer — the same
	   shape DETAILS.qa uses, and the one Google's Practice Problems example had */
	test('one acceptedAnswer, the rest suggestedAnswer, each positioned', () => {
		const html = card();
		assert.equal(count(html, 'itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer"'), 1);
		assert.equal(count(html, 'itemprop="suggestedAnswer" itemscope itemtype="https://schema.org/Answer"'), 2);
		assert.match(html, /itemprop="acceptedAnswer"[^>]*><meta itemprop="position" content="2">/);
	});

	/* Grading is CSS-only, so the verdict is markup on EVERY option — hidden until a
	   radio is checked (content.css § options). The author marks the correct option and
	   nothing else: the wording, the colour and the hook are all derived. */
	test('every option carries a verdict chip, derived from `correct`', () => {
		const html = card();
		const chips = html.match(/<ui-chip[^>]*>[^<]*<\/ui-chip>/g) || [];
		assert.equal(chips.length, 3, 'one chip per option, not one for the answer key');
		assert.equal(count(html, 'data-verdict="correct"'), 1);
		assert.equal(count(html, 'data-verdict="wrong"'), 2);
		/* the CSS hook is data-verdict, never the theme colour — a retheme must not regrade */
		assert.match(html, /<span itemprop="text">A superposition<\/span><\/label> <ui-chip data-verdict="correct" theme="pale green">Correct<\/ui-chip>/);
		assert.match(html, /<span itemprop="text">Two values at once<\/span><\/label> <ui-chip data-verdict="wrong" theme="pale red">Wrong<\/ui-chip>/);
	});

	/* the chips sit inside the <li> but outside any itemprop, so an Answer keeps exactly
	   position + text — confirmed against a microdata parser, not by eye */
	test('no verdict chip is a microdata property', () => {
		for (const chip of card().match(/<ui-chip[^>]*>/g) || [])
			assert.ok(!chip.includes('itemprop'), `a verdict chip must not be a property: ${chip}`);
	});

	/* the verdict appears without a DOM mutation, so the list is a polite live region;
	   aria-live rides the <ul> because role="status" would replace the list role */
	test('the options list announces the verdict politely', () => {
		assert.match(card(), /<ul data-part="options" aria-live="polite">/);
	});

	/* the radios are a group and the question names it — without the fieldset/legend
	   pair an option is announced with no programmatic link to what it answers. The
	   legend must be the FIRST child, so eduQuestionType follows it. */
	test('each question is a fieldset whose legend is the question', () => {
		const html = card({ cards: [...cards, { question: 'Second?', options: [{ text: 'a', correct: true }] }] });
		assert.equal(count(html, '<fieldset itemprop="hasPart" itemscope itemtype="https://schema.org/Question">'), 2);
		assert.ok(!html.includes('<p data-part="meta"><strong itemprop="text">'), 'the question is a legend, not a paragraph');
		assert.match(html, /<fieldset[^>]*>\s*<legend itemprop="text">What can a qubit hold[^<]*<\/legend><meta itemprop="eduQuestionType"/);
		/* a legend IS the group label — <strong> inside it adds no semantics, only weight
		   that belongs in CSS, and it would nest a second itemprop holder for nothing */
		assert.doesNotMatch(html, /<legend[^>]*>\s*<strong/, 'no <strong> inside a legend');
	});

	/* CSS-only: one radio group per question, named off the deck so two graded decks
	   on one page cannot share a group */
	test('radios group per question, off a slugged deck name', () => {
		const html = card({ cards: [...cards, { question: 'Second?', options: [{ text: 'a', correct: true }] }] });
		assert.equal(count(html, 'name="quiz-check-yourself-q1"'), 3);
		assert.equal(count(html, 'name="quiz-check-yourself-q2"'), 1);
		assert.match(html, /<input type="radio" class="--check" name="quiz-check-yourself-q1">/);
		/* a hostile headline cannot reach the attribute: plain() drops the tag and the
		   slug allowlist drops what is left, so the group falls back to a fixed word */
		const hostile = render({ schemaType: 'quiz', headline: '"><img src=x>', details: { format: 'multiple-choice', cards } });
		assert.ok(!hostile.includes('<img src=x'), 'the slug allowlist keeps markup out of the name');
		assert.match(hostile, /name="quiz-card-q1"/);
	});

	/* the format is the switch, not the incidental presence of options */
	test('format chooses the shape, and a mismatch is loud', () => {
		/* options under a flashcard deck are dropped WITH a diagnostic */
		const mismatch = render({ schemaType: 'quiz', headline: 'X', details: { format: 'flashcard', cards } });
		assert.ok(mismatch.includes('<!-- options ignored: details.format is not multiple-choice -->'));
		assert.ok(!mismatch.includes('suggestedAnswer'), 'and they never render');
		assert.match(mismatch, /content="Flashcard"/);
		/* an unknown format falls back to the flashcard deck, same diagnostic */
		const unknown = render({ schemaType: 'quiz', headline: 'X', details: { format: 'true-false', cards } });
		assert.match(unknown, /content="Flashcard"/);
		assert.ok(!unknown.includes('true-false'), 'an invented format never reaches the markup');
		assert.ok(unknown.includes('<!-- options ignored'));
		/* a clean deck of either shape carries no diagnostic */
		assert.ok(!card().includes('options ignored'));
		assert.ok(!render({ schemaType: 'quiz', headline: 'X', details: { cards: [{ question: 'q', answer: 'a' }] } }).includes('options ignored'));
	});
});

/* The THIRD Quiz shape: one flashcard as a <ui-reveal> flip card. The two faces are
   two properties of ONE Question, so the Question scope sits on the <details> that
   wraps them — the split renderReveal's generic front/back cannot express, and the
   reason REVEAL_FACES exists. Docs: docs/schema.md § Quiz */
describe('quiz — flip flashcard (REVEAL_FACES)', () => {
	const cards = [{ question: 'What is a qubit?', answer: 'The quantum unit of <em>information</em>.' }];
	const presets = {
		flash: { element: 'ui-reveal', variant: 'ovr(bs)', content: 'scl(lg)', headingTag: 'h2', reveal: { type: 'flip', name: 'quiz-flashcard' } },
		plain: { element: 'ui-reveal', variant: 'ovr(bs)', content: 'scl(lg)' }
	};
	const flip = (details, preset = 'flash') => renderCard(
		{ fields: { schemaType: 'quiz', eyebrow: 'Flashcard', headline: 'Quantum computing — flashcard', details, preset: { $ref: `card-preset/${preset}` } } },
		presets);
	const deck = { format: 'flashcard', subject: 'Quantum computing', cards };

	test('the Question scope wraps BOTH faces — it is on the <details>', () => {
		const html = flip(deck);
		assert.match(html, /<details name="quiz-flashcard" itemprop="hasPart" itemscope itemtype="https:\/\/schema\.org\/Question">/);
		/* <summary> stays the first child: Question-level machine metadata goes INSIDE it */
		assert.match(html, /<details[^>]*>\s*<summary>/);
		assert.equal(count(html, 'itemprop="hasPart"'), 1);
		/* one face each, and neither re-opens a scope the <details> already owns */
		assert.equal(count(html, 'schema.org/Question'), 1);
		/* the format resolves exactly as the deck's does — absent means flashcard */
		assert.match(flip({ subject: 'Quantum computing', cards }), /<details name="quiz-flashcard" itemprop="hasPart"/);
	});

	test('the front headline is the QUESTION (itemprop="text"), never the Quiz name', () => {
		const html = flip(deck);
		assert.match(html, /<span data-part="headline" itemprop="text">What is a qubit\?<\/span>/, 'question text on a phrasing tag');
		assert.ok(!/data-part="headline"[^>]*itemprop="name"/.test(html), 'headlineProp() must not claim the front face');
		/* <summary> takes phrasing content — a heading there is invalid HTML, so the front
		   face ignores preset.headingTag rather than emitting h1-h6 */
		assert.ok(!/<summary>[\s\S]*?<h[1-6][\s>]/.test(html), 'no heading tag may appear inside <summary>');
		/* the Quiz name survives as machine metadata on the HOST, above the <details> */
		assert.match(html, /<ui-reveal[^>]*><meta itemprop="name" content="Quantum computing — flashcard">/);
		assert.equal(count(html, 'Quantum computing — flashcard'), 1, 'the name is emitted once, and not visibly');
		/* eduQuestionType is a Question property and rides the front face, inside the summary */
		assert.match(html, /<meta itemprop="eduQuestionType" content="Flashcard"><\/ui-content><\/ui-face>/);
	});

	test('the back panel is the acceptedAnswer and holds nothing else', () => {
		const html = flip(deck);
		assert.match(html, /<ui-content itemprop="acceptedAnswer" itemscope itemtype="https:\/\/schema\.org\/Answer" theme="gray ink" content="pad\(lg\) plc\(cc\) tal\(ctr\)"><p data-part="summary" itemprop="text">The quantum unit of <em>information<\/em>\.<\/p><\/ui-content>/);
		/* the derived back column is what a flashcard must NOT get */
		assert.ok(!html.includes('data-part="meta"'), 'no derived meta row on a flashcard');
		assert.ok(!html.includes('<ui-accordion'), 'no deck inside the flip card');
		assert.ok(!html.includes('tabindex'), 'the answer panel is not the generic scroll column');
	});

	test('content= rides the HOST, because scl() has to reach both faces', () => {
		const html = flip(deck);
		assert.match(html, /<ui-reveal variant="ovr\(bs\) flp ico\(te\) ico\(sm\)" content="scl\(lg\)"/);
		assert.match(html, /<ui-content><small data-part="eyebrow">Flashcard<\/small>/, 'the front column takes no content=');
	});

	test('the Quiz properties stay machine metadata on the host, in order', () => {
		const html = flip(deck);
		assert.match(html, /<meta itemprop="name"[^>]*><meta itemprop="learningResourceType" content="Flashcard"><div itemprop="about" itemscope itemtype="https:\/\/schema\.org\/Thing" hidden><meta itemprop="name" content="Quantum computing"><\/div><div itemprop="educationalAlignment"/);
		assert.ok(!flip({ format: 'flashcard', cards }).includes('itemprop="about"'), 'no subject, no about scope');
	});

	/* a reveal has ONE front and ONE back — the rest of a deck has nowhere to go */
	test('a multi-card deck through a reveal preset renders the first and says so', () => {
		const html = flip({ ...deck, cards: [...cards, { question: 'Entanglement?', answer: 'Shared state.' }, { question: 'Why correct errors?', answer: 'Decoherence.' }] });
		assert.match(html, /What is a qubit\?/);
		assert.ok(!html.includes('Entanglement?'), 'the second card has no face to land on');
		assert.ok(html.includes('<!-- 2 of 3 flashcards not rendered'), 'and skipping is loud');
		assert.ok(!flip(deck).includes('not rendered'), 'a single card carries no diagnostic');
	});

	/* the hook DECLINES what it cannot shape, and the generic path takes over */
	test('a graded quiz through a reveal preset falls back to the generic reveal', () => {
		const html = flip({ format: 'multiple-choice', subject: 'Quantum computing', cards: [{ question: 'q', options: [{ text: 'a', correct: true }] }] });
		assert.match(html, /<details name="quiz-flashcard">/, 'the generic <details> takes no scope attributes');
		assert.match(html, /<strong data-part="headline" itemprop="name">/, 'the generic front face');
		assert.match(html, /<ui-content tabindex="0">/, 'the generic scrollable back panel');
		assert.match(html, /<fieldset itemprop="hasPart"/, 'and the graded questions render in it');
	});

	test('a cardless quiz declines too', () => {
		const html = flip({ format: 'flashcard', subject: 'Quantum computing', cards: [] });
		assert.match(html, /<details name="quiz-flashcard">/);
		assert.match(html, /<ui-content tabindex="0">/);
	});

	/* the generic reveal path is untouched by the hook existing */
	test('a non-quiz reveal renders exactly as before', () => {
		const html = renderCard(
			{ fields: { schemaType: 'article', eyebrow: 'News', headline: 'Hello', summary: 'Teaser.', preset: { $ref: 'card-preset/plain' } } },
			presets);
		assert.match(html, /<ui-reveal variant="ovr\(bs\) flp ico\(te\) ico\(sm\)" itemscope/, 'no host content=');
		assert.match(html, /<ui-content content="scl\(lg\)">/, 'content= stays on the front column');
		assert.match(html, /<strong data-part="headline" itemprop="headline">Hello<\/strong>/);
		assert.match(html, /<details>\s*<summary>/, 'no scope on the <details>');
		assert.match(html, /<ui-content tabindex="0">/);
	});
});

/* The type chip is a demo-page affordance, and it must not stack on furniture that
   already owns a corner — including a reveal's toggle icon, which defaults to te. */
describe('type chip vs the reveal toggle icon', () => {
	const chip = (reveal) => renderCard(
		{ fields: { schemaType: 'article', headline: 'X', media: [{ mediaType: 'image', src: '/a.png', alt: 'a' }], preset: { $ref: 'card-preset/r' } } },
		{ r: { element: 'ui-reveal', reveal } }, {}, { typeChip: true });

	test('a te toggle icon (the default) pushes the chip back to its ts default', () => {
		for (const reveal of [undefined, { type: 'flip' }, { type: 'flip', icon: 'top right sm' }]) {
			const html = chip(reveal);
			assert.match(html, /<ui-chip data-type>Article<\/ui-chip>/, 'the chip still renders');
			assert.ok(!html.includes('chip(te)'), `${JSON.stringify(reveal)}: te belongs to the icon`);
		}
	});

	/* mergeMediaTokens drops the preset's same-axis token when an override is pushed, so
	   pushing the te default would silently MOVE a chip the preset had already placed */
	test('a chip position written on the preset outranks the te default', () => {
		const placed = renderCard(
			{ fields: { schemaType: 'article', headline: 'X', media: [{ mediaType: 'image', src: '/a.png', alt: 'a' }], preset: { $ref: 'card-preset/p' } } },
			{ p: { element: 'ui-card', media: 'chip(tc)' } }, {}, { typeChip: true });
		assert.match(placed, /media="chip\(tc\)"/, 'the authored position survives');
		assert.ok(!placed.includes('chip(te)'), 'no default is pushed alongside it');
		assert.match(placed, /<ui-chip data-type>Article<\/ui-chip>/);
	});

	test('an icon elsewhere, or no icon at all, leaves te free', () => {
		assert.ok(chip({ type: 'flip', icon: 'top left sm' }).includes('chip(te)'), 'ts icon');
		assert.ok(chip({ type: 'flip', icon: 'bottom right' }).includes('chip(te)'), 'be icon');
		assert.ok(chip({ type: 'flip', trigger: 'card' }).includes('chip(te)'), 'trg(card) emits no icon');
	});

	test('a ui-card host is unaffected', () => {
		const html = renderCard(
			{ fields: { schemaType: 'article', headline: 'X', media: [{ mediaType: 'image', src: '/a.png', alt: 'a' }] } },
			{}, {}, { typeChip: true });
		assert.ok(html.includes('chip(te)'));
	});
});

describe('service — Service', () => {
	const details = {
		serviceType: 'Managed cloud hosting', provider: 'Northwind Group', areaServed: 'Denmark',
		catalog: { name: 'Hosting plans', period: 'month', items: [{ name: 'Managed Kubernetes', price: 450, currency: 'EUR' }] },
		channel: { languages: ['English', 'Danish'], processingTime: 'PT1H', url: '#', urlText: 'Request a quote', telephone: '+45 70 80 90 00', contactType: 'technical support' }
	};
	const card = () => render({ schemaType: 'service', headline: 'Hosting', details });

	/* OfferCatalog is an ItemList, so itemListElement is the nesting property */
	test('the catalogue nests OfferCatalog → itemListElement → Offer → itemOffered', () => {
		const html = card();
		assert.match(html, /<div itemprop="hasOfferCatalog" itemscope itemtype="https:\/\/schema\.org\/OfferCatalog"><meta itemprop="name" content="Hosting plans">/);
		assert.match(html, /<li itemprop="itemListElement" itemscope itemtype="https:\/\/schema\.org\/Offer">/);
		assert.match(html, /<span itemprop="itemOffered" itemscope itemtype="https:\/\/schema\.org\/Service"><span itemprop="name">Managed Kubernetes<\/span><\/span> — <meta itemprop="price" content="450">€450\/month/);
	});

	/* servicePhone expects a ContactPoint, NOT a phone string */
	test('servicePhone is a ContactPoint scope carrying telephone', () => {
		const html = card();
		assert.match(html, /<span itemprop="servicePhone" itemscope itemtype="https:\/\/schema\.org\/ContactPoint"><meta itemprop="contactType" content="technical support"><a class="ui-button" data-icon="call" itemprop="telephone" href="tel:\+4570809000">/);
		assert.match(html, /<a class="ui-button" data-variant="accent" itemprop="serviceUrl" href="#">/);
		assert.equal(count(html, '<meta itemprop="availableLanguage"'), 2);
	});

	test('Service is an Intangible — tags carry no keywords', () => {
		const html = render({ schemaType: 'service', headline: 'S', tags: ['Hosting'] });
		assert.match(html, /<ui-chip>Hosting<\/ui-chip>/);
		assert.ok(!html.includes('keywords'));
	});
});

describe('realestate — RealEstateListing', () => {
	const property = { type: 'Apartment', name: 'Top-floor apartment', floorLevel: '5', petsAllowed: true, floorSize: 118, bedrooms: 3, bathrooms: 2, rooms: 5, yearBuilt: 2018, address: { addressLocality: 'Copenhagen', addressCountry: 'DK' }, amenities: ['Lift'] };
	const card = (extra = {}) => render({ schemaType: 'realestate', headline: 'Flat', details: { price: { amount: 7250000, currency: 'DKK' }, property, ...extra } });

	/* THE trap the reference markup encodes: a strictly-numeric property carries its
	   machine value in <meta content>, with the unit words in a separate text node.
	   <data value="3">3 bedrooms</data> reads as the STRING "3 bedrooms" to a
	   text-reading validator, and is rejected. */
	test('strictly-numeric properties use <meta content>, never <data value>', () => {
		const html = card();
		for (const [prop, value] of [['numberOfBedrooms', 3], ['numberOfBathroomsTotal', 2], ['numberOfRooms', 5], ['yearBuilt', 2018]]) {
			assert.match(html, new RegExp(`<meta itemprop="${prop}" content="${value}">`), prop);
			assert.ok(!new RegExp(`<data[^>]*${prop}`).test(html), `${prop} must not ride a <data>`);
		}
		assert.match(html, /<meta itemprop="numberOfBedrooms" content="3">3 bedrooms/, 'the unit words are a separate text node');
		/* a year is not a quantity — num() would print "2,018" */
		assert.match(html, /built 2018/);
		assert.ok(!html.includes('2,018'));
	});

	/* offers' domain does not include Accommodation/Place/Residence — the price must
	   ride the LISTING (a CreativeWork), OUTSIDE the mainEntity scope */
	test('offers rides the listing, not the residence', () => {
		const html = card();
		const offerAt = html.indexOf('itemprop="offers"');
		const homeAt = html.indexOf('itemprop="mainEntity"');
		assert.ok(offerAt > -1 && homeAt > -1);
		assert.ok(offerAt < homeAt, 'the offer must precede — and so sit outside — the mainEntity scope');
		assert.ok(!html.slice(homeAt).includes('itemprop="offers"'), 'and nothing re-opens one inside it');
		assert.match(html, /<meta itemprop="price" content="7250000">DKK 7,250,000/);
	});

	/* Residence and ApartmentComplex are Place, not Accommodation: yearBuilt's domain
	   is Accommodation alone, so neither could carry this property block */
	test('mainEntity resolves through the Accommodation allowlist only', () => {
		for (const type of ['Apartment', 'House', 'SingleFamilyResidence', 'Suite', 'Room', 'Accommodation'])
			assert.match(card({ property: { ...property, type } }), new RegExp(`itemprop="mainEntity" itemscope itemtype="https://schema\\.org/${type}"`), type);
		for (const type of ['Residence', 'ApartmentComplex', 'Place', 'Evil"><script>', undefined])
			assert.match(card({ property: { ...property, type } }), /itemprop="mainEntity" itemscope itemtype="https:\/\/schema\.org\/Accommodation"/, String(type));
		assert.ok(!card({ property: { ...property, type: 'Evil"><script>' } }).includes('<script>'));
	});

	test('amenityFeature rows are LocationFeatureSpecification with a boolean value', () => {
		assert.match(card(), /<li itemprop="amenityFeature" itemscope itemtype="https:\/\/schema\.org\/LocationFeatureSpecification"><meta itemprop="value" content="true"><span itemprop="name">Lift<\/span><\/li>/);
	});
});

/* A menu is a price COLUMN: the visible amount drops the currency code (stated once on
   the card) and always carries two decimals, so the decimal points line up. The machine
   value on the <meta> is unchanged — that is what a validator reads. */
describe('menu — Menu', () => {
	const sections = [{ name: 'Mains', items: [{ name: 'Curry', price: 145, currency: 'DKK', label: 'Gluten free', description: 'Mild.', diets: ['GlutenFreeDiet', 'PaleoDiet'], nutrition: { calories: '620 calories', proteinContent: '42 g', servingSize: '1 bowl' } }] }];
	const card = () => render({ schemaType: 'menu', headline: 'Kitchen', details: { sections } });

	/* Menu/MenuSection are CreativeWorks; MenuItem is an Intangible — which is why
	   only the ITEM gets offers/nutrition/suitableForDiet */
	test('sections nest MenuSection → MenuItem, and only the item carries the offer', () => {
		const html = card();
		assert.match(html, /itemprop="hasMenuSection" itemscope itemtype="https:\/\/schema\.org\/MenuSection"/);
		assert.match(html, /<li itemprop="hasMenuItem" itemscope itemtype="https:\/\/schema\.org\/MenuItem">/);
		assert.match(html, /<span itemprop="offers" itemscope itemtype="https:\/\/schema\.org\/Offer"><meta itemprop="priceCurrency" content="DKK"><meta itemprop="price" content="145">145\.00<\/span>/);
		assert.match(html, /<span itemprop="nutrition" itemscope itemtype="https:\/\/schema\.org\/NutritionInformation" hidden><meta itemprop="calories" content="620 calories"><meta itemprop="proteinContent" content="42 g"><meta itemprop="servingSize" content="1 bowl"><\/span>/);
	});

	test('suitableForDiet takes RestrictedDiet members only', () => {
		const html = card();
		assert.match(html, /<meta itemprop="suitableForDiet" content="https:\/\/schema\.org\/GlutenFreeDiet">/);
		assert.ok(!html.includes('PaleoDiet'), 'PaleoDiet is not a RestrictedDiet member');
		assert.equal(count(html, 'itemprop="suitableForDiet"'), 1);
	});
});

describe('tvseries / tvepisode', () => {
	const series = { numberOfSeasons: 3, numberOfEpisodes: 24, startDate: '2023-09-14', contentRating: '15', rating: { value: 4.4, count: 12904 }, director: { name: 'Freja Nyholm', label: 'Created and directed by' }, actors: ['Ingrid Solberg', 'Mattias Vogel'], seasons: [{ seasonNumber: 1, numberOfEpisodes: 8, name: 'First Light', display: '8 episodes, 2023' }] };

	test('seasons ride containsSeason → TVSeason', () => {
		const html = render({ schemaType: 'tvseries', headline: 'Nordlight', details: series });
		assert.match(html, /itemtype="https:\/\/schema\.org\/TVSeries"/);
		assert.match(html, /<li itemprop="containsSeason" itemscope itemtype="https:\/\/schema\.org\/TVSeason"><meta itemprop="seasonNumber" content="1"><meta itemprop="numberOfEpisodes" content="8"><span itemprop="name">First Light<\/span> — 8 episodes, 2023<\/li>/);
		assert.match(html, /<p data-part="meta">3 seasons · 24 episodes · since 2023 · rated 15<\/p>/);
		/* superseded spellings must never appear */
		for (const dead of ['itemprop="actors"', 'itemprop="episodes"', 'itemprop="seasons"']) assert.ok(!html.includes(dead), dead);
	});

	test('the season list is ordered, and the switch is data', () => {
		assert.match(render({ schemaType: 'tvseries', headline: 'N', details: series }), /<ol data-part="list"><li itemprop="containsSeason"/);
		assert.match(render({ schemaType: 'tvseries', headline: 'N', details: { ...series, ordered: false } }), /<ul data-part="list"><li itemprop="containsSeason"/);
	});

	/* episodeNumber/partOfSeason/partOfSeries/duration are inherited from Episode */
	test('an episode declares its series and season as hidden scopes', () => {
		const html = render({ schemaType: 'tvepisode', headline: 'The Long Dark Between', details: { episodeNumber: 4, duration: 'PT58M', datePublished: '2026-03-05', datePublishedDisplay: 'Mar 5, 2026', seriesName: 'Nordlight', season: { seasonNumber: 3, name: 'Terminus' }, director: { name: 'Freja Nyholm', label: 'Directed by' } } });
		assert.match(html, /itemtype="https:\/\/schema\.org\/TVEpisode"/);
		assert.match(html, /<meta itemprop="episodeNumber" content="4">/);
		assert.match(html, /<div itemprop="partOfSeries" itemscope itemtype="https:\/\/schema\.org\/TVSeries" hidden><meta itemprop="name" content="Nordlight"><\/div>/);
		assert.match(html, /<div itemprop="partOfSeason" itemscope itemtype="https:\/\/schema\.org\/TVSeason" hidden><meta itemprop="seasonNumber" content="3"><meta itemprop="name" content="Terminus"><\/div>/);
		assert.match(html, /<p data-part="meta">Season 3, episode 4 · 58 min · Mar 5, 2026<\/p>/);
		assert.match(html, /<p data-part="meta" itemprop="director" itemscope itemtype="https:\/\/schema\.org\/Person"><strong data-part="key">Directed by:<\/strong> <span itemprop="name">Freja Nyholm<\/span><\/p>/);
	});

	/* the shared credits helper must not have moved movie's wording */
	test('a film still says "Director:"', () => {
		assert.match(render({ schemaType: 'movie', headline: 'M', details: { director: { name: 'Sofia Lindqvist' } } }),
			/itemprop="director" itemscope itemtype="https:\/\/schema\.org\/Person"><strong data-part="key">Director:<\/strong> <span itemprop="name">Sofia Lindqvist</);
	});
});

describe('medical — MedicalWebPage', () => {
	const details = {
		specialty: 'PrimaryCare', lastReviewed: '2026-05-02', lastReviewedDisplay: 'May 2, 2026',
		audience: { type: 'Patient', name: 'Adults with sleep problems' },
		about: { type: 'MedicalCondition', name: 'Chronic insomnia', aspects: [{ type: 'signOrSymptom', text: 'Trouble sleeping' }, { type: 'riskFactor', text: 'Shift work' }, { type: 'possibleTreatment', text: 'CBT-I' }, { type: 'cure', text: 'nope' }] },
		reviewedBy: { name: 'Dr Astrid Hovgaard', role: 'Consultant in sleep medicine' },
		disclaimer: 'General information only.'
	};
	const card = (extra = {}) => render({ schemaType: 'medical', headline: 'Insomnia', details: { ...details, ...extra } });

	/* specialty/reviewedBy/lastReviewed are WebPage properties MedicalWebPage inherits */
	test('specialty takes MedicalSpecialty members only', () => {
		assert.match(card(), /<meta itemprop="specialty" content="https:\/\/schema\.org\/PrimaryCare">/);
		const bad = card({ specialty: 'Chiropractic' });
		assert.ok(!bad.includes('Chiropractic'), 'a non-member never reaches an enumeration URL');
		assert.ok(!bad.includes('itemprop="specialty"'));
	});

	test('condition aspects resolve through the property → type map', () => {
		const html = card();
		assert.match(html, /<li itemprop="signOrSymptom" itemscope itemtype="https:\/\/schema\.org\/MedicalSignOrSymptom">/);
		assert.match(html, /<li itemprop="riskFactor" itemscope itemtype="https:\/\/schema\.org\/MedicalRiskFactor">/);
		assert.match(html, /<li itemprop="possibleTreatment" itemscope itemtype="https:\/\/schema\.org\/MedicalTherapy">/);
		assert.ok(!html.includes('itemprop="cure"'), 'an unmapped aspect is dropped, not guessed');
		assert.ok(!html.includes('>nope<'));
	});

	/* medicalAudience takes the TYPE MedicalAudience — not the similarly named
	   MedicalAudienceType enumeration (Clinician / MedicalResearcher) */
	test('medicalAudience falls back to the type, never the enumeration', () => {
		assert.match(card(), /itemprop="medicalAudience" itemscope itemtype="https:\/\/schema\.org\/Patient"/);
		assert.match(card({ audience: { type: 'Clinician', name: 'X' } }), /itemprop="medicalAudience" itemscope itemtype="https:\/\/schema\.org\/MedicalAudience"/);
	});

	/* the E-E-A-T signal: a signal a reader cannot see is not one */
	test('reviewedBy is a visible byline, never a hidden meta', () => {
		const html = card();
		assert.match(html, /<address data-part="byline" itemprop="reviewedBy" itemscope itemtype="https:\/\/schema\.org\/Person">/);
		assert.match(html, /<span itemprop="name">Dr Astrid Hovgaard<\/span><span itemprop="jobTitle">Consultant in sleep medicine<\/span>/);
		assert.ok(!/<meta itemprop="reviewedBy"/.test(html));
		assert.match(html, /<small data-part="dateline"><span>Medically reviewed<\/span><time datetime="2026-05-02">May 2, 2026<\/time><\/small>/);
	});
});

describe('music — MusicAlbum', () => {
	const tracks = [{ name: 'Slow Weather', duration: 'PT4M12S', durationDisplay: '4:12' }, { name: 'Kastellet', duration: 'PT3M48S', durationDisplay: '3:48' }];
	const card = (extra = {}) => render({ schemaType: 'music', headline: 'Slow Weather', details: { artist: 'Halvmørke', productionType: 'StudioAlbum', releaseType: 'EPRelease', tracks, ...extra } });

	test('byArtist takes the subheadline slot as a MusicGroup scope', () => {
		assert.match(card(), /<p data-part="subheadline" itemprop="byArtist" itemscope itemtype="https:\/\/schema\.org\/MusicGroup"><span itemprop="name">Halvmørke<\/span><\/p>/);
		/* the profile slot it shares must be untouched */
		assert.match(render({ schemaType: 'profile', headline: 'P', details: { jobTitle: 'Designer' } }), /<p data-part="subheadline"><span itemprop="jobTitle">Designer<\/span><\/p>/);
	});

	/* a hand-kept count silently goes stale — it derives unless stated */
	test('numTracks derives from the track list, and data still wins', () => {
		assert.match(card(), /<meta itemprop="numTracks" content="2">/);
		assert.match(card(), /<p data-part="meta">2 tracks<\/p>/);
		assert.match(card({ numTracks: 9 }), /<meta itemprop="numTracks" content="9">/, 'a partial listing can still state the album total');
		assert.ok(!render({ schemaType: 'music', headline: 'X', details: { artist: 'A' } }).includes('numTracks'), 'no tracks, no count');
	});

	test('the two album enumerations are allowlisted', () => {
		assert.match(card(), /<meta itemprop="albumProductionType" content="https:\/\/schema\.org\/StudioAlbum">/);
		assert.match(card(), /<meta itemprop="albumReleaseType" content="https:\/\/schema\.org\/EPRelease">/);
		const bad = card({ productionType: 'BootlegAlbum', releaseType: 'CassetteRelease' });
		assert.ok(!bad.includes('albumProductionType') && !bad.includes('albumReleaseType'));
		assert.ok(!bad.includes('BootlegAlbum') && !bad.includes('CassetteRelease'));
	});

	test('tracks are MusicRecording rows in an ordered list', () => {
		assert.match(card(), /<ol data-part="list"><li itemprop="track" itemscope itemtype="https:\/\/schema\.org\/MusicRecording"><meta itemprop="position" content="1"><meta itemprop="duration" content="PT4M12S"><span itemprop="byArtist" itemscope itemtype="https:\/\/schema\.org\/MusicGroup" hidden><meta itemprop="name" content="Halvmørke"><\/span><span itemprop="name">Slow Weather<\/span> <small>4:12<\/small><\/li>/);
		assert.ok(!card().includes('itemprop="tracks"'), 'the superseded spelling');
	});

	/* JSON-LD gives every track a byArtist by referencing the album's artist with `@id`;
	   microdata has no reference-by-id for a property VALUE, so the group is restated. */
	test('every track carries byArtist — the album artist, or its own', () => {
		assert.equal(card().match(/itemprop="byArtist"/g).length, 3, 'the subheadline plus one per track');
		const guest = card({ tracks: [{ name: 'Kastellet', artist: 'Ida Krogh & Kvartetten' }] });
		assert.match(guest, /<span itemprop="byArtist" itemscope itemtype="https:\/\/schema\.org\/MusicGroup" hidden><meta itemprop="name" content="Ida Krogh &amp; Kvartetten"><\/span>/, 'a track artist overrides the album one, escaped');
		assert.ok(!guest.includes('>Ida Krogh &amp; Kvartetten<'), 'machine-only — it is not written into the visible row');
		assert.ok(!render({ schemaType: 'music', headline: 'X', details: { tracks: [{ name: 'T' }] } }).includes('byArtist'), 'no artist anywhere, no empty scope');
	});

	test('artistUrl links the album back to its band', () => {
		assert.match(card({ artistUrl: '#schema-musicgroup' }), /itemprop="byArtist"[^>]*><a itemprop="url" href="#schema-musicgroup"><span itemprop="name">Halvmørke<\/span><\/a>/);
		assert.ok(!card().includes('itemprop="url"'), 'no link without it');
	});
});

/* MusicGroup ⊂ PerformingGroup ⊂ Organization — `album` and `genre` are its own, the
   rest is inherited. Docs: docs/schema.md § Band */
describe('musicgroup — MusicGroup', () => {
	const band = (details = {}) => render({
		schemaType: 'musicgroup', eyebrow: 'Dream pop', headline: 'Halvmørke',
		details: {
			genres: ['Shoegaze'], foundingDate: '2019', foundingLocation: 'Copenhagen',
			members: [{ role: 'Vocals', name: 'Ida Krogh' }],
			albums: [{ name: 'Slow Weather', datePublished: '2026-04-17', numTracks: 4, url: '#schema-music', display: 'EP · 2026' }],
			sameAs: ['https://halvmorke.bandcamp.example'], ...details
		}
	});

	test('emits MusicGroup with the founding pair and the extra genres', () => {
		assert.match(band(), /itemtype="https:\/\/schema\.org\/MusicGroup"/);
		assert.match(band(), /<small data-part="eyebrow" itemprop="genre">Dream pop<\/small>/, 'the primary genre is the eyebrow');
		assert.match(band(), /<meta itemprop="genre" content="Shoegaze">/, 'the rest are machine-only — genre is multi-valued');
		assert.match(band(), /<meta itemprop="foundingDate" content="2019">/);
		assert.match(band(), /<span itemprop="foundingLocation" itemscope itemtype="https:\/\/schema\.org\/Place" hidden><meta itemprop="name" content="Copenhagen"><\/span>/);
		assert.match(band(), /<p data-part="meta">Formed in Copenhagen, 2019<\/p>/);
		assert.match(band(), /<meta itemprop="sameAs" content="https:\/\/halvmorke\.bandcamp\.example">/);
	});

	test('members use `member`, with the instrument outside the Person scope', () => {
		assert.match(band(), /<p data-part="meta"><strong data-part="key">Vocals:<\/strong> <span itemprop="member" itemscope itemtype="https:\/\/schema\.org\/Person"><span itemprop="name">Ida Krogh<\/span><\/span><\/p>/);
		assert.ok(!band().includes('musicGroupMember') && !band().includes('itemprop="members"'), 'both superseded spellings');
		assert.ok(!band({ members: [{ role: 'Vocals' }] }).includes('itemprop="member"'), 'a nameless member is not a member');
	});

	test('the discography is descending, so unordered, and each album can link out', () => {
		assert.match(band(), /<ul data-part="list" data-icon="album"><li itemprop="album" itemscope itemtype="https:\/\/schema\.org\/MusicAlbum"><meta itemprop="datePublished" content="2026-04-17"><meta itemprop="numTracks" content="4"><a itemprop="url" href="#schema-music"><span itemprop="name">Slow Weather<\/span><\/a> <small>EP · 2026<\/small><\/li><\/ul>/);
		assert.ok(!band().includes('itemprop="albums"'), 'the superseded spelling');
		assert.match(band({ albums: [{ name: 'Nattevagt' }] }), /<li itemprop="album"[^>]*><span itemprop="name">Nattevagt<\/span><\/li>/, 'no url, no anchor');
		assert.match(band({ ordered: true }), /<ol data-part="list" data-icon="album"><li itemprop="album"/, 'an ascending discography opts in');
	});

	test('escapes hostile input', () => {
		const html = band({ foundingLocation: '"><img src=x onerror=alert(1)>', members: [{ role: '<b>x</b>', name: '<script>alert(1)</script>' }] });
		assert.ok(!html.includes('<script>') && !html.includes('<img') && !html.includes('<b>'), 'no raw markup reaches output');
		assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/, 'the name still renders, escaped');
	});
});

describe('glossary — DefinedTermSet', () => {
	test('each term is a DefinedTerm with a termCode slug', () => {
		const html = render({ schemaType: 'glossary', headline: 'Glossary', details: { about: 'Design systems', note: '40 terms', terms: [{ name: 'Design token', termCode: 'design-token', description: 'A named value.' }] } });
		assert.match(html, /itemtype="https:\/\/schema\.org\/DefinedTermSet"/);
		assert.match(html, /<div itemprop="about" itemscope itemtype="https:\/\/schema\.org\/Thing" hidden><meta itemprop="name" content="Design systems"><\/div>/);
		assert.match(html, /<details name="glossary" itemprop="hasDefinedTerm" itemscope itemtype="https:\/\/schema\.org\/DefinedTerm">/);
		assert.match(html, /<summary><span itemprop="name">Design token<\/span><meta itemprop="termCode" content="design-token">/);
		assert.match(html, /<div><p itemprop="description">A named value\.<\/p><\/div>/);
		assert.match(html, /<footer data-part="footer">40 terms<\/footer>/);
	});
});

describe('podcastseries — PodcastSeries', () => {
	const details = { startDate: '2022-01-11', cadence: 'Fortnightly', episodeCount: 42, feed: { url: 'https://calmmind.example/feed.xml', text: 'RSS feed' }, host: { name: 'Ida Månsson', role: 'Host' }, episodes: [{ episodeNumber: 42, duration: 'PT2M49S', durationDisplay: '2:49', name: 'Digital minimalism, revisited' }] };
	const card = (extra = {}) => render({ schemaType: 'podcastseries', headline: 'The Calm Mind', details: { ...details, ...extra } });

	/* numberOfEpisodes' domain is CreativeWorkSeason/RadioSeries/TVSeries/VideoGameSeries
	   — PodcastSeries is NOT in it. The count is prose; hasPart is the machine answer. */
	test('the episode count is prose, never a numberOfEpisodes property', () => {
		const html = card();
		assert.match(html, /itemtype="https:\/\/schema\.org\/PodcastSeries"/);
		assert.ok(!html.includes('numberOfEpisodes'), 'PodcastSeries is not in that property’s domain');
		assert.match(html, /Fortnightly · 42 episodes since 2022 · <a itemprop="webFeed" href="https:\/\/calmmind\.example\/feed\.xml">RSS feed<\/a>/);
		assert.match(html, /<li itemprop="hasPart" itemscope itemtype="https:\/\/schema\.org\/PodcastEpisode">/);
	});

	/* episodes descend (newest first) — ordinal markers would lie */
	test('the episode list is unordered by default, and the switch is data', () => {
		assert.match(card(), /<ul data-part="list" data-icon="podcasts"><li itemprop="hasPart"/);
		assert.match(card({ ordered: true }), /<ol data-part="list" data-icon="podcasts"><li itemprop="hasPart"/);
	});

	test('the host is a visible author byline', () => {
		assert.match(card(), /<address data-part="byline" itemprop="author" itemscope itemtype="https:\/\/schema\.org\/Person">/);
		assert.match(card(), /<span itemprop="name">Ida Månsson<\/span><span itemprop="jobTitle">Host<\/span>/);
	});
});

describe('comicseries — ComicSeries', () => {
	const details = { issn: '2634-0011', startDate: '2026-08-01', publisher: 'Web Comics Group', cadence: 'Monthly', issueCount: 12 };
	const card = (extra = {}) => render({ schemaType: 'comicseries', headline: 'CSS Man', details: { ...details, ...extra } });

	/* Same trap as PodcastSeries: numberOfEpisodes' domain is CreativeWorkSeason /
	   RadioSeries / TVSeries / VideoGameSeries, and ComicSeries is in none of them.
	   This card enumerates no issues either, so "12 issues" has no machine counterpart
	   at all — an individual issue is its own ComicIssue card. Docs: docs/schema.md */
	test('the issue count is prose, with no machine counterpart', () => {
		const html = card();
		assert.match(html, /itemtype="https:\/\/schema\.org\/ComicSeries"/);
		assert.ok(!html.includes('numberOfEpisodes'), 'ComicSeries is not in that property’s domain');
		assert.ok(!html.includes('numberOfIssues'), 'and no such property exists at all');
		assert.match(html, /<p data-part="meta">Monthly · 12 issues since 2026 · ISSN 2634-0011<\/p>/);
	});

	/* issn, startDate and endDate all arrive from CreativeWorkSeries — issn's domain is
	   Dataset/WebSite/CreativeWorkSeries/Blog, so Periodical is only on the path */
	test('issn and startDate are machine metas on the series root', () => {
		assert.match(card(), /<meta itemprop="issn" content="2634-0011">/);
		assert.match(card(), /<meta itemprop="startDate" content="2026-08-01">/);
		assert.match(card(), /<p data-part="meta" itemprop="publisher" itemscope itemtype="https:\/\/schema\.org\/Organization">Published by <span itemprop="name">Web Comics Group<\/span><\/p>/);
	});

	/* The series card is an INTRODUCTION: no hasPart, and therefore none of the five
	   comic credits, which are ComicIssue's own properties. The issue card carries them
	   and points back with isPartOf — the only direction the vocabulary supports. */
	test('no issue list and no credits — those belong to the issue card', () => {
		const html = card({ issues: [{ issueNumber: 1, name: 'A New Hero', artist: 'Milton Stanley' }] });
		assert.ok(!html.includes('hasPart'), 'the series does not enumerate its issues');
		assert.ok(!html.includes('ComicIssue'), 'so no ComicIssue scope is emitted here');
		for (const role of ['artist', 'penciler', 'inker', 'letterer', 'colorist']) {
			assert.ok(!html.includes(`itemprop="${role}"`), `${role} is a ComicIssue property`);
		}
	});
});

describe('comicissue — ComicIssue', () => {
	const details = {
		issueNumber: 2, datePublished: '2026-09-01', datePublishedDisplay: 'Sept 2026', pagination: '32',
		coverPrice: '10¢', variantCover: 'Newsstand edition',
		price: { current: 4.99, currency: 'USD', availability: 'in stock' },
		series: { name: 'CSS Man', url: '#schema-comicseries', issn: '2634-0011' },
		artist: 'Milton Stanley', inker: 'Rosa Vega'
	};
	const card = (extra = {}) => render({ schemaType: 'comicissue', headline: 'Dark Mode Rising', details: { ...details, ...extra } });

	/* issueNumber and pagination come from PublicationIssue; variantCover is ComicIssue's own */
	test('emits ComicIssue with its PublicationIssue and own properties', () => {
		const html = card();
		assert.match(html, /itemtype="https:\/\/schema\.org\/ComicIssue"/);
		assert.match(html, /<meta itemprop="issueNumber" content="2">/);
		assert.match(html, /<meta itemprop="pagination" content="32">/);
		assert.match(html, /<meta itemprop="variantCover" content="Newsstand edition">/);
		assert.match(html, /<p data-part="meta">Issue 2 · Sept 2026 · 32 pages · cover price 10¢<\/p>/);
	});

	/* The five credits exist ONLY on ComicIssue/ComicStory — this card is the only place
	   in the system where they can be emitted, and the tie to the artist card. */
	test('the credits are one Person scope per filled role', () => {
		const html = card();
		assert.match(html, /<span itemprop="artist" itemscope itemtype="https:\/\/schema\.org\/Person"><span itemprop="name">Milton Stanley<\/span><\/span>/);
		assert.match(html, /<span itemprop="inker" itemscope itemtype="https:\/\/schema\.org\/Person"><span itemprop="name">Rosa Vega<\/span><\/span>/);
		for (const role of ['penciler', 'letterer', 'colorist']) {
			assert.ok(!html.includes(`itemprop="${role}"`), `an unfilled ${role} must not emit an empty scope`);
		}
	});

	/* isPartOf (range CreativeWork|URL) is the link UP to the series — a real anchor, not
	   a hidden meta, because only a link is crawlable */
	test('isPartOf points at the series through a real anchor', () => {
		assert.match(card(), /<p data-part="meta" itemprop="isPartOf" itemscope itemtype="https:\/\/schema\.org\/ComicSeries"><meta itemprop="issn" content="2634-0011">Part of <a itemprop="url" href="#schema-comicseries"><span itemprop="name">CSS Man<\/span><\/a><\/p>/);
	});

	/* Two prices, and only one of them is a claim. The COVER price is what is printed on
	   the artwork — display text, labelled, no itemprop. The sellable price is an Offer
	   (`offers` is a CreativeWork property, so it reaches ComicIssue). */
	test('the cover price is labelled display text, never the Offer', () => {
		const html = card();
		assert.match(html, /32 pages · cover price 10¢/);
		/* the only <meta itemprop="price"> is the Offer's 4.99, not the 10¢ */
		assert.equal((html.match(/itemprop="price"/g) || []).length, 1);
		assert.match(html, /<meta itemprop="price" content="4\.99">/);
		assert.ok(!html.includes('content="10¢"'), 'the cover price is never a machine value');
	});

	test('the Offer carries currency and availability', () => {
		assert.match(card(), /<p data-part="price" itemprop="offers" itemscope itemtype="https:\/\/schema\.org\/Offer"><meta itemprop="priceCurrency" content="USD"><meta itemprop="availability" content="https:\/\/schema\.org\/InStock"><meta itemprop="price" content="4\.99">\$4\.99<\/p>/);
	});

	/* no url ⇒ a real <button>. An <a href="#"> would be an anchor that goes nowhere, and
	   an itemprop="url" on it would claim a checkout page that does not exist. */
	test('Buy now is a button, not a dead link, and claims no offer url', () => {
		const html = render({ schemaType: 'comicissue', headline: 'Dark Mode Rising', details, actions: [{ link: { text: 'Buy now' }, style: 'primary' }] });
		assert.match(html, /<nav data-part="actions"><button class="ui-button" type="button" data-variant="accent">Buy now<\/button><\/nav>/);
		/* scope the url check to the OFFER — the series link legitimately carries
		   itemprop="url" on its own ComicSeries scope, which is a different claim */
		const offer = /<p data-part="price"[\s\S]*?<\/p>/.exec(html)[0];
		assert.ok(!offer.includes('itemprop="url"'), 'the Offer claims no url');
		const actions = /<nav data-part="actions">[\s\S]*?<\/nav>/.exec(html)[0];
		assert.ok(!actions.includes('itemprop'), 'and the button claims nothing at all');
	});
});

describe('artist — Person', () => {
	const details = {
		jobTitle: 'Comic Artist', organization: 'Web Comics Group', location: 'New York, NY',
		occupation: { name: 'Comic book artist', category: '27-1013.00', since: '1958' },
		awards: ['Eisner nominee', 'Inkpot'], sameAs: ['https://webcomicsgroup.example/artists/m-stanley']
	};
	const card = (extra = {}) => render({ schemaType: 'artist', headline: 'Milton Stanley', tags: ['Inking'], details: { ...details, ...extra } });

	/* schema.org has no Artist TYPE — `artist` is a property whose RANGE is Person */
	test('an artist card is a Person, like a profile', () => {
		assert.match(card(), /itemtype="https:\/\/schema\.org\/Person"/);
		assert.ok(!card().includes('schema.org/Artist'), 'there is no such itemtype');
	});

	/* the jobTitle · worksFor row is profile's, shared rather than copied */
	test('the subheadline is the shared profile row', () => {
		assert.match(card(), /<p data-part="subheadline"><span itemprop="jobTitle">Comic Artist<\/span> · <span itemprop="worksFor" itemscope itemtype="https:\/\/schema\.org\/Organization"><span itemprop="name">Web Comics Group<\/span><\/span><\/p>/);
	});

	/* Person has no keywords property, so tags become knowsAbout — same as profile */
	test('tags become knowsAbout, never keywords', () => {
		assert.match(card(), /<ui-chip itemprop="knowsAbout">Inking<\/ui-chip>/);
		assert.ok(!card().includes('itemprop="keywords"'), 'keywords is not a Person property');
	});

	/* award is a repeatable Text: one itemprop per value, or the list collapses into
	   a single concatenated string */
	test('each award is its own span', () => {
		assert.match(card(), /<span itemprop="award">Eisner nominee<\/span> · <span itemprop="award">Inkpot<\/span>/);
	});

	test('hasOccupation is a real Occupation scope', () => {
		assert.match(card(), /<p data-part="meta" itemprop="hasOccupation" itemscope itemtype="https:\/\/schema\.org\/Occupation"><meta itemprop="occupationalCategory" content="27-1013\.00"><span itemprop="name">Comic book artist<\/span> · working since 1958<\/p>/);
	});
});

/* An abbreviated stat is NOT its number. `<data itemprop="value" value="2400000">2.4</data>`
   answers 2,400,000 to the microdata spec and 2.4 to the text-reading consumers this branch
   measured — wrong by 10^6. The machine value moves to <meta>, which has no text node. */
describe('statistic — Observation', () => {
	const card = (details = {}) => render({
		schemaType: 'statistic',
		headline: 'Monthly active users',
		details: { metricName: 'Monthly active users', currentValue: 2400000, displayValue: '2.4M', trend: 'up', trendPercentage: 12, ...details }
	});

	test('the machine value rides a <meta>, never an itemprop on the abbreviated text', () => {
		const html = card();
		assert.match(html, /<meta itemprop="value" content="2400000">/, 'the number is stated once, unambiguously');
		assert.ok(!/<data[^>]*itemprop/.test(html), 'the visible number must carry no itemprop');
		assert.match(html, /<data value="2400000">2\.4M<\/data>/, 'the <data> pair stays truthful — value= matches its own contents');
		assert.ok(!html.includes('>2.4<'), 'the 10^6-off display text must not stand alone as a value');
	});

	test('a real unit still rides unitText, beside a value it actually applies to', () => {
		const html = card({ metricName: 'Median LCP', currentValue: 1.4, displayValue: undefined, unit: 's', trend: undefined });
		assert.match(html, /<meta itemprop="value" content="1.4">/);
		assert.match(html, /<data value="1.4">1\.4<\/data><small itemprop="unitText">s<\/small>/);
	});

	/* the three trend arrows. `down` had no demo card and no test until the second
	   Observation card was removed as a near-duplicate — the card was its only cover */
	test('each trend direction picks its own arrow', () => {
		assert.match(card({ trend: 'up', trendPercentage: 12 }), /▲ 12%/);
		assert.match(card({ trend: 'down', trendPercentage: 8 }), /▼ 8%/);
		assert.match(card({ trend: 'flat', trendPercentage: 0 }), /► 0%/);
		assert.doesNotMatch(card({ trend: undefined }), /[▲▼►]/, 'no trend, no arrow');
	});
});

describe('filelist — ItemList of files', () => {
	const details = {
		files: [
			{ name: 'Brand guidelines', url: '/files/brand-guidelines.pdf', download: 'northwind-brand-guidelines.pdf', size: '2.4 MB', type: 'pdf' },
			{ name: 'Logo pack', url: '/files/logo-pack.zip', size: '18 MB', type: 'zip' }
		]
	};
	const card = (extra = {}) => render({ schemaType: 'filelist', headline: 'Press kit', summary: 'Everything you need.', details: { ...details, ...extra } });

	test('the root is an ItemList and each file a complete MediaObject', () => {
		const html = card();
		assert.match(html, /itemtype="https:\/\/schema\.org\/ItemList"/);
		assert.match(html, /<meta itemprop="numberOfItems" content="2">/);
		assert.match(html, /<li data-icon="picture-as-pdf" itemprop="itemListElement" itemscope itemtype="https:\/\/schema\.org\/MediaObject"><meta itemprop="encodingFormat" content="application\/pdf"><meta itemprop="contentSize" content="2.4 MB">/);
		assert.match(html, /<a itemprop="contentUrl" href="\/files\/brand-guidelines\.pdf" download="northwind-brand-guidelines\.pdf"><span itemprop="name">Brand guidelines<\/span><\/a> <small>PDF · 2\.4 MB<\/small>/);
	});

	test('the file kind is an allowlist — it picks the glyph and the MIME type', () => {
		const html = card();
		assert.match(html, /<li data-icon="folder-zip" itemprop="itemListElement"[^>]*><meta itemprop="encodingFormat" content="application\/zip">/);
		/* no download name given → the bare attribute keeps the served filename */
		assert.match(html, /<a itemprop="contentUrl" href="\/files\/logo-pack\.zip" download><span itemprop="name">Logo pack<\/span><\/a> <small>ZIP · 18 MB<\/small>/);
	});

	test('an unknown kind gets the generic glyph and NO encodingFormat', () => {
		const html = card({ files: [{ name: 'Mystery blob', url: '/files/blob.bin', size: '1 MB', type: 'exe"><script>' }] });
		assert.match(html, /<li data-icon="draft" itemprop="itemListElement"/);
		assert.ok(!html.includes('encodingFormat'), 'an unknown kind must never reach a machine value');
		assert.ok(!html.includes('<script>'), 'the kind is never interpolated');
	});

	test('a hostile display name comes out escaped', () => {
		const html = card({ files: [{ name: '<img src=x onerror=alert(1)>', url: '/files/x.txt', size: '1 kB', type: 'txt' }] });
		assert.match(html, /<span itemprop="name">&lt;img src=x onerror=alert\(1\)&gt;<\/span>/);
		assert.match(html, /<li data-icon="text-snippet"/);
	});

	test('keywords stay visible chips only — ItemList is an Intangible', () => {
		const html = render({ schemaType: 'filelist', headline: 'Press kit', tags: ['brand'], details });
		assert.ok(!html.includes('itemprop="keywords"'), 'no keywords property on an Intangible');
	});
});

describe('job — EmployerAggregateRating', () => {
	const base = { company: 'Nordlys ApS', location: 'Copenhagen' };
	const rated = { ...base, employerRating: { value: 4.3, count: 268, max: 5, organization: 'Nordlys ApS', sameAs: 'https://nordlys.example' } };
	const card = (details) => render({ schemaType: 'job', headline: 'Senior Frontend Engineer', details });

	/* itemscope with NO itemprop is what makes microdata read this as its OWN item:
	   the rating is of the employer, and JobPosting has no aggregateRating at all */
	test('the rating is a second TOP-LEVEL item, not a property of the posting', () => {
		const html = card(rated);
		assert.match(html, /<div data-part="rating" itemscope itemtype="https:\/\/schema\.org\/EmployerAggregateRating">/);
		assert.ok(!/itemprop="[^"]*" itemscope itemtype="https:\/\/schema\.org\/EmployerAggregateRating"/.test(html), 'an itemprop would make it a property of the JobPosting');
		assert.ok(!html.includes('itemprop="aggregateRating"'), 'JobPosting has no aggregateRating property');
		assert.match(html, /<span itemprop="itemReviewed" itemscope itemtype="https:\/\/schema\.org\/Organization" hidden><meta itemprop="name" content="Nordlys ApS"><meta itemprop="sameAs" content="https:\/\/nordlys\.example"><\/span>/);
		assert.match(html, /<meta itemprop="ratingValue" content="4.3">/);
		assert.match(html, /<meta itemprop="ratingCount" content="268">/);
	});

	/* Google requires the rating be visible to the reader */
	test('the rating renders a real star row with its own wording', () => {
		const html = card(rated);
		assert.match(html, /<input class="ui-rating" type="range" min="1" max="5" value="4.3" step="0.01" disabled aria-hidden="true">/);
		assert.match(html, /<span data-sr>Nordlys ApS rated 4.3 out of 5 by 268 employees<\/span>/);
		assert.match(html, /<span aria-hidden="true">4.3 \/ 5 employer rating \(268 reviews\)<\/span>/);
	});

	test('a job without an employer rating emits none', () => {
		assert.ok(!card(base).includes('EmployerAggregateRating'));
		assert.ok(!card(base).includes('data-part="rating"'));
	});

	/* Phase C parked the rating in a separate fixture to keep its snapshot delta additive.
	   The canonical job demo carries it now — this is what keeps that true. */
	test('the canonical job demo carries the employer rating', () => {
		const ucf = JSON.parse(readFileSync(new URL('./data/job.json', import.meta.url), 'utf8'));
		const html = renderCard(ucf);
		assert.match(html, /itemscope itemtype="https:\/\/schema\.org\/EmployerAggregateRating"/);
		assert.match(html, /<meta itemprop="ratingValue" content="4.3">/);
		assert.match(html, /<meta itemprop="ratingCount" content="268">/);
	});

	/* the shared ratingPart must not have moved the ordinary aggregateRating shape */
	test('an ordinary aggregate rating still carries its itemprop and default labels', () => {
		const html = render({ schemaType: 'product', headline: 'X', details: { rating: { value: 4.5, count: 1247 } } });
		assert.match(html, /<div data-part="rating" itemprop="aggregateRating" itemscope itemtype="https:\/\/schema\.org\/AggregateRating">/);
		assert.match(html, /<span data-sr>Rated 4.5 out of 5 stars from 1,247 ratings<\/span>/);
		assert.match(html, /<span aria-hidden="true">4.5 \/ 5 \(1,247 ratings\)<\/span>/);
	});

	test('a hostile employer name cannot break out of the label', () => {
		const html = card({ ...base, employerRating: { value: 4, count: 2, organization: '"><img src=x onerror=alert(1)>' } });
		assert.ok(!html.includes('<img'), 'attribute breakout must be escaped');
		assert.match(html, /&quot;&gt;&lt;img src=x onerror=alert\(1\)&gt; rated 4 out of 5/, 'the name is present and escaped');
	});

	/* the eyebrow used to carry itemprop="industry" too, so a card published the
	   department AND the sector for one property. details.industry owns it. */
	test('industry is emitted exactly once, from details — never from the eyebrow', () => {
		const html = render({ schemaType: 'job', eyebrow: 'Engineering', headline: 'Senior Frontend Engineer', details: { ...base, industry: 'Software' } });
		assert.equal(html.match(/itemprop="industry"/g).length, 1, 'two values for one property is unreadable to a consumer');
		assert.match(html, /<meta itemprop="industry" content="Software">/);
		assert.match(html, /<small data-part="eyebrow">Engineering<\/small>/, 'the eyebrow stays display text');
	});
});

/* demo/schema.html is the markup render.js reproduces, and schema.compare.js now pairs these
   four types too. Each had drifted by one itemprop; these pin the renderer side of the
   contract the page transcribes. */
/* The product-page pair: a variant picker instead of a link list, and the per-slide
   thumbnail URL an SSR'd mrk(tmb) carousel needs. Both are GATED — the asserts that
   matter most are the ones proving nothing else changed. Docs: docs/media.md § Thumbnails */
describe('product page — variant picker + carousel thumbnails', () => {
	const SIZES = [
		{ name: 'Gown, S', sku: 'PSG-IND-S', size: 'S', price: 249, currency: 'USD' },
		{ name: 'Gown, M', sku: 'PSG-IND-M', size: 'M', price: 249, currency: 'USD' },
		{ name: 'Gown, L', sku: 'PSG-IND-L', size: 'L', price: 249, currency: 'USD', availability: 'Out of stock' }
	];
	const picker = (extra = {}) => render({
		schemaType: 'product', headline: 'Persistence Silk Gown — Indigo',
		details: { subtype: 'ProductGroup', variants: { control: 'buttons', variesBy: ['size'], productGroupID: 'PSG-IND', items: SIZES, ...extra } }
	});

	test('control:"buttons" renders the segmented group, one label per variant', () => {
		const html = picker();
		assert.match(html, /<fieldset class="ui-button-group fs-sm" data-variant="inline rounded border">/);
		assert.equal(count(html, '<label class="ui-button" itemprop="hasVariant" itemscope itemtype="https://schema.org/Product">'), 3);
		assert.ok(!html.includes('<ul data-part="list">'), 'the picker REPLACES the list — one emitter, not two');
	});

	/* the LOOK is ui/button-group's, reached through the same preset seam as
	   parts.quote / parts.accordion — tokens.lint.js validates the words */
	test('parts.buttonGroup overrides the variant words', () => {
		const html = renderCard(
			{ fields: { schemaType: 'product', headline: 'X', preset: { $ref: 'card-preset/p' }, details: { subtype: 'ProductGroup', variants: { control: 'buttons', variesBy: ['size'], items: SIZES } } } },
			{ p: { element: 'ui-card', parts: { buttonGroup: 'outline' } } }
		);
		assert.match(html, /<fieldset class="ui-button-group fs-sm" data-variant="outline">/);
	});

	test('every size keeps its full microdata', () => {
		const html = picker();
		assert.match(html, /<meta itemprop="sku" content="PSG-IND-M">/);
		assert.match(html, /<meta itemprop="size" content="M">/);
		assert.equal(count(html, '<meta itemprop="price" content="249">'), 3);
		assert.match(html, /<meta itemprop="availability" content="https:\/\/schema\.org\/OutOfStock">/);
		assert.equal(count(html, '<meta itemprop="variesBy" content="https://schema.org/size">'), 1);
	});

	/* one shared radio group, minted from the headline so two pickers on one page
	   cannot capture each other's clicks — same reason the graded quiz slugs its options */
	test('the radio group is one minted name, first variant checked', () => {
		const html = picker();
		assert.equal(count(html, 'name="variant-persistence-silk-gown-indigo"'), 3);
		assert.equal(count(html, ' checked>'), 1);
		assert.match(html, /value="S" data-sr checked>/, 'the first variant is the checked one');
	});

	test('the group name can never carry author markup', () => {
		const html = render({
			schemaType: 'product', headline: '"><script>alert(1)</script>',
			details: { subtype: 'ProductGroup', variants: { control: 'buttons', variesBy: ['size'], items: SIZES } }
		});
		assert.ok(!html.includes('<script>'), 'raw <script> must never reach output');
		/* plain() strips the tags, slug() strips everything that is not [a-z0-9] */
		assert.match(html, /name="variant-alert-1"/, 'slugged to an attribute-safe token');
	});

	/* an anchor inside a <label> is a second interactive control fighting the radio */
	test('a variant url is a meta in the picker and an anchor in the list', () => {
		const withUrl = [{ ...SIZES[0], url: '/gown?size=s' }];
		const buttons = render({ schemaType: 'product', headline: 'X', details: { subtype: 'ProductGroup', variants: { control: 'buttons', variesBy: ['size'], items: withUrl } } });
		assert.match(buttons, /<meta itemprop="url" content="\/gown\?size=s">/);
		assert.ok(!/<a itemprop="url"/.test(buttons), 'no anchor inside the label');
		const list = render({ schemaType: 'product', headline: 'X', details: { subtype: 'ProductGroup', variants: { variesBy: ['size'], items: withUrl } } });
		assert.match(list, /<a itemprop="url" href="\/gown\?size=s">/, 'the list form keeps the crawlable anchor');
	});

	test('"list" and an unknown control both render the list', () => {
		for (const control of [undefined, 'list', 'grid', '<script>']) {
			const html = render({ schemaType: 'product', headline: 'X', details: { subtype: 'ProductGroup', variants: { control, variesBy: ['size'], items: SIZES } } });
			assert.match(html, /<ul data-part="list">/, String(control));
			assert.ok(!html.includes('ui-button-group'), String(control));
		}
	});

	/* the ProductGroup gate still governs — a picker on a plain Product is invalid markup */
	test('the picker is still gated on the resolved itemtype', () => {
		const html = render({ schemaType: 'product', headline: 'X', details: { variants: { control: 'buttons', variesBy: ['size'], items: SIZES } } });
		assert.ok(!html.includes('hasVariant'), 'hasVariant is not a Product property');
		assert.match(html, /<!-- variants ignored: itemtype did not resolve to ProductGroup -->/);
	});

	const slides = (presetMedia, images, src = null) => renderCard(
		{ fields: { schemaType: 'product', headline: 'X', preset: { $ref: 'card-preset/t' }, media: (src ? [{ mediaType: 'image', src }] : [{ mediaType: 'image', src: '/a.png' }, { mediaType: 'image', src: '/b.png' }]) } },
		{ t: { element: 'ui-card', media: presetMedia } }, {}, images ? { images } : undefined
	);

	test('mrk(tmb) gives every slide its own thumbnail URL', () => {
		const html = slides('asr(1/1) nav(mrk) mrk(tmb) mrk(rail)');
		assert.equal(count(html, "--ui-carousel-thumb-url: url('/a.png')"), 1);
		assert.equal(count(html, "--ui-carousel-thumb-url: url('/b.png')"), 1);
	});

	test('with the CDN armed the thumb is one narrow transform, not a srcset', () => {
		const html = slides('asr(1/1) nav(mrk) mrk(tmb)', { cdnBase: 'https://cdn.example' });
		assert.match(html, /--ui-carousel-thumb-url: url\('https:\/\/cdn\.example\/cdn-cgi\/image\/format=auto,quality=80,width=160\/a\.png'\)/);
	});

	/* THE gate: no shipped preset carries mrk(tmb) in media=, so existing output is
	   byte-identical — the snapshot would catch a regression, this names it */
	test('no mrk(tmb) means no thumb URL anywhere', () => {
		for (const media of ['asr(1/1) nav', 'asr(4/3) nav(mrk) mrk(pll)', '']) {
			assert.ok(!slides(media).includes('--ui-carousel-thumb-url'), media || '(no media)');
		}
	});

	/* the value lands inside url('…') in an inline style, where esc() does not help */
	test('a hostile src cannot break out of the CSS url()', () => {
		const html = slides('nav(mrk) mrk(tmb)', null, "/a.png'); background: url(evil.png");
		const inner = /--ui-carousel-thumb-url: url\('([^']*)'\)/.exec(/style="([^"]*)"/.exec(html)[1])[1];
		/* quotes, parens and semicolons are DROPPED, not escaped — escaping does not
		   help inside url(), where any of them would end the value */
		assert.ok(!/['();\\]/.test(inner), `the url() value still holds a CSS terminator: ${inner}`);
		assert.equal(inner, '/a.png background: urlevil.png');
	});
});

/* parts.accordion `popover` — a MODE word: accordion() swaps <details>/<summary> for
   <button popovertarget> + <div popover> pairs (native Popover API, no JS). The word is
   stripped from the emitted variant=; ids are `${ucf.id}-${group}-${n}`. Docs: docs/card.md */
describe('parts.accordion popover mode', () => {
	const FAQ = { items: [
		{ question: 'How do I reset my password?', answer: 'Use the reset link.' },
		{ question: 'Can I export my data?', answer: 'Yes, as JSON.' }
	] };
	const faq = (accordion, id) => renderCard(
		{ id, fields: { schemaType: 'faq', headline: 'FAQ', preset: { $ref: 'card-preset/p' }, details: FAQ } },
		{ p: { element: 'ui-card', parts: { accordion } } }
	);

	test('popover word swaps details for button + popover pairs and leaves the chrome words', () => {
		const html = faq('bordered rounded popover', 'faq-x');
		assert.match(html, /<ui-accordion group="faq-render" variant="bordered rounded">/, 'popover stripped from variant=');
		assert.ok(!html.includes('<details'), 'no details in popover mode');
		assert.match(html, /<button type="button" popovertarget="faq-x-faq-render-1">/);
		assert.match(html, /<div popover id="faq-x-faq-render-1">/);
		assert.match(html, /<ui-icon type="arrow upright"><\/ui-icon><\/button>/, 'trigger carries the top-right arrow');
		assert.match(html, /<button type="button" popovertarget="faq-x-faq-render-1" popovertargetaction="hide"><ui-icon type="cross"><\/ui-icon><\/button>/, 'panel header carries a native close button');
	});

	test('a bare popover word drops the variant attribute entirely', () => {
		const html = faq('popover', 'faq-x');
		assert.match(html, /<ui-accordion group="faq-render">/);
	});

	test('item scopes wrap button + popover as one microdata scope, name claimed once', () => {
		const html = faq('popover', 'faq-x');
		assert.match(html, /<div itemprop="mainEntity" itemscope itemtype="https:\/\/schema\.org\/Question"><button type="button" popovertarget="faq-x-faq-render-1">/);
		/* the header repeats the label visually only — tags and their itemprops are stripped */
		assert.equal(count(html, 'itemprop="name">How do I reset my password?'), 1, 'one name per Question');
		assert.match(html, /<header><span>How do I reset my password\?<\/span>/);
	});

	test('without a ucf id the ids fall back to group-index', () => {
		const html = faq('popover');
		assert.match(html, /popovertarget="faq-render-1"/);
		assert.match(html, /<div popover id="faq-render-2">/);
	});

	test('recipe: the outer wrapper becomes the popover, the inner steps accordion is untouched', () => {
		const html = renderCard(
			{ id: 'recipe-x', fields: { schemaType: 'recipe', headline: 'X', preset: { $ref: 'card-preset/p' }, details: { instructions: ['Chop.', 'Cook.'] } } },
			{ p: { element: 'ui-card', parts: { accordion: 'bordered rounded popover' } } }
		);
		assert.match(html, /<button type="button" popovertarget="recipe-x-recipe-acc-1">Instructions</);
		/* outer item carries no scope — no wrapper div around the pair */
		assert.ok(!html.includes('<div itemscope'), 'outer pair stays unwrapped');
		/* the panel body is the inner accordion, exactly as in accordion mode */
		assert.match(html, /<ui-accordion group="recipe-step" variant="divided" itemprop="recipeInstructions" itemscope itemtype="https:\/\/schema\.org\/ItemList">/);
		assert.equal(count(html, '<details name="recipe-step"'), 2, 'inner steps stay details');
		assert.equal(count(html, 'itemtype="https://schema.org/HowToStep"'), 2);
	});

	test('without the word the details form renders unchanged', () => {
		const html = faq('divided', 'faq-x');
		assert.match(html, /<ui-accordion group="faq-render" variant="divided">/);
		assert.equal(count(html, '<details name="faq-render"'), 2);
		assert.ok(!html.includes('popovertarget'), 'no popover artifacts in accordion mode');
	});
});

/* The map frame: a mediaType the renderer builds a URL for rather than passing through,
   so every assert here is about what may reach that URL. Docs: docs/media.md § Map */
describe('map — the frame as an embedded map', () => {
	const MAP = [{ mediaType: 'map', alt: 'Map of X' }];
	const place = (geo, media = MAP, extra = {}) =>
		render({ schemaType: 'location', headline: 'Nordhavn Studio', media, details: { geo, ...extra } });

	/* the layer= string picks the basemap. Six of OSM's eight switcher entries are
	   embeddable; the other two carry no canEmbed flag and the embed silently renders
	   Standard. Docs: docs/media.md § Basemap layer */
	test('the basemap defaults to mapnik', () => {
		assert.match(place({ latitude: 0, longitude: 0 }), /;layer=mapnik&amp;/);
	});

	test('an embeddable layer is written through', () => {
		const html = place({ latitude: 0, longitude: 0 }, [{ mediaType: 'map', layer: 'cyclosm' }]);
		assert.match(html, /;layer=cyclosm&amp;/);
	});

	test('every embeddable layer is spellable', () => {
		for (const layer of ['mapnik', 'cyclosm', 'cyclemap', 'transportmap', 'hot', 'shortbread']) {
			assert.match(place({ latitude: 0, longitude: 0 }, [{ mediaType: 'map', layer }]),
				new RegExp(`;layer=${layer}&amp;`), layer);
		}
	});

	test('a layer OSM cannot embed is refused, not passed through', () => {
		/* tracestracktopo and openmaptiles_osm are in the switcher but carry no canEmbed
		   flag — passing them through would ship a value that silently does nothing */
		for (const layer of ['tracestracktopo', 'openmaptiles_osm', 'nonsense']) {
			assert.match(place({ latitude: 0, longitude: 0 }, [{ mediaType: 'map', layer }]),
				/;layer=mapnik&amp;/, layer);
		}
	});

	test('a layer value never reaches the URL unescaped', () => {
		const html = place({ latitude: 0, longitude: 0 }, [{ mediaType: 'map', layer: 'a"&onerror=x' }]);
		assert.doesNotMatch(html, /onerror/);
	});

	test('every map on demo/schema.place.html is expressible as data', () => {
		/* the page is hand-authored; this asserts the MODEL could produce it — layer plus
		   the existing zoom, with the bbox derived. If it fails, the model has a gap. */
		const page = readFileSync(new URL('./demo/schema.place.html', import.meta.url), 'utf8');
		const frames = [...page.matchAll(/embed\.html\?bbox=([^&]+)&amp;layer=([a-z_]+)&amp;marker=([-\d.]+),([-\d.]+)/g)];
		assert.equal(frames.length, 8, 'expected the eight layer cards');
		for (const [, bbox, layer, lat, lon] of frames) {
			const built = place({ latitude: +lat, longitude: +lon },
				[{ mediaType: 'map', layer, zoom: zoomFor(+lat, +lon, bbox) }]);
			assert.match(built, new RegExp(`bbox=${bbox.replace(/\./g, '\\.')}&amp;layer=${layer}&amp;`),
				`${layer} at ${lat},${lon}`);
		}
	});

	/* the zoom whose derived bbox matches the page's — proves the bbox needs no field */
	const zoomFor = (lat, lon, bbox) => {
		for (let z = 1; z <= 20; z++) {
			const lonHalf = 180 / 2 ** z, latHalf = lonHalf * Math.cos(lat * Math.PI / 180);
			const box = [lon - lonHalf, lat - latHalf, lon + lonHalf, lat + latHalf].map((n) => n.toFixed(6)).join(',');
			if (box === bbox) return z;
		}
		throw new Error(`no zoom derives ${bbox}`);
	};

	test('details.geo builds the OSM bbox + marker', () => {
		const html = place({ latitude: 55.7076, longitude: 12.5993 });
		/* zoom 16 → lonHalf 180/2**16 = 0.002747; latHalf scaled by cos(55.7076°) */
		assert.match(html, /src="https:\/\/www\.openstreetmap\.org\/export\/embed\.html\?bbox=12\.596553,55\.706053,12\.602047,55\.709147&amp;layer=mapnik&amp;marker=55\.7076,12\.5993"/);
		assert.match(html, /<iframe [^>]*loading="lazy"/);
	});

	test('zoom widens the box and is clamped to 1–20', () => {
		assert.match(place({ latitude: 0, longitude: 0 }, [{ mediaType: 'map', zoom: 14 }]), /bbox=-0\.010986,-0\.010986,0\.010986,0\.010986/);
		/* 99 clamps to 20, not to a box of zero width */
		assert.match(place({ latitude: 0, longitude: 0 }, [{ mediaType: 'map', zoom: 99 }]), /bbox=-0\.000172,-0\.000172,0\.000172,0\.000172/);
	});

	test('the title falls back to the headline when alt is absent', () => {
		assert.match(place({ latitude: 55.7, longitude: 12.6 }, [{ mediaType: 'map' }]), /<iframe [^>]*title="Map of Nordhavn Studio"/);
	});

	/* hasMap is a Place property — a card whose itemtype is not a Place still gets the
	   map, but must not claim the property. */
	test('itemprop="hasMap" is gated to Place-descended types', () => {
		assert.match(place({ latitude: 55.7, longitude: 12.6 }), /<iframe [^>]*itemprop="hasMap"/);
		assert.match(
			render({ schemaType: 'business', headline: 'X', media: MAP, details: { geo: { latitude: 55.7, longitude: 12.6 } } }),
			/<iframe [^>]*itemprop="hasMap"/
		);
		const article = render({ schemaType: 'article', headline: 'X', media: MAP, details: { geo: { latitude: 55.7, longitude: 12.6 } } });
		assert.match(article, /<iframe /, 'the frame still renders');
		assert.ok(!article.includes('hasMap'), 'but never claims hasMap on a non-Place');
	});

	/* hasMap is single-valued here: the "Open in Maps" action deliberately stays
	   unmarked, so a map card declares the property exactly once. */
	test('hasMap is emitted once, not also on the map action link', () => {
		const html = place({ latitude: 55.7, longitude: 12.6, url: 'https://maps.example/x' });
		assert.equal(html.match(/hasMap/g).length, 1);
	});

	test('unusable coordinates render no frame at all', () => {
		for (const geo of [undefined, {}, { latitude: 55.7 }, { latitude: 'north', longitude: 12.6 }, { latitude: NaN, longitude: 12.6 }, { latitude: 91, longitude: 12.6 }, { latitude: 55.7, longitude: 181 }]) {
			assert.ok(!place(geo).includes('<iframe'), `expected no frame for ${JSON.stringify(geo)}`);
		}
	});

	test('an item may override details.geo with its own point', () => {
		assert.match(place({ latitude: 0, longitude: 0 }, [{ mediaType: 'map', latitude: 55.7076, longitude: 12.5993 }]), /marker=55\.7076,12\.5993/);
	});

	/* google/apple cannot be built from coordinates alone — an unkeyed provider must
	   degrade to OSM rather than emit a dead frame. */
	test('an unknown or unkeyed provider falls back to OSM', () => {
		assert.match(place({ latitude: 55.7, longitude: 12.6 }, [{ mediaType: 'map', provider: 'apple' }]), /openstreetmap\.org/);
		assert.match(place({ latitude: 55.7, longitude: 12.6 }, [{ mediaType: 'map', provider: 'google' }]), /openstreetmap\.org/);
	});

	test('google builds its embed once details.map.key is set', () => {
		const html = place({ latitude: 55.7, longitude: 12.6 }, [{ mediaType: 'map', provider: 'google' }], { map: { key: 'AI za&1' } });
		assert.match(html, /src="https:\/\/www\.google\.com\/maps\/embed\/v1\/place\?key=AI%20za%261&amp;q=55\.7,12\.6&amp;zoom=16"/);
	});

	test('hostile input cannot break out of the iframe attributes', () => {
		const html = place({ latitude: 55.7, longitude: 12.6 }, [{
			mediaType: 'map',
			alt: '"><script>alert(1)</script>',
			src: '"><script>alert(2)</script>'
		}]);
		assert.ok(!html.includes('<script>'), 'raw <script> must never reach output');
		assert.match(html, /title="&quot;&gt;&lt;script&gt;alert\(1\)&lt;\/script&gt;"/);
		assert.match(html, /src="&quot;&gt;&lt;script&gt;alert\(2\)&lt;\/script&gt;"/);
	});
});

describe('reference-page reconciliation — contact, course, place, social', () => {
	test('a ContactPoint headline is its name', () => {
		const html = render({ schemaType: 'contact', headline: 'Talk to a human', details: { contactType: 'customer support' } });
		assert.match(html, /<h\d data-part="headline" itemprop="name">Talk to a human<\/h\d>/);
	});

	test('the department opens the contact meta row', () => {
		const html = render({ schemaType: 'contact', headline: 'X', details: { department: 'Customer Success', availableHoursDisplay: 'Mon–Fri 9–17 CET', responseTime: 'within 2 hours' } });
		assert.match(html, /<p data-part="meta">Customer Success · Mon–Fri 9–17 CET · Replies within 2 hours<\/p>/);
	});

	/* Course.provider is the ORGANISATION and Google requires it; the teacher is the
	   CourseInstance's instructor. Naming one in the other's slot misdeclares both. */
	test('Course.provider rides its own scope, beside the instance instructor', () => {
		const html = render({ schemaType: 'course', headline: 'X', details: { provider: 'Calm Academy', instructor: { name: 'Calm Academy' } } });
		assert.match(html, /<span itemprop="provider" itemscope itemtype="https:\/\/schema\.org\/Organization" hidden><meta itemprop="name" content="Calm Academy"><\/span>/);
		assert.match(html, /<span itemprop="instructor" itemscope itemtype="https:\/\/schema\.org\/Person">/);
	});

	test('a Place telephone is a real tel: link, not a meta', () => {
		const html = render({ schemaType: 'location', headline: 'X', details: { contact: '+45 56 48 24 01' } });
		assert.match(html, /<a itemprop="telephone" href="tel:\+4556482401">\+45 56 48 24 01<\/a>/);
	});

	/* the byline `role` is a JOB TITLE — the demo card had been using it to carry a
	   dateline, which emitted jobTitle="Jun 28" beside a real <time> */
	test('a social byline with no role emits no jobTitle, and the date is a <time>', () => {
		const html = render({ schemaType: 'social', headline: 'X', published: '2026-06-28T16:20:00Z', authors: [{ name: '@wildlifewatch' }], details: { platform: 'Chirper' } });
		assert.ok(!html.includes('itemprop="jobTitle"'), 'no role, no jobTitle');
		assert.match(html, /<small data-part="dateline"><time datetime="2026-06-28T16:20:00Z">/, 'the dateline is a <time>, not prose');
		assert.equal(count(html, 'itemprop="author"'), 1, 'the byline is the author — a details author would make a second one');
	});

	test('a post body is a <q> inside its blockquote', () => {
		const html = render({ schemaType: 'social', headline: 'X', summary: 'Worth every minute.', details: { platform: 'Chirper' } });
		assert.match(html, /<blockquote itemprop="text"><q>Worth every minute\.<\/q><\/blockquote>/);
	});

	/* the counters are InteractionCounter values, so the footer says what they count:
	   410 ShareActions are shares, and 3200 is 3,200 */
	test('the engagement footer reads off the counters it emits', () => {
		const html = render({ schemaType: 'social', headline: 'X', engagement: { likeCount: 3200, shareCount: 410, commentCount: 87 }, details: { platform: 'Chirper' } });
		assert.match(html, /<footer data-part="footer"><span data-part="count" data-icon="favorite">3,200 likes<\/span> · <span data-part="count" data-icon="share">410 shares<\/span> · <span data-part="count" data-icon="mode-comment">87 comments<\/span><\/footer>/);
		assert.match(html, /<meta itemprop="interactionType" content="https:\/\/schema\.org\/ShareAction"><meta itemprop="userInteractionCount" content="410">/);
	});
});

/* `Offer.price` accepts Text as well as Number, so `<data itemprop="price" value="279">$279</data>`
   VALIDATES — it was surviving on that Text arm, not on being read correctly. Google's guidance
   is explicit that the value carries no currency symbol and no thousands separator, and the
   validator reads the TEXT node: the same asymmetry that failed `numberOfBedrooms` on
   "3 bedrooms" while `yearBuilt` passed on "2018". Every priced row states the number ONCE,
   on a <meta>, and the visible string stays human. */
describe('price rows — the machine value never rides the visible text', () => {
	const PRICED = [
		['product', 'product', { price: { current: 279, currency: 'USD', original: 329, discountText: '-15%' } }],
		['product variants', 'product', { subtype: 'ProductGroup', variants: VARIANTS }],
		['event offers', 'event', { startDate: '2026-11-09', offers: [{ name: 'Early bird', price: 299, currency: 'EUR' }] }],
		['course', 'course', { price: { current: 89, currency: 'USD', original: 129 } }],
		['booking', 'booking', { venue: 'Studio', price: { hourlyRate: 45, currency: 'USD' } }],
		['membership', 'membership', { price: { monthly: 29, yearly: 290, currency: 'USD' } }],
		['software', 'software', { price: { current: 19, currency: 'USD' } }],
		['book', 'book', { price: { current: 34, currency: 'EUR' } }],
		['realestate', 'realestate', { price: { amount: 7250000, currency: 'DKK' }, property: { type: 'Apartment' } }],
		['menu item', 'menu', { sections: [{ name: 'Mains', items: [{ name: 'Stew', price: 95, currency: 'DKK' }] }] }],
		['service catalog', 'service', { catalog: { items: [{ name: 'Managed Kubernetes', price: 450, currency: 'EUR' }] } }],
		['loyalty tier', 'loyalty', { tiers: [{ name: 'Gold', requirementAmount: { currency: 'USD', value: 500 } }] }]
	];

	for (const [where, schemaType, details] of PRICED) {
		test(`${where} states its price once, on a <meta>`, () => {
			const html = render({ schemaType, headline: 'X', details });
			/* every element carrying the property — priceCurrency does not match */
			const carriers = [...html.matchAll(/<([a-z-]+)[^>]*\bitemprop="(?:price|totalPrice|value)"[^>]*>/g)].map((m) => m[1]);
			assert.ok(carriers.length > 0, 'the row must still declare a price');
			for (const tag of carriers) assert.equal(tag, 'meta', `itemprop rode a <${tag}>, whose text node is the value a validator reads`);
			assert.ok(!html.includes('<data'), 'a formatted price must never sit inside <data>');
			/* `value` is polymorphic (a LocationFeatureSpecification's is a boolean) — the
			   numeric contract is the price's */
			for (const [, machine] of html.matchAll(/<meta itemprop="(?:price|totalPrice)" content="([^"]*)">/g)) {
				assert.match(machine, /^\d+(\.\d+)?$/, 'no currency symbol, no thousands separator');
			}
		});
	}

	/* the human string is the point of the split — absence of <data> alone would pass
	   if the price simply stopped rendering */
	test('the visible string stays human, currency symbol and separators included', () => {
		const html = render({ schemaType: 'realestate', headline: 'X', details: { price: { amount: 7250000, currency: 'DKK' }, property: { type: 'Apartment' } } });
		assert.match(html, /content="7250000">DKK\s7,250,000/, 'formatted beside its machine value');
	});
});

/* the new price/number sinks reach TEXT NODES through fmtPrice()/num() — the same
   injection shape the formatter suite pins for the older types */
describe('markup-first types — formatter sinks', () => {
	const XSS = '<img src=x onerror=alert(1)>';
	test('a hostile price is escaped in every new price row shape', () => {
		const rows = [
			['loyalty tier', { schemaType: 'loyalty', headline: 'X', details: { tiers: [{ name: 'T', requirementAmount: { currency: '', value: XSS } }] } }],
			['service catalog', { schemaType: 'service', headline: 'X', details: { catalog: { items: [{ name: 'S', price: XSS, currency: '' }] } } }],
			['realestate offer', { schemaType: 'realestate', headline: 'X', details: { price: { amount: XSS, currency: '' } } }],
			['menu item', { schemaType: 'menu', headline: 'X', details: { sections: [{ name: 'S', items: [{ name: 'I', price: XSS, currency: '' }] }] } }]
		];
		for (const [where, fields] of rows) {
			const html = render(fields);
			assert.ok(!html.includes('<img'), `${where}: raw <img must never reach output`);
			assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/, `${where}: the price must still render, escaped`);
			assert.ok(!html.includes('&amp;lt;'), `${where}: double-escaped output`);
		}
	});
	test('a hostile number is escaped in every new num() row shape', () => {
		const rows = [
			['realestate facts', { schemaType: 'realestate', headline: 'X', details: { property: { bedrooms: XSS } } }],
			['tv series', { schemaType: 'tvseries', headline: 'X', details: { numberOfSeasons: XSS } }],
			['podcast series', { schemaType: 'podcastseries', headline: 'X', details: { episodeCount: XSS } }],
			['album', { schemaType: 'music', headline: 'X', details: { numTracks: XSS } }],
			['comic series', { schemaType: 'comicseries', headline: 'X', details: { issueCount: XSS } }],
			['comic issue', { schemaType: 'comicissue', headline: 'X', details: { issueNumber: XSS } }]
		];
		for (const [where, fields] of rows) {
			const html = render(fields);
			assert.ok(!html.includes('<img'), `${where}: raw <img must never reach output`);
			assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/, `${where}: the number must still render, escaped`);
			assert.ok(!html.includes('&amp;lt;'), `${where}: double-escaped output`);
		}
	});
});

/* ── one item, one value per property ──
   Two emitters can reach the same root-scope itemprop: the envelope and the type's
   DETAILS renderer. `industry` shipped twice on a job card that way, and `author` can
   still do it on a social post. Docs: docs/schema.md § One property, one value */
describe('one property, one value', () => {
	test('details.author yields the author property to the envelope byline', () => {
		const html = render({ schemaType: 'social', headline: 'Thread', details: { platform: 'Chirper', author: '@field' } });
		assert.equal(count(html, 'itemprop="author"'), 1, 'details.author alone declares it once');
		const both = render({
			schemaType: 'social', headline: 'Thread',
			authors: [{ name: '@wildlifewatch' }],
			details: { platform: 'Chirper', author: '@field' }
		});
		assert.equal(count(both, 'itemprop="author"'), 1, 'the byline is the only author');
		assert.match(both, /itemprop="name">@wildlifewatch</, 'the envelope author is the one kept');
		assert.match(both, /data-part="meta">@field · Chirper/, 'the details name stays visible, without microdata');
	});

	test('re-adding an eyebrow itemprop that DETAILS also emits cannot duplicate it', () => {
		/* the exact regression: EYEBROW_PROP.job = 'industry' beside DETAILS.job's meta */
		const ucf = JSON.parse(readFileSync(new URL('./data/job.json', import.meta.url), 'utf8'));
		assert.equal(count(renderCard(ucf), 'itemprop="industry"'), 1, 'baseline: once');
		EYEBROW_PROP.job = 'industry';
		try {
			const html = renderCard(ucf);
			assert.equal(count(html, 'itemprop="industry"'), 1, 'still once — DETAILS yielded');
			assert.match(html, /data-part="eyebrow" itemprop="industry"/, 'the envelope is the one that kept it');
		} finally {
			delete EYEBROW_PROP.job;
		}
	});

	test('DETAILS.job keeps its industry meta while no envelope property claims it', () => {
		assert.match(render({ schemaType: 'job', headline: 'Dev', details: { industry: 'Software', company: 'C', location: 'L' } }),
			/<meta itemprop="industry" content="Software">/);
	});

	/* Corpus invariant. Repeated properties are LEGAL — schema.org lets most take many
	   values, and the corpus repeats 42 of them on purpose — so the check is an allowlist:
	   any property repeating on one item that is not declared multi-value here is a
	   collision between two emitters, which is what went wrong twice. */
	const REPEATABLE = new Set([
		'actor', 'album', 'amenityFeature', 'author', 'availableLanguage', 'bed', 'containsSeason', 'dayOfWeek',
		'department', 'distribution', 'genre', 'hasDefinedTerm', 'hasMenuItem', 'hasMenuSection', 'hasPart',
		'hasTierBenefit', 'hasTiers', 'hasVariant', 'image', 'interactionStatistic', 'itemListElement',
		'keywords', 'knowsAbout', 'knowsLanguage', 'mainEntity', 'member', 'offers', 'openingHours',
		'openingHoursSpecification', 'operatingSystem', 'recipeIngredient', 'review', 'sameAs', 'signOrSymptom',
		'step', 'subEvent', 'suggestedAnswer', 'suitableForDiet', 'supply', 'track', 'variableMeasured',
		'variesBy', 'video'
	]);
	/* Live collisions of the same class, found BY this check, deferred because their
	   precedence runs the other way per site — demo/schema.html gives the envelope value
	   for SpecialAnnouncement.datePosted and the media item's for VideoObject.uploadDate.
	   docs/plans/open-items.md */
	const KNOWN = new Set(['SpecialAnnouncement·datePosted', 'VideoObject·uploadDate']);

	/* attributes a property to the nearest enclosing itemscope — an element carrying both
	   itemprop and itemscope declares the property on its PARENT item, then opens its own */
	const VOID = new Set(['meta', 'img', 'input', 'br', 'hr', 'source', 'link', 'area', 'col', 'embed', 'param', 'track', 'wbr']);
	const TAG = /<(\/?)([a-zA-Z][-a-zA-Z0-9]*)((?:\s+[^\s=/>]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*))?)*)\s*(\/?)>/g;
	const ATTR = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]*)))?/g;
	const repeatedProps = (html) => {
		const open = [], items = [{ props: new Set(), type: '#top' }], found = [];
		TAG.lastIndex = 0;
		let m;
		while ((m = TAG.exec(html))) {
			const [, close, tag, raw, selfClose] = m;
			const name = tag.toLowerCase();
			if (close) {
				for (let i = open.length - 1; i >= 0; i--) if (open[i].name === name) {
					for (let j = open.length - 1; j >= i; j--) if (open[j].scope) items.pop();
					open.length = i;
					break;
				}
				continue;
			}
			const a = {};
			ATTR.lastIndex = 0;
			let at;
			while ((at = ATTR.exec(raw || ''))) { if (!at[1]) break; a[at[1]] = at[2] ?? at[3] ?? at[4] ?? true; }
			const item = items.at(-1);
			for (const prop of String(a.itemprop === true ? '' : a.itemprop || '').split(/\s+/).filter(Boolean)) {
				if (item.props.has(prop)) found.push(`${item.type}·${prop}`);
				item.props.add(prop);
			}
			const isScope = a.itemscope !== undefined;
			if (isScope) items.push({ props: new Set(), type: String(a.itemtype || '?').replace('https://schema.org/', '') });
			if (!VOID.has(name) && !selfClose) open.push({ name, scope: isScope });
			else if (isScope) items.pop();
		}
		return found;
	};

	test('no card in data/ declares a single-valued property twice on one item', () => {
		const dir = new URL('./data/', import.meta.url);
		const presets = {
			...JSON.parse(readFileSync(new URL('card.presets.json', dir), 'utf8')).presets,
			...JSON.parse(readFileSync(new URL('card.presets.demo.json', dir), 'utf8')).presets
		};
		const files = [
			...readdirSync(dir).filter((f) => f.endsWith('.json') && !f.startsWith('card.presets') && f !== 'index.json' && f !== 'tokens.json' && f !== 'details.json').map((f) => new URL(f, dir)),
			...readdirSync(new URL('demo/', dir)).filter((f) => f.endsWith('.json')).map((f) => new URL(`demo/${f}`, dir))
		];
		assert.ok(files.length > 100, `expected the whole corpus, got ${files.length}`);
		const bad = [];
		for (const file of files) {
			const html = renderCard(JSON.parse(readFileSync(file, 'utf8')), presets);
			for (const hit of repeatedProps(html)) {
				if (REPEATABLE.has(hit.split('·')[1]) || KNOWN.has(hit)) continue;
				bad.push(`${file.pathname.split('/').pop()}: ${hit}`);
			}
		}
		assert.deepEqual(bad, [], 'a property repeated on one item without being multi-valued');
	});
});

/* ── inline-markup allowlist ──
   renderInline() escapes everything, then re-allows an exact list of tag spellings.
   Every entry reaches output UNESCAPED, so each one is tested for the bare form
   surviving AND the attributed form not. Docs: docs/content.md § Inline markup */
describe('inline markup allowlist', () => {
	const headline = (text) => /data-part="headline"[^>]*>([\s\S]*?)<\/h3>/.exec(render({ schemaType: 'content', headline: text }))[1];
	/* the body only renders under a preset whose text mode is not the default "summary" */
	const BODY_PRESET = { article: { element: 'ui-card', variant: 'col', text: 'body' } };
	const body = (text) => renderCard({ fields: { schemaType: 'article', headline: 'H', body: text, preset: { $ref: 'card-preset/article' } } }, BODY_PRESET);

	for (const tag of ['b', 'em', 'code']) {
		test(`<${tag}> passes through bare and is escaped with an attribute`, () => {
			assert.equal(headline(`say <${tag}>this</${tag}>`), `say <${tag}>this</${tag}>`);
			const hostile = headline(`<${tag} onmouseover=alert(1)>x</${tag}>`);
			assert.ok(!hostile.includes(`<${tag} `), 'an attributed tag must never reach output');
			assert.match(hostile, new RegExp(`&lt;${tag} onmouseover=alert\\(1\\)&gt;`), 'it renders, escaped');
			/* the closing half must not survive on its own once the opener was escaped */
			assert.ok(!hostile.includes(`</${tag}>`), 'no orphaned closing tag');
			assert.match(body(`<${tag}>marked</${tag}>`), new RegExp(`<${tag}>marked</${tag}>`), 'body uses the same list');
			assert.ok(!body(`<${tag} class="x">y</${tag}>`).includes(`<${tag} class`), 'body rejects attributes too');
		});
	}

	test('only the exact lowercase spelling is allowed', () => {
		for (const spelling of ['<EM>x</EM>', '<em >x</em>', '< em>x</em>', '<em/>x']) {
			assert.ok(!/<em/i.test(headline(spelling)), `${spelling} must stay escaped`);
		}
	});

	test('an unclosed or reversed tag renders fully escaped', () => {
		/* an unclosed formatting element joins the parser's active-formatting list and is
		   reconstructed inside every following element — one missing </em> would italicise
		   the rest of the page. Balance is checked, and unbalanced input loses the markup. */
		assert.equal(headline('<em>unclosed'), '&lt;em&gt;unclosed');
		assert.equal(headline('</em>backwards<em>'), '&lt;/em&gt;backwards&lt;em&gt;');
		assert.equal(headline('<b>a</b> <em>b'), '&lt;b&gt;a&lt;/b&gt; &lt;em&gt;b', 'one bad tag escapes the whole string');
		assert.match(headline('<em>a</em> and <em>b</em>'), /^<em>a<\/em> and <em>b<\/em>$/, 'repeated balanced pairs are fine');
	});

	test('crossed tags stay inside the element they were authored in', () => {
		/* count-balanced but misnested: the parser's adoption agency re-nests it in place.
		   No end tag can close an ancestor, so the microdata structure cannot move. */
		assert.equal(headline('<b><em>x</b></em>'), '<b><em>x</b></em>');
		assert.equal(headline('<em><code>x</code></em>'), '<em><code>x</code></em>');
	});

	/* the list applies to authored PROSE only. Everything else is a label or a machine
	   value and stays plain — widening one of these would put raw markup in an itemprop
	   whose value a consumer reads as text. */
	test('fields that must stay plain do not honour the list', () => {
		const plainFields = [
			['summary', { schemaType: 'content', headline: 'H', summary: '<em>no</em>' }],
			['eyebrow', { schemaType: 'article', headline: 'H', eyebrow: '<em>no</em>' }],
			['subheadline', { schemaType: 'content', headline: 'H', subheadline: '<em>no</em>' }],
			['tag', { schemaType: 'content', headline: 'H', tags: ['<em>no</em>'] }],
			['quiz question', { schemaType: 'quiz', headline: 'H', details: { cards: [{ question: '<em>no</em>', answer: 'a' }] } }],
			['glossary term name', { schemaType: 'glossary', headline: 'H', details: { terms: [{ name: '<em>no</em>', description: 'd' }] } }]
		];
		for (const [where, fields] of plainFields) {
			const html = render(fields);
			assert.ok(!html.includes('<em>'), `${where}: must not honour inline markup`);
			assert.match(html, /&lt;em&gt;no&lt;\/em&gt;/, `${where}: still renders, escaped`);
		}
	});

	test('the two prose fields the reference page marks up do honour it', () => {
		assert.match(render({ schemaType: 'quiz', headline: 'H', details: { cards: [{ question: 'q', answer: 'one <em>logical</em> qubit' }] } }),
			/itemprop="text">one <em>logical<\/em> qubit</);
		assert.match(render({ schemaType: 'glossary', headline: 'H', details: { terms: [{ name: 'Cascade layer', description: 'no <code>!important</code>' }] } }),
			/itemprop="description">no <code>!important<\/code></);
	});

	/* ui-gradient-text carries its colour stops as an attribute (the marquee demo's
	   pattern) — allowed through with the same bounded charset high-light's fill/ink use,
	   so a data headline can sweep green without a preset. size= stays out: the default
	   150% is what every demo uses. Docs: docs/content.md § Inline markup */
	test('<ui-gradient-text> keeps a bounded gradient= and rejects anything else', () => {
		const stops = '#14532d, #15803d, #4ade80, #15803d, #14532d';
		assert.equal(headline(`on <ui-gradient-text animate="slide" gradient="${stops}">sweeping</ui-gradient-text> climate`),
			`on <ui-gradient-text animate="slide" gradient="${stops}">sweeping</ui-gradient-text> climate`);
		assert.equal(headline(`<ui-gradient-text gradient="${stops}">x</ui-gradient-text>`), `<ui-gradient-text gradient="${stops}">x</ui-gradient-text>`, 'gradient alone');
		assert.equal(headline('<ui-gradient-text gradient="var(--brand-a), var(--brand-b)">x</ui-gradient-text>'), '<ui-gradient-text gradient="var(--brand-a), var(--brand-b)">x</ui-gradient-text>', 'custom properties are inside the charset');
		for (const hostile of [
			'<ui-gradient-text gradient="url(javascript:alert(1))">x</ui-gradient-text>',
			'<ui-gradient-text gradient="red" onmouseover="alert(1)">x</ui-gradient-text>',
			`<ui-gradient-text gradient="${'#0f0, '.repeat(20)}#0f0">x</ui-gradient-text>`,
			'<ui-gradient-text size="300%">x</ui-gradient-text>'
		]) {
			const out = headline(hostile);
			assert.ok(!out.includes('<ui-gradient-text'), `must stay escaped: ${hostile.slice(0, 60)}`);
			assert.ok(!out.includes('</ui-gradient-text>'), 'no orphaned closing tag');
		}
	});
});

/* ── clean data, and the meta that lets it stay clean ──
   iOS Safari's data detectors read a hyphenated identifier (the Book ISBN, the ComicSeries
   ISSN) as a phone number and link it `tel:`. The system's answer is the PAGE-LEVEL
   <meta name="format-detection" content="telephone=no"> — never invisible characters spliced
   into the text, which is what the ISBN used to do (U+2060 word joiners after each hyphen).
   Two halves, so "rely on the meta" is enforced instead of remembered:
   the renderer emits clean strings, and every page showing one declares the meta.
   Docs: docs/schema.md § Book */
/* An icon marker is a data-icon whose value must exist in @browser.style/icon's
   generated catalog — an unknown name is silently inert in the browser (the list
   falls back to its normal marker), so it is caught here instead.
   Docs: docs/content.md § Icon markers */
describe('icon markers', () => {
	const icons = new Set(
		JSON.parse(readFileSync(new URL('../icon/icons.json', import.meta.url), 'utf8'))
			.icons.map((n) => n.replace(/_/g, '-'))
	);

	/* the DETAIL-page instances (demo/realestate, demo/rentals) carry icons too, and an
	   unknown name is silently inert in the browser — walk them as well as data/ */
	test('every data-icon in the demo corpus names a real glyph', () => {
		const dir = new URL('./data/', import.meta.url);
		const presets = JSON.parse(readFileSync(new URL('./card.presets.demo.json', dir), 'utf8'));
		const roots = [dir, new URL('./demo/realestate/', import.meta.url), new URL('./demo/rentals/', import.meta.url)];
		const seen = new Set();
		let files = 0;
		for (const root of roots) {
			for (const file of readdirSync(root).filter((f) => f.endsWith('.json'))) {
				let ucf;
				try { ucf = JSON.parse(readFileSync(new URL(file, root), 'utf8')); } catch { continue; }
				if (ucf?.model !== 'card') continue;
				files++;
				for (const [, name] of renderCard(ucf, presets).matchAll(/ data-icon="([^"]+)"/g)) seen.add(name);
			}
		}
		for (const name of seen) assert.ok(icons.has(name), `data-icon="${name}" is not in ui/icon/icons.json`);
		assert.ok(seen.size > 0, 'expected the corpus to exercise at least one icon marker');
		assert.ok(files > 30, `expected the walk to reach every instance, saw ${files}`);
	});

	test('icons.data.js mirrors the manifest exactly, in order', () => {
		const js = readFileSync(new URL('../icon/icons.data.js', import.meta.url), 'utf8');
		const mirrored = [...js.matchAll(/'([a-z0-9-]+)'/g)].map((m) => m[1]);
		assert.deepStrictEqual(mirrored, [...icons], 'run `cd ui/icon && npm run build:icons`');
	});

	test('the generated sheet defines every icon in the manifest', () => {
		const css = readFileSync(new URL('../icon/icon-font.css', import.meta.url), 'utf8');
		for (const name of icons) {
			assert.match(css, new RegExp(`--icon-${name}:`), `--icon-${name} missing from icon-font.css`);
			assert.match(css, new RegExp(`\\[data-icon="${name}"\\]`), `[data-icon="${name}"] missing from icon-font.css`);
		}
	});
});

describe('data detectors', () => {
	/* U+00AD soft hyphen · U+200B-200D zero width · U+2060 word joiner · U+FEFF BOM */
	const INVISIBLE = /[­​-‍⁠﻿]/;

	test('no rendered card splices invisible characters into its text', () => {
		const dir = new URL('./data/', import.meta.url);
		const presets = {
			...JSON.parse(readFileSync(new URL('card.presets.json', dir), 'utf8')).presets,
			...JSON.parse(readFileSync(new URL('card.presets.demo.json', dir), 'utf8')).presets
		};
		const files = [
			...readdirSync(dir).filter((f) => f.endsWith('.json') && !f.startsWith('card.presets') && f !== 'index.json' && f !== 'tokens.json' && f !== 'details.json').map((f) => new URL(f, dir)),
			...readdirSync(new URL('demo/', dir)).filter((f) => f.endsWith('.json')).map((f) => new URL(`demo/${f}`, dir))
		];
		assert.ok(files.length > 100, `expected the whole corpus, got ${files.length}`);
		const bad = files.filter((file) => INVISIBLE.test(renderCard(JSON.parse(readFileSync(file, 'utf8')), presets)))
			.map((file) => file.pathname.split('/').pop());
		assert.deepEqual(bad, [], 'formatting must not be smuggled in as invisible characters — use the page meta');
	});

	/* The other half: a clean ISBN is only safe on a page that declares the meta. Keyed on the
	   visible LABEL rather than a digit-shape heuristic, so dates and prices don't false-fail. */
	test('every demo page showing an ISBN or ISSN declares format-detection', () => {
		const root = new URL('./demo/', import.meta.url);
		const pages = readdirSync(root, { recursive: true, withFileTypes: true })
			.filter((e) => e.isFile() && e.name.endsWith('.html'))
			.map((e) => new URL(`${e.parentPath.slice(root.pathname.length)}/${e.name}`.replace(/^\//, ''), root));
		assert.ok(pages.length > 20, `expected the demo corpus, got ${pages.length}`);
		const bad = [];
		for (const page of pages) {
			const html = readFileSync(page, 'utf8');
			/* text nodes only: an <meta itemprop="isbn"> carries no visible digits */
			const text = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ');
			if (/\bISBN\b|\bISSN\b/.test(text) && !/name="format-detection"[^>]*telephone=no/.test(html)) {
				bad.push(page.pathname.split('/demo/')[1]);
			}
		}
		assert.deepEqual(bad, [], 'a page showing an ISBN/ISSN needs <meta name="format-detection" content="telephone=no">');
	});
});

/* ── a DERIVED CTA still closes the text column ──
   Place's "Open in Maps" is built by the type from details.geo, not by fields.actions,
   so it goes through DETAILS_ACTIONS and lands AFTER the tags. Docs: docs/schema.md § Location */
describe('derived CTA ordering', () => {
	test('the Place map CTA comes after the tags, not before', () => {
		const html = renderCard({ fields: { schemaType: 'location', headline: 'P', tags: ['Bornholm'],
			details: { geo: { latitude: 55.06, longitude: 14.7 }, amenities: ['Parking'] } } }, {}, {});
		const tags = html.indexOf('data-part="tags"');
		const cta = html.indexOf('Open in Maps');
		assert.ok(tags > -1 && cta > -1, 'both render');
		assert.ok(tags < cta, 'tags precede the CTA row');
	});

	test('and it is still emitted when the card has no tags', () => {
		const html = renderCard({ fields: { schemaType: 'location', headline: 'P',
			details: { geo: { latitude: 55.06, longitude: 14.7 } } } }, {}, {});
		assert.match(html, /<nav data-part="actions">.*Open in Maps/);
	});
});

/* ── cover: the whole card is one link ──
   Safe over a carousel: the ::scroll-button/::scroll-marker pseudos are z-index 3 and
   the overlay furniture 2, against the cover ::after's 1. Docs: docs/content.md */
describe('cover link', () => {
	const card = (cover) => render({ schemaType: 'realestate', cover, headline: 'Flat', eyebrow: 'For sale' });

	test('wraps the headline text, inside the heading and its itemprop', () => {
		assert.match(card('/x.html'), /<h3 data-part="headline" itemprop="name"><a data-part="cover" href="\/x.html">Flat<\/a><\/h3>/);
	});

	test('absent unless asked for, and cannot break out of the href', () => {
		assert.ok(!card(undefined).includes('data-part="cover"'));
		const html = card('" onclick="alert(1)');
		/* esc() turns the quote into &quot;, so "onclick=" survives as inert TEXT inside
		   the attribute value — what matters is that the <a> tag has no second attribute */
		assert.match(html, /<a data-part="cover" href="&quot; onclick=&quot;alert\(1\)">/);
		/* a real attribute would read onclick=" — the escaped value reads onclick=&quot; */
		assert.ok(!html.includes('onclick="'), 'no attribute escaped the href');
	});

	/* Chromium makes a scrollable frame a tab stop of its own, which on a cover card
	   lands one stop before the link and paints the same card-sized ring twice.
	   Docs: docs/card.md § cover */
	const frame = (fields, presetMedia) => /<ui-media[^>]*>/.exec(renderCard(
		{ fields: { schemaType: 'realestate', headline: 'Flat', preset: { $ref: 'card-preset/t' }, ...fields } },
		{ t: { element: 'ui-card', media: presetMedia } }, {}
	))[0];
	const SLIDES = [{ mediaType: 'image', src: '/a.png' }, { mediaType: 'image', src: '/b.png' }];

	test('a navigable multi-slide frame leaves the tab order on a cover card', () => {
		assert.match(frame({ cover: '/x.html', media: SLIDES }, 'asr(4/3) nav(mrk)'), /<ui-media[^>]*tabindex="-1"/);
		assert.match(frame({ cover: '/x.html', media: SLIDES }, 'asr(4/3) nav'), /tabindex="-1"/);
	});

	test('…and stays in it otherwise — no cover, no controls, or nothing to scroll', () => {
		assert.ok(!frame({ media: SLIDES }, 'asr(4/3) nav(mrk)').includes('tabindex'), 'no cover: the ring is the frame\'s own');
		assert.ok(!frame({ cover: '/x.html', media: SLIDES }, 'asr(4/3)').includes('tabindex'), 'no controls: the stop is the only keyboard access');
		assert.ok(!frame({ cover: '/x.html', media: [SLIDES[0]] }, 'asr(4/3) nav(mrk)').includes('tabindex'), 'one slide does not scroll');
	});

	test('there is exactly ONE cover link — nested anchors are invalid', () => {
		const html = renderCard({ fields: { schemaType: 'realestate', cover: '/x.html', headline: 'Flat',
			tags: [{ name: 'Copenhagen', url: '/t' }], actions: [{ link: { url: '/a', text: 'Go' } }] } }, {}, {});
		assert.equal((html.match(/data-part="cover"/g) || []).length, 1);
	});
});

/* ── srcset ladder cap ──
   Cloudflare's fit=cover does not decline an oversized request, it manufactures the
   pixels: a 509px original asked for width=1200 comes back 1200x900 at ~4x the bytes.
   Docs: docs/media.md § srcset */
describe('srcset intrinsic cap', () => {
	const BP = [240, 320, 480, 720, 1200];
	const rungs = (opts) => (buildSrcset('/assets/images/x.jpg', { breakpoints: BP, fit: 'cover', ...opts }) || '')
		.split(', ').map((c) => c.split(' ')[1]).filter(Boolean);

	test('an unknown size keeps the whole ladder — the cap is opt-in', () => {
		assert.deepEqual(rungs({ ratio: 16 / 9 }), ['240w', '320w', '480w', '720w', '1200w']);
	});

	test('a narrow original drops the rungs it cannot fill', () => {
		assert.deepEqual(rungs({ ratio: 16 / 9, intrinsic: [870, 870] }), ['240w', '320w', '480w', '720w']);
	});

	test('HEIGHT binds too — the case a width-only cap gets wrong', () => {
		/* 1440x960 in a 4/3 frame: 1200w wants 900px of height and only 960 exist, so it
		   fits; 1440 would want 1080 and does not. The cap is min(w, h*ratio) = 1280. */
		assert.equal(maxUsableWidth([1440, 960], 4 / 3), 1280);
		assert.deepEqual(rungs({ ratio: 4 / 3, intrinsic: [1440, 960] }), ['240w', '320w', '480w', '720w', '1200w']);
		/* the same original in a 16/9 frame is bound by its WIDTH instead */
		assert.equal(maxUsableWidth([1440, 960], 16 / 9), 1440);
		/* and a tall original in a wide frame is bound by its height */
		assert.equal(maxUsableWidth([1264, 600], 16 / 9), 1066);
	});

	test('no ratio means only the width binds', () => {
		assert.equal(maxUsableWidth([509, 509], null), 509);
		assert.deepEqual(rungs({ ratio: null, intrinsic: [509, 509] }), ['240w', '320w', '480w']);
	});

	test('an original below the narrowest rung gets NO srcset — plain src is smaller', () => {
		assert.equal(buildSrcset('/a.jpg', { breakpoints: BP, ratio: 1, intrinsic: [160, 160] }), null);
	});

	test('the real corpus is capped: no candidate exceeds its original', () => {
		const sizes = JSON.parse(readFileSync(new URL('./data/assets.json', import.meta.url), 'utf8')).sizes;
		const images = { cdnBase: 'https://v4.browser.style', sizes: '100vw' };
		const files = readdirSync(new URL('./data/', import.meta.url))
			.filter((f) => f.endsWith('.json') && !f.startsWith('card.presets') && !['index.json', 'tokens.json', 'assets.json', 'details.json'].includes(f));
		const presets = JSON.parse(readFileSync(new URL('./data/card.presets.json', import.meta.url), 'utf8')).presets;
		let checked = 0;
		for (const file of files) {
			const html = renderCard(JSON.parse(readFileSync(new URL(`./data/${file}`, import.meta.url), 'utf8')), presets, {}, { images });
			for (const [, w, h, src] of html.matchAll(/width=(\d+),height=(\d+)(\/assets\/images\/[^\s",]+)/g)) {
				const intrinsic = sizes[src];
				if (!intrinsic) continue;
				checked++;
				assert.ok(+w <= intrinsic[0] && +h <= intrinsic[1],
					`${file}: ${src} is ${intrinsic.join('x')} but a candidate asks for ${w}x${h}`);
			}
		}
		assert.ok(checked > 200, `expected a real corpus, checked ${checked} candidates`);
	});
});

/* ── VacationRental ──
   A LodgingBusiness is an Organization AND a Place, which is the whole reason this type's
   properties split the way they do. Docs: docs/schema.md § Vacation rental */
describe('vacation rental', () => {
	const UNIT = { additionalType: 'EntirePlace', name: 'The whole house', floorSize: 180,
		bedrooms: 3, bathrooms: 2, rooms: 6, sleeps: 6,
		beds: [{ count: 2, type: 'Queen' }, { count: 1, type: 'Single' }], amenities: ['Pool'] };
	const DETAILS = { additionalType: 'HolidayVillageRental', identifier: 'MSL-1', brand: 'Masseria Collective',
		priceRange: '€320–€540 per night', checkin: '16:00:00+02:00', checkinDisplay: '16:00',
		checkout: '10:00:00+02:00', checkoutDisplay: '10:00', languages: ['en-GB', 'it-IT'],
		rating: { value: 4.8, count: 64 }, geo: { latitude: 40.7297, longitude: 17.5794 },
		address: { streetAddress: 'Contrada 12', addressLocality: 'Ostuni', addressRegion: 'Apulia', addressCountry: 'IT' },
		property: UNIT };
	const card = (details = DETAILS) => render({ schemaType: 'vacationrental', headline: 'Masseria Lucia', details });

	test('resolves to VacationRental', () => {
		assert.match(card(), /itemtype="https:\/\/schema\.org\/VacationRental"/);
	});

	test('the rooms hang off containsPlace, the business properties do not', () => {
		const html = card();
		const unit = /<div itemprop="containsPlace"[^>]*>([\s\S]*?)<\/div>/.exec(html)[1];
		for (const prop of ['floorSize', 'numberOfBedrooms', 'numberOfBathroomsTotal', 'numberOfRooms', 'occupancy', 'bed'])
			assert.ok(unit.includes(`itemprop="${prop}"`), `${prop} belongs inside containsPlace`);
		/* Accommodation has none of these — they are Organization/Place/LodgingBusiness properties */
		for (const prop of ['brand', 'priceRange', 'checkinTime', 'knowsLanguage', 'latitude'])
			assert.ok(!unit.includes(`itemprop="${prop}"`), `${prop} is not an Accommodation property`);
	});

	test('no offers anywhere — the rate is priceRange', () => {
		const html = card();
		assert.ok(!html.includes('itemprop="offers"'), 'offers has neither Organization nor Place in its domain');
		assert.match(html, /<p data-part="price" itemprop="priceRange">€320–€540 per night<\/p>/);
	});

	test('coordinates are stated once, flat — never also as a geo scope', () => {
		const html = card();
		assert.match(html, /<meta itemprop="latitude" content="40.7297">/);
		assert.ok(!html.includes('itemprop="geo"'), 'geo would restate the same coordinates');
	});

	test('every numeric property rides a <meta>, never a <data>', () => {
		const html = card();
		assert.ok(!html.includes('<data'), 'a <data value="3"> reads as the string "3 bedrooms"');
		assert.match(html, /<meta itemprop="numberOfBedrooms" content="3">3 bedrooms/);
		/* occupancy and floorSize are QuantitativeValues, so their number is a nested value */
		assert.match(html, /<span itemprop="occupancy" itemscope itemtype="https:\/\/schema\.org\/QuantitativeValue"><meta itemprop="value" content="6">sleeps 6<\/span>/);
	});

	test('one <li> per bed type, count on a meta and the type as visible text', () => {
		assert.match(card(), /<li itemprop="bed" itemscope itemtype="https:\/\/schema\.org\/BedDetails"><meta itemprop="numberOfBeds" content="2">2 × <span itemprop="typeOfBed">Queen<\/span><\/li>/);
	});

	test('one knowsLanguage meta per language, never a joined string', () => {
		const html = card();
		assert.equal((html.match(/itemprop="knowsLanguage"/g) || []).length, 2);
		assert.ok(!html.includes('content="en-GB,it-IT"'));
	});

	test('the teaser leaves amenities and reviews to the detail page', () => {
		const html = card({ ...DETAILS, reviews: [{ author: 'A', rating: 5, body: 'Lovely' }] });
		assert.ok(!html.includes('itemprop="review"'), 'reviews are a page band');
		assert.ok(!html.includes('itemprop="amenityFeature"'), 'the amenity list is a page band');
	});

	test('the sections seam builds reviews the page composes, and drops contentReferenceTime', () => {
		const s = vacationrentalSections({ ...DETAILS, reviews: [{ author: 'Lillian Ruiz', rating: 5, max: 5,
			datePublished: '2026-07-02', dateDisplay: 'July 2, 2026', stayed: 'June 2026', body: 'Cooler than any AC.' }] }, {});
		assert.equal(s.reviews.length, 1);
		assert.match(s.reviews[0], /<div itemprop="review" itemscope itemtype="https:\/\/schema\.org\/Review">/);
		assert.match(s.reviews[0], /<span itemprop="author" itemscope itemtype="https:\/\/schema\.org\/Person"><span itemprop="name">Lillian Ruiz<\/span><\/span>/);
		assert.match(s.reviews[0], /<meta itemprop="datePublished" content="2026-07-02">/);
		/* contentReferenceTime takes a DateTime and a stay is known only to the month */
		assert.ok(!s.reviews[0].includes('contentReferenceTime'));
		assert.match(s.reviews[0], /stayed June 2026/);
		assert.ok(s.amenities.includes('itemprop="amenityFeature"'), 'the seam still carries them for the page');
	});

	test('an address region renders, and no existing card grows one', () => {
		assert.match(card(), /<span><span itemprop="addressRegion">Apulia<\/span><\/span>/);
		assert.ok(!render({ schemaType: 'location', headline: 'X', details: { address: { addressLocality: 'Aarhus' } } }).includes('addressRegion'));
	});
});

/* ── the text-column status chip ──
   `fields.chip` is the flag above the eyebrow ("New", "Sold"). Distinct from
   `fields.furniture.chip`, which is overlaid on the MEDIA — and deliberately so: a
   frame gets one chip family, so a furniture chip suppresses the <ui-chip data-type>
   type label. Docs: docs/schema.md § Real estate */
describe('content chip', () => {
	const card = (chip) => render({ schemaType: 'content', chip, eyebrow: 'For sale', headline: 'H' });

	test('renders before the eyebrow, in the shared meta-chip shape', () => {
		const html = card({ text: 'New', theme: 'pale orange' });
		assert.match(html, /<p data-part="meta"><ui-chip theme="pale orange">New<\/ui-chip><\/p><small data-part="eyebrow">/);
	});

	test('defaults its theme and is absent when unset', () => {
		assert.match(card({ text: 'New' }), /<ui-chip theme="pale accent">New<\/ui-chip>/);
		assert.ok(!card(undefined).includes('<ui-chip'), 'no chip field, no chip');
		assert.ok(!card({ theme: 'pale red' }).includes('<ui-chip'), 'a theme with no text renders nothing');
	});

	test('escapes hostile text and theme', () => {
		const html = card({ text: '<script>alert(1)</script>', theme: '"><img src=x onerror=alert(1)>' });
		assert.ok(!html.includes('<script>') && !html.includes('<img'), 'no raw markup reaches output');
		assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/, 'text still renders, escaped');
	});

	/* several flags on one listing — one meta row, not one row each, so content.css's
	   :has(> ui-chip + ui-chip) gap arms. ui/chip's own attributes ride through verbatim. */
	test('accepts an ARRAY and renders every chip in ONE meta row', () => {
		const html = card([{ text: 'New', theme: 'pale green', radius: 'rnd' }, { text: 'Open house', radius: 'rnd' }]);
		assert.match(html, /<p data-part="meta"><ui-chip theme="pale green" radius="rnd">New<\/ui-chip><ui-chip theme="pale accent" radius="rnd">Open house<\/ui-chip><\/p>/);
		assert.equal(html.match(/<p data-part="meta">/g).length, 1, 'ONE row, not one per chip');
	});

	test('forwards size and variant, and drops entries with no text', () => {
		assert.match(card([{ text: 'Sold', size: 'lg', variant: 'outline' }]),
			/<ui-chip theme="pale accent" size="lg" variant="outline">Sold<\/ui-chip>/);
		const sparse = card([{ text: 'New' }, { theme: 'pale red' }, null]);
		assert.equal(sparse.match(/<ui-chip/g).length, 1, 'a textless entry renders nothing');
	});

	test('an empty array renders no meta row at all', () => {
		assert.ok(!card([]).includes('<p data-part="meta">'), 'no chips, no row');
		assert.ok(!card([{ theme: 'pale red' }]).includes('<p data-part="meta">'));
	});

	test('escapes hostile chip attributes in the array form', () => {
		const html = card([{ text: 'ok', radius: '"><img src=x onerror=alert(1)>', size: '"><script>' }]);
		assert.ok(!html.includes('<img') && !html.includes('<script>'), 'no raw markup reaches output');
	});

	test('does NOT suppress the type chip the way furniture.chip does', () => {
		const html = renderCard({ fields: { schemaType: 'realestate', headline: 'H', chip: { text: 'New' },
			media: [{ mediaType: 'image', src: '/a.png', alt: '' }] } }, {}, {}, { typeChip: true });
		assert.match(html, /<ui-chip data-type>RealEstateListing<\/ui-chip>/, 'the type label survives');
		assert.match(html, /<ui-chip theme="pale accent">New<\/ui-chip>/, 'and so does the status chip');
	});
});

describe('places — a collection of places on one clustered map', () => {
	const OFFICES = [
		{ type: 'LocalBusiness', name: 'Copenhagen', url: 'https://example.com/cph', geo: { latitude: 55.6761, longitude: 12.5683 }, address: { addressLocality: 'Copenhagen', addressCountry: 'DK' }, telephone: '+45 35 55 12 90', openingHours: [{ schema: 'Mo-Fr 09:00-17:00' }] },
		{ type: 'LocalBusiness', name: 'Berlin', url: 'https://example.com/ber', geo: { latitude: 52.52, longitude: 13.405 } }
	];
	const HOMES = [
		{ type: 'Apartment', name: 'Havnegade 44', url: 'https://example.com/h44', geo: { latitude: 55.6761, longitude: 12.5911 }, address: { streetAddress: 'Havnegade 44', addressLocality: 'Copenhagen', addressCountry: 'DK' }, price: { currency: 'DKK', amount: 7950000 }, numberOfRooms: 4, numberOfBedrooms: 2, floorSize: 118, yearBuilt: 1932 }
	];
	const places = (details) => render({ schemaType: 'places', headline: 'Where we are', summary: 'Our offices.', details });

	test('root is an ItemList carrying numberOfItems', () => {
		const html = places({ kind: 'business', items: OFFICES });
		assert.match(html, /itemtype="https:\/\/schema\.org\/ItemList"/);
		assert.match(html, /<meta itemprop="numberOfItems" content="2">/);
	});

	test('each row is a ListItem with a position and an item scope', () => {
		const html = places({ kind: 'business', items: OFFICES });
		assert.equal(html.match(/itemprop="itemListElement" itemscope itemtype="https:\/\/schema\.org\/ListItem"/g).length, 2);
		assert.match(html, /<meta itemprop="position" content="1">/);
		assert.match(html, /<meta itemprop="position" content="2">/);
		assert.match(html, /itemprop="item" itemscope itemtype="https:\/\/schema\.org\/LocalBusiness"/);
	});

	test('office items carry geo, address and BOTH hours forms', () => {
		const html = places({ kind: 'business', items: OFFICES });
		assert.match(html, /itemprop="geo" itemscope itemtype="https:\/\/schema\.org\/GeoCoordinates"/);
		assert.match(html, /<meta itemprop="latitude" content="55.6761">/);
		assert.match(html, /itemprop="address" itemscope itemtype="https:\/\/schema\.org\/PostalAddress"/);
		/* openingHours is a LocalBusiness property, so the flat string IS in domain here */
		assert.match(html, /<meta itemprop="openingHours" content="Mo-Fr 09:00-17:00">/);
		assert.match(html, /itemprop="openingHoursSpecification"/);
	});

	test('residence items are a RealEstateListing wrapping the Accommodation', () => {
		const html = places({ kind: 'residence', items: HOMES });
		/* `offers` is out of domain on Apartment, Place AND ListItem — it can only ride
		   RealEstateListing, which is a WebPage and therefore a CreativeWork */
		assert.match(html, /itemprop="item" itemscope itemtype="https:\/\/schema\.org\/RealEstateListing"/);
		assert.match(html, /itemprop="mainEntity" itemscope itemtype="https:\/\/schema\.org\/Apartment"/);
		assert.match(html, /itemprop="offers" itemscope itemtype="https:\/\/schema\.org\/Offer"/);
		assert.match(html, /<meta itemprop="priceCurrency" content="DKK">/);
		assert.match(html, /itemprop="numberOfRooms"/);
		assert.match(html, /itemprop="floorSize"/);
	});

	test('an off-allowlist item type falls back instead of reaching the itemtype', () => {
		const evil = places({ kind: 'business', items: [{ type: 'Evil"><script>', name: 'X', geo: { latitude: 1, longitude: 2 } }] });
		assert.ok(!evil.includes('<script>'), 'a supplied type must never reach an itemtype');
		assert.match(evil, /itemprop="item" itemscope itemtype="https:\/\/schema\.org\/LocalBusiness"/);
		/* Residence descends from Place, not Accommodation — floorSize/yearBuilt are out
		   of domain on it, so it is deliberately NOT in RESIDENCE_TYPES */
		const res = places({ kind: 'residence', items: [{ type: 'Residence', name: 'X', geo: { latitude: 1, longitude: 2 } }] });
		assert.match(res, /itemprop="mainEntity" itemscope itemtype="https:\/\/schema\.org\/Accommodation"/);
	});

	test('no keywords: tags are out of domain on an ItemList', () => {
		const html = render({ schemaType: 'places', headline: 'Where we are', tags: ['Global', 'Offices'], details: { kind: 'business', items: OFFICES } });
		assert.ok(!html.includes('itemprop="keywords"'), 'ItemList is an Intangible — keywords is Organization/Event/Place/CreativeWork/Product only');
		assert.match(html, /Global/, 'the tags still render, just unmarked');
	});

	test('no hasMap on the frame — the root is an ItemList, not a Place', () => {
		const html = render({ schemaType: 'places', headline: 'Where we are', media: [{ mediaType: 'places', alt: 'Map of our offices' }], details: { kind: 'business', center: { latitude: 52, longitude: 9 }, items: OFFICES } });
		assert.match(html, /<ui-map[^>]*>/);
		assert.ok(!/<ui-map[^>]*itemprop="hasMap"/.test(html), 'hasMap is a Place property and the enclosing scope is an ItemList');
		assert.match(html, /<iframe[^>]*openstreetmap\.org\/export\/embed\.html/, 'the no-JS fallback frame is inside <ui-map>');
	});

	test('escapes hostile place data', () => {
		const html = places({ kind: 'business', items: [{ type: 'LocalBusiness', name: '"><img src=x onerror=alert(1)>', url: 'javascript:alert(1)', geo: { latitude: 1, longitude: 2 } }] });
		assert.ok(!html.includes('<img'), 'attribute breakout must be escaped');
		assert.match(html, /&quot;&gt;&lt;img src=x onerror=alert\(1\)&gt;/);
	});
});

describe('places — compact rows and card slides', () => {
	const OFFICE = { type: 'LocalBusiness', name: 'Copenhagen', url: 'https://example.com/cph', geo: { latitude: 55.6761, longitude: 12.5683 }, address: { streetAddress: 'Sundkaj 9', addressLocality: 'Copenhagen', addressCountry: 'DK' }, telephone: '+45 35 55 12 90', openingHours: [{ schema: 'Mo-Fr 09:00-17:00' }] };
	const HOME = { type: 'Apartment', name: 'Havnegade 44', url: 'https://example.com/h44', image: '/assets/images/real_01.jpg', geo: { latitude: 55.6761, longitude: 12.5911 }, address: { streetAddress: 'Havnegade 44', addressLocality: 'Copenhagen', addressCountry: 'DK' }, price: { currency: 'DKK', amount: 7950000 }, floorSize: 118 };

	test('an office row keeps its detail marked up but hidden', () => {
		const html = render({ schemaType: 'places', headline: 'Offices', details: { kind: 'business', items: [OFFICE] } });
		/* still fully machine-readable … */
		assert.match(html, /itemprop="address" itemscope/);
		assert.match(html, /<meta itemprop="telephone" content="\+45 35 55 12 90">/);
		assert.match(html, /itemprop="openingHoursSpecification"/);
		assert.match(html, /itemprop="hasMap"/);
		/* … but off the page, inside ONE bare <div hidden>. The wrapper is load-bearing:
		   content.css gives [data-part="address"] display:flex and [data-part="hours"]
		   display:grid, and an author `display` beats the UA `[hidden] { display: none }`
		   rule — `hidden` on the parts themselves leaves them fully visible. */
		assert.match(html, /<div hidden><address data-part="address"/);
		assert.ok(!/<address[^>]*\shidden/.test(html), 'hidden must not sit on the styled part');
		assert.ok(!/<dl[^>]*\shidden/.test(html), 'hidden must not sit on the styled part');
		assert.match(html, /<div hidden>[\s\S]*<a itemprop="hasMap"[\s\S]*<\/div>/);
		/* the visible line is the linked name */
		assert.match(html, /<a itemprop="url" href="https:\/\/example\.com\/cph"><strong itemprop="name">Copenhagen<\/strong><\/a>/);
	});

	test('a locality that repeats the name is not printed twice', () => {
		const same = render({ schemaType: 'places', headline: 'O', details: { kind: 'business', items: [OFFICE] } });
		assert.ok(!/<small>Copenhagen<\/small>/.test(same), 'name and locality are identical here');
		const differs = render({ schemaType: 'places', headline: 'O', details: { kind: 'business', items: [{ ...OFFICE, name: 'Nordhavn Studio' }] } });
		assert.match(differs, /<small>Copenhagen<\/small>/);
	});

	test('details.slides puts the places in the frame and drops the list', () => {
		const html = render({ schemaType: 'places', headline: 'Homes', media: [{ mediaType: 'places', alt: 'Map' }], details: { kind: 'residence', slides: true, center: { latitude: 55.6, longitude: 12.5 }, items: [HOME] } });
		/* the map is still the first thing in the frame */
		assert.match(html, /<ui-media[^>]*><ui-map/);
		/* the slide is a nested card carrying the ListItem — a PROPERTY of the list */
		assert.match(html, /<ui-card[^>]*itemprop="itemListElement" itemscope itemtype="https:\/\/schema\.org\/ListItem"/);
		assert.match(html, /<cq-box itemprop="item" itemscope itemtype="https:\/\/schema\.org\/RealEstateListing"/);
		assert.match(html, /<img[^>]*src="\/assets\/images\/real_01\.jpg"[^>]*itemprop="image"/);
		/* exactly one copy of the set — no <ol> duplicating it */
		assert.ok(!html.includes('<ol data-part="list">'), 'the slides ARE the list');
		assert.equal(html.match(/itemprop="itemListElement"/g).length, 1);
	});

	test('without details.slides the list is still the list', () => {
		const html = render({ schemaType: 'places', headline: 'Homes', details: { kind: 'residence', items: [HOME] } });
		assert.match(html, /<ol data-part="list">/);
		/* the card's own root is a <ui-card>; what must be absent is a nested SLIDE */
		assert.ok(!/<ui-card[^>]*itemprop=/.test(html), 'no nested card slides in list mode');
	});
});

describe('places — actions', () => {
	const HOME = { type: 'Apartment', name: 'Havnegade 44', url: 'https://example.com/h44', image: '/assets/images/real_01.jpg', geo: { latitude: 55.6761, longitude: 12.5911 }, price: { currency: 'DKK', amount: 7950000 } };
	const slides = (details) => render({ schemaType: 'places', headline: 'Homes', media: [{ mediaType: 'places', alt: 'Map' }], details: { kind: 'residence', slides: true, center: { latitude: 55.6, longitude: 12.5 }, ...details } });

	test('a places card has no card-level Open in Maps CTA', () => {
		const html = slides({ items: [HOME] });
		assert.ok(!html.includes('Open in Maps'), 'the map is the affordance; each place carries its own CTA');
		const offices = render({ schemaType: 'places', headline: 'Offices', details: { kind: 'business', center: { latitude: 1, longitude: 2 }, items: [{ type: 'LocalBusiness', name: 'CPH', geo: { latitude: 1, longitude: 2 } }] } });
		assert.ok(!offices.includes('Open in Maps'));
		/* the single-place card keeps its CTA — this only drops it for `places` */
		assert.match(render({ schemaType: 'location', headline: 'X', details: { geo: { latitude: 1, longitude: 2 } } }), /Open in Maps/);
	});

	test('each estate slide gets a See More CTA to the listing', () => {
		const html = slides({ items: [HOME] });
		assert.match(html, /<nav data-part="actions"><a class="ui-button" data-variant="accent" href="https:\/\/example\.com\/h44">See More<\/a><\/nav>/);
		/* UNMARKED: the cover link already carries itemprop="url" */
		assert.equal(html.match(/itemprop="url"/g).length, 1);
	});

	test('hasMap survives as machine-only markup', () => {
		const html = slides({ items: [HOME] });
		assert.match(html, /<div hidden><a itemprop="hasMap"/);
		assert.ok(!/>Map<\/a>[\s\S]*?<\/p>/.test(html), 'no visible "Map" link remains on a slide');
	});

	test('the CTA label is overridable and omitted without a url', () => {
		assert.match(slides({ slide: { cta: 'View home' }, items: [HOME] }), />View home</);
		const noUrl = slides({ items: [{ ...HOME, url: undefined }] });
		assert.ok(!noUrl.includes('data-part="actions"'), 'nothing to link to, no CTA');
	});
});

describe('places — a screen-reader-only list', () => {
	const OFFICE = { type: 'LocalBusiness', name: 'Copenhagen', url: '/offices/cph', geo: { latitude: 55.6761, longitude: 12.5683 }, address: { addressLocality: 'Copenhagen' } };
	const card = (extra) => render({ schemaType: 'places', headline: 'Offices', details: { kind: 'business', items: [OFFICE], ...extra } });

	test('details.list "sr" hides the list visually but keeps it in the a11y tree', () => {
		const html = card({ list: 'sr' });
		assert.match(html, /<ol data-part="list" data-sr>/);
		/* NOT `hidden` — that would drop it from the accessibility tree too, leaving the
		   map with no text alternative, and take the itemListElement set with it */
		assert.ok(!/<ol data-part="list"[^>]*\shidden/.test(html), 'must not be `hidden`');
		/* the set the count describes is still there, and so is the map's data source */
		assert.match(html, /<meta itemprop="numberOfItems" content="1">/);
		assert.match(html, /itemprop="itemListElement"/);
		assert.match(html, /<meta itemprop="latitude" content="55.6761">/);
		assert.match(html, /<a itemprop="url" href="\/offices\/cph">/);
	});

	test('the list is visible by default', () => {
		assert.match(card({}), /<ol data-part="list">/);
	});
});

describe('places — carousel validation requirements', () => {
	const OFFICES = [
		{ type: 'LocalBusiness', name: 'Copenhagen', url: '/o.html?studio=copenhagen', geo: { latitude: 55.6, longitude: 12.5 } },
		{ type: 'LocalBusiness', name: 'Berlin', url: '/o.html?studio=berlin', geo: { latitude: 52.5, longitude: 13.4 } }
	];
	const html = render({ schemaType: 'places', headline: 'Offices', details: { kind: 'business', items: OFFICES } });

	test('every ListItem carries its own name', () => {
		/* Google's carousel reads the ENTRY's name; without it the item reports as
		   "Unnamed item". It is not a duplicate of item.name — different nodes. */
		assert.match(html, /<meta itemprop="position" content="1"><meta itemprop="name" content="Copenhagen">/);
		assert.match(html, /<meta itemprop="position" content="2"><meta itemprop="name" content="Berlin">/);
		/* the place still names itself inside its own scope */
		assert.match(html, /<strong itemprop="name">Copenhagen<\/strong>/);
	});

	test('item urls are distinct — "identical property values" is a carousel error', () => {
		const urls = [...html.matchAll(/itemprop="url" href="([^"]+)"/g)].map((m) => m[1]);
		assert.equal(urls.length, 2);
		assert.equal(new Set(urls).size, urls.length, 'each entry must be distinguishable by url');
	});
});

/* ── schema modes ──────────────────────────────────────────────────────────
   `micro` (default) emits microdata; `''` emits none. The corpus sweep is the real
   gate — the whole point is that raw mode is complete, not that it works on one card.
   Docs: docs/card.md § Schema mode */
describe('schema modes', () => {
	const VOID = new Set(['meta', 'link', 'img', 'br', 'hr', 'input', 'source', 'area', 'base',
		'col', 'embed', 'param', 'track', 'wbr', 'path', 'circle', 'rect', 'line', 'polyline',
		'polygon', 'ellipse', 'use', 'stop']);
	/* hidden subtrees never rendered, so text inside them is not visible content */
	const dropHidden = (h) => {
		for (;;) {
			const open = /<(div|span)[^>]*\shidden[^>]*>/.exec(h);
			if (!open) return h;
			const re = new RegExp(`<(/?)${open[1]}\\b[^>]*>`, 'g');
			re.lastIndex = open.index + open[0].length;
			let depth = 1, close;
			while ((close = re.exec(h))) { depth += close[1] ? -1 : 1; if (!depth) break; }
			h = h.slice(0, open.index) + (close ? h.slice(close.index + close[0].length) : '');
		}
	};
	const visible = (h) => dropHidden(h).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
	const unbalanced = (h) => {
		const seen = {};
		for (const m of h.matchAll(/<(\/?)([a-z][a-z0-9-]*)/gi)) {
			const tag = m[2].toLowerCase();
			if (!VOID.has(tag)) seen[tag] = (seen[tag] || 0) + (m[1] ? -1 : 1);
		}
		return Object.entries(seen).filter(([, n]) => n !== 0);
	};

	/* the same corpus render.snapshot.js walks — both preset collections, data/ + data/demo/ */
	const DIR = new URL('./data/', import.meta.url);
	const PRESETS = {
		...JSON.parse(readFileSync(new URL('card.presets.json', DIR), 'utf8')).presets,
		...JSON.parse(readFileSync(new URL('card.presets.demo.json', DIR), 'utf8')).presets
	};
	const cards = [
		...readdirSync(DIR).filter((f) => f.endsWith('.json') && !f.startsWith('card.presets') && f !== 'index.json' && f !== 'tokens.json' && f !== 'details.json').map((f) => new URL(f, DIR)),
		...readdirSync(new URL('demo/', DIR)).filter((f) => f.endsWith('.json')).map((f) => new URL(`demo/${f}`, DIR))
	].map((file) => {
		const ucf = JSON.parse(readFileSync(file, 'utf8'));
		return {
			file: file.pathname.split('/').pop(),
			micro: renderCard(ucf, PRESETS, {}, { schema: 'micro' }),
			raw: renderCard(ucf, PRESETS, {}, { schema: '' }),
			ucf
		};
	});

	test('the corpus is the one the snapshot renders', () => {
		assert.ok(cards.length > 100, `expected the full corpus, got ${cards.length}`);
	});

	test('raw mode emits no microdata anywhere in the corpus', () => {
		for (const { file, raw } of cards) {
			assert.doesNotMatch(raw, /itemprop/, `${file} still carries itemprop`);
			assert.doesNotMatch(raw, /itemscope/, `${file} still carries itemscope`);
			assert.doesNotMatch(raw, /itemtype/, `${file} still carries itemtype`);
		}
	});

	test('raw mode leaves no machine-only residue', () => {
		for (const { file, raw } of cards) {
			assert.doesNotMatch(raw, /<(div|span)[^>]*\shidden/, `${file} kept a crawler-only wrapper`);
			assert.doesNotMatch(raw, /<(div|span)>\s*<\/(div|span)>/, `${file} kept an emptied wrapper`);
		}
	});

	test('raw mode loses no visible content', () => {
		for (const { file, micro, raw } of cards) {
			assert.equal(visible(raw), visible(micro), `${file} lost visible text`);
		}
	});

	test('raw mode keeps the markup balanced', () => {
		/* floorSize() returns an UNCLOSED <span> its caller closes — deleting annotated
		   elements instead of stripping their attributes would break this. */
		for (const { file, raw } of cards) {
			assert.deepEqual(unbalanced(raw), [], `${file} is unbalanced in raw mode`);
		}
	});

	test('micro is the default and is unaffected by the option', () => {
		const { micro, ucf } = cards[0];
		assert.equal(renderCard(ucf, PRESETS), micro, 'no options must equal schema:"micro"');
		assert.equal(renderCard(ucf, PRESETS, {}, {}), micro, 'an empty options bag must equal schema:"micro"');
	});

	test('an unknown mode throws rather than silently emitting microdata', () => {
		const { ucf } = cards[0];
		assert.throws(() => renderCard(ucf, PRESETS, {}, { schema: 'nope' }), /unknown schema mode/);
	});

	test('jsonld mode emits the same clean markup as raw', () => {
		/* the structured data leaves the markup and becomes a page-level @graph;
		   the two modes must not differ in what they render */
		for (const { file, raw, ucf } of cards) {
			assert.equal(renderCard(ucf, PRESETS, {}, { schema: 'jsonld' }), raw, file);
		}
	});
});

/* External map links: several providers for one set of coordinates, unmarked so the card
   still declares hasMap exactly once. Docs: docs/card.md § External map links */
describe('map links', () => {
	const NORDHAVN = { latitude: 55.7076, longitude: 12.5993 };
	const card = (geo, extra = {}) => render({
		schemaType: 'location', headline: 'Nordhavn Studio', details: { geo, ...extra }
	});

	test('with no links the single Open in Maps CTA is unchanged', () => {
		const html = card({ ...NORDHAVN, url: 'https://example.com/m' });
		assert.match(html, />Open in Maps</);
	});

	test('a provider id becomes a labelled link built from the coordinates', () => {
		const html = card({ ...NORDHAVN, links: ['google'] });
		assert.match(html, /href="https:\/\/www\.google\.com\/maps\/search\/\?api=1&amp;query=55\.7076,12\.5993"/);
		assert.match(html, />Google Maps</);
	});

	test('several providers render in order', () => {
		const html = card({ ...NORDHAVN, links: ['google', 'apple'] });
		assert.ok(html.indexOf('Google Maps') < html.indexOf('Apple Maps'));
		assert.match(html, /maps\.apple\.com/);
	});

	test('apple carries the place name so the pin is labelled', () => {
		assert.match(card({ ...NORDHAVN, links: ['apple'] }), /&amp;q=Nordhavn%20Studio/);
	});

	test('external links open in a new tab safely', () => {
		const html = card({ ...NORDHAVN, links: ['google'] });
		assert.match(html, /target="_blank" rel="noopener"/);
	});

	test('a map link is never microdata — hasMap is declared once, on the frame', () => {
		const html = card({ ...NORDHAVN, links: ['google', 'apple'] });
		const actions = html.match(/<nav data-part="actions">[\s\S]*?<\/nav>/)[0];
		assert.doesNotMatch(actions, /itemprop/);
	});

	test('an unknown provider is dropped, not guessed at', () => {
		const html = card({ ...NORDHAVN, links: ['google', 'nonsense'] });
		assert.match(html, />Google Maps</);
		assert.doesNotMatch(html, /nonsense/);
	});

	test('the object form overrides the label and the url', () => {
		const html = card({ ...NORDHAVN, links: [{ provider: 'google', label: 'Directions' }] });
		assert.match(html, />Directions</);
		const html2 = card({ ...NORDHAVN, links: [{ provider: 'google', url: 'https://example.com/x' }] });
		assert.match(html2, /href="https:\/\/example\.com\/x"/);
	});

	test('coordinates are validated as numbers before they reach a url', () => {
		const html = card({ latitude: '"><script>', longitude: 0, links: ['google'] });
		assert.doesNotMatch(html, /<script>/);
		assert.doesNotMatch(html, /google\.com\/maps/, 'a bad coordinate builds no link at all');
	});

	test('links work without an author-supplied geo.url', () => {
		assert.match(card({ ...NORDHAVN, links: ['osm'] }), /openstreetmap\.org/);
	});

	/* the brand mark is invariant per provider but its PATH varies per deployment, so it
	   is a render option like images.cdnBase — never per-card content */
	const ICONS = { google: '/assets/svg/google.maps.svg', apple: '/assets/svg/apple.maps.svg' };
	const iconCard = (geo) => renderCard(
		{ fields: { schemaType: 'location', headline: 'Nordhavn Studio', details: { geo } } },
		{}, {}, { mapIcons: ICONS }
	);

	test('without the option the links stay text — no asset path is invented', () => {
		assert.match(card({ ...NORDHAVN, links: ['google'] }), />Google Maps</);
		assert.doesNotMatch(card({ ...NORDHAVN, links: ['google'] }), /<img/);
	});

	test('with the option a link renders its mark instead of its text', () => {
		const html = iconCard({ ...NORDHAVN, links: ['google'] });
		assert.match(html, /<img src="\/assets\/svg\/google\.maps\.svg" alt="" width="40" height="40">/);
		assert.doesNotMatch(html, />Google Maps</);
	});

	test('an icon link is named for assistive tech', () => {
		const html = iconCard({ ...NORDHAVN, links: ['apple'] });
		assert.match(html, /aria-label="Open Nordhavn Studio in Apple Maps"/);
	});

	test('a provider with no icon configured keeps its text label', () => {
		const html = iconCard({ ...NORDHAVN, links: ['google', 'osm'] });
		assert.match(html, /<img src="\/assets\/svg\/google\.maps\.svg"/);
		assert.match(html, />OpenStreetMap</);
	});

	test('a custom label renames the accessible name too', () => {
		const html = iconCard({ ...NORDHAVN, links: [{ provider: 'google', label: 'Directions' }] });
		assert.match(html, /aria-label="Open Nordhavn Studio in Directions"/);
	});

	test('an icon path is escaped', () => {
		const html = renderCard(
			{ fields: { schemaType: 'location', headline: 'X', details: { geo: { ...NORDHAVN, links: ['google'] } } } },
			{}, {}, { mapIcons: { google: '"><script>bad()</script>' } }
		);
		assert.doesNotMatch(html, /<script>bad/);
	});
});

describe('goal — AchieveAction', () => {
	const card = (details = {}) => render({
		schemaType: 'goal',
		eyebrow: 'Mindfulness',
		headline: 'Meditate 10 minutes daily',
		summary: 'Before the first coffee — breathe in, phone off.',
		details: {
			status: 'active',
			startDate: '2026-01-01',
			endDate: '2026-12-31',
			dateRangeDisplay: 'Jan 1 – Dec 31, 2026',
			agentName: 'Alex Winther',
			target: { name: 'Daily meditation target', value: 10, unitText: 'minutes' },
			current: { value: 6, unitText: 'minutes' },
			progressLabel: 'Minutes',
			progressDisplay: '6 of 10 minutes',
			hue: 'green',
			...details
		}
	});

	test('the root is an AchieveAction with status and time span as metas', () => {
		const html = card();
		assert.match(html, /itemtype="https:\/\/schema\.org\/AchieveAction"/);
		assert.match(html, /<meta itemprop="actionStatus" content="https:\/\/schema\.org\/ActiveActionStatus">/);
		assert.match(html, /<meta itemprop="startTime" content="2026-01-01">/);
		assert.match(html, /<meta itemprop="endTime" content="2026-12-31">/);
	});

	test('target and current ride object/result QuantitativeValue scopes; the agent is a Person', () => {
		const html = card();
		assert.match(html, /itemprop="object" itemscope itemtype="https:\/\/schema\.org\/QuantitativeValue"/);
		assert.match(html, /itemprop="result" itemscope itemtype="https:\/\/schema\.org\/QuantitativeValue"/);
		assert.match(html, /<meta itemprop="value" content="10"><meta itemprop="unitText" content="minutes">/);
		assert.match(html, /<meta itemprop="value" content="6"><meta itemprop="unitText" content="minutes">/);
		assert.match(html, /itemprop="agent" itemscope itemtype="https:\/\/schema\.org\/Person"/);
		assert.match(html, /<meta itemprop="name" content="Alex Winther">/);
	});

	test('the ring shows the computed ratio and carries NO microdata of its own', () => {
		const html = card();
		assert.match(html, /<ui-progress-circular size="lg" theme="green">/);
		assert.match(html, /<progress max="10" value="6"><\/progress>/);
		assert.match(html, /<small>Minutes<\/small>/);
		assert.match(html, /<span>60%<\/span>/);
		assert.ok(!/<ui-progress-circular[^>]*itemprop/.test(html), 'ring is presentation only');
		assert.ok(!/<progress[^>]*itemprop/.test(html), 'the machine numbers ride the metas');
	});

	test('a completed goal maps to CompletedActionStatus', () => {
		const html = card({ status: 'completed', current: { value: 10, unitText: 'minutes' } });
		assert.match(html, /<meta itemprop="actionStatus" content="https:\/\/schema\.org\/CompletedActionStatus">/);
		assert.match(html, /<ui-progress-circular size="lg" theme="green">/);
	});

	test('the hue is an allowlist, never verbatim data', () => {
		const html = card({ hue: '"><script>bad()</script>' });
		assert.doesNotMatch(html, /<script>bad/);
		assert.ok(!/theme="/.test(html.split('<ui-progress-circular')[1]?.split('>')[0] || ''), 'unknown hue drops the theme attribute');
	});

	test('a hostile display string comes out escaped', () => {
		const html = card({ progressDisplay: '<img src=x onerror=alert(1)>' });
		assert.ok(!html.includes('<img src=x'), 'escaped');
		assert.match(html, /&lt;img src=x/);

	});
});

/* ── quiz — carousel deck (preset.element lay-out) ─────────────────────────────
   One <ui-card> slide per graded question inside a <lay-out overflow> scroller, the
   Quiz's own properties on a wrapping <section>. Presentation, so it is a PRESET
   (element + carousel.media), never a field. The `gate` media token is the one
   behaviour switch: it arms one required radio per question, and carousel.css hides
   every slide after an unanswered one, so the next arrow stays disabled until the
   current question is answered. Docs: docs/schema.md § Quiz */
describe('quiz — carousel deck (lay-out preset)', () => {
	const cards = [
		{ question: 'What can a qubit hold?', options: [{ text: 'Two values' }, { text: 'A superposition', correct: true }] },
		{ question: 'Entangled qubits, one measured?', options: [{ text: 'Fixed at once', correct: true }, { text: 'A signal' }] },
		{ question: 'Why error correction?', options: [{ text: 'Random output' }, { text: 'Decoherence', correct: true }] }
	];
	const presets = {
		gated: { element: 'lay-out', variant: 'col', media: 'asr(16/9)', content: 'wid(2xl)', carousel: { media: 'nav(end) arw(drk) gate' } },
		free: { element: 'lay-out', variant: 'col', media: 'asr(16/9)', content: 'wid(2xl)', carousel: { media: 'nav(end) arw(drk)' } },
		stack: { element: 'ui-card', variant: 'col', media: 'asr(16/9)' }
	};
	const details = { format: 'multiple-choice', subject: 'Quantum computing', cards };
	const quiz = (preset, d = details, extra = {}) => renderCard(
		{ fields: { schemaType: 'quiz', headline: 'Check yourself', summary: 'Three graded questions.', media: [{ mediaType: 'image', src: '/q.png', alt: 'Q' }], details: d, preset: { $ref: `card-preset/${preset}` }, ...extra } },
		presets);

	test('the root is ONE Quiz <section> carrying the deck metas — the slides are its parts', () => {
		const html = quiz('gated');
		assert.match(html, /^<section itemscope itemtype="https:\/\/schema\.org\/Quiz">/);
		assert.match(html, /<meta itemprop="name" content="Check yourself">/);
		assert.match(html, /<meta itemprop="description" content="Three graded questions.">/);
		assert.match(html, /<meta itemprop="learningResourceType" content="Practice problem">/);
		assert.match(html, /<div itemprop="about" itemscope itemtype="https:\/\/schema\.org\/Thing" hidden><meta itemprop="name" content="Quantum computing"><\/div>/);
		assert.equal(count(html, 'itemtype="https://schema.org/Quiz"'), 1);
		assert.equal(count(html, 'itemprop="hasPart" itemscope itemtype="https://schema.org/Question"'), 3);
	});

	test('one <ui-card> slide per question in the scroller, numbered, headed by the deck name', () => {
		const html = quiz('gated');
		assert.match(html, /<lay-out md="columns\(1\)" overflow media="nav\(end\) arw\(drk\) gate">/);
		assert.equal(count(html, '<ui-card variant="col">'), 3);
		assert.match(html, /<small data-part="eyebrow">Question 2 of 3<\/small>/);
		assert.equal(count(html, '<h3 data-part="headline">Check yourself</h3>'), 3, 'a label per slide, never a second name property');
		assert.equal(count(html, 'itemprop="image"'), 3, 'the deck image repeats per slide');
		assert.equal(count(html, '<ui-content content="wid(2xl)">'), 3);
		assert.equal(count(html, '<ui-media media="asr(16/9)">'), 3);
	});

	test('the gate token arms ONE required radio per question; without it, none', () => {
		const gated = quiz('gated');
		assert.equal(count(gated, ' required>'), 3);
		assert.match(gated, /name="quiz-check-yourself-q1" required>/);
		assert.match(gated, /name="quiz-check-yourself-q3" required>/);
		const free = quiz('free');
		assert.equal(count(free, 'required'), 0);
		assert.match(free, /<lay-out md="columns\(1\)" overflow media="nav\(end\) arw\(drk\)">/);
	});

	/* the question markup is SHARED with the single-card deck: same fieldset, same
	   legend, same option rows — only `required` differs. A drift here would let the
	   two graded presentations disagree on the schema.org shape */
	test('each slide reuses the graded fieldset byte-for-byte (minus required)', () => {
		const pick = (html) => (html.match(/<fieldset[\s\S]*?<\/fieldset>/g) || []).map((f) => f.replaceAll(' required>', '>'));
		const deck = pick(quiz('stack'));
		const slides = pick(quiz('gated'));
		assert.equal(deck.length, 3);
		assert.deepEqual(slides, deck);
	});

	test('a flashcard deck declines the scroller — the card renders, with a loud comment', () => {
		const html = quiz('gated', { format: 'flashcard', cards: [{ question: 'What is a qubit?', answer: 'The quantum unit.' }] });
		assert.match(html, /^<ui-card /);
		assert.match(html, /<!-- lay-out preset ignored: a scroller deck needs details\.format multiple-choice -->/);
	});

	/* the heading goes through renderInline (escaped, b/em/code allowlist — the envelope's
	   own headline rule); the name meta and the group slug read plain(), which strips tags */
	test('a hostile deck name is escaped on every slide and never reaches the group name raw', () => {
		const html = quiz('gated', details, { headline: '<img src=x onerror=alert(1)>' });
		assert.ok(!html.includes('<img src=x'));
		assert.equal(count(html, '&lt;img src=x onerror=alert(1)&gt;'), 3, 'one escaped heading per slide');
		assert.ok(!html.includes('itemprop="name" content="<'), 'the name meta is the plain text, or absent');
		assert.match(html, /name="quiz-card-q1" required>/, 'the slug falls back, as the single-card deck does');
	});
});

/* the office plate is PRESET output — parts.office `box` → bare data-box, parts.officeTheme →
   data-theme — so a bare render stays unboxed. Docs: docs/card.md § Preset model */
describe('organization — boxed offices (parts.office / parts.officeTheme)', () => {
	const offices = [{ name: 'Aarhus office', telephone: '+45 86 12 34 56' }, { name: 'Berlin office' }];
	const fields = { schemaType: 'organization', headline: 'Northwind', details: { offices } };
	const withParts = (parts) => renderCard({ fields: { ...fields, preset: { $ref: 'card-preset/p' } } }, { p: { element: 'ui-card', parts } });

	test('by default an office carries neither data-box nor data-theme', () => {
		const html = render(fields);
		assert.equal(count(html, '<div data-part="office" itemprop="department" itemscope itemtype="https://schema.org/LocalBusiness">'), 2);
		assert.ok(!html.includes('data-box'));
		assert.ok(!html.includes('data-theme'));
	});

	test('parts.office "box" + parts.officeTheme emit data-theme and a bare data-box ahead of the scope', () => {
		const html = withParts({ office: 'box', officeTheme: 'gray light' });
		assert.equal(count(html, '<div data-part="office" data-theme="gray light" data-box itemprop="department" itemscope itemtype="https://schema.org/LocalBusiness">'), 2);
	});

	/* `box` turns the attribute on; every other word is its value — `brd` is the theme-matched
	   hairline (base/theme.md § Box). The demo preset is the first spelling */
	test('parts.office "box brd" emits data-box="brd"', () => {
		const html = withParts({ office: 'box brd', officeTheme: 'gray light' });
		assert.equal(count(html, '<div data-part="office" data-theme="gray light" data-box="brd" itemprop="department" itemscope itemtype="https://schema.org/LocalBusiness">'), 2);
	});

	test('parts.office "brd" alone still makes a box — the value implies the attribute', () => {
		const html = withParts({ office: 'brd' });
		assert.equal(count(html, '<div data-part="office" data-box="brd" itemprop="department" itemscope itemtype="https://schema.org/LocalBusiness">'), 2);
	});

	test('a hostile officeTheme is escaped', () => {
		const html = withParts({ office: 'box', officeTheme: '"><img src=x onerror=alert(1)>' });
		assert.ok(!html.includes('<img src=x'));
		assert.equal(count(html, 'data-theme="&quot;&gt;&lt;img src=x onerror=alert(1)&gt;"'), 2);
	});
});

/* ── CTA icons — a glyph from the icon font on a button. `icon` names a catalogue glyph
   (data-icon binds --icon, the corpus test above proves the name exists); `iconAt: "end"`
   puts it after the text (chevrons), anything else keeps it before. Docs: docs/content.md § Icons on buttons */
describe('CTA icons', () => {
	const cta = (action) => /<nav data-part="actions">([\s\S]*?)<\/nav>/.exec(render({ schemaType: 'content', headline: 'H', actions: [action] }))[1];

	test('an action icon rides data-icon, before the text by default', () => {
		assert.equal(cta({ link: { url: '#', text: 'Add to cart' }, style: 'primary', icon: 'shopping-cart' }),
			'<a class="ui-button" data-variant="accent" data-icon="shopping-cart" href="#">Add to cart</a>');
	});

	test('iconAt "end" adds data-icon-at="end"; any other value is dropped', () => {
		assert.equal(cta({ link: { url: '#', text: 'Read more' }, style: 'primary', icon: 'chevron-right', iconAt: 'end' }),
			'<a class="ui-button" data-variant="accent" data-icon="chevron-right" data-icon-at="end" href="#">Read more</a>');
		assert.equal(cta({ link: { url: '#', text: 'Read more' }, icon: 'chevron-right', iconAt: 'start' }),
			'<a class="ui-button" data-icon="chevron-right" href="#">Read more</a>');
	});

	test('no icon → no icon attributes; a real <button> carries the icon too', () => {
		assert.equal(cta({ link: { url: '#', text: 'Plain' } }), '<a class="ui-button" href="#">Plain</a>');
		assert.equal(cta({ link: { text: 'Apply now' }, style: 'primary', icon: 'send' }), '<button class="ui-button" type="button" data-variant="accent" data-icon="send">Apply now</button>');
	});

	test('a hostile icon name is escaped', () => {
		const html = cta({ link: { url: '#', text: 'x' }, icon: '"><b>' });
		assert.ok(!html.includes('<b>'));
		assert.match(html, /data-icon="&quot;&gt;&lt;b&gt;"/);
	});

	test('the loyalty join CTA takes joinIcon', () => {
		const html = render({ schemaType: 'loyalty', headline: 'H', details: { joinUrl: '#', joinText: 'Join Nordlys Rewards', joinIcon: 'loyalty' } });
		assert.match(html, /<a class="ui-button" data-variant="accent" data-icon="loyalty" itemprop="url" href="#">Join Nordlys Rewards<\/a>/);
		assert.ok(!render({ schemaType: 'loyalty', headline: 'H', details: { joinUrl: '#' } }).includes('data-icon'), 'no joinIcon, no attribute');
	});

	test('the service contact CTA takes channel.urlIcon', () => {
		const html = render({ schemaType: 'service', headline: 'H', details: { channel: { url: '#', urlText: 'Request a quote', urlIcon: 'request-quote' } } });
		assert.match(html, /<a class="ui-button" data-variant="accent" data-icon="request-quote" itemprop="serviceUrl" href="#">Request a quote<\/a>/);
	});

	/* contact BUTTONS carry their glyph as data-icon like every other CTA — the inline
	   tel:/mailto: text-link rule in content.css excludes .ui-button, so the button
	   mechanism (sized + centred) draws it once */
	test('contact buttons carry data-icon call/mail', () => {
		const html = render({ schemaType: 'contact', headline: 'H', details: { contactMethods: [{ type: 'phone', value: '+45 12 34 56 78' }, { type: 'email', value: 'a@b.c', label: 'Email' }] } });
		assert.match(html, /<a class="ui-button" data-variant="accent" data-icon="call" itemprop="telephone" href="tel:\+4512345678">\+45 12 34 56 78<\/a>/);
		assert.match(html, /<a class="ui-button" data-icon="mail" href="mailto:a@b\.c">Email<\/a>/);
	});

	/* Dataset downloads: the button is a real download (`download`), the format glyph comes
	   from a closed map (unknown formats get no icon, never an interpolated name), and a
	   size is VISIBLE text inside the button — never an aria-label, which would replace the
	   visible name (WCAG 2.5.3). Docs: docs/schema.md § Dataset */
	test('dataset distribution buttons: download, format glyph from a closed map, visible size', () => {
		const html = render({ schemaType: 'dataset', headline: 'H', details: { distribution: [
			{ format: 'CSV', url: 'https://x/a.csv', size: '1.2 MB' }, { format: 'JSON', url: 'https://x/a.json' }, { format: 'Parquet', url: 'https://x/a.parquet' }
		] } });
		assert.match(html, /<meta itemprop="contentSize" content="1\.2 MB"><a class="ui-button" data-variant="accent" data-icon="table-view" itemprop="contentUrl" href="https:\/\/x\/a\.csv" download>CSV <small>1\.2 MB<\/small><\/a>/);
		assert.match(html, /<a class="ui-button" data-icon="data-object" itemprop="contentUrl" href="https:\/\/x\/a\.json" download>JSON<\/a>/);
		assert.match(html, /<a class="ui-button" itemprop="contentUrl" href="https:\/\/x\/a\.parquet" download>Parquet<\/a>/);
		assert.ok(!html.includes('aria-label'));
	});
});

/* Brand on the product card — the subheadline slot, the album→artist shape.
   Docs: docs/schema.md § Product */
describe('product brand', () => {
	test('brand renders in the subheadline slot as a Brand scope', () => {
		assert.match(render({ schemaType: 'product', headline: 'X', details: { brand: 'AuraSound' } }),
			/<p data-part="subheadline" itemprop="brand" itemscope itemtype="https:\/\/schema\.org\/Brand"><span itemprop="name">AuraSound<\/span><\/p>/);
	});
	test('brandUrl wraps the name in a crawlable url, like artistUrl', () => {
		assert.match(render({ schemaType: 'product', headline: 'X', details: { brand: 'AuraSound', brandUrl: '/brands/aurasound' } }),
			/itemtype="https:\/\/schema\.org\/Brand"><a itemprop="url" href="\/brands\/aurasound"><span itemprop="name">AuraSound<\/span><\/a><\/p>/);
	});
	test('the row sits between headline and summary', () => {
		const html = render({ schemaType: 'product', headline: 'X', summary: 'S', details: { brand: 'B' } });
		const at = (needle) => html.indexOf(needle);
		assert.ok(at('data-part="headline"') < at('itemprop="brand"') && at('itemprop="brand"') < at('data-part="summary"'));
	});
	test('no brand, no scope; a hostile brand is escaped', () => {
		assert.ok(!render({ schemaType: 'product', headline: 'X', details: { sku: 'S' } }).includes('itemprop="brand"'));
		const html = render({ schemaType: 'product', headline: 'X', details: { brand: '<img src=x onerror=alert(1)>', brandUrl: '" onclick="x' } });
		assert.ok(!html.includes('<img src=x'));
		assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
		assert.ok(!html.includes('" onclick="x'));
	});
});

/* Paywalled content — `details.paywalled: true` → isAccessibleForFree False on any
   CreativeWork | Event | Place type; the full view also names the gated part.
   Docs: docs/schema.md § Paywall */
describe('paywalled content', () => {
	const FALSE = '<meta itemprop="isAccessibleForFree" content="https://schema.org/False">';
	const paywalled = (schemaType, extra = {}) => render({ schemaType, headline: 'H', details: { paywalled: true }, ...extra });
	test('paywalled emits isAccessibleForFree False on a CreativeWork, Event or Place', () => {
		for (const schemaType of ['news', 'article', 'content', 'recipe', 'video', 'event', 'location'])
			assert.ok(paywalled(schemaType).includes(FALSE), schemaType);
	});
	test('only the boolean true, and only in domain', () => {
		for (const value of [false, 'true', 1, 'yes'])
			assert.ok(!render({ schemaType: 'news', headline: 'H', details: { paywalled: value } }).includes('isAccessibleForFree'), String(value));
		assert.ok(!render({ schemaType: 'news', headline: 'H' }).includes('isAccessibleForFree'));
		/* Product, JobPosting, Person, Offer, Organization — out of domain, so the flag is dropped */
		for (const schemaType of ['product', 'job', 'profile', 'membership', 'organization'])
			assert.ok(!paywalled(schemaType).includes('isAccessibleForFree'), schemaType);
	});
	test('a teaser carries the boolean only; the full view adds the WebPageElement part', () => {
		assert.ok(!paywalled('news', { summary: 'S' }).includes('WebPageElement'));
		const FULL = { full: { element: 'ui-card', variant: 'col', text: 'body' } };
		const full = (details) => renderCard({ fields: { schemaType: 'news', headline: 'H', body: 'Paid words', details, preset: { $ref: 'card-preset/full' } } }, FULL);
		const html = full({ paywalled: true });
		assert.match(html, /<div data-part="body" itemprop="articleBody">/);
		assert.ok(html.includes(`<div itemprop="hasPart" itemscope itemtype="https://schema.org/WebPageElement" hidden>${FALSE}<meta itemprop="cssSelector" content="[data-part=body]"></div>`));
		/* the selector must survive the raw/jsonld schema modes, which strip microdata attributes only */
		assert.match(html, /<div data-part="body"/);
		/* the part is only truthful where the paywalled body is in the DOM */
		assert.ok(!full({}).includes('WebPageElement'));
		assert.ok(!full(undefined).includes('isAccessibleForFree'));
	});
});

/* The CMS models are JSON files nothing in this repo parsed until 2026-08-28 — card.schema.json
   shipped invalid (raw quotes in a description) for a week. Cheap insurance. */
describe('content models parse', () => {
	for (const model of ['card', 'card-preset']) {
		test(`cms/baseline/models/${model}.schema.json is valid JSON`, () => {
			const json = JSON.parse(readFileSync(new URL(`../../cms/baseline/models/${model}.schema.json`, import.meta.url), 'utf8'));
			assert.equal(json.id, model);
		});
	}
});
