/**
 * SSR build for the vacation-rental detail page.
 *
 *   node ui/card/demo/rentals/build.js
 *
 * Sibling of realestate/build.js and built the same way: one <article> carries the
 * VacationRental scope and the bands below it are separate descoped renders, arranged
 * with <lay-out>. The one structural difference: there is no mainEntity section. A
 * VacationRental IS the thing being described, so brand, coordinates, rating, reviews
 * and hasMap all ride the root — only the rooms nest, inside containsPlace, because
 * bed/occupancy/floorSize are Accommodation properties. Docs: docs/schema.md § Vacation rental
 *
 * Two data files, deep-merged: data/vacationrental.json is shared with the teaser on
 * demo/schema.html and stays SHORT; masseria-lucia.json holds what only the page has
 * (the long description, amenities, reviews, coordinates, the gallery invoker, its own CTA).
 *
 * The gallery carries no `open:` token — a bare `nav` frame promoted into the top layer
 * already opens as a fullscreen, one-image-at-a-time carousel. Chromium does not carry
 * scroll-control pseudos into the top layer, so lightbox.js builds those controls as DOM.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderCard, vacationrentalSections } from '../../render.js';
import { CDN_BASE, CONTRAST_STYLE, HEAD_COMMON, VT_HEAD, breadcrumb, descope, esc, withPreset } from '../build.shared.js';

const here = dirname(fileURLToPath(import.meta.url));
const data = (file) => JSON.parse(readFileSync(join(here, '../../data', file), 'utf8'));
const local = (file) => JSON.parse(readFileSync(join(here, file), 'utf8'));

const presets = { ...data('card.presets.json').presets, ...data('card.presets.demo.json').presets };

/* the gallery is full width inside the 64rem shell — the card is `col` at every width */
const IMAGES = { cdnBase: CDN_BASE, sizes: 'min(64rem, 100vw)' };
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

const ucf = merge(data('vacationrental.json'), local('masseria-lucia.json'));
const VIEW = 'vacationrental-1';
const TITLE = ucf.fields.headline;
const { fields } = ucf;

/* Band 1 is the gallery + the business-level header. Handing the card a details object
   with no `property` keeps it there: DETAILS.vacationrental then emits the machine block,
   the rating, the rate, the address, the stay times and the host line — and no
   containsPlace block, which the bands below own. `cover` goes too: a detail page
   must not link to itself.

   The address and the stay times are pulled out as well — the location band below owns
   them. Leaving them here would state address/checkinTime/checkoutTime twice on the same
   item, which is exactly what "one property, one value" forbids. */
const headerOnly = { ...ucf, fields: { ...fields, body: undefined, cover: undefined, details: {
	...fields.details, property: undefined, reviews: undefined,
	address: undefined, checkin: undefined, checkout: undefined
} } };

const galleryCard = renderCard(withPreset(headerOnly, 'realestate-page'), presets, undefined, USE_CDN ? { images: IMAGES } : {})
	/* first slide only: the LCP element and the morph target — always eager */
	.replace('<img', `<img id="hero" data-view="hero-${VIEW}"`)
	.replace(' loading="lazy"', ' loading="eager" fetchpriority="high"')
	.replace('sizes="auto, ', 'sizes="'); /* `auto` is spec-invalid on eager images */

/* Bands 2-5 */
const s = vacationrentalSections(fields.details, fields);

/* the long description. The teaser summary already carries itemprop="description", so
   this copy stays unmarked and the property is stated once. */
const bodyCard = descope(renderCard(
	withPreset({ ...ucf, fields: { schemaType: 'content', body: fields.body } }, 'prose'),
	presets, undefined, {}
)).replace(/^(<ui-content[^>]*>)/, '$1<h2 data-part="headline">About the house</h2>');

const band = (attrs, inner) => `\n\t\t\t<lay-out ${attrs}>${inner}\n\t\t\t</lay-out>`;

/* the rooms are the only part of the page that nests: containsPlace → Accommodation */
const roomsBand = band('sm="columns(2) items(start)" md="columns(3) items(start)"',
	s.figures.map((figure) => `\n\t\t\t\t<ui-content>${figure}</ui-content>`).join(''));

const storyBand = band('lg="ratio(60:40) items(start)"',
	`\n\t\t\t\t${bodyCard}
				<ui-content><h2 data-part="headline">Beds</h2>${s.beds}<h2 data-part="headline">What's here</h2>${s.amenities}</ui-content>`);

const placeBand = band('lg="ratio(40:60) items(start)"',
	`\n\t\t\t\t<ui-content><h2 data-part="headline">Where it is</h2>${s.address}${s.stay}${s.place.action}</ui-content>
				<ui-media media="asr(4/3) rds(lg)">${s.place.frame}</ui-media>`);

/* reviews ride the ROOT, not the accommodation: `review` comes from Organization */
const reviewsBand = band('md="columns(2) items(start)"',
	s.reviews.map((review) => `\n\t\t\t\t<ui-content>${review}</ui-content>`).join(''));

const page = `<!DOCTYPE html>
<html lang="en-US" dir="ltr">
<head>
	<title>${esc(TITLE)}</title>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
	<meta name="description" content="${esc(ucf.fields.summary)}">
	${HEAD_COMMON}
	<!-- Block first paint (and the view-transition snapshot) until the hero is parsed, so
	     the card/hero morph targets exist when the browser captures the incoming page. -->
	<link rel="expect" href="#hero" blocking="render">
	${VT_HEAD}
	<style>
		/* cross-document view transitions come from ui-card.css — nothing page-scoped
		   here, deliberately: see the header comment in products/build.js */
		body { margin-inline: auto; max-inline-size: 64rem; }
		.rental-view { margin-block-end: var(--spacing-2xl); }
		.rental-view > lay-out { margin-block-start: var(--spacing-xl); }
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
		<article class="rental-view" data-view="card-${VIEW}" itemscope itemtype="https://schema.org/VacationRental">
			<link itemprop="url" href="masseria-lucia.html">
			${descope(galleryCard)}
			<!-- ONE scope: every band below is a property of the same rental. Only the rooms
			     nest, inside containsPlace, and each property is stated exactly once. -->
			<section${s.unit.attrs}>${s.unit.metas}${roomsBand}${storyBand}
			</section>${placeBand}
			<h2>Guest reviews</h2>${reviewsBand}
		</article>
	</main>
	<!-- Native scroll-control pseudos do NOT follow a popover frame into the top layer
	     (Chromium), so the open lightbox gets real DOM controls from this module. Non
	     render-blocking: it must not delay the transition snapshot. Docs: docs/media.md -->
	<script type="module" src="/ui/card/lightbox.min.js"></script>
</body>
</html>
`;

mkdirSync(here, { recursive: true });
writeFileSync(join(here, 'masseria-lucia.html'), page);
console.log(`rentals/masseria-lucia.html ← data/vacationrental.json + masseria-lucia.json (${ucf.id})`);
