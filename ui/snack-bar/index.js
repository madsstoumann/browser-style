const DEFAULT_DURATION = 3000;

const snackBarStyles = new CSSStyleSheet();
snackBarStyles.replaceSync(`
	:host {
		--snack-bar-m: .5rem;
		align-content: baseline;
		background: #0000;
		border: 0;
		box-sizing: border-box;
		gap: var(--snack-bar-gap, .5rem);
		inset-block: auto var(--snack-bar-m);
		inset-inline: auto var(--snack-bar-m);
		justify-items: end;
		max-width: calc(var(--snack-bar-mw, 350px) - (2 * var(--snack-bar-m)));
	}
	:host([position~="top"]) {
		inset-block: var(--snack-bar-m) auto;
	}
	:host([position~="left"]) {
		inset-inline: var(--snack-bar-m) auto;
		justify-items: start;
	}
	:host([position~="center"]) {
		inset-inline: 50% auto;
		justify-items: center;
		translate: -50% 0;
	}
	:host([position="center center"]) {
		inset: 0px;
		translate: none;
	}
	:host(:popover-open) {
		display: grid;
	}
`);
const snackItemStyles = new CSSStyleSheet();
snackItemStyles.replaceSync(`
	:host {
		align-items: center;
		background: var(--snack-item-bg, light-dark(#18191B, #FFFFFF));
		border-radius: var(--snack-item-bdrs, .33rem);
		box-shadow: var(--snack-item-bxsh, 0 1px 2px -1px hsl(220 3% 15% / calc(1% + 9%)));
		box-sizing: border-box;
		color: var(--snack-item-c, light-dark(#E2E3E8, #313132));
		display: flex;
		font-family: var(--snack-item-ff, system-ui, sans-serif);
		font-size: var(--snack-item-fs, 1rem);
		gap: 1.5ch;
		justify-content: space-between;
		line-height: var(--snack-item-lh, 1.4);
		padding: var(--snack-item-p, 1ch 1.75ch);
		user-select: none;
		-webkit-user-select: none;
		width: var(--snack-item-w, auto);
	}
	:host([has-close]) {
		padding-inline-end: var(--snack-item-pie, 1ch);
	}
	:host::part(action) {
		all: unset;
		color: var(--snack-item-ac, light-dark(#7F9BEE, #3468D8));
		font-size: smaller;
		font-weight: 500;
	}
	:host::part(close) {
		aspect-ratio: 1;
		background: none;
		border: none;
		color: currentColor;
		height: var(--snack-item-icon-size, 1.5rem);
		padding: 0;
		place-self: var(--snack-item-close-align, center);
	}
	:host::part(action):hover,
	:host::part(close):hover {
		opacity: 0.65	;
	}
	:host::part(icon) {
		aspect-ratio: 1;
		fill: none;
		height: 100%;
		pointer-events: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 2;
	}
	:host([part~=info]) {
		--snack-item-bg: #d1ecf1;
		--snack-item-c: #0c5460;
		--snack-item-ac: #007bff;
	}
	:host([part~=success]) {
		--snack-item-bg: #d4edda;
		--snack-item-c: #155724;
		--snack-item-ac: #28a745;
	}
	:host([part~=warning]) {
		--snack-item-bg: #fff3cd;
		--snack-item-c: #856404;
		--snack-item-ac: #cc5500;
	}
	:host([part~=error]) {
		--snack-item-bg: #f8d7da;
		--snack-item-c: #721c24;
		--snack-item-ac: #dc3545;
	}
`);

class SnackItem extends HTMLElement {
	#elements = {};
	#timer;

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.adoptedStyleSheets = [snackItemStyles];
	}

	connectedCallback() {
		this.shadowRoot.innerHTML = `<span part="message"></span>`;
		this.#elements = { message: this.shadowRoot.querySelector('[part="message"]') };

		if (this.hasAttribute('message')) {
			const duration = this.hasAttribute('duration') ? parseInt(this.getAttribute('duration')) : 0;
			const showClose = duration === 0 || this.closest('snack-bar')?.getAttribute('popover') === 'manual';

			this.show({
				message: this.getAttribute('message'),
				part: this.getAttribute('part'),
				duration,
				actionText: this.getAttribute('action'),
				showClose
			});
		}
	}

	disconnectedCallback() {
		clearTimeout(this.#timer);
	}

	show({ message, part, duration = DEFAULT_DURATION, actionText = '', showClose = false }) {
		if (typeof message !== 'string') return;
		this.#elements.message.textContent = message;

		if (part) this.setAttribute('part', part);
		if (showClose) this.setAttribute('has-close', '');

		if (actionText) {
			const btn = document.createElement('button');
			btn.innerHTML = `<slot name="action">${actionText}</slot>`;
			btn.setAttribute('part', 'action');
			this.shadowRoot.appendChild(btn);
		}

		if (showClose) {
			const btn = document.createElement('button');
			btn.setAttribute('part', 'close');
			btn.innerHTML = `<span part="icon"><slot name="icon"><svg viewBox="0 0 24 24"><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg></slot></span>`;
			btn.onclick = () => {
				this.remove();
				this.parentElement?.hasChildNodes() || this.parentElement?.hidePopover();
			};
			this.shadowRoot.appendChild(btn);
		}

		if (duration > 0) {
			this.#timer = setTimeout(() => this.remove(), duration);
		}
	}
}

export class SnackBar extends HTMLElement {
	#isManual = false;

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.adoptedStyleSheets = [snackBarStyles];
	}

	connectedCallback() {
		this.#isManual = this.getAttribute('popover') === 'manual';
		this.setAttribute('popover', this.#isManual ? 'manual' : '');
		this.setAttribute('exportparts', 'action, close, icon, message');

		this.addEventListener('beforetoggle', (e) => {
			if (e.newState !== 'open') {
				this.shadowRoot.innerHTML = '';
			}
		});

		if (this.hasChildNodes()) {
			Array.from(this.children).forEach(child => {
				this.shadowRoot.appendChild(child);
			});
			this.showPopover();
		}
	}

	add(message, part, duration, actionText = '') {
		const item = document.createElement('snack-item');
		const method = this.getAttribute('order') === 'reverse' ? 'insertBefore' : 'appendChild';
		const target = method === 'insertBefore' ? this.shadowRoot.firstChild : null;
		
		this.shadowRoot[method](item, target);
		
		item.show({ 
			message, 
			part, 
			duration, 
			actionText, 
			showClose: duration === 0 || this.#isManual 
		});
		
		!this.matches(':popover-open') && this.showPopover();

		if (duration > 0) {
			setTimeout(() => {
				!this.shadowRoot.hasChildNodes() && this.hidePopover();
			}, duration);
		}

		return item;
	}

	static register() {
		if (!customElements.get('snack-bar')) {
			customElements.define('snack-bar', this);
			customElements.define('snack-item', SnackItem);
		}
	}
}

SnackBar.register();
