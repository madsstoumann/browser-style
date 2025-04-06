const styles = new CSSStyleSheet();
styles.replaceSync(`
  :host {
    aspect-ratio: 1;
    border-radius: 50%;
    display: block;
    overflow: hidden;
    position: relative;
  }
  :host::before {
    background: var(--moon-phase-bgi, url('moon.png')) center / cover no-repeat;  
    content: '';
    filter: var(--moon-phase-filter, sepia(1) grayscale(.25));
    inset: 0;
    position: absolute;
  }
  :host::after {
    background-color: var(--moon-phase-mask-bg, #000C);
    border-radius: var(--_btlr, 0) var(--_btrr, 0) var(--_bbrr, 0) var(--_bblr, 0);
    content: '';
    filter: var(--moon-phase-mask-filter, blur(3px));
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
    this.style.setProperty('--moon-phase-bgi', `url('${this.getAttribute('moon') || this.basePath + 'moon.png'}')`);
    this.style.setProperty('--_w', `${100 - parseInt(this.getAttribute('illumination'))}%`);
    if (this.hasAttribute('mask-color')) this.style.setProperty('--moon-phase-mask-bg', this.getAttribute('mask-color'));
  }
  get basePath() { return new URL('.', import.meta.url).href; }
}

customElements.define('moon-phase', MoonPhase);
