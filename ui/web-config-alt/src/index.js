import { adoptSharedStyles } from '@browser.style/web-config-shared';

const DETAIL_LEVELS = ['brief', 'standard', 'detailed'];

class WebConfigAlt extends HTMLElement {
	static formAssociated = true;
	static observedAttributes = ['value', 'detail'];

	#src = '';
	#detail = 'standard';
	#isGenerating = false;
	#pendingValue = null;

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this._internals = this.attachInternals();
	}

	get src() { return this.#src; }
	set src(v) {
		this.#src = v;
		this.#updateGenerateButton();
	}

	get detail() { return this.#detail; }
	set detail(v) {
		this.#detail = DETAIL_LEVELS.includes(v) ? v : 'standard';
	}

	get value() {
		const textarea = this.shadowRoot.querySelector('[data-alt-text]');
		return textarea ? textarea.value : (this.#pendingValue || '');
	}
	set value(v) {
		const text = v || '';
		this._internals.setFormValue(text);
		const textarea = this.shadowRoot.querySelector('[data-alt-text]');
		if (textarea) {
			textarea.value = text;
		} else {
			this.#pendingValue = text;
		}
	}

	get generating() { return this.#isGenerating; }
	set generating(v) {
		this.#isGenerating = v;
		this.#updateGenerateButton();
		const spinner = this.shadowRoot.querySelector('.spinner');
		if (spinner) {
			if (v) spinner.setAttribute('data-visible', '');
			else spinner.removeAttribute('data-visible');
		}
	}

	showError(msg) {
		const errorEl = this.shadowRoot.querySelector('.alt-error');
		if (errorEl) {
			errorEl.textContent = msg;
			errorEl.setAttribute('data-visible', '');
		}
	}

	async connectedCallback() {
		await adoptSharedStyles(this.shadowRoot);

		const localCss = new CSSStyleSheet();
		await localCss.replace(`
			textarea[data-alt-text] {
				field-sizing: content;
				font: inherit;
				min-height: 2lh;
				padding: var(--web-config-gap);
				resize: vertical;
				width: 100%;
			}
			.alt-error {
				display: none;
				background: var(--web-config-status-danger-bg);
				border: 1px solid var(--web-config-status-danger);
				border-radius: var(--web-config-bdrs);
				color: var(--web-config-status-danger);
				padding: var(--web-config-gap);
				font-size: small;
			}
			.alt-error[data-visible] {
				display: block;
			}
			.spinner {
				display: none;
				text-align: center;
				padding: var(--web-config-gap) 0;
			}
			.spinner[data-visible]::after {
				content: '';
				display: inline-block;
				width: 20px;
				height: 20px;
				border: 2px solid var(--web-config-bdc);
				border-top-color: var(--web-config-accent-dark);
				border-radius: 50%;
				animation: wca-spin 0.7s linear infinite;
			}
			@keyframes wca-spin {
				to { transform: rotate(360deg); }
			}
		`);
		this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, localCss];

		this.render();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) return;
		if (name === 'value') this.value = newValue;
		if (name === 'detail') {
			this.#detail = DETAIL_LEVELS.includes(newValue) ? newValue : 'standard';
		}
	}

	render() {
		const attrDetail = this.getAttribute('detail');
		if (attrDetail && DETAIL_LEVELS.includes(attrDetail)) {
			this.#detail = attrDetail;
		}

		const btn = document.createElement('button');
		btn.type = 'button';
		btn.setAttribute('data-generate', '');
		btn.disabled = true;
		btn.textContent = 'Generate';

		const textarea = document.createElement('textarea');
		textarea.setAttribute('data-alt-text', '');
		textarea.placeholder = 'Alt text will appear here...';

		const spinner = document.createElement('div');
		spinner.className = 'spinner';

		const errorEl = document.createElement('div');
		errorEl.className = 'alt-error';

		this.shadowRoot.replaceChildren(btn, textarea, spinner, errorEl);

		if (this.#pendingValue !== null) {
			textarea.value = this.#pendingValue;
			this.#pendingValue = null;
		}

		this.#updateGenerateButton();

		btn.addEventListener('click', () => {
			if (this.#isGenerating || !this.#src) return;
			this.#isGenerating = true;
			this.#updateGenerateButton();
			spinner.setAttribute('data-visible', '');
			errorEl.removeAttribute('data-visible');

			this.dispatchEvent(new CustomEvent('requestGenerate', {
				bubbles: true,
				composed: true,
				detail: { detail: this.#detail }
			}));
		});

		textarea.addEventListener('input', () => {
			const text = textarea.value;
			this._internals.setFormValue(text);
			this.dispatchEvent(new CustomEvent('change', {
				bubbles: true,
				composed: true,
				detail: { alt: text }
			}));
		});
	}

	#updateGenerateButton() {
		const btn = this.shadowRoot.querySelector('[data-generate]');
		if (btn) btn.disabled = !this.#src || this.#isGenerating;
	}
}

customElements.define('web-config-alt', WebConfigAlt);
