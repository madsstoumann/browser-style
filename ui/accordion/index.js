/**
 * <ui-accordion> and <ui-accordion-item>
 * Light DOM web component wrappers for the CSS-first accordion.
 * Renders native <details>/<summary> elements — no Shadow DOM.
 * @version 4.1.0
 */

class UiAccordionItem extends HTMLElement {
	connectedCallback() {
		this.render();
	}

	render() {
		const label = this.getAttribute('label') || '';
		const icon = this.getAttribute('icon') || 'plus-minus';
		const isOpen = this.hasAttribute('open');

		const details = document.createElement('details');
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
		this.replaceWith(details);
	}
}

class UiAccordion extends HTMLElement {
	static observedAttributes = ['group'];

	connectedCallback() {
		this.ensureCqBox();
		this.propagateName();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue || !this.isConnected) return;
		if (name === 'group') this.propagateName();
	}

	ensureCqBox() {
		if (this.querySelector(':scope > cq-box')) return;
		const box = document.createElement('cq-box');
		while (this.firstChild) box.appendChild(this.firstChild);
		this.appendChild(box);
	}

	propagateName() {
		const name = this.getAttribute('group');
		if (!name) return;
		const box = this.querySelector(':scope > cq-box');
		if (!box) return;
		for (const details of box.querySelectorAll(':scope > details')) {
			details.setAttribute('name', name);
		}
	}
}

customElements.define('ui-accordion-item', UiAccordionItem);
customElements.define('ui-accordion', UiAccordion);

export { UiAccordion, UiAccordionItem };
