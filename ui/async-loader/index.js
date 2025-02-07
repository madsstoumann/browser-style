const styles = new CSSStyleSheet();
styles.replaceSync(`
	:host(:not([inline])) {
		background: var(--async-loader-bg, color-mix(in oklab, Canvas 80%, transparent 20%));
		block-size: 100dvh;
		border: 0;
		color: var(--async-loader-c, CanvasText);
		color-scheme: light dark;
		grid-template-rows: repeat(3, auto);
		inline-size: 100dvw;
		padding: var(--async-loader-p, 1rem);
	}
	:host(:not([inline])[popover]:popover-open) {
		display: grid;
	}
	:host::part(close) {
		background: #0000;
		border: 0;
		border-radius: 50%;
		box-sizing: border-box;
		grid-row: 1;
		padding: 1rem;
		place-self: start end;
	}
	:host::part(close):focus-visible,
	:host::part(close):hover {
		background: var(--async-loader-close-bg, light-dark(#f3f3f3, #333));
		outline: none;
	}
	:host::part(error) {
		grid-row: 3;
		place-self: end center;
		text-align: center;
	}
	:host::part(icon) {
		aspect-ratio: 1;
		block-size: 1.5rem;
		fill: none;
		pointer-events: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 2;
	}
	:host::part(spinner) {
		--_bg: var(--async-loader-spinner-bg, light-dark(#f3f3f3, #333));
		animation: spin 1s linear infinite;
		aspect-ratio: 1;
		block-size: var(--async-loader-spinner-sz, 3.5rem);
		border-color: var(--async-loader-spinner-accent, light-dark(#007bff, #337dcc)) var(--_bg) var(--_bg);
		border-radius: 50%;
		border-style: solid;
		border-width: var(--async-loader-spinner-bdw, calc(var(--async-loader-spinner-sz, 3.5rem) / 8));
		grid-row: 2;
		place-self: center;
	}

	/* Inline */
	:host([inline]) {
		--async-loader-spinner-sz: 1em;
	}
	:host([inline])::part(close),
	:host([inline])::part(error) {
		display: none;
	}
	@keyframes spin {
		to { rotate: 1turn; }
	}
`);

class AsyncLoader extends HTMLElement {
	#elements = {};
	#root;

	static observedAttributes = ['allowclose', 'errormsg', 'errortype', 'inline', 'timeout'];

	get isInline() {
		return this.hasAttribute('inline');
	}

	constructor() {
		super();
		this.#root = this.attachShadow({ mode: 'open' });
		this.#root.adoptedStyleSheets = [styles];
		
		// Internal state
		this._timeoutId = null;
		this._loading = false;

		// Bind methods
		this.startLoading = this.startLoading.bind(this);
		this.stopLoading = this.stopLoading.bind(this);
		this.handleTimeout = this.handleTimeout.bind(this);
		this.handleError = this.handleError.bind(this);
	}

	connectedCallback() {
		this.#root.innerHTML = `
			<button type="button" part="close"${this.hasAttribute('allowclose') ? '' : ' hidden'}>
				<svg part="icon" viewBox="0 0 24 24"><path d="M18 6l-12 12"/><path d="M6 6l12 12"/></svg>
			</button>
			<div part="spinner" role="progressbar">
				<slot name="success">
					<svg viewBox="0 0 24 24" part="icon" style="display:none"><path d="M5 12l5 5l10 -10" /></svg>
				</slot>
			</div>
			<output part="error" role="alert"></div>
		`;

		this.#elements = {
			close: this.shadowRoot.querySelector('[part="close"]'),
			error: this.shadowRoot.querySelector('[part="error"]'),
			spinner: this.shadowRoot.querySelector('[part="spinner"]')
		};

		this.hidden = this.isInline;
		if (!this.isInline) this.setAttribute('popover', 'manual');
		this.setupEvents();
	}

	setupEvents() {
		this.addEventListener('loader:start', this.startLoading);
		this.addEventListener('loader:stop', this.stopLoading);
		this.#elements.close.addEventListener('click', () => this.stopLoading());
	}

	async startLoading(event) {
		if (this._loading) return;
		
		if (this.isInline) {
			this.hidden = false;
		}
		else {
			this.showPopover();
		}

		this._loading = true;
		this.#elements.error.value = '';
		this.#elements.error.part = `error ${this.getAttribute('errortype') || ''}`;
		this.#elements.close.hidden = !this.hasAttribute('allowclose');

		const timeout = this.getAttribute('timeout');
		if (timeout) {
			this._timeoutId = setTimeout(() => this.handleTimeout(), parseInt(timeout));
		}

		this.dispatchEvent(new CustomEvent('loader:started', {
			bubbles: true
		}));
	}

	stopLoading(event) {
		if (this._timeoutId) {
			clearTimeout(this._timeoutId);
			this._timeoutId = null;
		}

		this._loading = false;
		if (this.isInline) {
			this.hidden = true;
		}
		else {
			this.togglePopover(false);
		}
		this.#elements.error.value = '';

		this.dispatchEvent(new CustomEvent('loader:stopped', {
			bubbles: true
		}));
	}

	handleTimeout() {
		const error = this.getAttribute('errormsg') || 'Operation timed out';
		this.handleError(new Error(error));
	}

	handleError(error) {
		if (this.isInline) { this.stopLoading(); }
		this.#elements.close.hidden = false;
		this.#elements.error.value = error.message;
		this._loading = false;

		this.dispatchEvent(new CustomEvent('loader:error', {
			bubbles: true,
			detail: { error }
		}));
	}
}

customElements.define('async-loader', AsyncLoader);
