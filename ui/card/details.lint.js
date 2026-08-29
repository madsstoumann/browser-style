/* Lints data/details.json (the per-type `details` manifest) against render.js and the corpus.
 * Ten rules — 1-9 are errors (exit 1), 10 is advisory (warnings only):
 *   1 manifest types ⇔ SCHEMA_TYPES, both directions + order; groups sane
 *   2 subtype fields ⇔ SUBTYPES families, each ref naming its own type
 *   3 every lookup / appliesTo / shape reference resolves; no orphan shapes
 *   4 envelope-only manifest types ⇔ types without a DETAILS renderer
 *   5 claimsSubheadline ⇔ SUBHEADLINE_SLOT; injected paywalled ⇔ PAYWALL_TYPES
 *   6 corpus walk: every details key in every data/*.json instance is declared, kinds match
 *   7 *Display naming ⇔ display flags; missing machine base without noBase = warning
 *   8 card.schema.json schemaType options + counts in sync
 *   9 the committed details.data.js ⇔ an in-memory rebuild
 *  10 advisory: keys each DETAILS renderer reads but the manifest lacks; group ⇔ schema.html
 * Run: node ui/card/details.lint.js  (details.build.js first — rule 9 compares its output) */

import { readdirSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import * as R from './render.js';
import { readManifest, buildDetails, renderDataFile } from './details.build.js';

const dir = new URL('.', import.meta.url).pathname;
const DATA_FILE = dir + '../../cms/editors/card/src/details.data.js';
const SCHEMA = dir + '../../cms/baseline/models/card.schema.json';
const PAGE = dir + 'demo/schema.html';

const errors = [];
const warnings = [];
const err = (rule, message) => errors.push(`[${rule}] ${message}`);
const warn = (rule, message) => warnings.push(`[${rule}] ${message}`);

const manifest = readManifest();
const built = buildDetails(manifest);
const types = manifest.types;

/* ── 1 · type roster ── */
{
	const manifestKeys = Object.keys(types);
	const renderKeys = Object.keys(R.SCHEMA_TYPES);
	for (const key of renderKeys) if (!(key in types)) err(1, `SCHEMA_TYPES.${key} missing from the manifest`);
	for (const key of manifestKeys) if (!(key in R.SCHEMA_TYPES)) err(1, `manifest type "${key}" is not in SCHEMA_TYPES`);
	if (manifestKeys.join() !== renderKeys.join()) err(1, 'manifest type order differs from SCHEMA_TYPES order');
	for (const [key, type] of Object.entries(types)) {
		if (!manifest.groups.includes(type.group)) err(1, `${key}: group "${type.group}" is not in groups[]`);
		if (!type.label) err(1, `${key}: missing label`);
	}
	for (const group of manifest.groups)
		if (!Object.values(types).some((t) => t.group === group)) err(1, `group "${group}" has no types`);
}

/* ── 2 · subtypes ── */
{
	const declared = Object.entries(types).filter(([, t]) => t.fields.subtype).map(([k]) => k);
	const families = Object.keys(R.SUBTYPES);
	for (const family of families) if (!declared.includes(family)) err(2, `SUBTYPES.${family} exists but the manifest declares no subtype field on "${family}"`);
	for (const key of declared) {
		if (!families.includes(key)) err(2, `"${key}" declares a subtype field but has no SUBTYPES family`);
		const ref = types[key].fields.subtype.lookup;
		if (ref !== `SUBTYPES.${key}`) err(2, `${key}.subtype lookup is "${ref}", expected "SUBTYPES.${key}"`);
	}
}

/* ── 3 · references resolve ── */
{
	const usedShapes = new Set();
	const walk = (field, path) => {
		if (!field || typeof field !== 'object') return;
		if (field.lookup) {
			const name = field.lookup;
			const inVocab = !!manifest.vocab?.[name];
			const inRender = name.startsWith('SUBTYPES.')
				? !!R.SUBTYPES[name.slice(9)]
				: name === 'ICON_NAMES' || R[name] !== undefined;
			if (!inVocab && !inRender) err(3, `${path}: lookup "${name}" resolves nowhere`);
			if (inVocab && inRender && !name.startsWith('SUBTYPES.')) err(3, `${path}: lookup "${name}" resolves in BOTH render.js and vocab`);
		}
		if (field.shape) {
			if (!manifest.shapes[field.shape]) err(3, `${path}: no shape "${field.shape}"`);
			else usedShapes.add(field.shape);
		}
		for (const [k, sub] of Object.entries(field.fields || {})) walk(sub, `${path}.${k}`);
		if (field.items) walk(field.items, `${path}[]`);
	};
	for (const [key, type] of Object.entries(types))
		for (const [k, field] of Object.entries(type.fields)) walk(field, `${key}.${k}`);
	for (const [k, field] of Object.entries(manifest.injected)) walk(field, `injected.${k}`);
	for (const [name, shape] of Object.entries(manifest.shapes))
		for (const [k, field] of Object.entries(shape.fields)) walk(field, `shapes.${name}.${k}`);
	for (const name of Object.keys(manifest.shapes))
		if (!usedShapes.has(name)) err(3, `shape "${name}" is declared but never referenced`);
	if (manifest.injected.paywalled?.appliesTo !== 'PAYWALL_TYPES') err(3, 'injected.paywalled.appliesTo must be "PAYWALL_TYPES"');
}

/* ── 4 · envelope-only ⇔ no DETAILS renderer (subtype-only counts as envelope-only) ── */
{
	for (const [key, type] of Object.entries(types)) {
		const real = Object.keys(type.fields).filter((k) => k !== 'subtype');
		const hasRenderer = key in R.DETAILS;
		if (real.length && !hasRenderer) err(4, `${key}: manifest declares fields but render.js has no DETAILS renderer`);
		if (!real.length && hasRenderer) err(4, `${key}: DETAILS renderer exists but the manifest declares no fields`);
	}
}

/* ── 5 · envelope-modifier flags ── */
{
	const claimed = Object.entries(types).filter(([, t]) => t.claimsSubheadline).map(([k]) => k).sort();
	const slot = Object.keys(R.SUBHEADLINE_SLOT).sort();
	if (claimed.join() !== slot.join()) err(5, `claimsSubheadline types [${claimed}] ≠ SUBHEADLINE_SLOT keys [${slot}]`);
	for (const key of built.flags.paywalled)
		if (!(key in types)) err(5, `PAYWALL_TYPES member "${key}" is not a manifest type`);
}

/* ── 6 · corpus walk ── */
{
	const kindOf = (v) => Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v === 'boolean' ? 'boolean' : typeof v === 'number' ? 'number' : typeof v === 'object' ? 'object' : 'string';
	const KIND_FOR_TYPE = { string: 'string', text: 'string', select: 'string', date: 'string', datetime: 'string', url: 'string', number: 'number', boolean: 'boolean', object: 'object', array: 'array' };
	const checkValue = (field, value, path, file) => {
		if (value === null || field.open) return;
		const allowed = [KIND_FOR_TYPE[field.type] ?? 'string', ...(field.also ?? [])];
		const kind = kindOf(value);
		if (!allowed.includes(kind)) { err(6, `${file} ${path}: ${kind}, manifest says ${allowed.join('|')}`); return; }
		if (kind === 'object' && field.fields) {
			for (const [k, v] of Object.entries(value)) {
				if (!(k in field.fields)) err(6, `${file} ${path}.${k}: key not in manifest`);
				else checkValue(field.fields[k], v, `${path}.${k}`, file);
			}
		}
		if (kind === 'array' && field.items) {
			value.forEach((item, i) => {
				if (typeof item === 'string' && (field.items.scalar || field.items.type)) {
					if (field.items.type && KIND_FOR_TYPE[field.items.type] !== 'string' && !field.items.scalar)
						err(6, `${file} ${path}[${i}]: string item, manifest says ${field.items.type}`);
					return;
				}
				if (field.items.fields && kindOf(item) === 'object') {
					for (const [k, v] of Object.entries(item)) {
						if (!(k in field.items.fields)) err(6, `${file} ${path}[${i}].${k}: key not in manifest`);
						else checkValue(field.items.fields[k], v, `${path}[${i}].${k}`, file);
					}
					return;
				}
				checkValue(field.items, item, `${path}[${i}]`, file);
			});
		}
	};
	const walkCorpus = (folder) => {
		for (const file of readdirSync(dir + folder).filter((f) => f.endsWith('.json')).sort()) {
			let doc;
			try { doc = JSON.parse(readFileSync(dir + folder + file, 'utf8')); } catch { continue; }
			if (doc?.model !== 'card') continue;
			const fields = doc.fields ?? {};
			const details = fields.details;
			if (!details || typeof details !== 'object' || Array.isArray(details)) continue;
			const key = (fields.schemaType in R.SCHEMA_TYPES) ? fields.schemaType : 'content';
			const schema = built.schemas[key];
			for (const [k, v] of Object.entries(details)) {
				if (k === 'paywalled') {
					if (!R.PAYWALL_TYPES.has(key)) err(6, `${folder}${file}: paywalled on "${key}", not a PAYWALL_TYPES member`);
					continue;
				}
				if (k === 'businessType' && key === 'business') continue; /* legacy alias, declared */
				if (!(k in schema)) { err(6, `${folder}${file}: details.${k} not in the manifest for "${key}"`); continue; }
				checkValue(schema[k], v, `details.${k}`, `${folder}${file}:`);
			}
		}
	};
	walkCorpus('data/');
	walkCorpus('data/demo/');
}

/* ── 7 · display-twin discipline ── */
{
	const walk = (fields, path) => {
		for (const [key, field] of Object.entries(fields)) {
			if (key.endsWith('Display') && !field.display) err(7, `${path}.${key}: ends in Display but lacks display: true`);
			if (key.endsWith('Display') && !field.noBase) {
				const base = key.slice(0, -'Display'.length);
				if (!(base in fields)) warn(7, `${path}.${key}: no machine base "${base}" (add noBase: true if intended)`);
			}
			if (field.fields) walk(field.fields, `${path}.${key}`);
			if (field.items?.fields) walk(field.items.fields, `${path}.${key}[]`);
		}
	};
	for (const [key, type] of Object.entries(types)) walk(type.fields, key);
	for (const [name, shape] of Object.entries(manifest.shapes)) walk(shape.fields, `shapes.${name}`);
}

/* ── 8 · card.schema.json in sync ── */
{
	const schema = JSON.parse(readFileSync(SCHEMA, 'utf8'));
	const options = schema.properties?.schemaType?.options ?? [];
	const values = options.map((o) => o.value);
	if (values.join() !== Object.keys(R.SCHEMA_TYPES).join()) err(8, 'card.schema.json schemaType options ≠ SCHEMA_TYPES (run details.build.js)');
	for (const option of options)
		if (types[option.value] && types[option.value].label !== option.label)
			err(8, `card.schema.json label for "${option.value}" ≠ manifest label (run details.build.js)`);
	const top = schema.description ?? '';
	const counts = top.match(/(\d+) schema\.org types \((\d+) itemtypes\)/);
	if (counts) {
		const distinct = new Set(Object.values(R.SCHEMA_TYPES)).size;
		if (Number(counts[1]) !== values.length || Number(counts[2]) !== distinct)
			err(8, `card.schema.json top description says ${counts[1]} types (${counts[2]} itemtypes); actual ${values.length} (${distinct})`);
	}
}

/* ── 9 · generated file in sync ── */
{
	let committed = '';
	try { committed = readFileSync(DATA_FILE, 'utf8'); } catch { /* missing counts as stale */ }
	if (committed !== renderDataFile()) err(9, 'cms/editors/card/src/details.data.js is stale (run details.build.js)');
}

/* ── 10 · advisory ── */
{
	/* keys each DETAILS renderer reads (d.foo) that the manifest does not declare */
	for (const [key, fn] of Object.entries(R.DETAILS)) {
		const reads = new Set([...fn.toString().matchAll(/\bd\.([A-Za-z_$][\w$]*)/g)].map((m) => m[1]));
		for (const read of reads)
			if (!(read in (types[key]?.fields ?? {})) && read !== 'subtype' && read !== 'businessType' && read !== 'paywalled')
				warn(10, `${key}: renderer reads d.${read}, manifest does not declare it`);
	}
	/* each type's group matches a schema.html section holding a root card of its itemtype */
	try {
		const page = readFileSync(PAGE, 'utf8');
		const sections = page.split(/<h2>(.*?)<\/h2>/);
		const keysFor = {};
		for (const [key, itemtype] of Object.entries(R.SCHEMA_TYPES)) (keysFor[itemtype] ??= []).push(key);
		const sectionsOf = {};
		for (let i = 1; i < sections.length; i += 2) {
			const title = sections[i].replace(/&amp;/g, '&');
			for (const match of sections[i + 1].matchAll(/<(?:ui-card|ui-reveal|article|section)\b[^>]*itemtype="https:\/\/schema\.org\/(\w+)"/g)) {
				for (const key of keysFor[match[1]] ?? []) (sectionsOf[key] ??= new Set()).add(title);
			}
		}
		for (const [key, type] of Object.entries(types)) {
			const ambiguous = (keysFor[R.SCHEMA_TYPES[key]] ?? []).length > 1;
			if (ambiguous || !sectionsOf[key]) continue;
			if (!sectionsOf[key].has(type.group))
				warn(10, `${key}: group "${type.group}" but its schema.html cards sit under ${[...sectionsOf[key]].join(' / ')}`);
		}
	} catch { warn(10, 'demo/schema.html not readable — group check skipped'); }
}

for (const line of warnings) console.warn('warn ' + line);
if (errors.length) {
	for (const line of errors) console.error('FAIL ' + line);
	console.error(`${errors.length} error(s), ${warnings.length} warning(s)`);
	process.exit(1);
}
console.log(`details.lint: ok — ${Object.keys(types).length} types, ${warnings.length} warning(s)`);

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) { /* CLI-only file */ }
