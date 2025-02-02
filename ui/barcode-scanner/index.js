import { FormElement } from '../../common/form.element.js';

/**
 * BarcodeScanner
 * @description Web Component that works with most barcode scanners
 * @author Mads Stoumann
 * @version 1.0.2
 * @summary 10-01-2025
 * @class BarcodeScanner
 * @extends {FormElement}
 */
export class BarcodeScanner extends FormElement {
	static ICONS = {
		on: 'M4 7v-1a2 2 0 0 1 2 -2h2,M4 17v1a2 2 0 0 0 2 2h2,M16 4h2a2 2 0 0 1 2 2v1,M16 20h2a2 2 0 0 0 2 -2v-1,M5 11h1v2h-1z,M10 11l0 2,M14 11h1v2h-1z,M19 11l0 2',
		off: 'M4 7v-1c0 -.552 .224 -1.052 .586 -1.414,M4 17v1a2 2 0 0 0 2 2h2,M16 4h2a2 2 0 0 1 2 2v1,M16 20h2c.551 0 1.05 -.223 1.412 -.584,M5 11h1v2h-1z,M10 11v2,M15 11v.01,M19 11v2,M3 3l18 18',
		scanning: 'M4 7v-1a2 2 0 0 1 2 -2h2,M4 17v1a2 2 0 0 0 2 2h2,M16 4h2a2 2 0 0 1 2 2v1,M16 20h2a2 2 0 0 0 2 -2v-1,M5 12l14 0'
	};

	get basePath() {
		return new URL('.', import.meta.url).href;
	}

	#state = {
		auto: false,
		clear: 2000,
		clearTimeout: null,
		debug: false,
		debugData: [],
		icons: {},
		lastKeyTime: 0,
		maxLength: 14,
		minLength: 8,
		showInput: false,
		terminateChar: '\n',
		uid: ''
	};

	constructor() {
		super();
		this.#state.auto = this.hasAttribute('auto');
		this.#state.clear = parseInt(this.getAttribute('clear'), 10) || 2000;
		this.#state.debug = this.hasAttribute('debug');
		this.#state.maxLength = Math.max(8, parseInt(this.getAttribute('maxlength'), 10) || 14);
		this.#state.minLength = Math.max(1, Math.min(this.#state.maxLength, parseInt(this.getAttribute('minlength'), 10) || 8));
		this.#state.showInput = this.hasAttribute('input');
		this.#state.terminateChar = this.getAttribute('terminate-char') || '\n';
		this.#state.uid = this.uuid();
	}

	initializeComponent() {
		this.root.innerHTML = this.template();
		this.addRefs();
		this.addEvents();
		if (this.#state.auto) this.toggle.togglePopover(true);
	}

	addEvents() {
		this.toggle.addEventListener('beforetoggle', e => this.#handleToggle(e));
		this.input.addEventListener('keydown', e => this.#handleInput(e));
		this.addEventListener('bs:clear', () => this.#handleClear());
	}

	addRefs() {
		const shadow = this.root;
		this.button = shadow.querySelector('button');
		this.input = shadow.querySelector('input');
		this.toggle = this.input.parentNode;
		this.#state.icons = {
			on: shadow.querySelector('[part="on"]'),
			off: shadow.querySelector('[part="off"]'),
			scanning: shadow.querySelector('[part="scanning"]')
		};
	}

	template() {
		return `
			<button type="button" popovertarget="popover-${this.#state.uid}">
				${this.icon(BarcodeScanner.ICONS.on, 'on', true)}
				${this.icon(BarcodeScanner.ICONS.off, 'off')}
				${this.icon(BarcodeScanner.ICONS.scanning, 'scanning', true)}
			</button>
			<label id="popover-${this.#state.uid}" popover>
				<input
					autofocus${this.#state.showInput ? ``:` data-sr`}
					placeholder="0123456789123"
					type="number">
			</label>`;
	}

	#handleToggle({ newState }) {
		const isOpen = newState === 'open';
		this.button.classList.toggle('--open', isOpen);
		this.#setIcons(false, isOpen);
		this.input.focus();
	}

	#setIcons(scanning = false, isOpen = true) {
		Object.entries(this.#state.icons).forEach(([key, icon]) => {
			icon.toggleAttribute('hidden', 
				key === 'on' ? (scanning || !isOpen) :
				key === 'off' ? isOpen :
				!scanning
			);
		});
		this.#state.icons.scanning?.classList.toggle('--scanning', scanning);
	}

	#checkValidRange(value, min = this.#state.minLength, max = this.#state.maxLength) {
		const length = value.toString().length || 0;
		return length >= min && length <= max;
	}

	#handleInput(event) {
		const currentTime = Date.now();
		const timeDiff = currentTime - this.#state.lastKeyTime;
		const value = this.input.valueAsNumber;
		this.#state.lastKeyTime = currentTime;
		
		const isScanner = timeDiff < 50;
		const isEnter = event.key === 'Enter';
		const isValid = !isNaN(value) && this.#checkValidRange(value);

		this.#setIcons(isValid && (isScanner || isEnter), true);

		if (event.key === this.#state.terminateChar || isEnter) {
			if (isValid && (isScanner || isEnter)) {
				const strValue = value.toString();
				super.value = strValue;

				this.dispatchEvent(new CustomEvent('bs:entry', { detail: { value: strValue }}));
				if (this.#state.debug) {
					this.#state.debugData.unshift({ 
						timestamp: new Date().toISOString(),
						barcode: strValue,
						source: isScanner ? 'scanner' : 'manual'
					});
					this.#outputDebug();
				}
				this.input.placeholder = strValue;
				this.input.value = '';
				event.preventDefault();
				clearTimeout(this.#state.clearTimeout);
				this.#state.clearTimeout = setTimeout(() => this.#handleClear(), this.#state.clear);
			}
		}
	}

	#outputDebug() {
		console.clear();
		console.table(this.#state.debugData);
	}

	#handleClear() {
		clearTimeout(this.#state.clearTimeout);
		this.#state.clearTimeout = null;
		this.#setIcons(false, true);
		requestAnimationFrame(() => setTimeout(() => this.#setIcons(false, true), 50));
	}

	formReset() {
		super.value = '';
		this.input.value = '';
		this.#handleClear();
	}
}

BarcodeScanner.register();
