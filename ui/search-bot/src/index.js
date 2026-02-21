import stylesheet from './index.css' with { type: 'css' };

const ICONS = {
	ai: ['M11 5a9.37 9.37 0 0 0 7.7 7.7 9.37 9.37 0 0 0-7.7 7.7 9.37 9.37 0 0 0-7.7-7.7A9.37 9.37 0 0 0 11 5M18 2a4.26 4.26 0 0 0 3.5 3.5A4.26 4.26 0 0 0 18 9a4.26 4.26 0 0 0-3.5-3.5A4.26 4.26 0 0 0 18 2m-1 15a2.43 2.43 0 0 0 2 2 2.43 2.43 0 0 0-2 2 2.43 2.43 0 0 0-2-2 2.43 2.43 0 0 0 2-2'],
	close: ['M18 6L6 18M6 6l12 12'],
	history: ['M18 3a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-4.724l-4.762 2.857a1 1 0 0 1 -1.508 -.743l-.006 -.114v-2h-1a4 4 0 0 1 -3.995 -3.8l-.005 -.2v-8a4 4 0 0 1 4 -4zm-2.8 9.286a1 1 0 0 0 -1.414 .014a2.5 2.5 0 0 1 -3.572 0a1 1 0 0 0 -1.428 1.4a4.5 4.5 0 0 0 6.428 0a1 1 0 0 0 -.014 -1.414m-5.69 -4.286h-.01a1 1 0 1 0 0 2h.01a1 1 0 0 0 0 -2m5 0h-.01a1 1 0 0 0 0 2h.01a1 1 0 0 0 0 -2'],
	like: ['M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z', 'M1 22h4V9H1z'],
	dislike: ['M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z', 'M23 2h-4v13h4z'],
};

const I18N = {
	close: 'Close',
	followUp: 'Ask a follow-up question',
	history: 'Chat history',
	newQuestion: 'New question',
	noHistory: 'No saved conversations',
	search: 'Search',
	searchLabel: 'Ask a question',
	searchPlaceholder: 'Ask a question or a follow-up',
};

const STORAGE_PREFIX = 'search-bot:';

function chatKey(query) {
	const slug = query.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
	return `${STORAGE_PREFIX}${slug}-${Date.now()}`;
}

function fromStorage(key) {
	try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}

function el(tag, attrs = {}, children = []) {
	const node = document.createElement(tag);
	for (const [key, value] of Object.entries(attrs)) {
		if (value == null) continue;
		if (key === 'part') node.setAttribute('part', value);
		else if (key === 'text') node.textContent = value;
		else if (key in node) node[key] = value;
		else node.setAttribute(key, value);
	}
	for (const child of (Array.isArray(children) ? children : [children])) if (child != null) node.append(child);
	return node;
}

