/**
 * SSR build for the real-estate listing detail page.
 *
 *   node ui/card/demo/realestate/build.js
 *
 * Sibling of articles/build.js and products/build.js, and built the same way: the page
 * is a full static render of ONE UCF through render.js, so the cross-document view
 * transition's morph targets (card-realestate-1 on the root, hero-realestate-1 on the
 * first slide) exist in the HTML at capture time.
 *
 * The teaser on demo/schema.html links here. The gallery is the `realestate-page`
 * preset's `open:grid(3c)`: the frame is an ordinary carousel closed, and a full-bleed
 * three-column contact sheet once the lightbox opens — the "view all photos" pattern a
 * property listing wants. That is media tokens only; render.js's collagePart() is for
 * ProductGroup VARIANT tiles and cannot express a photo grid.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderCard } from '../../render.js';
import { CDN_BASE, CONTRAST_STYLE, HEAD_COMMON, VT_HEAD, breadcrumb, esc, withPreset } from '../build.shared.js';

const here = dirname(fileURLToPath(import.meta.url));
const data = (file) => JSON.parse(readFileSync(join(here, '../../data', file), 'utf8'));

const presets = { ...data('card.presets.json').presets, ...data('card.presets.demo.json').presets };

/* the media half of a lg:row card is ~half of the 64rem shell */
const IMAGES = { cdnBase: CDN_BASE, sizes: '(min-width: 720px) 30rem, 100vw' };
/* cdn-cgi resolves against the DEPLOYED site, so these URLs only resolve once the
   branch ships — the assets and the HTML deploy together. Set false to preview locally. */
const USE_CDN = true;

const ucf = data('realestate.json');
const VIEW = 'realestate-1';
const TITLE = ucf.fields.headline;

/* The lightbox is added HERE, not in realestate.json, because that file is shared with
   the teaser on demo/schema.html and the teaser must not grow a gallery button. The
   `lightbox(bs)` token in the preset only POSITIONS the invoker — buildLightbox() is
   what creates it, and it keys off furniture.lightbox. Same split as the product pages,
   which get theirs from a per-page data file. */
const withLightbox = (doc) => ({
	...doc,
	fields: { ...doc.fields, furniture: { ...doc.fields.furniture, lightbox: { label: 'View all 6 photos' } } }
});

/* the card IS the page root — the preset's lg:row arrangement is the layout, so unlike
   the article pages there is nothing to descope into an <article>. `view` names the two
   morph targets that demo/schema.html's teaser also names. */
const listingCard = renderCard(withLightbox(withPreset(ucf, 'realestate-page')), presets, undefined, USE_CDN ? { images: IMAGES } : {})
	.replace('<ui-card', `<ui-card class="listing-view" data-view="card-${VIEW}"`)
	/* first slide only: the LCP element and the morph target — always eager */
	.replace('<img', `<img id="hero" data-view="hero-${VIEW}"`)
	.replace(' loading="lazy"', ' loading="eager" fetchpriority="high"')
	.replace('sizes="auto, ', 'sizes="'); /* `auto` is spec-invalid on eager images */

const page = `<!DOCTYPE html>
<html lang="en-US" dir="ltr">
<head>
	<title>${esc(TITLE)}</title>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
	<meta name="description" content="${esc(ucf.fields.summary)}">
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
		.listing-view { margin-block-end: var(--spacing-2xl); }
	</style>
	${CONTRAST_STYLE}
</head>
<body>
	${breadcrumb([
		{ name: 'Card', url: '/ui/card/' },
		{ name: 'Schema.org', url: '/ui/card/demo/schema.html' },
		{ name: TITLE }
	])}
	<main>
		${listingCard}
	</main>
	<!-- Native scroll-control pseudos do NOT follow a popover frame into the top layer
	     (Chromium), so the open lightbox gets real DOM controls from this module. Non
	     render-blocking: it must not delay the transition snapshot. Docs: docs/media.md -->
	<script type="module" src="/ui/card/lightbox.min.js"></script>
</body>
</html>
`;

mkdirSync(here, { recursive: true });
const out = join(here, 'havnegade-44.html');
writeFileSync(out, page);
console.log(`realestate/havnegade-44.html ← data/realestate.json (${ucf.id})`);
