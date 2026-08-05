/**
 * ui/card/render.js
 * @version 2.0.0
 * @author Mads Stoumann
 *
 * SSR rendering engine for the universal card model (cms/baseline/models/card.schema.json).
 * Takes a UCF content instance (or its `fields` object) and returns an HTML STRING —
 * a fully composed <ui-card>, <ui-reveal>, or bare <ui-media>/<ui-content>, with
 * inline schema.org microdata matching ui/card/demo/schema.html.
 *
 * Security: every interpolated value passes through esc() — the output is safe to
 * insert with insertAdjacentHTML/innerHTML or stream from a server. The single,
 * deliberate exception is the headline, where renderInline() re-allows `<b>` only
 * (gradient-highlight segments); everything else in it stays escaped.
 *
 * No `document` usage — runs unchanged in Node for true SSR.
 *
 * Usage (browser):
 *   import { renderCard, loadPresets } from './render.js';
 *   const presets = await loadPresets('data/card.presets.json');
 *   const ucf = await (await fetch('data/product.json')).json();
 *   grid.insertAdjacentHTML('beforeend', renderCard(ucf, presets));
 */

/* Token knowledge is DATA: data/tokens.json is the manifest the CSS conventions, this
   renderer, the generated tokens.md and tokens.lint.js all read. tokens.data.js is its
   generated ES-module mirror — a plain import, so this module stays Node+browser safe. */
import TOKENS from './data/tokens.data.js';

const SCHEMA = 'https://schema.org/';

/* schemaType → schema.org itemtype */
export const SCHEMA_TYPES = {
	content: 'CreativeWork',
	article: 'Article',
	news: 'NewsArticle',
	product: 'Product',
	event: 'Event',
	recipe: 'Recipe',
	review: 'Review',
	job: 'JobPosting',
	course: 'Course',
	booking: 'Reservation',
	poll: 'Question',
	profile: 'Person',
	faq: 'FAQPage',
	quote: 'Quotation',
	timeline: 'EventSeries',
	gallery: 'ImageGallery',
	statistic: 'Observation',
	achievement: 'EducationalOccupationalCredential',
	announcement: 'SpecialAnnouncement',
	business: 'LocalBusiness',
	comparison: 'ItemList',
	contact: 'ContactPoint',
	location: 'Place',
	membership: 'Offer',
	social: 'SocialMediaPosting',
	software: 'SoftwareApplication'
};

/* Fallback when a card references no preset (or an unknown one).
   Real presets live in data/card.presets.json — instances of the
   card-preset model (cms/baseline/models/card-preset.schema.json). */
const DEFAULT_PRESET = { element: 'ui-card', variant: 'col', media: 'asr(16/9)' };

/* headline itemprop: job → title, article/news → headline, rest → name */
const HEADLINE_PROP = { job: 'title', article: 'headline', news: 'headline' };
/* summary itemprop: review → reviewBody, quote/announcement/social → text, rest → description */
const SUMMARY_PROP = { review: 'reviewBody', quote: 'text', announcement: 'text', social: 'text' };
/* eyebrow itemprop (only where a sensible property exists) */
const EYEBROW_PROP = { article: 'articleSection', news: 'articleSection', product: 'category', recipe: 'recipeCategory', course: 'about', job: 'industry' };
/* published itemprop: JobPosting/SpecialAnnouncement use datePosted */
const PUBLISHED_PROP = { job: 'datePosted', announcement: 'datePosted' };
/* types whose `body` is the article text → wrapped in itemprop="articleBody" */
const ARTICLE_BODY_TYPES = new Set(['article', 'news']);
/* types where the image/video belongs to another scope — skip itemprop */
const NO_IMAGE_PROP = new Set(['review', 'contact']);

/* ── string helpers (all data flows through esc) ── */

const esc = (value) => String(value)
	.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;')
	.replace(/"/g, '&quot;');

/* attribute string: null/false skipped, true = bare attribute, values escaped */
const attrs = (obj) => Object.entries(obj)
	.filter(([, value]) => value != null && value !== false && value !== '')
	.map(([key, value]) => value === true ? ` ${key}` : ` ${key}="${esc(value)}"`)
	.join('');

const meta = (prop, content) =>
	content == null || content === '' ? '' : `<meta itemprop="${esc(prop)}" content="${esc(content)}">`;

const scope = (prop, type) =>
	` itemprop="${esc(prop)}" itemscope itemtype="${SCHEMA + type}"`;

/* Inline-rich text (headline): plain string or UCF richtext object.
   Escapes everything, then re-allows <b>/</b> ONLY — the gradient-highlight marker. */
const renderInline = (value) => {
	const text = typeof value === 'string' ? value : value?.$richtext ? value.content : value ?? '';
	return esc(text).replace(/&lt;(\/?)b&gt;/g, '<$1b>');
};

/* plain text from a possibly-rich headline (for aria/meta contexts) */
const plain = (value) => {
	const text = typeof value === 'string' ? value : value?.$richtext ? value.content : value ?? '';
	return String(text).replace(/<[^>]+>/g, '');
};

const num = (value) => (typeof value === 'number' ? value.toLocaleString('en-US') : value);

const stars = (value, max = 5) => '★'.repeat(Math.round(value)) + '☆'.repeat(max - Math.round(value));

/* "PT15M" → "15 min", "P6W" → "6 weeks", "P14D" → "14 days" */
const duration = (iso) => {
	const match = /^PT?(\d+)([MHWDY])$/.exec(iso || '');
	if (!match) return iso;
	const [, count, unit] = match;
	const units = { M: 'min', H: 'hr', W: 'week', D: 'day', Y: 'year' };
	const label = units[unit] || unit;
	const plural = label === 'min' || label === 'hr' ? label : Number(count) === 1 ? label : label + 's';
	return `${count} ${plural}`;
};

/* preset.styles → style attribute value. Only CSS custom properties pass. */
const styleAttr = (styles) => {
	const rules = Object.entries(styles || {})
		.filter(([key]) => key.startsWith('--'))
		.map(([key, value]) => `${key}: ${value}`);
	return rules.length ? rules.join('; ') : null;
};

/* star rating row — part "rating" */
const ratingPart = (prop, ratingType, rating) => {
	if (!rating?.value) return '';
	const max = rating.max ?? 5;
	const label = `Rated ${rating.value} out of ${max} stars${rating.count ? ` from ${num(rating.count)} ratings` : ''}`;
	return `<div data-part="rating"${scope(prop, ratingType)} role="img" aria-label="${esc(label)}">
		${meta('ratingValue', rating.value)}
		${rating.count != null ? meta('ratingCount', rating.count) : ''}
		${meta('bestRating', max)}${meta('worstRating', 1)}
		<span aria-hidden="true">${stars(rating.value, max)}</span> <span>${esc(rating.value)} / ${max}${rating.count ? ` (${num(rating.count)} ratings)` : ''}</span>
	</div>`;
};

/* check/ordered list — part "list" */
const listPart = (items, { ordered = false, itemprop = null } = {}) =>
	items?.length
		? `<${ordered ? 'ol' : 'ul'} data-part="list"${itemprop ? ` itemprop="${esc(itemprop)}"` : ''}>${items.map((item) => `<li>${esc(item)}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`
		: '';

/* byline rows from authors[] */
const byline = (authors, prop = 'author') =>
	(authors || []).map((author) => `<address data-part="byline"${scope(prop, 'Person')}>
		${author.avatar ? `<img src="${esc(author.avatar)}" alt="">` : ''}
		<span><span itemprop="name">${esc(author.name)}</span>${author.role ? ` · <span itemprop="jobTitle">${esc(author.role)}</span>` : ''}</span>
	</address>`).join('');

/* quote part via @browser.style/quote — variant on the <ui-quote> wrapper styles it, data-part stays the card hook */
const quotePart = (text, { itemprop = 'text', variant = null, cite = null } = {}) =>
	`<ui-quote data-part="quote"${attrs({ variant })}><blockquote itemprop="${esc(itemprop)}"><q>${esc(text)}</q>${cite ? `<cite>${esc(cite)}</cite>` : ''}</blockquote></ui-quote>`;

/* nested <ui-accordion> — cq-box is hand-authored so the CSS-only form styles without JS */
const accordion = (group, items) =>
	`<ui-accordion group="${esc(group)}"><cq-box>${items.map(({ summary, body, scopeAttrs = '' }) =>
		`<details name="${esc(group)}"${scopeAttrs}>
			<summary>${summary}<ui-icon type="plus-minus"></ui-icon></summary>
			${body}
		</details>`
	).join('')}</cq-box></ui-accordion>`;

/* VideoObject metas for a native <video> item (placed INSIDE the element — valid fallback content) */
const videoMetas = (item, src) =>
	meta('name', item.alt) + meta('contentUrl', src) + meta('thumbnailUrl', item.poster)
	+ meta('uploadDate', item.uploadDate) + meta('duration', item.duration) + meta('description', item.description);

/* VideoObject block for a provider embed (hidden — appended to the content column) */
const embedVideoObject = (item) => {
	const embedUrl = item.mediaType === 'youtube'
		? `https://www.youtube.com/embed/${item.src}`
		: `https://player.vimeo.com/video/${item.src}`;
	const thumb = item.mediaType === 'youtube'
		? `https://i.ytimg.com/vi/${item.src}/hqdefault.jpg`
		: item.poster;
	return `<div${scope('video', 'VideoObject')} hidden>
		${meta('name', item.alt)}${meta('embedUrl', embedUrl)}${meta('thumbnailUrl', thumb)}${meta('uploadDate', item.uploadDate)}
	</div>`;
};

