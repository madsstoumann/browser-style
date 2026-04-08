/**
 * Fallback for CSS typed attr() — sets custom properties from attributes
 * when the browser doesn't support attr(name type(<T>), fallback).
 * @param {Record<string, Record<string, string | [string, string]>>} rules
 *   { selector: { '--prop': 'attr' } } or { '--prop': ['attr', 'default'] }
 */
let supported;

function isTypedAttrSupported() {
	if (supported !== undefined) return supported;
	const el = document.createElement('div');
	el.dataset.t = '1';
	el.style.setProperty('--t', 'attr(data-t type(<number>), 0)');
	document.body.append(el);
	supported = getComputedStyle(el).getPropertyValue('--t').trim() === '1';
	el.remove();
	return supported;
}

export default function attrFallback(rules) {
	if (isTypedAttrSupported()) return;
	for (const [selector, attrs] of Object.entries(rules)) {
		for (const el of document.querySelectorAll(selector)) {
			for (const [prop, mapping] of Object.entries(attrs)) {
				const [attr, fallback] = Array.isArray(mapping) ? mapping : [mapping];
				const val = el.getAttribute(attr);
				if (val != null) el.style.setProperty(prop, val || fallback);
			}
		}
	}
}
