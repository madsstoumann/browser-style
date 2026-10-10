/**
 * <ui-search-bot> — a conversation on a search box: a question in, a streamed answer (SSE) and its sources out.
 * Wraps a <ui-search> (its form asks) or brings its own form; light DOM, four modes. Docs: readme.md
 * @version 2.1.0 · @author Mads Stoumann
 */

const LABELS = {
	ask: 'Ask',
	question: 'Ask a question',
	'follow-up': 'Ask a follow-up question',
	placeholder: 'Ask a question or a follow-up',
	send: 'Send',
	stop: 'Stop',
	stopped: 'Answer stopped',
	thinking: 'Thinking…',
	new: 'New question',
	history: 'Earlier questions',
	'no-history': 'No saved conversations',
	delete: 'Delete',
	close: 'Close',
	like: 'Good answer',
	dislike: 'Poor answer',
	copy: 'Copy',
	share: 'Share',
	source: 'Source',
	error: 'The assistant is not available right now.',
};

/* 24×24 outlines (Tabler); built as DOM nodes, never as markup */
const ICONS = {
	ai: ['M11 5a9.37 9.37 0 0 0 7.7 7.7 9.37 9.37 0 0 0-7.7 7.7 9.37 9.37 0 0 0-7.7-7.7A9.37 9.37 0 0 0 11 5M18 2a4.26 4.26 0 0 0 3.5 3.5A4.26 4.26 0 0 0 18 9a4.26 4.26 0 0 0-3.5-3.5A4.26 4.26 0 0 0 18 2m-1 15a2.43 2.43 0 0 0 2 2 2.43 2.43 0 0 0-2 2 2.43 2.43 0 0 0-2-2 2.43 2.43 0 0 0 2-2'],
	close: ['M18 6L6 18M6 6l12 12'],
	copy: ['M7 9.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667l0 -8.666', 'M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1'],
	plus: ['M12 5v14M5 12h14'],
	history: ['M12 8l0 4l2 2', 'M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5'],
	like: ['M7 11v8a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-7a1 1 0 0 1 1 -1h3a4 4 0 0 0 4 -4v-1a2 2 0 0 1 4 0v5h3a2 2 0 0 1 2 2l-1 5a2 3 0 0 1 -2 2h-7a3 3 0 0 1 -3 -3'],
	dislike: ['M7 13v-8a1 1 0 0 0 -1 -1h-2a1 1 0 0 0 -1 1v7a1 1 0 0 0 1 1h3a4 4 0 0 1 4 4v1a2 2 0 0 0 4 0v-5h3a2 2 0 0 0 2 -2l-1 -5a2 3 0 0 0 -2 -2h-7a3 3 0 0 0 -3 3'],
	share: ['M3 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0', 'M15 6a3 3 0 1 0 6 0a3 3 0 1 0 -6 0', 'M15 18a3 3 0 1 0 6 0a3 3 0 1 0 -6 0', 'M8.7 10.7l6.6 -3.4', 'M8.7 13.3l6.6 3.4'],
	send: ['M10 14l11 -11', 'M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5'],
	stop: ['M17 4h-10a3 3 0 0 0 -3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3 -3v-10a3 3 0 0 0 -3 -3z'],
};

const DIALOG_MODES = new Set(['search', 'overlay', 'chatbot']);

/* only http(s) and same-origin paths become a link or an image — never javascript: or data: */
const safeUrl = (value, base = document.baseURI) => {
	if (typeof value !== 'string' || !value.trim()) return null;
	try {
		const url = new URL(value, base);
		return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
	} catch {
		return null;
	}
};

/* a hit as the thread keeps it: name and url required, the rest optional */
const normaliseHit = (item, schema = {}) => ({
	name: String(schema.name ?? item?.name ?? '').trim(),
	url: safeUrl(item?.url ?? schema.url),
	description: String(schema.description ?? item?.description ?? '').trim(),
	image: safeUrl(typeof schema.image === 'string' ? schema.image : schema.image?.url ?? item?.image),
});

/* The built-in adapters (readme.md § The stream). buildRequest returns the URL to open; parseEvent maps one
   parsed JSON message onto chunk | results | component | done | error, or null for a message to ignore. */
