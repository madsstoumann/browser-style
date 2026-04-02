import xyController from '../xy/index.js';

/**
 * Pocket Synth
 * @version 1.0.00
 * @summary 28-04-2024
 * @author Mads Stoumann
 * @description A custom HTML element for synthesizing audio with various filters and oscillators.
 */
class PocketSynth extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.adoptedStyleSheets = [stylesheet];
		this.setupTemplate();
		this.setupAudioComponents();
		this.setupEventListeners();
	}

	setupTemplate() {
		this.shadowRoot.innerHTML = `
		<x-y x="50" y="220" min-y="27.5" max-y="440" part="xy" leave="false"></x-y>
		<form part="controls">
			<fieldset>
				<label aria-label="sine wave">
					<input type="radio" name="wave" value="sine">
					<svg viewBox="0 0 24 24">
						<path d="M21 12h-2c-.894 0 -1.662 -.857 -1.761 -2c-.296 -3.45 -.749 -6 -2.749 -6s-2.5 3.582 -2.5 8s-.5 8 -2.5 8s-2.452 -2.547 -2.749 -6c-.1 -1.147 -.867 -2 -1.763 -2h-2" />
					</svg>
				</label>
				<label aria-label="saw wave">
					<input type="radio" name="wave" value="sawtooth" checked>
					<svg viewBox="0 0 24 24">
						<path d="M3 12h5l4 8v-16l4 8h5" />
					</svg>
				</label>
				<label aria-label="square wave">
					<input type="radio" name="wave" value="square">
					<svg viewBox="0 0 24 24">
						<path d="M3 12h5v8h4v-16h4v8h5" />
					</svg>
				</label>
				<label aria-label="triangle wave">
					<input type="radio" name="wave" value="triangle">
					<svg viewBox="0 0 24 24">
						<path d="M 4 14 L 8 6 L 16 20 L 21 12" />
					</svg>
				</label>
			</fieldset>
			<fieldset>
				<label><input type="radio" name="filter" value="allpass"><span>allpass</span></label>
				<label><input type="radio" name="filter" value="lowpass"><span>lowpass</span></label>
				<label><input type="radio" name="filter" value="highpass" checked><span>highpass</span></label>
				<label><input type="radio" name="filter" value="bandpass"><span>bandpass</span></label>
			</fieldset>
			<label aria-label="gain">
				<input type="range" min="0" max="100" step="1" value="75" part="gain">
			</label>
		</form>
		`;
	}

	setupAudioComponents() {
		const AudioContext = window.AudioContext || window.webkitAudioContext;
		this.context = new AudioContext();
		this.gainNode = this.context.createGain();
		this.filter = this.context.createBiquadFilter();
		this.gainNode.connect(this.context.destination);
		this.gainNode.gain.value = 0.5;
		this.filter.connect(this.gainNode);
	}

	setupEventListeners() {
		this.controls = this.shadowRoot.querySelector('[part=controls]');
		this.gain = this.shadowRoot.querySelector('[part=gain]');
		this.xy = this.shadowRoot.querySelector('[part=xy]');

		this.gain.addEventListener('input', () => {
			this.gainNode.gain.value = this.gain.valueAsNumber;
		});

		this.xy.addEventListener('xydown', this.down.bind(this));
		this.xy.addEventListener('xymove', this.move.bind(this));
		this.xy.addEventListener('xytoggle', this.toggle.bind(this));
		this.xy.addEventListener('xyup', this.up.bind(this));
	}

	down() {
		this.filter.type = this.controls.elements.filter.value;
		this.oscillator = this.context.createOscillator();
		this.oscillator.connect(this.filter);
		this.oscillator.frequency.value = 220; // Default frequency
		this.oscillator.type = this.controls.elements.wave.value;
		this.oscillator.start();
	}

	move(e) {
		if (this.oscillator) {
			this.oscillator.frequency.value = e.detail.y;
			this.filter.frequency.value = e.detail.y * 4;
			this.filter.Q.value = e.detail.x / 4;
		}
	}

	up() {
		if (this.oscillator) {
			this.oscillator.stop();
			this.oscillator = null;
		}
	}

	toggle() {
		if (this.oscillator) {
			this.up();
		} else {
			this.down();
		}
	}
}

/* === STYLES === */
const stylesheet = new CSSStyleSheet()
stylesheet.replaceSync(`
	:host {
		--ui-pocket-synth-bdc: var(--ButtonText, #666);
		--ui-pocket-synth-bdw: 1px;
		--ui-xy-bg: var(--ButtonText);
		--ui-xy-point-bdw: 2px;
		--ui-xy-point-bg: #0000;
		--ui-xy-point-sz: 24px;
		background: var(--ui-pocket-synth-bg, var(--CanvasGray, #F2F2F2));
		border-radius: 1ch;	
		display: block;
		padding: 1ch;
		width: var(--ui-pocket-synth-w, 250px);
	}
	fieldset {
		all: unset;
		border: var(--ui-pocket-synth-bdw) solid var(--ui-pocket-synth-bdc);
		border-radius: .5ch;
		display: flex;
		font-size: x-small;
		& > * { flex: 1; }
	}
	form {
		display: grid;
		gap: 1ch;
		margin-block-start: 1ch;
	}
	input[type=radio] { 
		clip: rect(0 0 0 0);
		clip-path: inset(50%);
		height: 1px;
		left: 0;
		overflow: hidden;
		position: absolute;
		white-space: nowrap;
		width: 1px;
	}
	input[type=range] {
		-webkit-appearance: none;
		background: var(--ButtonBorder, #CCC);
		border-radius: 1ch;
		height: 1ch;
		width: 100%;
	}
	input[type=range]::-webkit-slider-thumb {
		-webkit-appearance: none;
		background: var(--ui-pocket-synth-bdc);
		border-radius: 50%;
		cursor: pointer;
		height: 2ch;
		width: 2ch;
	}
	label {
		display: grid;
		place-items: center;
	}
	label:has(:checked) {
		background: var(--ui-pocket-synth--active-bg, var(--ButtonText, #666));
		color: var(--ui-pocket-synth--active-c, #FFF);
	}
	svg {
		fill: none;
		height: 2em;
		stroke: currentColor;
		width: 2em;
	}
`)
customElements.define('ui-pocket-synth', PocketSynth);