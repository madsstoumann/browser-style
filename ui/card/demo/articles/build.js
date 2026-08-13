/**
 * SSR build for the per-article pages.
 *
 *   node ui/card/demo/articles/build.js
 *
 * Renders each article UCF through render.js (the same engine the browser
 * demos use — it returns plain HTML strings, no DOM required) and writes a
 * fully static page per article. Static markup is what makes the
 * cross-document view transition morph reliably: the incoming page's
 * view-transition-names (card-{id} on the container, hero-{id} on the image)
 * exist in the HTML at capture time — no client-fetch race, no crossfade
 * fallback.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderCard, resolveItemtype } from '../../render.js';
import { generateSrcsets, calculateSizes } from '../../../../layout/src/srcsets.js';
import { srcsetMap, srcsetConfig } from '../../../../layout/layouts-map.js';

const here = dirname(fileURLToPath(import.meta.url));
const data = (file) => JSON.parse(readFileSync(join(here, '../../data', file), 'utf8'));

const presets = data('card.presets.json').presets;

/* Cloudflare srcset pipeline (docs/media.md § Responsive images) — absolute base:
   /cdn-cgi/image/ only resolves on the zone, and a failed candidate never falls
   back to src. Article pages are a single 65ch prose column; the grid page is
   the .grid-2 two-up (matches layout's columns(2) sizes list). */
const CDN_BASE = 'https://v4.browser.style';
const PROSE_IMAGES = { cdnBase: CDN_BASE, sizes: '(min-width: 720px) 42rem, 100vw' };
const GRID_IMAGES = { cdnBase: CDN_BASE, sizes: calculateSizes(generateSrcsets({ md: 'columns(2)' }, srcsetMap, srcsetConfig), 0) };

/* shared head fragment: bundle CSS + hotlink-safe referrer + srcset-origin preconnect */
const HEAD_COMMON = `<link rel="stylesheet" href="/dist/demo.min.css">
	<!-- srcset uses absolute v4.browser.style CDN URLs; the zone's Hotlink Protection
	     403s any cross-origin Referer (pages.dev, localhost) — no-referrer passes -->
	<meta name="referrer" content="no-referrer">
	<link rel="preconnect" href="https://v4.browser.style">`;

/* page-scoped WCAG AA contrast overrides — same block as demo/schema.html */
const CONTRAST_STYLE = `<style>
		:root {
			--color-link: light-dark(hsl(221, 100%, 44%), hsl(221, 70%, 70%));
			--color-accent: light-dark(hsl(211, 100%, 38%), hsl(211, 70%, 72%));
			--color-success: light-dark(hsl(136, 45%, 30%), hsl(136, 25%, 60%));
			--color-error: light-dark(hsl(360, 65%, 41%), hsl(360, 45%, 62%));
			--color-text-muted: light-dark(hsl(0, 0%, 42%), hsl(0, 0%, 65%));
		}
		ui-content { --ui-content-muted: color-mix(in oklab, currentColor 85%, transparent); }
		ui-chip[data-type] { --ui-chip-bg: hsl(0, 0%, 95%); --ui-chip-c: hsl(0, 0%, 13%); }
	</style>`;

const withPreset = (ucf, presetId) => ({
	...ucf,
	fields: { ...ucf.fields, preset: { $ref: `card-preset/${presetId}` } }
});

