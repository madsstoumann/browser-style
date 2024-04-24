import xyController from '../xy/index.js';
/**
 * ColorPicker
 * @version 1.0.00
 * @summary 24-04-2024
 * @author Mads Stoumann
 * @description Color Picker
 */
class colorPicker extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {
		const shadow = this.attachShadow({ mode: 'open' })
		shadow.adoptedStyleSheets = [stylesheet];
		const template = `
			<figure part="hsl">
				<div part="lightness"></div>
				<div part="saturation"></div>
				<x-y x="100" part="xy"></x-y>
			</figure>
			<label>
				<input type="range" min="0" max="360" step="1" value="0" part="hue">
			</label>
			<div part="output"></div>`;
		shadow.innerHTML = template;
		this.hue = shadow.querySelector('input');
		this.hue.addEventListener('input', () => {
			this.style.setProperty('--_hue', this.hue.value);
		});
		this.xy = shadow.querySelector('x-y');
		this.xy.addEventListener('xymove', (e) => {
			this.style.setProperty('--_sat', `${e.detail.x}%`);
			//this.style.setProperty('--_lgt', `${e.detail.y}%`);
			//console.log(e.detail);
		});
		this.tabIndex = 0;
	}
}

/* === STYLES === */
const stylesheet = new CSSStyleSheet()
stylesheet.replaceSync(`
	:host {
		--ui-xy-bg: #0000;
		--ui-xy-point-bdw: 2px;
		--ui-xy-point-bg: #0000;
		--ui-xy-point-sz: 24px;
		display: inline-block;
		width: var(--ui-color-picker-width, 250px);
	}
	:host::part(hsl) {
		aspect-ratio: 1 / 1;
		background: hsl(var(--_hue, 0), 100%, 50%);
		cursor: move;
		margin: unset;
		position: relative;
	}
	:host::part(lightness) {
		background-image: linear-gradient(to right, hsl(var(--_h, 0), 100%, 100%), #0000);
		inset: 0;
		position: absolute;
	}
	:host::part(saturation) {
		background-image: linear-gradient(to bottom, #0000, hsl(var(--_h, 0), 0%, 0%));
		inset: 0;
		position: absolute;
	}
	:host::part(hue) {
		-webkit-appearance: none;
		background: linear-gradient(to right,
			hsl(0, 100%, 50%), 
			hsl(30, 100%, 50%), 
			hsl(60, 100%, 50%), 
			hsl(90, 100%, 50%), 
			hsl(120, 100%, 50%), 
			hsl(150, 100%, 50%), 
			hsl(180, 100%, 50%), 
			hsl(210, 100%, 50%), 
			hsl(240, 100%, 50%), 
			hsl(270, 100%, 50%), 
			hsl(300, 100%, 50%), 
			hsl(330, 100%, 50%),
			hsl(360, 100%, 50%)
		);
		width: 100%;
	}
	:host::part(output) {	
		aspect-ratio: 2 /1;
		background: hsl(var(--_hue, 0), var(--_sat, 100%), var(--_lgt, 50%));
	}
	:host::part(xy) {
		inset: 0;
		position: absolute;
	}
`)
customElements.define('ui-color-picker', colorPicker);