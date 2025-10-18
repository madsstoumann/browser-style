const styles = new CSSStyleSheet();
styles.replaceSync(`
	:host { container-type: inline-size; }
	b {
		background: var(--number-spinner-snap-minor-bg, #CCC);
		border-radius: var(--number-scroller-snap-minor-bdrs, 1px);
		display: block;
		height: var(--number-scroller-snap-minor-h, 70%);
		scroll-snap-align: center;
		width: var(--number-scroller-snap-minor-w, 1px);
	}
	:host([snap-to=value]) b[data-value],
	:host([snap-major-interval="2"]) b:nth-of-type(2n+1),
	:host([snap-major-interval="3"]) b:nth-of-type(3n+1),
	:host([snap-major-interval="4"]) b:nth-of-type(4n+1),
	:host([snap-major-interval="5"]) b:nth-of-type(5n+1),
	:host([snap-major-interval="10"]) b:nth-of-type(10n+1) {
		background: var(--number-spinner-snap-major-bg, #CCC);
		border-radius: var(--number-scroller-snap-major-bdrs, 1px);
		height: var(--number-scroller-snap-major-h, 100%);
		width: var(--number-scroller-snap-major-w, 2px);
	}
	fieldset {
		border: 0;
		display: grid;
		font-family: var(--number-scroller-ff, ui-sans-serif, system-ui);
		margin: 0;
		padding: 0;
		row-gap: var(--number-scroller-fieldset-rg, 1rem);
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
		color: var(--number-scroller-label-c, inherit);
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: 1fr min-content;
		position: relative;
		row-gap: var(--number-spinner-label-rg, .25rem);

		&::after {
			background: var(--number-scroller-indicator-bg, hsl(219, 79%, 66%));
			border-radius: var(--number-scroller-indicator-bdrs, 3px);
			content: "";
			display: block;
			grid-area: 1 / 1;
			height: var(--number-scroller-indicator-h, 2rem);
			isolation: isolate;
			place-self: center;
			pointer-events: none;
			width: var(--number-scroller-indicator-w, 5px);
		}
		&::before { 
			background: var(--number-scroller-triangle-bg, hsl(219, 79%, 6%));
			clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
			content: "";
			display: block;
			height: var(--number-scroller-triangle-h, 5px);
			place-self: end center;
			pointer-events: none;
			width: var(--number-scroller-triangle-w, 10px);
		}
		&:has(:focus-visible) {
			outline: 1px solid var(--number-scroller-focus-outline-c, #CCC);
			outline-offset: 4px;
		}
	}
	legend {
		color: var(--number-scroller-legend-c, inherit);
		display: contents;
		font-weight: var(--number-scroller-legend-fw, 400);
		font-size: var(--number-scroller-legend-fs, .75rem);
	}
	output {
		color: var(--number-scroller-out-c, inherit);
		font-size: var(--number-scroller-out-fs, 2rem);
		font-variant-numeric: tabular-nums;
		font-weight: var(--number-scroller-out-fw, 600);
		text-box: cap alphabetic;
	}
	span[part=scroll] {
		cursor: col-resize;
		display: block;
		grid-area: 1 / 1 / 1 / 1;
		inset: 0;
		mask: var(--number-scroller-mask, linear-gradient(to right, #0000, #000 15%, #000 85%, #0000));
		overflow-x: auto;
		overscroll-behavior: none;
		position: absolute;
		scrollbar-width: none;
		scroll-snap-type: x proximity;
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
	/* snap-to */
	:host([snap-to=none]) span[part=scroll-snap] {
		scroll-snap-type: none;
		b { scroll-snap-align: none; }
	}
	:host([snap-to=value]) b:not([data-value]),
	:host([snap-major-interval="2"][snap-to=major]) b:not(:nth-of-type(2n+1)),
	:host([snap-major-interval="3"][snap-to=major]) b:not(:nth-of-type(3n+1)),
	:host([snap-major-interval="4"][snap-to=major]) b:not(:nth-of-type(4n+1)),
	:host([snap-major-interval="5"][snap-to=major]) b:not(:nth-of-type(5n+1)),
	:host([snap-major-interval="10"][snap-to=major]) b:not(:nth-of-type(10n+1)) {
		scroll-snap-align: none;
	}
`);
export default class NumberScroller extends HTMLElement {
	#cfg = {};
	#currentValue = null;
	#elm = {};
	#isDown = false;
	#isResizing = false;
	#middleStart = 0;
	#middleWidth = 0;
	#resizeObserver;
	#resizeTimeout;
	#root;
	#scrollBgWidth = 0;
	#scrollLeft;
	#snapValues = null;
	#startX;
	#viewportCenter = 0;

