/**
 * <ui-table>
 * Light DOM web component wrapper for the CSS-first table.
 * Forwards variant/hover attributes to child <table> as data-attributes.
 * No Shadow DOM.
 * @version 4.0.0
 */

class UiTable extends HTMLElement {
	static observedAttributes = ['variant', 'hover'];

	connectedCallback() {
		this.propagateAttributes();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue || !this.isConnected) return;
		this.propagateAttributes();
	}

	propagateAttributes() {
		const table = this.querySelector(':scope > table');
		if (!table) return;

		const variant = this.getAttribute('variant');
		if (variant) {
			table.setAttribute('data-variant', variant);
		}

		const hover = this.getAttribute('hover');
		if (hover) {
			table.setAttribute('data-hover', hover);
		}
	}
}

customElements.define('ui-table', UiTable);
export { UiTable };
