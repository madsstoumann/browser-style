const STORAGE_PREFIX = 'search-widget:';

import stylesheet from './index.css' with { type: 'css' };

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

const ICONS = {
	ai: ['M11 5a9.37 9.37 0 0 0 7.7 7.7 9.37 9.37 0 0 0-7.7 7.7 9.37 9.37 0 0 0-7.7-7.7A9.37 9.37 0 0 0 11 5M18 2a4.26 4.26 0 0 0 3.5 3.5A4.26 4.26 0 0 0 18 9a4.26 4.26 0 0 0-3.5-3.5A4.26 4.26 0 0 0 18 2m-1 15a2.43 2.43 0 0 0 2 2 2.43 2.43 0 0 0-2 2 2.43 2.43 0 0 0-2-2 2.43 2.43 0 0 0 2-2'],
	close: ['M19 2h-14a3 3 0 0 0 -3 3v14a3 3 0 0 0 3 3h14a3 3 0 0 0 3 -3v-14a3 3 0 0 0 -3 -3zm-9.387 6.21l.094 .083l2.293 2.292l2.293 -2.292a1 1 0 0 1 1.497 1.32l-.083 .094l-2.292 2.293l2.292 2.293a1 1 0 0 1 -1.32 1.497l-.094 -.083l-2.293 -2.292l-2.293 2.292a1 1 0 0 1 -1.497 -1.32l.083 -.094l2.292 -2.293l-2.292 -2.293a1 1 0 0 1 1.32 -1.497z'],
	history: ['M8 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2', 'M16 2v4', 'M8 2v4', 'M4 10h16', 'M8 14h.01', 'M12 14h.01', 'M16 14h.01', 'M8 18h.01', 'M12 18h.01'],
};

function icon(name, part) {
	const partAttr = part ? ` part="${part}"` : '';
	return `<svg viewBox="0 0 24 24" aria-hidden="true"${partAttr}>${ICONS[name].map(d => `<path d="${d}"/>`).join('')}</svg>`;
}

function chatKey(query) {
	const slug = query.trim().toLowerCase()
		.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
	return `${STORAGE_PREFIX}${slug}-${Date.now()}`;
}

