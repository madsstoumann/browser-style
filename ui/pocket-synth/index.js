import xyController from '../xy/index.js';
/**
 * Pocket Synth
 * @version 1.0.00
 * @summary 24-04-2024
 * @author Mads Stoumann
 * @description Pocket Synth
 */
class pocketSynth extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {
		const shadow = this.attachShadow({ mode: 'open' })
		shadow.adoptedStyleSheets = [stylesheet];
		const template = `
			<x-y part="xy" x="50" y="50"></x-y>
			<fieldset>
			<label>
				<input type="range" min="0" max="100" step="1" value="75" part="volume">
			</label>
			</fieldset>`;
		shadow.innerHTML = template;
		this.volume = shadow.querySelector('input');
		this.volume.addEventListener('input', (event) => {
			console.log(event.valueAsNumber)
			
		});
		this.xy = shadow.querySelector('x-y');
		this.xy.addEventListener('xymove', (e) => {
			//console.log(e.detail);
		});
		this.tabIndex = 0;
	}
}

/* === STYLES === */
const stylesheet = new CSSStyleSheet()
stylesheet.replaceSync(`
	:host {
		//--ui-xy-bg: #0000;
		--ui-xy-point-bdw: 2px;
		--ui-xy-point-bg: #0000;
		--ui-xy-point-sz: 24px;
		display: inline-block;
		width: var(--ui-pocket-synth-w, 250px);
	}

`)
customElements.define('ui-pocket-synth', pocketSynth);