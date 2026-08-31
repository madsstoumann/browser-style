/**
 * SSR build for the recipe app page.
 *
 *   node ui/card/demo/recipes/build.js
 *
 * Sibling of products/build.js and realestate/build.js. The card half is one static
 * renderCard() through the recipe-page preset; the kitchen-app half — ingredient checklist
 * with servings/units, HowToStep list with timers, narration, the controls bar and the
 * cook-mode popover — is hand-authored here from the page-local carbonara.json overlay
 * (deep-merged over data/recipe.json, the real-estate split). The card is handed a details
 * object WITHOUT ingredients/instructions, so render.js emits no accordion: both bands live
 * inside this page's one Recipe scope. `?id=` on the link is a route mimic — the page is
 * static; recipe.js reads the id only to namespace localStorage. Docs: docs/schema.md § Recipe
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderCard } from '../../render.js';
import { CDN_BASE, CONTRAST_STYLE, HEAD_COMMON, PAGE_STYLE, VT_HEAD, breadcrumb, descope, esc, withPreset } from '../build.shared.js';

const here = dirname(fileURLToPath(import.meta.url));
const data = (file) => JSON.parse(readFileSync(join(here, '../../data', file), 'utf8'));
const local = (file) => JSON.parse(readFileSync(join(here, file), 'utf8'));

const presets = { ...data('card.presets.json').presets, ...data('card.presets.demo.json').presets };

/* the media half of a lg:row card is ~half of the 64rem shell */
const IMAGES = { cdnBase: CDN_BASE, sizes: '(min-width: 720px) 30rem, 100vw' };
/* cdn-cgi resolves against the DEPLOYED site — set false to preview against plain <img src> */
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

const ucf = merge(data('recipe.json'), local('carbonara.json'));
const VIEW = 'recipe-1';
const { fields } = ucf;
const d = fields.details;
const TITLE = String(fields.headline).replace(/<[^>]+>/g, '');
const steps = d.instructions;
const N = steps.length;

/* ── durations ─────────────────────────────────────────────────────────────── */
const isoParts = (iso) => {
	const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || '');
	return m ? { h: +(m[1] || 0), m: +(m[2] || 0), s: +(m[3] || 0) } : null;
};
const isoToMs = (iso) => { const p = isoParts(iso); return p ? ((p.h * 60 + p.m) * 60 + p.s) * 1000 : 0; };
const durationLabel = (iso) => {
	const p = isoParts(iso);
	return p ? [p.h && `${p.h} h`, p.m && `${p.m} min`, p.s && `${p.s} s`].filter(Boolean).join(' ') : '';
};

/* ── quantities ────────────────────────────────────────────────────────────── */
/* An ingredient string's leading quantity (+ optional range and unit) becomes a
   <span data-qty data-unit> that recipe.js rescales/converts; the ORIGINAL string rides
   the <data value> so the microdata never changes. "4 egg yolks" → qty 4, no unit. */