/* ── media column ── */

/* ── overlay furniture (chip / sticker / save / play / beacon) ──
   Content = the furniture object (text/semantics only). Look = the preset's
   media= tokens; each item's optional style= override is appended and, for a
   token that collides with the preset on the same axis, replaces it (the CSS
   matches media= tokens by substring, so precedence is source-order, not token
   order — mergeMediaTokens strips the preset's same-axis token so the override
   always wins). */

/* The overlay stems the renderer emits: the five FURNITURE elements (chip/sticker/
   save/play/beacon), plus the marquee BAND. The band is a different manifest axis on
   purpose (full-width strip, `top`/`bot` instead of the 9-grid) but it has the exact
   same merge problem — CSS resolves media= by source order, not token order — so it
   joins the same override table. Deprecated stems are excluded from the table (the
   guard is currently a no-op — ply() was folded into play() and removed in v5, so no
   furniture stem has a deprecated spelling left and token strings reach the merge
   verbatim, with no stem-normalization step). */
const FURNITURE = Object.entries(TOKENS.attributes.media.tokens)
	.filter(([, entry]) => entry.axis === 'furniture' || entry.axis === 'band');
const FURNITURE_TOKEN = new RegExp(`^(${FURNITURE.filter(([, entry]) => !entry.deprecated).map(([stem]) => stem).join('|')})\\(([^)]*)\\)$`);

/* arg value → merge axis, unioned from the manifest across the furniture stems. The
   class list is PINNED: adopting a new manifest arg class changes which preset tokens
   an override displaces, so it is a deliberate edit, not a silent data pickup.
   (`pos` = the 9-grid · `hue` = the 8-key palette + its accepted aliases · `size` — xs is
   beacon-only, play() sizes live here too · `anim`/`face` are beacon's, `disc` the shared
   radius vocabulary: beacon(non) turns solid's default blink off and stays in `disc` ·
   `mode` = the pale/muted plate tones + the marquee's rpt/seam/fade play modes ·
   `flag` = sticker(fit)'s text-fit typesetting. The marquee's `value` class —
   direction/speed/gap — is deliberately NOT here: those compose rather than
   displace, so each one falls through to exact-match replacement.) */
const MERGE_CLASSES = ['pos', 'hue', 'size', 'variant', 'shape', 'anim', 'face', 'disc', 'mode', 'flag'];
const FURNITURE_AXIS = Object.fromEntries(MERGE_CLASSES.map((cls) => [cls, new Set()]));
for (const [, entry] of FURNITURE) {
	for (const cls of MERGE_CLASSES)
		for (const value of entry.args[cls] || []) if (!value.includes('<')) FURNITURE_AXIS[cls].add(value);
	/* an accepted alias classifies with its canonical — dark→black is a hue */
	for (const [alias, canonical] of Object.entries(entry.argAliases))
		for (const cls of MERGE_CLASSES) if (FURNITURE_AXIS[cls].has(canonical)) FURNITURE_AXIS[cls].add(alias);
}
const axisOf = (value) => {
	if (value.startsWith('sh:')) return 'shape'; /* clipped silhouettes: sh:burst, sh:<custom>… */
	for (const [axis, set] of Object.entries(FURNITURE_AXIS)) if (set.has(value)) return axis;
	return value; /* unknown → exact-match replacement */
};

/* Merge a preset media= string with furniture style-override tokens. Overrides
   win: any preset token of the same element+axis is dropped before appending. */
const mergeMediaTokens = (presetMedia, overrides = []) => {
	const ov = overrides.filter(Boolean);
	const base = String(presetMedia || '').split(/\s+/).filter(Boolean);
	if (!ov.length) return base.join(' ');
	const conflicts = new Set();
	for (const token of ov) {
		const match = FURNITURE_TOKEN.exec(token);
		if (match) conflicts.add(`${match[1]}:${axisOf(match[2])}`);
	}
	const kept = base.filter((token) => {
		const match = FURNITURE_TOKEN.exec(token);
		return !match || !conflicts.has(`${match[1]}:${axisOf(match[2])}`);
	});
	return [...kept, ...ov].join(' ');
};

/* media= belongs on the frame it configures (canonical placement) — inject it
   into the built <ui-media> rather than onto the ui-card/ui-reveal host. */
const withMedia = (html, media) => media ? html.replace('<ui-media', `<ui-media${attrs({ media })}`) : html;

/* reveal preset values → compact variant-token spellings. The scale animation is
   grw() (content= owns scl()); the old `scl` spelling was removed in v5, so `scale`
   is the only preset word that folds to it. */
const RVL_TOKEN = { expand: 'exp', flip: 'flp', slide: 'sld', scale: 'grw' };
const FRM_TOKEN = { top: 'top', bottom: 'btm', left: 'lft', right: 'rgt' };
/* animations whose token carries a direction/origin argument (manifest: the
   reveal-animation stems that declare a `pos` arg class — exp declares none) */
const RVL_DIRECTED = new Set(Object.entries(TOKENS.attributes.variant.tokens)
	.filter(([, entry]) => entry.axis === 'reveal-animation' && !entry.deprecated && entry.args.pos)
	.map(([stem]) => stem));
