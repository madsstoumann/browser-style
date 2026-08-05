/**
 * <ui-quote>
 * Registration only — this class adds NO behaviour, and the component works
 * without it. It exists so `import '@browser.style/quote'` resolves.
 * <ui-blockquote> is a deprecated alias (package renamed in v5).
 * @version 5.0.0
 */

class UiQuote extends HTMLElement {}
customElements.define('ui-quote', UiQuote);

class UiBlockquote extends HTMLElement {}
customElements.define('ui-blockquote', UiBlockquote);

export { UiQuote, UiBlockquote };
