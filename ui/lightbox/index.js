/**
 * <ui-lightbox>
 * Light DOM web component wrapper for the CSS-first "view gallery" furniture.
 * Wraps an invoker <button command="toggle-popover" commandfor="<ui-media id>">
 * that lifts a `<ui-media popover>` frame into the top layer; open state is the
 * frame's :popover-open, styled by CSS. No Shadow DOM.
 *
 * Registration only — this class adds NO behaviour, and the component works
 * without it. It exists so `import '@browser.style/lightbox'` resolves. The
 * optional runtime extras (layout toggle, invoker fallback, [open] reflection,
 * DOM carousel controls, media-open=, modality, …) are frame behaviour and live
 * with the card system: ui/card/lightbox.js (everything there is gated on
 * ui-media[popover], like carousel.js/video.js).
 * @version 1.0.0
 */

class UiLightbox extends HTMLElement {}

customElements.define('ui-lightbox', UiLightbox);
export { UiLightbox };
