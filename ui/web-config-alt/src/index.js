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
	button[data-generate] {
		justify-self: end;
	}
	.alt-error,
	.spinner {
		display: none;
	}
	.alt-error.active {
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
		animation: wca-spin 0.7s linear infinite;
	}
	@keyframes wca-spin {
		to { transform: rotate(360deg); }
	}
`);

class WebConfigAlt extends HTMLElement {
	static formAssociated = true;
	static observedAttributes = ['value', 'longdesc'];

	#src = '';
	#isGenerating = false;
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

	get src() { return this.#src; }
	set src(v) {
		this.#src = v;
		this.#updateButton();
	}

	get value() { return this.#els.alt?.value ?? ''; }
	set value(v) {
		if (this.#els.alt) this.#els.alt.value = v || '';
		this._internals.setFormValue(v || '');
	}

	get longdesc() { return this.#els.longdesc?.value ?? ''; }
	set longdesc(v) {
		if (this.#els.longdesc) this.#els.longdesc.value = v || '';
	}

	get generating() { return this.#isGenerating; }
	set generating(v) {
		this.#isGenerating = !!v;
		this.#updateButton();
		if (this.#els.spinner) this.#els.spinner.classList.toggle('active', !!v);
	}

	showError(msg) {
		const el = this.#els.error;
		if (!el) return;
		el.textContent = msg;
		el.classList.add('active');
	}

	connectedCallback() {
		this.#render();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) return;
		if (name === 'value') this.value = newValue;
		if (name === 'longdesc') this.longdesc = newValue;
	}

	#render() {
		const root = this.shadowRoot;
		const tpl = document.createElement('template');
		tpl.innerHTML = [
			'<label><span>Alt text <small>(max 125 chars)</small></span>',
			'<textarea data-alt placeholder="Alt text will appear here..." maxlength="125"></textarea></label>',
			'<label><span>Long description <small>(max 512 chars)</small></span>',
			'<textarea data-longdesc placeholder="Long description will appear here..." maxlength="512"></textarea></label>',
			'<button type="button" data-generate data-action disabled>Generate</button>',
			'<div class="spinner"></div>',
			'<div class="alt-error"></div>'
		].join('');
		root.replaceChildren(tpl.content);

		this.#els = {
			alt: root.querySelector('[data-alt]'),
			longdesc: root.querySelector('[data-longdesc]'),
			btn: root.querySelector('[data-generate]'),
			spinner: root.querySelector('.spinner'),
			error: root.querySelector('.alt-error')
		};

		const attrVal = this.getAttribute('value');
		if (attrVal) this.#els.alt.value = attrVal;
		const attrLd = this.getAttribute('longdesc');
		if (attrLd) this.#els.longdesc.value = attrLd;

		this.#updateButton();

		this.#els.btn.addEventListener('click', () => {
			if (this.#isGenerating || !this.#src) return;
			this.generating = true;
			this.#els.error.classList.remove('active');
			this.dispatchEvent(new CustomEvent('requestGenerate', {
				bubbles: true,
				composed: true
			}));
		});

		const emitChange = () => {
			this._internals.setFormValue(this.#els.alt.value);
			this.dispatchEvent(new CustomEvent('change', {
				bubbles: true,
				composed: true,
				detail: { alt: this.#els.alt.value, longdesc: this.#els.longdesc.value }
			}));
		};
		this.#els.alt.addEventListener('input', emitChange);
		this.#els.longdesc.addEventListener('input', emitChange);
	}

	#updateButton() {
		if (this.#els.btn) this.#els.btn.disabled = !this.#src || this.#isGenerating;
	}
}

customElements.define('web-config-alt', WebConfigAlt);
