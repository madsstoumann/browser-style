# Schema.org Type Expansion — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend the card engine from 35 to 46 schema.org card types, and add a generic itemtype-subtype mechanism that unlocks ~90 further types with no new renderer code.

**Architecture:** Three kinds of change, in dependency order. (1) A generic `SUBTYPES` map generalises the existing `business`-only itemtype sharpening in `render.js`, so any card type can narrow to an allowlisted subtype that inherits its properties — this alone lands `DiscussionForumPosting`, `SportsEvent`, `BlogPosting`, `Vehicle`, `NGO`, `TouristAttraction` and `Accommodation`. (2) Two existing renderers gain optional blocks (`product` → variants, `job` → employer rating). (3) Eleven new card types follow the established `SCHEMA_TYPES` + `DETAILS` + demo-data + reference-markup + docs pattern. No type is removed.

**Tech Stack:** Node 25 ESM (`render.js` is Node-safe string SSR, no `document`), `node:test` for unit tests, inline microdata (never JSON-LD), the repo's existing `tokens.build.js` / `tokens.lint.js` / `render.snapshot.js` gates, Chromium via the Playwright MCP for visual checks.

---

## Context an engineer new to this repo needs

Read these before starting: `docs/session-start.md` (gates, sharp edges), `ui/card/AGENTS.md` (card architecture, the three attribute DSLs), `ui/card/docs/schema.md` (per-type notes — the doc you will be extending).

**Where the pieces live:**

| Concern | File |
|---|---|
| `schemaType` → itemtype map, per-type `DETAILS` renderers, all behaviour maps | `ui/card/render.js` |
| Content model: `schemaType` enum + `details` shape prose | `cms/baseline/models/card.schema.json` |
| One demo instance per type | `ui/card/data/<type>.json`, listed in `ui/card/data/index.json` |
| Hand-authored reference markup (all types, one grid) | `ui/card/demo/schema.html` |
| Per-type notes | `ui/card/docs/schema.md` |
| Renderer-driven demo of the same data | `ui/card/demo/render.html` (reads `data/index.json`) |

**Rules that are not negotiable** (from `ui/card/AGENTS.md` and `docs/session-start.md`):

- Every interpolated value passes through `esc()`. Never `innerHTML` with data. Never emit unescaped rich markup.
- `render.js` must stay Node-safe: no `document`, no browser globals.
- Allowlist any value that reaches an `itemtype` — never write a user-supplied string into the type. This is why `BUSINESS_SUBTYPES` is a `Set`, and why the new `SUBTYPES` map must be too.
- CSS comments are one-liners pointing at the markdown docs. Prose belongs in `docs/`.
- Hand-author `<cq-box>` inside `<ui-card>`; nothing auto-inserts it.

**Helpers already in `render.js`** — use these, do not reinvent:

```js
esc(value)                                     // HTML-escape
meta(prop, content)                            // <meta itemprop=… content=…>, empty string if content is null
scope(prop, type)                              // ` itemprop="…" itemscope itemtype="https://schema.org/…"`
num(value)                                     // 1247 → "1,247"
fmtPrice(currency, value)                      // Intl currency string
ratingPart(prop, ratingType, rating)           // the <div data-part="rating"> star row
listPart(items, { ordered, itemprop, crossed })// <ul|ol data-part="list">
addressPart(address, prop = 'address')         // <address data-part="address"> + PostalAddress scope
geoPart(geo)                                   // hidden GeoCoordinates
hoursPart(hours, { flat })                     // two-column <dl data-part="hours">
avatarPart({ avatar, name })                   // <ui-avatar>
quotePart(text, { itemprop, variant, cite })   // <ui-quote><blockquote>
accordion(group, items, variant, hostAttrs)    // <ui-accordion> with hand-authored <cq-box>
```

**Behaviour maps in `render.js`** you may need to extend for a new type: `HEADLINE_PROP`, `SUMMARY_PROP`, `EYEBROW_PROP`, `PUBLISHED_PROP`, `TAGS_PROP`, `NO_IMAGE_PROP`, `ARTICLE_BODY_TYPES`, `ROOT_VIDEO_TYPES`, `DETAILS_OWNS_SUMMARY`, `BYLINE_EARLY`.

---

## Scope decisions (already made — do not relitigate)

- **Nothing is deleted or deprecated.** Google dropped rich results for `FAQPage`, `HowTo`, `SpecialAnnouncement`, `ClaimReview` and `Dataset`, and narrowed `Course`. We keep all of them: the markup stays valid schema.org and remains valuable for AI agents, GEO and answer engines that read structured data independently of Google SERP features. Task 16 documents that rationale so nobody "cleans them up" later.
- **`ProductGroup` is not a new card type** — it is `product` plus the subtype map plus an optional `variants` block, because a variant group shares every property the `product` renderer already emits.
- **`EmployerAggregateRating` is not a new card type** — it extends `job`.
- **`ProfilePage`, `BreadcrumbList`, `MerchantReturnPolicy`, `ShippingService`, `Speakable`, `MathSolver` are out of scope** — they are page-level or org-level markup, not card content. Revisit separately if we ever ship a page-level schema layer.

---

## The repeatable "new card type" task template

Tasks 5–15 each add one type. They all follow these eight steps — the per-task sections below give only what is *specific* to that type (the `SCHEMA_TYPES` entry, the `DETAILS` renderer, the `details` shape, the test). Do not skip a step because the type feels simple.

**Step A — Write the failing test.** Append a `describe` block to `ui/card/render.test.js` (created in Task 1) asserting: the emitted `itemtype`, every itemprop the renderer must produce, and that a hostile string in a free-text field comes out escaped.

**Step B — Run it and watch it fail.** `node --test ui/card/render.test.js` → FAIL. If it passes, the test is wrong.

**Step C — Add the type to `SCHEMA_TYPES`** in `ui/card/render.js`, keeping the map's existing grouping and adding any behaviour-map entries the type needs.

**Step D — Write the `DETAILS` renderer.** Add the method to the `DETAILS` object. Follow the house style of its neighbours: build a `let html = meta(...)` chain, append parts, `return html`.

**Step E — Run the test until green.** `node --test ui/card/render.test.js`.

**Step F — Add demo data + reference markup + docs.**
1. `ui/card/data/<type>.json` — copy the envelope from an existing file (`ui/card/data/software.json` is a good model), set `schemaType`, fill `details`.
2. Add the type name to `cards` in `ui/card/data/index.json`.
3. Add the `schemaType` option to the enum in `cms/baseline/models/card.schema.json` and append the `details` shape to the long `Type Details` description string in the same file.
4. Add a hand-authored reference card to `ui/card/demo/schema.html` — it must be byte-equivalent in structure to what `render.js` emits, since that page is the reference the renderer follows.
5. Add a `### <Type> — \`<ItemType>\`` section to `ui/card/docs/schema.md`.

