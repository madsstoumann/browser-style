import { adoptSharedStyles } from '@browser.style/web-config-shared';

const _localSheet = new CSSStyleSheet();
const _localReady = _localSheet.replace(`
	:host {
		display: grid;
		gap: var(--web-config-gap);
	}
	label {
		display: grid;
		font-size: small;
		font-weight: 500;
		gap: 0.25em;
	}
	label small {
		color: var(--web-config-color-muted, #666);
		margin-inline-start: 0.5ch;
	}
	textarea {
		font: inherit;
		min-height: 2lh;
		padding: var(--web-config-gap);
		resize: vertical;
		width: 100%;
	}
	textarea[data-longdesc] {
		min-height: 4lh;
	}
	table {
		border-collapse: collapse;
		font-size: small;
		width: 100%;
	}
	th, td {
		border: 1px solid var(--web-config-bdc, #ddd);
		padding: 0.35em 0.75em;
		text-align: start;
	}
	th {
		background: var(--web-config-bg-muted, #f5f5f5);
		font-weight: 600;
	}
	button[data-generate] {
		justify-self: end;
	}
	.error,
	.spinner {
		display: none;
	}
	.error.active {
		display: block;
		background: var(--web-config-status-danger-bg);
		border: 1px solid var(--web-config-status-danger);
		border-radius: var(--web-config-bdrs);
		color: var(--web-config-status-danger);
		padding: var(--web-config-gap);
		font-size: small;
	}
	.spinner.active {
		display: block;
		text-align: center;
		padding: var(--web-config-gap) 0;
	}
	.spinner.active::after {
		content: '';
		display: inline-block;
		width: 20px;
		height: 20px;
		border: 2px solid var(--web-config-bdc);
		border-top-color: var(--web-config-accent-dark);
		border-radius: 50%;
		animation: wci-spin 0.7s linear infinite;
	}
	@keyframes wci-spin {
		to { transform: rotate(360deg); }
	}
`);

function createEl(tag, attrs = {}, text) {
	const el = document.createElement(tag);
	for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
	if (text) el.textContent = text;
	return el;
}

const renderers = {
	alttext: {
		render(root) {
			const frag = document.createDocumentFragment();

			const label1 = createEl('label');
			const span1 = createEl('span');
			span1.textContent = 'Alt text ';
			span1.appendChild(createEl('small', {}, '(max 125 chars)'));
			label1.appendChild(span1);
			label1.appendChild(createEl('textarea', { 'data-alt': '', placeholder: 'Alt text will appear here...', maxlength: '125' }));
			frag.appendChild(label1);

			const label2 = createEl('label');
			const span2 = createEl('span');
			span2.textContent = 'Long description ';
			span2.appendChild(createEl('small', {}, '(max 512 chars)'));
			label2.appendChild(span2);
			label2.appendChild(createEl('textarea', { 'data-longdesc': '', placeholder: 'Long description will appear here...', maxlength: '512' }));
			frag.appendChild(label2);

			root.appendChild(frag);
		},
		populate(root, result) {
			const alt = root.querySelector('[data-alt]');
			const longdesc = root.querySelector('[data-longdesc]');
			if (alt) alt.value = result.alt || '';
			if (longdesc) longdesc.value = result.longdesc || '';
		},
		getValue(root) {
			const alt = root.querySelector('[data-alt]')?.value ?? '';
			const longdesc = root.querySelector('[data-longdesc]')?.value ?? '';
			return JSON.stringify({ alt, longdesc });
		},
		bindEvents(root, emitChange) {
			root.querySelector('[data-alt]')?.addEventListener('input', emitChange);
			root.querySelector('[data-longdesc]')?.addEventListener('input', emitChange);
		},
	},
	food: {
		render(root) {
			const table = createEl('table');
			const thead = createEl('thead');
			const headRow = createEl('tr');
			headRow.appendChild(createEl('th', {}, 'Item'));
			headRow.appendChild(createEl('th', {}, 'Qty'));
			thead.appendChild(headRow);
			table.appendChild(thead);
			table.appendChild(createEl('tbody', { 'data-food': '' }));
			root.appendChild(table);
		},
		populate(root, result) {
			const tbody = root.querySelector('[data-food]');
			if (!tbody) return;
			tbody.replaceChildren();
			const items = result.ingredients || [];
			if (!items.length) {
				const row = createEl('tr');
				row.appendChild(createEl('td', { colspan: '2' }, 'No food items detected'));
				tbody.appendChild(row);
				return;
			}
			for (const i of items) {
				const row = createEl('tr');
				row.appendChild(createEl('td', {}, i.item));
				row.appendChild(createEl('td', {}, i.quantity));
				tbody.appendChild(row);
			}
		},
		getValue(root) {
			const tbody = root.querySelector('[data-food]');
			if (!tbody) return JSON.stringify({ ingredients: [] });
			const rows = tbody.querySelectorAll('tr');
			const items = [];
			for (const row of rows) {
				const cells = row.querySelectorAll('td');
				if (cells.length === 2) {
					items.push({ item: cells[0].textContent, quantity: cells[1].textContent });
				}
			}
			return JSON.stringify({ ingredients: items });
		},
		bindEvents() {},
	},
};

