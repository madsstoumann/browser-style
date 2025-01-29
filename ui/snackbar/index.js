const SNACK_TYPES = {
	info: { bg: '#d1ecf1', color: '#0c5460', action: '#007bff' },
	success: { bg: '#d4edda', color: '#155724', action: '#28a745' },
	warning: { bg: '#fff3cd', color: '#856404', action: '#ffc107' },
	error: { bg: '#f8d7da', color: '#721c24', action: '#dc3545' }
};

const snackBarStyles = new CSSStyleSheet();
snackBarStyles.replaceSync(`
	:host {
		background: #0000;
		border: 0;
		gap: .5rem;
		inset: auto 1rem 1rem auto;
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
		background: var(--snack-item-bg, #222);
		border-radius: .25em;
		color: var(--snack-item-c, #FFF);
		display: flex;
		font: 1rem system-ui, sans-serif;
		gap: 1.5ch;
		padding: 1ch 1.75ch 1ch 2ch;
	}
	:host::part(action) {
		all: unset;
		color: var(--snack-item-ac, hotpink);
		font-size: smaller;
		text-decoration: underline;
	}
	:host::part(close) {
		all: unset;
		font-size: 1.5em;
		padding: 0 .2em;
	}
	:host::part(action):hover,
	:host::part(close):hover {
		opacity: 0.8;
	}
`);

class SnackItem extends HTMLElement {
	static observedAttributes = ['duration', 'action', 'message', 'part'];
	#elements = {};
	#timer;

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.adoptedStyleSheets = [snackItemStyles];
	}

	connectedCallback() {
		this.shadowRoot.innerHTML = `
			<span part="message"></span>
			<button part="action" hidden><slot name="action"></slot></button>
			<button part="close">×</button>`;
		
		this.#elements = {
			action: this.shadowRoot.querySelector('[part="action"]'),
			close: this.shadowRoot.querySelector('[part="close"]'),
			message: this.shadowRoot.querySelector('[part="message"]')
		};

		this.#setupListeners();

		if (this.hasAttribute('message')) {
			this.show(
				this.getAttribute('message'),
				this.getAttribute('part'),
				parseInt(this.getAttribute('duration')) || 0,
				this.getAttribute('action')
			);
		}
	}

	disconnectedCallback() {
		clearTimeout(this.#timer);
	}

	#setupListeners() {
		this.#elements.close.onclick = () => {
			this.remove();
			if (!this.parentElement?.hasChildNodes()) {
				this.parentElement?.hidePopover();
			}
		};

		this.shadowRoot.querySelector('slot[name="action"]')
			.addEventListener('slotchange', (e) => {
				this.#elements.action.hidden = !e.target.assignedNodes().length;
			});
	}

	show(message, part, duration = 3000, actionText = '') {
		if (typeof message !== 'string') return;
		
		this.#elements.message.textContent = message;
		
		if (part) {
			const type = SNACK_TYPES[part];
			if (type) {
				this.style.setProperty('--snack-item-bg', type.bg);
				this.style.setProperty('--snack-item-c', type.color);
				this.style.setProperty('--snack-item-ac', type.action);
			}
		}

		if (actionText) {
			const slot = this.shadowRoot.querySelector('slot[name="action"]');
			slot.textContent = actionText;
			this.#elements.action.hidden = false;
		}

		if (duration > 0) {
			this.#timer = setTimeout(() => this.remove(), duration);
		}
	}

	get action() {
		return this.#elements.action;
	}
}

export class SnackBar extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.adoptedStyleSheets = [snackBarStyles];
	}

	connectedCallback() {
		if (!this.hasAttribute('popover')) {
			this.setAttribute('popover', '');
		}
		this.setAttribute('exportparts', 'action, close, message');

		if (this.hasChildNodes()) {
			Array.from(this.children).forEach(child => {
				this.shadowRoot.appendChild(child);
			});
			this.showPopover();
		}
	}

	add(message, part, duration = 3000, actionText = '') {
		const item = document.createElement('snack-item');
		
		if (this.getAttribute('order') === 'reverse') {
			this.shadowRoot.insertBefore(item, this.shadowRoot.firstChild);
		} else {
			this.shadowRoot.appendChild(item);
		}
		
		item.show(message, part, duration, actionText);
		
		if (!this.matches(':popover-open')) {
			this.showPopover();
		}

		if (duration > 0) {
			setTimeout(() => {
				if (!this.shadowRoot.hasChildNodes()) {
					this.hidePopover();
				}
			}, duration);
		}

		return item; // Return the item so we can add event listeners if needed
	}

	static register() {
		if (!customElements.get('snack-bar')) {
			customElements.define('snack-bar', this);
			customElements.define('snack-item', SnackItem);
		}
	}
}

SnackBar.register();