**Step G — Run the gates.**
```bash
node ui/card/tokens.build.js && node ui/card/tokens.build.js   # twice: 2nd run must be a no-op
node ui/card/tokens.lint.js                                     # expect "tokens lint: ok"
node ui/card/render.snapshot.js . /tmp/after.txt
diff /tmp/before.txt /tmp/after.txt                             # only the NEW type's block may differ
```
The snapshot must not change for any pre-existing card. A diff in an unrelated block means you changed shared code — stop and fix.

**Step H — Commit.** One commit per type:
```bash
git add ui/card/render.js ui/card/render.test.js ui/card/data/ ui/card/demo/schema.html ui/card/docs/schema.md cms/baseline/models/card.schema.json
git commit -m "feat(card): add <type> card type (<ItemType>)"
```

---

## Phase 0 — Harness

### Task 1: Add a unit-test harness

There is currently **no test file** in `ui/card/` — the only regression gates are the snapshot and the token lint. Both catch *changes*, neither asserts *correctness*. Every task after this one depends on this harness.

**Files:**
- Create: `ui/card/render.test.js`
- Modify: `ui/card/package.json` (add a `test` script)

**Step 1: Create the test file with one test for an existing type**

```js
/* Unit tests for the SSR renderer. Run: node --test ui/card/render.test.js
 * Complements render.snapshot.js — the snapshot catches CHANGES, these assert CORRECTNESS. */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import renderCard from './render.js';

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
		assert.ok(!html.includes('<img'), 'attribute breakout must be escaped');
	});
});
```

**Step 2: Run it — expect PASS**

```bash
node --test ui/card/render.test.js
```
Expected: `# pass 2`. If the escaping test fails, stop and report — that is a live security bug, not a test problem.

⚠️ **Probe the right substring.** Assert on the *tag opener* (`<img`, `<script>`), never on an inner fragment like `onerror=alert`. `esc()` escapes `& < > "` and nothing else, so an inner fragment survives verbatim inside correctly-escaped output — an assertion on it fails on perfect escaping and proves nothing. The same rule applies to every escaping test added by later tasks.

**Step 3: Wire the npm script**

In `ui/card/package.json`, add to `scripts`:
```json
"test": "node --test render.test.js"
```

**Step 4: Capture the baseline snapshot** (needed by every later task)

```bash
node ui/card/render.snapshot.js . /tmp/before.txt
```
Expected: `rendered 116 ok, 0 failed`. Keep `/tmp/before.txt` for the whole run; regenerate it after each merged task.

**Step 5: Commit**

```bash
git add ui/card/render.test.js ui/card/package.json
git commit -m "test(card): add node:test harness for the SSR renderer"
```

---

## Phase 1 — The enabler

### Task 2: Generalise itemtype subtype sharpening

**Why first:** it is the highest coverage-per-line change in the plan, and three later tasks (real estate, TV, music) lean on it. It also lands `DiscussionForumPosting` — a *live, still-expanding* Google rich result — as a one-line allowlist entry, because it is a subtype of the `SocialMediaPosting` we already emit.

**Files:**
- Modify: `ui/card/render.js:72-81` (replace `BUSINESS_SUBTYPES` + `resolveItemtype`)
- Modify: `ui/card/render.test.js`
- Modify: `cms/baseline/models/card.schema.json`, `ui/card/docs/schema.md`

**Step 1: Write the failing tests**

```js
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
});
```

**Step 2: Run — expect 4 of 5 to fail**

```bash
node --test ui/card/render.test.js
```

**Step 3: Replace the mechanism**

Delete the `BUSINESS_SUBTYPES` const and the `resolveItemtype` arrow at `ui/card/render.js:72-81`, and put this in their place:

```js
/* itemtype sharpening — a card may narrow to an allowlisted SUBTYPE that inherits
   every property its renderer emits, so no new renderer is needed. Allowlisted,
   never verbatim data: this value lands in an itemtype. Docs: docs/schema.md § Subtypes */
const SUBTYPES = {
	article: ['BlogPosting', 'TechArticle', 'APIReference', 'ScholarlyArticle', 'Report', 'SatiricalArticle', 'AdvertiserContentArticle'],
	business: ['Restaurant', 'CafeOrCoffeeShop', 'Bakery', 'BarOrPub', 'FastFoodRestaurant', 'IceCreamShop', 'Winery', 'Brewery', 'Store', 'Hotel', 'Resort', 'BedAndBreakfast', 'Motel', 'Hostel', 'Campground', 'BeautySalon', 'DaySpa', 'HealthClub', 'AutoRepair', 'AutoDealer', 'AutoRental', 'GasStation', 'Dentist', 'MedicalClinic', 'Pharmacy', 'Physician', 'RealEstateAgent', 'TravelAgency', 'Library', 'Museum', 'GovernmentOffice'],
	event: ['SportsEvent', 'MusicEvent', 'TheaterEvent', 'ScreeningEvent', 'ComedyEvent', 'DanceEvent', 'ExhibitionEvent', 'FoodEvent', 'LiteraryEvent', 'BusinessEvent', 'EducationEvent', 'ChildrensEvent', 'SocialEvent', 'SaleEvent', 'Festival', 'Hackathon', 'PublicationEvent', 'CourseInstance'],
	location: ['TouristAttraction', 'TouristDestination', 'LandmarksOrHistoricalBuildings', 'Accommodation', 'Apartment', 'House', 'SingleFamilyResidence', 'Room', 'Suite', 'Residence', 'ApartmentComplex', 'GatedResidenceCommunity', 'CivicStructure', 'Park', 'Beach', 'Campground', 'Church', 'Airport'],
	news: ['ReportageNewsArticle', 'OpinionNewsArticle', 'AnalysisNewsArticle', 'BackgroundNewsArticle', 'ReviewNewsArticle'],
	organization: ['NGO', 'Corporation', 'OnlineStore', 'OnlineBusiness', 'EducationalOrganization', 'School', 'CollegeOrUniversity', 'GovernmentOrganization', 'NewsMediaOrganization', 'MedicalOrganization', 'ResearchOrganization', 'PerformingGroup', 'MusicGroup', 'SportsOrganization', 'SportsTeam', 'Airline', 'LibrarySystem', 'WorkersUnion', 'PoliticalParty', 'FundingScheme', 'Consortium', 'Project'],
	product: ['ProductGroup', 'ProductModel', 'IndividualProduct', 'Vehicle', 'Car', 'Motorcycle', 'Drug', 'DietarySupplement'],
	social: ['DiscussionForumPosting', 'BlogPosting', 'LiveBlogPosting']
};
/* Sets, built once — membership tests run per render */
const SUBTYPE_SETS = Object.fromEntries(Object.entries(SUBTYPES).map(([type, list]) => [type, new Set(list)]));

/* `details.subtype` is the general spelling; `details.businessType` is the legacy
   business-only alias kept for existing content. Unknown values fall back to the base type. */
const resolveItemtype = (type, fields) => {
	const wanted = fields.details?.subtype || (type === 'business' ? fields.details?.businessType : null);
	return wanted && SUBTYPE_SETS[type]?.has(wanted) ? wanted : SCHEMA_TYPES[type];
};
```

