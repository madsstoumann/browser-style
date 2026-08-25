/* Asserts the invariants the tokens manifest exists to hold (R-13):
 *   1. no substring shadowing — a `*=` needle must never match markup that carries
 *      only some OTHER token (the `loop` in `marquee(loop)` class of bug)
 *   2. every [media*=…]/[content~=…]/… needle in the CSS resolves to a manifest token
 *   3. data/tokens.data.js is in sync with data/tokens.json, aliases resolve,
 *      deprecated entries name a canonical that exists
 *   4. the slide-exclusion list is the same list everywhere it is transcribed (R-01)
 *   5. the itemtype SUBTYPES allowlist matches its docs/schema.md table (R-01, same reason)
 * Run: node tokens.lint.js  (or npm run lint:tokens) */

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { readManifest } from './tokens.build.js';
import DATA from './data/tokens.data.js';
import { SCHEMA_TYPES, SUBTYPES } from './render.js';

const root = new URL('../../', import.meta.url).pathname;

/* every sheet that needles a card attribute, with the attributes it is allowed to needle.
   The furniture components carry their OWN element-local variant=/size=/radius= attributes
   (<ui-chip variant="light">) — a different namespace from the card's variant=, so only
   their media= arms are audited here. ui/base/{carousel,stagger}.css are the generic
   control/engine sheets the card's carousel tokens resolve through. */
const ALL = ['media', 'variant', 'content'];
const MEDIA_ONLY = ['media'];
/* ui/map owns map= entirely — no card sheet may needle it, and it needles nothing else */
const MAP_ONLY = ['map'];
const SHEETS = [
	['ui/card/content.css', ALL], ['ui/card/content.typography.css', ALL], ['ui/card/demo.layout.css', ALL],
	['ui/card/index.css', ALL], ['ui/card/media.carousel.css', ALL], ['ui/card/media.css', ALL],
	['ui/card/media.lightbox.css', ALL],
	['ui/card/media.hover.css', ALL], ['ui/card/media.shapes.css', ALL], ['ui/card/media.tint.css', ALL],
	['ui/card/media.video.css', ALL], ['ui/card/ui-card.css', ALL],
	['ui/reveal/ui-reveal.css', ALL], ['ui/reveal/index.css', ALL],
	['ui/chip/ui-chip.css', MEDIA_ONLY], ['ui/sticker/ui-sticker.css', MEDIA_ONLY],
	['ui/save/ui-save.css', MEDIA_ONLY], ['ui/beacon/ui-beacon.css', MEDIA_ONLY],
	['ui/marquee/ui-marquee.css', MEDIA_ONLY], ['ui/play/ui-play.css', MEDIA_ONLY],
	['ui/lightbox/ui-lightbox.css', MEDIA_ONLY],
	['ui/carousel/carousel.css', MEDIA_ONLY], ['ui/base/stagger.css', MEDIA_ONLY],
	['layout/core/base.css', ALL],
	['ui/map/ui-map.css', MAP_ONLY]
];

const NEEDLE = /\[(media|content|variant|map)([*~])=("([^"]*)"|'([^']*)'|([^\]\s]+))\]/g;

/* every literal spelling an entry can appear as in markup */
const spellings = (name, entry) => {
	const out = new Set();
	const args = Object.entries(entry.args || {});
	const values = args.flatMap(([, list]) => list).filter((value) => !value.includes('<'));
	const aliases = Object.keys(entry.argAliases || {});
	if (entry.bare || !args.length) out.add(name);
	for (const value of [...values, ...aliases]) out.add(`${name}(${value})`);
	if (args.length) out.add(`${name}(`); /* the open-stem needle — also the only spelling for placeholder-only args like auto(<n>) */
	for (const prefix of entry.cqPrefixes || []) {
		const classes = new Set(entry.cqArgs || []);
		if (entry.bare || !args.length) out.add(`${prefix}:${name}`);
		for (const [cls, list] of args) if (classes.has(cls)) for (const value of list) out.add(`${prefix}:${name}(${value})`);
	}
	return out;
};

const flatten = (group) => Object.entries({ ...group.tokens, ...group.bareFlags });

