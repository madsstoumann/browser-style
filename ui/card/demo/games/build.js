/**
 * SSR build for the video-game detail page.
 *
 *   node ui/card/demo/games/build.js
 *
 * Sibling of realestate/build.js and rentals/build.js, and banded the same way: ONE
 * <article> carries the VideoGame scope and every band below states a property of it,
 * because microdata scopes are DOM subtrees.
 *
 * Two data files, deep-merged: data/software.json is shared with the teaser on
 * demo/schema.html and stays SHORT; pixel-raiders.json holds what only the page has
 * (the screenshot set, the trailer, the store matrix, the quest/character/item rows).
 *
 * WHY THIS PAGE EXISTS: `VideoGame` was in the `software` subtype allowlist and nothing
 * used it, so gamePlatform / playMode / numberOfPlayers / quest / characterAttribute /
 * gameItem / trailer / screenshot had never been emitted. Docs: docs/schema.md § Video game
 *
 * THE THREE AXES the editions band keeps apart — platform is `gamePlatform` on the game,
 * edition is the Offer's `name`, and a storefront is a `seller` → Organization. Steam is
 * not a platform. videogameSections() carries the reasoning in full.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderCard, videogameSections } from '../../render.js';
import { CDN_BASE, CONTRAST_STYLE, HEAD_COMMON, VT_HEAD, breadcrumb, descope, esc, withPreset } from '../build.shared.js';

const here = dirname(fileURLToPath(import.meta.url));
const data = (file) => JSON.parse(readFileSync(join(here, '../../data', file), 'utf8'));
const local = (file) => JSON.parse(readFileSync(join(here, file), 'utf8'));

const presets = { ...data('card.presets.json').presets, ...data('card.presets.demo.json').presets };

/* the gallery is full width inside the 64rem shell */
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

const ucf = merge(data('software.json'), local('pixel-raiders.json'));
const VIEW = 'software-1';
const TITLE = ucf.fields.headline;
const { fields } = ucf;

/* Band 1 renders the game's own facts. `flipside` and `body` are dropped: the flipside is
   the teaser's reveal shape, and the long copy is its own band below. */
const heroUcf = { ...ucf, fields: { ...fields, flipside: undefined, body: undefined, cover: undefined } };

const heroCard = renderCard(withPreset(heroUcf, 'game-page'), presets, undefined, USE_CDN ? { images: IMAGES } : {})
	/* first slide only: the LCP element and the morph target — always eager */
	.replace('<img', `<img id="hero" data-view="hero-${VIEW}"`)
	.replace(' loading="lazy"', ' loading="eager" fetchpriority="high"')
	.replace('sizes="auto, ', 'sizes="'); /* `auto` is spec-invalid on eager images */

const s = videogameSections(fields.details, fields);

/* the long copy. The teaser summary already carries itemprop="description", so this stays
   unmarked and the property is stated once. */
const bodyCard = descope(renderCard(
	withPreset({ ...ucf, fields: { schemaType: 'content', body: fields.body } }, 'prose'),
	presets, undefined, {}
));

const band = (attrs, inner) => `\n\t\t\t<lay-out ${attrs}>${inner}\n\t\t\t</lay-out>`;
const column = (heading, inner, attrs = '') => `\n\t\t\t\t<ui-content${attrs}><h3 data-part="headline">${esc(heading)}</h3>${inner}</ui-content>`;

const trailerBand = !s.trailer ? '' : band('lg="ratio(60:40) items(start)"',
	/* videogameSections() already emits the <ui-media> frame — wrapping it in a second one
	   nests two frames and the <ui-play> loses its cc cell. The id rides the VideoObject. */
	`\n\t\t\t\t<div id="trailer">${s.trailer}</div>`
	+ column('Season 3: Sky Fortress', bodyCard.replace(/^<ui-content[^>]*>|<\/ui-content>$/g, '')));

/* the store matrix. theme="black dark" is the arcade plate — the shared nine-hue axis,
   not an ad-hoc colour; `light`/`dark` pin the scheme so the inks stay AA either way. */