**Step 4: Run the tests — expect PASS**

**Step 5: Run the gates.** The snapshot must be **byte-identical** — no existing demo card uses `subtype`, and `business.json` uses `businessType`, which still resolves.

```bash
node ui/card/render.snapshot.js . /tmp/after.txt && cmp /tmp/before.txt /tmp/after.txt && echo identical
```

**Step 6: Document it.** Add a `## Subtypes` section to `ui/card/docs/schema.md` (before `## The types`) listing the map and explaining the allowlist rule; add `subtype` to the `details` description in `cms/baseline/models/card.schema.json`, noting `businessType` is a legacy alias.

**Step 7: Commit**

```bash
git commit -am "feat(card): generic itemtype subtype allowlist (was business-only)"
```

### Task 3: Prove the subtype map end-to-end in the demo

**Files:** `ui/card/demo/schema.html`, `ui/card/data/social.json`

**Step 1:** Change the existing Social card in `ui/card/demo/schema.html` from `itemtype="https://schema.org/SocialMediaPosting"` to a second, *additional* card using `DiscussionForumPosting`, with `<meta itemprop="interactionStatistic">` comment counts. Keep the original Social card — both spellings need reference markup.

**Step 2:** Add `"subtype": "DiscussionForumPosting"` to a new `ui/card/data/forum.json`? **No** — do not add a data file here; `social.json` keeps its current shape. Instead add the subtype demo in Task 16's docs example. This task is markup-only.

**Step 3:** Verify in the browser (see § Browser verification) and commit.

---

## Phase 2 — Tier 1: live Google rich-result features

### Task 4: `product` variants (`ProductGroup`)

**Files:** `ui/card/render.js` (the `product` method in `DETAILS`), `ui/card/render.test.js`, `ui/card/data/product.json`, `ui/card/demo/schema.html`, `ui/card/docs/schema.md`, `cms/baseline/models/card.schema.json`

**Details shape:** `product.variants` = `{ variesBy: ['color','size'], productGroupID: 'AB123', items: [{ name, sku, color?, size?, price, currency, availability? }] }`

⚠️ **Do not gate this block on `d.subtype`.** `ProductGroup` needs two independently-typo-able fields to agree — `details.subtype: "ProductGroup"` *and* `details.variants` — with nothing checking them. Forget the subtype and the card emits `itemtype="…/Product"` carrying `hasVariant`/`variesBy`/`productGroupID`, which are `ProductGroup`-only properties: **invalid markup, silently**. That is a worse failure class than anything reachable before this plan, where an unrecognised subtype could only ever lose specificity and never produce invalid output.

Gate on the **resolved** itemtype instead, so the two can never disagree. `resolveItemtype()` is exported for this; pass the resolved type into the renderer (or resolve inside it) and emit the variants block only when it is actually `ProductGroup`. Apply the same rule to every later task whose renderer output depends on a subtype.

**Renderer — append to the existing `product(d, fields)` before its `return`:**

```js
if (d.variants?.items?.length) {
	/* ProductGroup: variesBy names the differing axes; each variant is a nested Product.
	   Requires details.subtype = "ProductGroup" to sharpen the itemtype. Docs: docs/schema.md § Product */
	html += meta('productGroupID', d.variants.productGroupID)
		+ (d.variants.variesBy || []).map((axis) => meta('variesBy', axis)).join('');
	html += `<ul data-part="list">${d.variants.items.map((item) =>
		`<li${scope('hasVariant', 'Product')}><span itemprop="name">${esc(item.name)}</span>${meta('sku', item.sku)}${item.color ? meta('color', item.color) : ''}${item.size ? meta('size', item.size) : ''}${item.price != null ? `<span${scope('offers', 'Offer')}>${meta('priceCurrency', item.currency)}${meta('availability', SCHEMA + (item.availability || 'InStock'))} <data itemprop="price" value="${esc(item.price)}">${fmtPrice(item.currency, item.price)}</data></span>` : ''}</li>`
	).join('')}</ul>`;
}
```

**Test:** assert `itemprop="hasVariant"` appears once per item, `variesBy` once per axis, and that `subtype: 'ProductGroup'` yields the `ProductGroup` itemtype.

### Task 5: `job` employer rating (`EmployerAggregateRating`)

**Files:** as above, plus the `job` method.

**Details shape:** `job.employerRating` = `{ value, count, max? }`

**Renderer — append inside `job(d, fields, parts)` after the company meta line:**

```js
if (d.employerRating?.value) {
	/* EmployerAggregateRating is its own scope with itemReviewed → the hiring org —
	   NOT an aggregateRating on the JobPosting. Docs: docs/schema.md § Job */
	html += `<div data-part="rating"${scope('employerRating', 'EmployerAggregateRating')}>${meta('ratingValue', d.employerRating.value)}${meta('ratingCount', d.employerRating.count)}${meta('bestRating', d.employerRating.max ?? 5)}${meta('worstRating', 1)}<div${scope('itemReviewed', 'Organization')} hidden>${meta('name', d.company)}</div><input class="ui-rating" type="range" min="1" max="${esc(d.employerRating.max ?? 5)}" value="${esc(d.employerRating.value)}" step="0.01" disabled aria-hidden="true"><span data-sr>Employer rated ${esc(d.employerRating.value)} out of ${esc(d.employerRating.max ?? 5)} by ${esc(num(d.employerRating.count))} employees</span><span aria-hidden="true">${esc(d.employerRating.value)} / ${d.employerRating.max ?? 5} (${num(d.employerRating.count)} employee reviews)</span></div>`;
}
```

**Test:** assert the `EmployerAggregateRating` scope, the nested `itemReviewed` → `Organization`, and that a job *without* `employerRating` emits neither.

### Task 6: `loyalty` → `MemberProgram`

The only net-new Google rich-result feature of the last two years (June 2025; live in AU, BR, CA, FR, DE, MX, UK, US). **Distinct from the existing `membership` type**, which maps to `Offer` and describes a subscription price — a loyalty programme is tiers, requirements and benefits. Both types stay.

