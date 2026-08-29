/* Generates everything derived from data/details.json (the per-type `details` manifest):
 *   ../../cms/editors/card/src/details.data.js — the editor's schemas + materialized lookups
 *   the schemaType options + details digest inside cms/baseline/models/card.schema.json
 *   the marker-delimited per-type tables inside the hand-authored docs (<!-- details:… -->)
 * Run: node ui/card/details.build.js  (idempotent — a second run is a no-op). Lint: details.lint.js */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import * as R from './render.js';
import { ICON_NAMES } from '../icon/icons.data.js';

const dir = new URL('.', import.meta.url).pathname;
const SRC = dir + 'data/details.json';
const DATA = dir + '../../cms/editors/card/src/details.data.js';
const SCHEMA = dir + '../../cms/baseline/models/card.schema.json';
/* marker-injection scan roots — a missing root fails SILENTLY (tables stop updating) */
const DOC_DIRS = [dir, dir + 'docs/', dir + '../../cms/editors/card/'];

export const readManifest = () => JSON.parse(readFileSync(SRC, 'utf8'));

/* ── lookups ── */

/* label overrides where spaceCamel() reads badly; everything else is derived */
const HAND_LABELS = {
	BOOK_FORMATS: { EBook: 'E-book', AudiobookFormat: 'Audiobook', GraphicNovel: 'Graphic novel' },
	TIER_BENEFITS: { TierBenefitLoyaltyPoints: 'Loyalty points', TierBenefitLoyaltyPrice: 'Member price', TierBenefitLoyaltyReturns: 'Free returns', TierBenefitLoyaltyShipping: 'Free shipping' },
	ITEM_LIST_ORDERS: { ItemListOrderAscending: 'Ascending', ItemListOrderDescending: 'Descending', ItemListUnordered: 'Unordered' },
	ALBUM_RELEASE_TYPES: { AlbumRelease: 'Album', BroadcastRelease: 'Broadcast', EPRelease: 'EP', SingleRelease: 'Single' },
	ALBUM_PRODUCTION_TYPES: { DJMixAlbum: 'DJ mix' }
};

const spaceCamel = (value) => String(value)
	.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
	.replace(/^([A-Z])(.*)$/, (_, first, rest) => first + rest.toLowerCase());

const stripSuffix = { RESTRICTED_DIETS: 'Diet', ALBUM_PRODUCTION_TYPES: 'Album' };

const labelFor = (name, value) => HAND_LABELS[name]?.[value]
	?? spaceCamel(stripSuffix[name] ? String(value).replace(new RegExp(stripSuffix[name] + '$'), '') : value);

const toOptions = (name, values, labels = null) =>
	values.map((value) => ({ value, label: labels?.[value] ?? labelFor(name, value) }));

/* every lookup name a field may reference → [{value, label}] */
export const resolveLookups = (manifest) => {
	const lookups = {};
	const resolve = (name) => {
		if (lookups[name]) return;
		if (name.startsWith('SUBTYPES.')) {
			const family = name.slice('SUBTYPES.'.length);
			const set = R.SUBTYPES[family];
			if (!set) throw new Error(`details: no SUBTYPES family "${family}"`);
			lookups[name] = toOptions(name, [...set]);
			return;
		}
		if (manifest.vocab?.[name]) { lookups[name] = toOptions(name, manifest.vocab[name]); return; }
		if (name === 'ICON_NAMES') { lookups[name] = ICON_NAMES.map((value) => ({ value, label: value })); return; }
		const source = R[name];
		if (source instanceof Set) { lookups[name] = toOptions(name, [...source]); return; }
		if (Array.isArray(source)) { lookups[name] = toOptions(name, source); return; }
		if (source && typeof source === 'object') {
			/* FILE_TYPES carries its own labels; QUIZ_FORMATS / MEDICAL_ASPECTS are keyed maps */
			const labels = Object.fromEntries(Object.entries(source).map(([k, v]) => [k, v?.label ?? labelFor(name, k)]));
			lookups[name] = toOptions(name, Object.keys(source), labels);
			return;
		}
		throw new Error(`details: lookup "${name}" resolves to neither render.js, ICON_NAMES nor manifest vocab`);
	};
	const walk = (field) => {
		if (!field || typeof field !== 'object') return;
		if (field.lookup) resolve(field.lookup);
		for (const sub of Object.values(field.fields || {})) walk(sub);
		if (field.items) walk(field.items);
	};
	const walkShape = (shape) => { for (const sub of Object.values(shape.fields || {})) walk(sub); };
	for (const shape of Object.values(manifest.shapes)) walkShape(shape);
	for (const type of Object.values(manifest.types)) for (const field of Object.values(type.fields)) walk(field);
	for (const field of Object.values(manifest.injected)) walk(field);
	return lookups;
};

