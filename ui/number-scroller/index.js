const styles = new CSSStyleSheet();
styles.replaceSync(`
	b {
		background: #CCC;
		display: block;
		height: 70%;
		scroll-snap-align: center;
		width: 1px;
		&:nth-child(5n+1) {
			height: 100%;
			/* scroll-snap-align: center; */
		}
	}
	fieldset {
		border: 0;
		display: grid;
		font-family: var(--number-scroller-ff, ui-sans-serif, system-ui);
		margin: 0;
		padding: 0;
		row-gap: 1ch;
		text-align: center;
	}
	input {
		grid-area: 1 / 1;
		margin: 0;
	}
	[type=range],
	[type=range]::-webkit-slider-runnable-track,
	[type=range]::-webkit-slider-thumb {
		appearance: none;
	}
	label {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: 1fr min-content;
		position: relative;
		row-gap: .25rem;

		&::after {
			background: cornflowerblue;
			border-radius: 3px;
			content: "";
			display: block;
			grid-area: 1 / 1;
			height: 32px;
			place-self: center;
			pointer-events: none;
			width: 5px;
		}
		&::before { 
			background: tomato;
			clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
			content: "";
			display: block;
			height: 5px;
			place-self: end center;
			pointer-events: none;
			width: 10px;
		}
		&:has(:focus-visible) {
			outline: 1px solid #CCC;
			outline-offset: 4px;
		}
	}
	legend {
		font-weight: var(--number-scroller-legend-fw, 400);
		font-size: var(--number-scroller-legend-fs, .75rem);
	}
	output {
		font-size: var(--number-scroller-out-fs, 2rem);
		font-variant-numeric: tabular-nums;
		font-weight: var(--number-scroller-out-fw, 600);
	}
	span[part=scroll] {
		cursor: col-resize;
		display: block;
		grid-area: 1 / 1 / 1 / 1;
		inset: 0;
		mask: var(--number-scroller-mask, linear-gradient(to right, #0000, #000 15%, #000 85%, #0000));
		overflow-x: auto;
		position: absolute;
		scrollbar-width: none;
		scroll-snap-type: x proximity;
		&:focus-visible { outline: none; }
	}
	span[part=scroll].grabbing { cursor: grabbing; }
	span[part=scroll]::-webkit-scrollbar { display: none; }
	span[part=scroll-bg] {
		display: grid;
		grid-template-columns: 1fr 2fr 1fr;
		height: 100%;
		pointer-events: none;
		width: var(--number-scroller-w, 200%);
	}
	span[part=scroll-snap] {
		align-items: end;
		display: flex;
		grid-column: 2;
		justify-content: space-between;
		scroll-snap-type: x mandatory;
	}
`);
export default class NumberScroller extends HTMLElement {
	#cfg = {};
	#elm = {};
	#isDown = false;
	#root;
	#scrollLeft;
	#startX;

