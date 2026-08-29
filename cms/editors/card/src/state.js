/* Pure state helpers for <editor-card> — no DOM, unit-tested by roundtrip.test.js.
 * The round-trip contract: value in → value out unchanged until the user edits a field.
 * Unknown keys pass through untouched; keys are only written on user action; a cleared
 * field deletes its key unless the loaded payload carried it explicitly. */

import { SCHEMA_TYPE_GROUPS } from './details.data.js';

const TYPE_KEYS = new Set(SCHEMA_TYPE_GROUPS.flatMap((group) => group.options.map((o) => o.value)));

export const esc = (value) => String(value ?? '')
	.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
	.replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/* Envelope keys of the card model — used only to split a LEGACY flat payload
   ({type, article: {...}, media: …}) into what belongs beside details. */
const LEGACY_ENVELOPE = new Set(['type', 'schemaType', 'details']);

/* Accepts an object or a JSON string; returns { schemaType, details }.
 * Current payloads: { schemaType, details }.
 * Legacy payloads ({ type, …rest } — the pre-details editor): the type is adopted when it
 * is a known schemaType, and everything else is preserved VERBATIM under details so no
 * data is lost (legacy nested shapes map to no panel fields, but they round-trip). */
export const parseValue = (input) => {
	let parsed = input;
	if (typeof input === 'string') {
		if (!input.trim()) return { schemaType: '', details: {} };
		try { parsed = JSON.parse(input); } catch { return null; }
	}
	if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { schemaType: '', details: {} };
	if ('schemaType' in parsed || 'details' in parsed) {
		const schemaType = TYPE_KEYS.has(parsed.schemaType) ? parsed.schemaType : '';
		const details = parsed.details && typeof parsed.details === 'object' && !Array.isArray(parsed.details) ? parsed.details : {};
		return { schemaType, details };
	}
	if ('type' in parsed) {
		const schemaType = TYPE_KEYS.has(parsed.type) ? parsed.type : '';
		const details = {};
		for (const [key, value] of Object.entries(parsed)) if (!LEGACY_ENVELOPE.has(key)) details[key] = value;
		return { schemaType, details };
	}
	return { schemaType: '', details: parsed };
};

export const serializeValue = (schemaType, details) => JSON.stringify({ schemaType, details });

/* dot/index path helpers — "salaryRange.min", "offers.2.price". New keys append,
   existing keys update in place, so the original key order survives. */
const parts = (path) => String(path).split('.');

export const getPath = (data, path) => {
	let current = data;
	for (const key of parts(path)) {
		if (current == null) return undefined;
		current = current[key];
	}
	return current;
};

export const setPath = (data, path, value) => {
	const keys = parts(path);
	let current = data;
	for (let i = 0; i < keys.length - 1; i++) {
		const key = keys[i];
		if (current[key] == null || typeof current[key] !== 'object') {
			current[key] = /^\d+$/.test(keys[i + 1]) ? [] : {};
		}
		current = current[key];
	}
	current[keys[keys.length - 1]] = value;
	return data;
};

export const deletePath = (data, path) => {
	const keys = parts(path);
	let current = data;
	for (let i = 0; i < keys.length - 1; i++) {
		current = current?.[keys[i]];
		if (current == null || typeof current !== 'object') return data;
	}
	const last = keys[keys.length - 1];
	if (Array.isArray(current)) current.splice(Number(last), 1);
	else delete current[last];
	/* prune now-empty ancestors the edit itself created */
	if (keys.length > 1) {
		const parent = getPath(data, keys.slice(0, -1).join('.'));
		if (parent && typeof parent === 'object' && !Array.isArray(parent) && !Object.keys(parent).length)
			deletePath(data, keys.slice(0, -1).join('.'));
	}
	return data;
};

/* what the Add button appends for an array field spec */
export const emptyItemFor = (items) => {
	if (!items) return '';
	if (items.fields && !items.scalar) return {};
	return '';
};
