export class BarcodeScanner extends HTMLElement {
	#lastKeyTime = 0;
	#terminateChar = '';
	#icons = {};
	#uid = 0;

	constructor() {
		super();
		this.#terminateChar = this.getAttribute('terminate-char') || '\n';
		this.#uid = crypto.randomUUID();
	}

	connectedCallback() {
		const shadow = this.attachShadow({ mode: 'open' });
		shadow.adoptedStyleSheets = [stylesheet];

		shadow.innerHTML = `
			<button type="button" popovertarget="popover-${this.#uid}">
				${this.#renderIcon(BarcodeScanner.ICONS.on, 'on', true)}
				${this.#renderIcon(BarcodeScanner.ICONS.off, 'off')}
				${this.#renderIcon(BarcodeScanner.ICONS.scanning, 'scanning', true)}
			</button>
			<output for="input-${this.#uid}">&nbsp;</output>
			<label id="popover-${this.#uid}" popover>
				<input type="number" id="input-${this.#uid}" autofocus data-sr>
			</label>`;

		this.#setupEventListeners(shadow);
	}

	#setupEventListeners(shadow) {
		this.button = shadow.querySelector('button');
		this.input = shadow.querySelector('input');
		this.output = shadow.querySelector('output');
		this.toggle = this.input.parentNode;

		this.#icons = {	
			on: shadow.querySelector('[data-icon="on"]'),
			off: shadow.querySelector('[data-icon="off"]'),
			scanning: shadow.querySelector('[data-icon="scanning"]')
		};

		this.toggle.addEventListener('beforetoggle', this.#handleToggle.bind(this));
		this.input.addEventListener('keydown', this.#handleInput.bind(this));
	}

	#handleToggle(event) {
		const isOpen = event.newState === 'open';
		this.button.classList.toggle('--open', isOpen);
		this.output.innerHTML = '&nbsp;';
		this.#setIcons(false, isOpen);
	}

	#setIcons(scanning = false, isOpen = true) {
		this.#icons.on.toggleAttribute('hidden', scanning || !isOpen);
		this.#icons.off.toggleAttribute('hidden', isOpen);
		this.#icons.scanning.toggleAttribute('hidden', !scanning);
	}

	#handleInput(event) {
		const currentTime = Date.now();
		const timeDiff = currentTime - this.#lastKeyTime;
		this.#lastKeyTime = currentTime;

		this.#setIcons(true, true);

		if (event.key === this.#terminateChar || event.key === 'Enter') {
			const value = this.input.value;
			this.output.textContent = value;
			
			if (value && timeDiff < 50) {
				this.#dispatchBarcodeEvent(value);
				this.input.value = '';
				event.preventDefault();
			}
			
			requestAnimationFrame(() => {
				setTimeout(() => this.#setIcons(false, true), 250);
			});
		}
	}

	#dispatchBarcodeEvent(value) {
		this.dispatchEvent(new CustomEvent('bs:entry', { 
			detail: { value }
		}));
	}

	#renderIcon(paths, id, hidden = false) {
		return `<svg viewBox="0 0 24 24" data-icon="${id}"${hidden ? ` hidden`:''}>${
			paths.split(',').map(path => `<path d="${path}"></path>`).join('')
		}</svg>`;
	}

	static ICONS = {
		on: 'M4 7v-1a2 2 0 0 1 2 -2h2,M4 17v1a2 2 0 0 0 2 2h2,M16 4h2a2 2 0 0 1 2 2v1,M16 20h2a2 2 0 0 0 2 -2v-1,M5 11h1v2h-1z,M10 11l0 2,M14 11h1v2h-1z,M19 11l0 2',
		off: 'M4 7v-1c0 -.552 .224 -1.052 .586 -1.414,M4 17v1a2 2 0 0 0 2 2h2,M16 4h2a2 2 0 0 1 2 2v1,M16 20h2c.551 0 1.05 -.223 1.412 -.584,M5 11h1v2h-1z,M10 11v2,M15 11v.01,M19 11v2,M3 3l18 18',
		scanning: 'M4 7v-1a2 2 0 0 1 2 -2h2,M4 17v1a2 2 0 0 0 2 2h2,M16 4h2a2 2 0 0 1 2 2v1,M16 20h2a2 2 0 0 0 2 -2v-1,M5 12l14 0'
	};

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
	--GrayText: light-dark(hsl(0, 0%, 60%), hsl(0, 0%, 40%));
	display: grid;
	inset-block-end: 1ch;
	inset-inline-end: 3ch;
	position: fixed;
	row-gap: 5px;
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
:host output {
	color: var(--GrayText);
	font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace;
	font-size: 10px;
	font-weight: 400;
}
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
`);