/* animations that need the <ui-face> front-face wrapper (exp animates the host) */
const RVL_FACED = new Set(['flp', 'sld', 'grw']);
const ICON_STYLE = { dark: 'drk', semi: 'sem' };
const ICON_CELLS = new Set(TOKENS.attributes.variant.tokens.ico.args.pos);
/* icon words → ico()/icc() tokens: positional words fold into ONE corner token
   (top/bottom × left/right; defaults top + end → ts te bs be),
   style words map to their short forms, corner/short values pass through. */
const iconTokens = (fn, words) => {
	const out = [];
	let block = null, inline = null;
	for (const w of String(words || '').split(/\s+/).filter(Boolean)) {
		if (w === 'top' || w === 'bottom') block = w;
		else if (w === 'left' || w === 'right') inline = w;
		else if (ICON_CELLS.has(w)) out.push(`${fn}(${w})`);
		else out.push(`${fn}(${ICON_STYLE[w] || w})`);
	}
	if (block || inline) out.unshift(`${fn}(${(block || 'top')[0]}${inline === 'left' ? 's' : 'e'})`);
	return out;
};

/* A furniture item's style= string → per-value tokens, e.g. ("chip", "bs red")
   → ["chip(bs)", "chip(red)"]. Single-value tokens only (CSS matches by substring). */
const styleTokens = (el, style) =>
	String(style || '').split(/\s+/).filter(Boolean).map((token) => `${el}(${token})`);

/* Every word marquee() accepts, straight from the manifest (args + argAliases,
   placeholders skipped). The band is validated where the point furniture is not,
   because its position vocabulary is only `top`/`bot` — an author reaching for a
   furniture corner (`marquee(te)`) would otherwise emit a token no rule matches
   and get the silent default. Unknown words are dropped, never emitted. */
const MARQUEE_ARGS = new Set([
	...Object.values(TOKENS.attributes.media.tokens.marquee.args).flat().filter((value) => !value.includes('<')),
	...Object.keys(TOKENS.attributes.media.tokens.marquee.argAliases)
]);
const marqueeStyle = (style) =>
	String(style || '').split(/\s+/).filter((word) => MARQUEE_ARGS.has(word)).join(' ');

/* Build the overlay furniture markup from the unified furniture object and push
   each item's style-override tokens onto tokens.media (positioning/hue/shape come
   from the preset — the renderer no longer generates those). save/play also
   accept a bare `true`. */
const buildFurniture = (furniture, fields, tokens, mediaId, videoId = null) => {
	if (!furniture) return '';
	let html = '';
	const push = (el, style) => { for (const token of styleTokens(el, style)) tokens.media.push(token); };

	if (furniture.marquee?.text) {
		/* A BAND, not 9-grid furniture: it spans the frame's full inline size and
		   takes no position cell — `top` (default) and `bot` are its only placement
		   words, and it rides at z-index 1, BELOW the z-2 point furniture. Text goes
		   on aria-label, which is both the accessible name and the rendered string:
		   ui-marquee.css fills ::before (and ::after for the rpt mode) while the
		   element is :empty, so the band needs no child markup at all. */
		const marquee = furniture.marquee;
		html += `<ui-marquee aria-label="${esc(marquee.text)}"></ui-marquee>`;
		push('marquee', marqueeStyle(marquee.style));
	}
	if (furniture.play) {
		/* invoker commands are the one <ui-play> contract (video.js handles them).
		   With no native <video> to target it stays a labelled affordance. */
		const play = furniture.play === true ? {} : furniture.play;
		html += `<ui-play><button${attrs({
			type: 'button',
			'aria-label': play.label || 'Play',
			command: videoId ? 'play-pause' : null,
			commandfor: videoId
		})}><ui-icon type="play-pause"></ui-icon></button></ui-play>`;
		push('play', play.style);
	}
	if (furniture.chip?.text) {
		const chip = furniture.chip;
		html += `<ui-chip>${esc(chip.text)}${chip.badge ? `<ui-badge>${esc(chip.badge)}</ui-badge>` : ''}</ui-chip>`;
		push('chip', chip.style);
	}
	if (furniture.beacon?.text) {
		/* marker-class live/status indicator — plain text-only markup (summary-
		   safe); look comes from beacon(…) tokens: position/hue/size/face
		   (pll|sld|tck)/animation (bln|pls|brt|non — reduced-motion-gated in CSS).
		   Every face incl. the tck ticker is markup-free (pseudo-element panel +
		   dot loader riding a registered --_slide clock in ui-beacon.css). */
		const beacon = furniture.beacon;
		html += `<ui-beacon>${esc(beacon.text)}</ui-beacon>`;
		push('beacon', beacon.style);
	}
	if (furniture.sticker?.lines?.length) {
		const sticker = furniture.sticker;
		const lines = sticker.lines.map((line) => {
			const el = { label: 'small', lead: 'strong', plain: 'span' }[line.role] || 'small';
			return `<${el}>${esc(line.text ?? '')}${line.sup ? `<sup>${esc(line.sup)}</sup>` : ''}</${el}>`;
		}).join('');
		html += `<ui-sticker>${lines}</ui-sticker>`;
		push('sticker', sticker.style);
	}
	if (furniture.save) {
		const save = furniture.save === true ? {} : furniture.save;
		const name = esc(plain(fields.headline) || 'card');
		const label = save.saved ? `Remove ${name} from favorites` : `Save ${name} to favorites`;
		html += `<ui-save><button type="button" command="--save"${mediaId ? ` commandfor="${esc(mediaId)}"` : ''} aria-label="${label}"${save.saved ? ' aria-pressed="true"' : ''}><ui-icon type="shape" shape="${esc(save.shape || 'heart')}" variant="outline"></ui-icon></button></ui-save>`;
		push('save', save.style);
	}
	return html;
};

/* <ui-lightbox> is emitted SEPARATELY and placed BEFORE the slides: in a nav
   scroller it is sticky-pinned to the scrollport (media.carousel.css), and a
   sticky start-corner pin only holds from first-child position — the same
   contract as the hand-authored sticky <ui-play> (end corners are relocated by
   carousel.js for play; for lightbox they are documented as deferred). */

/* the two canonical glyphs, inlined from /assets/svg (cleaned Tabler outlines:
   bare viewBox, stroke styling comes from ui-icon's svg rules). `photos` =
   library-photo.svg "open gallery" (the default), `maximize` =
   window-maximize.svg "full screen" (single image / video frames). */
const LIGHTBOX_GLYPHS = {
	photos: '<svg viewBox="0 0 24 24"><path d="M7 5.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667l0 -8.666"/><path d="M4.012 7.26a2.005 2.005 0 0 0 -1.012 1.737v10c0 1.1 .9 2 2 2h10c.75 0 1.158 -.385 1.5 -1"/><path d="M17 7h.01"/><path d="M7 13l3.644 -3.644a1.21 1.21 0 0 1 1.712 0l3.644 3.644"/><path d="M15 12l1.644 -1.644a1.21 1.21 0 0 1 1.712 0l2.644 2.644"/></svg>',
	maximize: '<svg viewBox="0 0 24 24"><path d="M3 17a1 1 0 0 1 1 -1h3a1 1 0 0 1 1 1v3a1 1 0 0 1 -1 1h-3a1 1 0 0 1 -1 -1l0 -3"/><path d="M4 12v-6a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-6"/><path d="M12 8h4v4"/><path d="M16 8l-5 5"/></svg>'
};
const buildLightbox = (furniture, tokens, mediaId) => {
	if (!furniture?.lightbox) return '';
	const lightbox = furniture.lightbox === true ? {} : furniture.lightbox;
	for (const token of styleTokens('lightbox', lightbox.style)) tokens.media.push(token);
	const glyph = LIGHTBOX_GLYPHS[lightbox.shape] || LIGHTBOX_GLYPHS.photos;
	return `<ui-lightbox><button type="button" command="toggle-popover"${mediaId ? ` commandfor="${esc(mediaId)}"` : ''} aria-label="${esc(lightbox.label || 'View gallery')}"><ui-icon>${glyph}</ui-icon></button></ui-lightbox>`;
};

