/**
 * <ui-accordion> and <ui-accordion-item>
 * Light DOM web component wrappers for the CSS-first accordion.
 * Renders native <details>/<summary> elements — no Shadow DOM.
 * @version 4.0.0
 */

class UiAccordionItem extends HTMLElement {
	static observedAttributes = ['label', 'open', 'icon'];

	connectedCallback() {
		this.render();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue !== newValue && this.isConnected) this.render();
	}

	render() {
		const label = this.getAttribute('label') || '';
		const icon = this.getAttribute('icon') || 'plus-minus';
		const isOpen = this.hasAttribute('open');
		const variant = this.getAttribute('variant') || '';
		const name = this.closest('ui-accordion')?.getAttribute('name') || '';

		const details = this.querySelector('details') || document.createElement('details');
		const isNew = !details.parentNode;

		const classes = ['ui-accordion', ...variant.split(/\s+/).filter(Boolean).map(v => `--${v}`)].join(' ');
		details.className = classes;
		if (name) details.setAttribute('name', name);
		if (isOpen) details.open = true;

		if (isNew) {
			const summary = document.createElement('summary');
			const content = document.createElement('div');

			summary.innerHTML = `${label}<ui-icon type="${icon}"></ui-icon>`;

			/* Move slotted content into the content div */
			while (this.firstChild && this.firstChild !== details) {
				content.appendChild(this.firstChild);
			}

			details.appendChild(summary);
			details.appendChild(content);
			this.appendChild(details);
		} else {
			const summary = details.querySelector('summary');
			if (summary) summary.innerHTML = `${label}<ui-icon type="${icon}"></ui-icon>`;
		}
	}
}

class UiAccordion extends HTMLElement {
	static observedAttributes = ['name', 'variant'];

	connectedCallback() {
		this.propagateAttributes();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue !== newValue && this.isConnected) this.propagateAttributes();
	}

	propagateAttributes() {
		const name = this.getAttribute('name');
		const variant = this.getAttribute('variant');

		for (const item of this.querySelectorAll('ui-accordion-item')) {
			if (name && !item.hasAttribute('name')) {
				const details = item.querySelector('details');
				if (details) details.setAttribute('name', name);
			}
			if (variant && !item.hasAttribute('variant')) {
				item.setAttribute('variant', variant);
			}
		}
	}
}

customElements.define('ui-accordion-item', UiAccordionItem);
customElements.define('ui-accordion', UiAccordion);

export { UiAccordion, UiAccordionItem };
