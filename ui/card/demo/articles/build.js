/**
 * SSR build for the per-article pages.
 *
 *   node ui/card/articles/build.js
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
import { renderCard } from '../render.js';

const here = dirname(fileURLToPath(import.meta.url));
const data = (file) => JSON.parse(readFileSync(join(here, '../data', file), 'utf8'));

const presets = data('card.presets.json').presets;

const withPreset = (ucf, presetId) => ({
	...ucf,
	fields: { ...ucf.fields, preset: { $ref: `card-preset/${presetId}` } }
});

const esc = (value) => String(value)
	.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const page = (ucf) => {
	const title = String(ucf.fields.headline).replace(/<[^>]+>/g, '');
	/* hero frame — tag the image with its view-transition-name via data-view
	   (first <img> only). CSS advanced attr() turns it into the name — no
	   inline style attribute, so a strict CSP (no unsafe-inline styles) holds.
	   id="hero" is the render-blocking anchor (see <link rel="expect">): by the
	   time this <img> is parsed, the wrapping <article data-view="card-…"> start
	   tag already is too, so BOTH morph-named elements exist at snapshot. */
	const hero = renderCard(withPreset(ucf, 'media'), presets)
		.replace('<img', `<img id="hero" data-view="hero-${ucf.id}"`);
	const prose = renderCard(withPreset(ucf, 'prose'), presets);

	return `<!DOCTYPE html>
<html lang="en-US" dir="ltr">
<head>
	<title>${esc(title)}</title>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
	<meta name="description" content="${esc(ucf.fields.summary || title)}">
	<link rel="stylesheet" href="/ui/base/index.css">
	<link rel="stylesheet" href="../../chip/ui-chip.css">
	<link rel="stylesheet" href="../../sticker/ui-sticker.css">
	<link rel="stylesheet" href="../../icon/index.css">
	<link rel="stylesheet" href="../../quote/ui-quote.css">
	<link rel="stylesheet" href="../../avatar/ui-avatar.css">
	<link rel="stylesheet" href="../ui-card.css">
	<!-- Block first paint (and the view-transition snapshot) until the hero is
	     parsed, so the card/hero morph targets exist when the browser captures
	     the incoming page. Without this the snapshot races HTML parsing and the
	     morph degrades to a plain cross-fade on repeat/bfcache navigations. -->
	<link rel="expect" href="#hero" blocking="render">
	<style>
		/* cross-document view transitions (@view-transition, the [data-view]
		   attr() naming rule and group timing) come from ui-card.css */
		body { margin-inline: auto; max-inline-size: var(--width-prose, 65ch); }
		.back { margin-block: var(--spacing-lg); }
		.article-view {
			background: var(--ui-card-bg, var(--color-surface, #fff));
			border-radius: var(--ui-card-radius, var(--radius-2xl));
			margin-block-end: var(--spacing-2xl);
			padding: var(--spacing-lg);
		}
		.article-view > ui-media { margin-block-end: var(--spacing-lg); }
	</style>
</head>
<body>
	<p class="back"><a href="../article.render.html">← All articles</a></p>
	<article class="article-view" data-view="card-${ucf.id}">
		${hero}
		${prose}
	</article>
</body>
</html>
`;
};

/* teaser card for the grid page: data-view names + the cover link inside the
   headline, all applied string-side — the grid page ships with zero runtime JS */
const teaser = (ucf, name) => renderCard(ucf, presets)
	.replace('<ui-card', `<ui-card data-view="card-${ucf.id}"`)
	.replace('<img', `<img data-view="hero-${ucf.id}"`)
	.replace(/(<h3 data-part="headline"[^>]*>)([\s\S]*?)(<\/h3>)/,
		`$1<a data-part="cover" href="articles/${name}.html">$2</a>$3`);

const gridPage = (cards) => `<!DOCTYPE html>
<html lang="en-US" dir="ltr">
<head>
	<title>UI: Card — Article View Transition</title>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
	<meta name="description" content="Teaser cards linking to per-article pages — a cross-document view transition morphs the whole card into the full article. Fully static: pre-rendered by articles/build.js.">
	<link rel="stylesheet" href="/ui/base/index.css">
	<link rel="stylesheet" href="../chip/ui-chip.css">
	<link rel="stylesheet" href="../sticker/ui-sticker.css">
	<link rel="stylesheet" href="../icon/index.css">
	<link rel="stylesheet" href="../quote/ui-quote.css">
	<link rel="stylesheet" href="../avatar/ui-avatar.css">
	<link rel="stylesheet" href="ui-card.css">
	<!-- Block first paint (and the incoming snapshot on Back) until the card
	     grid is parsed, so every card/hero morph target exists when the browser
	     captures this page. Without it the reverse morph races HTML parsing. -->
	<link rel="expect" href="#cards" blocking="render">
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
</head>
<body>
	<h1>UI: Card — Article View Transition</h1>
	<p class="note">Each teaser card links to its <em>own page</em> under <a href="articles/"><code>articles/</code></a>. Both documents opt in with <code>@view-transition { navigation: auto }</code> and carry the same per-article <code>view-transition-name</code>s — set via <code>data-view</code> attributes and the CSS <code>attr()</code> rule, no inline styles — so the whole card morphs into the full article across the navigation, and morphs back via the “← All articles” link or the browser Back button. Every page here is pre-rendered by <code>articles/build.js</code> (the SSR engine): static markup on both sides is what makes the capture reliable in both directions. The full view renders the <code>body</code> as <code>itemprop="articleBody"</code> instead of the teaser summary, from the <em>same UCF instance</em>.</p>

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
	writeFileSync(join(here, `${name}.html`), page(ucf));
	teasers.push(teaser(ucf, name));
	console.log(`articles/${name}.html ← data/${name}.json (${ucf.id})`);
}
writeFileSync(join(here, '../article.render.html'), gridPage(teasers));
console.log('article.render.html ← grid (static)');
