/**
 * <ui-breadcrumbs> and <ui-breadcrumbs-item>
 * Light DOM web component wrappers for the CSS-first breadcrumbs.
 * Renders native <ol>/<li>/<a> elements — no Shadow DOM.
 * @version 4.0.0
 */

class UiBreadcrumbsItem extends HTMLElement {
	connectedCallback() {
		this.render();
	}

	render() {
		const li = document.createElement('li');
		const href = this.getAttribute('href');

		if (href) {
			const a = document.createElement('a');
			a.href = href;
			while (this.firstChild) a.appendChild(this.firstChild);
			li.appendChild(a);
		} else {
			while (this.firstChild) li.appendChild(this.firstChild);
		}

		this.replaceWith(li);
	}
}

class UiBreadcrumbs extends HTMLElement {
	static observedAttributes = ['variant'];

	connectedCallback() {
		if (!this.getAttribute('aria-label')) {
			this.setAttribute('aria-label', 'Breadcrumb');
		}
		if (!this.getAttribute('role')) {
			this.setAttribute('role', 'navigation');
		}
	}
}

customElements.define('ui-breadcrumbs-item', UiBreadcrumbsItem);
customElements.define('ui-breadcrumbs', UiBreadcrumbs);
export { UiBreadcrumbs, UiBreadcrumbsItem };
