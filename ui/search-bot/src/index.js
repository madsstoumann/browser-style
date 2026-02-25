import stylesheet from './index.css' with { type: 'css' };

const ICONS = {
	ai: ['M11 5a9.37 9.37 0 0 0 7.7 7.7 9.37 9.37 0 0 0-7.7 7.7 9.37 9.37 0 0 0-7.7-7.7A9.37 9.37 0 0 0 11 5M18 2a4.26 4.26 0 0 0 3.5 3.5A4.26 4.26 0 0 0 18 9a4.26 4.26 0 0 0-3.5-3.5A4.26 4.26 0 0 0 18 2m-1 15a2.43 2.43 0 0 0 2 2 2.43 2.43 0 0 0-2 2 2.43 2.43 0 0 0-2-2 2.43 2.43 0 0 0 2-2'],
	close: ['M18 6L6 18M6 6l12 12'],
	copy: ['M7 9.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667l0 -8.666', 'M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1'],
	plus: ['M12 5v14M5 12h14'],
	history: ['M12 8l0 4l2 2', 'M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5'],
	like: ['M7 11v8a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-7a1 1 0 0 1 1 -1h3a4 4 0 0 0 4 -4v-1a2 2 0 0 1 4 0v5h3a2 2 0 0 1 2 2l-1 5a2 3 0 0 1 -2 2h-7a3 3 0 0 1 -3 -3'],
	likeFilled: ['M13 3a3 3 0 0 1 2.995 2.824l.005 .176v4h2a3 3 0 0 1 2.98 2.65l.015 .174l.005 .176l-.02 .196l-1.006 5.032c-.381 1.626 -1.502 2.796 -2.81 2.78l-.164 -.008h-8a1 1 0 0 1 -.993 -.883l-.007 -.117l.001 -9.536a1 1 0 0 1 .5 -.865a2.998 2.998 0 0 0 1.492 -2.397l.007 -.202v-1a3 3 0 0 1 3 -3z', 'M5 10a1 1 0 0 1 .993 .883l.007 .117v9a1 1 0 0 1 -.883 .993l-.117 .007h-1a2 2 0 0 1 -1.995 -1.85l-.005 -.15v-7a2 2 0 0 1 1.85 -1.995l.15 -.005h1z'],
	dislike: ['M7 13v-8a1 1 0 0 0 -1 -1h-2a1 1 0 0 0 -1 1v7a1 1 0 0 0 1 1h3a4 4 0 0 1 4 4v1a2 2 0 0 0 4 0v-5h3a2 2 0 0 0 2 -2l-1 -5a2 3 0 0 0 -2 -2h-7a3 3 0 0 0 -3 3'],
	dislikeFilled: ['M13 21.008a3 3 0 0 0 2.995 -2.823l.005 -.177v-4h2a3 3 0 0 0 2.98 -2.65l.015 -.173l.005 -.177l-.02 -.196l-1.006 -5.032c-.381 -1.625 -1.502 -2.796 -2.81 -2.78l-.164 .008h-8a1 1 0 0 0 -.993 .884l-.007 .116l.001 9.536a1 1 0 0 0 .5 .866a2.998 2.998 0 0 1 1.492 2.396l.007 .202v1a3 3 0 0 0 3 3z', 'M5 14.008a1 1 0 0 0 .993 -.883l.007 -.117v-9a1 1 0 0 0 -.883 -.993l-.117 -.007h-1a2 2 0 0 0 -1.995 1.852l-.005 .15v7a2 2 0 0 0 1.85 1.994l.15 .005h1z'],
	share: ['M3 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0', 'M15 6a3 3 0 1 0 6 0a3 3 0 1 0 -6 0', 'M15 18a3 3 0 1 0 6 0a3 3 0 1 0 -6 0', 'M8.7 10.7l6.6 -3.4', 'M8.7 13.3l6.6 3.4'],
	submit: ['M10 14l11 -11', 'M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5'],
	stop: ['M17 4h-10a3 3 0 0 0 -3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3 -3v-10a3 3 0 0 0 -3 -3z']
};

const I18N = {
	close: 'Close',
	followUp: 'Ask a follow-up question',
	history: 'Chat history',
	newQuestion: 'New question',
	noHistory: 'No saved conversations',
	aborted: 'Response stopped',
	copy: 'Copy to clipboard',
	share: 'Share',
	search: 'Search',
	stop: 'Stop',
	searchLabel: 'Ask a question',
	searchPlaceholder: 'Ask a question or a follow-up',
};