	get #incRange() {
		return this.#cfg.max - this.#cfg.min;
	}

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
			label: this.getAttribute('label') || 'Number Scroller',
			lang: this.getAttribute('lang') || document.documentElement.lang || 'en-US',
			max: parseInt(this.getAttribute('max') || '100', 10),
			min: parseInt(this.getAttribute('min') || '0', 10),
			scrollMultiplier: parseFloat(this.getAttribute('scroll-multiplier') || '1.5'),
			scrollWidth: Math.max(200, parseInt(this.getAttribute('scroll-width') || '200', 10)),
			step: parseInt(this.getAttribute('step') || '1', 10),
			unit: this.getAttribute('unit'),
			value: parseInt(this.getAttribute('value') || '0', 10),
		};

		const snapValuesAttr = this.getAttribute('snap-values');
		if (snapValuesAttr) {
			this.#snapValues = snapValuesAttr.split(',').map(v => parseInt(v.trim(), 10)).filter(v => !isNaN(v));
		}
		const snapPointsAttr = this.getAttribute('snap-points');
		this.#cfg.snapPoints = snapPointsAttr !== null
			? parseInt(snapPointsAttr, 10)
			: Math.floor((this.#cfg.max - this.#cfg.min) / this.#cfg.step);

		const snapMarkup = this.#buildSnapMarkup();
		this.#root.innerHTML = `
			<fieldset>
				<legend>${this.#cfg.label}</legend>
				<output name="out">${this.formatNumber(this.#cfg.value)}</output>
				<label aria-label="${this.#cfg.label}">
					<input type="range" name="in" min="${this.#cfg.min}" step="${this.#cfg.step}" max="${this.#cfg.max}" value="${this.#cfg.value}">
					<span part="scroll">
						<span part="scroll-bg">
							<span part="scroll-snap">${snapMarkup}</span>
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
		this.#setupResizeObserver();
		this.#setSnapLinePadding();
	}

	set snapValues(arr) {
		if (Array.isArray(arr)) {
			this.#snapValues = arr.map(v => parseInt(v, 10)).filter(v => !isNaN(v));
			this.#updateSnapLines();
		}
	}
	get snapValues() {
		return this.#snapValues;
	}

	#buildSnapMarkup() {
		if (this.#snapValues && this.#snapValues.length) {
			const count = Math.floor((this.#cfg.max - this.#cfg.min) / this.#cfg.step);
			return Array.from({ length: count + 1 }).map((_, i) => {
				const val = this.#cfg.min + i * this.#cfg.step;
				if (this.#snapValues.includes(val)) {
					return `<b data-value="${val}"></b>`;
				}
				return `<b></b>`;
			}).join('');
		}
		return Array.from({ length: this.#cfg.snapPoints + 1 }).map(() => `<b></b>`).join('');
	}

	#updateSnapLines() {
		if (this.#elm.snap) {
			this.#elm.snap.innerHTML = this.#buildSnapMarkup();
			this.#setSnapLinePadding();
		}
	}

	#setupResizeObserver() {
		this.#resizeObserver = new ResizeObserver(() => {
			const currentValue = this.#elm.in.value;
			this.#isResizing = true;
			this.#updateScrollDimensions();
			this.#elm.scroller.scrollLeft = this.#valueToScrollLeft(currentValue);

			clearTimeout(this.#resizeTimeout);
			this.#resizeTimeout = setTimeout(() => {
				this.#updateUI(currentValue, true);
				this.#isResizing = false;
			}, 100);
		});
		this.#resizeObserver.observe(this.#elm.scroller);
	}

	disconnectedCallback() {
		if (this.#resizeObserver) {
			this.#resizeObserver.disconnect();
		}
	}

	addEvents() {
		this.#elm.app.addEventListener('input', (e) => {
			if (e.target === this.#elm.in) {
				this.updateFromInput();
			}
		});

		this.#elm.scroller.addEventListener('scroll', () => this.updateFromScroll());
		this.#elm.scroller.addEventListener('scrollend', () => this.updateFromScroll());
		this.#elm.scroller.addEventListener('pointerdown', this.onPointerDown.bind(this));
		this.#elm.scroller.addEventListener('pointerleave', this.onPointerEnd.bind(this));
		this.#elm.scroller.addEventListener('pointerup', this.onPointerEnd.bind(this));
		this.#elm.scroller.addEventListener('pointermove', this.onPointerMove.bind(this));
	}

	formatNumber(num) {
		if (this.#cfg.format === 'integer') {
			return String(Math.round(num));
		}
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
	}

	onPointerDown(e) {
		this.#isDown = true;
		this.#elm.scroller.classList.add('grabbing');
		this.#startX = e.pageX - this.#elm.scroller.offsetLeft;
		this.#scrollLeft = this.#elm.scroller.scrollLeft;
	}

	onPointerEnd() {
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

	#updateScrollDimensions() {
		this.#scrollBgWidth = this.#elm.scroller.scrollWidth;
		const clientWidth = this.#elm.scroller.clientWidth;
		this.#viewportCenter = clientWidth / 2;
		this.#middleStart = this.#viewportCenter;
		this.#middleWidth = this.#scrollBgWidth - clientWidth;
		this.#setSnapLinePadding();
	}

	#setSnapLinePadding() {
		if (this.#elm.snap) {
			this.#elm.snap.style.width = `${this.#middleWidth}px`;
			this.#elm.snap.style.marginLeft = `${this.#middleStart}px`;
			this.#elm.snap.style.marginRight = `${this.#middleStart}px`;
		}
	}

	#valueToScrollLeft(value) {
		const percentage = (value - this.#cfg.min) / this.#incRange;
		const indicatorPos = this.#middleStart + (percentage * this.#middleWidth);
		return indicatorPos - this.#viewportCenter;
	}

	#scrollLeftToValue() {
		const indicatorPos = this.#elm.scroller.scrollLeft + this.#viewportCenter;
		const percentage = (indicatorPos - this.#middleStart) / this.#middleWidth;
		const value = this.#cfg.min + (percentage * this.#incRange);
		return Math.round(value / this.#cfg.step) * this.#cfg.step;
	}

	updateFromInput() {
		const value = this.#elm.in.value;
		this.#updateUI(value);
		this.#updateScrollDimensions();
		this.#elm.scroller.scrollLeft = this.#valueToScrollLeft(value);
	}

	updateFromScroll() {
		if (this.#isResizing) return;
		const steppedValue = this.#scrollLeftToValue();
		this.#updateUI(steppedValue);
	}

	#updateUI(value, force = false) {
		if (this.#isResizing && !force) return;
		const formattedValue = this.formatNumber(value);
		this.#elm.out.value = formattedValue;
		this.#elm.in.value = value;
		this.#elm.in.setAttribute('aria-valuenow', value);
		this.#elm.in.setAttribute('aria-valuetext', formattedValue);

		// Dispatch event only if value actually changed
		if (this.#currentValue !== value) {
			this.#currentValue = value;
			this.dispatchEvent(new Event('input', { bubbles: true }));
		}
	}
}
customElements.define('number-scroller', NumberScroller);