class WebConfigImgTxt extends HTMLElement {
	static formAssociated = true;
	static observedAttributes = ['preset'];

	#src = '';
	#isGenerating = false;
	#result = null;
	#els = {};

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this._internals = this.attachInternals();
		this.#loadStyles();
	}

	async #loadStyles() {
		await adoptSharedStyles(this.shadowRoot);
		await _localReady;
		this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, _localSheet];
	}

	get preset() { return this.getAttribute('preset') || ''; }

	get src() { return this.#src; }
	set src(v) {
		this.#src = v;
		this.#updateButton();
	}

	get value() {
		const renderer = renderers[this.preset];
		if (!renderer) return '';
		return renderer.getValue(this.shadowRoot);
	}
	set value(v) {
		this._internals.setFormValue(v || '');
		if (v) {
			try {
				this.#result = JSON.parse(v);
				const renderer = renderers[this.preset];
				if (renderer) renderer.populate(this.shadowRoot, this.#result);
			} catch { /* ignore invalid JSON */ }
		}
	}

	get result() { return this.#result; }
	set result(v) {
		this.#result = v;
		const renderer = renderers[this.preset];
		if (renderer && v) renderer.populate(this.shadowRoot, v);
		this._internals.setFormValue(this.value);
	}

	get generating() { return this.#isGenerating; }
	set generating(v) {
		this.#isGenerating = !!v;
		this.#updateButton();
		const spinner = this.shadowRoot.querySelector('.spinner');
		if (spinner) spinner.classList.toggle('active', !!v);
	}

	showError(msg) {
		const el = this.shadowRoot.querySelector('.error');
		if (!el) return;
		el.textContent = msg;
		el.classList.add('active');
	}

	connectedCallback() {
		this.#render();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) return;
		if (name === 'preset' && this.isConnected) this.#render();
	}

	#render() {
		const root = this.shadowRoot;
		root.replaceChildren();

		const renderer = renderers[this.preset];
		if (renderer) {
			renderer.render(root);
		} else {
			root.appendChild(createEl('p', {}, `Unknown preset: "${this.preset}"`));
		}

		root.appendChild(createEl('button', { type: 'button', 'data-generate': '', 'data-action': '', disabled: '' }, 'Generate'));
		root.appendChild(createEl('div', { class: 'spinner' }));
		root.appendChild(createEl('div', { class: 'error' }));

		this.#els = {
			btn: root.querySelector('[data-generate]'),
		};

		this.#updateButton();

		this.#els.btn.addEventListener('click', () => {
			if (this.#isGenerating || !this.#src) return;
			this.generating = true;
			root.querySelector('.error')?.classList.remove('active');
			this.dispatchEvent(new CustomEvent('requestGenerate', {
				bubbles: true,
				composed: true,
			}));
		});

		if (renderer) {
			renderer.bindEvents(root, () => {
				this._internals.setFormValue(this.value);
				this.dispatchEvent(new CustomEvent('change', {
					bubbles: true,
					composed: true,
					detail: JSON.parse(this.value),
				}));
			});
		}

		if (this.#result) {
			renderer?.populate(root, this.#result);
		}
	}

	#updateButton() {
		if (this.#els.btn) this.#els.btn.disabled = !this.#src || this.#isGenerating;
	}
}

customElements.define('web-config-imgtxt', WebConfigImgTxt);