**`SCHEMA_TYPES` entry:** `loyalty: 'MemberProgram',`

**Details shape:** `{ programName, url, tiers: [{ name, requirementType: 'spend'|'points'|'credit'|'free', requirementValue?, currency?, pointsEarned?, benefits: [] }] }`

**Renderer:**

```js
loyalty(d, fields, parts = {}) {
	if (!d.tiers?.length) return meta('url', d.url);
	/* Each tier is a MemberProgramTier; hasTierBenefit takes TierBenefitEnumeration
	   members, hasTierRequirement a MonetaryAmount / CreditCard / Text. Docs: docs/schema.md § Loyalty */
	const BENEFITS = { points: 'TierBenefitLoyaltyPoints', price: 'TierBenefitLoyaltyPrice', returns: 'TierBenefitLoyaltyReturns', shipping: 'TierBenefitLoyaltyShipping' };
	let html = meta('url', d.url);
	const items = d.tiers.map((tier) => ({
		summary: esc(tier.name),
		scopeAttrs: scope('hasTiers', 'MemberProgramTier'),
		body: `<div>${meta('name', tier.name)}${
			tier.requirementType === 'credit' ? `<span${scope('hasTierRequirement', 'CreditCard')}>${meta('name', tier.requirementLabel || 'Store card')}</span>`
			: tier.requirementValue != null ? `<span${scope('hasTierRequirement', 'MonetaryAmount')}>${meta('currency', tier.currency)}${meta('value', tier.requirementValue)}</span>`
			: meta('hasTierRequirement', tier.requirementLabel || 'Free to join')
		}${tier.pointsEarned != null ? meta('membershipPointsEarned', tier.pointsEarned) : ''}${
			(tier.benefits || []).map((benefit) => BENEFITS[benefit] ? meta('hasTierBenefit', SCHEMA + BENEFITS[benefit]) : '').join('')
		}${tier.requirementValue != null ? `<p data-part="meta">${esc(fmtPrice(tier.currency, tier.requirementValue))} to qualify</p>` : ''}${
			listPart((tier.benefits || []).map((benefit) => tier.benefitLabels?.[benefit] || benefit))
		}</div>`
	}));
	html += accordion('loyalty-tiers', items, parts.accordion);
	return html;
}
```

Note `accordion()` already accepts `scopeAttrs` per item (see the `recipe` renderer for the precedent).

**Test:** `MemberProgram` itemtype; one `MemberProgramTier` scope per tier; a `MonetaryAmount` requirement for a spend tier; `hasTierBenefit` resolving to the full enumeration URL; an unknown benefit key emitting nothing.

### Task 7: `quiz` → `Quiz`

Google's Education Q&A feature, still active, flashcard pages only. Structurally close to `faq` — reuse that shape.

**`SCHEMA_TYPES` entry:** `quiz: 'Quiz',`

**Details shape:** `{ subject, framework?, level?, questions: [{ question, answer }] }`

**Renderer:**

```js
quiz(d, fields, parts = {}) {
	/* Google's Education Q&A requires eduQuestionType "Flashcard" on every Question.
	   Docs: docs/schema.md § Quiz */
	let html = d.subject ? `<span${scope('about', 'Thing')} hidden>${meta('name', d.subject)}</span>` : '';
	if (d.framework || d.level) {
		html += `<span${scope('educationalAlignment', 'AlignmentObject')} hidden>${meta('alignmentType', 'educationalLevel')}${meta('educationalFramework', d.framework)}${meta('targetName', d.level)}</span>`;
	}
	if (d.level) html += `<p data-part="meta">${esc(d.level)}${d.subject ? ` · ${esc(d.subject)}` : ''}</p>`;
	if (d.questions?.length) {
		html += accordion('quiz', d.questions.map((item) => ({
			summary: `<span itemprop="name">${esc(item.question)}</span>`,
			scopeAttrs: scope('hasPart', 'Question'),
			body: `<div${scope('acceptedAnswer', 'Answer')}>${meta('eduQuestionType', 'Flashcard')}<p itemprop="text">${esc(item.answer)}</p></div>`
		})), parts.accordion || 'divided');
	}
	return html;
}
```

⚠️ `eduQuestionType` belongs on the **Question**, not the Answer — verify against `https://developers.google.com/search/docs/appearance/structured-data/education-qa` while implementing and move the `meta()` call if the live docs disagree with the sketch above. Fix the code, then the test.

---

## Phase 3 — Tier 2: verticals with canonical types

Each of these follows the § template. Given here: the entry, the shape, the renderer, the test focus.

### Task 8: `service` → `Service`

The most common site pattern we currently cannot express at all — and Google explicitly tells publishers **not** to fake it with `Product`.

**Entry:** `service: 'Service',` · **Behaviour maps:** add `service: null` to `TAGS_PROP` (Intangible has no `keywords`).

**Shape:** `{ serviceType, provider: { name }, areaServed: [], channel: { url, phone }, catalog: [{ name, description, price, currency }], termsUrl }`

```js
service(d) {
	let html = meta('serviceType', d.serviceType);
	if (d.provider?.name) html += `<p data-part="meta"${scope('provider', 'Organization')}><span itemprop="name">${esc(d.provider.name)}</span></p>`;
	if (d.areaServed?.length) html += `<p data-part="meta">Serving ${d.areaServed.map((area) => `<span${scope('areaServed', 'Place')}><span itemprop="name">${esc(area)}</span></span>`).join(' · ')}</p>`;
	if (d.channel?.url || d.channel?.phone) {
		html += `<span${scope('availableChannel', 'ServiceChannel')} hidden>${meta('serviceUrl', d.channel.url)}${meta('servicePhone', d.channel.phone)}</span>`;
	}
	if (d.catalog?.length) {
		/* OfferCatalog is the canonical container for a service/pricing list */
		html += `<ul data-part="list"${scope('hasOfferCatalog', 'OfferCatalog')}>${d.catalog.map((item) =>
			`<li${scope('itemListElement', 'Offer')}><span${scope('itemOffered', 'Service')}><span itemprop="name">${esc(item.name)}</span>${item.description ? meta('description', item.description) : ''}</span>${item.price != null ? `${meta('priceCurrency', item.currency)} <data itemprop="price" value="${esc(item.price)}">${fmtPrice(item.currency, item.price)}</data>` : ''}</li>`
		).join('')}</ul>`;
	}
	if (d.termsUrl) html += meta('termsOfService', d.termsUrl);
	return html;
}
```

**Test focus:** `Service` itemtype; `OfferCatalog` wrapping `Offer` → `itemOffered` → `Service`; no `keywords` itemprop on tags.

