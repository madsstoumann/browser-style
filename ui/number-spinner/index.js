/**
 * Number Spinner
 * @author Mads Stoumann
 * @version 1.0.00
 * @summary 29-08-2024
 * @class
 * @extends {HTMLElement}
 */
export class NumberSpinner extends HTMLElement {
	constructor() {
		super();

		const label =  this.getAttribute('label');
		const shadow = this.hasAttribute('shadow');
		const root = shadow ? this.attachShadow({ mode: 'open' }) : this;
		if (!shadow) this.getSlots();

		root.innerHTML =  `
			<fieldset part="number-spinner-container">
				<legend part="number-spinner-label"><slot name="label">${label}</slot></legend>
				<div part="number-spinner-controls">
					<button type="button" part="number-spinner-decrement"><slot name="icon-minus">-</slot></button>
					<label part="number-spinner-input-wrapper" aria-label="${label}">
						<input type="number" part="number-spinner-input"
							max="${this.getAttribute('max') || 100}"
							min="${this.getAttribute('min') || 0}"
							step="${this.getAttribute('step') || 1}"
							value="${this.getAttribute('value')}">
					</label>
					<button type="button" part="number-spinner-increment"><slot name="icon-plus">+</slot></button>
				</div>
			</fieldset>`;

		this.input = root.querySelector('input');
		this.label = root.querySelector('[part="number-spinner-label"]');
		this.stepDownButton = root.querySelector('[part="number-spinner-decrement"]');
		this.stepUpButton = root.querySelector('[part="number-spinner-increment"]');
		this.stepUpButton.addEventListener('click', () => this.input.stepUp());
		this.stepDownButton.addEventListener('click', () => this.input.stepDown());
		if (!shadow) this.appendSlots();
	}

	appendSlots() {
		this.slots.childNodes.forEach((node) => {
			const name = node.getAttribute('slot');
			const placeholder = this.querySelector(`slot[name="${name}"]`);
			if (name && placeholder) {
				placeholder.outerHTML = node.outerHTML;
			}
		});
	}

	getSlots() {
		this.slots = new DocumentFragment();
		this.querySelectorAll('[slot]').forEach((el) => {
			this.slots.appendChild(el.cloneNode(true));
		});
	}

	static mount() {
		if (!customElements.get('number-spinner')) {
			customElements.define('number-spinner', this);
		}
	}
}
