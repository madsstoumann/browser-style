/**
 * <ui-table>
 * Light DOM web component wrapper for the CSS-first table.
 *
 * JS behaviour gates on two attributes (both opt-in):
 *
 *   • `mount` — activates attribute forwarding only. Use when you want the
 *     framework-binding ergonomics on a visually plain scroll container.
 *       Forwarded to the child <table> as data-*:
 *         variant, hover, size,
 *         tint, tint-end, tint-tr, tint-bl (graduated-tint family),
 *         c1 … c8 (per-column alignment / tabular).
 *       Forwarded to self as data-*:
 *         variant (mirror — wrapper uses data-variant~="rounded").
 *       `sticky` stays a plain attribute on <ui-table>; CSS reads it directly
 *       via [sticky~="cN"].
 *
 *   • `frame` — framed scroll-container mode. Implies `mount`, and additionally
 *     runs a `ResizeObserver` that toggles the `overflowing` attribute (Safari
 *     ≤ 18 fallback for scroll-driven overflow detection) and walks `sticky` to
 *     compute cumulative column widths as CSS custom properties
 *     (e.g. style="--c0: 0px; --c2: 36px;").
 *
 * Bare <ui-table> (neither attribute present) is inert — a CSS-only scroll
 * container, no JS behaviour even when this module is imported.
 *
 * No Shadow DOM.
 * @version 4.5.0
 */

const FORWARD_TO_TABLE = [
	'variant', 'hover', 'size',
	'tint', 'tint-end', 'tint-tr', 'tint-bl',
	'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8',
];
const FORWARD_TO_SELF = ['variant'];

class UiTable extends HTMLElement {
	static observedAttributes = [
		...new Set([...FORWARD_TO_TABLE, ...FORWARD_TO_SELF]),
	];

	get #active() {
		return this.hasAttribute('frame') || this.hasAttribute('mount');
	}

	connectedCallback() {
		if (!this.#active) return;
		console.log('ui-table mount', this);
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
		if (!this.#active) return;
		this.propagateAttributes(true);
	}

	/**
	 * @param {boolean} overwrite
	 *   false (initial mount): respect any existing `data-*` on the child <table> —
	 *   author's direct markup wins. true (reactive update): the author changed the
	 *   attribute on <ui-table>, so forward the new value and overwrite.
	 */
	propagateAttributes(overwrite = false) {
		const table = this.querySelector(':scope > table');
		if (!table) return;

		for (const attr of FORWARD_TO_TABLE) {
			const value = this.getAttribute(attr);
			if (value === null) continue;
			const dataAttr = `data-${attr}`;
			if (overwrite || !table.hasAttribute(dataAttr)) {
				table.setAttribute(dataAttr, value);
			}
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
		this.setGroupOffset();
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

	setGroupOffset() {
		// Pin offset for sticky <tr data-row="group"> rows — match the actual
		// rendered thead height so groups sit flush under it regardless of
		// density, font, or multi-row headers.
		const thead = this.querySelector(':scope > table')?.tHead;
		if (!thead) return;
		this.style.setProperty('--ui-table-group-offset', `${thead.offsetHeight}px`);
	}
}

customElements.define('ui-table', UiTable);
export { UiTable };