/* ── slide-exclusion sync (R-01) ──
   "Which direct children of a scroller are NOT slides" is transcribed in three
   places by design, and the design call is that they stay transcribed:
   /ui/carousel/polyfill/carousel-controls.js keeps a LOCAL mirror so the polyfill core has zero imports
   from /ui/card/ (it must be loadable on its own, from a CDN, behind a
   `@supports` gate). A deliberate copy is only safe if drift is a build error —
   hence this check. The documented contract:
     • ui/carousel/polyfill/carousel-controls.js NOT_SLIDE  ==  ui/card/shared.js NOT_SLIDE   (exact)
     • media.carousel.css `> :not(…)`  ⊆   shared.js NOT_SLIDE           (subset)
   The CSS list is a subset, not an equal: <ui-carousel-controls> is injected by
   the polyfill (the native path has no such element) and <lay-out> is a JS-only
   wrapper exclusion, so neither needs the flex/snap reset the CSS rule applies. */
const SLIDE_LISTS = {
	'ui/card/shared.js': [/NOT_SLIDE\s*=\s*\/\^\(([^)]*)\)\$\//, (body) => body.split('|')],
	'ui/carousel/polyfill/carousel-controls.js': [/NOT_SLIDE\s*=\s*\/\^\(([^)]*)\)\$\//, (body) => body.split('|')],
	/* the slide rule: `ui-media…> :not(<tags>)` — anchored on ui-media so an
	   unrelated `> :not()` elsewhere in the sheet can never be read as the list */
	'ui/card/media.carousel.css': [/ui-media[^{;]*>\s*:not\(([^)]*)\)/, (body) => body.split(',').map((tag) => tag.trim().toUpperCase())]
};

const slideList = (file, errors) => {
	const [pattern, split] = SLIDE_LISTS[file];
	const match = pattern.exec(readFileSync(root + file, 'utf8'));
	if (!match) { errors.push(`${file}: no slide-exclusion list found — the sync check cannot run`); return null; }
	return new Set(split(match[1]).map((tag) => tag.trim()).filter(Boolean));
};

const lintSlideLists = (errors) => {
	const shared = slideList('ui/card/shared.js', errors);
	const polyfill = slideList('ui/carousel/polyfill/carousel-controls.js', errors);
	const css = slideList('ui/card/media.carousel.css', errors);
	if (!shared || !polyfill || !css) return;
	const diff = (a, b) => [...a].filter((tag) => !b.has(tag)).sort();
	/* polyfill == shared: an exact mirror, so name BOTH directions of any drift */
	for (const tag of diff(polyfill, shared)) errors.push(`ui/carousel/polyfill/carousel-controls.js: NOT_SLIDE has ${tag}, missing from ui/card/shared.js — the mirror has drifted`);
	for (const tag of diff(shared, polyfill)) errors.push(`ui/card/shared.js: NOT_SLIDE has ${tag}, missing from ui/carousel/polyfill/carousel-controls.js — the mirror has drifted`);
	/* CSS ⊆ shared: extra CSS entries are the drift; missing ones are allowed */
	for (const tag of diff(css, shared)) errors.push(`ui/card/media.carousel.css: :not() excludes ${tag}, which is not in ui/card/shared.js NOT_SLIDE`);
};

/* ── itemtype subtype allowlist sync (R-01) ──
   SUBTYPES in render.js decides what may land in an itemtype; the `## Subtypes` table in
   docs/schema.md is what an author reads before writing `details.subtype`. A wrong table
   fails no test — a subtype it lists but render.js rejects silently renders the base type.
   Same call as R-01: the copy is deliberate, so drift is a build error. The lint imports
   SUBTYPES (render.js is Node-safe) and only the markdown side needs parsing.
   The table rows are `| \`key\` | \`BaseItemtype\` | Sub, Sub, … |`. */
const SUBTYPE_DOC = 'ui/card/docs/schema.md';

const docSubtypes = (errors) => {
	const md = readFileSync(root + SUBTYPE_DOC, 'utf8');
	const section = /\n## Subtypes\n([\s\S]*?)\n## /.exec(md);
	if (!section) { errors.push(`${SUBTYPE_DOC}: no "## Subtypes" section — the sync check cannot run`); return null; }
	const rows = [...section[1].matchAll(/^\|\s*`(\w+)`\s*\|\s*`(\w+)`\s*\|([^|]*)\|\s*$/gm)];
	if (!rows.length) { errors.push(`${SUBTYPE_DOC}: "## Subtypes" has no table rows — the sync check cannot run`); return null; }
	return new Map(rows.map(([, key, base, list]) =>
		[key, { base, subtypes: new Set(list.split(',').map((name) => name.trim()).filter(Boolean)) }]));
};