function parseInlineMarkdown(text) {
	const frag = document.createDocumentFragment();
	const pattern = /`([^`]+)`|\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)]+)\)|(?<!["\w/])https?:\/\/[^\s<)]+/g;
	let lastIndex = 0;

	for (const match of text.matchAll(pattern)) {
		if (match.index > lastIndex) frag.append(text.slice(lastIndex, match.index));
		if (match[1] != null) frag.append(el('code', { text: match[1] }));
		else if (match[2] != null) frag.append(el('strong', { text: match[2] }));
		else if (match[3] != null) frag.append(el('em', { text: match[3] }));
		else if (match[4] != null) {
			try { if (/^https?:$/.test(new URL(match[5]).protocol)) frag.append(el('a', { href: match[5], text: match[4] })); else frag.append(match[4]); }
			catch { frag.append(match[4]); }
		}
		else {
			try {
				const u = new URL(match[0]);
				frag.append(el('a', { href: match[0], text: `${u.hostname}${u.pathname}` }));
			} catch { frag.append(match[0]); }
		}
		lastIndex = match.index + match[0].length;
	}

	if (lastIndex < text.length) frag.append(text.slice(lastIndex));
	return frag;
}

function icon(name, part) {
	return `<svg viewBox="0 0 24 24" aria-hidden="true"${part ? ` part="${part}"` : ''}>${ICONS[name].map(d => `<path d="${d}"/>`).join('')}</svg>`;
}

class SearchBot extends HTMLElement {
	static observedAttributes = ['provider'];

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.adoptedStyleSheets = [stylesheet];
		this.messages = [];
		this.chatKey = null;
		this.eventSource = null;
		this.adapter = null;
		this.renderers = new Map();
		this.currentResponse = null;
	}

	$(selector) { return this.shadowRoot.querySelector(selector); }
	message(role, text) { return el('li', { part: role, text }); }
	ensureResultsList(container) { return container.querySelector('ul') || container.appendChild(document.createElement('ul')); }
	emptyHistory() { this.elements.historyList.append(el('li', { text: I18N.noHistory })); }

	emit(name, detail = {}) {
		this.dispatchEvent(new CustomEvent(`search-bot:${name}`, { bubbles: true, composed: true, detail }));
	}

	registerRenderer(name, fn) {
		this.renderers.set(name, fn);
	}

	appendResultItem(ul, { url, name, description, image }, rich = false) {
		const children = [];
		if (rich) {
			if (image) children.push(el('img', { src: image, alt: '', loading: 'lazy', part: 'search-result-img' }));
			children.push(el('strong', { text: name }));
			if (description) children.push(el('small', { part: 'search-result-desc', text: description }));
		} else children.push(document.createTextNode(name));
		ul.append(el('li', {}, el('a', { href: url }, children)));
	}

	getSearchContext() {
		const prev = [], last = [];
		for (const message of this.messages) {
			if (message.role === 'user') prev.push(message.text);
			if (message.role === 'response' && message.results?.length) last.push(...message.results);
		}
		return { prev: prev.slice(-10), last: last.slice(-20) };
	}

	attributeChangedCallback(name) {
		if (name === 'provider') this.adapter = null;
	}

	connectedCallback() {
		this.render();
		this.elements = {
			conversation: this.$('[part="search-conversation"]'),
			dialog: this.$('[part="search-overlay"]'),
			form: this.$('form'),
			historyList: this.$('[part="search-history-list"]'),
			historyPanel: this.$('#search-history-popover'),
			input: this.$('textarea[name="q"]'),
			legend: this.$('[part="search-legend"]'),
			newQuestion: this.$('[part="search-new"]'),
			trigger: this.$('[part="search-trigger"]'),
		};

		const { dialog, form, historyList, historyPanel, input, newQuestion, trigger } = this.elements;

		form.addEventListener('submit', (e) => { e.preventDefault(); this.search(input.value); });
		input.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
		});
		newQuestion.addEventListener('click', () => this.newChat());
		historyPanel.addEventListener('toggle', (e) => { if (e.newState === 'open') this.renderHistory(); });
		historyList.addEventListener('click', (e) => {
			const li = e.target.closest('li[data-key]');
			if (!li) return;
			if (e.target.closest('[part="search-history-delete"]')) {
				localStorage.removeItem(li.dataset.key);
				if (this.chatKey === li.dataset.key) this.newChat();
				li.remove();
				if (!historyList.querySelector('li[data-key]')) this.emptyHistory();
			} else {
				this.loadChat(li.dataset.key);
				historyPanel.hidePopover();
			}
		});

		trigger.addEventListener('click', () => {
			queueMicrotask(() => {
				if (dialog.open) {
					this.emit('open', { chatKey: this.chatKey });
					this.saveUIState();
				}
			});
		});

		dialog.addEventListener('close', () => {
			this.emit('close', { chatKey: this.chatKey });
			this.saveUIState();
		});

		if (this.hasAttribute('preserve-state') && this.hasAttribute('preserve-history')) {
			this._beforeUnloadHandler = () => this.saveUIState();
			window.addEventListener('beforeunload', this._beforeUnloadHandler);
			try {
				const state = JSON.parse(sessionStorage.getItem('search-bot:ui-state'));
				if (state?.open && state.activeChatKey) {
					this.loadChat(state.activeChatKey);
					dialog.showModal();
					this.emit('open', { chatKey: this.chatKey });
				}
			} catch {}
		}
	}

	saveUIState() {
		if (!this.hasAttribute('preserve-state') || !this.hasAttribute('preserve-history')) return;
		try {
			sessionStorage.setItem('search-bot:ui-state', JSON.stringify({
				open: this.elements.dialog?.open || false,
				activeChatKey: this.chatKey,
			}));
		} catch {}
	}

	async search(query) {
		const trimmed = query?.trim();
		if (!trimmed || !this.hasAttribute('api')) return;
		this.closeEventSource();

		const isNewChat = !this.chatKey;
		this.chatKey ??= chatKey(trimmed);
		if (isNewChat) this.emit('chat-start', { chatKey: this.chatKey, query: trimmed });

		this.messages.push({ role: 'user', text: trimmed });
		this.emit('message', { chatKey: this.chatKey, role: 'user', text: trimmed });
		this.elements.conversation.append(this.message('user', trimmed));

		this.currentResponse = {
			li: this.message('response'),
			summaryText: '',
			results: [],
			refs: {},
			summaryNode: document.createTextNode(''),
		};
		this.elements.conversation.append(this.currentResponse.li);
		this.currentResponse.li.append(this.currentResponse.summaryNode);
		this.elements.input.value = '';
		this.updateLabel();

		if (!this.adapter) {
			const provider = this.getAttribute('provider') || 'nlweb';
			this.adapter = await import(`./adapters/${provider}.js`);
		}

		const { url } = this.adapter.buildRequest(
			this.getAttribute('api'), trimmed, this.getSearchContext()
		);

		this.eventSource = new EventSource(url);

		this.eventSource.onmessage = (e) => {
			const msg = this.adapter.parseEvent(e.data);
			if (!msg) return;
			switch (msg.type) {
				case 'chunk': this.appendChunk(msg.text); break;
				case 'results': this.appendResults(msg.items); break;
				case 'component': this.appendComponent(msg.name, msg.props); break;
				case 'done': this.completeResponse(); break;
				case 'error': this.handleError(msg.message); break;
			}
		};

		this.eventSource.onerror = () => {
			this.emit('error', { chatKey: this.chatKey, message: 'Connection failed' });
			this.closeEventSource();
		};
	}

	appendChunk(text) {
		this.currentResponse.summaryText += text;
		this.currentResponse.summaryNode.textContent = this.currentResponse.summaryText;
	}

	appendResults(items) {
		const { li, results, refs } = this.currentResponse;
		const ul = this.ensureResultsList(li);
		for (const item of items) {
			refs[item.url] = item.name;
			results.push({ name: item.name, url: item.url, image: item.image, description: item.description });
			this.appendResultItem(ul, item, true);
		}
	}

	appendComponent(name, props) {
		const renderer = this.renderers.get(name);
		if (!renderer) return;
		const node = renderer(props);
		if (!node) return;
		this.currentResponse.li.append(node);
		(this.currentResponse.components ??= []).push({ name, props });
	}

	completeResponse() {
		this.closeEventSource();
		const { li, summaryText, results, refs, components } = this.currentResponse;
		this.renderParsedSummary(li, summaryText, refs);
		this.messages.push({ role: 'response', summary: summaryText, results });
		if (components) {
			for (const c of components) this.messages.push({ role: 'component', name: c.name, props: c.props });
		}
		this.emit('response', { chatKey: this.chatKey, summary: summaryText, results });
		this.saveChat();
		if (this.hasAttribute('feedback')) this.appendFeedback(li);
		li.scrollIntoView({ behavior: 'smooth', block: 'end' });
		this.currentResponse = null;
	}

	handleError(message) {
		this.emit('error', { chatKey: this.chatKey, message });
		this.closeEventSource();
	}

	appendFeedback(responseLi) {
		const msgIdx = this.messages.length - 1;
		const container = el('div', { part: 'search-feedback' });
		container.innerHTML = ['like', 'dislike'].map(v =>
			`<button part="search-feedback-${v}" aria-label="${v}">${icon(v, 'icon-stroke')}</button>`
		).join('');
		container.addEventListener('click', (e) => {
			const btn = e.target.closest('button');
			if (!btn) return;
			this.emit('feedback', { chatKey: this.chatKey, messageIndex: msgIdx, value: btn.ariaLabel });
			container.remove();
		});
		responseLi.append(container);
	}

	renderParsedSummary(container, text, refs) {
		const lines = text.split('\n');
		const refIdx = lines.findIndex(l => l.trim().toLowerCase().startsWith('references'));
		const bodyLines = refIdx === -1 ? lines : lines.slice(0, refIdx);
		const refMap = Object.fromEntries(
			(refIdx === -1 ? [] : lines.slice(refIdx + 1))
				.map(l => l.match(/^\[(\d+)]\s*(https?:\/\/\S+)/))
				.filter(Boolean)
				.map(m => [m[1], m[2]])
		);

		const fragment = document.createDocumentFragment();
		let ul = null;

		for (const line of bodyLines) {
			const bulletMatch = line.match(/^\*\s+(.+)/);
			if (bulletMatch) {
				if (!ul) fragment.append(ul = document.createElement('ul'));
				const li = document.createElement('li');
				this.appendInlineContent(li, bulletMatch[1], refs, refMap);
				ul.append(li);
			} else {
				ul = null;
				if (line.trim()) {
					const p = document.createElement('p');
					this.appendInlineContent(p, line, refs, refMap);
					fragment.append(p);
				}
			}
		}

		const existingUl = container.querySelector('ul');
		container.replaceChildren(fragment);
		if (existingUl) container.append(existingUl);
	}

	appendInlineContent(container, text, refs, refMap) {
		for (const part of text.split(/(\[\d+\])/g)) {
			const m = part.match(/^\[(\d+)\]$/);
			if (m && refMap[m[1]]) {
				const url = refMap[m[1]];
				container.append(el('a', { href: url, text: refs[url] || url }));
			} else {
				container.append(parseInlineMarkdown(part));
			}
		}
	}

	saveChat() {
		if (!this.chatKey || !this.hasAttribute('preserve-history')) return;
		localStorage.setItem(this.chatKey, JSON.stringify({
			title: this.messages.find(m => m.role === 'user')?.text || '',
			created: Number(this.chatKey.split('-').pop()),
			messages: this.messages,
		}));
		this.saveUIState();
	}

	renderHistory() {
		const list = this.elements.historyList;
		list.replaceChildren();
		const chats = Object.keys(localStorage)
			.filter(k => k.startsWith(STORAGE_PREFIX))
			.map(k => { const data = fromStorage(k); return data?.title ? { key: k, title: data.title, created: data.created || 0 } : null; })
			.filter(Boolean)
			.sort((a, b) => b.created - a.created);
		if (!chats.length) return this.emptyHistory();

		for (const chat of chats) {
			list.append(el('li', { 'data-key': chat.key }, [
				el('span', { text: chat.title }),
				chat.created ? el('small', { text: new Date(chat.created).toLocaleDateString() }) : null,
				el('button', { part: 'search-history-delete', ariaLabel: I18N.close, text: '\u00d7' }),
			]));
		}
	}

	loadChat(key) {
		const data = fromStorage(key);
		if (!data?.messages) return;
		this.closeEventSource();
		this.chatKey = key;
		this.messages = data.messages;
		this.elements.conversation.replaceChildren();

		for (const msg of this.messages) {
			if (msg.role === 'user') {
				this.elements.conversation.append(this.message('user', msg.text));
				continue;
			}
			if (msg.role === 'component') {
				const renderer = this.renderers.get(msg.name);
				if (renderer) {
					const node = renderer(msg.props);
					if (node) this.elements.conversation.append(node);
				}
				continue;
			}
			const li = this.message('response');
			this.renderParsedSummary(li, msg.summary || '', Object.fromEntries((msg.results || []).map(r => [r.url, r.name])));
			if (msg.results?.length) {
				const ul = document.createElement('ul');
				for (const result of msg.results) this.appendResultItem(ul, result, true);
				li.append(ul);
			}
			this.elements.conversation.append(li);
		}

		this.updateLabel();
		this.elements.conversation.lastElementChild?.scrollIntoView({ block: 'end' });
	}

	newChat() {
		const previousChatKey = this.chatKey;
		this.closeEventSource();
		this.chatKey = null;
		this.messages = [];
		this.currentResponse = null;
		this.elements.conversation.replaceChildren();
		this.updateLabel();
		this.elements.input.focus();
		if (previousChatKey) this.emit('chat-clear', { previousChatKey });
	}

	updateLabel() { this.elements.legend.textContent = this.messages.length ? I18N.followUp : I18N.searchLabel; }
	closeEventSource() { this.eventSource?.close(); this.eventSource = null; }

	disconnectedCallback() {
		this.closeEventSource();
		if (this._beforeUnloadHandler) {
			window.removeEventListener('beforeunload', this._beforeUnloadHandler);
		}
	}

	render() {
		this.shadowRoot.innerHTML = `
			<button part="search-trigger" commandfor="search-dialog" command="show-modal" aria-label="${I18N.search}">
				<slot name="icon">${icon('ai')}</slot>
			</button>
			<dialog id="search-dialog" part="search-overlay" closedby="any">
				<div part="search-header">
					<button part="search-history" popovertarget="search-history-popover" aria-label="${I18N.history}">${icon('history')}</button>
					<div id="search-history-popover" part="search-history-panel" popover>
						<ul part="search-history-list"></ul>
					</div>
					<button part="search-close" commandfor="search-dialog" command="close" aria-label="${I18N.close}">${icon('close', 'icon-stroke')}</button>
				</div>
				<ol part="search-conversation"></ol>
				<form part="search-form">
					<fieldset part="search-fieldset">
						<legend part="search-legend">${I18N.searchLabel}</legend>
						<textarea part="search-input" name="q" autocomplete="off" autofocus enterkeyhint="search" placeholder="${I18N.searchPlaceholder}"></textarea>
					</fieldset>
					<button part="search-new" aria-label="${I18N.newQuestion}">${I18N.newQuestion}</button>
				</form>
			</dialog>
		`;
	}
}

customElements.define('search-bot', SearchBot);
