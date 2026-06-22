/**
 * <ui-save>
 * Light DOM web component wrapper for the CSS-first save/favorite toggle.
 * Wraps a single checkbox — state is CSS-only via :checked. No Shadow DOM.
 * @version 4.0.0
 */

class UiSave extends HTMLElement {}

customElements.define('ui-save', UiSave);
export { UiSave };
