/**
 * <ui-table>
 * Light DOM web component wrapper for the CSS-first table.
 * Forwards variant/hover/sticky attributes to child <table> as data-attributes.
 * When `overflow` is set, toggles an `overflowing` attribute based on wrapper
 * width and outputs cumulative widths for sticky columns as CSS custom
 * properties (e.g. style="--c0: 0px; --c2: 36px;").
 * No Shadow DOM.
 * @version 4.1.0
 */

class UiTable extends HTMLElement {
	static observedAttributes = ['variant', 'hover', 'size', 'sticky'];

	connectedCallback() {
		this.propagateAttributes();
		if (this.hasAttribute('overflow')) {
			this.observer = new ResizeObserver(() => this.update());
			this.observer.observe(this);
			this.update();
		}
	}

	disconnectedCallback() {
		this.observer?.disconnect();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue || !this.isConnected) return;
		this.propagateAttributes();
	}

	propagateAttributes() {
		const table = this.querySelector(':scope > table');
		if (!table) return;

		const variant = this.getAttribute('variant');
		if (variant) {
			table.setAttribute('data-variant', variant);
			this.setAttribute('data-variant', variant);
		}

		const hover = this.getAttribute('hover');
		if (hover) table.setAttribute('data-hover', hover);

		const size = this.getAttribute('size');
		if (size) table.setAttribute('data-size', size);

		const sticky = this.getAttribute('sticky');
		if (sticky) this.setAttribute('data-sticky', sticky);
	}

	update() {
		const overflowing = this.scrollWidth > this.clientWidth;
		this.toggleAttribute('overflowing', overflowing);
		if (overflowing) this.setStickyOffsets();
	}

	setStickyOffsets() {
		const sticky = this.getAttribute('sticky');
		const row = this.querySelector(':scope > table')?.tHead?.rows[0];
		if (!sticky || !row) return;

		let offset = 0;
		for (const match of sticky.matchAll(/c(\d+)/g)) {
			const idx = Number(match[1]);
			const cell = row.cells[idx];
			if (!cell) continue;
			this.style.setProperty(`--c${idx}`, `${offset}px`);
			offset += cell.offsetWidth;
		}
	}
}

customElements.define('ui-table', UiTable);
export { UiTable };
