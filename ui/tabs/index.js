/**
 * <ui-tabs> and <ui-tab>
 * Light DOM web component wrappers for the CSS-first tabs.
 * Renders native <details>/<summary> elements — no Shadow DOM.
 * @version 1.0.0
 */

class UiTab extends HTMLElement {
	connectedCallback() {
		this.render();
	}

	render() {
		const label = this.getAttribute('label') || '';
		const isOpen = this.hasAttribute('open');

		const details = document.createElement('details');
		if (isOpen) details.open = true;

		const summary = document.createElement('summary');
		summary.textContent = label;

		const content = document.createElement('div');
		while (this.firstChild) {
			content.appendChild(this.firstChild);
		}

		details.appendChild(summary);
		details.appendChild(content);
		this.replaceWith(details);
	}
}

class UiTabs extends HTMLElement {
	static observedAttributes = ['name'];

	connectedCallback() {
		this.ensureCqBox();
		this.propagateName();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue || !this.isConnected) return;
		if (name === 'name') this.propagateName();
	}

	ensureCqBox() {
		if (this.querySelector(':scope > cq-box')) return;
		const box = document.createElement('cq-box');
		while (this.firstChild) box.appendChild(this.firstChild);
		this.appendChild(box);
	}

	propagateName() {
		const name = this.getAttribute('name');
		if (!name) return;
		const box = this.querySelector(':scope > cq-box');
		if (!box) return;
		for (const details of box.querySelectorAll(':scope > details')) {
			details.setAttribute('name', name);
		}
	}
}

customElements.define('ui-tab', UiTab);
customElements.define('ui-tabs', UiTabs);

export { UiTabs, UiTab };
