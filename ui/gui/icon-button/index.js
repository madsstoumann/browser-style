import { renderIconButton, iconMap, iconStyles } from "../gui-icon/index.js";

export class CommandHandler {
	/**
	 * Initialize the command handler and attach it to a host element
	 * @param {HTMLElement} hostElement - The element to attach the event listener to
	 * @param {Function} onCommand - Optional callback for custom command handling
	 * @returns {Function} - Function to remove the event listener
	 */
	static initialize(hostElement, onCommand = null) {
		const handleCommand = (event) => {
			const { command, commandFor } = event.detail;
			if (!command || !commandFor) return;
			
			const target = document.getElementById(commandFor);
			if (!target) {
				console.warn(`Target element with ID "${commandFor}" not found.`);
				return;
			}

			// Allow custom handling if provided
			if (onCommand && onCommand(command, commandFor, target) === true) {
				return;
			}

			// Default handling
			const isPopover = target.hasAttribute('popover');
			const isDialog = target.tagName.toLowerCase() === 'dialog';
			
			switch (command) {
				case 'close':
					if (isDialog && typeof target.close === 'function') {
						target.close();
					}
					break;
				case 'hide-popover':
					if (isPopover && typeof target.hidePopover === 'function') {
						target.hidePopover();
					}
					break;
				case 'show-modal':
					if (isDialog && typeof target.showModal === 'function') {
						target.showModal();
					}
					break;
				case 'show-popover':
					if (isPopover && typeof target.showPopover === 'function') {
						target.showPopover();
					}
					break;

				case 'toggle-popover':
					if (isPopover) {
						if (target.matches(':popover-open')) {
							target.hidePopover();
						} else if (typeof target.showPopover === 'function') {
							target.showPopover();
						}
					}
					break;
				default:
					console.log(`Command "${command}" not recognized or not applicable for this element type`, target);
			}
		};

		hostElement.addEventListener('gui-icon-button-command', handleCommand);
		return () => hostElement.removeEventListener('gui-icon-button-command', handleCommand);
	}
}

export default class GuiIconButton extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		const sheet = new CSSStyleSheet();
		sheet.replaceSync(iconStyles);
		this.shadowRoot.adoptedStyleSheets = [sheet];
	}

	connectedCallback() {
		const command = this.getAttribute('command');
		const commandFor = this.getAttribute('commandfor');
		if (command && commandFor) {
			this.addEventListener('click', () => this.dispatchEvent(new CustomEvent('gui-icon-button-command', { bubbles: true, detail: { command, commandFor } })));
		}
		this.shadowRoot.innerHTML = renderIconButton(
			iconMap[this.getAttribute('icon')],
			this.getAttribute('title') || '',
			this.getAttribute('part') || '',
			this.hasAttribute('hidden'),
			command, commandFor);
	}
}
customElements.define('gui-icon-button', GuiIconButton);