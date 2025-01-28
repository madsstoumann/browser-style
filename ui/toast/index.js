const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(`
	:host {
		align-items: center;
		background: var(--ui-toast-bg, #CCC);
		border: 0;
		border-radius: .25em;
		box-shadow: 0 1em 3em rgba(0, 0, 0, 0.25);
		color: var(--ui-toast-c, #333);
		font-family: system-ui, sans-serif;
		font-size: 1rem;
		gap: 1.5ch;
		padding: 1ch 1.75ch 1ch 2ch;
	}
	:host::part(close) {
		background: transparent;
		border: 0;
		border-radius: .25em;
		color: inherit;
		cursor: pointer;
		font-size: x-large;
		line-height: 1;
		margin: 0;
		padding: 0 .2em;
	}
	:host::part(close):hover {
		background-color: var(--ui-toast-c, #333);
		color: var(--ui-toast-bg, #CCC);
	}
	:host(:popover-open) {
		display: flex;
		inset-block: auto 1em;
		inset-inline: auto 1em;
		position: fixed;
	}
	:host(.info) {
		--ui-toast-bg: #d1ecf1;
		--ui-toast-c: #0c5460;
	}
	:host(.success) {
		--ui-toast-bg: #d4edda;
		--ui-toast-c: #155724;
	}
	:host(.warning) {
		--ui-toast-bg: #fff3cd;
		--ui-toast-c: #856404;
	}
	:host(.error) {
		--ui-toast-bg: #f8d7da;
		--ui-toast-c: #721c24;
	}
`);

export class UiToast extends HTMLElement {
	#initialized = false;
	#root;

	constructor() {
		super();
		this.#root = this.attachShadow({ mode: 'open' });
		this.basePath = new URL('./', import.meta.url).href;
		
		if (!this.hasAttribute('nomount')) {
			this.mount();
		}
	}

	connectedCallback() {
		if (!this.#initialized) return;
	}

	async mount() {
		if (!this.#initialized) {
			await Promise.resolve();
			this.initializeComponent();
			this.#initialized = true;
			if (this.isConnected) {
				this.connectedCallback();
			}
		}
	}

	initializeComponent() {
		this.#root.adoptedStyleSheets = [stylesheet];
		this.setAttribute('popover', '');
		this.#root.innerHTML = `
			<span part="message"></span>
			<button part="close">
				<slot name="close">×</slot>
			</button>`;
		this.close = this.#root.querySelector(`[part="close"]`);
		this.close.addEventListener('click', () => this.hidePopover());
		this.message = this.#root.querySelector(`[part="message"]`);
	}

	showToast(message, type, duration = 3000) {
		this.message.textContent = message;
		this.className = type;
		this.showPopover();

		if (duration > 0) {
			setTimeout(() => {
				this.hidePopover();
			}, duration);
		}
	}

	static register() {
		if (!customElements.get('ui-toast')) {
			customElements.define('ui-toast', this);
		}
	}
}

UiToast.register();