const ADAPTERS = {
	/* NLWeb: GET ?query=…&prev=[…]; messages summary, result_batch, complete */
	nlweb: {
		buildRequest(api, query, context, options) {
			const url = new URL(api, document.baseURI);
			url.searchParams.set('query', query);
			url.searchParams.set('display_mode', 'full');
			url.searchParams.set('generate_mode', 'summarize');
			if (options.context) url.searchParams.set('context', options.context);
			if (options.maxResults) url.searchParams.set('max_results', String(options.maxResults));
			if (context.prev.length > 1) url.searchParams.set('prev', JSON.stringify(context.prev.slice(0, -1)));
			if (context.last.length) url.searchParams.set('last_ans', JSON.stringify(context.last));
			return url;
		},
		parseEvent(data) {
			switch (data?.message_type) {
				case 'summary': return { type: 'chunk', text: String(data.message ?? '') };
				case 'result_batch': return { type: 'results', items: (Array.isArray(data.results) ? data.results : []).map((item) => normaliseHit(item, item?.schema_object)) };
				case 'component': return { type: 'component', name: data.name, props: data.props };
				case 'complete': return { type: 'done' };
				case 'error': return { type: 'error', message: data.message };
				default: return null;
			}
		},
	},
	/* a plain stream: GET ?query=…; messages chunk, results, done, error */
	aisearch: {
		buildRequest(api, query, context, options) {
			const url = new URL(api, document.baseURI);
			url.searchParams.set('query', query);
			if (options.context) url.searchParams.set('context', options.context);
			if (options.maxResults) url.searchParams.set('max_results', String(options.maxResults));
			if (options.rewrite != null) url.searchParams.set('rewrite', String(options.rewrite));
			if (context.prev.length > 1) url.searchParams.set('prev', JSON.stringify(context.prev.slice(0, -1)));
			return url;
		},
		parseEvent(data) {
			switch (data?.type) {
				case 'chunk': return { type: 'chunk', text: String(data.text ?? '') };
				case 'results': return { type: 'results', items: (Array.isArray(data.items) ? data.items : []).map((item) => normaliseHit(item, item?.schema_object)) };
				case 'component': return { type: 'component', name: data.name, props: data.props };
				case 'done': return { type: 'done' };
				case 'error': return { type: 'error', message: data.message };
				default: return null;
			}
		},
	},
};

const el = (tag, attrs = {}, children = []) => {
	const node = document.createElement(tag);
	for (const [key, value] of Object.entries(attrs)) {
		if (value == null || value === false) continue;
		if (key === 'text') node.textContent = value;
		else if (value === true) node.setAttribute(key, '');
		else node.setAttribute(key, value);
	}
	for (const child of Array.isArray(children) ? children : [children]) if (child != null) node.append(child);
	return node;
};

const svg = (name) => {
	const ns = 'http://www.w3.org/2000/svg';
	const icon = document.createElementNS(ns, 'svg');
	icon.setAttribute('viewBox', '0 0 24 24');
	icon.setAttribute('aria-hidden', 'true');
	for (const d of ICONS[name]) {
		const path = document.createElementNS(ns, 'path');
		path.setAttribute('d', d);
		icon.append(path);
	}
	return icon;
};

/* the bot's buttons that take an author's icon: <svg slot="icon-trigger"> etc. as a direct child */
const SLOTS = { trigger: 'ai', history: 'history', new: 'plus', close: 'close', submit: 'send', stop: 'stop' };