const lintSubtypes = (errors) => {
	const doc = docSubtypes(errors);
	if (!doc) return;
	for (const key of Object.keys(SUBTYPES))
		if (!doc.has(key)) errors.push(`${SUBTYPE_DOC}: render.js SUBTYPES has a "${key}" list with no table row — the doc has drifted`);
	for (const [key, row] of doc) {
		const code = SUBTYPES[key];
		if (!code) { errors.push(`${SUBTYPE_DOC}: table row "${key}" has no SUBTYPES list in render.js — the doc has drifted`); continue; }
		if (row.base !== SCHEMA_TYPES[key]) errors.push(`${SUBTYPE_DOC}: row "${key}" names base itemtype ${row.base}, but SCHEMA_TYPES says ${SCHEMA_TYPES[key]}`);
		const diff = (a, b) => [...a].filter((name) => !b.has(name)).sort();
		for (const name of diff(code, row.subtypes)) errors.push(`${SUBTYPE_DOC}: render.js allows ${key}/${name}, missing from the "## Subtypes" table — the doc has drifted`);
		for (const name of diff(row.subtypes, code)) errors.push(`${SUBTYPE_DOC}: the "## Subtypes" table lists ${key}/${name}, which render.js does NOT allow — it would silently render the base type`);
	}
};

