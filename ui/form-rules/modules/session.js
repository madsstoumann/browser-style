/**
 * Form sessions: one person's saved progress through one form, as plain JSON.
 * Pure like the rest of the engine: ids and `now` are passed in, nothing is read from a clock.
 *
 * A session only stores what `evaluate()` cannot rebuild: the values of visible fields, the facts,
 * the current step and the matched rules (so `emit` does not fire again on resume). Fields marked
 * `privacy: "special"` and file uploads are never stored. Patches and context are not stored either: patches are
 * re-fetched (their requests are keyed by the values), context comes from the host.
 */
import { normalizeForm, normalizeRuleSet, unwrap } from './form.js';
import { evaluate } from './evaluate.js';

export const SESSION_STATUS = ['draft', 'submitted', 'expired', 'discarded'];
export const PRIVACY = ['none', 'personal', 'special'];

const DAY = 864e5;
const addDays = (now, days) => new Date(Date.parse(now) + days * DAY).toISOString();

/* Version and reset counter of a form: top-level or in UCF `meta`. */
export function formInfo(definition) {
	const form = unwrap(definition);
	const meta = definition?.meta ?? {};
	return {
		id: form.id ?? null,
		version: form.version ?? meta.version ?? null,
		resetDrafts: form.resetDrafts ?? meta.resetDrafts ?? 0
	};
}

/* A field's privacy class. Form fields default to "none"; fields from a service patch to "personal". */
export function privacyOf(definition, ruleSet, id) {
	const property = normalizeForm(definition).properties[id];
	if (property) return property.privacy ?? 'none';
	const patch = normalizeRuleSet(ruleSet).patches.find(p => p.fields?.[id]);
	return patch ? (patch.fields[id].privacy ?? 'personal') : 'personal';
}

/* File uploads go with the final submit only, so a draft never holds them. */
const isFileField = (definition, id) => normalizeForm(definition).properties[id]?.type === 'file';

export const isFinal = session => session?.status !== 'draft';
export const isExpired = (session, now) => Boolean(session?.expires) && session.expires <= now;

/* A new draft. owner: { kind: "anonymous" } or { kind: "user", sub }. ttlDays: lifetime of an anonymous draft,
   idleDays: lifetime after the last save of a user's draft. */
export function createSession({ id, definition, ruleSet, owner = { kind: 'anonymous' }, now, ttlDays = 30, idleDays = 90 }) {
	const form = formInfo(definition);
	const rules = normalizeRuleSet(ruleSet);
	const user = owner.kind === 'user';
	return {
		id,
		form: { id: form.id, version: form.version, resetDrafts: form.resetDrafts },
		rules: { id: rules.id ?? null, version: rules.version ?? null },
		status: 'draft',
		rev: 0,
		owner: user ? { kind: 'user', sub: owner.sub } : { kind: 'anonymous' },
		storage: user ? 'server' : 'tab',
		lifetime: user ? { idleDays } : { ttlDays },
		consent: null,
		step: null,
		values: {},
		facts: {},
		matched: [],
		created: now,
		updated: now,
		expires: addDays(now, user ? idleDays : ttlDays),
		submitted: null,
		receipt: null
	};
}

/* The session after a save: the visible values of an evaluated state (special fields left out), the step, facts and
   matched rules, with `rev` one up. A user's draft gets a new expiry on every save; an anonymous one keeps its own. */
export function snapshot(session, { definition, ruleSet, state, step = null, facts = {}, now }) {
	if (isFinal(session)) throw new Error(`session ${session.id} is ${session.status}`);
	const values = Object.fromEntries(Object.entries(state.values ?? {})
		.filter(([id]) => privacyOf(definition, ruleSet, id) !== 'special' && !isFileField(definition, id)));
	return {
		...session,
		rev: session.rev + 1,
		step,
		values,
		facts: { ...facts },
		matched: [...(state.matched ?? [])],
		updated: now,
		expires: session.lifetime?.idleDays ? addDays(now, session.lifetime.idleDays) : session.expires
	};
}

/* Records the person's choice to keep the draft beyond the open tab: "device" (localStorage) or "server" (resume link). */
export function keep(session, { storage, now }) {
	return { ...session, storage, consent: { [storage]: true, at: now } };
}

/* A final session holds no answers: id, form, status, times and the receipt. */
function tombstone(session, status, now, extra = {}) {
	const { values, facts, matched, step, ...rest } = session;
	return { ...rest, status, rev: session.rev + 1, updated: now, ...extra };
}

/* Submits a draft. Submitting a session that is already submitted returns it unchanged (idempotent). */
export function complete(session, { now, receipt = null }) {
	if (session.status === 'submitted') return session;
	if (isFinal(session)) throw new Error(`session ${session.id} is ${session.status}`);
	return tombstone(session, 'submitted', now, { submitted: now, receipt });
}

export function discard(session, { now }) {
	return isFinal(session) ? session : tombstone(session, 'discarded', now);
}

export function expire(session, { now }) {
	return isFinal(session) ? session : tombstone(session, 'expired', now);
}

/* What `<form-flow>` needs to continue a saved draft against the form and rules as they are now.
   Returns { ok: false, reason } for a final, expired or reset session; otherwise
   { ok: true, values, facts, step, previous, migrated, changes }, where changes lists
   { field, change: "removed" | "special" | "option-unavailable" } for values the person must look at again. */
export function resume(session, { definition, ruleSet, now, functions, today }) {
	if (!session) return { ok: false, reason: 'missing' };
	if (isFinal(session)) return { ok: false, reason: session.status };
	if (isExpired(session, now)) return { ok: false, reason: 'expired' };

	const form = formInfo(definition);
	const rules = normalizeRuleSet(ruleSet);
	if (session.form?.id !== form.id) return { ok: false, reason: 'other-form' };
	if ((session.form.resetDrafts ?? 0) !== form.resetDrafts) return { ok: false, reason: 'reset' };

	const migrated = session.form.version !== form.version || session.rules?.version !== (rules.version ?? null);
	const known = normalizeForm(definition).properties;
	const changes = [];
	const values = {};
	for (const [id, value] of Object.entries(session.values ?? {})) {
		/* Ids with a dot belong to service patches, which are fetched again after resume. */
		const patched = id.includes('.') || rules.patches.some(patch => patch.fields?.[id]);
		if (!known[id] && !patched) changes.push({ field: id, change: 'removed' });
		else if (privacyOf(definition, ruleSet, id) === 'special') changes.push({ field: id, change: 'special' });
		else if (isFileField(definition, id)) continue;
		else values[id] = value;
	}

	if (migrated) {
		const state = evaluate(definition, ruleSet, { values, facts: session.facts ?? {}, functions, today });
		for (const issue of state.issues) {
			if (issue.code === 'option-unavailable') changes.push({ field: issue.field, change: 'option-unavailable' });
		}
	}

	return {
		ok: true,
		values,
		facts: { ...(session.facts ?? {}) },
		step: session.step ?? null,
		previous: { matched: [...(session.matched ?? [])] },
		migrated,
		changes
	};
}
