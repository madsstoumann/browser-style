/**
 * SSR build for the per-colourway product pages.
 *
 *   node ui/card/demo/products/build.js
 *
 * Sibling of articles/build.js and built the same way: each page is a full static
 * render of one UCF through render.js, so the cross-document view transition's
 * morph targets (card-variant-{color} on the root, hero-variant-{color} on the first
 * slide) exist in the HTML at capture time.
 *
 * The four pages are what demo/schema.html's ProductGroup collage links to. The
 * transition behaviour is decided ENTIRELY by name matching, and there is deliberately
 * no page-scoped view-transition CSS here: a page carries its own colourway's names, so
 * schema.html→page pairs (morph) while page→page does not (fade). A blanket
 * ::view-transition-old/new rule would force the fade AND kill the morph, because the
 * incoming document's CSS drives a cross-document transition.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderCard, reviewItems } from '../../render.js';
import { CDN_BASE, CONTRAST_STYLE, HEAD_COMMON, VT_HEAD, breadcrumb, descope, esc, phoneShell, withPreset } from '../build.shared.js';

const here = dirname(fileURLToPath(import.meta.url));
const data = (file) => JSON.parse(readFileSync(join(here, '../../data', file), 'utf8'));

const presets = { ...data('card.presets.json').presets, ...data('card.presets.demo.json').presets };

/* the media half of a lg:row card is ~half of the 64rem shell */
const IMAGES = { cdnBase: CDN_BASE, sizes: '(min-width: 720px) 30rem, 100vw' };
/* cdn-cgi resolves against the DEPLOYED site, so these URLs only resolve once the
   branch ships — the assets and the HTML deploy together. Set false to preview the
   pages locally against plain <img src>. */
const USE_CDN = true;

/* the parent group the four colourways vary from — the collage card on schema.html */
const GROUP = { id: 'PSG-2026', name: 'Persistence Silk Gown' };

const COLORS = [
	{ slug: 'indigo', name: 'Indigo Floral' },
	{ slug: 'crimson', name: 'Crimson Paisley' },
	{ slug: 'emerald', name: 'Emerald Palm' },
	{ slug: 'onyx', name: 'Onyx Deco' }
];

const file = (slug) => `silk-gown-${slug}.html`;

/* the other three colourways — cross-page navigation, so no itemprop: these are not
   properties of this page's item, and isVariantOf below already ties the family together.
   Each swatch is that colourway's REAL photo. It used to be served from the local 509px
   file with NO srcset, on the premise that "the four originals are already in cache —
   schema.html's collage loads exactly these". That premise died when the collage was
   paired with its data and inherited the renderer's CDN srcset: the swatches became four
   COLD 509px PNGs displayed at 80px. They now take a 1x/2x pair at the display size, the
   shape fixedSrcset() emits for avatars.
   The old note also claimed a CDN srcset "leaves the swatches blank off the zone". That
   does not survive _headers' own finding: an <img srcset> is DOCUMENT-initiated, obeys the
   page's <meta name="referrer" content="no-referrer"> and loads on pages.dev — only CSS
   background-image uses the STYLESHEET's policy and gets hotlink-403'd. Every other image
   on schema.html already proves it. Docs: /_headers, docs/performance.md § Images */
/* swatch srcset — a 1x/2x pair at the ONE rendered size (5rem), not the responsive
   ladder: a swatch never changes size. Same shape fixedSrcset() emits for avatars. */
const SWATCH_PX = 80;
const swatchSrcset = (slug) => [1, 2]
	.map((dpr) => `${CDN_BASE}/cdn-cgi/image/format=auto,quality=80,fit=cover,width=${SWATCH_PX * dpr},height=${SWATCH_PX * dpr}/assets/images/silkgown-${slug}.png ${dpr}x`)
	.join(', ');

const siblings = (current) => `<nav class="variant-swatches" aria-label="Other colourways">
					${COLORS.filter((c) => c.slug !== current).map((c) => `<a href="${file(c.slug)}">
						<img src="/assets/images/silkgown-${c.slug}.png" alt="" srcset="${swatchSrcset(c.slug)}" width="509" height="509" loading="lazy" decoding="async">
						<span>${esc(c.name)}</span>
					</a>`).join('\n\t\t\t\t\t')}
				</nav>`;

