/**
 * <ui-breadcrumbs> and <ui-breadcrumbs-item>
 * Light DOM web component wrappers for the CSS-first breadcrumbs.
 * Renders native <ol>/<li>/<a> elements — no Shadow DOM.
 * Emits schema.org BreadcrumbList microdata. Docs: readme.md § Structured data
 * @version 4.1.0
 */

const SCHEMA = 'https://schema.org/';

class UiBreadcrumbsItem extends HTMLElement {
	connectedCallback() {
		this.render();
	}

	render() {
		/* Count ALL preceding element siblings, not just un-upgraded ones: items
		   replaceWith(<li>) one at a time, so the list is mixed while this runs. */
		let position = 1;
		for (let prev = this.previousElementSibling; prev; prev = prev.previousElementSibling) position++;

		/* The LIST scope is opened here, by its first item — never by the host. A host that
		   stamped it unconditionally would publish an empty BreadcrumbList around plain <li>
		   children, and could not see its children at all when it upgrades mid-parse. */
		const parent = this.parentElement;
		if (parent && !parent.hasAttribute('itemscope')) {
			parent.setAttribute('itemscope', '');
			parent.setAttribute('itemtype', `${SCHEMA}BreadcrumbList`);
		}

		const li = document.createElement('li');
		li.setAttribute('itemprop', 'itemListElement');
		li.setAttribute('itemscope', '');
		li.setAttribute('itemtype', `${SCHEMA}ListItem`);

		const name = document.createElement('span');
		name.setAttribute('itemprop', 'name');
		while (this.firstChild) name.appendChild(this.firstChild);

		const href = this.getAttribute('href');
		if (href) {
			const a = document.createElement('a');
			a.href = href;
			a.setAttribute('itemprop', 'item');
			a.appendChild(name);
			li.appendChild(a);
		} else {
			/* the current page — the last crumb needs no `item` */
			li.appendChild(name);
		}

		const meta = document.createElement('meta');
		meta.setAttribute('itemprop', 'position');
		meta.setAttribute('content', String(position));
		li.appendChild(meta);

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
		/* the BreadcrumbList scope is opened by the first <ui-breadcrumbs-item>, not here */
	}
}

customElements.define('ui-breadcrumbs-item', UiBreadcrumbsItem);
customElements.define('ui-breadcrumbs', UiBreadcrumbs);
export { UiBreadcrumbs, UiBreadcrumbsItem };
