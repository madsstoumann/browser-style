/**
 * <ui-beacon>
 * Light DOM web component for the CSS-first beacon indicator.
 * Variants: bare dot (default), pill, solid, ticker.
 * Animations: blink, pulse, breathe (or static).
 * Pause: prefers-reduced-motion, [paused] attribute, or click-to-pause via inner checkbox.
 * No Shadow DOM.
 * @version 4.1.0
 */

class UiBeacon extends HTMLElement {
	static observedAttributes = ['variant'];

	connectedCallback() {
		const variant = this.getAttribute('variant') || '';
		if (variant.includes('ticker')) {
			this.renderTicker();
		} else if (this.hasText() && this.shouldHavePauseToggle()) {
			this.renderLabel();
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

	hasText() {
		return this.textContent.trim().length > 0;
	}

	shouldHavePauseToggle() {
		// as card furniture (inside ui-media) or on a reveal front face (inside
		// summary) the beacon is a MARKER — never inject the interactive
		// click-to-pause checkbox there ([paused] + reduced-motion still work)
		if (this.closest('ui-media, summary')) return false;
		const variant = this.getAttribute('variant') || '';
		if (variant.includes('solid')) return true;
		const animation = this.getAttribute('animation');
		return !!animation && animation !== 'none';
	}

	renderTicker() {
		if (this.querySelector(':scope > span')) return;
		const span = document.createElement('span');
		while (this.firstChild) span.appendChild(this.firstChild);
		span.appendChild(document.createElement('i'));
		this.appendChild(span);
	}

	renderLabel() {
		if (this.querySelector(':scope > label')) return;
		const label = document.createElement('label');
		const input = document.createElement('input');
		input.type = 'checkbox';
		input.setAttribute('data-sr', '');
		const span = document.createElement('span');
		while (this.firstChild) span.appendChild(this.firstChild);
		label.append(input, span);
		this.appendChild(label);
	}

	unwrap() {
		const wrapper = this.querySelector(':scope > label, :scope > span');
		if (!wrapper) return;
		wrapper.querySelectorAll(':scope > input, :scope > i').forEach(el => el.remove());
		const inner = wrapper.querySelector(':scope > span') || wrapper;
		while (inner.firstChild) this.appendChild(inner.firstChild);
		wrapper.remove();
	}
}

customElements.define('ui-beacon', UiBeacon);
export { UiBeacon };