const UNITS = new Set(['g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'cups', 'oz', 'lb']);
const FRACTIONS = { '¼': 0.25, '½': 0.5, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 };
const num = (s) => FRACTIONS[s] ?? (s.includes('/') ? s.split('/').reduce((a, b) => a / b) : parseFloat(s.replace(',', '.')));
const QTY = /^(\d+(?:[.,]\d+)?|\d+\/\d+|[¼½¾⅓⅔])(?:\s*[-–]\s*(\d+(?:[.,]\d+)?))?\s+(.+)$/;

const parseIngredient = (str) => {
	const m = QTY.exec(str);
	if (!m) return { text: str };
	let [, lo, hi, rest] = m;
	let unit = null;
	const first = rest.split(/\s+/)[0];
	if (UNITS.has(first)) { unit = first; rest = rest.slice(first.length).trim(); }
	return { lo, hi, qty: num(lo), qtyHi: hi ? num(hi) : null, unit, rest };
};

const qtySpan = (p) => `<span data-qty="${p.qty}"${p.qtyHi != null ? ` data-qty-hi="${p.qtyHi}"` : ''}${p.unit ? ` data-unit="${p.unit}"` : ''}>${esc(p.lo)}${p.hi ? `–${esc(p.hi)}` : ''}${p.unit ? ` ${p.unit}` : ''}</span>`;

const ingredientInner = (str) => {
	const p = parseIngredient(str);
	return p.qty == null ? esc(str) : `${qtySpan(p)} ${esc(p.rest)}`;
};

/* measurements INSIDE a step's prose — unit-converted, never scaled (data-fixed) */
const MEASURE = /(\d+(?:[.,]\d+)?)\s?(kg|g|ml|l|°C|cm)\b/g;
const measureSpans = (escaped) => escaped.replace(MEASURE, (m, n, u) =>
	`<span data-qty="${n.replace(',', '.')}" data-unit="${u}" data-fixed>${n} ${u}</span>`);

/* ── icons: the icon font (ui/icon/icons.json → icon-font.css, in the demo bundle) — one weight for every glyph ── */
const glyph = (name) => `<span data-icon="${name}" aria-hidden="true"></span>`;
const iconButton = ({ command, target, label, icon, pressed, extra = '' }) =>
	`<button class="ui-button" type="button" data-variant="icon" command="${command}" commandfor="${target}" aria-label="${esc(label)}" title="${esc(label)}"${pressed != null ? ` aria-pressed="${pressed}"` : ''}${extra}>${icon}</button>`;

/* ── narration script ──────────────────────────────────────────────────────── */
/* The recorded files are produced OUTSIDE the repo (any TTS/recording tool): this writes the
   exact text per file so the recordings and the Speech-API strings never drift. Unit words
   are expanded for speech the same way recipe.js does it ("400 g" → "400 grams"). */
const SPEECH_UNITS = { g: 'grams', kg: 'kilograms', ml: 'millilitres', l: 'litres', tsp: 'teaspoons', tbsp: 'tablespoons', oz: 'ounces', lb: 'pounds' };
const speakable = (str) => str.replace(/(\d+(?:[.,]\d+)?)\s?(g|kg|ml|l|tsp|tbsp|oz|lb)\b/g, (m, n, u) => `${n} ${SPEECH_UNITS[u]}`);
const spokenDuration = (iso) => { const p = isoParts(iso); return p ? [p.h && `${p.h} hours`, p.m && `${p.m} minutes`].filter(Boolean).join(' ') : ''; };
const stepSpeech = (step, i) => `Step ${i + 1}. ${step.name}. ${speakable(step.text)}`;
const narrationDoc = `# Narration script — ${TITLE}

Generated by \`ui/card/demo/recipes/build.js\` from \`data/recipe.json\` + \`carbonara.json\` — do not edit;
edit the JSON and rebuild. Record one file per row (any TTS or voice tool; MP3 or AAC/\`.m4a\` — the paths below name the format) and drop them
at the listed paths. Recorded files are the default voice; the page falls back to the Speech API for
any step whose file is missing or fails to load, so a partial set is fine. The Speech API reads the SAME strings, so the two voices say the same thing.

| File | Text |
|---|---|
${steps.map((step, i) => `| \`${step.audio}\` | ${stepSpeech(step, i)} |`).join('\n')}
`;

/* ── the card ──────────────────────────────────────────────────────────────── */
/* details WITHOUT ingredients/instructions: render.js recipe() emits the prep/cook/serves
   line and the machine metas only — the bands below own the rest of the scope */
const cardOnly = { ...ucf, fields: { ...fields, cover: undefined, actions: undefined,
	details: { prepTime: d.prepTime, cookTime: d.cookTime, servings: d.servings } } };

const card = descope(renderCard(withPreset(cardOnly, 'recipe-page'), presets, undefined, USE_CDN ? { images: IMAGES } : {}))
	.replace('<ui-card', '<ui-card class="detail-plate"')
	/* the LCP element and the morph target — always eager */
	.replace('<img', `<img id="hero" data-view="hero-${VIEW}"`)
	.replace(' loading="lazy"', ' loading="eager" fetchpriority="high"')
	.replace('sizes="auto, ', 'sizes="'); /* `auto` is spec-invalid on eager images */

/* ── bands ─────────────────────────────────────────────────────────────────── */
const ingredientsBand = `
			<section class="band ingredients" aria-labelledby="ingredients-h">
				<h2 id="ingredients-h" class="band-title">Ingredients</h2>
				<div class="servings" role="group" aria-label="Servings and units">
					${iconButton({ command: '--servings-down', target: 'ingredients', label: 'Fewer servings', icon: '<ui-icon type="minus"></ui-icon>' })}
					<span class="servings-count">Serves <output id="servings" aria-live="polite">${esc(d.servings)}</output></span>
					${iconButton({ command: '--servings-up', target: 'ingredients', label: 'More servings', icon: '<ui-icon type="plus"></ui-icon>' })}
					<button class="ui-button" type="button" data-variant="outline" command="--toggle-units" commandfor="ingredients" aria-pressed="false">Imperial</button>
				</div>
				<ul id="ingredients" class="checklist" data-servings="${esc(d.servings)}">
					${d.ingredients.map((str, i) => `<li><label><input type="checkbox" data-ingredient="${i}"> <data itemprop="recipeIngredient" value="${esc(str)}">${ingredientInner(str)}</data></label></li>`).join('\n\t\t\t\t\t')}
				</ul>
			</section>`;

const timerButton = (step, n) => step.duration
	? `<button class="ui-button" type="button" command="--timer" commandfor="steps" data-timer data-step="${n}" data-ms="${isoToMs(step.duration)}" aria-label="Start a ${durationLabel(step.duration)} timer for ${esc(step.name)}"><span data-icon="timer" aria-hidden="true"></span><span data-label>${durationLabel(step.duration)}</span></button>`
	: '';

const stepItem = (step, i, scoped) => {
	const n = i + 1;
	const scope = scoped ? ' itemprop="itemListElement" itemscope itemtype="https://schema.org/HowToStep"' : '';
	/* timeRequired is a CreativeWork property, and HowToStep is one */
	const metas = scoped ? `<meta itemprop="position" content="${n}">${step.duration ? `<meta itemprop="timeRequired" content="${esc(step.duration)}">` : ''}` : '';
	return `<li${scope} data-step="${n}"${step.audio ? ` data-audio="${esc(step.audio)}"` : ''}${i === 0 ? ' aria-current="step"' : ''}>
						${metas}<h3${scoped ? ' itemprop="name"' : ''}>${esc(step.name)}</h3>
						<p${scoped ? ' itemprop="text"' : ''}>${measureSpans(esc(step.text))}</p>
						${timerButton(step, n)}
					</li>`;
};

const stepsBand = `
			<section class="band method" aria-labelledby="steps-h">
				<h2 id="steps-h" class="band-title">Method</h2>
				<ol id="steps" class="steps" itemprop="recipeInstructions" itemscope itemtype="https://schema.org/ItemList">
					${steps.map((step, i) => stepItem(step, i, true)).join('\n\t\t\t\t\t')}
				</ol>
			</section>`;

/* the transport row — the reference app's bar: wake · back · step N / M · play/pause · next · copy · share */
const playButton = (label, size = '') => `<ui-play theme="gray"${size ? ` size="${size}"` : ''}><button type="button" command="--play-step" commandfor="steps" aria-label="${esc(label)}" aria-pressed="false"><ui-icon type="play-pause"></ui-icon></button></ui-play>`;
const controlsBar = `
		<nav class="bar" aria-label="Cooking controls">
			${iconButton({ command: '--toggle-wake', target: 'cook', label: 'Keep the screen awake', icon: glyph('light-mode'), pressed: false })}
			${iconButton({ command: '--prev-step', target: 'steps', label: 'Previous step', icon: glyph('chevron-left'), extra: ' disabled' })}
			<span class="bar-step" aria-live="polite">Step <output id="step-now">1</output> / ${N}</span>
			${playButton('Play step')}
			${iconButton({ command: '--next-step', target: 'steps', label: 'Next step', icon: glyph('chevron-right') })}
			${iconButton({ command: '--copy', target: 'steps', label: 'Copy recipe as text', icon: glyph('content-copy') })}
			${iconButton({ command: '--share', target: 'steps', label: 'Share this recipe', icon: glyph('share') })}
			<button class="ui-button" type="button" data-variant="accent" command="show-popover" commandfor="cook">Cook mode</button>
			<output class="bar-status" aria-live="polite"></output>
		</nav>`;

/* cook mode: a sibling of the article — no itemprops (the overview <ol> is the machine list),
   no data-view (the morph names must stay unique per document) */
const cookMode = `
		<section id="cook" popover aria-labelledby="cook-title">
			<header class="cook-bar">
				<strong id="cook-title">${esc(TITLE)}</strong>
				<span>
					<ui-beacon id="cook-wake" variant="pill" size="sm" theme="gray">Screen may sleep</ui-beacon>
					<ui-beacon id="cook-mic" variant="pill" size="sm" theme="gray">Mic off</ui-beacon>
					${iconButton({ command: 'hide-popover', target: 'cook', label: 'Close cook mode', icon: '<ui-icon type="cross"></ui-icon>' })}
				</span>
			</header>
			<div class="cook-progress">
				<p aria-live="polite">Step <output id="cook-now">1</output> of ${N}</p>
				<progress id="cook-bar" max="${N}" value="1"></progress>
			</div>
			<ol class="cook-steps">
				${steps.map((step, i) => stepItem(step, i, false)).join('\n\t\t\t\t')}
			</ol>
			<nav class="cook-nav" aria-label="Step navigation">
				<button class="ui-button" type="button" command="--prev-step" commandfor="steps" disabled>${glyph('chevron-left')}Back</button>
				${playButton('Play step')}
				<button class="ui-button" type="button" data-variant="accent" command="--next-step" commandfor="steps">Next${glyph('chevron-right')}</button>
			</nav>
			<p class="cook-tools">
				<button class="ui-button" type="button" data-variant="outline" command="--toggle-wake" commandfor="cook" aria-pressed="false">${glyph('light-mode')}Screen awake</button>
				<button class="ui-button" type="button" data-variant="outline" command="--toggle-voice" commandfor="cook" aria-pressed="false">${glyph('mic')}Hands-free</button>
			</p>
			<p class="cook-voice"><span id="voice-hint">Hands-free: say “next”, “back”, “repeat”, “pause”, “ingredients”, “timer” or “close”.</span> <output id="voice-heard" aria-live="polite"></output></p>
		</section>`;

/* ── page CSS ──────────────────────────────────────────────────────────────── */
/* Cook-mode entry/exit follows the guide for top-layer elements: base state scaled +
   transparent, :popover-open full, standalone @starting-style (a nested one does not re-fire
   on re-open), display + overlay transitioned with allow-discrete. --ox/--oy (set by
   recipe.js from the invoking button) put the transform origin ON the button, so the panel
   grows from where it was asked for. `display` lives in the open state ONLY. */
const STYLES = `
		/* block axis only — the fixed .bar's clearance. Never the inline axis: that is
		   the layout system's page column. See PAGE_STYLE in ../build.shared.js */
		body { padding-block-end: 6rem; }
		@media (width < 540px) { body { padding-block-end: 9rem; } }${PAGE_STYLE}
		.band :where(h3) { margin: 0; }

		/* ingredients */
		.servings { align-items: center; display: flex; flex-wrap: wrap; gap: var(--spacing-sm); margin-block-end: var(--spacing-md); }
		.servings-count { font-variant-numeric: tabular-nums; min-inline-size: 6ch; text-align: center; }
		.checklist { display: grid; gap: var(--spacing-xs); list-style: none; margin: 0; padding: 0; }
		.checklist label { align-items: center; cursor: pointer; display: flex; gap: .75ch; }
		.checklist li:has(:checked) data { color: var(--color-text-muted); text-decoration: line-through; }
		[data-qty] { font-variant-numeric: tabular-nums; }

		/* method */
		.steps { counter-reset: step; display: grid; gap: var(--spacing-md); list-style: none; margin: 0; padding: 0; }
		.steps li { counter-increment: step; border-inline-start: var(--border-width-heavy) solid var(--color-border); display: grid; gap: var(--spacing-xs); padding-inline-start: var(--spacing-md); scroll-margin-block: 6rem; transition: border-color var(--duration-normal); }
		.steps li[aria-current="step"] { border-color: var(--color-accent); }
		.steps h3 { font-size: 1.05rem; }
		.steps h3::before { color: var(--color-text-muted); content: counter(step) '. '; font-variant-numeric: tabular-nums; }
		.steps p { margin: 0; }
		[data-timer] { --button-p: .5ch 1.5ch; font-variant-numeric: tabular-nums; justify-self: start; }
		/* the font's outlines carry the ::marker baseline shift — undo it for inline use */
		/* a 1em box with no line-box strut, so an enlarged glyph never grows its button */
		[data-icon] { block-size: 1em; display: inline-grid; inline-size: 1em; line-height: 1; place-items: center; }
		[data-icon]::before { content: var(--icon) / ""; display: block; font-family: 'ui-icons'; translate: 0 -0.17em; } /* = icons.json baselineShiftEm, measured back out in both engines */
		button > [data-icon]:first-child:not(:last-child) { margin-inline-end: .25ch; }
		/* Material's chevrons are compact — enlarge them as lone glyphs, a touch beside text */
		button[data-variant~="icon"] > [data-icon^="chevron"] { font-size: 1.3em; }
		button:not([data-variant~="icon"]) > [data-icon^="chevron"] { font-size: 1.15em; }
		[data-timer][data-running] { --button-bg: var(--color-accent); --button-c: var(--color-accent-text); }
		[data-timer][data-done] { --button-bg: var(--color-success); --button-c: hsl(0, 0%, 100%); }

		/* the fixed transport bar */
		.bar { align-items: center; backdrop-filter: blur(8px); background: color-mix(in srgb, var(--color-surface) 88%, transparent); border-block-start: var(--border-width) solid var(--color-border); display: flex; flex-wrap: wrap; gap: var(--spacing-sm); inset-block-end: 0; inset-inline: 0; justify-content: center; margin-inline: auto; max-inline-size: 64rem; padding: var(--spacing-sm) var(--spacing-md); position: fixed; z-index: 1; }
		/* base's icon variant is a 1fr grid: the 1em glyph start-aligns in the track (WebKit shows it) — items, not content, need centring */
		button[data-variant~="icon"] { place-items: center; }
		.bar > button[data-variant~="icon"], .bar ui-play button {
			--ui-play-sz: 3rem; --ui-play-icon-sz: 1.25rem;
			align-content: center; block-size: 3rem; font-size: 1.25rem; inline-size: 3rem; padding: 0; place-content: center;
		}
		.bar > button:not([data-variant~="icon"]) { min-block-size: 3rem; }
		.bar-step { font-variant-numeric: tabular-nums; line-height: 1; padding-inline: var(--spacing-xs); }
		.bar-status { flex-basis: 100%; font-size: .85em; text-align: center; }
		.bar-status:empty { display: none; }
		button[aria-pressed="true"]:not([data-timer], ui-play *) { --button-bg: var(--color-accent); --button-c: var(--color-accent-text); --button-bdc: transparent; }
		/* theme= paints the plate but not its hover — without this the hover jumps to ui-play's black default */
		ui-play { --ui-play-bg-hover: color-mix(in srgb, var(--ui-play-bg) 80%, var(--color-text)); }
		button[aria-pressed="true"][data-variant~="outline"] { background: var(--color-accent); color: var(--color-accent-text); }

		/* cook mode — the fullscreen popover */
		#cook {
			background: var(--color-surface);
			block-size: auto;
			border: 0;
			color: var(--color-text);
			gap: var(--spacing-sm);
			grid-template-rows: auto auto 1fr auto auto auto;
			inline-size: auto;
			inset: 0;
			margin: 0;
			max-block-size: none;
			max-inline-size: none;
			opacity: 0;
			overscroll-behavior: contain;
			padding: 0;
			scale: .7;
			transform-origin: var(--ox, 50%) var(--oy, 50%);
			transition: opacity var(--duration-slow) var(--ease-3), scale var(--duration-slow) var(--ease-3), display var(--duration-slow) allow-discrete, overlay var(--duration-slow) allow-discrete;
			z-index: 2; /* Safari has no \`overlay\`: the exiting panel leaves the top layer at once */
		}
		#cook:popover-open { display: grid; opacity: 1; scale: 1; }
		#cook::backdrop { background: color-mix(in srgb, CanvasText 40%, transparent); opacity: 0; transition: opacity var(--duration-slow), display var(--duration-slow) allow-discrete, overlay var(--duration-slow) allow-discrete; }
		#cook:popover-open::backdrop { opacity: 1; }
		@starting-style { /* standalone on purpose — a nested @starting-style does not re-fire on re-open */
			#cook:popover-open { opacity: 0; scale: .7; }
			#cook:popover-open::backdrop { opacity: 0; }
		}
		@media (prefers-reduced-motion: reduce) {
			#cook { scale: none; }
			#cook, #cook::backdrop { transition-duration: 0s; }
			.steps li { transition: none; }
		}
		:where(html):has(#cook:popover-open) { overflow: hidden; scrollbar-gutter: stable; }
		.cook-bar { align-items: center; display: flex; gap: var(--spacing-sm); justify-content: space-between; padding: var(--spacing-sm) var(--spacing-md); }
		.cook-bar > span { align-items: center; display: inline-flex; flex-wrap: wrap; gap: var(--spacing-xs); justify-content: end; }
		.cook-progress { display: grid; gap: var(--spacing-xs); padding-inline: var(--spacing-md); text-align: center; }
		.cook-progress p { color: var(--color-text-muted); font-size: .85em; margin: 0; }
		.cook-progress progress { inline-size: 100%; }
		.cook-steps { align-content: center; display: grid; gap: var(--spacing-lg); list-style: none; margin: 0; overflow-y: auto; padding: var(--spacing-md); }
		.cook-steps li { display: grid; gap: var(--spacing-md); justify-items: center; margin-inline: auto; max-inline-size: 42ch; text-align: center; }
		.cook-steps h3 { color: var(--color-accent); font-size: clamp(1rem, .5rem + 1.5vw, 1.4rem); letter-spacing: .04em; text-transform: uppercase; }
		.cook-steps p { font-size: clamp(1.5rem, 1rem + 2.5vw, 2.6rem); line-height: 1.4; margin: 0; text-wrap: balance; }
		.cook-steps [data-timer] { font-size: 1.1em; justify-self: center; }
		#cook[data-ready] .cook-steps li:not([aria-current="step"]) { display: none; } /* one step at a time, JS live */
		.cook-nav { align-items: center; display: grid; gap: var(--spacing-sm); grid-template-columns: 1fr auto 1fr; padding-inline: var(--spacing-md); }
		.cook-nav > button { border-radius: .75em; font-size: 1.1em; min-block-size: 3.25rem; }
		.cook-nav ui-play { justify-self: center; }
		.cook-nav ui-play button { --ui-play-sz: 3.25rem; --ui-play-icon-sz: 1.5rem; }
		.cook-tools { display: flex; flex-wrap: wrap; gap: var(--spacing-sm); justify-content: center; margin: 0; padding-inline: var(--spacing-md); }
		.cook-tools button { min-block-size: 2.75rem; }
		.cook-voice { color: var(--color-text-muted); font-size: .85em; margin: 0; padding: 0 var(--spacing-md) var(--spacing-md); text-align: center; }
		.cook-voice output { color: var(--color-accent); font-style: italic; }
		.cook-voice output:not(:empty)::before { content: '“'; }
		.cook-voice output:not(:empty)::after { content: '”'; }
		button:disabled ui-icon { opacity: .4; }`;

/* ── shell ─────────────────────────────────────────────────────────────────── */
const page = `<!DOCTYPE html>
<html lang="en-US" dir="ltr">
<head>
	<title>${esc(TITLE)}</title>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
	<meta name="text-scale" content="scale">
	<meta name="color-scheme" content="light dark">
	<meta name="description" content="${esc(fields.summary || TITLE)} — the recipe as a small kitchen app: ingredient checklist with servings and units, step timers, narration, cook mode with wake lock and hands-free voice control.">
	${HEAD_COMMON}
	<!-- Block first paint (and the view-transition snapshot) until the hero is parsed,
	     so the card/hero morph targets exist when the browser captures the incoming
	     page. Docs: products/build.js header -->
	<link rel="expect" href="#hero" blocking="render">
	${VT_HEAD}
	<style>
		/* cross-document view transitions (@view-transition, the [data-view] attr()
		   naming rule and group timing) come from ui-card.css — nothing page-scoped
		   here, deliberately: see the header comment in products/build.js */${STYLES}
	</style>
	${CONTRAST_STYLE}
</head>
<body>
	${breadcrumb([
		{ name: 'Card', url: '/ui/card/' },
		{ name: 'Recipe app', url: '/ui/card/demo/schema.recipe.html' },
		{ name: TITLE }
	])}
	<main>
		<article class="detail-page recipe-page" data-view="card-${VIEW}" data-id="${esc(ucf.id)}" itemscope itemtype="https://schema.org/Recipe">
			<link itemprop="mainEntityOfPage" href="recipe.html?id=${esc(ucf.id)}">
			${card}
			<lay-out lg="ratio(40:60) items(start)">${ingredientsBand}${stepsBand}</lay-out>
		</article>${controlsBar}${cookMode}
	</main>
	<!-- Everything above works without it: checkboxes, native popover open/close, the step
	     list. The module adds the transport, timers, wake lock, narration state, voice. -->
	<script type="module" src="recipe.js"></script>
</body>
</html>
`;

mkdirSync(here, { recursive: true });
const out = join(here, 'recipe.html');
writeFileSync(out, page);
writeFileSync(join(here, 'narration.md'), narrationDoc);
console.log(`recipes/recipe.html ← data/recipe.json + recipes/carbonara.json (${ucf.id}, ${N} steps)`);
