import stylesheet from './index.css' with { type: 'css' };
const ICONS = {
	ai: ['M11 5a9.37 9.37 0 0 0 7.7 7.7 9.37 9.37 0 0 0-7.7 7.7 9.37 9.37 0 0 0-7.7-7.7A9.37 9.37 0 0 0 11 5M18 2a4.26 4.26 0 0 0 3.5 3.5A4.26 4.26 0 0 0 18 9a4.26 4.26 0 0 0-3.5-3.5A4.26 4.26 0 0 0 18 2m-1 15a2.43 2.43 0 0 0 2 2 2.43 2.43 0 0 0-2 2 2.43 2.43 0 0 0-2-2 2.43 2.43 0 0 0 2-2'],
	close: ['M19 2h-14a3 3 0 0 0 -3 3v14a3 3 0 0 0 3 3h14a3 3 0 0 0 3 -3v-14a3 3 0 0 0 -3 -3zm-9.387 6.21l.094 .083l2.293 2.292l2.293 -2.292a1 1 0 0 1 1.497 1.32l-.083 .094l-2.292 2.293l2.292 2.293a1 1 0 0 1 -1.32 1.497l-.094 -.083l-2.293 -2.292l-2.293 2.292a1 1 0 0 1 -1.497 -1.32l.083 -.094l2.292 -2.293l-2.292 -2.293a1 1 0 0 1 1.32 -1.497z'],
	history: ['M8 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2', 'M16 2v4', 'M8 2v4', 'M4 10h16', 'M8 14h.01', 'M12 14h.01', 'M16 14h.01', 'M8 18h.01', 'M12 18h.01'],
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
const STORAGE_PREFIX = 'search-widget:';

function icon(name, part) {
	return `<svg viewBox="0 0 24 24" aria-hidden="true"${part ? ` part="${part}"` : ''}>${ICONS[name].map(d => `<path d="${d}"/>`).join('')}</svg>`;
}

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

class SearchWidget extends HTMLElement {
	constructor() {
		super(); this.attachShadow({ mode: 'open' }); this.shadowRoot.adoptedStyleSheets = [stylesheet]; this.messages = []; this.chatKey = null; this.eventSource = null;
	}

	$(selector) { return this.shadowRoot.querySelector(selector); }
	message(role, text) { return el('li', { part: role, text }); }
	ensureResultsList(container) { return container.querySelector('ul') || container.appendChild(document.createElement('ul')); }
	emptyHistory() { this.elements.historyList.append(el('li', { text: I18N.noHistory })); }
	normalizeResult(item) {
		const schema = item.schema_object || {};
		return { description: schema.description, image: schema.image, name: schema.name || item.name, url: item.url };
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

	connectedCallback() {
		this.render();
		this.elements = {
			conversation: this.$('[part="search-conversation"]'),
			form: this.$('form'),
			historyList: this.$('[part="search-history-list"]'),
			historyPanel: this.$('#search-history-popover'),
			input: this.$('textarea[name="q"]'),
			legend: this.$('[part="search-legend"]'),
			newQuestion: this.$('[part="search-new"]'),
		};
		const { form, historyList, historyPanel, input, newQuestion } = this.elements;
		form.addEventListener('submit', (e) => { e.preventDefault(); this.search(input.value); });
		this.elements.input.addEventListener('keydown', (e) => {
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
	}

	search(query) {
		const trimmed = query?.trim();
		if (!trimmed || !this.hasAttribute('api')) return;
		this.closeEventSource();
		this.chatKey ??= chatKey(trimmed);
		this.messages.push({ role: 'user', text: trimmed });
		this.elements.conversation.append(this.message('user', trimmed));
		const responseLi = this.message('response');
		this.elements.conversation.append(responseLi);
		this.elements.input.value = ''; this.updateLabel();
		const { prev, last } = this.getSearchContext();
		const params = new URLSearchParams({ query: trimmed, display_mode: 'full', generate_mode: 'summarize' });
		if (prev.length > 1) params.set('prev', JSON.stringify(prev.slice(0, -1)));
		if (last.length) params.set('last_ans', JSON.stringify(last));
		this.eventSource = new EventSource(`${this.getAttribute('api')}/ask?${params}`);
		let summaryText = '';
		const refs = {}, results = [], summaryNode = document.createTextNode('');
		responseLi.append(summaryNode);
		this.eventSource.onmessage = (e) => {
			try {
				const data = JSON.parse(e.data);
				switch (data.message_type) {
					case 'summary':
						summaryText += data.message;
						summaryNode.textContent = summaryText;
						break;
					case 'result_batch': {
						const ul = this.ensureResultsList(responseLi);
						for (const item of data.results) {
							const result = this.normalizeResult(item);
							refs[result.url] = result.name;
							results.push({ name: result.name, url: result.url });
							this.appendResultItem(ul, result, true);
						}
						break;
					}
					case 'complete':
						this.closeEventSource();
						this.renderParsedSummary(responseLi, summaryText, refs);
						this.messages.push({ role: 'response', summary: summaryText, results });
						this.saveChat();
						responseLi.scrollIntoView({ behavior: 'smooth', block: 'end' });
				}
			} catch {}
		};
		this.eventSource.onerror = () => this.closeEventSource();
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

		const fragment = document.createDocumentFragment(); let ul = null;

		for (const line of bodyLines) {
			const bulletMatch = line.match(/^\*\s+(.+)/);
			if (bulletMatch) {
				if (!ul) fragment.append(ul = document.createElement('ul'));
				const li = document.createElement('li');
				this.appendTextWithRefs(li, bulletMatch[1], refs, refMap);
				ul.append(li);
			} else { ul = null; if (line.trim()) { const p = document.createElement('p'); this.appendTextWithRefs(p, line, refs, refMap); fragment.append(p); } }
		}

		const existingUl = container.querySelector('ul');
		container.replaceChildren(fragment);
		if (existingUl) container.append(existingUl);
	}

	appendTextWithRefs(container, text, refs, refMap) {
		for (const part of text.split(/(\[\d+\])/g)) {
			const m = part.match(/^\[(\d+)\]$/);
			if (m && refMap[m[1]]) {
				const a = document.createElement('a'); a.href = refMap[m[1]]; a.textContent = refs[refMap[m[1]]] || refMap[m[1]];
				container.append(a);
			} else {
				container.append(part);
			}
		}
	}

	saveChat() {
		if (!this.chatKey) return;
		localStorage.setItem(this.chatKey, JSON.stringify({
			title: this.messages.find(m => m.role === 'user')?.text || '',
			created: Number(this.chatKey.split('-').pop()),
			messages: this.messages,
		}));
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
			const li = this.message('response');
			this.renderParsedSummary(li, msg.summary || '', Object.fromEntries((msg.results || []).map(r => [r.url, r.name])));
			if (msg.results?.length) {
				const ul = document.createElement('ul');
				for (const result of msg.results) this.appendResultItem(ul, result);
				li.append(ul);
			}
			this.elements.conversation.append(li);
		}
		this.updateLabel();
		this.elements.conversation.lastElementChild?.scrollIntoView({ block: 'end' });
	}

	newChat() {
		this.closeEventSource();
		this.chatKey = null; this.messages = [];
		this.elements.conversation.replaceChildren();
		this.updateLabel(); this.elements.input.focus();
	}

	updateLabel() { this.elements.legend.textContent = this.messages.length ? I18N.followUp : I18N.searchLabel; }
	closeEventSource() { this.eventSource?.close(); this.eventSource = null; }
	disconnectedCallback() { this.closeEventSource(); }

	render() {
		this.shadowRoot.innerHTML = `
			<button part="search-trigger" commandfor="search-dialog" command="show-modal" aria-label="${I18N.search}">
				<slot name="icon">${icon('ai')}</slot>
			</button>
			<dialog id="search-dialog" part="search-overlay" closedby="any">
				<div part="search-header">
					<button part="search-history" popovertarget="search-history-popover" aria-label="${I18N.history}">${icon('history', 'icon-stroke')}</button>
					<div id="search-history-popover" part="search-history-panel" popover>
						<ul part="search-history-list"></ul>
					</div>
					<button part="search-close" commandfor="search-dialog" command="close" aria-label="${I18N.close}">${icon('close')}</button>
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

customElements.define('search-widget', SearchWidget);
