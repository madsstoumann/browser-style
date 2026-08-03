/* Generates everything derived from data/tokens.json:
 *   data/tokens.data.js — ES-module mirror (render.js imports it in Node AND the browser,
 *                         where a JSON import would need an import attribute)
 *   tokens.md           — the full token reference table
 *   the marker-delimited token tables inside the hand-authored docs
 *                       — ui/card/*.md + ui/reveal/*.md, see "doc injection" below
 * Run: node tokens.build.js  (build.js runs it first, then lints, then bundles) */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const dir = new URL('.', import.meta.url).pathname;
const SRC = dir + 'data/tokens.json';
const DATA = dir + 'data/tokens.data.js';
const DOC = dir + 'docs/tokens.md';
/* Marker-injection scan roots. `dir` itself stays in the list for readme.md and
   AGENTS.md, which live at the package root; everything else moved to docs/.
   A missing root here fails SILENTLY — the tables just stop updating. */
const DOC_DIRS = [dir, dir + 'docs/', dir + '../reveal/'];

export const readManifest = () => JSON.parse(readFileSync(SRC, 'utf8'));

/* ── data/tokens.data.js ── */

const writeData = (manifest) => {
	const banner = `/* GENERATED from data/tokens.json by tokens.build.js — do not edit.\n * ES-module mirror of the manifest so render.js can import it without JSON import attributes. */\n`;
	writeFileSync(DATA, `${banner}export default ${JSON.stringify(manifest, null, '\t')};\n`);
	return DATA;
};

/* ── tokens.md ── */

/* `|` ends a cell; `<n>` / `sh:<custom>` placeholders would parse as HTML tags */
const cell = (value) => String(value).replace(/\|/g, '\\|').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const list = (values) => (values?.length ? values.join(' ') : '—');

/* "pos: ts tc te · hue: red blue" */
const argCell = (args) => {
	const classes = Object.entries(args || {});
	return classes.length ? classes.map(([cls, values]) => `**${cls}** ${values.join(' ')}`).join(' · ') : '—';
};

const aliasCell = (aliases) => {
	const pairs = Object.entries(aliases || {});
	return pairs.length ? pairs.map(([from, to]) => `${from}→${to}`).join(' ') : '—';
};

const jsCell = (requiresJs) => {
	const pairs = Object.entries(requiresJs || {});
	if (!pairs.length) return '—';
	/* one module for every arg → collapse to the module name */
	const modules = [...new Set(pairs.map(([, module]) => module))];
	return modules.length === 1 && typeof modules[0] === 'string'
		? `${modules[0]} (${pairs.map(([arg]) => arg).join(' ')})`
		: pairs.map(([arg, module]) => `${arg}:${module}`).join(' ');
};

const cqCell = (entry) => (entry.cqPrefixes?.length
	? `${entry.cqPrefixes.map((p) => p + ':').join(' ')}${entry.cqArgs?.length ? ` (${entry.cqArgs.join(' ')})` : ''}`
	: '—');

const row = (name, entry, bare) => [
	`\`${name}${Object.keys(entry.args || {}).length ? '()' : ''}\``,
	entry.axis,
	argCell(entry.args),
	aliasCell(entry.argAliases),
	bare || entry.bare ? 'yes' : '—',
	list(entry.writes),
	cqCell(entry),
	list(entry.hosts),
	jsCell(entry.requiresJs),
	entry.deprecated ? `yes → \`${entry.canonical}\`` : '—'
].map(cell).join(' | ');

const HEAD = '| token | axis | args | aliases | bare | writes | md:/lg: | hosts | requiresJs | deprecated |\n|---|---|---|---|---|---|---|---|---|---|';

