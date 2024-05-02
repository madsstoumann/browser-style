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
		const iteration = parseInt(this.getAttribute('iteration')) || 1;
		const steps = Math.abs(end - start);
		const suffix = this.getAttribute('suffix');

		const adopted = new CSSStyleSheet();
		adopted.replaceSync(`@property --num { syntax: '<integer>'; initial-value: 0; inherits: false; }`);
		document.adoptedStyleSheets = [...document.adoptedStyleSheets, adopted];

		const stylesheet = new CSSStyleSheet();
		stylesheet.replaceSync(`
			:host::part(number) {
				--num: ${start};
				animation: N ${duration}ms steps(${steps}) forwards ${iteration === -1 ? 'inifinite' : iteration} var(--playstate, running);
				counter-reset: N var(--num);
			}
			:host::part(number)::before { content: counter(N); }
			@keyframes N { to { --num: ${end}; } }
		`);
		this.attachShadow({ mode: 'open' }).innerHTML = `
		<span part="number">${suffix ? `<span part="suffix">${suffix}</span>`:''}</span>`;
		this.shadowRoot.adoptedStyleSheets = [stylesheet];
	}
}
customElements.define('ui-number', uiNumber);