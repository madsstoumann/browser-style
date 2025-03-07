import { renderIcon, iconMap } from "../gui-icon/index.js";

/**
 * Command handler for GUI icon button commands. 
 * Polyfill for https://fullystacked.net/command-and-commandfor/
 */
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

			 // Get the button that triggered the command
			const buttonElement = event.target;
			
			// Handle anchor positioning if both attributes are present
			if (buttonElement.hasAttribute('anchor') && buttonElement.hasAttribute('anchor-position')) {
				const anchor = buttonElement.getAttribute('anchor');
				const anchorPosition = buttonElement.getAttribute('anchor-position');
				
				// Set the anchor attribute on the target
				target.setAttribute('anchor', anchor);
				
				// Add the anchor-position as a class
				target.classList.add(anchorPosition);
			}

			// Allow custom handling if provided
			if (onCommand && onCommand(command, commandFor, target) === true) {
				return; // Custom handler took care of it
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

		// Return function to remove the listener if needed
		return () => hostElement.removeEventListener('gui-icon-button-command', handleCommand);
	}
}

export default class GuiIconButton extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		const sheet = new CSSStyleSheet();
		sheet.replaceSync(`
			:host {
				--gui-icon-sz: 20px;
				display: contents;
			}
			:host::part(icon) {
				fill: none;
				height: var(--gui-icon-sz);
				pointer-events: none;
				stroke: currentColor;
				stroke-linecap: round;
				stroke-linejoin: round;
				stroke-width: 2;
				width: var(--gui-icon-sz);
			}
			:host::part(icon-button) {
				color-scheme: light dark;
				display: inline-grid;
				background: #0000;
				color: var(--gui-icon-button-c, inherit);
				border: var(--gui-icon-button-b, none);
				border-radius: var(--gui-icon-button-bdrs, 50%);
				padding: var(--gui-icon-button-p, 3px);
				place-content: center;
			}
			@media (hover:hover) {
				:host::part(icon-button):hover {
					background: var(--gui-icon-button-bg-hover, light-dark(#CCC8, #1C1C1E));
				}
			}
		`);
		this.shadowRoot.adoptedStyleSheets = [sheet];
	}

	connectedCallback() {
		const command = this.getAttribute('command');
		const commandFor = this.getAttribute('commandfor');
		if (command && commandFor) {
			this.addEventListener('click', () => this.dispatchEvent(new CustomEvent('gui-icon-button-command', { bubbles: true, detail: { command, commandFor } })));
		}
		const anchor = this.getAttribute('anchor');
		const title = this.getAttribute('title') || '';
		this.shadowRoot.innerHTML = `
			<button 
				part="icon-button ${this.getAttribute('part') || ''}"
				${anchor ? `style="anchor-name:${anchor};"` : ''}
				${title ? `title="${title}"` : ''}
				type="button">
				${renderIcon(iconMap[this.getAttribute('icon')], this.getAttribute('icon-part') || '')}
			</button>
		`;
	}
}
customElements.define('gui-icon-button', GuiIconButton);