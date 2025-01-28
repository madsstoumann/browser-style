const snackBarStyles = new CSSStyleSheet();
snackBarStyles.replaceSync(`
	:host {
		background: #0000;
		border: 0;
		gap: 0.5rem;
		inset-block: auto 1em;
		inset-inline: auto 1em;
		justify-items: end;
		position: fixed;
	}
	:host(:popover-open) {
		display: grid;
	}
`);

const snackItemStyles = new CSSStyleSheet();
snackItemStyles.replaceSync(`
	:host {
		align-items: center;
		background: var(--snack-bar-bg, #CCC);
		border: 0;
		border-radius: .25em;
		color: var(--snack-bar-c, #333);
		display: flex;
		font-family: system-ui, sans-serif;
		font-size: 1rem;
		gap: 1.5ch;
		padding: 1ch 1.75ch 1ch 2ch;
	}
	:host::part(action) {
		all: unset;
		color: var(--snack-bar-ac, inherit);
		font-size: smaller;
		text-decoration: underline;
	}
	:host::part(close) {
		background: transparent;
		border: 0;
		border-radius: .25em;
		color: inherit;
		cursor: pointer;
		line-height: 1;
		margin: 0;
		padding: 0 .2em;
		font-size: x-large;
	}
	:host::part(action):hover {
		opacity: 0.8;
	}
	:host::part(close):hover {
		background-color: var(--snack-bar-c, #333);
		color: var(--snack-bar-bg, #CCC);
	}
	:host(.info) {
		--snack-bar-bg: #d1ecf1;
		--snack-bar-c: #0c5460;
		--snack-bar-ac: #007bff;
	}
	:host(.success) {
		--snack-bar-bg: #d4edda;
		--snack-bar-c: #155724;
		--snack-bar-ac: #28a745;
	}
	:host(.warning) {
		--snack-bar-bg: #fff3cd;
		--snack-bar-c: #856404;
		--snack-bar-ac: #ffc107;
	}
	:host(.error) {
		--snack-bar-bg: #f8d7da;
		--snack-bar-c: #721c24;
		--snack-bar-ac: #dc3545;
	}
`);

class SnackItem extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.adoptedStyleSheets = [snackItemStyles];
	}

	connectedCallback() {
		this.shadowRoot.innerHTML = `
			<span part="message"></span>
			<button part="action" hidden>
				<slot name="action"></slot>
			</button>
			<button part="close">
				<slot name="close">×</slot>
			</button>`;
		
		this.close = this.shadowRoot.querySelector('[part="close"]');
		this.action = this.shadowRoot.querySelector('[part="action"]');
		
		this.close.addEventListener('click', () => {
			this.remove();
			if (!this.parentElement?.hasChildNodes()) {
				this.parentElement?.hidePopover();
			}
		});

		// Show action button if slot has content
		this.shadowRoot.querySelector('slot[name="action"]')
			.addEventListener('slotchange', (e) => {
				this.action.hidden = !e.target.assignedNodes().length;
			});
	}

	show(message, type, duration = 3000, actionText = '') {
		this.shadowRoot.querySelector('[part="message"]').textContent = message;
		this.className = type || '';

		if (actionText) {
			const actionSlot = this.shadowRoot.querySelector('slot[name="action"]');
			actionSlot.textContent = actionText;
			this.action.hidden = false;
		}

		if (duration > 0) {
			setTimeout(() => this.remove(), duration);
		}
	}
}

export class SnackBar extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.adoptedStyleSheets = [snackBarStyles];
	}

	connectedCallback() {
		this.setAttribute('popover', '');
		this.setAttribute('exportparts', 'message, action, close');
	}

	showToast(message, type, duration = 3000, actionText = '') {
		const item = document.createElement('snack-item');
		
		if (this.getAttribute('order') === 'reverse') {
			this.shadowRoot.insertBefore(item, this.shadowRoot.firstChild);
		} else {
			this.shadowRoot.appendChild(item);
		}
		
		item.show(message, type, duration, actionText);
		
		if (!this.matches(':popover-open')) {
			this.showPopover();
		}

		// Hide popover when last item is removed
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