class SearchWidget extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.adoptedStyleSheets = [stylesheet];
		this.messages = [];
		this.chatKey = null;
	}

	get prevQueries() {
		return this.messages.filter(m => m.role === 'user').map(m => m.text).slice(-10);
	}

	get lastAnswers() {
		return this.messages.filter(m => m.role === 'response').flatMap(m => m.results || []).slice(-20);
	}

	$(selector) { return this.shadowRoot.querySelector(selector); }

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
		this.elements.form.addEventListener('submit', (e) => {
			e.preventDefault();
			this.search(this.elements.input.value);
		});
		this.elements.input.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				this.elements.form.requestSubmit();
			}
		});
		this.elements.newQuestion.addEventListener('click', () => this.newChat());
		this.elements.historyPanel.addEventListener('toggle', (e) => {
			if (e.newState === 'open') this.renderHistory();
		});
		this.elements.historyList.addEventListener('click', (e) => {
			if (e.target.closest('[part="search-history-delete"]')) {
				const li = e.target.closest('li[data-key]');
				if (!li) return;
				localStorage.removeItem(li.dataset.key);
				if (this.chatKey === li.dataset.key) this.newChat();
				li.remove();
				if (!this.elements.historyList.querySelector('li[data-key]')) {
					const empty = document.createElement('li');
					empty.textContent = I18N.noHistory;
					this.elements.historyList.append(empty);
				}
				return;
			}
			const li = e.target.closest('li[data-key]');
			if (li) {
				this.loadChat(li.dataset.key);
				this.elements.historyPanel.hidePopover();
			}
		});
	}

	search(query) {
		if (!query?.trim() || !this.hasAttribute('api')) return;
		this.closeEventSource();

		if (!this.chatKey) {
			this.chatKey = chatKey(query);
		}

		this.messages.push({ role: 'user', text: query });

		const userLi = document.createElement('li');
		userLi.setAttribute('part', 'user');
		userLi.textContent = query;
		this.elements.conversation.append(userLi);

		const responseLi = document.createElement('li');
		responseLi.setAttribute('part', 'response');
		this.elements.conversation.append(responseLi);

		this.elements.input.value = '';
		this.updateLabel();

		const api = this.getAttribute('api');
		const params = { query, display_mode: 'full', generate_mode: 'summarize' };
		if (this.prevQueries.length > 1) params.prev = JSON.stringify(this.prevQueries.slice(0, -1));
		if (this.lastAnswers.length) params.last_ans = JSON.stringify(this.lastAnswers);
		const url = `${api}/ask?${new URLSearchParams(params)}`;
		this.eventSource = new EventSource(url);

		let summaryText = '';
		const refs = {};
		const results = [];
		const summaryNode = document.createTextNode('');
		responseLi.append(summaryNode);

		const messageHandlers = {
			summary: ({ message }) => {
				summaryText += message;
				summaryNode.textContent = summaryText;
			},
			result_batch: ({ results: items }) => {
				items.forEach(item => {
					const schema = item.schema_object || {};
					const title = schema.name || item.name;
					refs[item.url] = title;
					results.push({ name: title, url: item.url });

					let resultsUl = responseLi.querySelector('ul');
					if (!resultsUl) {
						resultsUl = document.createElement('ul');
						responseLi.append(resultsUl);
					}
					const li = document.createElement('li');
					const a = document.createElement('a');
					a.href = item.url;
					if (schema.image) {
						const img = document.createElement('img');
						img.src = schema.image;
						img.alt = '';
						img.loading = 'lazy';
						img.setAttribute('part', 'search-result-img');
						a.append(img);
					}
					const strong = document.createElement('strong');
					strong.textContent = title;
					a.append(strong);
					if (schema.description) {
						const small = document.createElement('small');
						small.setAttribute('part', 'search-result-desc');
						small.textContent = schema.description;
						a.append(small);
					}
					li.append(a);
					resultsUl.append(li);
				});
			},
			complete: () => {
				this.closeEventSource();
				this.renderParsedSummary(responseLi, summaryText, refs);
				this.messages.push({ role: 'response', summary: summaryText, results });
				this.saveChat();
				responseLi.scrollIntoView({ behavior: 'smooth', block: 'end' });
			},
		};

		this.eventSource.onmessage = (e) => {
			const data = JSON.parse(e.data);
			messageHandlers[data.message_type]?.(data);
		};
		this.eventSource.onerror = () => this.closeEventSource();
	}

	renderParsedSummary(container, text, refs) {
		const lines = text.split('\n');
		const refIdx = lines.findIndex(l => l.trim().toLowerCase().startsWith('references'));
		const bodyLines = refIdx === -1 ? lines : lines.slice(0, refIdx);
		const refMap = {};
		for (const line of refIdx === -1 ? [] : lines.slice(refIdx + 1)) {
			const m = line.match(/^\[(\d+)]\s*(https?:\/\/\S+)/);
			if (m) refMap[m[1]] = m[2];
		}

		const fragment = document.createDocumentFragment();
		let listItems = [];

		for (const line of bodyLines) {
			const bulletMatch = line.match(/^\*\s+(.+)/);
			if (bulletMatch) {
				listItems.push(bulletMatch[1]);
				continue;
			}
			if (listItems.length) {
				fragment.append(this.createList(listItems, refs, refMap));
				listItems = [];
			}
			if (line.trim()) {
				const p = document.createElement('p');
				this.appendTextWithRefs(p, line, refs, refMap);
				fragment.append(p);
			}
		}
		if (listItems.length) {
			fragment.append(this.createList(listItems, refs, refMap));
		}

		const existingUl = container.querySelector('ul');
		container.replaceChildren(fragment);
		if (existingUl) container.append(existingUl);
	}

	createList(items, refs, refMap) {
		const ul = document.createElement('ul');
		for (const item of items) {
			const li = document.createElement('li');
			this.appendTextWithRefs(li, item, refs, refMap);
			ul.append(li);
		}
		return ul;
	}

	appendTextWithRefs(container, text, refs, refMap) {
		const parts = text.split(/(\[\d+\])/g);
		for (const part of parts) {
			const m = part.match(/^\[(\d+)\]$/);
			if (m && refMap[m[1]]) {
				const a = document.createElement('a');
				a.href = refMap[m[1]];
				a.textContent = refs[refMap[m[1]]] || refMap[m[1]];
				container.append(a);
			} else {
				container.append(part);
			}
		}
	}

	saveChat() {
		if (!this.chatKey) return;
		const firstUserMsg = this.messages.find(m => m.role === 'user');
		const data = {
			title: firstUserMsg?.text || '',
			created: parseInt(this.chatKey.split('-').pop()),
			messages: this.messages,
		};
		localStorage.setItem(this.chatKey, JSON.stringify(data));
	}

	renderHistory() {
		const list = this.elements.historyList;
		list.replaceChildren();
		const chats = [];
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (!key.startsWith(STORAGE_PREFIX)) continue;
			try {
				const data = JSON.parse(localStorage.getItem(key));
				if (data?.title) chats.push({ key, title: data.title, created: data.created || 0 });
			} catch { /* skip invalid entries */ }
		}
		chats.sort((a, b) => b.created - a.created);
		if (!chats.length) {
			const li = document.createElement('li');
			li.textContent = I18N.noHistory;
			list.append(li);
			return;
		}
		for (const chat of chats) {
			const li = document.createElement('li');
			li.dataset.key = chat.key;
			const span = document.createElement('span');
			span.textContent = chat.title;
			li.append(span);
			if (chat.created) {
				const small = document.createElement('small');
				small.textContent = new Date(chat.created).toLocaleDateString();
				li.append(small);
			}
			const del = document.createElement('button');
			del.setAttribute('part', 'search-history-delete');
			del.setAttribute('aria-label', I18N.close);
			del.textContent = '\u00d7';
			li.append(del);
			list.append(li);
		}
	}

	loadChat(key) {
		try {
			const data = JSON.parse(localStorage.getItem(key));
			if (!data?.messages) return;
			this.closeEventSource();
			this.chatKey = key;
			this.messages = data.messages;
			this.elements.conversation.replaceChildren();
			for (const msg of this.messages) {
				const li = document.createElement('li');
				li.setAttribute('part', msg.role === 'user' ? 'user' : 'response');
				if (msg.role === 'user') {
					li.textContent = msg.text;
				} else {
					const refs = {};
					for (const r of msg.results || []) refs[r.url] = r.name;
					this.renderParsedSummary(li, msg.summary || '', refs);
					if (msg.results?.length) {
						const ul = document.createElement('ul');
						for (const r of msg.results) {
							const rli = document.createElement('li');
							const a = document.createElement('a');
							a.href = r.url;
							a.textContent = r.name;
							rli.append(a);
							ul.append(rli);
						}
						li.append(ul);
					}
				}
				this.elements.conversation.append(li);
			}
			this.updateLabel();
			this.elements.conversation.lastElementChild?.scrollIntoView({ block: 'end' });
		} catch { /* skip invalid data */ }
	}

	newChat() {
		this.closeEventSource();
		this.chatKey = null;
		this.messages = [];
		this.elements.conversation.replaceChildren();
		this.updateLabel();
		this.elements.input.focus();
	}

	updateLabel() {
		this.elements.legend.textContent = this.messages.length ? I18N.followUp : I18N.searchLabel;
	}

	closeEventSource() {
		this.eventSource?.close();
		this.eventSource = null;
	}

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
