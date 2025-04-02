const styles = new CSSStyleSheet();
styles.replaceSync(`

	:host {
		aspect-ratio: 1;
		background: hotpink;
		container-type: inline-size;
		font-family: var(--analog-clock-ff, ui-sans-serif, system-ui, sans-serif);
		display: grid;
		grid-template: repeat(3, 1fr) / repeat(3, 1fr);
		inline-size: 100%;
	}

	:host::part(gauge) {
	
		background: 
				conic-gradient(from 230deg,navy, cornflowerblue, yellow, orange, red 66%);

		border-radius: 50%;
		grid-area: 1 / 1 / 4 / 4;
		mask: 
			linear-gradient(to bottom, #000 80%, #0000 0 100%);
		
	


		position: relative;
	}
		:host::part(label-low) {
			grid-area: 3 / 1 / 4 / 2;
			place-self: center;
		}
	:host::part(label-high) {
			grid-area: 3 / 3 / 4 / 4;
			place-self: center;
		}

`);

export default class PressureGauge extends HTMLElement {
	#root;
	
	constructor() {
		super();
		this.#root = this.attachShadow({ mode: 'open' });
		this.#root.adoptedStyleSheets = [styles];
		this.#root.innerHTML = `
			<div part="gauge"></div>
			<div part="label-low">Low</div>
			<div part="label-high">High</div>
				`;

	}

 
}

customElements.define('pressure-gauge', PressureGauge);