const esc = (value) => String(value)
	.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const page = (ucf, name) => {
	const title = String(ucf.fields.headline).replace(/<[^>]+>/g, '');
	/* through the renderer's resolver, not SCHEMA_TYPES — otherwise a details.subtype
	   card sharpens in the grid and stays generic here, from one UCF */
	const itemtype = resolveItemtype(ucf.fields);
	/* ONE microdata scope on the <article> root — the bare-primitive renders each
	   carry their own itemscope, which would split the page into partial items */
	const descope = (html) => html.replace(/ itemscope itemtype="https:\/\/schema\.org\/\w+"/, '');
	/* hero frame — tag the image with its view-transition-name via data-view
	   (first <img> only). CSS advanced attr() turns it into the name — no
	   inline style attribute, so a strict CSP (no unsafe-inline styles) holds.
	   id="hero" is the render-blocking anchor (see <link rel="expect">): by the
	   time this <img> is parsed, the wrapping <article data-view="card-…"> start
	   tag already is too, so BOTH morph-named elements exist at snapshot.
	   The hero is the page's LCP element and morph target — always eager. */
	const hero = descope(renderCard(withPreset(ucf, 'media'), presets, undefined, { images: PROSE_IMAGES }))
		.replace('<img', `<img id="hero" data-view="hero-${ucf.id}"`)
		.replace(' loading="lazy"', ' loading="eager" fetchpriority="high"')
		.replace('sizes="auto, ', 'sizes="'); /* `auto` is spec-invalid on eager images */
	/* prose-article: text both (summary becomes the standfirst) + byline lede */
	const prose = descope(renderCard(withPreset(ucf, 'prose-article'), presets, undefined, { images: PROSE_IMAGES }));

	return `<!DOCTYPE html>
<html lang="en-US" dir="ltr">
<head>
	<title>${esc(title)}</title>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
	<meta name="description" content="${esc(ucf.fields.summary || title)}">
	${HEAD_COMMON}
	<!-- Block first paint (and the view-transition snapshot) until the hero is
	     parsed, so the card/hero morph targets exist when the browser captures
	     the incoming page. Without this the snapshot races HTML parsing and the
	     morph degrades to a plain cross-fade on repeat/bfcache navigations. -->
	<link rel="expect" href="#hero" blocking="render">
	<!-- Names the morph targets where typed attr() is unsupported (Safari). MUST be
	     render-blocking in <head>: the incoming page is snapshotted at first paint,
	     so a deferred script names the targets too late and the forward morph
	     degrades to a cross-fade. Docs: ui/base/polyfills/readme.md -->
	<script type="module" src="/ui/base/polyfills/attr-fallback.js" blocking="render"></script>
	<style>
		/* cross-document view transitions (@view-transition, the [data-view]
		   attr() naming rule and group timing) come from ui-card.css */
		body { margin-inline: auto; max-inline-size: var(--width-prose, 65ch); }
		.article-view {
			background: var(--ui-card-bg, var(--color-surface, #fff));
			border-radius: var(--ui-card-radius, var(--radius-2xl));
			margin-block-end: var(--spacing-2xl);
			padding: var(--spacing-lg);
		}
		.article-view > ui-media { margin-block-end: var(--spacing-lg); }
	</style>
	${CONTRAST_STYLE}
</head>
<body>
	<main>
	<article class="article-view" data-view="card-${ucf.id}" itemscope itemtype="https://schema.org/${itemtype}">
		<link itemprop="mainEntityOfPage" href="${name}.html">
		<div itemprop="publisher" itemscope itemtype="https://schema.org/Organization" hidden>
			<meta itemprop="name" content="The Daily Ledger">
		</div>
		${hero}
		${prose}
	</article>
	</main>
</body>
</html>
`;
};

/* teaser card for the grid page: data-view names + the cover link inside the
   headline, all applied string-side — the grid page ships with zero runtime JS */
const teaser = (ucf, name) => renderCard(ucf, presets, undefined, { images: GRID_IMAGES })
	.replace('<ui-card', `<ui-card data-view="card-${ucf.id}"`)
	.replace('<img', `<img data-view="hero-${ucf.id}"`)
	.replace(/(<h[23] data-part="headline"[^>]*>)([\s\S]*?)(<\/h[23]>)/,
		`$1<a data-part="cover" href="articles/${name}.html">$2</a>$3`);

