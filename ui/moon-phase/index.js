const styles = new CSSStyleSheet();
styles.replaceSync(`
	:host {
		--moon-phase-blur: 0px;

		--_lat: attr(lat type(<number>), 0);
		--_hour: attr(hour type(<number>), 12);
		--_w: calc(100% - 1% * attr(illumination type(<number>), 0%));

		--_l: calc(var(--_lat) * 1.5deg);
		--_a: calc(((var(--_hour) - 12) * 15 * 0.7) * 1deg);
		--_r: calc(var(--_l) + var(--_a));

		aspect-ratio: 1;
		border-radius: 50%;
		display: block;
		overflow: clip;
		position: relative;
		rotate: var(--_r, 0deg);
	}
	:host::before {
		background: var(--moon-phase-bgi, url('https://browser.style/ui/moon-phase/moon.png')) center / cover no-repeat;  
		content: '';
		filter: var(--moon-phase-filter, sepia(1) grayscale(.25));
		inset: 0;
		position: absolute;
	}
	:host::after {
		background-color: var(--moon-phase-mask-bg, #000);
		border-radius: var(--_btlr, 0) var(--_btrr, 0) var(--_bbrr, 0) var(--_bblr, 0);
		content: '';
		filter: var(--moon-phase-mask-filter, blur(var(--moon-phase-blur, 0px)));
		height: 100%;
		inset-inline: var(--_ii, auto 0);
		opacity: var(--moon-phase-mask-opacity, .85);
		position: absolute;
		width: var(--_w);
	}
	:host([phase*="first quarter"]),
	:host([phase*="waxing"]) {
		--_ii: 0 auto;
	}
	:host([phase*="crescent"]),
	:host([phase*="first quarter"]),
	:host([phase*="waxing"]) {
		--_bblr: 100%;
		--_btlr: 100%;
	}
	:host([phase*="crescent"]),
	:host([phase*="last quarter"]),
	:host([phase*="waning"]) {
		--_btrr: 100%;
		--_bbrr: 100%;
	}
	:host([phase*="gibbous"])::after {
		border-radius: 0;
		width: 100%;
	}
	:host([phase="waxing gibbous"])::after {
		mask: radial-gradient(circle at 100% 50%,
			#0000 calc(100% - var(--_w)),
			#000 calc(100% - var(--_w) + 1px + (2 * var(--moon-phase-blur, 0))) 100%);
	}
	:host([phase="waning gibbous"])::after {
		mask: radial-gradient(circle at 0% 50%,
			#0000 calc(100% - var(--_w)),
			#000 calc(100% - var(--_w) + 1px + (2 * var(--moon-phase-blur, 0))) 100%);
	}
`);

export default class MoonPhase extends HTMLElement {
	#root;
	constructor() {
		super();
		this.#root = this.attachShadow({ mode: 'open' });
		this.#root.adoptedStyleSheets = [styles];
		this.style.setProperty('--moon-phase-bgi', `url('${this.getAttribute('moon') || this.basePath + 'moon.png'}')`);

		/* Safari doesn't support attr() with types, so for now we just set these with JS: */
		if (this.hasAttribute('hour')) this.style.setProperty('--_hour', this.getAttribute('hour'));
		if (this.hasAttribute('lat')) this.style.setProperty('--_lat', this.getAttribute('lat'));
		if (this.hasAttribute('mask-color')) this.style.setProperty('--moon-phase-mask-bg', this.getAttribute('mask-color'));
		this.style.setProperty('--_w', `${100 - parseInt(this.getAttribute('illumination'))}%`);
	}

	get basePath() { return new URL('.', import.meta.url).href; }
}

customElements.define('moon-phase', MoonPhase);
