const styles = new CSSStyleSheet();
styles.replaceSync(`
:host {
  container-type: inline-size;
}
fieldset{
	border: 0;
	container-type: inline-size;
	display: grid;
	font-family: var(--number-snapper-ff, ui-sans-serif, system-ui);
	margin: 0;
	padding: 0;
	row-gap: var(--number-snapper-rg, 0.875rem);
	text-align: center;
	user-select: none;
}
b {
	background: var(--number-snapper-snap-minor-bg, #CCC);
	border-radius: var(--number-snapper-minor-bdrs, 1px);
	height: var(--number-snapper-minor-h, 70%);
	scroll-snap-align: center;
	width: var(--number-snapper-minor-w, 1px);
}
:host([interval="2"]) b:nth-of-type(2n+1),
:host([interval="3"]) b:nth-of-type(3n+1),
:host([interval="4"]) b:nth-of-type(4n+1),
:host([interval="5"]) b:nth-of-type(5n+1),
:host([interval="10"]) b:nth-of-type(10n+1) {
	background: var(--number-snapper-snap-major-bg, #CCC);
	border-radius: var(--number-snapper-snap-major-bdrs, 2px);
	height: var(--number-snapper-snap-major-h, 100%);
	width: var(--number-snapper-snap-major-w, 2px);
}
input {
	background: #0000;
	grid-area: 1 / 1;
	margin: 0;
}
input:focus-visible { 
	outline: none; 
}
label {
	display: grid;
	grid-template-columns: 1fr;
	grid-template-rows: 1fr min-content;
	position: relative;
	row-gap: var(--number-snapper-label-rg, .25rem);
}
label:has(:focus-visible) {
	outline: 1px var(--number-snapper-outline-style, solid) var(--number-snapper-outline-c, #CCC);
	outline-offset: var(--number-snapper-outline-off, 4px);
}
label::after {
	background: var(--number-snapper-indicator-bg, light-dark(#0008, #FFF8));
	border-radius: var(--number-snapper-indicator-bdrs, 3px);
	content: "";
	display: block;
	grid-area: 1 / 1;
	height: var(--number-snapper-indicator-h, 32px);
	isolation: isolate;
	place-self: center;
	pointer-events: none;
	width: var(--number-snapper-indicator-w, 5px);
}
label::before { 
	background: var(--number-snapper-triangle-bg, light-dark(#0008, #FFF8));
	clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
	content: "";
	display: block;
	height: var(--number-snapper-triangle-h, 5px);
	place-self: end center;
	pointer-events: none;
	width: var(--number-snapper-triangle-w, 10px);
}
legend {
	color: var(--number-snapper-legendf-c, light-dark(#222, #EEE));
	display: contents;
	font-size: var(--number-snapper-legend-fs, 0.875rem);
	font-weight: var(--number-snapper-legend-fw, 400);
}
output {
	color: var(--number-snapper-output-c, light-dark(#222, #EEE));
	font-size: var(--number-snapper-output-fs, 2rem);
	font-variant-numeric: tabular-nums;
	font-weight: var(--number-snapper-output-fw, 600);
	text-box: cap text;
}
[data-scroll] {
	cursor: ew-resize;
	display: block;
	grid-area: 1 / 1 / 1 / 1;
	inset: 0;
	mask: var(--number-snapper-mask, linear-gradient(to right, #0000, #000 15%, #000 85%, #0000));
	overflow-x: auto;
	overscroll-behavior: none;
	position: absolute;
	scrollbar-width: none;
	scroll-snap-type: x proximity;
}
[data-scroll].grabbing { 
	cursor: grabbing; 
}
[data-scroll-bg] {
	display: grid;
	grid-template-columns: 50cqi var(--number-snapper-w, 200cqi) 50cqi;
	height: 100%;
	pointer-events: none;
}
[data-scroll-snap] {
	align-items: end;
	display: flex;
	justify-content: space-between;
	scroll-snap-type: x mandatory;
}
[data-scroll]::-webkit-scrollbar { 
	display: none; 
}

/* snap-to */
:host([data-snap=none]) [data-scroll-snap] {
	scroll-snap-type: none;
}
:host([data-snap=none]) [data-scroll-snap] b { 
	scroll-snap-align: none; 
}
:host([snap=value]) b:not([data-value]),
:host([interval="2"][snap=major]) b:not(:nth-of-type(2n+1)),
:host([interval="3"][snap=major]) b:not(:nth-of-type(3n+1)),
:host([interval="4"][snap=major]) b:not(:nth-of-type(4n+1)),
:host([interval="5"][snap=major]) b:not(:nth-of-type(5n+1)),
:host([interval="10"][snap=major]) b:not(:nth-of-type(10n+1)) {
	scroll-snap-align: none;
}
[type=range],
[type=range]::-webkit-slider-runnable-track,
[type=range]::-webkit-slider-thumb { appearance: none; }
`);

class NumberSnapper extends HTMLElement {
	#attr;
  #root;
	#E;
	#isResizing = false;
	#scrollRange;