### Task 9: `realestate` → `RealEstateListing`

**Entry:** `realestate: 'RealEstateListing',`

`RealEstateListing` is a `WebPage` subtype, so the *property* lives on a nested `mainEntity` — the accommodation itself.

The accommodation types are already `SUBTYPES.location` members. **Derive the subset from the exported `SUBTYPES` rather than hand-copying a local `Set`** — the plan's original sketch below transcribes six values that already exist in `render.js`, which would be a fourth copy of the same vocabulary in the same module that holds it. Task 2 exported `SUBTYPES` precisely so this does not happen; a copy here would also escape the drift lint added in Task 2.

**Shape:** `{ listingType: 'sale'|'rent', accommodationType, price: { amount, currency, period? }, floorSize: { value, unit }, bedrooms, bathrooms, rooms, yearBuilt, address: {...}, geo: {...}, amenities: [], leaseLength, datePosted }`

```js
realestate(d) {
	const ACCOMMODATION = new Set(['Accommodation', 'Apartment', 'House', 'SingleFamilyResidence', 'Room', 'Suite']);
	const kind = ACCOMMODATION.has(d.accommodationType) ? d.accommodationType : 'Accommodation';
	let html = meta('datePosted', d.datePosted);
	if (d.leaseLength) html += meta('leaseLength', d.leaseLength);
	html += `<div${scope('mainEntity', kind)}>`;
	if (d.floorSize?.value) html += `<span${scope('floorSize', 'QuantitativeValue')} hidden>${meta('value', d.floorSize.value)}${meta('unitCode', d.floorSize.unit || 'MTK')}</span>`;
	html += meta('numberOfBedrooms', d.bedrooms) + meta('numberOfBathroomsTotal', d.bathrooms) + meta('numberOfRooms', d.rooms) + meta('yearBuilt', d.yearBuilt);
	html += (d.amenities || []).map((amenity) => `<span${scope('amenityFeature', 'LocationFeatureSpecification')} hidden>${meta('name', amenity)}${meta('value', 'true')}</span>`).join('');
	if (d.address) html += addressPart(d.address);
	html += geoPart(d.geo);
	html += `</div>`;
	const facts = [d.bedrooms ? `${d.bedrooms} bed` : null, d.bathrooms ? `${d.bathrooms} bath` : null, d.floorSize?.value ? `${num(d.floorSize.value)} ${d.floorSize.unitLabel || 'm²'}` : null, d.yearBuilt ? `Built ${d.yearBuilt}` : null].filter(Boolean).join(' · ');
	if (facts) html += `<p data-part="meta">${esc(facts)}</p>`;
	if (d.price?.amount != null) {
		html += `<p data-part="price"${scope('offers', 'Offer')}>${meta('priceCurrency', d.price.currency)}${meta('availability', SCHEMA + 'InStock')}<data itemprop="price" value="${esc(d.price.amount)}">${fmtPrice(d.price.currency, d.price.amount)}</data>${d.price.period ? `<small>/${esc(d.price.period)}</small>` : ''}</p>`;
	}
	if (d.amenities?.length) html += listPart(d.amenities);
	return html;
}
```

**Test focus:** nested `mainEntity` scope with the right accommodation type; an unknown `accommodationType` falling back to `Accommodation`; `floorSize` as `QuantitativeValue`.

### Task 10: `menu` → `Menu`

**Entry:** `menu: 'Menu',`

⚠️ `MenuItem` sits under **Intangible**, not CreativeWork — do not assume CreativeWork properties on it. There is no Menu rich result; this is semantic/GEO markup.

**Shape:** `{ sections: [{ name, description?, items: [{ name, description?, price, currency, calories?, diets: [] }] }] }`

```js
menu(d, fields, parts = {}) {
	if (!d.sections?.length) return '';
	const DIETS = new Set(['DiabeticDiet', 'GlutenFreeDiet', 'HalalDiet', 'HinduDiet', 'KosherDiet', 'LowCalorieDiet', 'LowFatDiet', 'LowLactoseDiet', 'LowSaltDiet', 'VeganDiet', 'VegetarianDiet']);
	return accordion('menu', d.sections.map((section) => ({
		summary: esc(section.name),
		scopeAttrs: scope('hasMenuSection', 'MenuSection'),
		body: `<div>${meta('name', section.name)}${section.description ? meta('description', section.description) : ''}<ul data-part="list">${section.items.map((item) =>
			`<li${scope('hasMenuItem', 'MenuItem')}><span itemprop="name">${esc(item.name)}</span>${item.description ? ` — <span itemprop="description">${esc(item.description)}</span>` : ''}${
				(item.diets || []).map((diet) => DIETS.has(diet) ? meta('suitableForDiet', SCHEMA + diet) : '').join('')
			}${item.calories != null ? `<span${scope('nutrition', 'NutritionInformation')} hidden>${meta('calories', `${item.calories} calories`)}</span>` : ''}${
				item.price != null ? ` <span${scope('offers', 'Offer')}>${meta('priceCurrency', item.currency)}<data itemprop="price" value="${esc(item.price)}">${fmtPrice(item.currency, item.price)}</data></span>` : ''
			}</li>`
		).join('')}</ul></div>`
	})), parts.accordion);
}
```

**Test focus:** the `Menu` → `MenuSection` → `MenuItem` nesting depth; an unknown diet emitting nothing; prices as `Offer`.

### Task 11: `tvseries` → `TVSeries` and Task 12: `tvepisode` → `TVEpisode`

Two types, one shared helper — we already have `movie` but no TV, which is the asymmetry to close. `tvepisode` mirrors the existing `podcast` renderer's `partOfSeries` pattern.

**Entries:** `tvseries: 'TVSeries',` and `tvepisode: 'TVEpisode',` · **`EYEBROW_PROP`:** add `tvseries: 'genre', tvepisode: 'genre'`.

**`tvseries` shape:** `{ numberOfSeasons, numberOfEpisodes, dateReleased, dateReleasedDisplay, contentRating, director: { name }, actors: [], rating: { value, count, max } }`
**`tvepisode` shape:** `{ seriesName, seasonNumber, episodeNumber, duration, durationDisplay, dateReleased, director: { name }, actors: [] }`

```js
/* shared by movie/tvseries/tvepisode — cast + crew scopes */
const castPart = (d) =>
	(d.director?.name ? `<span${scope('director', 'Person')} hidden>${meta('name', d.director.name)}</span>` : '')
	+ (d.actors || []).map((actor) => `<span${scope('actor', 'Person')} hidden>${meta('name', actor)}</span>`).join('');
```

