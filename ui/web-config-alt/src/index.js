import { adoptSharedStyles } from '@browser.style/web-config-shared';

function createLabel(text, hint) {
	const label = document.createElement('label');
	label.append(text + ' ');
	const span = document.createElement('span');
	span.textContent = hint;
	label.append(span);
	return label;
}

class WebConfigAlt extends HTMLElement {
	static formAssociated = true;
	static observedAttributes = ['value', 'longdesc'];

	#src = '';
	#isGenerating = false;
	#pendingValue = null;
	#pendingLongdesc = null;

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

	get value() {
		const textarea = this.shadowRoot.querySelector('[data-alt]');
		return textarea ? textarea.value : (this.#pendingValue || '');
	}
	set value(v) {
		const text = v || '';
		this._internals.setFormValue(text);
		const textarea = this.shadowRoot.querySelector('[data-alt]');
		if (textarea) {
			textarea.value = text;
		} else {
			this.#pendingValue = text;
		}
	}

	get longdesc() {
		const textarea = this.shadowRoot.querySelector('[data-longdesc]');
		return textarea ? textarea.value : (this.#pendingLongdesc || '');
	}
	set longdesc(v) {
		const text = v || '';
		const textarea = this.shadowRoot.querySelector('[data-longdesc]');
		if (textarea) {
			textarea.value = text;
		} else {
			this.#pendingLongdesc = text;
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
			label span {
				color: var(--web-config-color-muted, #666);
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
			button[data-generate] {
				justify-self: end;
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
		if (name === 'longdesc') this.longdesc = newValue;
	}

	render() {
		const altLabel = createLabel('Alt text', '(max 125 chars)');
		const altTextarea = document.createElement('textarea');
		altTextarea.setAttribute('data-alt', '');
		altTextarea.placeholder = 'Alt text will appear here...';
		altTextarea.maxLength = 125;
		altLabel.append(altTextarea);

		const longdescLabel = createLabel('Long description', '(max 512 chars)');
		const longdescTextarea = document.createElement('textarea');
		longdescTextarea.setAttribute('data-longdesc', '');
		longdescTextarea.placeholder = 'Long description will appear here...';
		longdescTextarea.maxLength = 512;
		longdescLabel.append(longdescTextarea);

		const btn = document.createElement('button');
		btn.type = 'button';
		btn.setAttribute('data-generate', '');
		btn.setAttribute('data-action', '');
		btn.disabled = true;
		btn.textContent = 'Generate';

		const spinner = document.createElement('div');
		spinner.className = 'spinner';

		const errorEl = document.createElement('div');
		errorEl.className = 'alt-error';

		this.shadowRoot.replaceChildren(altLabel, longdescLabel, btn, spinner, errorEl);

		if (this.#pendingValue !== null) {
			altTextarea.value = this.#pendingValue;
			this.#pendingValue = null;
		}
		if (this.#pendingLongdesc !== null) {
			longdescTextarea.value = this.#pendingLongdesc;
			this.#pendingLongdesc = null;
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
				composed: true
			}));
		});

		const emitChange = () => {
			this._internals.setFormValue(altTextarea.value);
			this.dispatchEvent(new CustomEvent('change', {
				bubbles: true,
				composed: true,
				detail: { alt: altTextarea.value, longdesc: longdescTextarea.value }
			}));
		};

		altTextarea.addEventListener('input', emitChange);
		longdescTextarea.addEventListener('input', emitChange);
	}

	#updateGenerateButton() {
		const btn = this.shadowRoot.querySelector('[data-generate]');
		if (btn) btn.disabled = !this.#src || this.#isGenerating;
	}
}

customElements.define('web-config-alt', WebConfigAlt);
