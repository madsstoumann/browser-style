/**
 * <ui-table>
 * Light DOM web component wrapper for the CSS-first table.
 * Forwards these attributes to the child <table> as data-attributes:
 *   variant, hover, size
 *   tint, tint-end, tint-tr, tint-bl   (graduated-tint family)
 *   c1 … c8                            (per-column alignment / tabular)
 * Forwards to self as data-*:
 *   variant (also)                     (wrapper uses data-variant~="rounded")
 *   sticky                             (data-sticky activates sticky-column rules)
 *
 * When `frame` is set (framed scroll-container mode), toggles an `overflowing`
 * attribute based on wrapper width (Safari ≤ 18 fallback for scroll-driven
 * overflow detection) and outputs cumulative widths for sticky columns as
 * CSS custom properties (e.g. style="--c0: 0px; --c2: 36px;").
 * No Shadow DOM.
 * @version 4.3.0
 */

const FORWARD_TO_TABLE = [
	'variant', 'hover', 'size',
	'tint', 'tint-end', 'tint-tr', 'tint-bl',
	'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8',
];
const FORWARD_TO_SELF = ['variant', 'sticky'];

class UiTable extends HTMLElement {
	static observedAttributes = [
		...new Set([...FORWARD_TO_TABLE, ...FORWARD_TO_SELF]),
	];

	connectedCallback() {
		this.propagateAttributes();
		if (this.hasAttribute('frame')) {
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

		for (const attr of FORWARD_TO_TABLE) {
			const value = this.getAttribute(attr);
			if (value !== null) table.setAttribute(`data-${attr}`, value);
		}

		for (const attr of FORWARD_TO_SELF) {
			const value = this.getAttribute(attr);
			if (value !== null) this.setAttribute(`data-${attr}`, value);
		}
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
