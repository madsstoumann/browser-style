/**
 * SSR build for the real-estate listing detail page.
 *
 *   node ui/card/demo/realestate/build.js
 *
 * Sibling of articles/build.js and products/build.js. Unlike those, the page is not a
 * single card: it is BANDED. One <article> carries the RealEstateListing scope, band 1
 * is the gallery card, and the residence bands sit inside ONE
 * <section itemprop="mainEntity"> — microdata scopes are DOM subtrees, so every
 * property of the home has to live under one element. Docs: docs/schema.md § Real estate
 *
 * Two data files, deep-merged: data/realestate.json is shared with the teaser on
 * demo/schema.html and stays SHORT; havnegade-44.json holds what only the page has
 * (sales copy, amenities, coordinates, the gallery invoker, its own CTA). Same split
 * as the product pages.
 *
 * The gallery opens FULLSCREEN as the same one-image-at-a-time carousel, arrows and dots
 * included — that is a bare `nav` frame's default open presentation, so it needs no
 * `open:` token at all. Chromium does not carry scroll-control pseudos into the top
 * layer, so the open state's controls are real DOM built by lightbox.js.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderCard, realestateSections } from '../../render.js';
import { CDN_BASE, CONTRAST_STYLE, HEAD_COMMON, VT_HEAD, breadcrumb, descope, esc, scrollSpy, spyAttrs, withPreset } from '../build.shared.js';

const here = dirname(fileURLToPath(import.meta.url));
const data = (file) => JSON.parse(readFileSync(join(here, '../../data', file), 'utf8'));
const local = (file) => JSON.parse(readFileSync(join(here, file), 'utf8'));

const presets = { ...data('card.presets.json').presets, ...data('card.presets.demo.json').presets };

/* the gallery fills the article column: the whole shell below 720px, three quarters of the
   80rem shell beside the scroll-spy rail from lg up (the card is `col` at every width) */
const IMAGES = { cdnBase: CDN_BASE, sizes: '(min-width: 720px) min(60rem, 75vw), 100vw' };
/* cdn-cgi resolves against the DEPLOYED site, so these URLs only resolve once the
   branch ships — the assets and the HTML deploy together. Set false to preview locally. */
const USE_CDN = true;

/* plain objects merge, arrays and scalars are replaced outright */
const merge = (base, over) => {
	const out = { ...base };
	for (const [key, value] of Object.entries(over)) {
		const isPlain = (v) => v && typeof v === 'object' && !Array.isArray(v);
		out[key] = isPlain(value) && isPlain(base[key]) ? merge(base[key], value) : value;
	}
	return out;
};

const ucf = merge(data('realestate.json'), local('havnegade-44.json'));
const VIEW = 'realestate-1';
const TITLE = ucf.fields.headline;
const { fields } = ucf;

/* "On this page" — reading order; index+1 is the data-spy="n" on both the band and its link.
   Amenities shares the About band on lg (same top edge), so it is not its own entry. */
const SPY = [
	{ id: 'gallery', label: 'Photos' },
	{ id: 'figures', label: 'Key figures' },
	{ id: 'about', label: 'About the home' },
	{ id: 'location', label: 'Where it is' }
];

/* Band 1 renders the LISTING level only. Handing the card a details object with no
   `property` is what keeps it there: DETAILS.realestate then emits datePosted, the
   price and the agent line, and no mainEntity block — which the bands below own. */
const listingOnly = { ...ucf, fields: { ...fields, body: undefined, cover: undefined, details: { ...fields.details, property: undefined } } };

const galleryCard = renderCard(withPreset(listingOnly, 'realestate-page'), presets, undefined, USE_CDN ? { images: IMAGES } : {})
	/* first slide only: the LCP element and the morph target — always eager */
	.replace('<ui-card ', `<ui-card ${spyAttrs(SPY, 'gallery')} `)
	.replace('<img', `<img id="hero" data-view="hero-${VIEW}"`)
	.replace(' loading="lazy"', ' loading="eager" fetchpriority="high"')
	.replace('sizes="auto, ', 'sizes="'); /* `auto` is spec-invalid on eager images */

/* Bands 2-4: the residence. One scope, three bands. */
const s = realestateSections(fields.details, fields);

/* the long sales copy, shown in full. The teaser summary already carries
   itemprop="description", so this copy stays unmarked and the property is stated once. */
const bodyCard = descope(renderCard(
	withPreset({ ...ucf, fields: { schemaType: 'content', body: fields.body } }, 'prose'),
	presets, undefined, {}
)).replace(/^(<ui-content[^>]*>)/, '$1<h2 data-part="headline">About the home</h2>');

const band = (attrs, inner) => `\n\t\t\t<lay-out ${attrs}>${inner}\n\t\t\t</lay-out>`;

const figuresBand = band(`${spyAttrs(SPY, 'figures')} sm="columns(2) items(start)" md="columns(3) items(start)"`,
	s.figures.map((figure) => `\n\t\t\t\t<ui-content>${figure}</ui-content>`).join(''));

const storyBand = band(`${spyAttrs(SPY, 'about')} lg="ratio(60:40) items(start)"`,
	`\n\t\t\t\t${bodyCard}
				<ui-content><h2 data-part="headline">Amenities</h2>${s.amenities}</ui-content>`);

/* the map rides the Apartment, not the listing: hasMap and geo are Place properties and
   RealEstateListing is a WebPage. Docs: docs/schema.md § Real estate */
const placeBand = band(`${spyAttrs(SPY, 'location')} lg="ratio(40:60) items(start)"`,
	`\n\t\t\t\t<ui-content><h2 data-part="headline">Where it is</h2>${s.place.geo}${s.address}${s.place.action}</ui-content>
				<ui-media media="asr(4/3) rds(lg)">${s.place.frame}</ui-media>`);

const page = `<!DOCTYPE html>
<html lang="en-US" dir="ltr">
<head>
	<title>${esc(TITLE)}</title>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
	<meta name="text-scale" content="scale">
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
		.listing-view > lay-out { margin-block-start: var(--spacing-xl); }
		/* the scroll-spy rail: a ratio(75:25) shell from lg (720px, the only breakpoint that
		   generates ratio()) — the shell widens so the article keeps ~60rem beside a 20rem rail;
		   below lg the nav is hidden, as the reference pen does. Docs: ui/scroll-spy/readme.md */
		@media (width >= 720px) { body { max-inline-size: 80rem; } }
		@media (width < 720px) { [data-scroll-spy] { display: none; } }
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
		<!-- items(start) is load-bearing: a stretched grid item never sticks, a start-aligned
		     one keeps the full grid area as its containing block and travels. -->
		<lay-out lg="ratio(75:25) items(start)">
			<article class="listing-view" data-view="card-${VIEW}" itemscope itemtype="https://schema.org/RealEstateListing">
				<link itemprop="mainEntityOfPage" href="havnegade-44.html">
				${descope(galleryCard)}
				<!-- ONE mainEntity scope wrapping every band that carries a residence property:
				     microdata scopes are DOM subtrees, and each property is stated exactly once. -->
				<section${s.residence.attrs}>${s.residence.metas}${figuresBand}${storyBand}${placeBand}
				</section>
			</article>
			${scrollSpy(SPY)}
		</lay-out>
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
console.log(`realestate/havnegade-44.html ← data/realestate.json + havnegade-44.json (${ucf.id})`);
