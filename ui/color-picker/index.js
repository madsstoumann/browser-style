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
			<input type="range" min="0" max="360" step="1" value="0" part="hue">
			<div part="output"></div>`;
		shadow.innerHTML = template;
		this.hue = shadow.querySelector('input');
		this.hue.addEventListener('input', () => {
			this.style.setProperty('--_h', this.hue.value);
		});
		this.xy = shadow.querySelector('x-y');
		this.xy.addEventListener('xymove', (e) => {
			const x = e.detail.x;
			const y = e.detail.y;
			const saturation = (y === 100) ? (x === 0) ? 0 : 100 : x;
			const lightness = (y === 100) ? 50 + (50 * (1 - x / 100)) : y / 2;
			// console.log(saturation, lightness);
			this.style.setProperty('--_s', `${saturation}%`);
			this.style.setProperty('--_l', `${lightness}%`);
		});
		this.tabIndex = 0;
	}
}

/* === STYLES === */
const stylesheet = new CSSStyleSheet()
stylesheet.replaceSync(`
	:host {
		--ui-color-picker-bdrs: .75em;
		--ui-color-picker-bdw: 2px;
		--ui-xy-bg: #0000;
		--ui-xy-point-bdw: 2px;
		--ui-xy-point-bg: #0000;
		--ui-xy-point-sz: 24px;
		--ui-xy-point--focus: #0000;
		border: 2px solid #0002;
		border-radius: var(--ui-color-picker-bdrs);
		display: grid;
		width: var(--ui-color-picker-w, 250px);
	}
	:host::part(hsl) {
		aspect-ratio: 1 / 1;
		background: hsl(var(--_h, 0), 100%, 50%);
		border-radius: inherit;
		cursor: move;
		margin: unset;
		position: relative;
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
	:host::part(lightness),
	:host::part(saturation) {
		border-start-start-radius: calc(var(--ui-color-picker-bdrs) - var(--ui-color-picker-bdw));
		border-start-end-radius: calc(var(--ui-color-picker-bdrs) - var(--ui-color-picker-bdw));
		inset: 0;
		position: absolute;
	}
	:host::part(lightness) {
		background-image: linear-gradient(to right, hsl(var(--_h, 0), 100%, 100%), #0000);
	}
	:host::part(saturation) {
		background-image: linear-gradient(to bottom, #0000, hsl(var(--_h, 0), 0%, 0%));
	}

	:host::part(output) {	
		aspect-ratio: 3 /1;
		background: hsl(var(--_h, 0), var(--_s, 100%), var(--_l, 50%));
		border-end-start-radius: calc(var(--ui-color-picker-bdrs) - var(--ui-color-picker-bdw));
		border-end-end-radius: calc(var(--ui-color-picker-bdrs) - var(--ui-color-picker-bdw));
	}
	:host::part(xy) {
		inset: 0;
		position: absolute;
	}
`)
customElements.define('ui-color-picker', colorPicker);