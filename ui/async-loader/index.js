const styles = new CSSStyleSheet();
styles.replaceSync(`
	:host * { box-sizing: border-box; }
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
		block-size: 3.5rem;
		font-size: 1.5rem;
		grid-row: 1;
		inline-size: 3.5rem;
		padding: 1rem;
		place-self: start end;
	}
	:host::part(close):focus-visible,
	:host::part(close):hover {
		background: var(--async-loader-close-bg, light-dark(#f3f3f3, #333));
		outline: none;
	}
	:host::part(error) {
		background: var(--async-loader-error-bg, light-dark(CanvasText, Canvas));
		border-radius: 0.25rem;
		color: var(--async-loader-error-c, light-dark(Canvas, CanvasText));
		font-size: smaller;
		grid-row: 3;
		// padding: 1ch 2ch;
		place-self: end center;
		text-align: center;
	}
	:host::part(icon) {
		aspect-ratio: 1;
		block-size: 1em;
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
		border-width: var(--async-loader-spinner-bdw, calc(var(--async-loader-spinner-sz, 3.5rem) / 10));
		grid-row: 2;
		overflow: hidden;
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
	:host :where([part="status-failed"]):not([hidden]),
	:host :where([part="status-success"]):not([hidden]) {
		display: grid;
		place-content: center;
	}

	@keyframes spin {
		to { rotate: 1turn; }
	}
`);

class AsyncLoader extends HTMLElement {
	#elements = {};
	#root;
	#timeoutId = null;
	#loading = false;

	static observedAttributes = ['allowclose', 'errormsg', 'errortype', 'inline', 'timeout'];

	get isInline() {
		return this.hasAttribute('inline');
	}

	constructor() {
		super();
		this.#root = this.attachShadow({ mode: 'open' });
		this.#root.adoptedStyleSheets = [styles];
	}

	connectedCallback() {
		this.#root.innerHTML = `
			<button type="button" part="close"${this.hasAttribute('allowclose') ? '' : ' hidden'}>
				<svg part="icon" viewBox="0 0 24 24"><path d="M18 6l-12 12"/><path d="M6 6l12 12"/></svg>
			</button>
			<div part="spinner" role="progressbar"></div>
			<div part="status-success" hidden>
				<slot name="success"><svg viewBox="0 0 24 24" part="icon"><path d="M5 12l5 5l10 -10"/></svg></slot>
			</div>
			<div part="status-failed" hidden>
				<slot name="failed"><svg viewBox="0 0 24 24" part="icon"><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/><path d="M12 9v4"/><path d="M12 16v.01"/></svg></slot>
			</div>
			<output part="error" role="alert"></output>
		`;

		this.#elements = {
			close: this.#root.querySelector('[part="close"]'),
			error: this.#root.querySelector('[part="error"]'),
			spinner: this.#root.querySelector('[part="spinner"]'),
			status: {
				failed: this.#root.querySelector('[part="status-failed"]'),
				success: this.#root.querySelector('[part="status-success"]')
			}
		};

		this.hidden = this.isInline;
		if (!this.isInline) this.setAttribute('popover', 'manual');

		this.addEventListener('loader:start', this.startLoading);
		this.addEventListener('loader:stop', this.stopLoading);
		this.#elements.close.addEventListener('click', () => this.stopLoading());
	}

	startLoading = () => {
		if (this.#loading) return;
		if (this.isInline) {
			this.hidden = false;
		} else {
			this.showPopover();
		}

		this.#loading = true;
		this.#elements.error.part = `error ${this.getAttribute('errortype') || ''}`;
		this.#elements.error.value = '';
		this.#elements.close.hidden = !this.hasAttribute('allowclose');
		this.#elements.spinner.style.animationPlayState = 'running';

		const timeout = this.getAttribute('timeout');
		if (timeout) {
			this.#timeoutId = setTimeout(() => this.handleTimeout(), parseInt(timeout));
		}
		this.dispatchEvent(new CustomEvent('loader:started', { bubbles: true }));
	};

	stopLoading = (hasError = false) => {
		if (hasError instanceof Event) hasError = false;

		this.#timeoutId && clearTimeout(this.#timeoutId);
		this.#timeoutId = null;
		this.#loading = false;

		if (this.isInline) {
			this.#elements.spinner.hidden = true;
			this.#elements.status.success.hidden = hasError;
			this.#elements.status.failed.hidden = !hasError;
		} else {
			this.togglePopover(false);
		}

		this.#elements.error.value = '';
		this.dispatchEvent(new CustomEvent('loader:stopped', { bubbles: true }));
	};

	handleTimeout = () => {
		const error = this.getAttribute('errormsg') || 'Operation timed out';
		this.handleError(new Error(error));
	};

	handleError = (error) => {
		if (this.isInline) {
			this.stopLoading(true);
		}
		this.#elements.close.hidden = false;
		this.#elements.error.value = error.message;
		this.#loading = false;
		this.#elements.spinner.style.animationPlayState = 'paused';

		this.dispatchEvent(new CustomEvent('loader:error', {
			bubbles: true,
			detail: { error }
		}));
	};
}

customElements.define('async-loader', AsyncLoader);