```js
tvseries(d) {
	let html = meta('numberOfSeasons', d.numberOfSeasons) + meta('numberOfEpisodes', d.numberOfEpisodes)
		+ meta('dateCreated', d.dateReleased) + meta('contentRating', d.contentRating) + castPart(d);
	const facts = [d.numberOfSeasons ? `${d.numberOfSeasons} seasons` : null, d.numberOfEpisodes ? `${num(d.numberOfEpisodes)} episodes` : null, d.dateReleasedDisplay || d.dateReleased, d.contentRating].filter(Boolean).join(' · ');
	if (facts) html += `<p data-part="meta">${esc(facts)}</p>`;
	html += ratingPart('aggregateRating', 'AggregateRating', d.rating);
	return html;
},

tvepisode(d) {
	let html = meta('episodeNumber', d.episodeNumber) + meta('duration', d.duration) + meta('dateCreated', d.dateReleased) + castPart(d);
	if (d.seriesName) {
		html += `<span${scope('partOfSeries', 'TVSeries')} hidden>${meta('name', d.seriesName)}</span>`;
	}
	if (d.seasonNumber != null) {
		html += `<span${scope('partOfSeason', 'TVSeason')} hidden>${meta('seasonNumber', d.seasonNumber)}</span>`;
	}
	const facts = [d.seriesName, d.seasonNumber != null ? `S${d.seasonNumber}` : null, d.episodeNumber != null ? `E${d.episodeNumber}` : null, d.durationDisplay].filter(Boolean).join(' · ');
	if (facts) html += `<p data-part="meta">${esc(facts)}</p>`;
	return html;
}
```

Also refactor `movie` to use `castPart()` in the same commit — same markup, one helper. The snapshot must stay byte-identical for `movie.json`; if it does not, the refactor changed output and must be corrected.

### Task 13: `medical` → `MedicalWebPage`

No rich result; the value is E-E-A-T signalling on YMYL pages, which answer engines read.

**Entry:** `medical: 'MedicalWebPage',`

**Shape:** `{ aboutType: 'MedicalCondition'|'Drug'|'MedicalProcedure'|'MedicalTest', aboutName, specialty, audience: 'Patient'|'Clinician', reviewedBy: { name, title, avatar? }, lastReviewed, lastReviewedDisplay }`

```js
medical(d) {
	const ABOUT = new Set(['MedicalCondition', 'Drug', 'MedicalProcedure', 'MedicalTest', 'MedicalSignOrSymptom', 'DietarySupplement']);
	const AUDIENCE = new Set(['Patient', 'Clinician', 'MedicalResearcher']);
	let html = '';
	if (d.aboutName) html += `<span${scope('about', ABOUT.has(d.aboutType) ? d.aboutType : 'MedicalEntity')} hidden>${meta('name', d.aboutName)}</span>`;
	if (AUDIENCE.has(d.audience)) html += `<span${scope('medicalAudience', 'MedicalAudience')} hidden>${meta('audienceType', d.audience)}</span>`;
	html += meta('specialty', d.specialty) + meta('lastReviewed', d.lastReviewed);
	if (d.reviewedBy?.name) {
		/* the reviewer byline IS the E-E-A-T signal — visible, not a hidden meta */
		html += `<address data-part="byline"${scope('reviewedBy', 'Person')}>${avatarPart(d.reviewedBy)}<span data-part="byline-who"><span itemprop="name">${esc(d.reviewedBy.name)}</span>${d.reviewedBy.title ? `<span itemprop="jobTitle">${esc(d.reviewedBy.title)}</span>` : ''}</span>${d.lastReviewed ? `<small data-part="dateline">Reviewed <time datetime="${esc(d.lastReviewed)}">${esc(d.lastReviewedDisplay || d.lastReviewed)}</time></small>` : ''}</address>`;
	}
	return html;
}
```

**Test focus:** unknown `aboutType` falling back to `MedicalEntity`; unknown `audience` emitting nothing; the reviewer byline being visible markup, not a `<meta>`.

### Task 14: `music` → `MusicAlbum`

**Entry:** `music: 'MusicAlbum',` · **`EYEBROW_PROP`:** add `music: 'genre'`.

**Shape:** `{ artist: { name }, numTracks, dateReleased, dateReleasedDisplay, albumProductionType?, tracks: [{ name, duration, durationDisplay }] }`

```js
music(d) {
	let html = meta('numTracks', d.numTracks) + meta('datePublished', d.dateReleased);
	if (d.artist?.name) html += `<p data-part="meta"${scope('byArtist', 'MusicGroup')}><span itemprop="name">${esc(d.artist.name)}</span></p>`;
	const facts = [d.numTracks ? `${d.numTracks} tracks` : null, d.dateReleasedDisplay || d.dateReleased].filter(Boolean).join(' · ');
	if (facts) html += `<p data-part="meta">${esc(facts)}</p>`;
	if (d.tracks?.length) {
		html += `<ol data-part="list">${d.tracks.map((track) =>
			`<li${scope('track', 'MusicRecording')}><span itemprop="name">${esc(track.name)}</span>${track.duration ? meta('duration', track.duration) : ''}${track.durationDisplay ? ` <small>${esc(track.durationDisplay)}</small>` : ''}</li>`
		).join('')}</ol>`;
	}
	return html;
}
```

### Task 15: `glossary` → `DefinedTermSet` and `podcastseries` → `PodcastSeries`

Two small types, one commit each.

**Entries:** `glossary: 'DefinedTermSet',` and `podcastseries: 'PodcastSeries',`

```js
glossary(d, fields, parts = {}) {
	if (!d.terms?.length) return '';
	/* DefinedTerm needs inDefinedTermSet back-reference only when the term is standalone;
	   nested under the set it is implied. Docs: docs/schema.md § Glossary */
	return accordion('glossary', d.terms.map((term) => ({
		summary: `<span itemprop="name">${esc(term.term)}</span>`,
		scopeAttrs: scope('hasDefinedTerm', 'DefinedTerm'),
		body: `<div>${term.code ? meta('termCode', term.code) : ''}<p itemprop="description">${esc(term.definition)}</p></div>`
	})), parts.accordion || 'divided');
},

podcastseries(d) {
	let html = meta('webFeed', d.feedUrl) + meta('numberOfEpisodes', d.numberOfEpisodes);
	if (d.host?.name) html += `<p data-part="meta"${scope('author', 'Person')}><span itemprop="name">${esc(d.host.name)}</span></p>`;
	const facts = [d.numberOfEpisodes ? `${num(d.numberOfEpisodes)} episodes` : null, d.frequency, d.categoryLabel].filter(Boolean).join(' · ');
	if (facts) html += `<p data-part="meta">${esc(facts)}</p>`;
	return html;
}
```

---

## Phase 4 — Documentation

### Task 16: Document why the "dead" types stay