const editionsBand = !s.editions ? '' : band('md="columns(1)"',
	`\n\t\t\t\t<ui-card variant="vis(content)" theme="black dark" id="editions" content="scl(lg) pad(lg) md:pad(2xl)"><cq-box><ui-content><h3 data-part="headline">Editions &amp; where to buy</h3><p data-part="summary">One game, two editions, five storefronts. The platform is a property of the game; the shop is the seller on each offer.</p>${s.editions}</ui-content></cq-box></ui-card>`);

const worldBand = band('md="columns(2) items(start)" lg="columns(3) items(start)"',
	column('Quests', s.quests) + column('Classes', s.characters) + column('Gear', s.items));

/* The key art is the ONE image this game has: the other game_0*.png assets are two other
   games entirely, and `screenshot` claiming them would be a false statement about this
   item — the whole reason the page exists. One truthful ImageObject beats three invented. */
const specBand = !s.requirements ? '' : band('lg="ratio(40:60) items(start)"',
	column('System requirements', s.requirements)
	+ column('Cross-play', `<p data-part="summary">One account, one save. Progress follows you between every storefront below — the platforms are properties of the game, not five separate products.</p>${s.screenshots}`));

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
		/* cross-document view transitions come from ui-card.css — nothing page-scoped
		   here, deliberately: see the header comment in products/build.js */
		body { margin-inline: auto; max-inline-size: 64rem; }
		.game-view { margin-block-end: var(--spacing-2xl); }
		.game-view > lay-out { margin-block-start: var(--spacing-xl); }
		/* The store matrix. Mobile-first: an offer is a three-line BLOCK (edition · platform /
		   seller / price + Buy), because five columns in 380px minus the plate padding gives
		   each one ~50px. From 540px the block becomes one row. The children are positioned
		   by source order — strong, platform, seller, price, Buy — which is fixed by
		   videogameSections(); a hairline separates offers in the stacked form, where row
		   grouping is otherwise the only thing telling two offers apart. */
		#editions [data-part="list"] { display: grid; list-style: none; margin: 0; padding: 0; }
		#editions [data-part="list"] li {
			align-items: baseline;
			border-block-start: 1px solid color-mix(in oklab, currentColor 15%, transparent);
			column-gap: var(--spacing-sm);
			display: grid;
			grid-template-columns: 1fr auto;
			padding-block: var(--spacing-sm);
			row-gap: var(--spacing-3xs, 0.125rem);
		}
		#editions [data-part="list"] li:first-child { border-block-start: 0; }
		#editions [data-part="list"] li > :nth-child(4) { grid-column: 1; }          /* edition */
		#editions [data-part="list"] li > :nth-child(5) { grid-column: 2; text-align: end; } /* platform */
		#editions [data-part="list"] li > :nth-child(6) { grid-column: 1 / -1; }     /* seller */
		#editions [data-part="price"] { font-size: 1.125em; font-variant-numeric: tabular-nums; font-weight: 700; }
		#editions [data-part="list"] li > a { justify-self: end; }
		@media (min-width: 540px) {
			#editions [data-part="list"] li {
				align-items: center;
				grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1.2fr) auto auto;
			}
			#editions [data-part="list"] li > :nth-child(4) { grid-column: 1; }
			#editions [data-part="list"] li > :nth-child(5) { grid-column: 2; text-align: start; }
			#editions [data-part="list"] li > :nth-child(6) { grid-column: 3; }
		}
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
		<article class="game-view" data-view="card-${VIEW}" itemscope itemtype="https://schema.org/VideoGame">
			<link itemprop="mainEntityOfPage" href="pixel-raiders.html">
			${descope(heroCard)}${trailerBand}${editionsBand}${worldBand}${specBand}
		</article>
	</main>
	<!-- video.js polyfills the media invoker commands behind <ui-play>; lightbox.js gives
	     the popover gallery real DOM controls (native scroll-control pseudos do not follow
	     a popover into the top layer in Chromium). Neither is render-blocking: they must
	     not delay the transition snapshot. Docs: docs/media.md, docs/video.md -->
	<script type="module" src="/ui/card/video.min.js"></script>
	<script type="module" src="/ui/card/lightbox.min.js"></script>
</body>
</html>
`;

mkdirSync(here, { recursive: true });
const out = join(here, 'pixel-raiders.html');
writeFileSync(out, page);
console.log(`games/pixel-raiders.html ← data/software.json + pixel-raiders.json (${ucf.id})`);
