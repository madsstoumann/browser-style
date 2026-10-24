/**
 * Saving, resuming and completing a <form-flow> session.
 *
 * new FlowSession(flow, { owner, server, send }).start()
 *
 * - Anonymous drafts live in sessionStorage (the open tab) until the person chooses saveOnDevice() (localStorage)
 *   or emailLink() (a server draft, resumed with a one-time link). A user's draft lives on the server.
 * - Only visible values are saved, never fields with `privacy: "special"` (see form-rules session.js).
 * - A submitted session is final: every copy is replaced by a tombstone without answers, other tabs lock through
 *   BroadcastChannel, and a page restored from the back/forward cache checks again.
 *
 * `server` is any object with load, save, submit, link, redeem and remove; MockServer below stands in for the backend.
 */
import { createSession, snapshot, keep, complete, discard, resume, isFinal, isExpired, formInfo } from '../form-rules/index.js';

const toBase64Url = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const randomToken = (size = 16) => toBase64Url(crypto.getRandomValues(new Uint8Array(size)));
const reference = () => `R-${randomToken(4).toUpperCase().replace(/[-_]/g, 'X')}`;

async function sha256(text) {
	return toBase64Url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))));
}

export class SessionConflict extends Error {
	constructor(session) {
		super(`session ${session?.id} is ${session?.status ?? 'newer'}`);
		this.status = 409;
		this.session = session;
	}
}

/* === Stores: async load / save / remove by key === */

