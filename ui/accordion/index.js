/**
 * <ui-accordion> and <ui-accordion-item>
 * Light DOM web component wrappers for the CSS-first accordion.
 * Renders native <details>/<summary> elements — no Shadow DOM.
 * @version 4.0.0
 */

class UiAccordionItem extends HTMLElement {
	static observedAttributes = ['label', 'open', 'icon'];

	connectedCallback() {
		if (!this.querySelector('details')) this.render();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue || !this.isConnected) return;
		const details = this.querySelector('details');
		if (!details) return;

		if (name === 'open') {
			details.open = this.hasAttribute('open');
		} else if (name === 'label') {
			const summary = details.querySelector('summary');
			if (summary) {
				const icon = summary.querySelector('ui-icon');
				summary.textContent = newValue || '';
				if (icon) summary.appendChild(icon);
			}
		} else if (name === 'icon') {
			const icon = details.querySelector('summary ui-icon');
			if (icon) icon.setAttribute('type', newValue || 'plus-minus');
		}
	}

	render() {
		const label = this.getAttribute('label') || '';
		const icon = this.getAttribute('icon') || 'plus-minus';
		const isOpen = this.hasAttribute('open');
		const parent = this.closest('ui-accordion');
		const name = parent?.getAttribute('name') || '';

		const details = document.createElement('details');
		details.className = 'ui-accordion';
		if (name) details.setAttribute('name', name);
		if (isOpen) details.open = true;

		const summary = document.createElement('summary');
		summary.innerHTML = `${label}<ui-icon type="${icon}"></ui-icon>`;

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
	static observedAttributes = ['name'];

	connectedCallback() {
		this.propagateName();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (name === 'name' && oldValue !== newValue && this.isConnected) {
			this.propagateName();
		}
	}

	propagateName() {
		const name = this.getAttribute('name');
		if (!name) return;
		for (const details of this.querySelectorAll('details.ui-accordion')) {
			details.setAttribute('name', name);
		}
	}
}

customElements.define('ui-accordion-item', UiAccordionItem);
customElements.define('ui-accordion', UiAccordion);

export { UiAccordion, UiAccordionItem };
