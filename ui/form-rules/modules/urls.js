/**
 * safeUrl(value) → the URL, or null when it may not be used as a link or a redirect.
 *
 * Form definitions, service replies and stored entries are data, so a URL from them can be
 * javascript:, data: or anything else a browser would run. Only http(s) and URLs relative to
 * the page pass; whitespace and control characters, which browsers strip before reading the
 * scheme, are refused rather than cleaned.
 */
export function safeUrl(value) {
	if (typeof value !== 'string') return null;
	const url = value.trim();
	if (!url || /[\u0000-\u001F\u007F\s\\]/.test(url)) return null;
	/* A scheme is letters, digits, + - . before the first colon that comes before any / ? # */
	const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(url)?.[1]?.toLowerCase();
	if (scheme === undefined) return url.startsWith('//') ? null : url;
	return scheme === 'http' || scheme === 'https' ? url : null;
}
