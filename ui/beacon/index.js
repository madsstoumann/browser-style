/**
 * <ui-beacon>
 * Light DOM web component for the CSS-first beacon indicator.
 * Variants: bare dot (default), pill, solid, ticker.
 * Animations: blink, pulse, breathe (or static) — gated behind
 * prefers-reduced-motion: no-preference in the CSS, so reduced-motion users
 * get a static beacon automatically. Pause a running animation with the
 * [paused] attribute.
 * The component only auto-renders the ticker's inner structure
 * (<span>label <i></i></span>); every other variant is pure CSS.
 * No Shadow DOM.
 * @version 4.2.0
 */

class UiBeacon extends HTMLElement {
	static observedAttributes = ['variant'];

	connectedCallback() {
		if ((this.getAttribute('variant') || '').includes('ticker')) {
			this.renderTicker();
		}
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue || !this.isConnected) return;
		if (name === 'variant') {
			const wasTicker = (oldValue || '').includes('ticker');
			const isTicker = (newValue || '').includes('ticker');
			if (wasTicker !== isTicker) {
				this.unwrap();
				this.connectedCallback();
			}
		}
	}

	renderTicker() {
		if (this.querySelector(':scope > span')) return;
		const span = document.createElement('span');
		while (this.firstChild) span.appendChild(this.firstChild);
		span.appendChild(document.createElement('i'));
		this.appendChild(span);
	}

	unwrap() {
		const wrapper = this.querySelector(':scope > span');
		if (!wrapper) return;
		wrapper.querySelectorAll(':scope > i').forEach(el => el.remove());
		while (wrapper.firstChild) this.appendChild(wrapper.firstChild);
		wrapper.remove();
	}
}

customElements.define('ui-beacon', UiBeacon);
export { UiBeacon };