**Files:** `ui/card/docs/schema.md`

Add a `## Rich results vs. structured data` section near the top. Content to convey, in prose:

- Google removed or narrowed rich results for `FAQPage` (May 2026), `HowTo` (Sept 2023), `SpecialAnnouncement` (Sept 2025), `ClaimReview` (phasing out), `Dataset` (Dataset Search only) and `Course` (only *Course list* survives).
- **We deliberately keep all of them.** The markup is still valid schema.org, and SERP features are only one consumer. AI agents, answer engines and GEO pipelines parse structured data directly; a machine-readable FAQ or how-to is *more* useful to them than to a search-result snippet.
- What changed is the *promise*, not the markup: do not describe these types as rich-result features.
- `HowTo` also remains fully supported **inside** `Recipe`, which is how the recipe renderer uses it.

Also update the counts: the intro says "34 schema.org card types" but the code has 35 today and 46 after this plan. Update `ui/card/demo/schema.html`'s `<meta name="description">` too.

### Task 17: Final full-system verification

```bash
node ui/card/tokens.build.js && node ui/card/tokens.build.js && node ui/card/tokens.lint.js
node --test ui/card/render.test.js
node ui/card/render.snapshot.js . /tmp/final.txt
npm run build:demo-css
```

Then the browser pass (below) over `ui/card/demo/schema.html` and `ui/card/demo/render.html` in **both** colour schemes, checking for console errors and that every new card renders with its type chip.

Validate a sample of the new markup with Google's Rich Results Test and the schema.org validator for the types that still have SERP features (`ProductGroup`, `EmployerAggregateRating`, `MemberProgram`, `Quiz`, `DiscussionForumPosting`).

---

## Browser verification (every visual task)

Per `docs/session-start.md`:

1. Serve from the repo root: `python3 -m http.server <port>` — **use a fresh port after every CSS rebuild.** `http.server` sends `Last-Modified` with no `Cache-Control`, and Chromium serves a stale `@import`ed sheet even after a query-string reload of the HTML. A change that "has no effect" is almost always this. Confirm with `curl` what the server actually serves.
2. Drive Chromium through the Playwright MCP; check computed styles, not the CSS source.
3. Check both `prefers-color-scheme` arms and the console.

## Order rationale

Task 1 first because nothing else is testable without it. Task 2 next because it is the cheapest coverage in the plan and later tasks depend on its allowlists (real estate reuses `location`, TV/music lean on `organization`). Phase 2 before Phase 3 because those four are live Google features with real deadlines attached to their value, and two of them are extensions of existing renderers rather than new types — lower risk, faster feedback on the workflow. Phase 3 is ordered by how much existing machinery each type reuses: `service` and `realestate` lean hardest on existing helpers, `glossary`/`podcastseries` are the smallest and make good last tasks. Documentation last, when the counts are final.

## Open gate: the `baseType()` call sites are pinned by nothing

Found by the review of `503c8355`/`70c36804`, and mutation-confirmed independently. `baseType()` is routed through three sites — `render.js:93` (inside `resolveItemtype`), `:1363` (`flipsideBack`), `:1456` (`renderCard`). **Reverting the latter two to the old truthiness form leaves all 14 tests green.** Two-thirds of the hardening can therefore regress silently.

It is not theoretical. With those two reverted and `schemaType: "constructor"`, the `itemtype` stays clean — the resolver is still guarded — but the poisoned `type` flows into the sibling type-keyed maps (`HEADLINE_PROP`, `TAGS_PROP`, `DETAILS`, …), and rendering a real UCF emits **four** attributes reading `itemprop="function Object() { [native code] }"`. The defect is relocated from `itemtype` to `itemprop`, not removed.

Fix inside the existing prototype-key loop in `render.test.js`:

```js
assert.match(html, /data-part="headline" itemprop="name"/, schemaType);      // pins renderCard's type
assert.doesNotMatch(html, /\[native code\]|\[object Object\]/, schemaType);  // pins the whole family
```

The `doesNotMatch` is the important one: it closes every current **and future** type-keyed map at once, which matters because the remaining tasks add more of them. Land this before Task 5.

Three further items from the same review, worth doing while each table still holds one entry:
- **`WATCHABLE` should be a `Map`, not a `Set`.** The vocabulary is not binary: `Book` currently gets `ViewAction` where schema.org has `ReadAction`, and `PodcastEpisode` wants `ListenAction`. A `Map` of itemtype → action with `?? 'ViewAction'` costs the same lines and drops in for whatever audio/episode types later tasks add. "No podcast data carries `viewCount`" is not a contract — `card.schema.json` puts `engagement.viewCount` on every type.
- **Lint the itemtype-override tables against `SUBTYPES`.** `HEADLINE_PROP_BY_ITEMTYPE` is keyed by resolved itemtype, so it structurally cannot express "only when sharpened from `social`" — yet `BlogPosting` deliberately resolves to `name` under `social` and `headline` under `article`. A contributor following the § Subtypes rule literally would add `['BlogPosting', 'headline']` and break the documented contract. Add to `tokens.lint.js`: no key of an itemtype-keyed override table may appear in more than one `SUBTYPES` list.
- **Doc drift from commit 2**: `cms/baseline/models/card.schema.json` still describes the engagement counters as `WatchAction/LikeAction/ShareAction/CommentAction`, and `ui/card/docs/card.md` still states the pre-commit headline rule verbatim — the file `AGENTS.md` points contributors at for renderer work.

## Follow-ups from Phases A–C

Each is real, each was deliberately left out of the phase that found it because fixing it would have moved existing snapshot output or widened a security surface.