/**
 * Build the <ui-media> string. Returns { html, hostAttrs, extras }:
 * - hostAttrs: attributes computed for the frame (provider embeds, dual-attribute carousel form)
 * - extras: schema markup that must live OUTSIDE ui-media (VideoObject for embeds → content column)
 * Furniture style-override tokens are pushed onto tokens.media for the host's media= string.
 */
const buildMedia = (fields, type, tokens, preset = {}, frameAttrs = {}, cardId = null) => {
	if (!fields.media?.length) return null;
	let frames = '';
	let embed = null;
	let extras = '';
	/* a <ui-play> commands the frame's FIRST native <video> — id it for commandfor */
	const playId = (fields.furniture?.play && cardId) ? `${cardId}-video` : null;
	let videoId = playId;
	for (const item of fields.media) {
		const src = item.asset?.$asset ? item.asset.$asset : item.src;
		if (item.mediaType === 'youtube' || item.mediaType === 'vimeo') {
			/* lite embed — provider/video attributes on the frame itself (index.js wires it) */
			embed = { provider: item.mediaType, video: src };
			extras += embedVideoObject(item);
			continue;
		}
		if (item.mediaType === 'video') {
			const id = videoId;
			videoId = null;
			frames += `<video${attrs({
				id,
				src,
				playsinline: true,
				controls: item.controls !== false && !item.autoplay,
				autoplay: !!item.autoplay,
				muted: !!(item.muted ?? item.autoplay),
				loop: !!item.loop,
				poster: item.poster || null,
				preload: item.autoplay ? 'auto' : 'metadata',
				'aria-label': item.alt || null
			})}${NO_IMAGE_PROP.has(type) ? '' : scope('video', 'VideoObject')}>${NO_IMAGE_PROP.has(type) ? '' : videoMetas(item, src)}</video>`;
			continue;
		}
		frames += `<img${attrs({
			src,
			alt: item.alt || '',
			loading: 'lazy',
			itemprop: NO_IMAGE_PROP.has(type) ? null : 'image'
		})}>`;
	}
	/* save/lightbox need a command target — id the frame when either is present;
	   lightbox also marks the frame as the popover the invoker toggles */
	const mediaId = ((fields.furniture?.save || fields.furniture?.lightbox) && cardId) ? `${cardId}-media` : null;
	const lightbox = buildLightbox(fields.furniture, tokens, mediaId);
	const furniture = buildFurniture(fields.furniture, fields, tokens, mediaId, videoId ? null : playId);
	const html = `<ui-media${attrs({
		id: mediaId,
		popover: fields.furniture?.lightbox ? true : null,
		/* open-state control vocabulary (standard media spellings) — swapped in by
		   ui/card/lightbox.js while the popover is open; inert without JS */
		'media-open': (fields.furniture?.lightbox && preset['media-open']) || null,
		...(embed || {}),
		...frameAttrs
	})}>${lightbox}${frames}${furniture}</ui-media>`;
	return { html, extras };
};

/* ── content column ── */

/* Long-form body: plain string or UCF richtext ({$richtext, content, format}).
   One element per blank-line-separated paragraph, escaped — html-format richtext
   is NOT rendered (this engine never emits unescaped rich markup).
   For article/news the paragraphs are wrapped in itemprop="articleBody". */
const bodyHtml = (fields, type, textTag = 'p') => {
	const body = fields.body;
	const text = typeof body === 'string'
		? body
		: body?.$richtext && body.format !== 'html' ? body.content : null;
	if (!text) return '';
	const paragraphs = String(text).split(/\n{2,}/)
		.map((paragraph) => paragraph.trim())
		.filter(Boolean)
		.map((paragraph) => `<${textTag}>${esc(paragraph)}</${textTag}>`)
		.join('');
	return ARTICLE_BODY_TYPES.has(type) ? `<div itemprop="articleBody">${paragraphs}</div>` : paragraphs;
};

/**
 * Envelope parts: eyebrow, headline, subheadline, summary/body, date metas.
 * slots.subheadline lets a type renderer replace the subheadline row (profile).
 * Types in DETAILS_OWNS_SUMMARY render their own summary (review).
 *
 * textMode (preset `text` field): "summary" (teaser, default) shows the summary
 * and never the body; "body" shows the body INSTEAD of the summary (summary as
 * fallback when no body exists); "both" shows summary + body (reveal backs).
 */
const DETAILS_OWNS_SUMMARY = new Set(['review']);

const buildContent = (fields, type, overlay, slots = {}, textMode = 'summary') => {
	const headlineTag = overlay ? 'strong' : 'h3';
	const textTag = overlay ? 'span' : 'p';
	const body = textMode !== 'summary' ? bodyHtml(fields, type, textTag) : '';
	const showSummary = textMode !== 'body' || !body;
	let html = '';
	if (fields.eyebrow) {
		html += `<small data-part="eyebrow"${EYEBROW_PROP[type] ? ` itemprop="${EYEBROW_PROP[type]}"` : ''}>${esc(fields.eyebrow)}</small>`;
	}
	if (fields.headline && type !== 'quote') {
		html += `<${headlineTag} data-part="headline" itemprop="${HEADLINE_PROP[type] || 'name'}">${renderInline(fields.headline)}</${headlineTag}>`;
	}
	html += slots.subheadline || (fields.subheadline ? `<${textTag} data-part="subheadline">${esc(fields.subheadline)}</${textTag}>` : '');
	if (fields.summary && showSummary && !DETAILS_OWNS_SUMMARY.has(type)) {
		const prop = SUMMARY_PROP[type] || 'description';
		if (type === 'quote') {
			html += quotePart(fields.summary, { itemprop: prop, variant: 'bigquote', cite: fields.authors?.[0]?.name });
		} else if (type === 'social') {
			html += quotePart(fields.summary, { itemprop: prop });
		} else {
			html += `<${textTag} data-part="summary" itemprop="${prop}">${esc(fields.summary)}</${textTag}>`;
		}
	}
	if (fields.summary && !showSummary) {
		/* body replaced the visible summary — keep the description machine-readable */
		html += meta(SUMMARY_PROP[type] || 'description', fields.summary);
	}
	html += body;
	if (fields.published) html += meta(PUBLISHED_PROP[type] || 'datePublished', fields.published);
	if (fields.modified) html += meta('dateModified', fields.modified);
	return html;
};