/* ── field resolution (shapes inlined, control defaults applied) ── */

const CONTROL_DEFAULTS = {
	string: 'text', text: 'textarea', number: 'number', boolean: 'toggle',
	date: 'date', datetime: 'datetime', url: 'url', select: 'select',
	object: 'fieldset', array: 'repeater'
};

const resolveField = (field, shapes) => {
	const out = { ...field };
	if (!out.control && out.type) out.control = CONTROL_DEFAULTS[out.type] ?? 'text';
	if (out.shape) {
		const shape = shapes[out.shape];
		if (!shape) throw new Error(`details: no shape "${out.shape}"`);
		out.fields = shape.fields;
		if (shape.scalar) out.scalar = shape.scalar;
		delete out.shape;
	}
	if (out.fields) out.fields = Object.fromEntries(Object.entries(out.fields).map(([k, f]) => [k, resolveField(f, shapes)]));
	if (out.items) {
		const items = { ...out.items };
		if (items.shape) {
			const shape = shapes[items.shape];
			if (!shape) throw new Error(`details: no shape "${items.shape}"`);
			items.fields = shape.fields;
			if (shape.scalar) items.scalar = shape.scalar;
			delete items.shape;
		}
		out.items = resolveField(items, shapes);
	}
	return out;
};

export const buildDetails = (manifest = readManifest()) => {
	const lookups = resolveLookups(manifest);
	const groups = manifest.groups.map((label) => ({
		label,
		options: Object.entries(manifest.types)
			.filter(([, type]) => type.group === label)
			.map(([value, type]) => ({ value, label: type.label }))
	}));
	const schemas = Object.fromEntries(Object.entries(manifest.types).map(([key, type]) => [
		key,
		Object.fromEntries(Object.entries(type.fields).map(([k, f]) => [k, resolveField(f, manifest.shapes)]))
	]));
	const flags = {
		paywalled: [...R.PAYWALL_TYPES],
		subtype: Object.fromEntries(Object.keys(R.SUBTYPES).map((family) => [family, `SUBTYPES.${family}`])),
		subheadline: Object.entries(manifest.types).filter(([, t]) => t.claimsSubheadline).map(([k]) => k),
		envelopeOnly: Object.keys(manifest.types).filter((k) => !(k in R.DETAILS))
	};
	const injected = Object.fromEntries(Object.entries(manifest.injected).map(([k, f]) => {
		const { appliesTo, ...field } = f;
		return [k, { ...resolveField(field, manifest.shapes), appliesTo }];
	}));
	return { manifest, lookups, groups, schemas, flags, injected };
};

/* ── cms/editors/card/src/details.data.js ── */

const renderData = ({ groups, schemas, lookups, flags, injected }) => {
	const banner = `/* GENERATED from ui/card/data/details.json by ui/card/details.build.js — do not edit.
 * The card editor's per-type form schemas: shapes inlined, control defaults applied,
 * lookup vocabularies materialized from render.js / icons.data.js / the manifest. */\n`;
	const block = (name, value) => `export const ${name} = ${JSON.stringify(value, null, '\t')};\n`;
	return banner
		+ block('SCHEMA_TYPE_GROUPS', groups)
		+ block('DETAILS_SCHEMAS', schemas)
		+ block('LOOKUPS', lookups)
		+ block('TYPE_FLAGS', flags)
		+ block('INJECTED', injected);
};

const writeData = (build) => { writeFileSync(DATA, renderData(build)); return DATA; };

/* ── cms/baseline/models/card.schema.json (schemaType options + details digest) ── */

const compactField = (key, field) => {
	if (field.fields && field.type === 'object') return `${key}{${Object.keys(field.fields).join(',')}}`;
	if (field.type === 'array') {
		if (field.items?.fields) return `${key}[]{${Object.keys(field.items.fields).join(',')}}`;
		return `${key}[]`;
	}
	return key;
};