const writeDoc = (manifest) => {
	const out = [
		'<!-- GENERATED from data/tokens.json by build.js — do not edit -->',
		'',
		'# Card token reference',
		'',
		'Every `media=`, `variant=` and `content=` token the card system implements, as declared in',
		'`data/tokens.json` (the manifest `render.js`, the lint and this page all read). `matching`',
		'tells you whether the CSS needles are whole-token (`~=`) or substring (`*=`); `writes` lists',
		'the custom properties or real properties a token sets; `hosts` the elements the token may',
		'sit on. Notes below each table carry the per-token caveats.',
		''
	];
	for (const [attr, group] of Object.entries(manifest.attributes)) {
		const entries = [...Object.entries(group.tokens), ...Object.entries(group.bareFlags).map(([n, e]) => [n, e, true])];
		out.push(`## \`${attr}=\``, '', `${Object.keys(group.tokens).length} stems · ${Object.keys(group.bareFlags).length} bare flags`, '', HEAD);
		for (const [name, entry, bare] of entries) out.push(`| ${row(name, entry, bare)} |`);
		out.push('', '### Notes', '');
		for (const [name, entry] of entries) {
			out.push(`**\`${name}\`** *(${entry.matching}-matched${entry.selfArm ? ', self arm' : ''})* — ${entry.notes}`);
			out.push(`<sub>${entry.sources.join(' · ')}</sub>`, '');
		}
	}
	writeFileSync(DOC, out.join('\n'));
	return DOC;
};

/* ── doc injection ───────────────────────────────────────────────────────────
 * A hand-authored doc marks a table as generated with a marker pair:
 *
 *   <!-- tokens:matrix attr=media stems=chip,sticker -->
 *   … regenerated on every build …
 *   <!-- /tokens -->
 *
 * Everything between the two comments is replaced from the manifest, so an
 * inventory table can never drift from the CSS again. The block TYPES are
 * generic (never per-document) — a new table is a new marker, not new code:
 *
 *   summary  one row per token — args · aliases · bare · writes · md:/lg: · deprecated
 *   args     one row per (token × arg class) — the value vocabulary of a few stems
 *   matrix   rows = tokens, columns = arg classes — per-element support matrices
 *   aliases  every deprecated spelling (arg alias or whole token) → its canonical
 *
 * Options are `key=value`, space separated:
 *   attr     required — one attribute, or a comma list (`aliases` only)
 *   stems    optional — comma list of token names; default = every token on the attribute
 *   classes  optional (`matrix`) — comma list of arg classes; default = the union, in
 *            first-appearance order
 * Prose stays hand-written: only the table between the markers is generated. */

const MARKER = /(<!-- tokens:([a-z]+)((?: +[a-z]+=[^\s>]+)*) *-->)[\s\S]*?(<!-- \/tokens -->)/g;

const flatten = (group) => ({ ...group.tokens, ...group.bareFlags });

const options = (raw) => Object.fromEntries([...raw.matchAll(/([a-z]+)=([^\s]+)/g)].map(([, k, v]) => [k, v]));

const groupOf = (manifest, attr) => {
	const group = manifest.attributes[attr];
	if (!group) throw new Error(`tokens: no such attribute "${attr}="`);
	return group;
};

/* the [name, entry] pairs a block operates on, in manifest order unless stems= reorders them */
const select = (manifest, opt) => {
	const all = flatten(groupOf(manifest, opt.attr));
	if (!opt.stems) return Object.entries(all);
	return opt.stems.split(',').map((name) => {
		if (!(name in all)) throw new Error(`tokens: ${opt.attr}= has no token "${name}"`);
		return [name, all[name]];
	});
};

const stem = (name, entry) => `\`${name}${Object.keys(entry.args || {}).length ? '()' : ''}\``;
const spelling = (name, arg) => `\`${name}(${arg})\``;

const table = (head, rows) => [
	`| ${head.join(' | ')} |`,
	`|${head.map(() => '---').join('|')}|`,
	...rows.map((cells) => `| ${cells.map(cell).join(' | ')} |`)
];

