/**
 * fillText(text, data, { format }) → text with {values.x}, {vars.x}, {context.x} and {facts.x} filled in.
 * A placeholder that reads nothing becomes empty. `format(value, path)` turns a value into text (numbers, dates).
 */

import { getPath } from './logic.js';

export const PLACEHOLDER_ROOTS = ['values', 'vars', 'context', 'facts'];
const PLACEHOLDER = /\{\{|\}\}|\{((?:values|vars|context|facts)\.[\w.-]+)\}/g;

const plain = value => (Array.isArray(value) ? value.join(', ') : typeof value === 'boolean' ? (value ? 'yes' : 'no') : String(value));

export function fillText(text, data = {}, { format = plain } = {}) {
	if (typeof text !== 'string') return text;
	return text.replace(PLACEHOLDER, (match, path) => {
		if (match === '{{') return '{';
		if (match === '}}') return '}';
		const value = getPath(data, path);
		return value === null || value === undefined || value === '' ? '' : format(value, path);
	});
}

/* Every path a text reads, for validation. */
export function placeholdersOf(text) {
	return typeof text === 'string' ? [...text.matchAll(PLACEHOLDER)].map(match => match[1]).filter(Boolean) : [];
}
