/**
 * <ui-beacon>
 * Light DOM web component for the CSS-first beacon indicator.
 * Default mode: live ticker with dot animation and slide.
 * Blink variant: classic blink with click-to-pause toggle.
 * No Shadow DOM.
 * @version 4.0.0
 */

class UiBeacon extends HTMLElement {
	static observedAttributes = ['variant', 'color'];

	connectedCallback() {
		const variant = this.getAttribute('variant') || '';
		if (variant.includes('blink')) {
			if (!this.querySelector(':scope > label')) this.renderBlink();
		} else {
			if (!this.querySelector(':scope > span')) this.renderLive();
		}
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue || !this.isConnected) return;
	}

	renderLive() {
		const span = document.createElement('span');
		while (this.firstChild) span.appendChild(this.firstChild);
		const dots = document.createElement('i');
		span.appendChild(dots);
		this.appendChild(span);
	}

	renderBlink() {
		const label = document.createElement('label');
		const input = document.createElement('input');
		input.type = 'checkbox';
		input.setAttribute('data-sr', '');
		const span = document.createElement('span');
		while (this.firstChild) span.appendChild(this.firstChild);
		label.appendChild(input);
		label.appendChild(span);
		this.appendChild(label);
	}
}

customElements.define('ui-beacon', UiBeacon);
export { UiBeacon };
