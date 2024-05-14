/**
 * uiNumber
 * @version 1.0.01
 * @summary 03-05-2024
 * @author Mads Stoumann
 * @description Animate a number from `start` to `end` with a given `duration` in milliseconds. `iteration` can be set to -1 (infinite) or a positive number.
 */
class uiNumber extends HTMLElement {
	constructor() {
		super();
		if (!uiNumber.adopted) {
			/* These styles are added once */
			const adopted = new CSSStyleSheet();
			adopted.replaceSync(`
				@property --num { syntax: '<integer>'; initial-value: 0; inherits: false; }
				ui-number::part(number) { counter-reset: N var(--num); }
				ui-number::part(number)::before { content: counter(N); }
			`);
			document.adoptedStyleSheets = [...document.adoptedStyleSheets, adopted];
			uiNumber.adopted = true;
		}

		const start = parseInt(this.getAttribute('start')) || 0;
		const end = parseInt(this.getAttribute('end')) || 10;
		const iteration = parseInt(this.getAttribute('iteration')) || 1;
		const suffix = this.getAttribute('suffix');
		const styles = [
			`--num: ${start}`,
			`--end: ${end}`,
			`--duration: ${parseInt(this.getAttribute('duration')) || 2000}ms`,
			`--iteration: ${iteration === -1 ? 'infinite' : iteration}`,
			`--timing: steps(${Math.abs(end - start)})`
		]

		/*
		These styles are added for each instance. 
		If `animation` is moved to `adopted`, it doesn't work in Safari. 
		If `--num` is set to `var(--end, 10)` in the keyframes, it doesn't work in Firefox.
		*/
		const stylesheet = new CSSStyleSheet();
		stylesheet.replaceSync(`
			:host::part(number) {
				animation: N var(--duration, 2s) var(--timing, linear) forwards var(--iteration, 1) var(--playstate, running);
			}
			@keyframes N { to { --num: ${end}; } }
		`);
		this.attachShadow({ mode: 'open' }).innerHTML = `
		<span part="number" style="${styles.join(';')}">${suffix ? `<span part="suffix">${suffix}</span>`:''}</span>`;
		this.shadowRoot.adoptedStyleSheets = [stylesheet];
	}
}
uiNumber.adopted = false
customElements.define('ui-number', uiNumber);