/**
 * uiNumber
 * @version 1.0.00
 * @summary 02-05-2024
 * @author Mads Stoumann
 * @description Animate a number from `start` to `end` with a given `duration` in milliseconds. `iteration` can be set to -1 (infinite) or a positive number.
 */
class uiNumber extends HTMLElement {
	constructor() {
		super();
		const start = parseInt(this.getAttribute('start')) || 0;
		const end = parseInt(this.getAttribute('end')) || 10;
		const duration = parseInt(this.getAttribute('duration')) || 5000;
		const iteration = parseInt(this.getAttribute('iteration')) === -1 ? 'infinite' : parseInt(this.getAttribute('iteration')) || 1;
		this.attachShadow({ mode: 'open' }).innerHTML = `<span part="number" style="--start:${start};--end:${end};--duration:${duration}ms;--iteration:${iteration}"><span part="suffix">${this.getAttribute('suffix')||''}</span></span>`;
		this.shadowRoot.adoptedStyleSheets = [stylesheet];
		try {
			CSS.registerProperty({
				name: '--start', 
				syntax: '<integer>', 
				initialValue: 0, 
				inherits: false
			});
		} catch(e) {}
	}
}
/* === STYLES === */
const stylesheet = new CSSStyleSheet()
stylesheet.replaceSync(`
	:host::part(number) {
		animation: N var(--duration, 5s) var(--timing, linear) var(--fillmode, forwards) var(--iteration, 1) var(--playstate, running);
		counter-reset: N var(--start, 0);
	}
	:host::part(number)::before {
		content: counter(N);
	}
	@keyframes N {
		100% { --start: var(--end, 10); }
	}
`)
customElements.define('ui-number', uiNumber);