/* machine-only: this colourway is a variant of the parent group. isVariantOf takes a
   ProductGroup, and a ProductGroup IS a Product, so nesting one under another is legal */
const variantOf = (slug) => `<link itemprop="mainEntityOfPage" href="${file(slug)}">
					<div itemprop="isVariantOf" itemscope itemtype="https://schema.org/ProductGroup" hidden>
						<meta itemprop="name" content="${esc(GROUP.name)}">
						<meta itemprop="productGroupID" content="${esc(GROUP.id)}">
					</div>`;

/* The <article> owns the itemscope, not the card: reviews render as a BAND below the
   card and a property has to sit inside the item's subtree, so the card is descoped
   into a wrapper the way the rental page does it. `view` names the two morph targets
   the page it is linked from also names — the wrapper carries the card-level one. */
const productCard = (ucf, { preset, view }) => {
	const raw = renderCard(withPreset(pageOnly(ucf), preset), presets, undefined, USE_CDN ? { images: IMAGES } : {});
	/* the wrapper has to repeat the type the renderer resolved — a gown is a ProductGroup
	   (details.subtype), the headphones a plain Product, and only the render knows which */
	const itemtype = raw.match(/itemtype="(https:\/\/schema\.org\/\w+)"/)?.[1] || 'https://schema.org/Product';
	const html = descope(raw)
		.replace('<ui-card', '<ui-card class="product-view"')
		/* first slide only: the LCP element and the morph target — always eager */
		.replace('<img', `<img id="hero" data-view="hero-${view}"`)
		.replace(' loading="lazy"', ' loading="eager" fetchpriority="high"')
		.replace('sizes="auto, ', 'sizes="'); /* `auto` is spec-invalid on eager images */
	return { html, itemtype };
};

const shell = ({ title, description, styles = '', card, itemtype, view, reviews = '' }) => `<!DOCTYPE html>
<html lang="en-US" dir="ltr">
<head>
	<title>${esc(title)}</title>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
	<meta name="text-scale" content="scale">
	<meta name="description" content="${esc(description)}">
	${HEAD_COMMON}
	<!-- Block first paint (and the view-transition snapshot) until the hero is parsed,
	     so the card/hero morph targets exist when the browser captures the incoming
	     page. Without this the snapshot races HTML parsing and the morph degrades to a
	     plain cross-fade on repeat/bfcache navigations. -->
	<link rel="expect" href="#hero" blocking="render">
	${VT_HEAD}
	<style>
		/* cross-document view transitions (@view-transition, the [data-view] attr()
		   naming rule and group timing) come from ui-card.css — nothing page-scoped
		   here, deliberately: see the header comment in products/build.js */
		body { margin-inline: auto; max-inline-size: 64rem; }
		.product-page { margin-block-end: var(--spacing-2xl); }
		.reviews-heading { margin-block: var(--spacing-xl) var(--spacing-md); }
		/* one column; the rule is the separator, so the column itself needs no gap */
		.reviews > hr {
			border: 0;
			border-block-start: var(--border-width, 1px) solid var(--color-border, currentColor);
			margin-block: var(--spacing-md);
			opacity: 0.4;
		}
		/* the heading and the rules sit at the column edge — the reviews must too */
		.reviews > ui-content { --ui-content-pi: 0; }${phoneShell('.product-view')}${styles}
	</style>
	${CONTRAST_STYLE}
</head>
<body>
	${breadcrumb([
		{ name: 'Card', url: '/ui/card/' },
		{ name: 'Schema.org', url: '/ui/card/demo/schema.html' },
		{ name: title }
	])}
	<main>
		<article class="product-page" data-view="card-${view}" itemscope itemtype="${itemtype}">
			${card}${reviews}
		</article>
	</main>
	<!-- Native scroll-control pseudos do NOT follow a popover frame into the top layer
	     (Chromium), so the open lightbox gets real DOM controls from this module. Non
	     render-blocking: it must not delay the transition snapshot. Docs: docs/media.md -->
	<script type="module" src="/ui/card/lightbox.min.js"></script>
	<!-- <ui-save>'s toggle: flips aria-pressed, which is what ui-save.css fills the
	     glyph on. Only the solo product carries a save button today; the module is a
	     no-op on a page with none. Docs: /ui/save/readme.md § Toggling -->
	<script type="module" src="/ui/save/save.min.js"></script>
</body>
</html>
`;