/* `code`, **strong**, *em*, [text](url) and bare http(s) URLs, as nodes */
const inline = (text) => {
	const fragment = document.createDocumentFragment();
	const pattern = /`([^`]+)`|\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)\s]+)\)|(?<!["\w/(])https?:\/\/[^\s<)]+/g;
	let last = 0;
	for (const match of text.matchAll(pattern)) {
		if (match.index > last) fragment.append(text.slice(last, match.index));
		if (match[1] != null) fragment.append(el('code', { text: match[1] }));
		else if (match[2] != null) fragment.append(el('strong', { text: match[2] }));
		else if (match[3] != null) fragment.append(el('em', { text: match[3] }));
		else if (match[4] != null) {
			const href = safeUrl(match[5]);
			fragment.append(href ? el('a', { href, text: match[4] }) : match[4]);
		} else {
			const href = safeUrl(match[0]);
			fragment.append(href ? el('a', { href, text: new URL(href).hostname + new URL(href).pathname }) : match[0]);
		}
		last = match.index + match[0].length;
	}
	if (last < text.length) fragment.append(text.slice(last));
	return fragment;
};

const read = (storage, key) => {
	try { return JSON.parse(storage.getItem(key)); } catch { return null; }
};
const write = (storage, key, value) => {
	try { storage.setItem(key, JSON.stringify(value)); } catch { /* private mode, full */ }
};

export default class UiSearchBot extends HTMLElement {
	#search = null;
	#wrapped = null;
	#panel = null;
	#dialog = false;
	#header = null;
	#conversation = null;
	#form = null;
	#input = null;
	#legend = null;
	#stop = null;
	#historyList = null;
	#source = null;
	#current = null;
	#messages = [];
	#chatKey = null;
	#renderers = new Map();
	#adapterFor = null;
	#uid = Math.random().toString(36).slice(2, 8);
	#unload = null;

	/** Opens the stream: (url) => an EventSource-like object (onmessage, onerror, close). Default: a real EventSource. */
	connect = (url) => new EventSource(url);
	/** A custom adapter { buildRequest, parseEvent } — else `provider=` names a built-in one or a module URL. */
	adapter = null;

	static observedAttributes = ['provider'];

	/** The wrapped <ui-search>, when there is one. */
	get search() { return this.#search; }
	/** The thread so far: { role: 'user', text } and { role: 'response', summary, results } entries. */
	get messages() { return structuredClone(this.#messages); }
	get mode() { return DIALOG_MODES.has(this.getAttribute('mode')) ? this.getAttribute('mode') : 'inline'; }

	connectedCallback() {
		if (this.#panel) return;
		this.#dialog = this.mode !== 'inline';
		this.#search = this.querySelector(':scope > ui-search');
		this.#wrapped = this.#search?.querySelector(':scope > search > form, :scope > form') ?? null;
		this.#build();
		this.addEventListener('submit', this, true);
		this.addEventListener('click', this);
		this.addEventListener('keydown', this);
		this.#panel.addEventListener('close', this);
		this.dataset.state = 'idle';

		if (this.hasAttribute('preserve-state') && this.hasAttribute('preserve-history')) {
			this.#unload = () => this.#saveState();
			addEventListener('beforeunload', this.#unload);
			const state = read(sessionStorage, this.#prefix + 'ui-state');
			if (state?.activeChatKey) this.#load(state.activeChatKey);
			if (state?.open && this.#dialog && this.#chatKey) this.open();
		}
	}

	disconnectedCallback() {
		this.#closeSource();
		if (this.#unload) removeEventListener('beforeunload', this.#unload);
		this.#unload = null;
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (name === 'provider' && oldValue !== newValue) this.#adapterFor = null;
	}

	handleEvent(event) {
		if (event.type === 'submit') this.#onSubmit(event);
		else if (event.type === 'click') this.#onClick(event);
		else if (event.type === 'keydown') this.#onKeydown(event);
		else if (event.type === 'close') {
			this.#emit('close', { chatKey: this.#chatKey });
			this.#saveState();
		}
	}

	/* ── public API ───────────────────────────────────────────────────────── */

	/** Open the panel (dialog modes); with a question, ask it. */
	open(question = '') {
		if (this.#dialog && !this.#panel.open) {
			this.#panel.showModal();
			this.#emit('open', { chatKey: this.#chatKey });
			this.#saveState();
		}
		if (question.trim()) this.ask(question);
		else this.#input?.focus();
	}

	close() {
		if (this.#dialog && this.#panel.open) this.#panel.close();
	}

	/** Ask: the question joins the thread and the answer streams in under it. */
	async ask(question) {
		const query = String(question ?? '').trim();
		const api = this.getAttribute('api');
		if (!query || !api) return;
		this.#closeSource();
		this.#current = null;

		const started = !this.#chatKey;
		this.#chatKey ??= this.#keyFor(query);
		if (started) this.#emit('chat-start', { chatKey: this.#chatKey, query });
		this.#messages.push({ role: 'user', text: query });
		this.#emit('message', { chatKey: this.#chatKey, role: 'user', text: query });
		this.#conversation.append(el('li', { 'data-bot': 'user', text: query }));

		const li = el('li', { 'data-bot': 'response', 'data-pending': true, 'aria-busy': 'true' });
		const node = document.createTextNode('');
		li.append(node);
		this.#conversation.append(li);
		this.#current = { li, node, text: '', results: [], refs: {}, components: [] };
		this.#label();
		this.#state('streaming');
		li.scrollIntoView({ block: 'end' });

		let adapter;
		try {
			adapter = await this.#adapter();
			const url = adapter.buildRequest(api, query, this.#context(), this.#options());
			const source = this.connect(String(url));
			this.#source = source;
			source.onmessage = (message) => {
				let data;
				try { data = JSON.parse(message.data); } catch { return; }
				const msg = adapter.parseEvent(data);
				if (!msg || this.#source !== source) return;
				if (msg.type === 'chunk') this.#chunk(msg.text);
				else if (msg.type === 'results') this.#results(msg.items);
				else if (msg.type === 'component') this.#component(msg.name, msg.props);
				else if (msg.type === 'done') this.#complete();
				else if (msg.type === 'error') this.#fail(typeof msg.message === 'string' && msg.message ? msg.message : this.#labelOf('error'));
			};
			/* a dropped connection: close it ourselves, or the browser reconnects and asks again */
			source.onerror = () => { if (this.#source === source) this.#fail(this.#labelOf('error')); };
		} catch {
			this.#fail(this.#labelOf('error'));
		}
	}

	/** Stop the answer that is streaming; what has arrived stays. */
	stop() {
		if (!this.#source) return;
		this.#closeSource();
		const current = this.#current;
		if (!current) return;
		delete current.li.dataset.pending;
		current.li.removeAttribute('aria-busy');
		this.#renderSummary(current.li, current.text, current.refs);
		current.li.append(el('em', { 'data-bot': 'stopped', text: this.#labelOf('stopped') }));
		this.#messages.push({ role: 'response', summary: current.text, results: current.results });
		this.#emit('abort', { chatKey: this.#chatKey });
		this.#save();
		this.#current = null;
		this.#state('idle');
	}

	/** Forget the thread and start over. */
	newChat() {
		const previous = this.#chatKey;
		this.#closeSource();
		this.#chatKey = null;
		this.#messages = [];
		this.#current = null;
		this.#conversation.replaceChildren();
		this.#label();
		this.#state('idle');
		(this.#input ?? this.#wrapped?.querySelector('input, textarea'))?.focus();
		if (previous) this.#emit('chat-clear', { previousChatKey: previous });
	}

	/** Draw a `component` message yourself: (props) => Node. */
	registerRenderer(name, fn) {
		this.#renderers.set(name, fn);
	}

	/* ── the stream ───────────────────────────────────────────────────────── */

	async #adapter() {
		if (this.adapter) return this.adapter;
		const provider = this.getAttribute('provider') || 'nlweb';
		if (ADAPTERS[provider]) return ADAPTERS[provider];
		/* a module of your own: provider="./my-adapter.js", resolved against the page */
		this.#adapterFor ??= import(new URL(provider, document.baseURI).href);
		return this.#adapterFor;
	}

	#context() {
		const prev = [], last = [];
		for (const message of this.#messages) {
			if (message.role === 'user') prev.push(message.text);
			if (message.role === 'response' && message.results?.length) last.push(...message.results.map(({ name, url }) => ({ name, url })));
		}
		return { prev: prev.slice(-10), last: last.slice(-20) };
	}

	#options() {
		const options = { context: this.getAttribute('context') || null };
		const max = Number.parseInt(this.getAttribute('max-results') ?? '', 10);
		if (Number.isFinite(max) && max > 0) options.maxResults = max;
		const rewrite = this.getAttribute('rewrite');
		if (rewrite != null) options.rewrite = rewrite !== 'false';
		return options;
	}

	#chunk(text) {
		if (!this.#current) return;
		this.#arrived();
		this.#current.text += text;
		this.#current.node.textContent = this.#current.text;
	}

	#results(items) {
		if (!this.#current) return;
		this.#arrived();
		const { li, results, refs } = this.#current;
		const ul = li.querySelector(':scope > ul[data-bot="results"]') || li.appendChild(el('ul', { 'data-bot': 'results' }));
		for (const item of items) {
			if (!item.name || !item.url) continue;
			refs[item.url] = item.name;
			results.push(item);
			ul.append(this.#hit(item));
		}
	}

	#component(name, props) {
		const renderer = this.#renderers.get(name);
		const node = renderer?.(props);
		if (!node || !this.#current) return;
		this.#arrived();
		this.#current.li.append(node);
		this.#current.components.push({ name, props });
	}

	#arrived() {
		delete this.#current.li.dataset.pending;
	}

	#complete() {
		this.#closeSource();
		const current = this.#current;
		if (!current) return;
		const { li, text, results, refs, components } = current;
		this.#arrived();
		li.removeAttribute('aria-busy');
		this.#renderSummary(li, text, refs);
		this.#messages.push({ role: 'response', summary: text, results });
		for (const c of components) this.#messages.push({ role: 'component', name: c.name, props: c.props });
		this.#emit('response', { chatKey: this.#chatKey, summary: text, results });
		this.#save();
		this.#actions(li);
		this.#current = null;
		this.#state('idle');
		li.scrollIntoView({ behavior: 'smooth', block: 'end' });
	}

	#fail(message) {
		this.#closeSource();
		const current = this.#current;
		if (current) {
			this.#arrived();
			current.li.removeAttribute('aria-busy');
			this.#renderSummary(current.li, current.text, current.refs);
			current.li.append(el('p', { 'data-bot': 'error', role: 'alert', text: message }));
			if (current.text || current.results.length) this.#messages.push({ role: 'response', summary: current.text, results: current.results });
			this.#current = null;
		}
		this.#emit('error', { chatKey: this.#chatKey, message });
		this.#state('idle');
	}

	#closeSource() {
		this.#source?.close();
		this.#source = null;
	}

	/* ── rendering ────────────────────────────────────────────────────────── */

	#hit(item) {
		const children = [];
		if (item.image) children.push(el('img', { src: item.image, alt: '', loading: 'lazy', decoding: 'async' }));
		const text = [el('strong', { text: item.name })];
		if (item.description) text.push(el('small', { text: item.description }));
		children.push(el('span', {}, text));
		return el('li', {}, el('a', { href: item.url }, children));
	}

	/* paragraphs, bullets and a "References" trailer of `[n] url` lines; [n] in the text becomes that link */
	#renderSummary(container, text, refs) {
		const lines = text.split('\n');
		const at = lines.findIndex((line) => /^references\b/i.test(line.trim()));
		const body = at === -1 ? lines : lines.slice(0, at);
		const map = {};
		for (const line of at === -1 ? [] : lines.slice(at + 1)) {
			const m = line.match(/^\[(\d+)\]\s*(\S+)/);
			if (m && safeUrl(m[2])) map[m[1]] = safeUrl(m[2]);
		}
		const cited = at !== -1;
		const fragment = document.createDocumentFragment();
		let list = null;
		for (const raw of body) {
			const line = raw.trim();
			const bullet = line.match(/^(?:[*\-•]|\d+[.)])\s+(.+)/);
			if (bullet) {
				const tag = /^\d/.test(line) ? 'ol' : 'ul';
				if (!list || list.tagName.toLowerCase() !== tag) fragment.append(list = el(tag));
				list.append(this.#line(el('li'), bullet[1], refs, map, cited));
			} else {
				list = null;
				const heading = line.match(/^#{1,6}\s+(.+)/);
				if (heading) fragment.append(this.#line(el('p', {}, el('strong')).firstChild, heading[1], refs, map, cited).parentElement);
				else if (line) fragment.append(this.#line(el('p'), line, refs, map, cited));
			}
		}
		const keep = [...container.querySelectorAll(':scope > ul[data-bot="results"], :scope > [data-bot="component"]')];
		container.replaceChildren(fragment, ...keep);
	}

	/* with a trailer, each [n] is a chip: a link when the trailer gives it a URL, named after its hit */
	#line(node, text, refs, map, cited) {
		for (const part of text.split(/(\[\d+\])/g)) {
			const m = part.match(/^\[(\d+)\]$/);
			if (m && map[m[1]]) {
				const name = refs[map[m[1]]];
				const label = `${this.#labelOf('source')} ${m[1]}`;
				node.append(el('a', { href: map[m[1]], 'data-bot': 'ref', title: name || null, 'aria-label': name ? `${label}: ${name}` : label, text: m[1] }));
			} else if (m && cited) node.append(el('span', { 'data-bot': 'ref', text: m[1] }));
			else node.append(inline(part));
		}
		return node;
	}

	#actions(li) {
		const feedback = this.hasAttribute('feedback');
		const share = this.hasAttribute('share');
		if (!feedback && !share) return;
		const index = this.#messages.length - 1;
		const bar = el('div', { 'data-bot': 'actions' });
		if (feedback) {
			for (const value of ['like', 'dislike']) {
				bar.append(el('button', { type: 'button', 'data-bot': value, 'data-index': index, 'aria-label': this.#labelOf(value), 'aria-pressed': 'false' }, svg(value)));
			}
		}
		if (share) {
			bar.append(el('button', { type: 'button', 'data-bot': 'copy', 'aria-label': this.#labelOf('copy') }, svg('copy')));
			if (navigator.share) bar.append(el('button', { type: 'button', 'data-bot': 'share', 'aria-label': this.#labelOf('share') }, svg('share')));
		}
		li.append(bar);
	}

	#label() {
		if (this.#legend) this.#legend.textContent = this.#labelOf(this.#messages.length ? 'follow-up' : 'question');
	}

	#labelOf(name) {
		return this.getAttribute(`label-${name}`) ?? LABELS[name] ?? '';
	}

	#state(state) {
		this.dataset.state = state;
		if (this.#stop) this.#stop.hidden = state !== 'streaming';
		this.#conversation.toggleAttribute('aria-busy', state === 'streaming');
	}

	#emit(name, detail) {
		this.dispatchEvent(new CustomEvent(`ui-search-bot:${name}`, { bubbles: true, composed: true, detail }));
	}

	/* ── events ───────────────────────────────────────────────────────────── */

	/* The wrapped form's submit, caught on the way down so ui-search never sees it when the bot takes it; an agent's
	   submit (WebMCP) is left to ui-search, which answers with the search response. */
	#onSubmit(event) {
		if (event.target === this.#form) {
			event.preventDefault();
			const question = this.#input.value;
			this.#input.value = '';
			this.ask(question);
			return;
		}
		if (event.target !== this.#wrapped || event.agentInvoked || !this.getAttribute('api')) return;
		const takes = !this.#dialog || (this.getAttribute('trigger') || '').split(/\s+/).includes('submit');
		if (!takes) return;
		const field = this.#wrapped.querySelector('input[type="search"], input[name], textarea');
		const question = field?.value.trim() ?? '';
		if (!question) return;
		event.preventDefault();
		event.stopPropagation();
		if (this.#search?.hasAttribute('sync-url')) {
			const url = new URL(location.href);
			url.search = new URLSearchParams(new FormData(this.#wrapped)).toString();
			history.replaceState(history.state, '', url);
		}
		this.#search?.clear?.();
		field.value = '';
		if (this.#dialog) this.open(question);
		else this.ask(question);
	}

	#onClick(event) {
		const button = event.target.closest('button[data-bot]');
		if (!button || !this.contains(button)) return;
		const part = button.dataset.bot;
		if (part === 'ask') {
			const field = this.#wrapped?.querySelector('input[type="search"], input[name], textarea');
			const seed = field?.value.trim() ?? '';
			if (seed) { this.#search?.clear?.(); field.value = ''; }
			this.open(seed);
		} else if (part === 'trigger') {
			queueMicrotask(() => { if (this.#panel.open) { this.#emit('open', { chatKey: this.#chatKey }); this.#saveState(); } });
		} else if (part === 'stop') this.stop();
		else if (part === 'new') this.newChat();
		else if (part === 'history') this.#renderHistory();
		else if (part === 'history-delete') {
			const li = button.closest('li[data-key]');
			try { localStorage.removeItem(li.dataset.key); } catch { /* read-only */ }
			if (this.#chatKey === li.dataset.key) this.newChat();
			li.remove();
			if (!this.#historyList.querySelector('li[data-key]')) this.#historyList.append(el('li', { text: this.#labelOf('no-history') }));
		} else if (part === 'history-open') {
			this.#load(button.closest('li[data-key]').dataset.key);
			this.#historyList.hidePopover?.();
		} else if (part === 'like' || part === 'dislike') {
			for (const other of button.parentElement.querySelectorAll('[aria-pressed="true"]')) other.setAttribute('aria-pressed', 'false');
			button.setAttribute('aria-pressed', 'true');
			this.#emit('feedback', { chatKey: this.#chatKey, messageIndex: Number(button.dataset.index), value: part });
		} else if (part === 'copy' || part === 'share') {
			const text = this.#plain(button.closest('li[data-bot="response"]'));
			if (part === 'copy') navigator.clipboard?.writeText(text).then(() => this.#emit('copy', { chatKey: this.#chatKey, text }));
			else navigator.share({ text }).then(() => this.#emit('share', { chatKey: this.#chatKey, text })).catch(() => {});
		}
	}

	#onKeydown(event) {
		/* a textarea: Enter sends, Shift+Enter breaks the line */
		if (event.key === 'Enter' && !event.shiftKey && event.target === this.#input && this.#input.tagName === 'TEXTAREA') {
			event.preventDefault();
			this.#form.requestSubmit();
		}
	}

	#plain(li) {
		const clone = li.cloneNode(true);
		for (const extra of clone.querySelectorAll('[data-bot="actions"], [data-bot="error"]')) extra.remove();
		for (const ref of clone.querySelectorAll('[data-bot="ref"]')) ref.textContent = `[${ref.textContent}]`;
		return clone.textContent.replace(/\s+\n/g, '\n').trim();
	}

	/* ── history ──────────────────────────────────────────────────────────── */

	get #prefix() { return (this.id || 'ui-search-bot') + ':'; }

	#keyFor(query) {
		const slug = query.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 50);
		return `${this.#prefix}${slug}-${Date.now()}`;
	}

	#save() {
		if (!this.#chatKey || !this.hasAttribute('preserve-history')) return;
		write(localStorage, this.#chatKey, {
			title: this.#messages.find((m) => m.role === 'user')?.text || '',
			created: Number(this.#chatKey.split('-').pop()),
			messages: this.#messages,
		});
		this.#saveState();
	}

	#saveState() {
		if (!this.hasAttribute('preserve-state') || !this.hasAttribute('preserve-history')) return;
		write(sessionStorage, this.#prefix + 'ui-state', { open: this.#dialog && this.#panel.open, activeChatKey: this.#chatKey });
	}

	#renderHistory() {
		const list = this.#historyList;
		list.replaceChildren();
		let keys = [];
		try { keys = Object.keys(localStorage).filter((k) => k.startsWith(this.#prefix) && !k.endsWith('ui-state')); } catch { /* blocked */ }
		const chats = keys.map((key) => { const data = read(localStorage, key); return data?.title ? { key, title: data.title, created: data.created || 0 } : null; })
			.filter(Boolean)
			.sort((a, b) => b.created - a.created);
		if (!chats.length) return list.append(el('li', { text: this.#labelOf('no-history') }));
		for (const chat of chats) {
			list.append(el('li', { 'data-key': chat.key }, [
				el('button', { type: 'button', 'data-bot': 'history-open', text: chat.title }),
				el('button', { type: 'button', 'data-bot': 'history-delete', 'aria-label': `${this.#labelOf('delete')}: ${chat.title}` }, svg('close')),
			]));
		}
	}

	#load(key) {
		const data = read(localStorage, key);
		if (!Array.isArray(data?.messages)) return;
		this.#closeSource();
		this.#chatKey = key;
		this.#messages = data.messages;
		this.#conversation.replaceChildren();
		let last = null;
		for (const message of this.#messages) {
			if (message.role === 'user') this.#conversation.append(el('li', { 'data-bot': 'user', text: String(message.text ?? '') }));
			else if (message.role === 'component') {
				const node = this.#renderers.get(message.name)?.(message.props);
				if (node) (last ?? this.#conversation).append(node);
			} else {
				const results = (Array.isArray(message.results) ? message.results : []).map((r) => normaliseHit(r)).filter((r) => r.name && r.url);
				const li = el('li', { 'data-bot': 'response' });
				this.#renderSummary(li, String(message.summary ?? ''), Object.fromEntries(results.map((r) => [r.url, r.name])));
				if (results.length) li.append(el('ul', { 'data-bot': 'results' }, results.map((r) => this.#hit(r))));
				this.#conversation.append(last = li);
			}
		}
		if (last) this.#actions(last);
		this.#label();
		this.#state('idle');
		this.#conversation.lastElementChild?.scrollIntoView({ block: 'end' });
	}

	/* ── the markup ───────────────────────────────────────────────────────── */

	/* the author's icon for a button (moved in, a direct child with slot="icon-<name>"), else the built-in one */
	#icon(name) {
		const own = this.querySelector(`:scope > [slot="icon-${name}"]`);
		if (!own) return svg(SLOTS[name]);
		own.setAttribute('aria-hidden', 'true');
		return own;
	}

	#build() {
		const id = `ui-search-bot-${this.#uid}`;
		const options = new Set((this.getAttribute('options') ?? (this.#dialog ? 'close new history' : 'new history')).split(/\s+/));
		const ownForm = this.#dialog || !this.#wrapped;

		if (this.#dialog) {
			/* with a wrapped box: Ask beside it; alone: the floating trigger */
			if (this.#wrapped) this.#search.after(el('button', { type: 'button', 'data-bot': 'ask', text: this.#labelOf('ask') }));
			else this.append(el('button', { type: 'button', 'data-bot': 'trigger', commandfor: id, command: 'show-modal', 'aria-label': this.#labelOf('question') }, this.#icon('trigger')));
		}

		this.#panel = this.#dialog
			? el('dialog', { id, 'data-bot': 'panel', closedby: 'any', 'aria-label': this.#labelOf('question') })
			: el('div', { id, 'data-bot': 'panel' });

		this.#header = el('div', { 'data-bot': 'header' });
		if (options.has('history') && this.hasAttribute('preserve-history')) {
			this.#header.append(
				el('button', { type: 'button', 'data-bot': 'history', popovertarget: `${id}-history`, 'aria-label': this.#labelOf('history') }, this.#icon('history')),
				this.#historyList = el('ul', { id: `${id}-history`, 'data-bot': 'history-list', popover: true, 'aria-label': this.#labelOf('history') }));
		}
		if (options.has('new')) this.#header.append(el('button', { type: 'button', 'data-bot': 'new', 'aria-label': this.#labelOf('new') }, this.#icon('new')));
		this.#header.append(this.#stop = el('button', { type: 'button', 'data-bot': 'stop', hidden: true, 'aria-label': this.#labelOf('stop') }, this.#icon('stop')));
		if (this.#dialog && options.has('close')) this.#header.append(el('button', { type: 'button', 'data-bot': 'close', commandfor: id, command: 'close', 'aria-label': this.#labelOf('close') }, this.#icon('close')));

		this.#conversation = el('ol', { 'data-bot': 'conversation', 'aria-live': 'polite' });
		this.#panel.append(this.#header, this.#conversation);

		if (ownForm) {
			const multiline = this.hasAttribute('multiline');
			this.#legend = el('label', { 'data-bot': 'legend', for: `${id}-q`, text: this.#labelOf('question') });
			this.#input = multiline
				? el('textarea', { id: `${id}-q`, name: 'q', rows: '1', required: true, autocomplete: 'off', enterkeyhint: 'send', placeholder: this.#labelOf('placeholder') })
				: el('input', { type: 'search', id: `${id}-q`, name: 'q', required: true, autocomplete: 'off', enterkeyhint: 'send', placeholder: this.#labelOf('placeholder') });
			this.#form = el('form', { 'data-bot': 'form' }, [
				this.#legend, this.#input,
				el('button', { type: 'submit', 'data-bot': 'send', 'aria-label': this.#labelOf('send') }, this.#icon('submit')),
			]);
			this.#panel.append(this.#form);
		}
		this.append(this.#panel);
	}
}

customElements.get('ui-search-bot') || customElements.define('ui-search-bot', UiSearchBot);
