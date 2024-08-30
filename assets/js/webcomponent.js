/**
 * Web Component Template
 * @author Mads Stoumann
 * @version 1.0.00
 * @summary 29-08-2024
 * @class
 * @extends {HTMLElement}
 */
export class WebComponentTemplate extends HTMLElement {
	constructor() {
		super();

		const useShadow = !this.hasAttribute('no-shadow');
		const noStyles = this.hasAttribute('no-styles');
		this.root = useShadow ? this.attachShadow({ mode: 'open' }) : this;

		if (!useShadow) {
			this.getSlots();
		}
		if (useShadow && !noStyles) {
			this.stylesheet = new CSSStyleSheet();
      this.root.adoptedStyleSheets = [this.stylesheet];
    }
	}

	connectedCallback() {
		if (!this.shadowRoot) {
			this.appendSlots();
		}
	}

	appendSlots() {
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
		this.slots = new DocumentFragment();
		this.querySelectorAll('[slot]').forEach((el) => {
			this.slots.appendChild(el.cloneNode(true));
		});
	}

	static mount() {
    if (!customElements.get(this.tagName)) {
      customElements.define(this.tagName, this);
    }
  }
}
