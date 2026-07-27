/* Asserts the invariants the tokens manifest exists to hold (R-13):
 *   1. no substring shadowing — a `*=` needle must never match markup that carries
 *      only some OTHER token (the `loop` in `marquee(loop)` class of bug)
 *   2. every [media*=…]/[content~=…]/… needle in the CSS resolves to a manifest token
 *   3. data/tokens.data.js is in sync with data/tokens.json, aliases resolve,
 *      deprecated entries name a canonical that exists
 * Run: node tokens.lint.js  (or npm run lint:tokens) */

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { readManifest } from './tokens.build.js';
import DATA from './data/tokens.data.js';

const root = new URL('../../', import.meta.url).pathname;

/* every sheet that needles a card attribute, with the attributes it is allowed to needle.
   The furniture components carry their OWN element-local variant=/size=/radius= attributes
   (<ui-chip variant="light">) — a different namespace from the card's variant=, so only
   their media= arms are audited here. ui/base/{carousel,stagger}.css are the generic
   control/engine sheets the card's carousel tokens resolve through. */
const ALL = ['media', 'variant', 'content'];
const MEDIA_ONLY = ['media'];
const SHEETS = [
	['ui/card/content.css', ALL], ['ui/card/content.typography.css', ALL], ['ui/card/demo.layout.css', ALL],
	['ui/card/index.css', ALL], ['ui/card/media.carousel.css', ALL], ['ui/card/media.css', ALL],
	['ui/card/media.hover.css', ALL], ['ui/card/media.shapes.css', ALL], ['ui/card/media.tint.css', ALL],
	['ui/card/media.video.css', ALL], ['ui/card/ui-card.css', ALL],
	['ui/reveal/ui-reveal.css', ALL], ['ui/reveal/index.css', ALL],
	['ui/chip/ui-chip.css', MEDIA_ONLY], ['ui/sticker/ui-sticker.css', MEDIA_ONLY],
	['ui/save/ui-save.css', MEDIA_ONLY], ['ui/beacon/ui-beacon.css', MEDIA_ONLY],
	['ui/marquee/ui-marquee.css', MEDIA_ONLY], ['ui/play/ui-play.css', MEDIA_ONLY],
	['ui/base/carousel.css', MEDIA_ONLY], ['ui/base/stagger.css', MEDIA_ONLY],
	['layout/core/base.css', ALL]
];

const NEEDLE = /\[(media|content|variant)([*~])=("([^"]*)"|'([^']*)'|([^\]\s]+))\]/g;

/* every literal spelling an entry can appear as in markup */
const spellings = (name, entry) => {
	const out = new Set();
	const args = Object.entries(entry.args || {});
	const values = args.flatMap(([, list]) => list).filter((value) => !value.includes('<'));
	const aliases = Object.keys(entry.argAliases || {});
	if (entry.bare || !args.length) out.add(name);
	for (const value of [...values, ...aliases]) out.add(`${name}(${value})`);
	if (values.length || aliases.length) out.add(`${name}(`); /* the open-stem needle */
	for (const prefix of entry.cqPrefixes || []) {
		const classes = new Set(entry.cqArgs || []);
		if (entry.bare || !args.length) out.add(`${prefix}:${name}`);
		for (const [cls, list] of args) if (classes.has(cls)) for (const value of list) out.add(`${prefix}:${name}(${value})`);
	}
	return out;
};

const flatten = (group) => Object.entries({ ...group.tokens, ...group.bareFlags });

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

	return errors;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	const errors = lintTokens();
	for (const error of errors) console.error('  ' + error);
	console.log(errors.length ? `tokens lint: ${errors.length} error(s)` : 'tokens lint: ok');
	if (errors.length) process.exit(1);
}
