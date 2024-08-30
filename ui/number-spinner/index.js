/**
 * Number Spinner
 * @author Mads Stoumann
 * @version 1.0.00
 * @summary 29-08-2024
 * @class
 * @extends {HTMLElement}
 */
import { WebComponentTemplate } from '/assets/js/webcomponent.js';
export class NumberSpinner extends WebComponentTemplate {
	static tagName = 'number-spinner';
	constructor() {
		super();

		/*
			`this.root` is the shadowRoot or the element itself, depending on attribute `no-shadow`

			If you set markup in the constructur, be sure to call `super.connectedCallback();` *after* setting the markup.
			This can also all be done in the `connectedCallback` method.
		*/

		const label =  this.getAttribute('label');
		this.root.innerHTML =  `
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

		/*
		To set default styles, when using shadowRoot, use the following:
			this.stylesheet.replaceSync(`::host { ...}`);
		Note, that styles will *not* be applied, if attribute `no-styles` is set.
		*/
		this.input = this.root.querySelector('input');
		this.label = this.root.querySelector('[part="number-spinner-label"]');
		this.stepDownButton = this.root.querySelector('[part="number-spinner-decrement"]');
		this.stepUpButton = this.root.querySelector('[part="number-spinner-increment"]');
	}

	connectedCallback() {
		super.connectedCallback();
		this.stepUpButton.addEventListener('click', () => this.input.stepUp());
		this.stepDownButton.addEventListener('click', () => this.input.stepDown());
	}
}
