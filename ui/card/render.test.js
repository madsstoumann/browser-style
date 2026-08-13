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
		assert.match(html, /<data itemprop="price" value="0">\$0<\/data>/);
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
		assert.match(html, /<span itemprop="text">A superposition<\/span><\/label> <ui-chip theme="pale green">Correct<\/ui-chip>/);
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
		assert.match(html, /<span itemprop="itemOffered" itemscope itemtype="https:\/\/schema\.org\/Service"><span itemprop="name">Managed Kubernetes<\/span><\/span> — <data itemprop="price" value="450">€450<\/data>\/month/);
	});

	/* servicePhone expects a ContactPoint, NOT a phone string */
	test('servicePhone is a ContactPoint scope carrying telephone', () => {
		const html = card();
		assert.match(html, /<span itemprop="servicePhone" itemscope itemtype="https:\/\/schema\.org\/ContactPoint"><meta itemprop="contactType" content="technical support"><a class="ui-button" itemprop="telephone" href="tel:\+4570809000">/);
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
		assert.match(html, /<data itemprop="price" value="7250000">DKK 7,250,000<\/data>/);
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

/* Intl separates an ALPHABETIC currency code from its amount with U+00A0, so the code
   cannot wrap away from the number. The difference is invisible in a browser and a
   whitespace-normalising comparator cannot see it, so it is pinned in the two DKK
   assertions below and in the real-estate offer test above. */
describe('menu — Menu', () => {
	const sections = [{ name: 'Mains', items: [{ name: 'Curry', price: 145, currency: 'DKK', label: 'Gluten free', description: 'Mild.', diets: ['GlutenFreeDiet', 'PaleoDiet'], nutrition: { calories: '620 calories', proteinContent: '42 g', servingSize: '1 bowl' } }] }];
	const card = () => render({ schemaType: 'menu', headline: 'Kitchen', details: { sections } });

	/* Menu/MenuSection are CreativeWorks; MenuItem is an Intangible — which is why
	   only the ITEM gets offers/nutrition/suitableForDiet */
	test('sections nest MenuSection → MenuItem, and only the item carries the offer', () => {
		const html = card();
		assert.match(html, /itemprop="hasMenuSection" itemscope itemtype="https:\/\/schema\.org\/MenuSection"/);
		assert.match(html, /<li itemprop="hasMenuItem" itemscope itemtype="https:\/\/schema\.org\/MenuItem">/);
		assert.match(html, /<span itemprop="offers" itemscope itemtype="https:\/\/schema\.org\/Offer"><meta itemprop="priceCurrency" content="DKK"><data itemprop="price" value="145">DKK 145<\/data><\/span>/);
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
		assert.match(html, /<p data-part="meta" itemprop="director" itemscope itemtype="https:\/\/schema\.org\/Person">Directed by <span itemprop="name">Freja Nyholm<\/span><\/p>/);
	});

	/* the shared credits helper must not have moved movie's wording */
	test('a film still says "Director:"', () => {
		assert.match(render({ schemaType: 'movie', headline: 'M', details: { director: { name: 'Sofia Lindqvist' } } }),
			/itemprop="director" itemscope itemtype="https:\/\/schema\.org\/Person">Director: <span itemprop="name">Sofia Lindqvist</);
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
		assert.match(card(), /<ol data-part="list"><li itemprop="track" itemscope itemtype="https:\/\/schema\.org\/MusicRecording"><meta itemprop="position" content="1"><meta itemprop="duration" content="PT4M12S"><span itemprop="name">Slow Weather<\/span> <small>4:12<\/small><\/li>/);
		assert.ok(!card().includes('itemprop="tracks"'), 'the superseded spelling');
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
		assert.match(card(), /<ul data-part="list"><li itemprop="hasPart"/);
		assert.match(card({ ordered: true }), /<ol data-part="list"><li itemprop="hasPart"/);
	});

	test('the host is a visible author byline', () => {
		assert.match(card(), /<address data-part="byline" itemprop="author" itemscope itemtype="https:\/\/schema\.org\/Person">/);
		assert.match(card(), /<span itemprop="name">Ida Månsson<\/span><span itemprop="jobTitle">Host<\/span>/);
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
			['album', { schemaType: 'music', headline: 'X', details: { numTracks: XSS } }]
		];
		for (const [where, fields] of rows) {
			const html = render(fields);
			assert.ok(!html.includes('<img'), `${where}: raw <img must never reach output`);
			assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/, `${where}: the number must still render, escaped`);
			assert.ok(!html.includes('&amp;lt;'), `${where}: double-escaped output`);
		}
	});
});
