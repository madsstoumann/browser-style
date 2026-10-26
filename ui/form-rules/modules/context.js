/**
 * Where each context key may come from, for a server that re-checks a submit.
 *
 * The page sets `context` (channel, campaign, a signed-in user's segment, …), so a server cannot take
 * it as it is: anyone can post a different one. A rule set declares the keys only the server may
 * supply, and the server builds the context it evaluates with from both sides:
 *
 *   "context": { "segment": { "from": "server" }, "campaign": { "from": "page" } }
 *
 *   trustedContext(ruleSet, { page, server }) → context
 *
 * - A key the server supplies always wins.
 * - A key declared `"from": "server"` is never taken from the page, even when the server has no value
 *   for it (it then reads as `null`), so a page cannot claim what the server does not know.
 * - Any other key (undeclared, or `"from": "page"`) comes from the page.
 *
 * The browser evaluates with the page's context as before; only the server's re-check changes.
 */
import { normalizeRuleSet } from './form.js';

export const CONTEXT_SOURCES = ['page', 'server'];

/* The keys a rule set says only the server may supply. */
export function serverContextKeys(ruleSet) {
	const declared = normalizeRuleSet(ruleSet ?? {}).context ?? {};
	return Object.entries(declared).filter(([, entry]) => entry?.from === 'server').map(([key]) => key);
}

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function trustedContext(ruleSet, { page = {}, server = {} } = {}) {
	const own = isObject(server) ? server : {};
	const blocked = new Set([...serverContextKeys(ruleSet), ...Object.keys(own), '__proto__']);
	const context = {};
	for (const [key, value] of Object.entries(isObject(page) ? page : {})) {
		if (!blocked.has(key)) context[key] = value;
	}
	for (const [key, value] of Object.entries(own)) {
		if (key !== '__proto__') context[key] = value;
	}
	return context;
}
