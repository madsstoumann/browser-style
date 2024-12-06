export class BarcodeScanner extends HTMLElement {
	static ICONS = {
		on: 'M4 7v-1a2 2 0 0 1 2 -2h2,M4 17v1a2 2 0 0 0 2 2h2,M16 4h2a2 2 0 0 1 2 2v1,M16 20h2a2 2 0 0 0 2 -2v-1,M5 11h1v2h-1z,M10 11l0 2,M14 11h1v2h-1z,M19 11l0 2',
		off: 'M4 7v-1c0 -.552 .224 -1.052 .586 -1.414,M4 17v1a2 2 0 0 0 2 2h2,M16 4h2a2 2 0 0 1 2 2v1,M16 20h2c.551 0 1.05 -.223 1.412 -.584,M5 11h1v2h-1z,M10 11v2,M15 11v.01,M19 11v2,M3 3l18 18',
		scanning: 'M4 7v-1a2 2 0 0 1 2 -2h2,M4 17v1a2 2 0 0 0 2 2h2,M16 4h2a2 2 0 0 1 2 2v1,M16 20h2a2 2 0 0 0 2 -2v-1,M5 12l14 0'
	};

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
		this.#state.uid = crypto.randomUUID();
	}

	connectedCallback() {
		this.attachShadow({ mode: 'open' }).adoptedStyleSheets = [stylesheet];
		this.shadowRoot.innerHTML = this.#getTemplate();
		this.#setupEventListeners();
		if (this.#state.auto) this.toggle.togglePopover(true);
	}

	#getTemplate() {
		return `
			<button type="button" popovertarget="popover-${this.#state.uid}">
				${this.#renderIcon(BarcodeScanner.ICONS.on, 'on', true)}
				${this.#renderIcon(BarcodeScanner.ICONS.off, 'off')}
				${this.#renderIcon(BarcodeScanner.ICONS.scanning, 'scanning', true)}
			</button>
			<label id="popover-${this.#state.uid}" popover>
				<input
					autofocus${this.#state.showInput ? ``:` data-sr`}
					placeholder="0123456789123"
					type="number">
			</label>`;
	}

	#setupEventListeners() {
		const shadow = this.shadowRoot;
		this.button = shadow.querySelector('button');
		this.input = shadow.querySelector('input');
		this.toggle = this.input.parentNode;
		this.#state.icons = {
			on: shadow.querySelector('[data-icon="on"]'),
			off: shadow.querySelector('[data-icon="off"]'),
			scanning: shadow.querySelector('[data-icon="scanning"]')
		};

		this.toggle.addEventListener('beforetoggle', e => this.#handleToggle(e));
		this.input.addEventListener('keydown', e => this.#handleInput(e));
		this.addEventListener('bs:clear', () => this.#handleClear());
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

		// Show scanning animation only for valid inputs
		this.#setIcons(isValid && (isScanner || isEnter), true);

		if (event.key === this.#state.terminateChar || isEnter) {
			if (isValid && (isScanner || isEnter)) {
				this.dispatchEvent(new CustomEvent('bs:entry', { detail: { value }}));
				if (this.#state.debug) {
					this.#state.debugData.unshift({ 
						timestamp: new Date().toISOString(),
						barcode: value,
						source: isScanner ? 'scanner' : 'manual'
					});
					this.#outputDebug();
				}
				this.input.placeholder = value;
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

	#renderIcon(paths, id, hidden = false) {
		return `<svg viewBox="0 0 24 24" data-icon="${id}"${hidden ? ' hidden' : ''}>${
			paths.split(',').map(path => `<path d="${path}"></path>`).join('')
		}</svg>`;
	}

	static mount() {
		if (!customElements.get('barcode-scanner')) {
			customElements.define('barcode-scanner', this);
		}
	}
}

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(`
[hidden] { display: none; }
[data-sr] {
	border: 0;
	clip: rect(0 0 0 0); 
	clip-path: inset(50%);
	height: 1px;
	overflow: hidden;
	position: absolute;
	white-space: nowrap; 
	width: 1px;
}
:host *, :host *::after, :host *::before { box-sizing: border-box; }
:host {
	--ButtonFace: light-dark(hsl(0, 0%, 90%), hsl(0, 0%, 40%));
	--ColorSuccess: light-dark(hsl(136, 41%, 41%), hsl(136, 21%, 51%));
	inset-block-end: 1.5rem;
	inset-inline-end: 1.5rem;
	position: fixed;
}
:host button {
	background-color: var(--ButtonFace);
	border: 0;
	border-radius: 50%;
	display: grid;
	padding: .66rem;
	place-self: end;
}
:host button.--open {
	background-color: var(--ColorSuccess);
	color: #FFF;
}
:host input {
	background-color: var(--ButtonFace);
	border: 0;
	border-radius: .25em;
	caret-color: #0000;
	font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace;
	font-size: 10px;
	font-weight: 400;
	inset-block-end: .25rem;
	inset-inline-end: 1.5rem;
	opacity: .5;
	padding: 3px 6px;
	position: fixed;
	text-align: end;
	width: 15ch;
}
:host input::-webkit-inner-spin-button { display: none; }
:host input:focus { caret-color: #333; outline: 0; }
:host [popover] { border: 0; }
:host [popover]::backdrop { background-color: #0000; }
:host svg { 
	fill: none;
	height: 2rem;
	stroke-linecap: round;
	stroke-linejoin: round;
	stroke-width: 1.25;
	stroke: currentColor;
	width: 2rem;
}
:host svg.--scanning {
	animation: rotate 1.5s linear infinite;
}
@keyframes rotate {
	to { rotate: 1turn; }
}
`);