1. **`industry` is emitted twice with conflicting values on a job card.** `EYEBROW_PROP.job` puts `itemprop="industry"` on the eyebrow ("Engineering") while `DETAILS.job` emits `<meta itemprop="industry" content="Software">`. Two values for one property. Fixing it changes existing snapshot output, so it needs its own change with a justified diff. **Same class, second site:** `DETAILS.social` emits `itemprop="author"` from `details.author` while the envelope `authors[]` already emits one on the byline — any social record filling both gets two authors. The demo data no longer fills both (the field was redundant with the byline and was dropped when the four cards were reconciled), so nothing exercises it now, but the renderer path is still there. Guard both from the emitting side, not from the data.
2. **Two reference strings lost inline markup.** `<em>logical</em>` and `<code>!important</code>` cannot be emitted — `esc()` permits only `<b>`, `<ui-gradient-text>` and `<high-light>`, and only in headline and body. The tags were removed so the page stays reproducible. Widening the allowlist to attribute-free `<em>`/`<code>` is cheap and probably right, but it is a security-surface decision: every addition is a tag that reaches output unescaped.
3. **The type count in `docs/schema.md` says 48; the page now has 50 distinct root itemtypes** (the two Quiz cards share one). Settle the counting rule — distinct itemtypes, or cards — and state it where the number lives.
4. **`<ui-reveal>` appears zero times in `demo/schema.html`.** Across 51 cards, the disclosure host never appears; it is demoed only in `ui/reveal/index.html` and three media pages. Defensible, since that page is organised by schema type rather than by component — but it should be a decision, not an accident. The specific opportunity: **a flashcard is literally a flip card**, so the `Quiz` deck is a natural fit for `<ui-reveal variant="flp()">`, front face the question and back the answer, far more apt than an accordion row. The open question is structural — `<ui-reveal>` is a *host* (a peer of `<ui-card>`), so this means nesting a host inside another host's `<ui-content>`, which the reveal docs do not cover; they document the reverse (an accordion nested in a reveal panel). `<ui-reveal>` sets `container-type: inline-size`, so a nested one creates a second `bs-card` container — prove the `md:`/`lg:` tiers still resolve correctly before adopting the pattern.

## Follow-ups discovered during execution

Recorded here rather than fixed inline — each is real, each is outside the file scope of the task that surfaced it. Scope discipline mid-run is worth more than the convenience of fixing them where they were found.

1. **Root `npm test` cannot reach the new suite** (found in Task 1). The root script is `npm run test --workspaces`, which aborts with `Missing script: "test"` across the editor workspaces; with `--if-present` it still fails, because at least one workspace carries npm's default `echo "Error: no test specified" && exit 1`. This was already broken before Task 1 — no package had a `test` script at all — but there is now something real to run and no top-level command that runs it. **Fix before Task 17**, which needs a single verification command.
2. **`ui/card/dist/card.css` and `card.min.css` are stale relative to source** (found in Task 1). Running `npm run build` in `ui/card` produces uncommitted changes — `font-variant-numeric: tabular-nums` and a `--_theme-ink` fallback — both originating from earlier commits in this session, not from the plan's work. Rebuild and commit the `dist/` bundles as a standalone commit, separate from any task here.
3. **Prototype keys reach plain-object lookups keyed by `schemaType`** (found in Task 2, reproduced by the controller). `SCHEMA_TYPES[fields.schemaType]` passes its truthiness guard for inherited `Object.prototype` keys, so `constructor`, `toString` and `__proto__` all slip through. There are **two distinct failure modes**:
   - *Without* a `details.subtype` — emits a garbage itemtype, e.g. `itemtype="https://schema.org/function Object() { [native code] }"`. Pre-existing; Task 2 did not change it.
   - *With* a `details.subtype` — throws `TypeError: SUBTYPES[type]?.has is not a function`. New in Task 2, because the resolver now indexes a second type-keyed map.

   The garbage-output mode is the worse of the two (nonsense silently enters published markup); the crash at least fails closed, but a throw in an SSR path is still a denial-of-service on any page containing one bad record. The class predates this plan and spans `SCHEMA_TYPES`, `DETAILS` and `SUBTYPES`.

   **Escalated after the Task 2 review fixes.** `resolveItemtype` is now **exported** and is the single itemtype authority for `render.js`, `demo/articles/build.js` and `demo/render.html`. It returns `undefined` for `constructor`/`toString` and `{}` for `__proto__`, so a bad record now yields `itemtype="https://schema.org/undefined"` on a generated article page — the failure is reachable through public API, not just internal. The same commit also left **three** identical copies of `SCHEMA_TYPES[fields.schemaType] ? … : 'content'` (`render.js:89`, `:1346`, `:1439`), so "fix once in `renderCard`" no longer suffices.

   Fix: extract one `baseType(fields)` helper using `Object.hasOwn(SCHEMA_TYPES, …)`, route all three sites through it, and add a test per failure mode (garbage itemtype, TypeError, and the exported resolver never returning a non-string). Extend the existing resolver test rather than starting a new one, and correct its comment, which currently claims a contract the assertions do not pin.

   **Route `resolveItemtype` itself through the helper, not only its call sites** — the resolver runs the same normalisation internally at `render.js:89`, one line above the copy at `:1439`, so fixing only the call sites leaves the duplication (and the hole) alive inside the function. Once done, `docs/card.md`'s `(fields) => string` typing becomes true absolutely rather than only for well-formed input.

   Do this as a standalone hardening commit **before Task 4**, since Task 4 gates its renderer on the resolved itemtype and inherits this contract.

   **Measured pre-hardening behaviour** (against `4c229ad4`, rendering a real UCF with real presets — five keys, not three):

   | `schemaType` | `resolveItemtype()` returned | `renderCard()` |
   |---|---|---|
   | `constructor` | a Function | **rendered**, emitting `itemtype="…/function Object() { [native code] }"` |
   | `toString` | a Function | **rendered**, emitting raw function source |
   | `valueOf` | a Function | **rendered**, emitting raw function source |
   | `hasOwnProperty` | a Function | **rendered**, emitting raw function source |
   | `__proto__` | an Object | threw `TypeError` |
   | `nope` (unknown) | `"CreativeWork"` | ok |
   | *(missing)* | `"CreativeWork"` | ok |
   | `article` | `"Article"` | ok |

   ⚠️ **An earlier revision of this table claimed all five threw. That was measured with bare `fields` and no presets, which takes a different path.** With real presets, four of the five render *successfully*, interpolating raw JavaScript source into an `itemtype` attribute — silent corruption that ships, rather than a loud crash. Not a live XSS (the values are fixed builtins containing no quotes), but it is unescaped interpolation into an attribute value. **Whether it throws is preset-dependent**, which is itself the argument for guarding inside the resolver rather than at each call site. Measure this class with a real UCF and real presets; a minimal-fields probe under-reports it.

   Acceptance: every row must read `"CreativeWork"` / ok after the fix, except `article`. `Object.hasOwn(SCHEMA_TYPES, k)` discriminates correctly (`constructor` → false, `article` → true). Test the whole table, not one representative key.

## Risks

- **`SUBTYPES` is an itemtype allowlist — it is a security boundary.** A subtype value lands inside `itemtype="…"`. It must never be interpolated from unvalidated data. Task 2's test suite includes the hostile-string case; keep it.
- **Snapshot churn.** Only a new type's own block may appear in the snapshot diff. Any change to an existing block means shared code moved — investigate before committing.
- **The `castPart()` refactor in Task 11/12 touches `movie`.** Byte-identical snapshot for `movie.json` is the pass condition.
- **`eduQuestionType` placement (Task 7)** is the one detail sketched from memory rather than read off a live page. Verify against Google's Education Q&A doc before writing the test.