export class MemoryStore {
	#map = new Map();
	async load(key) { return structuredClone(this.#map.get(key) ?? null); }
	async save(key, session) { this.#map.set(key, structuredClone(session)); }
	async remove(key) { this.#map.delete(key); }
}

/* sessionStorage or localStorage. Unavailable storage (private mode, blocked) acts as empty. */
export class WebStore {
	constructor(storage, prefix = 'form-flow:') {
		this.storage = storage;
		this.prefix = prefix;
	}
	async load(key) {
		try { return JSON.parse(this.storage.getItem(this.prefix + key)); } catch { return null; }
	}
	async save(key, session) {
		try { this.storage.setItem(this.prefix + key, JSON.stringify(session)); } catch { /* storage full or blocked */ }
	}
	async remove(key) {
		try { this.storage.removeItem(this.prefix + key); } catch { /* blocked */ }
	}
}

/**
 * Stands in for the backend until there is one, keeping its rules: saves to a final session or with an old `rev`
 * fail with 409, submit is idempotent per session, resume tokens are stored hashed, work once and expire with the draft.
 * Data is kept in localStorage so other tabs see the same "server".
 */
export class MockServer {
	#store;
	constructor({ storage = globalThis.localStorage, now = () => new Date().toISOString() } = {}) {
		this.#store = new WebStore(storage, 'form-flow-mock-server:');
		this.now = now;
	}
	load(key) { return this.#store.load(`draft:${key}`); }
	async save(key, session) {
		const stored = await this.load(key);
		if (stored && (isFinal(stored) || stored.rev >= session.rev)) throw new SessionConflict(stored);
		await this.#store.save(`draft:${key}`, session);
		return session;
	}
	async submit(key, session, receipt) {
		const stored = await this.load(key);
		if (stored?.id === session.id && stored.status === 'submitted') return stored;
		if (stored && isFinal(stored) && stored.id === session.id) throw new SessionConflict(stored);
		const done = complete(session, { now: this.now(), receipt: receipt ?? { reference: reference() } });
		await this.#store.save(`draft:${key}`, done);
		await this.#revoke(key);
		return done;
	}
	/* Returns the one-time resume URL; a real backend emails it instead of returning it. */
	async link(key, session, url = location.href) {
		await this.#revoke(key);
		const token = randomToken();
		await this.#store.save(`token:${await sha256(token)}`, { key, expires: session.expires });
		await this.#store.save(`tokens-of:${key}`, [await sha256(token)]);
		const target = new URL(url);
		target.hash = `resume=${token}`;
		return target.href;
	}
	/* The draft key a token opens, or null. The token is used up. */
	async redeem(token) {
		const hash = await sha256(token);
		const entry = await this.#store.load(`token:${hash}`);
		await this.#store.remove(`token:${hash}`);
		if (!entry || entry.expires <= this.now()) return null;
		return entry.key;
	}
	async remove(key) {
		await this.#store.remove(`draft:${key}`);
		await this.#revoke(key);
	}
	async #revoke(key) {
		for (const hash of (await this.#store.load(`tokens-of:${key}`)) ?? []) await this.#store.remove(`token:${hash}`);
		await this.#store.remove(`tokens-of:${key}`);
	}
}

/* === The controller === */

export default class FlowSession {
	#flow;
	#session = null;
	#key = null;
	#rules = null;
	#channel = null;
	#timer = 0;
	#pendingStep = null;
	#restoring = false;

	constructor(flow, {
		owner = { kind: 'anonymous' },
		server = null,
		tab = new WebStore(globalThis.sessionStorage),
		device = new WebStore(globalThis.localStorage),
		send = null,
		now = () => new Date().toISOString(),
		id = () => `fs_${randomToken()}`,
		delay = 400,
		labels = {}
	} = {}) {
		this.#flow = flow;
		Object.assign(this, { owner, server, tab, device, send, now, id, delay });
		this.labels = {
			submitted: 'This form was sent on {date}. Your reference is {reference}.',
			discarded: 'This draft was discarded.',
			expired: 'This draft has expired.',
			...labels
		};
	}

	get session() { return this.#session; }
	get key() { return this.#key; }
	get locked() { return isFinal(this.#session); }

	/* Waits for the form, then resumes a saved draft (from a resume link, the server or this browser) or starts one. */
	async start() {
		if (!this.#flow.definition) await new Promise(resolve => this.#flow.addEventListener('ff:change', resolve, { once: true }));
		const definition = this.#flow.definition;
		this.#rules = this.#flow.rules;
		const form = formInfo(definition).id;
		this.#key = this.owner.kind === 'user' ? `${form}:${this.owner.sub}` : form;

		const saved = await this.#loadSaved();
		this.#listen();
		if (saved && isFinal(saved) && !isExpired(saved, this.now())) return this.#lock(saved);
		if (saved) {
			const result = resume(saved, { definition, ruleSet: this.#rules, now: this.now(), functions: this.#flow.functions });
			if (result.ok) {
				this.#session = saved;
				this.#restore(result);
				this.#dispatch('ff:resumed', { session: saved, changes: result.changes, migrated: result.migrated });
				return this.#session;
			}
			await this.#forget();
			this.#dispatch('ff:resume-failed', { reason: result.reason });
		}
		this.#session = this.#fresh();
		return this.#session;
	}

	/* "Save on this device": keeps the draft in localStorage until it expires. */
	async saveOnDevice() {
		if (this.locked) return;
		this.#session = keep(this.#session, { storage: 'device', now: this.now() });
		await this.save(true);
	}

	/* "Email me a link": keeps the draft on the server and returns the one-time link the server would email. */
	async emailLink(email) {
		if (this.locked || !this.server) return null;
		this.#session = keep(this.#session, { storage: 'server', now: this.now() });
		await this.save(true);
		const url = await this.server.link(this.#key, this.#session);
		this.#dispatch('ff:link', { email, url, expires: this.#session.expires });
		return url;
	}

	/* "Discard draft": deletes every copy and starts over. */
	async discard() {
		if (this.locked) return;
		const session = discard(this.#session, { now: this.now() });
		await this.#forget();
		this.#channel?.postMessage({ type: 'final', session });
		this.#session = this.#fresh();
		this.#pendingStep = null;
		this.#restoring = true;
		this.#flow.setup(this.#flow.definition, this.#rules, { context: this.#flow.context });
		this.#restoring = false;
		this.#dispatch('ff:discarded', { session });
	}

	/* On logout or a shared computer: removes the copies in this browser, keeps a server draft. */
	async forgetHere() {
		await this.tab.remove(this.#key);
		await this.device.remove(this.#key);
	}

	/* Saves now (autosave calls this after `delay` ms of quiet). */
	async save(force = false) {
		clearTimeout(this.#timer);
		const state = this.#flow.state;
		if (this.locked || !state || this.#restoring) return;
		if (!force && this.#session.rev === 0 && !Object.keys(state.values).length) return;
		const { storage } = this.#session;
		this.#session = snapshot(this.#session, {
			definition: this.#flow.definition, ruleSet: this.#flow.rules, state,
			step: this.#flow.currentStep, facts: this.#flow.facts, now: this.now()
		});
		try {
			if (storage === 'device') {
				const stored = await this.device.load(this.#key);
				if (stored?.id === this.#session.id && isFinal(stored)) return this.#lock(stored);
				await this.device.save(this.#key, this.#session);
			}
			if (storage === 'server' && this.server) await this.server.save(this.#key, this.#session);
			await this.tab.save(this.#key, this.#session);
			this.#dispatch('ff:saved', { session: this.#session });
		} catch (error) {
			if (error instanceof SessionConflict && isFinal(error.session)) return this.#lock(error.session);
			if (error instanceof SessionConflict) {
				/* Saved elsewhere since (another tab or device): take over its rev and save again. */
				this.#session = { ...this.#session, rev: error.session.rev };
				return this.save(true);
			}
			this.#dispatch('ff:error', { error });
		}
	}

	async #submit(detail) {
		if (this.locked) return;
		const button = this.#flow.querySelector('[type="submit"]');
		if (button) button.disabled = true;
		try {
			clearTimeout(this.#timer);
			const receipt = this.send ? await this.send(detail, this.#session) : null;
			const serverBacked = this.server && this.#session.storage === 'server';
			const done = serverBacked
				? await this.server.submit(this.#key, this.#session, receipt)
				: complete(this.#session, { now: this.now(), receipt: receipt ?? { reference: reference() } });
			await this.tab.save(this.#key, done);
			if (this.#session.storage === 'device') await this.device.save(this.#key, done);
			this.#channel?.postMessage({ type: 'final', session: done });
			this.#lock(done);
		} catch (error) {
			if (button) button.disabled = false;
			this.#dispatch('ff:error', { error });
		}
	}

	/* === Internals === */

	#fresh() {
		return createSession({ id: this.id(), definition: this.#flow.definition, ruleSet: this.#rules, owner: this.owner, now: this.now() });
	}

	async #loadSaved() {
		const now = this.now();
		const token = new URLSearchParams(location.hash.slice(1)).get('resume');
		if (token && this.server) {
			history.replaceState(history.state, '', location.pathname + location.search);
			const key = await this.server.redeem(token);
			if (key === this.#key) return this.server.load(key);
			this.#dispatch('ff:resume-failed', { reason: 'link' });
		}
		const candidates = this.owner.kind === 'user' && this.server
			? [await this.server.load(this.#key)]
			: [await this.tab.load(this.#key), await this.device.load(this.#key)];
		for (const session of candidates.filter(Boolean)) {
			if (isExpired(session, now)) {
				await this.#forget();
				continue;
			}
			return session;
		}
		return null;
	}

	#restore({ values, facts, step, previous }) {
		this.#restoring = true;
		this.#flow.setup(this.#flow.definition, this.#rules, { values, facts, step, previous, context: this.#flow.context });
		this.#restoring = false;
		/* A step inserted by a service patch appears once its fetch returns. */
		this.#pendingStep = step && this.#flow.currentStep !== step ? step : null;
	}

	#listen() {
		this.#flow.addEventListener('ff:change', () => {
			if (this.#pendingStep && this.#flow.state?.path.includes(this.#pendingStep)) {
				const step = this.#pendingStep;
				this.#pendingStep = null;
				this.#flow.goTo(step);
			}
			if (this.locked || this.#restoring) return;
			clearTimeout(this.#timer);
			this.#timer = setTimeout(() => this.save(), this.delay);
		});
		this.#flow.addEventListener('ff:step', () => { this.#pendingStep = null; });
		this.#flow.addEventListener('ff:submit', event => this.#submit(event.detail));

		if ('BroadcastChannel' in globalThis) {
			this.#channel = new BroadcastChannel(`form-flow:${this.#key}`);
			this.#channel.addEventListener('message', ({ data }) => {
				if (data?.type === 'final' && data.session?.id === this.#session?.id) this.#lock(data.session);
			});
		}
		addEventListener('pageshow', event => { if (event.persisted) this.#check(); });
		document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') this.#check(); });
		addEventListener('storage', event => { if (event.key?.endsWith(this.#key)) this.#check(); });
	}

	/* Another tab, device or the back/forward cache may hold an older picture: is the session still a draft? */
	async #check() {
		if (this.locked || !this.#session) return;
		const stores = this.#session.storage === 'server' && this.server ? [this.server] : [this.tab, this.device];
		for (const store of stores) {
			const stored = await store.load(this.#key);
			if (stored?.id === this.#session.id && isFinal(stored)) return this.#lock(stored);
		}
	}

	async #forget() {
		await this.forgetHere();
		if (this.server && (this.owner.kind === 'user' || this.#session?.storage === 'server')) await this.server.remove(this.#key);
	}

	/* Shows the done view in place of the form, with the form cleared so a restored page has nothing to show. */
	#lock(session) {
		clearTimeout(this.#timer);
		this.#session = session;
		this.#restoring = true;
		this.#flow.setup(this.#flow.definition, this.#rules, { context: this.#flow.context });
		this.#restoring = false;
		const form = this.#flow.querySelector('form');
		if (form) {
			form.hidden = true;
			form.inert = true;
		}
		const date = session.submitted ? new Date(session.submitted).toLocaleString() : '';
		const text = this.labels[session.status]
			.replace('{date}', date)
			.replace('{reference}', session.receipt?.reference ?? '');
		this.#flow.querySelector('[part="done"]')?.remove();
		const done = document.createElement('section');
		done.setAttribute('part', 'done');
		done.setAttribute('role', 'status');
		done.textContent = text;
		this.#flow.append(done);
		this.#flow.setAttribute('done', session.status);
		this.#dispatch('ff:done', { session });
		return session;
	}

	#dispatch(type, detail) {
		this.#flow.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true, detail }));
	}
}