/* byline, tags, actions, engagement — envelope trailers, appended after details */
const buildTail = (fields, type) => {
	let html = '';
	if (fields.authors?.length) html += byline(fields.authors, type === 'quote' ? 'creator' : 'author');
	if (fields.readingTime || fields.published) {
		const date = fields.published
			? `<time datetime="${esc(fields.published)}">${new Date(fields.published).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</time>`
			: '';
		html += `<p data-part="meta">${date}${fields.readingTime ? ` · ${esc(fields.readingTime)}` : ''}</p>`;
	}
	if (fields.tags?.length) {
		html += `<ul data-part="tags">${fields.tags.map((tag) => `<li><a href="#">${esc(tag)}</a></li>`).join('')}</ul>`;
	}
	if (fields.actions?.length) {
		html += `<nav data-part="actions">${fields.actions.map((action) =>
			`<a class="${action.style === 'primary' ? 'ui-button' : 'ui-button --ghost'}" href="${esc(action.link?.url || '#')}">${esc(action.link?.text || '')}</a>`
		).join(' ')}</nav>`;
	}
	const eng = fields.engagement;
	if (eng && Object.keys(eng).length) {
		const counters = [['likeCount', 'LikeAction'], ['shareCount', 'ShareAction'], ['commentCount', 'CommentAction'], ['viewCount', 'WatchAction']];
		for (const [key, action] of counters) {
			if (eng[key] == null) continue;
			html += `<div${scope('interactionStatistic', 'InteractionCounter')} hidden>${meta('interactionType', SCHEMA + action)}${meta('userInteractionCount', eng[key])}</div>`;
		}
		const summary = [
			eng.viewCount != null ? `${num(eng.viewCount)} views` : null,
			eng.likeCount != null ? `${num(eng.likeCount)} likes` : null,
			eng.shareCount != null ? `${num(eng.shareCount)} shares` : null,
			eng.commentCount != null ? `${num(eng.commentCount)} comments` : null
		].filter(Boolean).join(' · ');
		if (summary) html += `<footer data-part="footer">${summary}</footer>`;
	}
	return html;
};

/* ── type-specific detail renderers — return part strings ── */

const availabilityUrl = (availability) =>
	SCHEMA + (/(in)/i.test(availability || '') ? 'InStock' : /(low|limited)/i.test(availability || '') ? 'LimitedAvailability' : 'OutOfStock');

