/**
 * Funnel tracking for <form-flow>: turns what the form does into ff:track events.
 * Events carry ids, codes and durations, never a typed value; only choice fields marked "track": true send their choice.
 * Docs: readme.md § Tracking
 */

const VALIDITY = [
	['valueMissing', 'required'], ['typeMismatch', 'type'], ['patternMismatch', 'pattern'],
	['tooShort', 'minLength'], ['tooLong', 'maxLength'], ['rangeUnderflow', 'minimum'],
	['rangeOverflow', 'maximum'], ['stepMismatch', 'step'], ['badInput', 'type'], ['customError', 'custom']
];

/* The issue code a native control reports. */
export const validityCode = control => VALIDITY.find(([key]) => control.validity?.[key])?.[1] ?? 'invalid';

const sessionId = () => `s_${(globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)).replace(/-/g, '').slice(0, 12)}`;

export class FlowTracking {
	#send;
	#state = null;
	#session = sessionId();
	#seq = 0;
	#viewed = false;
	#started = 0;
	#stepAt = 0;
	#done = false;
	#abandoned = false;
	#lastField = null;
	#left = new Set();
	#revisited = new Set();
	#shown = new Set();

	/* send(event) dispatches and hands the event on; contextKeys are the context entries form.start may carry. */
	constructor(send, { contextKeys = ['channel', 'campaign'], contextOf = () => ({}), propertyOf = () => null } = {}) {
		this.#send = send;
		this.contextKeys = contextKeys;
		this.contextOf = contextOf;
		this.propertyOf = propertyOf;
	}

	get session() { return this.#session; }

	#emit(type, data = {}) {
		const state = this.#state;
		const step = state?.current ?? null;
		this.#send({
			type,
			form: state?.form ?? null,
			rules: state?.rules ?? null,
			version: state?.version ?? null,
			session: this.#session,
			seq: ++this.#seq,
			at: new Date().toISOString(),
			step,
			index: state ? state.path.indexOf(step) : -1,
			path: state ? [...state.path] : [],
			data
		});
	}

	/* The chosen values of choice fields marked "track": true, nothing else. */
	#choices() {
		const values = this.#state?.values ?? {};
		const entries = Object.entries(values).filter(([id]) => {
			const property = this.propertyOf(id);
			return property?.track === true && property.type === 'select';
		});
		return entries.length ? Object.fromEntries(entries) : undefined;
	}

	/* After every evaluation, with the current step: form.view once, then rule and error edges. */
	update(state, current, effects = []) {
		this.#state = { ...state, current };
		if (!this.#viewed) {
			this.#viewed = true;
			this.#stepAt = Date.now();
			this.#emit('form.view');
			this.#emit('step.view', { from: null, via: 'start' });
		}
		effects.filter(effect => effect.type === 'track').forEach(effect => this.#emit(effect.event, { rule: effect.rule }));
		const shown = new Set();
		for (const issue of state.issues) {
			if (!issue.field || !issue.message) continue;
			const key = `${issue.field}|${issue.code}`;
			shown.add(key);
			if (this.#started && !this.#shown.has(key)) {
				this.#emit('field.error', { field: issue.field, code: issue.code, level: issue.level ?? 'error', ...(issue.rule ? { rule: issue.rule } : {}) });
			}
		}
		this.#shown = shown;
	}

	focus(id) { this.#lastField = id; }

	input(id) {
		this.#lastField = id;
		if (!this.#started) {
			this.#started = Date.now();
			this.#abandoned = false;
			const all = this.contextOf() ?? {};
			const context = Object.fromEntries(this.contextKeys.filter(key => all[key] != null).map(key => [key, all[key]]));
			this.#emit('form.start', { entry: this.#state?.current ?? null, ...(Object.keys(context).length ? { context } : {}) });
		}
		const step = this.#state?.fields?.[id]?.step;
		if (this.#left.has(step) && !this.#revisited.has(id)) {
			this.#revisited.add(id);
			this.#emit('field.revisit', { field: id });
		}
	}

	/* A step change; via is next, back, goto, goTo(), rule or submit. */
	step(from, to, via) {
		if (from === to) return;
		const now = Date.now();
		if (from) {
			this.#emit('step.leave', { ms: now - this.#stepAt, direction: via });
			this.#left.add(from);
		}
		this.#state = this.#state && { ...this.#state, current: to };
		this.#stepAt = now;
		this.#revisited.clear();
		this.#emit('step.view', { from, via });
	}

	blocked(fields, codes) {
		this.#emit('step.blocked', { fields, codes });
	}

	service(type, data) {
		this.#emit(`service.${type}`, data);
	}

	submit(state) {
		this.#state = { ...state, current: this.#state?.current ?? null };
		this.#done = true;
		const warnings = state.issues.filter(issue => issue.level === 'warning').map(issue => `${issue.field}|${issue.code}`);
		const choices = this.#choices();
		this.#emit('form.submit', {
			ms: Date.now() - (this.#started || this.#stepAt),
			jumps: (state.jumps ?? []).map(jump => ({ from: jump.from, to: jump.to })),
			patches: state.patches ?? [],
			...(warnings.length ? { warnings } : {}),
			...(choices ? { choices } : {})
		});
	}

	/* The page is hidden or left: once per hide, only for a started, unsent form. */
	abandon() {
		if (!this.#started || this.#done || this.#abandoned) return false;
		this.#abandoned = true;
		const choices = this.#choices();
		this.#emit('form.abandon', { lastField: this.#lastField, ms: Date.now() - this.#started, ...(choices ? { choices } : {}) });
		return true;
	}

	/* The page is visible again: a later hide counts as a new abandon. */
	resume() { this.#abandoned = false; }
}
