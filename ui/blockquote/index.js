/**
 * <ui-blockquote>
 * Light DOM web component wrapper for the CSS-first blockquote.
 * Renders a native <blockquote> element — no Shadow DOM.
 * @version 4.0.0
 */

class UiBlockquote extends HTMLElement {
	static observedAttributes = ['variant', 'cite'];

	connectedCallback() {
		if (!this.querySelector(':scope > blockquote')) this.render();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue || !this.isConnected) return;
		const bq = this.querySelector(':scope > blockquote');
		if (!bq) return;
		if (name === 'variant') {
			bq.setAttribute('data-variant', newValue || '');
		} else if (name === 'cite') {
			if (newValue) {
				bq.setAttribute('cite', newValue);
			} else {
				bq.removeAttribute('cite');
			}
		}
	}

	render() {
		const bq = document.createElement('blockquote');
		const variant = this.getAttribute('variant');
		if (variant) bq.setAttribute('data-variant', variant);
		const cite = this.getAttribute('cite');
		if (cite) bq.setAttribute('cite', cite);

		while (this.firstChild) {
			bq.appendChild(this.firstChild);
		}
		this.appendChild(bq);
	}
}

customElements.define('ui-blockquote', UiBlockquote);
export { UiBlockquote };
