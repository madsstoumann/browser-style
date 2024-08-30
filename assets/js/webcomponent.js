/**
 * Web Component Template
 * @author Mads Stoumann
 * @version 1.0.00
 * @summary 30-08-2024
 * @class
 * @extends {HTMLElement}
 */
export class WebComponentTemplate extends HTMLElement {
	constructor() {
		super();

		// Determine if Shadow DOM should be used
		const useShadow = !this.hasAttribute('no-shadow');
		
		// Determine if styles should be included
		const noStyles = this.hasAttribute('no-styles');
		
		// Attach shadow root or use the element itself
		this.root = useShadow ? this.attachShadow({ mode: 'open' }) : this;

		// If not using Shadow DOM, prepare to manage slots manually
		if (!useShadow) {
			this.getSlots();
		}

		// If using Shadow DOM and styles are not excluded, set up stylesheets
		if (useShadow && !noStyles) {
			this.stylesheet = new CSSStyleSheet();
			this.root.adoptedStyleSheets = [this.stylesheet];
		}
	}

	connectedCallback() {
		// Append slots if not using Shadow DOM
		if (!this.shadowRoot) {
			this.appendSlots();
		}
	}

	appendSlots() {
		// Method to insert slotted elements into the appropriate places in the template
		if (this.slots) {
			this.slots.childNodes.forEach((node) => {
				const name = node.getAttribute('slot');
				const placeholder = this.querySelector(`slot[name="${name}"]`);
				if (name && placeholder) {
					placeholder.outerHTML = node.outerHTML;
				}
			});
		}
	}

	getSlots() {
		// Method to collect slotted elements into a DocumentFragment
		this.slots = new DocumentFragment();
		this.querySelectorAll('[slot]').forEach((el) => {
			this.slots.appendChild(el.cloneNode(true)); // Clone nodes to prevent moving them from the light DOM
		});
	}

	static mount() {
		// Define the custom element if it hasn't been defined yet
		if (!customElements.get(this.tagName)) {
			customElements.define(this.tagName, this);
		}
	}
}
