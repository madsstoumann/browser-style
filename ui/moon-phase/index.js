const styles = new CSSStyleSheet();
styles.replaceSync(`
  :host {
    aspect-ratio: 1;
    background-image: var(--_bgi, url('moon.png'));
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
    border-radius: 50%;
    display: block;
    overflow: hidden;
    position: relative;
  }
  :host::after {
    background-color: var(--_bgc, attr(mask-color type(<color>), #000C));
    border-bottom-left-radius: var(--_bblr, 0);
    border-bottom-right-radius: var(--_bbrr, 0);
    border-top-left-radius: var(--_btlr, 0);
    border-top-right-radius: var(--_btrr, 0);
    content: '';
    filter: blur(3px);
    height: 100%;
    inset-inline: var(--_ii, 0 auto);
    position: absolute;
    width: var(--_w, calc(100% - attr(illumination type(<percentage>), 0%)));
  }
	:host([phase*="first-quarter"]),
	:host([phase*="waxing"]) {
		--_ii: auto 0;
	}
	:host([phase*="crescent"]),
	:host([phase*="first-quarter"]),
	:host([phase*="waxing"]) {
		--_bblr: 100%;
		--_btlr: 100%;
	}
	:host([phase*="crescent"]),
	:host([phase*="last-quarter"]),
	:host([phase*="waning"]) {
		--_btrr: 100%;
		--_bbrr: 100%;
	}
`);

export default class MoonPhase extends HTMLElement {
  #root;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: 'open' });
    this.#root.adoptedStyleSheets = [styles];
    this.style.setProperty('--_bgi', `url('${this.getAttribute('moon') || this.basePath + 'moon.png'}')`);
  }
  get basePath() { return new URL('.', import.meta.url).href; }
}

customElements.define('moon-phase', MoonPhase);
