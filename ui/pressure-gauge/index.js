const styles = new CSSStyleSheet();
styles.replaceSync(`
	:host {
		--analog-gauge-bg: #009, #69f, #ff0, #f90, #f00 60%, #009;
		--analog-gauge-mask-angle: conic-gradient(from 145deg,
				#0000 0deg, 
				#0000 90deg,
				#FFF 190deg,
				#FFF 240deg,
				#0000 340deg
			);
		--analog-gauge-mask-circle: radial-gradient(circle at 50% 50%, #0000 55%, #000 0);
		--analog-gauge-needle-bg: hsl(210deg 15% 60% / 75%);
		--analog-gauge-needle-h: 10cqi;

		--_w: calc(100cqi/3*2);
		--_m: calc(100cqi/6);

		aspect-ratio: 1;
		container-type: inline-size;
		font-family: var(--analog-clock-ff, ui-sans-serif, system-ui, sans-serif);
		display: grid;
		grid-template: repeat(3, 1fr) / repeat(3, 1fr);
		inline-size: 100%;
	}

	:host::part(gauge) {
		background: conic-gradient(from 230deg, var(--analog-gauge-bg));
		border-radius: 50%;
		grid-area: 1 / 1 / 4 / 4;
		mask: 
			var(--analog-gauge-mask-circle),
			var(--analog-gauge-mask-angle);
		mask-composite: intersect;
	}

	:host::part(indices) {
		all: unset;
		border-radius: 50%;
		grid-area: 1 / 1 / 4 / 4;
	}
	:host::part(indice) {
		background: var(--analog-gauge-indice-bg, #FFF5);
		border-radius: var(--analog-gauge-indice-bdrs, .5cqi);
		display: inline-block;
		height: var(--analog-gauge-indice-h, 7.5cqi);
		offset-anchor: top;
		offset-distance: var(--_p, 0%);
		offset-path: content-box;
		width: var(--analog-gauge-indice-w, .5cqi);
	}

	:host::part(label) {
		font-size: var(--analog-gauge-label-fs, 7.5cqi);
		font-weight: var(--analog-gauge-label-fw, 200);
		grid-area: 3 / 2 / 4 / 3;
		place-self: center center;
		text-box: ex alphabetic;
	}

	:host::part(label-min),
	:host::part(label-max) {
		font-size: var(--analog-gauge-label-fs, 5cqi);
		font-weight: var(--analog-gauge-label-fw, 400);
		place-self: center;
	}
	:host::part(label-min) { grid-area: 3 / 1 / 4 / 2;}
	:host::part(label-max) { grid-area: 3 / 3 / 4 / 4; }

	:host::part(needle) {
		align-self: center;
		background: var(--analog-gauge-needle-bg);
		clip-path: polygon(0.00% 50.00%,78.00% 0.00%,83.00% 35.00%,83.00% 65.00%,78.00% 100.00%);
		grid-area: 2 / 1 / 3 / 3;
		height: var(--analog-gauge-needle-h);
		mask: radial-gradient(circle at calc(100% - var(--_m)) 50%, #0000 0 2.5cqi, #FFF 2.5cqi);
		rotate: var(--_d, 0deg);
		transform-origin: calc(100% - var(--_m)) 50%;
		width: var(--_w);
	}

	:host::part(value) {
		font-size: var(--analog-gauge-value-fs, 15cqi);
		font-weight: var(--analog-gauge-value-fw, 200);
		grid-area: 3 / 2 / 4 / 3;
		place-self: start center;
		text-box: ex alphabetic;
	}
`);
/* linear-gradient(to bottom, #000 80%, #0000 0 100%) */
export default class AnalogGauge extends HTMLElement {
	#min; #max; #value; #root;
	constructor() {
		super();
		this.#root = this.attachShadow({ mode: 'open' });
		this.#root.adoptedStyleSheets = [styles];
		
		this.#min = parseInt(this.getAttribute('min') || 0);
		this.#max = parseInt(this.getAttribute('max') || 100);
		this.#value = parseFloat(this.getAttribute('value') || 0);
		
		// Calculate the degree based on value, where min = -35deg and max = 215deg
		const minDegree = -35;
		const maxDegree = 215;
		const totalRange = maxDegree - minDegree;
		const normalizedValue = Math.max(this.#min, Math.min(this.#max, this.#value)); // Clamp value between min and max
		const degree = minDegree + ((normalizedValue - this.#min) * totalRange) / (this.#max - this.#min);
		this.style.setProperty('--_d', `${degree}deg`);
		
		this.#root.innerHTML = `
			<div part="gauge"></div>
			<ul part="indices">${this.#generateIndices()}</ul>
			<div part="needle"></div>
			<div part="value">${this.getAttribute('value')||0}</div>
			<div part="label">${this.getAttribute('label')||''}</div>
			<div part="label-min">${this.getAttribute('min-label')||this.#min}</div>
			<div part="label-max">${this.getAttribute('max-label')||this.#max}</div>`;
	}

	#generateIndices() {
		const count = parseInt(this.getAttribute('indices'));
		const step = 100 / count;
		return Array.from({ length: count }, (_, i) => {
			const position = i * step;
			if (position >= 35 && position <= 65) {
				return '';
			}
			return `<li style="--_p:${position}%" part="indice"></li>`;
		})
		.filter(Boolean)
		.join('');
	}
}

customElements.define('analog-gauge', AnalogGauge);