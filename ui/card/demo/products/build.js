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
import { renderCard } from '../../render.js';
import { CDN_BASE, CONTRAST_STYLE, HEAD_COMMON, VT_HEAD, esc, withPreset } from '../build.shared.js';

const here = dirname(fileURLToPath(import.meta.url));
const data = (file) => JSON.parse(readFileSync(join(here, '../../data', file), 'utf8'));

const presets = { ...data('card.presets.json').presets, ...data('card.presets.demo.json').presets };

/* the media half of a lg:row card is ~half of the 64rem shell */
const IMAGES = { cdnBase: CDN_BASE, sizes: '(min-width: 720px) 30rem, 100vw' };
/* The colourway crops are new assets that do not exist on the zone yet, and cdn-cgi
   resolves against the DEPLOYED site — so a CDN srcset here 404s in local preview.
   Plain local <img src> until they ship; flip to true in the merge commit. */
const USE_CDN = false;

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
   Each swatch is that colourway's REAL photo, served from the local file with NO cdn
   srcset: a failed candidate never falls back to src, so a CDN srcset leaves the swatches
   blank off the zone. The four 509px originals are already in cache — schema.html's
   collage, the page you arrive from, loads exactly these. */
const siblings = (current) => `<nav class="variant-swatches" aria-label="Other colourways">
					${COLORS.filter((c) => c.slug !== current).map((c) => `<a href="${file(c.slug)}">
						<img src="/assets/images/silkgown-${c.slug}.png" alt="" width="509" height="509" loading="lazy" decoding="async">
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

const page = (ucf, color) => {
	const title = String(ucf.fields.headline).replace(/<[^>]+>/g, '');
	/* the card IS the page root — the product-page preset's lg:row arrangement is the
	   layout, so unlike the article pages there is nothing to descope into an <article> */
	const card = renderCard(withPreset(ucf, 'product-page'), presets, undefined, USE_CDN ? { images: IMAGES } : {})
		.replace('<ui-card', `<ui-card class="product-view" data-view="card-variant-${color.slug}"`)
		/* first slide only: the LCP element and the morph target — always eager */
		.replace('<img', `<img id="hero" data-view="hero-variant-${color.slug}"`)
		.replace(' loading="lazy"', ' loading="eager" fetchpriority="high"')
		.replace('sizes="auto, ', 'sizes="') /* `auto` is spec-invalid on eager images */
		/* machine metadata leads the text column; the colourway switcher closes it */
		.replace(/(<ui-content[^>]*>)/, `$1\n\t\t\t\t\t${variantOf(color.slug)}\n\t\t\t\t\t`)
		.replace('</ui-content>', `${siblings(color.slug)}\n\t\t\t\t</ui-content>`);

	return `<!DOCTYPE html>
<html lang="en-US" dir="ltr">
<head>
	<title>${esc(title)}</title>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
	<meta name="description" content="${esc(ucf.fields.summary || title)}">
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
		.product-view { margin-block-end: var(--spacing-2xl); }
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
		}
	</style>
	${CONTRAST_STYLE}
</head>
<body>
	<main>
		${card}
	</main>
	<!-- Native scroll-control pseudos do NOT follow a popover frame into the top layer
	     (Chromium), so the open lightbox gets real DOM controls from this module. Non
	     render-blocking: it must not delay the transition snapshot. Docs: docs/media.md -->
	<script type="module" src="/ui/card/lightbox.min.js"></script>
</body>
</html>
`;
};

mkdirSync(here, { recursive: true });
for (const color of COLORS) {
	const ucf = data(`product-${color.slug}.json`);
	writeFileSync(join(here, file(color.slug)), page(ucf, color));
	console.log(`products/${file(color.slug)} ← data/product-${color.slug}.json (${ucf.id})`);
}
