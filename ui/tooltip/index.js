/**
 * <ui-tooltip>
 * Light DOM web component wrapper for the CSS-first tooltip.
 * JS only handles a11y wiring (aria-describedby, ESC to dismiss).
 * @version 4.0.0
 */

let _idCounter = 0;
const FOCUSABLE = new Set(['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA', 'SUMMARY']);

class UiTooltip extends HTMLElement {
	connectedCallback() {
		if (!this.id) this.id = `ui-tooltip-${++_idCounter}`;
		if (!this.hasAttribute('role')) this.setAttribute('role', 'tooltip');

		const parent = this.parentElement;
		if (parent && this.#isFocusable(parent)) {
			const ids = (parent.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
			if (!ids.includes(this.id)) {
				ids.push(this.id);
				parent.setAttribute('aria-describedby', ids.join(' '));
			}
			this._wiredParent = parent;
		}

		this._abort = new AbortController();
		document.addEventListener('keydown', (event) => {
			if (event.key === 'Escape') this.toggleAttribute('hidden', true);
		}, { signal: this._abort.signal });
	}

	disconnectedCallback() {
		this._abort?.abort();
		const parent = this._wiredParent;
		if (parent) {
			const ids = (parent.getAttribute('aria-describedby') || '').split(/\s+/).filter(id => id && id !== this.id);
			if (ids.length) parent.setAttribute('aria-describedby', ids.join(' '));
			else parent.removeAttribute('aria-describedby');
		}
		this._wiredParent = null;
	}

	#isFocusable(el) {
		return el.tabIndex >= 0 || FOCUSABLE.has(el.tagName) || el.hasAttribute('tabindex');
	}
}

customElements.define('ui-tooltip', UiTooltip);
export { UiTooltip };