/* one colourway of the gown — the four pages schema.html's ProductGroup collage links to */
const SWATCH_STYLES = `
		/* the colourway switcher — cross-page navigation, not a content part.
		   Caption UNDER the swatch: the row reads as a set of choices, and each
		   label sits with the photo it names instead of between two of them. */
		.variant-swatches {
			display: flex;
			flex-wrap: wrap;
			gap: var(--spacing-md);
			& a {
				align-items: center;
				color: inherit;
				display: flex;
				flex-direction: column;
				font-size: var(--ui-content-fs-sm, 0.875rem);
				gap: var(--spacing-2xs, 0.25rem);
				inline-size: 5rem;
				text-align: center;
				text-decoration: none;
			}
			& img {
				aspect-ratio: 1;
				border-radius: var(--radius-md, 0.5rem);
				inline-size: 100%;
				object-fit: cover;
			}
			& a:hover span { text-decoration: underline; }
		}`;

/* the page's own render must not link to itself, and it renders the reviews as a band
   BELOW the card rather than inside the text column — same split the rental page uses:
   DETAILS.product never emits `review`, so a teaser stays a teaser. */
const pageOnly = (ucf) => ({ ...ucf, fields: { ...ucf.fields, cover: undefined } });

/* one <Review> per <ui-content>, stacked in ONE column with a rule between them —
   a review is a paragraph of prose, and two narrow columns make the eye jump. `review`
   is in domain of Product, and ProductGroup IS a Product, so the same band serves the
   gowns. Docs: docs/schema.md § Reviews */
const reviewsBand = (ucf) => {
	const items = reviewItems(ucf.fields.details?.reviews);
	if (!items.length) return '';
	/* <hr> BETWEEN, never after the last — a trailing rule reads as "more below" */
	return `\n\t\t\t<h2 class="reviews-heading">Reviews</h2>
			<div class="reviews">${items.map((review, index) => `${index ? '\n\t\t\t\t<hr>' : ''}\n\t\t\t\t<ui-content>${review}</ui-content>`).join('')}
			</div>`;
};

const title = (ucf) => String(ucf.fields.headline).replace(/<[^>]+>/g, '');

const colourwayPage = (ucf, color) => {
	const view = `variant-${color.slug}`;
	const { html, itemtype } = productCard(ucf, { preset: 'product-page', view });
	return shell({
		title: title(ucf),
		description: ucf.fields.summary || title(ucf),
		styles: SWATCH_STYLES,
		itemtype, view,
		card: html
			/* machine metadata leads the text column; the colourway switcher closes it */
			.replace(/(<ui-content[^>]*>)/, `$1\n\t\t\t\t\t${variantOf(color.slug)}\n\t\t\t\t\t`)
			.replace('</ui-content>', `${siblings(color.slug)}\n\t\t\t\t</ui-content>`),
		reviews: reviewsBand(ucf)
	});
};

/* the single-photo product — schema.html's plain Product card links here through its
   headline cover link, and morphs on the same card-/hero- name pair the gowns use */
const SOLO = { data: 'product.json', file: 'aurasound-pro.html', view: 'product-1' };

const soloPage = (ucf) => {
	const { html, itemtype } = productCard(ucf, { preset: 'product-page-solo', view: SOLO.view });
	return shell({
		title: title(ucf),
		description: ucf.fields.summary || title(ucf),
		itemtype, view: SOLO.view,
		card: html,
		reviews: reviewsBand(ucf)
	});
};

mkdirSync(here, { recursive: true });
for (const color of COLORS) {
	const ucf = data(`product-${color.slug}.json`);
	writeFileSync(join(here, file(color.slug)), colourwayPage(ucf, color));
	console.log(`products/${file(color.slug)} ← data/product-${color.slug}.json (${ucf.id})`);
}
const solo = data(SOLO.data);
writeFileSync(join(here, SOLO.file), soloPage(solo));
console.log(`products/${SOLO.file} ← data/${SOLO.data} (${solo.id})`);