const DETAILS = {
	product(d) {
		let html = '';
		if (d.price) {
			html += `<p data-part="price"${scope('offers', 'Offer')}>
				${meta('priceCurrency', d.price.currency)}${meta('availability', availabilityUrl(d.availability))}${meta('itemCondition', SCHEMA + 'NewCondition')}${d.validUntil ? meta('priceValidUntil', d.validUntil) : ''}
				<data itemprop="price" value="${esc(d.price.current)}">${esc(d.price.currency || '')} ${esc(d.price.current)}</data>${d.price.original ? ` <del>${esc(d.price.currency || '')} ${esc(d.price.original)}</del>` : ''}${d.price.discountText ? ` <small>${esc(d.price.discountText)}</small>` : ''}
			</p>`;
		}
		html += ratingPart('aggregateRating', 'AggregateRating', d.rating);
		const bits = [d.availability, d.sku ? `SKU ${d.sku}` : null].filter(Boolean).join(' · ');
		if (bits) html += `<p data-part="meta">${esc(bits)}</p>`;
		if (d.sku) html += meta('sku', d.sku);
		return html;
	},

	event(d) {
		let html = meta('eventStatus', d.status ? SCHEMA + 'Event' + d.status : null)
			+ meta('eventAttendanceMode', SCHEMA + 'OfflineEventAttendanceMode')
			+ meta('startDate', d.startDate) + meta('endDate', d.endDate);
		const location = d.location?.name
			? `<span${scope('location', 'Place')}><span itemprop="name">${esc(d.location.name)}</span>${d.location.address ? `<span${scope('address', 'PostalAddress')}>, <span itemprop="addressLocality">${esc(d.location.address)}</span></span>` : ''}</span>`
			: '';
		html += `<span data-part="meta">${esc(d.dateDisplay || d.startDate || '')}${location ? ' · ' : ''}${location}</span>`;
		if (d.organizer?.name) {
			html += `<span data-part="meta"${scope('organizer', 'Organization')}>Organizer: <span itemprop="name">${esc(d.organizer.name)}</span></span>`;
		}
		return html;
	},

	recipe(d) {
		let html = meta('prepTime', d.prepTime) + meta('cookTime', d.cookTime) + meta('recipeYield', d.servings);
		html += `<p data-part="meta">Prep ${esc(duration(d.prepTime))} · Cook ${esc(duration(d.cookTime))} · Serves ${esc(d.servings)}</p>`;
		if (d.ingredients?.length) {
			html += `<ul data-part="list">${d.ingredients.map((item) => `<li itemprop="recipeIngredient">${esc(item)}</li>`).join('')}</ul>`;
		}
		if (d.instructions?.length) {
			html += accordion('recipe-acc', [{
				summary: 'Instructions',
				body: `<div${scope('recipeInstructions', 'ItemList')}><ol>${d.instructions.map((step, index) =>
					`<li${scope('itemListElement', 'HowToStep')}>${meta('position', index + 1)}<span itemprop="text">${esc(step)}</span></li>`
				).join('')}</ol></div>`
			}]);
		}
		return html;
	},

	review(d, fields) {
		let html = ratingPart('reviewRating', 'Rating', d.rating);
		if (fields.summary) {
			html += quotePart(fields.summary, { itemprop: 'reviewBody' });
		}
		if (d.reviewer?.name) {
			html += `<address data-part="byline"${scope('author', 'Person')}><span><span itemprop="name">${esc(d.reviewer.name)}</span>${d.reviewer.verified ? ' ✓ Verified purchase' : ''}</span></address>`;
		}
		if (d.reviewDate) {
			html += `<p data-part="meta"><time itemprop="datePublished" datetime="${esc(d.reviewDate)}">${esc(d.reviewDateDisplay || d.reviewDate)}</time></p>`;
		}
		if (d.productReviewed) {
			html += `<div${scope('itemReviewed', 'Product')} hidden>${meta('name', d.productReviewed)}</div>`;
		}
		return html;
	},

	job(d) {
		let html = meta('industry', d.industry) + meta('employmentType', d.employmentType) + meta('validThrough', d.applicationDeadline);
		html += `<p data-part="meta"><span${scope('hiringOrganization', 'Organization')}><span itemprop="name">${esc(d.company)}</span></span> · <span${scope('jobLocation', 'Place')}><span itemprop="name">${esc(d.location)}</span></span>${d.employmentTypeDisplay ? ` · ${esc(d.employmentTypeDisplay)}` : ''}${d.applicationDeadlineDisplay ? ` · Apply by ${esc(d.applicationDeadlineDisplay)}` : ''}</p>`;
		const salary = d.salaryRange;
		if (salary) {
			html += `<p data-part="price"${scope('baseSalary', 'MonetaryAmount')}>
				${meta('currency', salary.currency)}
				<span${scope('value', 'QuantitativeValue')}>${meta('minValue', salary.min)}${meta('maxValue', salary.max)}${meta('unitText', salary.period || 'YEAR')}${esc(salary.currency)} ${num(salary.min)}–${num(salary.max)} <small>${esc(salary.periodDisplay || 'annually')}</small></span>
			</p>`;
		}
		const sections = [];
		if (d.qualifications?.length) sections.push({ summary: 'Requirements', body: `<div>${listPart(d.qualifications, { itemprop: 'qualifications' })}</div>` });
		if (d.benefits?.length) sections.push({ summary: 'Benefits', body: `<div>${listPart(d.benefits, { itemprop: 'jobBenefits' })}</div>` });
		if (sections.length) html += accordion('job-acc', sections);
		return html;
	},

	course(d) {
		let html = meta('timeRequired', d.duration) + meta('educationalLevel', d.difficultyLevel)
			+ `<div${scope('hasCourseInstance', 'CourseInstance')} hidden>${meta('courseMode', 'Online')}</div>`;
		html += `<p data-part="meta">${esc(duration(d.duration))} · ${esc(d.difficultyLevel)} · Instructor: <span${scope('provider', 'Organization')}><span itemprop="name">${esc(d.instructor?.name)}</span></span></p>`;
		if (d.price) {
			html += `<p data-part="price"${scope('offers', 'Offer')}>${meta('priceCurrency', d.price.currency)}${meta('availability', SCHEMA + 'InStock')}<data itemprop="price" value="${esc(d.price.current)}">${esc(d.price.currency)} ${esc(d.price.current)}</data>${d.price.original ? ` <del>${esc(d.price.currency)} ${esc(d.price.original)}</del>` : ''}</p>`;
		}
		html += listPart(d.prerequisites);
		return html;
	},

	booking(d) {
		let html = meta('totalPrice', d.price?.hourlyRate) + meta('priceCurrency', d.price?.currency)
			+ (d.serviceName ? `<div${scope('reservationFor', 'Service')} hidden>${meta('name', d.serviceName)}</div>` : '');
		html += `<p data-part="meta"><span${scope('provider', 'Organization')}><span itemprop="name">${esc(d.venue)}</span></span>${d.capacity ? ` · Capacity ${esc(d.capacity)}` : ''}${d.duration ? ` · ${esc(d.duration)}` : ''}${d.cancellationPolicy ? ` · ${esc(d.cancellationPolicy)}` : ''}</p>`;
		if (d.price?.hourlyRate != null) {
			html += `<p data-part="price"><data value="${esc(d.price.hourlyRate)}">${esc(d.price.currency)} ${esc(d.price.hourlyRate)}</data>/hour</p>`;
		}
		html += listPart(d.amenities);
		return html;
	},

	poll(d) {
		let html = meta('answerCount', d.options?.length);
		const total = d.totalVotes || d.options?.reduce((sum, option) => sum + (option.votes || 0), 0) || 0;
		if (d.options?.length) {
			html += `<ul data-part="options">${d.options.map((option) => {
				const pct = total ? Math.round((option.votes / total) * 100) : 0;
				return `<li${scope('suggestedAnswer', 'Answer')}>
					<label><input type="radio" name="poll-render"> <span itemprop="text">${esc(option.headline)}</span></label>
					<progress max="100" value="${pct}"></progress> <span>${pct}%</span>
				</li>`;
			}).join('')}</ul>`;
		}
		html += `<footer data-part="footer">${num(total)} votes${d.closesDisplay ? ` · ${esc(d.closesDisplay)}` : ''}</footer>`;
		return html;
	},

	profile(d) {
		let html = '';
		if (d.location) html += `<p data-part="meta" itemprop="address">${esc(d.location)}</p>`;
		if (d.contacts?.length) {
			html += `<nav data-part="actions">${d.contacts.map((contact) => {
				const href = contact.type === 'email' ? `mailto:${contact.value}` : contact.type === 'phone' ? `tel:${contact.value}` : contact.value;
				const prop = contact.type === 'email' ? 'email' : contact.type === 'phone' ? 'telephone' : 'url';
				return `<a class="ui-button --ghost" itemprop="${prop}" href="${esc(href)}">${esc(contact.label || contact.value)}</a>`;
			}).join(' ')}</nav>`;
		}
		return html;
	},

	faq(d) {
		if (!d.items?.length) return '';
		return accordion('faq-render', d.items.map((item) => ({
			summary: `<span itemprop="name">${esc(item.question)}</span>`,
			body: `<div${scope('acceptedAnswer', 'Answer')}><p itemprop="text">${esc(item.answer)}</p></div>`,
			scopeAttrs: scope('mainEntity', 'Question')
		})));
	},

	timeline(d) {
		if (!d.items?.length) return '';
		return `<ol data-part="timeline">${d.items.map((item) =>
			`<li${scope('subEvent', 'Event')}><time itemprop="name" datetime="${esc(item.date)}">${esc(item.headline || item.date)}</time> <span itemprop="description">${esc(item.text)}</span></li>`
		).join('')}</ol>`;
	},

	gallery(d) {
		const bits = [d.albumName, d.totalCount ? `${d.totalCount} photos` : null].filter(Boolean).join(' · ');
		return bits ? `<p data-part="meta">${esc(bits)}</p>` : '';
	},

	statistic(d) {
		let html = `<p data-part="stat"${scope('value', 'QuantitativeValue')}>
			${meta('name', d.metricName)}
			<data itemprop="value" value="${esc(d.currentValue)}">${esc(d.displayValue ?? String(d.currentValue))}</data>${d.unit ? `<small itemprop="unitText">${esc(d.unit)}</small>` : ''}${d.trend ? `<span> ${d.trend === 'up' ? '▲' : d.trend === 'down' ? '▼' : '►'} ${esc(d.trendPercentage)}%</span>` : ''}
		</p>`;
		if (d.note) html += `<p data-part="meta">${esc(d.note)}</p>`;
		return html;
	},

	achievement(d) {
		let html = meta('dateCreated', d.dateEarned) + meta('expires', d.expirationDate)
			+ meta('educationalLevel', d.skillLevel) + meta('identifier', d.credentialId);
		html += `<p data-part="meta">Issued by <span${scope('recognizedBy', 'Organization')}><span itemprop="name">${esc(d.issuingOrganization)}</span></span>${d.dateEarnedDisplay ? ` · ${esc(d.dateEarnedDisplay)}` : ''}${d.expirationDateDisplay ? ` · Expires ${esc(d.expirationDateDisplay)}` : ''}${d.credentialId ? ` · ID ${esc(d.credentialId)}` : ''}</p>`;
		return html;
	},

	announcement(d) {
		let html = meta('datePosted', d.effectiveDate?.start) + meta('expires', d.effectiveDate?.end) + meta('spatialCoverage', 'Global');
		if (d.targetAudience) {
			html += `<p data-part="meta"${scope('audience', 'Audience')}>Audience: <span itemprop="audienceType">${esc(d.targetAudience)}</span></p>`;
		}
		if (d.actionRequired) html += `<footer data-part="footer">Action required: ${esc(d.actionRequired)}</footer>`;
		return html;
	},

	business(d) {
		let html = meta('url', d.website);
		if (d.geo) {
			html += `<div${scope('geo', 'GeoCoordinates')} hidden>${meta('latitude', d.geo.latitude)}${meta('longitude', d.geo.longitude)}</div>`;
		}
		if (d.address) {
			html += `<address data-part="address"${scope('address', 'PostalAddress')}>
				${d.address.streetAddress ? `<span itemprop="streetAddress">${esc(d.address.streetAddress)}</span>, ` : ''}${d.address.postalCode ? `<span itemprop="postalCode">${esc(d.address.postalCode)}</span> ` : ''}${d.address.addressLocality ? `<span itemprop="addressLocality">${esc(d.address.addressLocality)}</span>` : ''}${meta('addressCountry', d.address.addressCountry)}
			</address>`;
		}
		if (d.openingHours?.length) {
			html += `<p data-part="meta">${d.openingHours.map((hours) => meta('openingHours', hours.schema)).join('')}${esc(d.openingHours.map((hours) => hours.display).join(' · '))}</p>`;
		}
		const links = [];
		if (d.telephone) links.push(`<a class="ui-button --ghost" itemprop="telephone" href="tel:${esc(d.telephone.replace(/\s/g, ''))}">${esc(d.telephone)}</a>`);
		if (d.email) links.push(`<a class="ui-button --ghost" itemprop="email" href="mailto:${esc(d.email)}">Email</a>`);
		if (links.length) html += `<nav data-part="actions">${links.join(' ')}</nav>`;
		return html;
	},

	comparison(d) {
		let html = meta('numberOfItems', d.items?.length);
		if (d.items?.length) {
			html += `<ul data-part="options">${d.items.map((item, index) =>
				`<li${scope('itemListElement', 'ListItem')}>
					${meta('position', index + 1)}
					<label><span itemprop="name">${esc(item.name)}</span>${item.price ? ` — ${esc(item.price)}` : ''}</label>
					${item.score != null ? `<progress max="100" value="${esc(item.score)}"></progress>` : ''}${item.scoreDisplay ? ` <span>${esc(item.scoreDisplay)}</span>` : ''}
				</li>`
			).join('')}</ul>`;
		}
		if (d.recommendation) html += `<footer data-part="footer">Recommended: ${esc(d.recommendation)}${d.summary ? ` — ${esc(d.summary)}` : ''}</footer>`;
		return html;
	},

	contact(d) {
		let html = meta('contactType', d.contactType) + meta('hoursAvailable', d.availableHours);
		const bits = [d.availableHoursDisplay, d.languages].filter(Boolean).join(' · ');
		if (bits) html += `<p data-part="meta">${esc(bits)}</p>`;
		if (d.contactMethods?.length) {
			html += `<nav data-part="actions">${d.contactMethods.map((method, index) => {
				const href = method.type === 'email' ? `mailto:${method.value}` : method.type === 'phone' ? `tel:${method.value}` : method.value;
				const prop = method.type === 'email' ? 'email' : method.type === 'phone' ? 'telephone' : 'url';
				return `<a class="${index === 0 ? 'ui-button' : 'ui-button --ghost'}" itemprop="${prop}" href="${esc(href)}">${esc(method.label || method.value)}</a>`;
			}).join(' ')}</nav>`;
		}
		return html;
	},

	location(d) {
		let html = '';
		if (d.geo) {
			html += `<div${scope('geo', 'GeoCoordinates')} hidden>${meta('latitude', d.geo.latitude)}${meta('longitude', d.geo.longitude)}</div>`;
		}
		if (d.address) {
			html += `<address data-part="address"${scope('address', 'PostalAddress')}>${d.address.addressLocality ? `<span itemprop="addressLocality">${esc(d.address.addressLocality)}</span>` : ''}${d.address.addressCountry ? `, <span itemprop="addressCountry">${esc(d.address.addressCountry)}</span>` : ''}</address>`;
		}
		if (d.hours) html += `<span data-part="meta">${esc(d.hours)}</span>`;
		return html;
	},

	membership(d) {
		let html = meta('eligibleDuration', d.trialPeriod);
		if (d.price) {
			html += `<p data-part="price"${scope('priceSpecification', 'PriceSpecification')}>${meta('priceCurrency', d.price.currency)}<data itemprop="price" value="${esc(d.price.monthly)}">${esc(d.price.currency)} ${esc(d.price.monthly)}</data>/mo ${d.price.yearly ? `<small>or ${esc(d.price.currency)} ${esc(d.price.yearly)}/yr${d.price.savings ? ` — ${esc(d.price.savings)}` : ''}</small>` : ''}</p>`;
		}
		html += listPart(d.features, { itemprop: 'includesObject' });
		if (d.trialText) html += `<p data-part="meta">${esc(d.trialText)}</p>`;
		return html;
	},

	social(d) {
		return d.platform ? `<div${scope('publisher', 'Organization')} hidden>${meta('name', d.platform)}</div>` : '';
	},

	software(d) {
		let html = meta('applicationCategory', d.applicationCategory)
			+ (d.operatingSystem || []).map((os) => meta('operatingSystem', os)).join('');
		html += `<p data-part="meta">${esc((d.operatingSystem || []).join(' · '))}${d.fileSize ? ` · ${esc(d.fileSize)}` : ''}</p>`;
		if (d.developer?.name) {
			html += `<p data-part="meta"${scope('author', 'Organization')}>Developer: <span itemprop="name">${esc(d.developer.name)}</span>${d.developer.website ? meta('url', d.developer.website) : ''}</p>`;
		}
		if (d.price) {
			html += `<p data-part="price"${scope('offers', 'Offer')}>${meta('priceCurrency', d.price.currency)}${meta('availability', SCHEMA + 'InStock')}<data itemprop="price" value="${esc(d.price.current)}">${esc(d.price.currency)} ${esc(d.price.current)}</data>${d.price.note ? ` <small>${esc(d.price.note)}</small>` : ''}</p>`;
		}
		return html;
	}
};

