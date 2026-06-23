/**
 * <ui-sticker>
 * Light DOM web component wrapper for the CSS-first sticker.
 * Renders as an inline element — no Shadow DOM.
 *
 * Sizing model is pure CSS: a raw text line uses a fixed em font-size, while any
 * element line (<span>, <b>, <small>, …) sizes in `cqi` and scales with the box.
 * No JS wrapping needed — the element-vs-text choice is the author's opt-in.
 * @version 4.0.0
 */

class UiSticker extends HTMLElement {}

customElements.define('ui-sticker', UiSticker);
export { UiSticker };
