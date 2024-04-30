import xyController from '../xy/index.js';
/**
 * ColorPicker
 * @version 1.0.00
 * @summary 25-04-2024
 * @author Mads Stoumann
 * @description Color Picker
 */
class colorPicker extends HTMLElement {
	static observedAttributes = ['value'];
	constructor() {
		super();
		this.attachShadow({ mode: 'open' }).innerHTML = `
		<ui-xy x="100" part="xy"></ui-xy>
		<input type="range" max="360" value="0" part="hue">
		<input type="range" max="1" step="0.01" value="1" part="alpha">
		<button type="button" part="output"></div>`;
		this.shadowRoot.adoptedStyleSheets = [stylesheet];
		this.color = {
			hsla: { },
			hsva: { h: 0, s: 0, v: 0, a: 1 },
			rgba: { },
			hex: ''
		};
		this.alpha = this.shadowRoot.querySelector('[part=alpha]');
		this.hue = this.shadowRoot.querySelector('[part=hue]');
		this.output = this.shadowRoot.querySelector('[part=output]');
		this.xy = this.shadowRoot.querySelector('[part=xy]');
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (name === 'value') {
			const { r, g, b } = this.hexToRgb(newValue);
			const { h, s, v } = this.rgbToHsv(r, g, b);
			this.color.hsva = { h, s, v, a: 1 };
			this.alpha.value = 1;
			this.hue.value = h;
			this.xy.setAttribute('x', s * 100);
			this.xy.setAttribute('y', v * 100);
		}
	}

	connectedCallback() {
		this.alpha.addEventListener('input', (e) => {
			this.updateColor('a', e.target.valueAsNumber);
		});
		this.hue.addEventListener('input', (e) => {
			this.updateColor('h', e.target.valueAsNumber);
		});
		this.xy.addEventListener('xymove', (e) => {
			this.updateColor('s', e.detail.x / 100);
			this.updateColor('v', e.detail.y / 100);
		});
		this.output.addEventListener('click', (e) => {
			navigator.clipboard.writeText(this.color.hex);
		});
	}

	hexToRgb(hex) {
		hex = hex.replace(/^#/, '');
		let r = parseInt(hex.substring(0, 2), 16);
		let g = parseInt(hex.substring(2, 4), 16);
		let b = parseInt(hex.substring(4, 6), 16);
		return { r, g, b };
	}

	 hsvaToHsla(h, s, v, a) {
		let l = v * (1 - s / 2);
		let minL = Math.min(l, 1 - l);
		let hslSaturation = (minL === 0) ? 0 : (v - l) / minL;
		return { h, s: Math.round(hslSaturation * 100), l: Math.round(l * 100), a };
	}

	 rgbaToHex(r, g, b, a) {
		const rgbHex = [r, g, b].map(x => {
			const hex = Math.round(x).toString(16);
			return hex.length === 1 ? '0' + hex : hex;
		}).join('');
		const alphaHex = (typeof a !== 'undefined' && a !== 1) ? Math.round(a * 255).toString(16).padStart(2, '0') : '';
		return '#' + rgbHex + alphaHex;
	}

	rgbToHsv(r, g, b) {
		r /= 255;
		g /= 255;
		b /= 255;
		let max = Math.max(r, g, b), min = Math.min(r, g, b);
		let h, s, v = max;
		let d = max - min;
		s = max === 0 ? 0 : d / max;
		if (max === min) {
			h = 0;
		} else {
				switch (max) {
					case r: h = (g - b) / d + (g < b ? 6 : 0); break;
					case g: h = (b - r) / d + 2; break;
					case b: h = (r - g) / d + 4; break;
				}
			h /= 6;
		}
		return { h: Math.round(h * 360), s, v };
	}

	updateColor(prop, value) {
		this.color.hsva[prop] = value;
		this.color.hsla = this.hsvaToHsla(...Object.values(this.color.hsva));
		const { h, s, l, a } = this.color.hsla;
		
		this.output.style.backgroundColor = `hsla(${h}, ${s}%, ${l}%, ${a})`;
		this.style.setProperty(`--_h`, h);
		this.alpha.style.removeProperty('--_h'); /*FIX ME*/

		const [r, g, b] = window.getComputedStyle(this.output).backgroundColor.match(/\d+/g);		
		this.color.rgba = { r, g, b, a: this.color.hsva.a };
		this.color.hex = this.rgbaToHex(r, g, b, a);
		this.dispatchEvent(new CustomEvent('change', { detail: this.color }));
	}
}

/* === STYLES === */
const stylesheet = new CSSStyleSheet()
stylesheet.replaceSync(`
	:host {
		--ui-color-picker-bdrs: .75em;
		--ui-color-picker-bdw: 2px;
		--ui-xy-bg: #0000;
		--ui-xy-point-bdc: #FFF;
		--ui-xy-point-bdw: 2px;
		--ui-xy-point-bg: #0000;
		--ui-xy-point-sz: 24px;
		--ui-xy-point--focus: #0000;
		--_bdrs: calc(var(--ui-color-picker-bdrs) - var(--ui-color-picker-bdw));
		border: 2px solid #0002;
		border-radius: var(--ui-color-picker-bdrs);
		display: grid;
		max-width: var(--ui-color-picker-w, 250px);
	}
	:host::part(alpha) {
		background:
			linear-gradient(90deg, #0000, hsl(var(--_h, 0), 100%, 50%)) 0 0/100% 100%,
			repeating-conic-gradient(from 90deg,#FFF 0 25%, #0000 0, #0003 0 50%) 0 0/10px 10px;
	}
	:host::part(hue) {
		background-image: linear-gradient(90deg, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);
	}
	input[type=range] {
		-webkit-appearance: none;
		border-radius: 0;
		margin: 0;
		width: 100%;
	}
	input::-webkit-slider-thumb {
		-webkit-appearance: none;
		background: #0000;
		border: 2px solid #FFF;
		border-radius: 50%;
		height: 1.25em;
		width: 1.25em;
	}
	:host::part(output) {	
		aspect-ratio: 3 /1;
		border: 0;
		border-radius: 0 0 var(--_bdrs) var(--_bdrs);
	}
	:host::part(xy) {
		aspect-ratio: 1.5 / 1;
		background-color: hsl(var(--_h, 0), 100%, 50%);
		background-image: linear-gradient(rgba(0, 0, 0, 0) 0%, rgb(0, 0, 0) 100%), linear-gradient(to right, rgb(255, 255, 255) 0%, rgba(255, 255, 255, 0) 100%);
		border-radius: var(--_bdrs) var(--_bdrs) 0 0;
		cursor: move;
	}
`)
customElements.define('ui-color-picker', colorPicker);