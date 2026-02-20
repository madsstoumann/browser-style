const EXPIRY_MS = 24 * 60 * 60 * 1000;

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
		box-sizing: border-box;
		inline-size: 100%;
		max-block-size: 100%;
		max-inline-size: 100%;
		padding: 2rem;
	}
	[part="search-overlay"]::backdrop {
		background: hsl(0 0% 90% / 0.4);
	}

	[part="search-header"] {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-block-end: 1rem;
	}
	[part="search-form"] {
		display: flex;
		gap: 0.5rem;
		align-items: end;
	}
	[part="search-label"] {
		display: grid;
		gap: 0.25rem;
	}
	[part="search-input"] {
		font: inherit;
		padding: 0.5em;
	}
	[part="search-close"] {
		margin-inline-start: auto;
	}
	[part="search-remember-label"] {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.85em;
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
	[part="search-result-img"] {
		aspect-ratio: 16/9;
		background-color: hsl(0 0% 50% / 0.15);
		display: block;
		max-inline-size: 200px;
		object-fit: cover;
	}
`);

const I18N = {
	clear: 'Clear history',
	close: 'Close',
	followUp: 'Ask a follow-up question',
	remember: 'Remember chat history',
	search: 'Search',
	searchLabel: 'Ask a question',
	searchPlaceholder: 'Ask a question or a follow-up',
};

const ICONS = {
	ai: ['M11 5a9.37 9.37 0 0 0 7.7 7.7 9.37 9.37 0 0 0-7.7 7.7 9.37 9.37 0 0 0-7.7-7.7A9.37 9.37 0 0 0 11 5M18 2a4.26 4.26 0 0 0 3.5 3.5A4.26 4.26 0 0 0 18 9a4.26 4.26 0 0 0-3.5-3.5A4.26 4.26 0 0 0 18 2m-1 15a2.43 2.43 0 0 0 2 2 2.43 2.43 0 0 0-2 2 2.43 2.43 0 0 0-2-2 2.43 2.43 0 0 0 2-2'],
	clear: ['M20.926 13.15a9 9 0 1 0-7.835 7.784', 'M12 7v5l2 2', 'M22 22l-5-5', 'M17 22l5-5'],
	close: ['M19 2h-14a3 3 0 0 0 -3 3v14a3 3 0 0 0 3 3h14a3 3 0 0 0 3 -3v-14a3 3 0 0 0 -3 -3zm-9.387 6.21l.094 .083l2.293 2.292l2.293 -2.292a1 1 0 0 1 1.497 1.32l-.083 .094l-2.292 2.293l2.292 2.293a1 1 0 0 1 -1.32 1.497l-.094 -.083l-2.293 -2.292l-2.293 2.292a1 1 0 0 1 -1.497 -1.32l.083 -.094l2.292 -2.293l-2.292 -2.293a1 1 0 0 1 1.32 -1.497z'],
	search: ['M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0', 'M21 21l-6 -6'],
};

function icon(name, part) {
	const partAttr = part ? ` part="${part}"` : '';
	return `<svg viewBox="0 0 24 24" aria-hidden="true"${partAttr}>${ICONS[name].map(d => `<path d="${d}"/>`).join('')}</svg>`;
}

class SearchWidget extends HTMLElement {
	static observedAttributes = ['api'];

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.adoptedStyleSheets = [stylesheet];
		this.prevQueries = [];
		this.lastAnswers = [];
	}

	get storageKey() {
		return `search-widget:${this.getAttribute('api') || 'default'}`;
	}

	$(selector) { return this.shadowRoot.querySelector(selector); }

	connectedCallback() {
		this.render();
		this.elements = {
			clear: this.$('[part="search-clear"]'),
			form: this.$('form'),
			input: this.$('input[name="q"]'),
			labelText: this.$('[part="search-label-text"]'),
			remember: this.$('[part="search-remember"]'),
			results: this.$('[part="search-results"]'),
			summary: this.$('[part="search-summary"]'),
		};
		this.elements.form.addEventListener('submit', (e) => {
			e.preventDefault();
			this.search(this.elements.input.value);
		});
		this.elements.clear.addEventListener('click', () => this.clearHistory());
		this.elements.remember.addEventListener('change', (e) => {
			e.target.checked ? this.saveState() : localStorage.removeItem(this.storageKey);
		});
		this.restoreState();
	}

	search(query) {
		if (!query?.trim() || !this.hasAttribute('api')) return;
		this.closeEventSource();

		const api = this.getAttribute('api');
		const params = { query, display_mode: 'full', generate_mode: 'summarize' };
		if (this.prevQueries.length) params.prev = JSON.stringify(this.prevQueries);
		if (this.lastAnswers.length) params.last_ans = JSON.stringify(this.lastAnswers);
		const url = `${api}/ask?${new URLSearchParams(params)}`;
		this.eventSource = new EventSource(url);

		const { summary } = this.elements;
		this.elements.summary.innerHTML = this.elements.results.innerHTML = this.elements.input.value = '';
		const queryHTML = `<strong>${query}</strong>`;
		summary.innerHTML = queryHTML;
		let summaryText = '';
		const refs = {};
		const messageHandlers = {
			summary: ({ message }) => {
				summaryText += message;
				summary.innerHTML = `${queryHTML}<br>${summaryText}`;
			},
			result_batch: ({ results }) => this.appendResults(results, refs),
			complete: () => {
				this.closeEventSource();
				summary.innerHTML = `${queryHTML}<br>${this.parseSummary(summaryText, refs)}`;
				this.prevQueries.push(query);
				this.prevQueries = this.prevQueries.slice(-10);
				this.updateLabel();
				this.saveState();
			},
		};

		this.eventSource.onmessage = (e) => {
			const data = JSON.parse(e.data);
			messageHandlers[data.message_type]?.(data);
		};
		this.eventSource.onerror = () => this.closeEventSource();
	}

	appendResults(items, refs) {
		this.elements.results.insertAdjacentHTML('beforeend', items.map(item => {
			const schema = item.schema_object || {};
			const title = schema.name || item.name;
			refs[item.url] = title;
			this.lastAnswers.push({ name: title, url: item.url });
			const img = schema.image ? `<img src="${schema.image}" alt="" loading="lazy" part="search-result-img">` : '';
			const desc = schema.description ? `<small part="search-result-desc">${schema.description}</small>` : '';
			return `<li><a href="${item.url}">${img}<strong>${title}</strong><p>${desc}</p></a></li>`;
		}).join(''));
		this.lastAnswers = this.lastAnswers.slice(-20);
	}

	parseSummary(text, refs) {
		const lines = text.split('\n');
		const refIdx = lines.findIndex(l => l.trim().toLowerCase().startsWith('references'));
		const bodyLines = refIdx === -1 ? lines : lines.slice(0, refIdx);
		const refMap = {};
		for (const line of refIdx === -1 ? [] : lines.slice(refIdx + 1)) {
			const m = line.match(/^\[(\d+)]\s*(https?:\/\/\S+)/);
			if (m) refMap[m[1]] = m[2];
		}
		let html = bodyLines.join('\n')
			.replace(/\[(\d+)]/g, (_, n) => {
				const url = refMap[n];
				return url ? `<a href="${url}">${refs[url] || url}</a>` : `[${n}]`;
			});
		html = html.replace(/(?:^|\n)\*\s+(.+?)(?=\n|$)/g, (_, item) => `\n<li>${item}</li>`);
		html = html.replace(/(<li>.*?<\/li>\n?)+/gs, match => `<ul>${match}</ul>`);
		return html.replace(/\n/g, '<br>');
	}

	saveState() {
		if (!(this.hasAttribute('preserve-state') && this.elements.remember.checked)) return;
		const state = {
			prevQueries: this.prevQueries,
			lastAnswers: this.lastAnswers,
			summaryHTML: this.elements.summary.innerHTML,
			resultsHTML: this.elements.results.innerHTML,
			timestamp: Date.now(),
		};
		localStorage.setItem(this.storageKey, JSON.stringify(state));
	}

	restoreState() {
		if (!this.hasAttribute('preserve-state')) return;
		try {
			const state = JSON.parse(localStorage.getItem(this.storageKey) || 'null');
			if (!state || Date.now() - state.timestamp > EXPIRY_MS) throw new Error();
			this.prevQueries = state.prevQueries || [];
			this.lastAnswers = state.lastAnswers || [];
			this.elements.summary.innerHTML = state.summaryHTML || '';
			this.elements.results.innerHTML = state.resultsHTML || '';
			this.updateLabel();
		} catch {
			localStorage.removeItem(this.storageKey);
		}
	}

	updateLabel() {
		this.elements.labelText.textContent = this.prevQueries.length > 0 ? I18N.followUp : I18N.searchLabel;
	}

	clearHistory() {
		this.prevQueries = [];
		this.lastAnswers = [];
		this.elements.summary.innerHTML = this.elements.results.innerHTML = this.elements.input.value = '';
		this.updateLabel();
		localStorage.removeItem(this.storageKey);
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
					<button part="search-clear" aria-label="${I18N.clear}">${icon('clear', 'icon-stroke')}</button>
					<label part="search-remember-label">
						<input type="checkbox" part="search-remember" ${this.hasAttribute('preserve-state') ? 'checked' : ''}>
						${I18N.remember}
					</label>
					<button part="search-close" commandfor="search-dialog" command="close" aria-label="${I18N.close}">${icon('close')}</button>
				</div>
				<form part="search-form">
					<label part="search-label"><span part="search-label-text">${I18N.searchLabel}</span>
						<input part="search-input" type="search" name="q" autocomplete="off" placeholder="${I18N.searchPlaceholder}">
					</label>
					<button part="search-submit" type="submit" aria-label="${I18N.search}">${icon('search', 'icon-stroke')}</button>
				</form>
				<p part="search-summary"></p>
				<ul part="search-results"></ul>
			</dialog>
		`;
	}
}

customElements.define('search-widget', SearchWidget);
