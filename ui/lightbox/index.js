/**
 * <ui-lightbox>
 * Light DOM web component wrapper for the CSS-first "view gallery" furniture.
 * Wraps an invoker <button command="toggle-popover" commandfor="<ui-media id>">
 * that lifts a `<ui-media popover>` frame into the top layer; open state is the
 * frame's :popover-open, styled by CSS. No Shadow DOM.
 *
 * Registration only — this class adds NO behaviour, and the component works
 * without it. It exists so `import '@browser.style/lightbox'` resolves. The
 * optional runtime extras (layout toggle, invoker fallback, [open] reflection)
 * live in ./command.js.
 * @version 1.0.0
 */

class UiLightbox extends HTMLElement {}

customElements.define('ui-lightbox', UiLightbox);
export { UiLightbox };
