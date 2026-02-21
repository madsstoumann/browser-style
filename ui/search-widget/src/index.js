const STORAGE_PREFIX = 'search-widget:';

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(`
[part="search-trigger"] {
	aspect-ratio: 1;
	background: hsl(0 0% 10% / 0.15);
	border: 0;
	border-radius: 50%;
	display: grid;
	place-items: center;
}
	:host * { box-sizing: border-box; }
:host(:not([position="inline"])) [part="search-trigger"] { position: fixed; }
:host([position*="top"]) [part="search-trigger"] { inset-block-start: 1rem; }
:host([position*="bottom"]) [part="search-trigger"] { inset-block-end: 1rem; }
:host([position*="left"]) [part="search-trigger"] { inset-inline-start: 1rem; }
:host([position*="right"]) [part="search-trigger"] { inset-inline-end: 1rem; }

[part="search-overlay"] {
	background: hsl(0 0% 100% / 0.15);
	backdrop-filter: blur(16px) saturate(180%);
	-webkit-backdrop-filter: blur(16px) saturate(180%);
	border: 1px solid hsl(0 0% 100% / 0.3);
	border-radius: 0;
	block-size: 100%;
	
	inline-size: 100%;
	max-block-size: 100%;
	max-inline-size: 100%;
	padding: 0;
}
[part="search-overlay"][open] {
	display: flex;
	flex-direction: column;
}
[part="search-overlay"]::backdrop {
	background: hsl(0 0% 90% / 0.4);
}

[part="search-header"] {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 1rem 2rem;
}
[part="search-close"] {
	margin-inline-start: auto;
}

[part="search-conversation"] {
	flex: 1;
	list-style: none;
	margin: 0;
	overflow-y: auto;
	// padding: 0 2rem;
}
	[part="search-conversation"]:empty {
	display: none;
	}
[part="user"],
[part="response"] {
	padding: 0.75rem 0;
}
[part="user"] {
background-color: hsl(200 100% 50% / 0.15);
	// font-weight: 600;
	justify-self: end;
}
[part="response"] ul {
	list-style: none;
	padding: 0;
}

[part="search-form"] {
	position: sticky;
	bottom: 0;
	padding: 1rem 2rem;
	background: inherit;
}
[part="search-fieldset"] {
	all: unset;
	display: grid;
}
[part="search-legend"] {
	all: unset;
	text-align: center;
}
[part="search-input"] {
	border-radius: 1ch;
	font: inherit;
	padding: 1ch 2ch;
	resize: vertical;
}

[part="search-result-img"] {
	aspect-ratio: 16/9;
	background-color: hsl(0 0% 50% / 0.15);
	display: block;
	max-inline-size: 200px;
	object-fit: cover;
}

svg {
	block-size: 2em;
	inline-size: 2em;
}
[part="icon-stroke"] {
	fill: none;
	stroke: currentColor;
	stroke-width: 2;
	stroke-linecap: round;
	stroke-linejoin: round;
}
`);

const I18N = {
	close: 'Close',
	followUp: 'Ask a follow-up question',
	newQuestion: 'New question',
	search: 'Search',
	searchLabel: 'Ask a question',
	searchPlaceholder: 'Ask a question or a follow-up',
};

