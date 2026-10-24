/**
 * handleEvent(form, ruleSet, store, event) → { ruleSet, store, changed, ignored, errors }
 *
 * Incoming events change what the next evaluate() sees. A rule set lists the
 * events it accepts in `listen`; anything else is ignored. Each listener does one of:
 *   { "type": "pricing.updated",  "set": "facts.pricing" }     write event.data into facts
 *   { "type": "rules.published",  "replace": "rules" }          swap in a newer rule set version
 *   { "type": "campaign.started", "patch": { "namespace": "campaign", "into": "cover.extra" } }
 *                                                               mount event.data as a patch, always active
 *
 * `store` holds facts and the delivery log: { facts, seen: [ids], sequence: { source: n } }.
 * Events are CloudEvents-shaped: { id, source, type, sequence?, data }.
 */

import { merge } from './merge.js';
import { normalizeRuleSet, unwrap } from './form.js';

const SEEN_LIMIT = 200;

function setPath(target, path, value) {
	const parts = path.split('.');
	const copy = { ...target };
	let node = copy;
	parts.slice(0, -1).forEach(part => {
		node[part] = node[part] && typeof node[part] === 'object' ? { ...node[part] } : {};
		node = node[part];
	});
	node[parts.at(-1)] = value;
	return copy;
}

export function handleEvent(formDefinition, ruleSetDocument, store = {}, event = {}) {
	const ruleSet = normalizeRuleSet(ruleSetDocument);
	const facts = store.facts ?? {};
	const seen = store.seen ?? [];
	const sequence = store.sequence ?? {};
	const unchanged = extra => ({ ruleSet: ruleSetDocument, store: { facts, seen, sequence }, changed: false, ignored: true, errors: [], ...extra });

	const listener = ruleSet.listen.find(entry => entry.type === event.type);
	if (!listener) return unchanged({ reason: 'not-listening' });
	if (event.id && seen.includes(event.id)) return unchanged({ reason: 'duplicate' });
	if (event.source && typeof event.sequence === 'number' && event.sequence <= (sequence[event.source] ?? -Infinity)) {
		return unchanged({ reason: 'out-of-order' });
	}

	const nextStore = {
		facts,
		seen: event.id ? [...seen, event.id].slice(-SEEN_LIMIT) : seen,
		sequence: event.source && typeof event.sequence === 'number' ? { ...sequence, [event.source]: event.sequence } : sequence
	};

	if (listener.set) {
		if (!listener.set.startsWith('facts.')) {
			return { ...unchanged(), errors: [{ code: 'listener', message: 'A "set" listener may only write under facts.' }] };
		}
		nextStore.facts = setPath(facts, listener.set.slice(6), event.data ?? null);
		return { ruleSet: ruleSetDocument, store: nextStore, changed: true, ignored: false, errors: [] };
	}

	if (listener.replace === 'rules') {
		const next = normalizeRuleSet(unwrap(event.data));
		if (next.id !== ruleSet.id) {
			return { ...unchanged(), errors: [{ code: 'target', message: `Event carries rule set "${next.id}", not "${ruleSet.id}"` }] };
		}
		if ((next.version ?? 0) <= (ruleSet.version ?? 0)) return unchanged({ reason: 'not-newer', store: nextStore });
		return { ruleSet: { ...next, patches: ruleSet.patches }, store: nextStore, changed: true, ignored: false, errors: [] };
	}

	if (listener.patch) {
		const { namespace, into, owner = null } = listener.patch;
		const result = merge(formDefinition, ruleSet, event.data, { owner, service: namespace, into });
		if (result.errors.length) return { ...unchanged(), errors: result.errors };
		return { ruleSet: result.ruleSet, store: nextStore, changed: true, ignored: false, errors: [] };
	}

	return { ...unchanged(), errors: [{ code: 'listener', message: `Listener for "${event.type}" has no set, replace or patch` }] };
}