export const lintTokens = () => {
	const manifest = readManifest();
	const errors = [];

	/* ── 3. sync + referential integrity ── */
	if (JSON.stringify(DATA) !== JSON.stringify(manifest))
		errors.push('data/tokens.data.js is out of sync with data/tokens.json — run node tokens.build.js');

	for (const [attr, group] of Object.entries(manifest.attributes)) {
		const names = new Set(Object.keys({ ...group.tokens, ...group.bareFlags }));
		for (const [name, entry] of flatten(group)) {
			const values = new Set(Object.values(entry.args || {}).flat());
			for (const [alias, target] of Object.entries(entry.argAliases || {}))
				if (!values.has(target)) errors.push(`${attr}=${name}: argAlias ${alias} → ${target}, which is not an arg`);
			if (entry.deprecated && !entry.canonical) errors.push(`${attr}=${name}: deprecated with no canonical`);
			if (entry.canonical && !names.has(entry.canonical)) errors.push(`${attr}=${name}: canonical "${entry.canonical}" does not exist`);
			for (const cls of entry.cqArgs || []) if (!(cls in (entry.args || {}))) errors.push(`${attr}=${name}: cqArgs lists "${cls}", not an arg class`);
		}
	}

	/* ── 1. substring shadowing ── a substring-matched needle must not occur inside
	   any OTHER entry's spellings. Attributes are independent: media= only ever
	   matches [media=…], so per-attribute is the whole surface. */
	for (const [attr, group] of Object.entries(manifest.attributes)) {
		const all = flatten(group).map(([name, entry]) => [name, entry, spellings(name, entry)]);
		for (const [name, entry] of all) {
			if (entry.matching !== 'substring') continue;
			const needle = Object.keys(entry.args || {}).length ? `${name}(` : name;
			for (const [other, otherEntry, otherSpellings] of all) {
				if (other === name || otherEntry.canonical === name || entry.canonical === other) continue;
				for (const spelling of otherSpellings)
					if (spelling.includes(needle)) errors.push(`${attr}: needle "${needle}" (${name}) is shadowed by ${other} spelling "${spelling}"`);
			}
		}
	}

	/* ── 2. CSS needle audit ── */
	const vocabulary = Object.fromEntries(Object.entries(manifest.attributes)
		.map(([attr, group]) => [attr, flatten(group).flatMap(([name, entry]) => [...spellings(name, entry)])]));

	for (const [file, attrs] of SHEETS) {
		/* comments are stripped (they carry illustrative `[media*="chip(…)"]` prose),
		   newlines kept so line numbers stay true */
		const source = readFileSync(root + file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '));
		source.split('\n').forEach((line, index) => {
			let match;
			NEEDLE.lastIndex = 0;
			while ((match = NEEDLE.exec(line))) {
				const [, attr, op] = match;
				if (!attrs.includes(attr)) continue;
				const needle = match[4] ?? match[5] ?? match[6];
				const all = vocabulary[attr];
				const hit = op === '~' ? all.includes(needle) : all.some((spelling) => spelling.includes(needle));
				if (!hit) errors.push(`${file}:${index + 1}: [${attr}${op}="${needle}"] resolves to no manifest token`);
			}
		});
	}

	/* ── 4. slide-exclusion list sync ── */
	lintSlideLists(errors);

	/* ── 4b. itemtype subtype allowlist ↔ docs/schema.md table ── */
	lintSubtypes(errors);

	/* ── 5. preset data speaks the current dialect ──
	   The preset collections are renderer INPUT — a token the manifest doesn't
	   know is a silent no-op in the browser (it matches no CSS rule), which is
	   how a whole pre-rename carousel vocabulary (arw(top), mrk(sta), nav(bar),
	   …) survived unnoticed in card.presets.demo.json. Validate every
	   variant/media/content string in both collections against the manifest. */
	lintPresets(manifest, errors);

	return errors;
};

const PRESET_FILES = ['data/card.presets.json', 'data/card.presets.demo.json'];
/* stems whose args are free-form numbers/ratios the manifest lists as placeholders */
const OPEN_STEMS = /^(?:md:|lg:)?(?:asr|spl|auto|tmb)\([\d/.:a-z%]+\)$/;
/* preset parts= vocabularies — KEEP IN SYNC with ui/quote/ui-quote.css,
   ui/accordion/ui-accordion.css and ui/button-group/ui-button-group.css */
const PART_VARIANTS = {
	quote: new Set(['bigquote', 'breaker', 'code']),
	/* `popover` is a MODE word, not chrome: render.js strips it and emits <button
	   popovertarget> + <div popover> pairs instead of <details> (readme.md § Popover mode) */
	accordion: new Set(['bordered', 'divided', 'rounded', 'pill', 'separate', 'filled', 'popover']),
	buttonGroup: new Set(['inline', 'rounded', 'border', 'outline']),
	/* the control's other two axes are its own documented API, not card DSL: font-size
	   utilities from base, and the shared nine-hue theme axis with pale/muted */
	buttonGroupSize: new Set(['fs-xxs', 'fs-xs', 'fs-sm', 'fs-md', 'fs-lg']),
	buttonGroupTheme: new Set(['red', 'orange', 'green', 'blue', 'accent', 'black', 'white', 'gray', 'slate', 'pale', 'muted'])
};
const lintPresets = (manifest, errors) => {
	const valid = {};
	for (const [attr, group] of Object.entries(manifest.attributes)) {
		const set = new Set();
		for (const [name, entry] of flatten(group)) for (const spelling of spellings(name, entry)) if (!spelling.endsWith('(')) set.add(spelling);
		valid[attr] = set;
	}
	const walk = (node, file, path) => {
		if (Array.isArray(node)) return node.forEach((item, index) => walk(item, file, `${path}[${index}]`));
		if (!node || typeof node !== 'object') return;
		for (const [key, value] of Object.entries(node)) {
			/* parts= carries per-sub-component variant words, not DSL tokens */
			if (key === 'parts' && value && typeof value === 'object' && !Array.isArray(value)) {
				for (const [part, words] of Object.entries(value)) {
					if (!PART_VARIANTS[part]) {
						errors.push(`${file} ${path}: parts.${part} is not a known part (expected: ${Object.keys(PART_VARIANTS).join(', ')})`);
						continue;
					}
					for (const word of String(words).trim().split(/\s+/)) {
						if (word && !PART_VARIANTS[part].has(word)) errors.push(`${file} ${path}: parts.${part} word "${word}" is not in the ${part} variant vocabulary — dead in the browser`);
					}
				}
				continue;
			}
			/* media-open (the lightbox's open-state control vocabulary) carries
			   ordinary media= spellings — validate it against the same set */
			const attr = key === 'media-open' ? 'media' : key;
			if (['variant', 'media', 'content'].includes(attr) && typeof value === 'string') {
				for (const token of value.trim().split(/\s+/)) {
					if (!token || valid[attr].has(token) || OPEN_STEMS.test(token)) continue;
					errors.push(`${file} ${path}: ${key}= token "${token}" is not in the manifest — dead in the browser`);
				}
			} else walk(value, file, `${path}.${key}`);
		}
	};
	for (const file of PRESET_FILES) {
		try { walk(JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8')), file, '$'); }
		catch (error) { errors.push(`${file}: unreadable — ${error.message}`); }
	}
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	const errors = lintTokens();
	for (const error of errors) console.error('  ' + error);
	console.log(errors.length ? `tokens lint: ${errors.length} error(s)` : 'tokens lint: ok');
	if (errors.length) process.exit(1);
}