/* profile: jobTitle/organization row takes the subheadline slot */
const profileSubheadline = (d, textTag) =>
	d?.jobTitle
		? `<${textTag} data-part="subheadline"><span itemprop="jobTitle">${esc(d.jobTitle)}</span>${d.organization ? ` · <span${scope('worksFor', 'Organization')}><span itemprop="name">${esc(d.organization)}</span></span>` : ''}</${textTag}>`
		: '';

/* full content column for a card (envelope + details + trailers) */
const contentColumn = (fields, type, overlay, extras = '', textMode = 'summary') => {
	const slots = {};
	if (type === 'profile' && fields.details) {
		slots.subheadline = profileSubheadline(fields.details, overlay ? 'span' : 'p');
	}
	let html = buildContent(fields, type, overlay, slots, textMode);
	if (DETAILS[type] && fields.details) html += DETAILS[type](fields.details, fields);
	html += buildTail(fields, type);
	return html + extras;
};

/* ── reveal composition (<ui-reveal>) — used when preset.element is ui-reveal ── */

/* Back panel derived from the host card's own envelope + details. */
const derivedBack = (fields, type) => {
	let html = fields.eyebrow ? `<small data-part="eyebrow">${esc(fields.eyebrow)}</small>` : '';
	html += `<h3 data-part="headline">${renderInline(fields.headline)}${fields.details?.version ? ` ${esc(fields.details.version)}` : ''}</h3>`;
	if (fields.summary) html += `<p data-part="summary" itemprop="${SUMMARY_PROP[type] || 'description'}">${esc(fields.summary)}</p>`;
	html += bodyHtml(fields, type);
	if (DETAILS[type] && fields.details) html += DETAILS[type](fields.details, fields);
	html += buildTail({ ...fields, published: null, readingTime: null }, type);
	return html;
};

/* Back panel from a referenced flipside card — a content column only, never
   another reveal, so flipside chains cannot recurse. Shares the host's itemscope.
   Backs are the "full" face: summary + body both render. */
