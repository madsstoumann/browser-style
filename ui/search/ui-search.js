/**
 * <ui-search> — enhances the <search> landmark it wraps: the form keeps working as a plain GET
 * form, and with `api=` the same form fields are sent to a JSON endpoint and drawn as results.
 * Light DOM, no item scope of its own. Docs: readme.md
 * @version 1.0.0 · @author Mads Stoumann
 */

const DEFAULTS = { min: 3, debounce: 300, take: 8 };
const LABELS = {
	loading: 'Searching…',
	empty: 'No results for “{query}”',
	error: 'Search is not available right now.',
	one: '{count} result for “{query}”',
	other: '{count} results for “{query}”',
};

/* an absent or empty attribute is "use the default", never a real zero */
const int = (value, fallback) => {
	if (value === null || value === '') return fallback;
	const n = Number.parseInt(value, 10);
	return Number.isFinite(n) && n >= 0 ? n : fallback;
};

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

/* the response contract (readme.md § Response): { items: [...] } or a bare array */
const normalise = (json) => {
	const list = Array.isArray(json) ? json : Array.isArray(json?.items) ? json.items : [];
	const items = list
		.map((item) => ({
			name: String(item?.name ?? '').trim(),
			url: safeUrl(item?.url),
			description: String(item?.description ?? '').trim(),
			image: safeUrl(typeof item?.image === 'string' ? item.image : item?.image?.url),
			type: String(item?.type ?? '').trim(),
		}))
		.filter((item) => item.name && item.url);
	const total = Number.isFinite(json?.total) ? json.total : items.length;
	/* the words the backend matched, when it says — better marks than the raw query's words */
	const terms = Array.isArray(json?.terms) ? json.terms.filter((term) => typeof term === 'string' && term.trim()) : null;
	return { items, total, mode: typeof json?.mode === 'string' ? json.mode : null, terms };
};

/* words worth marking: three letters or more, regex-escaped, longest first */
const termsOf = (words) => [...new Set(words.map((word) => word.toLowerCase().trim()).filter((word) => word.length >= 3))]
	.sort((a, b) => b.length - a.length)
	.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

/* text with the query's words in <mark> — built from text nodes, never innerHTML */
const marked = (doc, text, terms) => {
	const fragment = doc.createDocumentFragment();
	if (!terms.length) {
		fragment.append(text);
		return fragment;
	}
	const pattern = new RegExp(`(${terms.join('|')})`, 'gi');
	for (const [index, part] of text.split(pattern).entries()) {
		if (!part) continue;
		if (index % 2) {
			const mark = doc.createElement('mark');
			mark.textContent = part;
			fragment.append(mark);
		} else fragment.append(part);
	}
	return fragment;
};

export default class UiSearch extends HTMLElement {
	#abort = null;
	#timer = 0;
	#sequence = 0;
	#form = null;
	#input = null;
	#status = null;
	#list = null;

	/** Map a backend's own JSON onto the response contract: (json, params) => { items, total? } */
	transform = null;