	#boundOnMove;
	#boundOnEnd;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: 'open' });
    this.#root.adoptedStyleSheets = [styles];

		this.#boundOnMove = this.#onMove.bind(this);
		this.#boundOnEnd = this.#onEnd.bind(this);
  }

  connectedCallback() {
		this.#attr = {
			currency: this.getAttribute('currency') || 'USD',
			decimals: this.hasAttribute('decimals') ? parseInt(this.getAttribute('decimals'), 10) : 0,
			format: this.getAttribute('format') || 'currency',
			label: this.getAttribute('label') || '',
			lang: this.getAttribute('lang') || 'en-US',
			max: this.hasAttribute('max') ? parseFloat(this.getAttribute('max')) : 100,
			min: this.hasAttribute('min') ? parseFloat(this.getAttribute('min')) : 0,
			points: this.hasAttribute('points') ? parseInt(this.getAttribute('points'), 10) : 10,
			snap: this.getAttribute('snap') || 'none',
			step: this.hasAttribute('step') ? parseFloat(this.getAttribute('step')) : 1,
			unit: this.getAttribute('unit') || null,
			value: this.hasAttribute('value') ? parseFloat(this.getAttribute('value')) : 0
		};
		this.#attr.range = this.#attr.max - this.#attr.min;

    this.#root.innerHTML = `
		<fieldset>
			<legend>${this.#attr.label}</legend>
			<output name="out"></output>
			<label aria-label="${this.#attr.label}">
				<input type="range" name="in" min="${this.#attr.min}" max="${this.#attr.max}" step="${this.#attr.step}" value="${this.#attr.value}">
				<span data-scroll tabindex="-1">
					<span data-scroll-bg>
						<i></i>
						<span data-scroll-snap>${ Array.from({ length: this.#attr.points + 1 }).map(() => `<b></b>`).join('')}</span>
						<i></i>
					</span>
				</span>
			</label>
		</fieldset>`;

		this.#E = {
			in: this.#root.querySelector('[name="in"]'),
			out: this.#root.querySelector('[name="out"]'),
			scroll: this.#root.querySelector('[data-scroll]'),
			snap: this.#root.querySelector('[data-scroll-snap]')
		};

		this.#scrollRange = this.#E.scroll.scrollWidth - this.#E.scroll.clientWidth;
		new ResizeObserver(() => {
			this.#isResizing = true;
			this.#scrollRange = this.#E.scroll.scrollWidth - this.#E.scroll.clientWidth;
			setTimeout(() => { this.#isResizing = false }, 200);
		}).observe(this.#E.scroll);

		this.#E.scroll.addEventListener('pointerdown', this.#onStart.bind(this));
		this.#root.addEventListener('input', () => this.#update());
		this.#E.scroll.addEventListener('scroll', () => this.#update(true));
		this.#update();
  }

	#format(num) {
		const options = {
			style: this.#attr.format,
			minimumFractionDigits: this.#attr.decimals,
			maximumFractionDigits: this.#attr.decimals,
			...(this.#attr.format === 'currency' && { currency: this.#attr.currency }),
			...(this.#attr.format === 'unit' && this.#attr.unit && { unit: this.#attr.unit }),
		};
		return new Intl.NumberFormat(this.#attr.lang, options).format(num).replace(/\u00A0/g, ' ');
	}

	#update(fromScroll = false) {
		if (this.#isResizing && fromScroll) return;
		const val = fromScroll
			? this.#attr.min + ((this.#E.scroll.scrollLeft / this.#scrollRange) * this.#attr.range)
			: parseInt(this.#E.in.value, 10);

		const value = Math.round(val / this.#attr.step) * this.#attr.step;
		const formattedValue = this.#format(value);
		this.#E.out.value = formattedValue;
		this.#E.in.ariaValueText = formattedValue;

		if (fromScroll) {
			this.#E.in.value = value;
		} else {
			this.#E.scroll.scrollLeft = ((value - this.#attr.min) / this.#attr.range) * this.#scrollRange;
		}
	}

	#onMove(e) {
		this.#E.scroll.scrollLeft = this.#E.scroll.dataset.scroll - (e.clientX - this.#E.scroll.dataset.pointer);
	}

	#onEnd() {
		this.#E.scroll.classList.remove('grabbing');
		document.removeEventListener('pointermove', this.#boundOnMove);
		document.removeEventListener('pointerup', this.#boundOnEnd);
		document.removeEventListener('pointercancel', this.#boundOnEnd);
	}

	#onStart(e) {
		e.stopPropagation();
		this.#E.scroll.dataset.pointer = e.clientX;
		this.#E.scroll.dataset.scroll = this.#E.scroll.scrollLeft;
		this.#E.scroll.classList.add('grabbing');
		this.#E.scroll.setPointerCapture(e.pointerId);
		document.addEventListener('pointermove', this.#boundOnMove);
		document.addEventListener('pointerup', this.#boundOnEnd);
		document.addEventListener('pointercancel', this.#boundOnEnd);
	}
}

customElements.define('number-snapper', NumberSnapper);
