/* Generates the two artifacts derived from data/tokens.json:
 *   data/tokens.data.js — ES-module mirror (render.js imports it in Node AND the browser,
 *                         where a JSON import would need an import attribute)
 *   tokens.md           — the token reference table
 * Run: node tokens.build.js  (build.js runs it first, then lints, then bundles) */

import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const dir = new URL('.', import.meta.url).pathname;
const SRC = dir + 'data/tokens.json';
const DATA = dir + 'data/tokens.data.js';
const DOC = dir + 'tokens.md';

export const readManifest = () => JSON.parse(readFileSync(SRC, 'utf8'));

/* ── data/tokens.data.js ── */

const writeData = (manifest) => {
	const banner = `/* GENERATED from data/tokens.json by tokens.build.js — do not edit.\n * ES-module mirror of the manifest so render.js can import it without JSON import attributes. */\n`;
	writeFileSync(DATA, `${banner}export default ${JSON.stringify(manifest, null, '\t')};\n`);
	return DATA;
};

/* ── tokens.md ── */

const cell = (value) => String(value).replace(/\|/g, '\\|');
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

export const buildTokens = () => {
	const manifest = readManifest();
	const written = [writeData(manifest), writeDoc(manifest)];
	return { manifest, written };
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	const { manifest, written } = buildTokens();
	for (const [attr, group] of Object.entries(manifest.attributes)) {
		console.log(`${attr.padEnd(8)} ${String(Object.keys(group.tokens).length).padStart(3)} stems  ${String(Object.keys(group.bareFlags).length).padStart(2)} bare flags`);
	}
	console.log('wrote ' + written.map((f) => f.split('/').slice(-2).join('/')).join(', '));
}