	constructor() {
		super();
		this.#root = this.attachShadow({ mode: 'open' });
		this.#root.adoptedStyleSheets = [styles];
	}
	connectedCallback() {
		this.#cfg = {
			currency: this.getAttribute('currency') || 'USD',
			decimals: parseInt(this.getAttribute('decimals') || '0', 10),
			format: this.getAttribute('format') || 'currency',
			incRange: 0,
			label: this.getAttribute('label') || 'Number Scroller',
			lang: this.getAttribute('lang') || document.documentElement.lang || 'en-US',
			max: parseInt(this.getAttribute('max') || '100', 10),
			min: parseInt(this.getAttribute('min') || '0', 10),
			scrollMultiplier: parseFloat(this.getAttribute('scroll-multiplier') || '1.5'),
			scrollRange: 0,
			scrollWidth: parseInt(this.getAttribute('scroll-width') || '200', 10),
			snapPoints: parseInt(this.getAttribute('snap-points') || '0', 10),
			step: parseInt(this.getAttribute('step') || '1', 10),
			unit: this.getAttribute('unit'),
			value: parseInt(this.getAttribute('value') || '0', 10),
		}
		this.#root.innerHTML = `
			<fieldset>
				<legend>${this.#cfg.label}</legend>
				<output name="out">${this.formatNumber(this.#cfg.value)}</output>
				<label aria-label="${this.#cfg.label}">
					<input type="range" name="in" min="${this.#cfg.min}" step="${this.#cfg.step}" max="${this.#cfg.max}" value="${this.#cfg.value}">
					<span part="scroll">
						<span part="scroll-bg">
							<span part="scroll-snap">${Array.from({ length: this.#cfg.snapPoints }).map(() => `<b></b>`).join('')}</span>
						</span>
					</span>
				</label>
				<slot></slot>
			</fieldset>
		`;
		this.#elm = {
			app: this.#root.querySelector('fieldset'),
			in: this.#root.querySelector('input[name="in"]'),
			out: this.#root.querySelector('output[name="out"]'),
			scroller: this.#root.querySelector('[part="scroll"]'),
			snap: this.#root.querySelector('[part="scroll-snap"]'),
		};

		this.style.setProperty('--number-scroller-w', `${this.#cfg.scrollWidth}%`);
		this.addEvents();
		this.updateFromInput();
	}

	addEvents() {
		this.#elm.app.addEventListener('input', (e) => {
			if (e.target === this.#elm.in) {
				this.updateFromInput();
			}
		});
		this.#elm.scroller.addEventListener('scroll', this.updateFromScroll.bind(this));
		this.#elm.scroller.addEventListener('scrollend', this.updateInputFromScroll.bind(this));
		this.#elm.scroller.addEventListener('pointerdown', this.onPointerDown.bind(this));
		this.#elm.scroller.addEventListener('pointerleave', this.onPointerLeave.bind(this));
		this.#elm.scroller.addEventListener('pointerup', this.onPointerUp.bind(this));
		this.#elm.scroller.addEventListener('pointermove', this.onPointerMove.bind(this));
	}

	formatNumber(num) {
		const options = {
			style: this.#cfg.format,
			minimumFractionDigits: this.#cfg.decimals,
			maximumFractionDigits: this.#cfg.decimals,
		};

		if (this.#cfg.format === 'currency') {
			options.currency = this.#cfg.currency;
		} else if (this.#cfg.format === 'unit' && this.#cfg.unit) {
			options.unit = this.#cfg.unit;
		}

		const formatted = new Intl.NumberFormat(this.#cfg.lang, options).format(num);
		return formatted.replace(/\u00A0/g, ' ');
	};

	onPointerDown(e) {
		this.#isDown = true;
		this.#elm.scroller.classList.add('grabbing');
		this.#startX = e.pageX - this.#elm.scroller.offsetLeft;
		this.#scrollLeft = this.#elm.scroller.scrollLeft;
	}

	onPointerLeave() {
		this.#isDown = false;
		this.#elm.scroller.classList.remove('grabbing');
	}

	onPointerUp() {
		this.#isDown = false;
		this.#elm.scroller.classList.remove('grabbing');
	}

	onPointerMove(e) {
		if (!this.#isDown) return;
		e.preventDefault();
		const x = e.pageX - this.#elm.scroller.offsetLeft;
		const walk = (x - this.#startX) * this.#cfg.scrollMultiplier;
		this.#elm.scroller.scrollLeft = this.#scrollLeft - walk;
	}

	updateFromInput() {
		const value = this.#elm.in.value;
		this.#updateUI(value);
		this.#cfg.incRange = this.#cfg.max - this.#cfg.min;
		this.#cfg.scrollRange = this.#elm.scroller.scrollWidth - this.#elm.scroller.clientWidth;
		const scrollPercentage = (value - this.#cfg.min) / this.#cfg.incRange;
		this.#elm.scroller.scrollLeft = scrollPercentage * this.#cfg.scrollRange;
	}

	updateFromScroll() {
		const scrollPercentage = this.#elm.scroller.scrollLeft / this.#cfg.scrollRange;
		const scrollValue = this.#cfg.min + (scrollPercentage * this.#cfg.incRange);
		const steppedValue = Math.round(scrollValue / this.#cfg.step) * this.#cfg.step;
		this.#updateUI(steppedValue);
	}

	updateInputFromScroll() {
		const scrollPercentage = this.#elm.scroller.scrollLeft / this.#cfg.scrollRange;
		const scrollValue = this.#cfg.min + (scrollPercentage * this.#cfg.incRange);
		const steppedValue = Math.round(scrollValue / this.#cfg.step) * this.#cfg.step;
		this.#elm.in.value = steppedValue;
		this.#updateUI(steppedValue);
	}

	#updateUI(value) {
		const formattedValue = this.formatNumber(value);
		this.#elm.out.value = formattedValue;
		this.#elm.in.setAttribute('aria-valuenow', value);
		this.#elm.in.setAttribute('aria-valuetext', formattedValue);
	}
}
customElements.define('number-scroller', NumberScroller);