const gridPage = (cards) => `<!DOCTYPE html>
<html lang="en-US" dir="ltr">
<head>
	<title>UI: Card — Article View Transition</title>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
	<meta name="description" content="Teaser cards linking to per-article pages — a cross-document view transition morphs the whole card into the full article. Fully static: pre-rendered by articles/build.js.">
	${HEAD_COMMON}
	<!-- Block first paint (and the incoming snapshot on Back) until the card
	     grid is parsed, so every card/hero morph target exists when the browser
	     captures this page. Without it the reverse morph races HTML parsing. -->
	<link rel="expect" href="#cards" blocking="render">
	<!-- Names the morph targets where typed attr() is unsupported (Safari). MUST be
	     render-blocking in <head>: the incoming page is snapshotted at first paint,
	     so a deferred script names the targets too late and the forward morph
	     degrades to a cross-fade. Docs: ui/base/polyfills/readme.md -->
	<script type="module" src="/ui/base/polyfills/attr-fallback.js" blocking="render"></script>
	<style>
		/* cross-document view transitions (@view-transition, the [data-view]
		   attr() naming rule and group timing) come from ui-card.css */
		.grid {
			display: grid;
			gap: var(--spacing-lg);
			grid-template-columns: 1fr;
			margin-block-end: var(--spacing-2xl);
		}
		@media (min-width: 540px) {
			.grid-2 { grid-template-columns: repeat(2, 1fr); }
		}
		.note { color: var(--color-text-secondary, #666); max-inline-size: 70ch; }
		code { font-size: 0.9em; }

		/* the card-covering link is data-part="cover" — styled by content.css,
		   like every other part; no page-local classes */
	</style>
	${CONTRAST_STYLE}
</head>
<body>
	<h1>UI: Card — Article View Transition</h1>
	<p class="note">Each teaser card links to its <em>own page</em>: <a href="articles/article.html"><code>articles/article.html</code></a> and <a href="articles/news.html"><code>articles/news.html</code></a>. Both documents opt in with <code>@view-transition { navigation: auto }</code> and carry the same per-article <code>view-transition-name</code>s — set via <code>data-view</code> attributes and the CSS <code>attr()</code> rule, no inline styles — so the whole card morphs into the full article across the navigation, and morphs back via the browser Back button. Every page here is pre-rendered by <code>articles/build.js</code> (the SSR engine): static markup on both sides is what makes the capture reliable in both directions. The full view renders the <code>body</code> as <code>itemprop="articleBody"</code> instead of the teaser summary, from the <em>same UCF instance</em>. The full view uses the <code>prose-article</code> preset: the summary stays visible as the standfirst and the byline moves up under it (<code>byline: lede</code>), at reading scale.</p>

	<p class="note"><strong>Browser support.</strong> Chromium 133+ morphs natively. Safari 18.2+ supports cross-document transitions but not typed <code>attr()</code>, so the names come from <code>ui/base/polyfills/attr-fallback.js</code> (loaded at the end of this page) — without it the navigation still transitions, just as a plain cross-fade. Firefox has no cross-document transitions and navigates instantly. <code>prefers-reduced-motion: reduce</code> disables navigation transitions by design, and the pages must be <strong>served over http</strong> — opened from <code>file://</code> there is no transition (and the root-absolute base CSS 404s).</p>

	<main>
		<div class="grid grid-2" id="cards">
			${cards.join('\n\t\t\t')}
		</div>
	</main>
</body>
</html>
`;

const teasers = [];
for (const name of ['article', 'news']) {
	const ucf = data(`${name}.json`);
	writeFileSync(join(here, `${name}.html`), page(ucf, name));
	teasers.push(teaser(ucf, name));
	console.log(`articles/${name}.html ← data/${name}.json (${ucf.id})`);
}
/* grid page LCP: first teaser's image goes eager (and drops the lazy-only `auto` sizes entry) */
teasers[0] = teasers[0]
	.replace(' loading="lazy"', ' loading="eager" fetchpriority="high"')
	.replace('sizes="auto, ', 'sizes="');
writeFileSync(join(here, '../article.render.html'), gridPage(teasers));
console.log('article.render.html ← grid (static)');
