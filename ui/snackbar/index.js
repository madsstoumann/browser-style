const DEFAULT_DURATION = 3000;

const snackBarStyles = new CSSStyleSheet();
snackBarStyles.replaceSync(`
	:host {
		background: #0000;
		border: 0;
		gap: .5rem;
		inset-block: auto 1rem;
		inset-inline: auto 1rem;
	}
	:host([position*="top"]) {
		inset-block: 1rem auto;
	}
	:host([position*="left"]) {
		inset-inline: 1rem auto;
	}
	:host(:popover-open) {
		display: grid;
		justify-items: end;
	}
`);
const snackItemStyles = new CSSStyleSheet();
snackItemStyles.replaceSync(`
	:host {
		align-items: center;
		background: var(--snack-item-bg, light-dark(#18191B, #FFFFFF));
		border-radius: .33rem;
		color: var(--snack-item-c, light-dark(#E2E3E8, #313132));
		display: flex;
		font: 1rem system-ui, sans-serif;
		gap: 1.5ch;
		padding: 1ch 1.75ch;
	}
	:host::part(action) {
		all: unset;
		color: var(--snack-item-ac, light-dark(#7F9BEE, #3468D8));
		font-size: smaller;
		font-weight: 500;
	}
	:host::part(close) {
		background: none;
		border: none;
		color: currentColor;
		font-size: 1.5rem;
		line-height: 0;
		padding: 0 .2rem;
	}
	:host::part(action):hover,
	:host::part(close):hover {
		opacity: 0.8;
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
		--snack-item-ac: #ffc107;
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
		
		if (part) {
			this.setAttribute('part', part);
		}

		if (actionText) {
			const btn = document.createElement('button');
			btn.innerHTML = `<slot name="action">${actionText}</slot>`;
			btn.setAttribute('part', 'action');
			this.shadowRoot.appendChild(btn);
		}

		if (showClose) {
			const btn = document.createElement('button');
			btn.textContent = '×';
			btn.setAttribute('part', 'close');
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
		this.setAttribute('exportparts', 'action, close, message');

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
		
		if (this.getAttribute('order') === 'reverse') {
			this.shadowRoot.insertBefore(item, this.shadowRoot.firstChild);
		} else {
			this.shadowRoot.appendChild(item);
		}

		const showClose = duration === 0 || this.#isManual;

		item.show({ message, part, duration, actionText, showClose });
		
		if (!this.matches(':popover-open')) {
			this.showPopover();
		}

		if (duration > 0) {
			setTimeout(() => {
				this.shadowRoot.hasChildNodes() || this.hidePopover();
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