function chatKey(prefix, query) {
	const slug = query.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
	return `${prefix}${slug}-${Date.now()}`;
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

function icon(name) {
	return `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name].map(d => `<path d="${d}"/>`).join('')}</svg>`;
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
		this._uid = Math.random().toString(36).slice(2, 8);
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
			const textChildren = [el('strong', { text: name })];
			if (description) textChildren.push(el('small', { part: 'search-result-desc', text: description }));
			children.push(el('span', { part: 'search-result-text' }, textChildren));
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
		this._storagePrefix = this.id ? `${this.id}:` : 'search-bot:';
		this.render();
		this.elements = {
			conversation: this.$('[part="search-conversation"]'),
			dialog: this.$('[part="search-overlay"]'),
			form: this.$('form'),
			historyList: this.$('[part="search-history-list"]'),
			historyPanel: this.$(`#search-history-popover-${this._uid}`),
			input: this.$('textarea[name="q"]'),
			legend: this.$('[part="search-legend"]'),
			newQuestion: this.$('[part="search-new"]'),
			stop: this.$('[part="search-stop"]'),
			trigger: this.$('[part="search-trigger"]'),
		};

		const { dialog, form, historyList, historyPanel, input, newQuestion, stop, trigger } = this.elements;

		form.addEventListener('submit', (e) => { e.preventDefault(); this.search(input.value); });
		stop.addEventListener('click', () => this.abortSearch());
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
				const state = JSON.parse(sessionStorage.getItem(`${this._storagePrefix}ui-state`));
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
			sessionStorage.setItem(`${this._storagePrefix}ui-state`, JSON.stringify({
				open: this.elements.dialog?.open || false,
				activeChatKey: this.chatKey,
			}));
		} catch {}
	}

	async search(query) {
		const trimmed = query?.trim();
		if (!trimmed || !this.hasAttribute('api')) return;
		this.closeEventSource();
		this.currentResponse = null;

		const isNewChat = !this.chatKey;
		this.chatKey ??= chatKey(this._storagePrefix, trimmed);
		if (isNewChat) this.emit('chat-start', { chatKey: this.chatKey, query: trimmed });

		this.messages.push({ role: 'user', text: trimmed });
		this.emit('message', { chatKey: this.chatKey, role: 'user', text: trimmed });
		this.elements.conversation.append(this.message('user', trimmed));

		this.currentResponse = {
			li: el('li', { part: 'response pending' }),
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

		const options = {};
		const maxResults = this.getAttribute('max-results');
		if (maxResults) options.maxResults = Number(maxResults);
		const rewrite = this.getAttribute('rewrite');
		if (rewrite != null) options.rewrite = rewrite !== 'false';

		const { url } = this.adapter.buildRequest(
			this.getAttribute('api'), trimmed, this.getSearchContext(), options
		);

		this.elements.stop.hidden = false;
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
			this.elements.stop.hidden = true;
			this.emit('error', { chatKey: this.chatKey, message: 'Connection failed' });
			this.closeEventSource();
			this.currentResponse = null;
		};
	}

	appendChunk(text) {
		this.currentResponse.li.part.remove('pending');
		this.currentResponse.summaryText += text;
		this.currentResponse.summaryNode.textContent = this.currentResponse.summaryText;
	}

	appendResults(items) {
		this.currentResponse.li.part.remove('pending');
		const { li, results, refs } = this.currentResponse;
		const ul = this.ensureResultsList(li);
		for (const item of items) {
			refs[item.url] = item.name;
			results.push({ name: item.name, url: item.url, image: item.image, description: item.description });
			this.appendResultItem(ul, item, true);
		}
	}

	appendComponent(name, props) {
		this.currentResponse.li.part.remove('pending');
		const renderer = this.renderers.get(name);
		if (!renderer) return;
		const node = renderer(props);
		if (!node) return;
		this.currentResponse.li.append(node);
		(this.currentResponse.components ??= []).push({ name, props });
	}

	completeResponse() {
		this.elements.stop.hidden = true;
		this.closeEventSource();
		const { li, summaryText, results, refs, components } = this.currentResponse;
		this.renderParsedSummary(li, summaryText, refs);
		this.messages.push({ role: 'response', summary: summaryText, results });
		if (components) {
			for (const c of components) this.messages.push({ role: 'component', name: c.name, props: c.props });
		}
		this.emit('response', { chatKey: this.chatKey, summary: summaryText, results });
		this.saveChat();
		this.appendResponseActions(li);
		li.scrollIntoView({ behavior: 'smooth', block: 'end' });
		this.currentResponse = null;
	}

	handleError(message) {
		this.elements.stop.hidden = true;
		this.emit('error', { chatKey: this.chatKey, message });
		this.closeEventSource();
		this.currentResponse = null;
	}

	appendResponseActions(responseLi) {
		const hasFeedback = this.hasAttribute('feedback');
		const hasShare = this.hasAttribute('share');
		if (!hasFeedback && !hasShare) return;

		const msgIdx = this.messages.length - 1;
		const container = el('div', { part: 'search-feedback' });

		if (hasFeedback) {
			container.innerHTML = ['like', 'dislike'].map(v =>
				`<button type="button" part="search-feedback-${v}" aria-label="${v}">${icon(v)}${icon(v + 'Filled')}</button>`
			).join('');
			container.addEventListener('click', (e) => {
				const btn = e.target.closest('[part^="search-feedback-"]');
				if (!btn) return;
				const value = btn.ariaLabel;
				const prev = container.querySelector('[aria-pressed="true"]');
				if (prev) prev.removeAttribute('aria-pressed');
				btn.setAttribute('aria-pressed', 'true');
				this.emit('feedback', { chatKey: this.chatKey, messageIndex: msgIdx, value });
			});
		}

		if (hasShare) {
			const text = () => responseLi.textContent.trim();
			const copyBtn = el('button', { type: 'button', ariaLabel: I18N.copy });
			copyBtn.innerHTML = icon('copy');
			copyBtn.addEventListener('click', async () => {
				await navigator.clipboard.writeText(text());
				this.emit('copy', { chatKey: this.chatKey, text: text() });
			});
			container.append(copyBtn);
			if (navigator.share) {
				const shareBtn = el('button', { type: 'button', ariaLabel: I18N.share });
				shareBtn.innerHTML = icon('share');
				shareBtn.addEventListener('click', async () => {
					try {
						await navigator.share({ text: text() });
						this.emit('share', { chatKey: this.chatKey, text: text() });
					} catch {}
				});
				container.append(shareBtn);
			}
		}

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
			.filter(k => k.startsWith(this._storagePrefix))
			.map(k => { const data = fromStorage(k); return data?.title ? { key: k, title: data.title, created: data.created || 0 } : null; })
			.filter(Boolean)
			.sort((a, b) => b.created - a.created);
		if (!chats.length) return this.emptyHistory();

		for (const chat of chats) {
			list.append(el('li', { 'data-key': chat.key }, [
				el('span', { text: chat.title }),
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

		const lastResponse = this.elements.conversation.querySelector('li[part="response"]:last-of-type');
		if (lastResponse) this.appendResponseActions(lastResponse);

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

	abortSearch() {
		if (!this.eventSource) return;
		this.elements.stop.hidden = true;
		this.closeEventSource();
		if (this.currentResponse) {
			this.currentResponse.li.part.remove('pending');
			const abortedEl = el('em', { part: 'search-aborted', text: I18N.aborted });
			this.currentResponse.li.append(abortedEl);
			this.messages.push({ role: 'response', summary: this.currentResponse.summaryText, results: this.currentResponse.results });
			this.emit('abort', { chatKey: this.chatKey });
			this.saveChat();
			this.currentResponse = null;
		}
	}

	updateLabel() { this.elements.legend.textContent = this.messages.length ? I18N.followUp : I18N.searchLabel; }
	closeEventSource() { this.eventSource?.close(); this.eventSource = null; }

	disconnectedCallback() {
		this.closeEventSource();
		this.currentResponse = null;
		this.messages = [];
		this.elements = null;
		if (this._beforeUnloadHandler) {
			window.removeEventListener('beforeunload', this._beforeUnloadHandler);
			this._beforeUnloadHandler = null;
		}
	}

	render() {
		const uid = this._uid;
		this.shadowRoot.innerHTML = `
			<button part="search-trigger" commandfor="search-dialog-${uid}" command="show-modal" aria-label="${I18N.search}">
				<slot name="icon-trigger">${icon('ai')}</slot>
			</button>
			<dialog id="search-dialog-${uid}" part="search-overlay" closedby="any">
				<div part="search-header">
					<button part="search-history" popovertarget="search-history-popover-${uid}" aria-label="${I18N.history}"><slot name="icon-history">${icon('history')}</slot></button>
					<div id="search-history-popover-${uid}" part="search-history-panel" popover>
						<ul part="search-history-list"></ul>
					</div>
					<button part="search-new" aria-label="${I18N.newQuestion}"><slot name="icon-new">${icon('plus')}</slot></button>
					<button part="search-close" commandfor="search-dialog-${uid}" command="close" aria-label="${I18N.close}"><slot name="icon-close">${icon('close')}</slot></button>
				</div>
				<ol part="search-conversation"></ol>
				<form part="search-form">
					<fieldset part="search-fieldset">
						<legend part="search-legend">${I18N.searchLabel}</legend>
						<textarea part="search-input" name="q" autocomplete="off" autofocus enterkeyhint="search" placeholder="${I18N.searchPlaceholder}"></textarea>
						<nav part="search-actions">
							<button type="submit" part="search-submit" aria-label="${I18N.search}"><slot name="icon-submit">${icon('submit')}</slot></button>
							<button type="button" part="search-stop" hidden aria-label="${I18N.stop}"><slot name="icon-stop">${icon('stop')}</slot></button>
						</nav>
					</fieldset>
				</form>
			</dialog>
		`;
	}
}

customElements.define('search-bot', SearchBot);
