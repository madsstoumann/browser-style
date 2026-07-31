/**
 * <ui-save>
 * Light DOM web component wrapper for the CSS-first save/favorite toggle.
 * Wraps an invoker <button command="--save" commandfor="<card id>">; saved state
 * is the button's aria-pressed, styled by CSS. No Shadow DOM.
 *
 * Registration only — this class adds NO behaviour, and the component works
 * without it. It exists so `import '@browser.style/save'` resolves.
 * @version 4.0.1
 */

class UiSave extends HTMLElement {}

customElements.define('ui-save', UiSave);
export { UiSave };
