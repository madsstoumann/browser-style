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
		terminateChar: '\n',
		uid: ''
	};

	constructor() {
		super();
		this.#state.auto = this.hasAttribute('auto');
		this.#state.clear = parseInt(this.getAttribute('clear'), 10) || 2000;
		this.#state.debug = this.hasAttribute('debug');
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
			<output for="input-${this.#state.uid}"></output>
			<label id="popover-${this.#state.uid}" popover>
				<input type="number" id="input-${this.#state.uid}" autofocus data-sr>
			</label>`;
	}

	#setupEventListeners() {
		const shadow = this.shadowRoot;
		this.button = shadow.querySelector('button');
		this.input = shadow.querySelector('input');
		this.output = shadow.querySelector('output');
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
		if (!isOpen) this.output.value = '';
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

	#handleInput(event) {
		const currentTime = Date.now();
		const timeDiff = currentTime - this.#state.lastKeyTime;
		const value = this.input.valueAsNumber;
		this.#state.lastKeyTime = currentTime;
		this.output.value = value;
		this.#setIcons(true, true);

		if (event.key === this.#state.terminateChar || event.key === 'Enter') {
			if (value && timeDiff < 50) {
				this.dispatchEvent(new CustomEvent('bs:entry', { detail: { value } }));
				if (this.#state.debug) {
					this.#state.debugData.unshift({ 
						timestamp: new Date().toISOString(),
						barcode: value
					});
					this.#outputDebug();
				}
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
	block-size: 1lh;
	color: var(--GrayText);
	display: block;
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
:host svg.--scanning {
	animation: rotate 1.5s linear infinite;
}
@keyframes rotate {
	to { rotate: 1turn; }
}
`);