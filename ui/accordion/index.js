/**
 * <ui-accordion> and <ui-accordion-item>
 * Light DOM web component wrappers for the CSS-first accordion.
 * Renders native <details>/<summary> elements — no Shadow DOM.
 * @version 5.0.0
 */

class UiAccordionItem extends HTMLElement {
	static observedAttributes = ['label', 'open', 'icon'];

	connectedCallback() {
		if (!this.querySelector('details')) this.render();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue || !this.isConnected) return;
		const details = this.querySelector(':scope > details');
		if (!details) return;

		if (name === 'open') {
			details.open = this.hasAttribute('open');
		} else if (name === 'label') {
			const span = details.querySelector('summary > span');
			if (span) span.textContent = newValue || '';
		} else if (name === 'icon') {
			const icon = details.querySelector('summary > ui-icon');
			if (icon) icon.setAttribute('type', newValue || 'plus-minus');
		}
	}

	render() {
		const label = this.getAttribute('label') || '';
		const icon = this.getAttribute('icon') || 'plus-minus';
		const isOpen = this.hasAttribute('open');

		const details = document.createElement('details');
		details.className = 'ui-accordion';
		if (isOpen) details.open = true;

		const summary = document.createElement('summary');
		const span = document.createElement('span');
		span.textContent = label;
		const iconEl = document.createElement('ui-icon');
		iconEl.setAttribute('type', icon);
		summary.appendChild(span);
		summary.appendChild(iconEl);

		const content = document.createElement('div');
		while (this.firstChild) {
			content.appendChild(this.firstChild);
		}

		details.appendChild(summary);
		details.appendChild(content);
		this.appendChild(details);
	}
}

class UiAccordion extends HTMLElement {
	static observedAttributes = ['name', 'variant', 'type'];

	connectedCallback() {
		this.ensureCqBox();
		this.propagateName();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue || !this.isConnected) return;
		if (name === 'variant') this.ensureCqBox();
		if (name === 'name') this.propagateName();
	}

	ensureCqBox() {
		const hasSplitView = (this.getAttribute('variant') || '').split(/\s+/).includes('split-view');
		const existing = this.querySelector(':scope > cq-box');
		if (hasSplitView && !existing) {
			const box = document.createElement('cq-box');
			while (this.firstChild) box.appendChild(this.firstChild);
			this.appendChild(box);
		}
	}

	propagateName() {
		const name = this.getAttribute('name');
		if (!name) return;
		const container = this.querySelector(':scope > cq-box') || this;
		for (const child of container.children) {
			if (child.matches('details.ui-accordion')) {
				child.setAttribute('name', name);
			} else if (child.matches('ui-accordion-item')) {
				const details = child.querySelector(':scope > details.ui-accordion');
				if (details) details.setAttribute('name', name);
			}
		}
	}
}

customElements.define('ui-accordion-item', UiAccordionItem);
customElements.define('ui-accordion', UiAccordion);

export { UiAccordion, UiAccordionItem };