export const detailsDigest = (manifest) => {
	const lines = Object.entries(manifest.types).map(([key, type]) => {
		const fields = Object.entries(type.fields).map(([k, f]) => compactField(k, resolveField(f, manifest.shapes)));
		return `${key}: ${fields.length ? fields.join(' · ') : '—'}`;
	});
	return 'One object per card, discriminated by schemaType. The machine contract is ui/card/data/details.json '
		+ '(per-type fields, controls and lookup vocabularies — regenerated into the card editor by ui/card/details.build.js); '
		+ 'the editor-facing reference is ui/card/docs/card.model.md § Per-type details. '
		+ 'details.subtype (allowlisted schema.org subtype) exists for exactly the SUBTYPES families in render.js: '
		+ Object.keys(R.SUBTYPES).join(', ') + '. '
		+ 'details.paywalled (boolean) is accepted on every type whose itemtype is a CreativeWork, Event or Place (PAYWALL_TYPES in render.js) and emits isAccessibleForFree: False. '
		+ 'Keys ending in "Display" are presentation twins and emit no microdata. Per-type keys, compact: '
		+ lines.join(' | ');
};

/* Targeted splice — a parse→stringify round-trip reformats the whole file (inline arrays
   explode), so only the two generated values are replaced; everything else keeps its bytes. */

const matchBracket = (source, start) => {
	let depth = 0, inString = false;
	for (let i = start; i < source.length; i++) {
		const ch = source[i];
		if (inString) { if (ch === '\\') i++; else if (ch === '"') inString = false; continue; }
		if (ch === '"') inString = true;
		else if (ch === '[') depth++;
		else if (ch === ']' && --depth === 0) return i;
	}
	throw new Error('details: unbalanced bracket in card.schema.json');
};

const endOfString = (source, start) => {
	for (let i = start + 1; i < source.length; i++) {
		if (source[i] === '\\') i++;
		else if (source[i] === '"') return i;
	}
	throw new Error('details: unterminated string in card.schema.json');
};

const writeCardSchema = (manifest) => {
	const original = readFileSync(SCHEMA, 'utf8');
	let source = original;

	const typeAnchor = source.indexOf('"schemaType": {');
	const optAnchor = source.indexOf('"options": [', typeAnchor);
	if (typeAnchor < 0 || optAnchor < 0) throw new Error('details: schemaType.options not found in card.schema.json');
	const arrStart = source.indexOf('[', optAnchor);
	const arrEnd = matchBracket(source, arrStart);
	const baseIndent = source.slice(source.lastIndexOf('\n', optAnchor) + 1).match(/^\s*/)[0];
	const entries = Object.entries(manifest.types)
		.map(([value, type]) => `${baseIndent}  { "value": ${JSON.stringify(value)}, "label": ${JSON.stringify(type.label)} }`);
	source = source.slice(0, arrStart) + `[\n${entries.join(',\n')}\n${baseIndent}]` + source.slice(arrEnd + 1);

	const detailsAnchor = source.indexOf('"details": {');
	const descAnchor = source.indexOf('"description": "', detailsAnchor);
	if (detailsAnchor < 0 || descAnchor < 0) throw new Error('details: details.description not found in card.schema.json');
	const strStart = source.indexOf('"', descAnchor + '"description": '.length);
	const strEnd = endOfString(source, strStart);
	source = source.slice(0, strStart) + JSON.stringify(detailsDigest(manifest)) + source.slice(strEnd + 1);

	if (source !== original) writeFileSync(SCHEMA, source);
	return SCHEMA;
};

/* ── doc injection ───────────────────────────────────────────────────────────
 * Same contract as tokens.build.js: a hand-authored doc marks a generated table with
 *
 *   <!-- details:fields type=product -->
 *   … regenerated on every build …
 *   <!-- /details -->
 *
 * Block types (generic — a new table is a new marker, not new code):
 *   fields       one per-type table: Key | Type | Control | Lookup / notes (option: type=)
 *   lookups      the render.js/vocab lookup table: Name | Used by | Values
 *   subheadline  the claimsSubheadline types and the fields that fill the envelope slot
 *   counts       the envelope-only / detailed type counts paragraph
 * Prose stays hand-written: only the block between the markers is generated. */

const MARKER = /(<!-- details:([a-z]+)((?: +[a-z]+=[^\s>]+)*) *-->)[\s\S]*?(<!-- \/details -->)/g;

const cell = (value) => String(value).replace(/\|/g, '\\|').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const table = (head, rows) => [
	`| ${head.join(' | ')} |`,
	`|${head.map(() => '---').join('|')}|`,
	...rows.map((cells) => `| ${cells.map(cell).join(' | ')} |`)
].join('\n');

const fieldNotes = (field) => {
	const notes = [];
	if (field.lookup) notes.push(field.lookup.startsWith('SUBTYPES.') || field.lookup === field.lookup.toUpperCase() ? field.lookup : field.lookup);
	if (field.display) notes.push('display twin');
	if (field.requires) notes.push(`only when \`${field.requires}\``);
	if (field.scalar || field.items?.scalar) notes.push('string items allowed');
	if (field.items?.fields) notes.push(`{${Object.keys(field.items.fields).join(', ')}}`);
	else if (field.fields) notes.push(`{${Object.keys(field.fields).join(', ')}}`);
	if (field.note) notes.push(field.note);
	return notes.join(' · ');
};