const flipsideBack = (flipside) => {
	const fields = flipside?.fields ?? flipside ?? {};
	const type = SCHEMA_TYPES[fields.schemaType] ? fields.schemaType : 'content';
	return contentColumn(fields, type, false, '', 'both');
};

const renderReveal = (fields, type, itemtype, tokens, preset, flipside, cardId = null) => {
	const media = buildMedia(fields, type, tokens, preset, {}, cardId);
	const back = flipside ? flipsideBack(flipside) : derivedBack(fields, type);
	const reveal = preset.reveal || {};
	/* reveal config → variant tokens. The preset keeps friendly editor values
	   ("slide", "left", "top right sm"); the emitted animation token carries its
	   own direction/origin — type+from fold into ONE token: slide+left → sld(lft),
	   flip+top → flp(top); expand → exp; scale → grw (origin follows ico()).
	   Icon placement folds into a corner token (ico(te) = top end). */
	const anim = RVL_TOKEN[reveal.type] || reveal.type || 'flp';
	const dir = reveal.from && RVL_DIRECTED.has(anim) ? FRM_TOKEN[reveal.from] || reveal.from : null;
	const revealTokens = [
		dir ? `${anim}(${dir})` : anim,
		reveal.typeLg ? `lg:${RVL_TOKEN[reveal.typeLg] || reveal.typeLg}` : null,
		reveal.to ? 'pop' : null,
		reveal.trigger ? 'trg(card)' : null,
		reveal.scroll ? 'scr' : null,
		...iconTokens('ico', reveal.icon || 'top right sm'),
		...iconTokens('icc', reveal.iconClose),
	].filter(Boolean);
	/* media=/content= sit on the primitives they configure; variant=/theme= on the host */
	const inner = `${withMedia(media?.html || '', mergeMediaTokens(preset.media, tokens.media))}
		<ui-content${attrs({ content: preset.content || null })}>
			${fields.eyebrow ? `<small data-part="eyebrow">${esc(fields.eyebrow)}</small>` : ''}
			<strong data-part="headline" itemprop="${HEADLINE_PROP[type] || 'name'}">${renderInline(fields.headline)}</strong>
			${fields.details?.version ? `<span data-part="meta">v<span itemprop="softwareVersion">${esc(fields.details.version)}</span></span>` : ''}
		</ui-content>`;
	/* <ui-face> only where the animation transforms the front face; exp animates the host */
	const front = RVL_FACED.has(anim) ? `<ui-face>${inner}</ui-face>` : inner;
	/* trg(card) makes the whole summary the trigger — no toggle icon */
	const icon = reveal.trigger ? '' : `<ui-icon type="${esc(reveal.iconType || 'plus-cross')}" aria-hidden="true"></ui-icon>`;
	return `<ui-reveal${attrs({
		variant: [preset.variant, ...revealTokens].filter(Boolean).join(' '),
		theme: preset.theme || null,
		style: styleAttr(preset.styles),
		itemscope: true,
		itemtype
	})}>
		<details${attrs({ name: reveal.name || null })}>
			<summary>${front}${icon}</summary>
			<ui-content tabindex="0">${back}${media?.extras || ''}</ui-content>
		</details>
	</ui-reveal>`;
};

/* ── public API ── */

const resolvePreset = (fields, presets) => {
	const ref = fields.preset?.$ref || '';
	const id = ref.startsWith('card-preset/') ? ref.slice('card-preset/'.length) : ref;
	return (id && presets[id]) || DEFAULT_PRESET;
};

/* Resolve a card → card reference ({ "$ref": "card/{id}" }) against a UCF map keyed by id. */
const resolveCard = (ref, cards) => {
	const id = (ref?.$ref || '').split('/').pop();
	return (id && cards[id]) || null;
};

/**
 * Fetch a preset collection (data/card.presets.json) and return the id → preset map.
 * @param {string} url
 * @returns {Promise<object>}
 */
export async function loadPresets(url) {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);
	const doc = await response.json();
	return doc.presets || doc;
}

/**
 * Render one card from a UCF instance (or its bare `fields` object) to an HTML string.
 * The look & feel comes from the referenced card-preset — pass the preset map from
 * loadPresets(). Unknown/missing references fall back to a plain stack card.
 * @param {object} ucf — UCF file content ({ fields }) or the fields object itself
 * @param {object} [presets] — id → preset map (from data/card.presets.json)
 * @param {object} [cards] — id → UCF map for resolving card references (flipside)
 * @returns {string} HTML for <ui-card>, <ui-reveal>, or a bare primitive
 */
export function renderCard(ucf, presets = {}, cards = {}) {
	const fields = ucf?.fields ?? ucf ?? {};
	const cardId = ucf?.id || null;
	const type = SCHEMA_TYPES[fields.schemaType] ? fields.schemaType : 'content';
	const itemtype = SCHEMA + SCHEMA_TYPES[type];
	const preset = resolvePreset(fields, presets);
	const tokens = { media: [] };

	if (preset.element === 'ui-reveal') {
		return renderReveal(fields, type, itemtype, tokens, preset, resolveCard(fields.flipside, cards), cardId);
	}

	/* Bare <ui-media> — a standalone media frame, no card chrome. The media
	   token string sits on the element itself (rds() applies outside a card). */
	if (preset.element === 'ui-media') {
		const caption = fields.media?.find((item) => item.caption)?.caption;
		const media = buildMedia(fields, type, tokens, preset, {}, cardId);
		const inner = (media?.html || '<ui-media></ui-media>')
			.replace('<ui-media', `<ui-media${attrs({
				media: mergeMediaTokens(preset.media, tokens.media) || null,
				style: styleAttr(preset.styles),
				itemscope: true,
				itemtype
			})}`)
			.replace('</ui-media>', `${fields.headline ? meta('name', plain(fields.headline)) : ''}${caption ? `<small data-part="caption">${esc(caption)}</small>` : ''}${media?.extras || ''}</ui-media>`);
		return inner;
	}

	/* Bare <ui-content> — a standalone content column, no card chrome. */
	if (preset.element === 'ui-content') {
		return `<ui-content${attrs({
			content: preset.content || null,
			style: styleAttr(preset.styles),
			itemscope: true,
			itemtype
		})}>${contentColumn(fields, type, false, '', preset.text || 'summary')}</ui-content>`;
	}

	const media = buildMedia(fields, type, tokens, preset, {}, cardId);
	const overlay = /ovr\(/.test(preset.variant || '');
	/* media=/content= sit on the primitives they configure; variant=/theme= on the host */
	return `<ui-card${attrs({
		variant: preset.variant || 'col',
		theme: preset.theme || null,
		style: styleAttr(preset.styles),
		itemscope: true,
		itemtype
	})}>
		<cq-box>
			${withMedia(media?.html || '', mergeMediaTokens(preset.media, tokens.media))}
			<ui-content${attrs({ content: preset.content || null })}>${contentColumn(fields, type, overlay, media?.extras || '', preset.text || 'summary')}</ui-content>
		</cq-box>
	</ui-card>`;
}

/**
 * Fetch a UCF file and render it.
 * @param {string} url
 * @param {object} [presets] — id → preset map
 * @param {object} [cards] — id → UCF map for card references
 * @returns {Promise<string>}
 */
export async function renderCardFrom(url, presets = {}, cards = {}) {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);
	return renderCard(await response.json(), presets, cards);
}

export default renderCard;