	get form() { return this.#form; }

	get #tokens() { return (this.getAttribute('trigger') || 'submit').split(/\s+/); }

	connectedCallback() {
		if (this.#form) return;
		this.#form = this.querySelector(':scope > search > form, :scope > form');
		this.#input = this.#form?.querySelector('input[type="search"], input[name]');
		if (!this.#form || !this.#input) return;

		const target = this.#target();
		const panel = target.querySelector('[data-search="panel"]') || this.#make(target, 'div', 'panel');
		this.#status = target.querySelector('[data-search="status"]') || this.#make(panel, 'p', 'status');
		this.#list = target.querySelector('[data-search="results"]') || this.#make(panel, 'ol', 'results');
		/* a live region must exist BEFORE text is written into it, or the first count is not read */
		this.#status.setAttribute('role', 'status');

		this.#form.addEventListener('submit', this);
		this.#form.addEventListener('formdata', this);
		this.#input.addEventListener('input', this);
		this.addEventListener('keydown', this);
		if (!this.contains(target)) target.addEventListener('keydown', this);
		this.dataset.state = this.#list.children.length ? 'results' : 'idle';

		if (this.hasAttribute('sync-url')) {
			this.#restore();
			if (this.#input.value.trim() && !this.#list.children.length) this.search();
		}
	}

	disconnectedCallback() {
		clearTimeout(this.#timer);
		this.#abort?.abort();
	}

	handleEvent(event) {
		if (event.type === 'submit') this.#onSubmit(event);
		else if (event.type === 'input') this.#onInput();
		else if (event.type === 'keydown') this.#onKeydown(event);
		else if (event.type === 'formdata') this.#onFormData(event);
	}

	/** Run the form's current query now, against `api`. Resolves with the normalised response, or null. */
	search() {
		return this.#run(this.getAttribute('api'));
	}

	async #run(api) {
		clearTimeout(this.#timer);
		const query = this.#input.value.trim();
		if (!api || query.length < this.#min) {
			this.clear();
			return null;
		}

		const params = new URLSearchParams(new FormData(this.#form));
		params.set('take', String(int(this.getAttribute('take'), DEFAULTS.take)));
		const url = new URL(api, document.baseURI);
		for (const [key, value] of params) url.searchParams.set(key, value);

		this.#abort?.abort();
		this.#abort = new AbortController();
		const sequence = ++this.#sequence;
		this.#state('loading');
		this.#say(this.#label('loading'));

		try {
			const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: this.#abort.signal });
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const json = await response.json();
			if (sequence !== this.#sequence) return null;
			const data = this.transform ? await this.transform(json, params) : json;
			const result = { ...normalise(data), response: data };
			this.#draw(result.items, result.terms ?? query.split(/\s+/));
			this.#state(result.items.length ? 'results' : 'empty');
			this.#say(this.#count(result.total, query));
			this.#emit('ui-search:results', { query, params, ...result });
			return result;
		} catch (error) {
			if (error.name === 'AbortError' || sequence !== this.#sequence) return null;
			this.#list.replaceChildren();
			this.#state('error');
			this.#say(this.#label('error'));
			this.#emit('ui-search:error', { query, error });
			return null;
		}
	}

	/** Empty the results and the status line, and cancel what is in flight. */
	clear() {
		clearTimeout(this.#timer);
		this.#abort?.abort();
		this.#sequence++;
		this.#list?.replaceChildren();
		this.#say('');
		this.#state('idle');
	}

	get #min() {
		return int(this.getAttribute('min'), int(this.#input.getAttribute('minlength'), DEFAULTS.min));
	}

	/* sync-url: the address fills the fields a server did not already echo */
	#restore() {
		const params = new URLSearchParams(location.search);
		for (const field of this.#form.elements) {
			if (!field.name || !params.has(field.name) || field.type === 'hidden' || field.type === 'submit') continue;
			const value = params.get(field.name);
			if (field.type === 'radio' || field.type === 'checkbox') field.checked = field.value === value;
			else if (!field.value) field.value = value;
		}
	}

	#target() {
		const id = this.getAttribute('results');
		return (id && this.ownerDocument.getElementById(id)) || this.querySelector(':scope > search') || this;
	}

	#make(parent, tag, part) {
		const el = this.ownerDocument.createElement(tag);
		el.dataset.search = part;
		parent.append(el);
		return el;
	}

	#onSubmit(event) {
		const api = this.getAttribute('api');
		/* WebMCP: an agent's submit is answered with the response instead of a navigation */
		if (api && event.agentInvoked && typeof event.respondWith === 'function') {
			event.preventDefault();
			event.respondWith(this.#answer());
			return;
		}
		/* Without `submit` in trigger= the form submits natively, to its action= — the results page */
		if (!this.#tokens.includes('submit') || !api) return;
		event.preventDefault();
		if (this.hasAttribute('sync-url')) {
			const url = new URL(location.href);
			url.search = new URLSearchParams(new FormData(this.#form)).toString();
			history.replaceState(history.state, '', url);
		}
		this.search();
	}

	/* the tool result: the whole response, every field kept; errors are values, never throws */
	async #answer() {
		const min = this.#min;
		if (this.#input.value.trim().length < min) return { error: `The query needs at least ${min} characters.` };
		const result = await this.search();
		if (!result) return { error: this.#label('error') };
		return Array.isArray(result.response) ? { items: result.response } : result.response;
	}

	/* empty fields leave every request, native submit included: a shared link is ?q=…, not ?q=…&type= */
	#onFormData({ formData }) {
		const kept = [...formData].filter(([, value]) => value !== '');
		for (const key of new Set(formData.keys())) formData.delete(key);
		for (const [key, value] of kept) formData.append(key, value);
	}

	#onInput() {
		if (!this.#tokens.includes('input')) {
			if (!this.#input.value.trim()) this.clear();
			return;
		}
		clearTimeout(this.#timer);
		if (this.#input.value.trim().length < this.#min) {
			this.clear();
			return;
		}
		const api = this.getAttribute('suggest') || this.getAttribute('api');
		this.#timer = setTimeout(() => this.#run(api), int(this.getAttribute('debounce'), DEFAULTS.debounce));
	}

	/* Arrow keys walk from the field into the result links and back; Escape closes the results first.
	   The links stay in the tab order — this is a list of links, not an ARIA combobox. */
	#onKeydown(event) {
		const links = [...this.#list.querySelectorAll(':scope > li a[href]')];
		const at = links.indexOf(event.target);
		if (event.key === 'Escape' && this.dataset.state !== 'idle') {
			event.preventDefault();
			this.clear();
			this.#input.focus();
		} else if (event.key === 'ArrowDown' && links.length && (event.target === this.#input || at > -1)) {
			event.preventDefault();
			links[Math.min(at + 1, links.length - 1)].focus();
		} else if (event.key === 'ArrowUp' && at > -1) {
			event.preventDefault();
			(at === 0 ? this.#input : links[at - 1]).focus();
		}
	}

	#draw(items, words) {
		const doc = this.ownerDocument;
		const terms = this.hasAttribute('highlight') ? termsOf(words) : [];
		const template = this.querySelector(':scope > template[data-search="item"]');
		this.#list.replaceChildren(...items.map((item) => (template ? this.#fromTemplate(template, item, terms) : this.#item(doc, item, terms))));
	}

	#item(doc, item, terms) {
		const li = doc.createElement('li');
		if (item.type) li.dataset.type = item.type;
		if (item.image) {
			const img = doc.createElement('img');
			img.src = item.image;
			img.alt = '';
			img.loading = 'lazy';
			img.decoding = 'async';
			li.append(img);
		}
		const link = doc.createElement('a');
		link.href = item.url;
		link.append(marked(doc, item.name, terms));
		li.append(link);
		if (item.type) {
			const type = doc.createElement('small');
			type.textContent = item.type;
			li.append(type);
		}
		if (item.description) {
			const description = doc.createElement('p');
			description.append(marked(doc, item.description, terms));
			li.append(description);
		}
		return li;
	}

	/* data-field="name|url|description|image|type" — text through textContent, URLs only into href/src */
	#fromTemplate(template, item, terms) {
		const fragment = template.content.cloneNode(true);
		for (const el of fragment.querySelectorAll('[data-field]')) {
			const field = el.dataset.field;
			const value = item[field];
			if (field === 'url') el.setAttribute('href', value);
			else if (field === 'image') value ? el.setAttribute('src', value) : el.remove();
			else if (!value) el.remove();
			else if (field === 'name' || field === 'description') el.replaceChildren(marked(this.ownerDocument, value, terms));
			else el.textContent = value;
			el.removeAttribute('data-field');
		}
		for (const link of fragment.querySelectorAll('a:not([href])')) link.setAttribute('href', item.url);
		return fragment;
	}

	#label(name) {
		return this.getAttribute(`label-${name}`) ?? LABELS[name] ?? '';
	}

	/* label-one / label-other, plus any CLDR category the page's language uses (label-few, …) */
	#count(total, query) {
		const fill = (text) => text.replaceAll('{count}', total.toLocaleString(this.#lang)).replaceAll('{query}', query);
		if (!total) return fill(this.#label('empty'));
		const category = new Intl.PluralRules(this.#lang).select(total);
		return fill(this.getAttribute(`label-${category}`) ?? (category === 'one' ? this.#label('one') : this.#label('other')));
	}

	get #lang() {
		return this.closest('[lang]')?.getAttribute('lang') || undefined;
	}

	#say(text) {
		if (this.#status) this.#status.textContent = text;
	}

	#state(state) {
		this.dataset.state = state;
		this.#list?.toggleAttribute('aria-busy', state === 'loading');
	}

	#emit(name, detail) {
		this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }));
	}
}

customElements.get('ui-search') || customElements.define('ui-search', UiSearch);
