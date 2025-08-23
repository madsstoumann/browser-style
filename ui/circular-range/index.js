/**
 * @module CircularRange
 * @version 1.0.8
 * @date 2025-08-19
 * @author Mads Stoumann
 * @description A circular range slider custom element with optional indices and labels.
 */
class CircularRange extends HTMLElement {
	static formAssociated = true;
	static #css = `
		:host {
			--circular-range-bg: #0000;
			--circular-range-bg-mask: none;
			--circular-range-bg-scale: 1;
			--circular-range-fill: #0066cc;
			--circular-range-fill-end: var(--circular-range-fill);
			--circular-range-fill-middle: var(--circular-range-fill);
			--circular-range-fill-start: var(--circular-range-fill);
			--circular-range-indice-bdrs: 0;
			--circular-range-indice-c: #999;
			--circular-range-indice-h: 5px;
			--circular-range-indice-w: 1px;
			--circular-range-indices-w: 80%;
			--circular-range-labels-c: light-dark(#333, #CCC);
			--circular-range-labels-fs: x-small;
			--circular-range-labels-w: 70%;
			--circular-range-output-as: end;
			--circular-range-output-c: inherit;
			--circular-range-output-ff: inherit;
			--circular-range-output-fs: 200%;
			--circular-range-output-fw: 700;
			--circular-range-output-gr: 2;
			--circular-range-rows: 5;
			--circular-range-thumb: var(--circular-range-fill);
			--circular-range-thumb-min: #e0e0e0;
			--circular-range-thumb-bxsh: 0 0 0 2px Canvas;
			--circular-range-thumb-bxsh-focus: 0 0 0 2px Canvas;
			--circular-range-track: #f0f0f0;
			--circular-range-track-sz: 1.5rem;
			--circular-range-maw: 320px;

			--_ga: 1 / 1 / calc(var(--circular-range-rows) + 1) / 1;
			--_mask: radial-gradient(circle farthest-side at center, #0000 calc(100% - var(--circular-range-track-sz) - 1px), var(--circular-range-fill) calc(100% - var(--circular-range-track-sz)));
			--_fill-start-angle: var(--_start);
			--_fill-end-angle: var(--_fill);

			aspect-ratio: 1;
			display: grid;
			grid-template-rows: repeat(var(--circular-range-rows), 1fr);
			max-width: var(--circular-range-maw);
			place-items: center;
			touch-action: none;
			user-select: none;
			width: var(--circular-range-w, 100%);
		}

		[part]:not([part="thumb"]) { 
			pointer-events: none; 
			user-select: none;
			-webkit-user-select: none;
		}
		::slotted(*) { 
			pointer-events: none; 
			user-select: none;
			-webkit-user-select: none;
		}
		
		/* Prevent selection on all pseudo-elements */
		::before, ::after {
			user-select: none;
			-webkit-user-select: none;
		}

		:host(:focus-visible) {
			outline: 0;
			[part="fill"] { opacity: .65; }
			[part="thumb"]::before {
				box-shadow: var(--circular-range-thumb-bxsh-focus);
				scale: 1.2;
			}
		}

		/* === TRACK AND FILL === */

		[part="fill"],
		[part="track"] {
			border-radius: 50%;
			grid-area: var(--_ga);
			height: 100%;
			mask: var(--_mask);
			width: 100%;
		}

		[part="fill"] {
			background: conic-gradient(
				from calc(var(--_fill-start) * 1deg),
				var(--circular-range-fill-start) 0deg,
				var(--circular-range-fill-middle) calc(var(--_fill-range) * 0.5deg),
				var(--circular-range-fill-end) calc(var(--_fill-range) * 1deg),
				#0000 calc(var(--_fill-range) * 1deg)
			);
			transition: all 0.2s ease-in-out;
			&::before {
				background: var(--circular-range-fill);
				offset-distance: var(--_tb);
			}
		}

		[part="track"] {
			background: conic-gradient(
				from calc(var(--_start) * 1deg),
				var(--circular-range-track) 0deg,
				var(--circular-range-track) calc((var(--_end) - var(--_start)) * 1deg),
				#0000 calc((var(--_end) - var(--_start)) * 1deg)
			);
			&::before {
				background: var(--circular-range-track);
				offset-distance: var(--_tb);
			}
			&::after {
				background: var(--circular-range-track);
				offset-distance: var(--_ta); }
			}

		[part="fill"]::before,
		[part="track"]::before,
		[part="track"]::after {
			border-radius: 50%;
			content: '';
			display: block;
			height: var(--circular-range-track-sz);
			offset-anchor: top;
    	offset-path: content-box;
			width: var(--circular-range-track-sz);
		}

		/* === THUMB === */

		[part="thumb"] {
			grid-area: var(--_ga);
			height: 100%;
			rotate: calc(1deg * var(--_fill, 0));
			width: var(--circular-range-track-sz);
			will-change: transform;
			&::before {
				aspect-ratio: 1;
				background-color: var(--circular-range-thumb);
				border-radius: 50%;
				box-shadow: var(--circular-range-thumb-bxsh);
				content: '';
				display: block;
				transition: all 0.2s ease-in-out;
				width: 100%;
			}
		}

		:host(.at-min) [part="thumb"]::before {
			background-color: var(--circular-range-thumb-min);
		}

		/* === VALUE === */

		:host::after {
			align-self: var(--circular-range-output-as);
			color: var(--circular-range-output-c);
			counter-reset: val var(--_value);
			content: counter(val) attr(suffix);
			font-family: var(--circular-range-output-ff);
			font-size: var(--circular-range-output-fs);
			font-weight: var(--circular-range-output-fw);
			grid-column: 1;
			grid-row: var(--circular-range-output-gr);
			isolation: isolate;
			pointer-events: none;
			text-box: cap alphabetic;
		}

		/* === OPTIONAL BACKGROUND LAYER === */

		:host::before {
			background: var(--circular-range-bg);
			border-radius: 50%;
			content: '';
			display: block;
			grid-area: var(--_ga);
			height: 100%;
			mask: var(--circular-range-bg-mask);
			scale: var(--circular-range-bg-scale);
			width: 100%;
		}

		/* === INDICES === */

		[part="indices"] {
			aspect-ratio: 1;
			border-radius: 50%;
			grid-area: var(--_ga);
			padding: 0;
			width: var(--circular-range-indices-w);
			li {
				background: var(--circular-range-indice-c);
				border-radius: var(--circular-range-indice-bdrs);
				display: inline-block;
				height: var(--circular-range-indice-h);
				offset-anchor: top;
				offset-distance: var(--_p, 0%);
				offset-path: content-box;
				width: var(--circular-range-indice-w);
			}
		}

		/* === LABELS === */

		[part="labels"] {
			aspect-ratio: 1;
			border-radius: 50%;
			color: var(--circular-range-labels-c);
			font-size: var(--circular-range-labels-fs);
			grid-area: var(--_ga);
			padding: 0;
			width: var(--circular-range-labels-w);
			li {
				display: inline-block;
				offset-anchor: top;
				offset-distance: var(--_p, 0%);
				offset-path: content-box;
				offset-rotate: 0deg;
			}
		}
	`;

	#angleRange;
	#CX;
	#CY;
	#endAngle;
	#internals;
	#lastValue;
	#max;
	#min;
	#radian;
	#range;
	#reverse;
	#shiftStep;
	#startAngle;
	#step;
	#isSafari;
	#safariVisHandler;
	#safariPageShowHandler;

	constructor() {
		super();
		this.#isSafari = /Safari\//.test(navigator.userAgent) && !/(Chrome|Chromium|Edg|OPR|CriOS|FxiOS)/.test(navigator.userAgent);
		this.attachShadow({ mode: 'open' });
		this.#internals = this.attachInternals();
		const sheet = new CSSStyleSheet();
		sheet.replaceSync(CircularRange.#css);
		this.shadowRoot.adoptedStyleSheets = [sheet];
		this.shadowRoot.innerHTML = `
			<div part="track"></div>
			<div part="fill"></div>
			<div part="thumb"></div>
			<ul part="indices"></ul>
			<ol part="labels"></ol>
			<slot></slot>`;
	}

	connectedCallback() {
		this.tabIndex = 0;
		this.#readAttributes();
		this.#convertInitialValue();
		this.shadowRoot.querySelector('[part="indices"]').innerHTML = this.#generateIndices();
		this.#renderLabels();
		this.setAttribute('role', 'slider');
		/* Small setTimeout-hack to ensure styles are applied before the first update */
		setTimeout(() => {
			this.#update();
			this.#updateActiveLabel();
			const value = Number(this.getAttribute('value')) || 0;
			this.#internals.setFormValue(value);
			this.classList.toggle('at-min', this.hasAttribute('enable-min') && value === this.#min);
			if (this.#isSafari) this.#safariRepaint();
		});

		if (this.#isSafari) {
			this.#safariVisHandler = () => { if (!document.hidden) this.#safariRepaint(); };
			this.#safariPageShowHandler = () => this.#safariRepaint();
			document.addEventListener('visibilitychange', this.#safariVisHandler);
			window.addEventListener('pageshow', this.#safariPageShowHandler);
		}
		this.addEventListener('keydown', this.#keydown);
		this.addEventListener('pointerdown', this.#pointerdown);
	}

	disconnectedCallback() {
		this.removeEventListener('keydown', this.#keydown);
		this.removeEventListener('pointerdown', this.#pointerdown);
		if (this.#isSafari) {
			document.removeEventListener('visibilitychange', this.#safariVisHandler);
			window.removeEventListener('pageshow', this.#safariPageShowHandler);
		}
	}

	static get observedAttributes() { return ['value', 'active-label']; }

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) return;
		if (name === 'value') {
			this.#update();
		} else if (name === 'active-label') {
			this.#updateActiveLabel();
		}
	}

	get value() {
		const value = Number(this.getAttribute('value')) || 0;
		return this.#reverse ? this.#min + this.#max - value : value;
	}

	set value(newValue) {
		const normalizedValue = this.#reverse ? this.#min + this.#max - newValue : newValue;
		this.#setValue(normalizedValue);
	}

	get valueAsNumber() {
		return Number(this.value);
	}

	get name() { return this.getAttribute('name') ?? ''; }

	set name(newName) {
		if (newName === null || newName === undefined) {
			this.removeAttribute('name');
		} else {
			this.setAttribute('name', String(newName));
		}
	}

	#readAttributes() {
		this.#min = Number(this.getAttribute('min')) || 0;
		this.#max = Number(this.getAttribute('max')) || 100;
		this.setAttribute('aria-valuemin', this.#min);
		this.setAttribute('aria-valuemax', this.#max);
		this.#reverse = this.hasAttribute('reverse');
		this.#step = Number(this.getAttribute('step')) || 1;
		this.#shiftStep = Number(this.getAttribute('shift-step')) || this.#step;
		this.#startAngle = Number(this.getAttribute('start')) || 0;
		this.#endAngle = Number(this.getAttribute('end')) || 360;
		this.#range = this.#max - this.#min;
		this.#angleRange = this.#endAngle - this.#startAngle;
		this.#radian = this.#angleRange / this.#range;
		this.style.setProperty('--_start', this.#startAngle);
		this.style.setProperty('--_end', this.#endAngle);

		if (this.#reverse) {
			this.style.setProperty('--_tb', `${(this.#endAngle / 360) * 100}%`);
			this.style.setProperty('--_ta', `${(this.#startAngle / 360) * 100}%`);
		} else {
			this.style.setProperty('--_tb', `${(this.#startAngle / 360) * 100}%`);
			this.style.setProperty('--_ta', `${(this.#endAngle / 360) * 100}%`);
		}
	}

	#convertInitialValue() {
		if (this.#reverse && this.hasAttribute('value')) {
			const userValue = Number(this.getAttribute('value')) || 0;
			const internalValue = this.#min + this.#max - userValue;
			this.setAttribute('value', internalValue);
		}
	}

	#update() {
		const value = Number(this.getAttribute('value')) || 0;
		const displayValue = this.#reverse ? this.#min + this.#max - value : value;
		this.setAttribute('aria-valuenow', displayValue);
		const fillPercentage = this.#range > 0 ? (value - this.#min) / this.#range : 0;
		const fillAngle = this.#startAngle + (fillPercentage * this.#angleRange);
		this.style.setProperty('--_value', displayValue);
		this.style.setProperty('--_fill', fillAngle);

		if (this.#reverse) {
			this.style.setProperty('--_fill-start', fillAngle);
			this.style.setProperty('--_fill-range', this.#endAngle - fillAngle);
		} else {
			this.style.setProperty('--_fill-start', this.#startAngle);
			this.style.setProperty('--_fill-range', fillAngle - this.#startAngle);
		}
	}

	#safariRepaint() {
		const v = this.getAttribute('value') ?? '0';
		this.getBoundingClientRect();
		this.style.setProperty('--_invalidate', performance.now().toString());
		this.setAttribute('value', v);
	}

	#setValue(newValue) {
		const steppedValue = Math.round((newValue - this.#min) / this.#step) * this.#step + this.#min;
		const clampedValue = Math.max(this.#min, Math.min(this.#max, steppedValue));
		if (this.value === clampedValue) return;
		this.setAttribute('value', clampedValue);
		this.#internals.setFormValue(clampedValue);

		this.classList.toggle('at-min', this.hasAttribute('enable-min') && clampedValue === this.#min);
		this.dispatchEvent(new Event('input', { bubbles: true }));
	}

	#updateActiveLabel() {
		const activeLabelValue = this.getAttribute('active-label');
		const labels = this.shadowRoot.querySelectorAll('[part="labels"] li');
		labels.forEach(label => label.part.remove('active-label'));
		if (activeLabelValue) {
			const activeLabel = this.shadowRoot.querySelector(`[part="labels"] li[value="${activeLabelValue}"]`);
			if (activeLabel) activeLabel.part.add('active-label');
		}
	}

	#pointerdown(event) {
		this.setPointerCapture(event.pointerId);
		this.#lastValue = Number(this.getAttribute('value')) || 0;
		this.#CX = this.offsetWidth / 2;
		this.#CY = this.offsetHeight / 2;
		this.#pointerMove(event);
		this.addEventListener('pointermove', this.#pointerMove);
		this.addEventListener('pointerup', () => this.removeEventListener('pointermove', this.#pointerMove), { once: true });
	}

	#pointerMove(event) {
		const degree = (((Math.atan2(event.offsetY - this.#CY, event.offsetX - this.#CX) * 180 / Math.PI) + 90 + 360) % 360);
		const relativeDegree = (degree - this.#startAngle + 360) % 360;
		let value = (relativeDegree / this.#radian) + this.#min;

		if (this.#angleRange < 360) {
			if (relativeDegree > this.#angleRange) {
				this.#setValue(relativeDegree - this.#angleRange < (360 - this.#angleRange) / 2 ? this.#max : this.#min);
				return;
			}
		} else if (Math.abs(value - this.#lastValue) > this.#range / 2) {
			value = value > this.#lastValue ? this.#min : this.#max;
		}

		this.#lastValue = value;
		this.#setValue(value);
	}

	#keydown(event) {
		if (!event.key.startsWith('Arrow')) return;
		event.preventDefault();
		const step = event.shiftKey ? this.#shiftStep : this.#step;
		const increment = (event.key === 'ArrowUp' || event.key === 'ArrowRight') ? step : -step;
		this.#setValue((Number(this.getAttribute('value')) || this.#min) + increment);
	}

	#generateIndices() {
		const count = parseInt(this.getAttribute('indices')) || 0;
		if (count === 0) return '';
		const startPercent = this.#startAngle / 360 * 100;
		const rangePercent = this.#angleRange / 360 * 100;
		const step = rangePercent / (count - 1);
		return Array.from({ length: count }, (_, i) => 
			`<li style="--_p:${startPercent + (i * step)}%"></li>`
		).join('');
	}

	#renderLabels() {
		const labels = this.getAttribute('labels');
		if (!labels) return;
		const ol = this.shadowRoot.querySelector('[part="labels"]');
		ol.setAttribute('aria-hidden', 'true');
		ol.innerHTML = '';

		const labelsArray = labels.split(',');
		const totalLabels = labelsArray.length;
		const stepSize = this.#range / (totalLabels - 1);

		labelsArray.forEach((pair, index) => {
			const [valueRaw, labelRaw] = pair.split(':');
			if (!valueRaw?.trim() || !labelRaw?.trim()) return;
			
			const value = Number(valueRaw.trim());
			if (value < this.#min || value > this.#max) return;

			const li = document.createElement('li');
			li.setAttribute('value', value);
			li.part.add(`label-${value}`);
			li.textContent = labelRaw.trim();

			const positionValue = this.#reverse 
				? this.#min + ((totalLabels - 1 - index) * stepSize)
				: value;
			
			const degree = ((positionValue - this.#min) * this.#radian) + this.#startAngle;
			li.style.setProperty('--_p', `${(degree / 360) * 100}%`);

			ol.appendChild(li);
		});
	}
}

customElements.define('circular-range', CircularRange);
export default CircularRange;