const ICONS = {
	ai: ['M11 5a9.37 9.37 0 0 0 7.7 7.7 9.37 9.37 0 0 0-7.7 7.7 9.37 9.37 0 0 0-7.7-7.7A9.37 9.37 0 0 0 11 5M18 2a4.26 4.26 0 0 0 3.5 3.5A4.26 4.26 0 0 0 18 9a4.26 4.26 0 0 0-3.5-3.5A4.26 4.26 0 0 0 18 2m-1 15a2.43 2.43 0 0 0 2 2 2.43 2.43 0 0 0-2 2 2.43 2.43 0 0 0-2-2 2.43 2.43 0 0 0 2-2'],
	close: ['M19 2h-14a3 3 0 0 0 -3 3v14a3 3 0 0 0 3 3h14a3 3 0 0 0 3 -3v-14a3 3 0 0 0 -3 -3zm-9.387 6.21l.094 .083l2.293 2.292l2.293 -2.292a1 1 0 0 1 1.497 1.32l-.083 .094l-2.292 2.293l2.292 2.293a1 1 0 0 1 -1.32 1.497l-.094 -.083l-2.293 -2.292l-2.293 2.292a1 1 0 0 1 -1.497 -1.32l.083 -.094l2.292 -2.293l-2.292 -2.293a1 1 0 0 1 1.32 -1.497z'],
	newQuestion: ['M12 5l0 14', 'M5 12l14 0'],
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
	static observedAttributes = ['api'];

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

		const messageHandlers = {
			summary: ({ message }) => {
				summaryText += message;
				responseLi.textContent = summaryText;
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
						const p = document.createElement('p');
						const small = document.createElement('small');
						small.setAttribute('part', 'search-result-desc');
						small.textContent = schema.description;
						p.append(small);
						a.append(p);
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

	newChat() {
		this.closeEventSource();
		this.chatKey = null;
		this.messages = [];
		this.elements.conversation.replaceChildren();
		this.updateLabel();
		this.elements.input.focus();
	}

	updateLabel() {
		this.elements.legend.textContent = this.messages.some(m => m.role === 'user') ? I18N.followUp : I18N.searchLabel;
	}

	closeEventSource() {
		this.eventSource?.close();
		this.eventSource = null;
	}

	disconnectedCallback() { this.closeEventSource(); }

	render() {
		const trigger = document.createElement('button');
		trigger.setAttribute('part', 'search-trigger');
		trigger.setAttribute('commandfor', 'search-dialog');
		trigger.setAttribute('command', 'show-modal');
		trigger.setAttribute('aria-label', I18N.search);
		const slot = document.createElement('slot');
		slot.name = 'icon';
		slot.innerHTML = icon('ai');
		trigger.append(slot);

		const dialog = document.createElement('dialog');
		dialog.id = 'search-dialog';
		dialog.setAttribute('part', 'search-overlay');
		dialog.setAttribute('closedby', 'any');

		const header = document.createElement('div');
		header.setAttribute('part', 'search-header');

		const newBtn = document.createElement('button');
		newBtn.setAttribute('part', 'search-new');
		newBtn.setAttribute('aria-label', I18N.newQuestion);
		newBtn.innerHTML = icon('newQuestion', 'icon-stroke');
		newBtn.append(` ${I18N.newQuestion}`);

		const closeBtn = document.createElement('button');
		closeBtn.setAttribute('part', 'search-close');
		closeBtn.setAttribute('commandfor', 'search-dialog');
		closeBtn.setAttribute('command', 'close');
		closeBtn.setAttribute('aria-label', I18N.close);
		closeBtn.innerHTML = icon('close');

		header.append(newBtn, closeBtn);

		const ol = document.createElement('ol');
		ol.setAttribute('part', 'search-conversation');

		const form = document.createElement('form');
		form.setAttribute('part', 'search-form');
		const fieldset = document.createElement('fieldset');
		fieldset.setAttribute('part', 'search-fieldset');
		const legend = document.createElement('legend');
		legend.setAttribute('part', 'search-legend');
		legend.textContent = I18N.searchLabel;
		const textarea = document.createElement('textarea');
		textarea.setAttribute('part', 'search-input');
		textarea.name = 'q';
		textarea.autocomplete = 'off';
		textarea.setAttribute('enterkeyhint', 'search');
		textarea.placeholder = I18N.searchPlaceholder;
		fieldset.append(legend, textarea);
		form.append(fieldset);

		dialog.append(header, ol, form);
		this.shadowRoot.append(trigger, dialog);
	}
}

customElements.define('search-widget', SearchWidget);