const BLOCKS = {
	summary: (manifest, opt) => table(
		['token', 'axis', 'args', 'aliases', 'bare', 'writes', 'md:/lg:', 'deprecated'],
		select(manifest, opt).map(([name, entry]) => [
			stem(name, entry), entry.axis, argCell(entry.args), aliasCell(entry.argAliases),
			entry.bare ? 'yes' : '—', list(entry.writes), cqCell(entry),
			entry.deprecated ? `yes → \`${entry.canonical}\`` : '—'
		])
	),

	args: (manifest, opt) => table(
		['token', 'arg class', 'values', 'aliases'],
		select(manifest, opt).flatMap(([name, entry]) => {
			const classes = Object.entries(entry.args || {});
			if (!classes.length) return [[stem(name, entry), '*(bare flag)*', '—', '—']];
			return classes.map(([cls, values]) => [
				stem(name, entry), `**${cls}**`, values.join(' '),
				list(Object.entries(entry.argAliases || {}).filter(([, to]) => values.includes(to)).map(([from, to]) => `${from}→${to}`))
			]);
		})
	),

	matrix: (manifest, opt) => {
		const entries = select(manifest, opt);
		const classes = opt.classes
			? opt.classes.split(',')
			: [...new Set(entries.flatMap(([, entry]) => Object.keys(entry.args || {})))];
		return table(
			['token', ...classes, 'deprecated aliases'],
			entries.map(([name, entry]) => [
				stem(name, entry),
				...classes.map((cls) => list(entry.args?.[cls])),
				aliasCell(entry.argAliases)
			])
		);
	},

	aliases: (manifest, opt) => {
		const rows = [];
		for (const attr of opt.attr.split(',')) {
			const all = flatten(groupOf(manifest, attr));
			const names = opt.stems ? opt.stems.split(',') : Object.keys(all);
			for (const name of names) {
				const entry = all[name];
				if (!entry) throw new Error(`tokens: ${attr}= has no token "${name}"`);
				if (entry.deprecated) {
					const canonical = all[entry.canonical];
					rows.push([stem(name, entry), canonical ? stem(entry.canonical, canonical) : `\`${entry.canonical}\``, `\`${attr}=\``, 'whole token']);
				}
				for (const [from, to] of Object.entries(entry.argAliases || {}))
					rows.push([spelling(name, from), spelling(name, to), `\`${attr}=\``, 'arg']);
			}
		}
		return table(['deprecated', 'canonical', 'on', 'kind'], rows);
	}
};

const render = (manifest, type, raw) => {
	const block = BLOCKS[type];
	if (!block) throw new Error(`tokens: unknown block type "${type}" (have: ${Object.keys(BLOCKS).join(', ')})`);
	const opt = options(raw);
	if (!opt.attr) throw new Error(`tokens:${type} needs an attr= option`);
	return block(manifest, opt).join('\n');
};

const injectDocs = (manifest) => {
	const written = [];
	for (const folder of DOC_DIRS) {
		for (const file of readdirSync(folder).filter((f) => f.endsWith('.md')).sort()) {
			const path = folder + file;
			const source = readFileSync(path, 'utf8');
			if (!source.includes('<!-- tokens:')) continue;
			const next = source.replace(MARKER, (_, open, type, raw, close) =>
				`${open}\n${render(manifest, type, raw)}\n${close}`);
			if (next === source) continue;
			writeFileSync(path, next);
			written.push(path);
		}
	}
	return written;
};

export const buildTokens = () => {
	const manifest = readManifest();
	const written = [writeData(manifest), writeDoc(manifest), ...injectDocs(manifest)];
	return { manifest, written };
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	const { manifest, written } = buildTokens();
	for (const [attr, group] of Object.entries(manifest.attributes)) {
		console.log(`${attr.padEnd(8)} ${String(Object.keys(group.tokens).length).padStart(3)} stems  ${String(Object.keys(group.bareFlags).length).padStart(2)} bare flags`);
	}
	console.log('wrote ' + written.map((f) => f.split('/').slice(-2).join('/')).join(', '));
}