/* which types reach a lookup, shapes included */
const lookupUsers = (manifest) => {
	const users = {};
	const mark = (name, type) => { (users[name] ??= new Set()).add(type); };
	const walk = (field, type, shapes) => {
		if (!field || typeof field !== 'object') return;
		if (field.lookup) mark(field.lookup, type);
		if (field.shape) walk(shapes[field.shape], type, shapes);
		for (const sub of Object.values(field.fields || {})) walk(sub, type, shapes);
		if (field.items) walk(field.items, type, shapes);
	};
	for (const [type, def] of Object.entries(manifest.types))
		for (const field of Object.values(def.fields)) walk(field, type, manifest.shapes);
	return users;
};

const BLOCKS = {
	fields: (build, opt) => {
		const type = build.manifest.types[opt.type];
		if (!type) throw new Error(`details: no such type "${opt.type}"`);
		const fields = build.schemas[opt.type];
		if (!Object.keys(fields).length) return '*Envelope-only — no type-specific fields.*';
		return table(
			['Key', 'Type', 'Control', 'Lookup / notes'],
			Object.entries(fields).map(([key, field]) => [`\`${key}\``, field.type, field.control, fieldNotes(field)])
		);
	},

	lookups: (build) => {
		const users = lookupUsers(build.manifest);
		return table(
			['Name', 'Used by', 'Values'],
			Object.entries(build.lookups)
				.filter(([name]) => !name.startsWith('SUBTYPES.'))
				.map(([name, options]) => [
					`\`${name}\``,
					[...(users[name] ?? [])].join(' '),
					name === 'ICON_NAMES' || name === 'MEDICAL_SPECIALTIES'
						? `${options.length} values — read from the generated LOOKUPS`
						: options.map((o) => `\`${o.value}\``).join(' ')
				])
		);
	},

	subheadline: (build) => table(
		['schemaType', 'Fields filling the envelope subheadline'],
		build.flags.subheadline.map((type) => [
			`\`${type}\``,
			Object.entries(build.schemas[type]).filter(([, f]) => /subheadline/.test(f.note || '')).map(([k]) => `\`${k}\``).join(' ')
		])
	),

	counts: (build) => {
		const envelopeOnly = build.flags.envelopeOnly;
		const detailed = Object.keys(build.manifest.types).length - envelopeOnly.length;
		return `**${envelopeOnly.length} types are envelope-only** — no \`DETAILS\` renderer: ${envelopeOnly.map((t) => `\`${t}\``).join(', ')} `
			+ `(\`article\` and \`news\` still accept \`details.subtype\`, and every PAYWALL_TYPES member accepts \`details.paywalled\`). `
			+ `The remaining **${detailed}** are below.`;
	}
};

const options = (raw) => Object.fromEntries([...raw.matchAll(/([a-z]+)=([^\s]+)/g)].map(([, k, v]) => [k, v]));

const injectDocs = (build) => {
	const written = [];
	for (const folder of DOC_DIRS) {
		for (const file of readdirSync(folder).filter((f) => f.endsWith('.md')).sort()) {
			const path = folder + file;
			const source = readFileSync(path, 'utf8');
			if (!source.includes('<!-- details:')) continue;
			const next = source.replace(MARKER, (_, open, type, raw, close) => {
				const block = BLOCKS[type];
				if (!block) throw new Error(`details: unknown block type "${type}" (have: ${Object.keys(BLOCKS).join(', ')})`);
				return `${open}\n${block(build, options(raw))}\n${close}`;
			});
			if (next === source) continue;
			writeFileSync(path, next);
			written.push(path);
		}
	}
	return written;
};

export const build = () => {
	const built = buildDetails();
	const written = [writeData(built), writeCardSchema(built.manifest), ...injectDocs(built)];
	return { built, written };
};

/* exported for details.lint.js rule 9 (committed file ⇔ in-memory rebuild) */
export const renderDataFile = () => renderData(buildDetails());

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	const { built, written } = build();
	const detailed = Object.keys(built.manifest.types).length - built.flags.envelopeOnly.length;
	console.log(`${Object.keys(built.manifest.types).length} types (${detailed} with details) · ${Object.keys(built.lookups).length} lookups · ${built.groups.length} groups`);
	console.log('wrote ' + written.map((f) => f.split('/').slice(-3).join('/')).join(', '));
}
