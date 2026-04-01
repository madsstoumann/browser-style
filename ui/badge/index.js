/**
 * <ui-badge>
 * Light DOM web component wrapper for the CSS-first badge.
 * Renders as an inline element — no Shadow DOM.
 * @version 3.0.0
 */

class UiBadge extends HTMLElement {
	static observedAttributes = ['variant'];

	connectedCallback() {
		if (!this.getAttribute('role')) {
			this.setAttribute('role', 'status');
		}
	}
}

customElements.define('ui-badge', UiBadge);
export { UiBadge };
