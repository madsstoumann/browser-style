class CircularRange extends HTMLElement {
	static formAssociated = true;
	static #css = `
		:host {
			--circular-range-fill: #0066cc;
			--circular-range-fill-start: var(--circular-range-fill);
			--circular-range-fill-middle: var(--circular-range-fill-start);
			--circular-range-fill-end: var(--circular-range-fill-start);
			--circular-range-indice-gap: 8px;
			--circular-range-thumb: #0066cc;
			--circular-range-track: #f0f0f0;
			--circular-range-track-sz: 1.5rem;
			--_mask: radial-gradient(circle farthest-side at center, #0000 calc(100% - var(--circular-range-track-sz) - 1px), var(--circular-range-fill) calc(100% - var(--circular-range-track-sz)));
			--_start-angle: 0deg;
			--_end-angle: 360deg;
			aspect-ratio: 1;
			display: grid;
			place-items: center;
			max-inline-size: var(--circular-range-mai, 320px);
			touch-action: none;
			width: 100%;
		}

		:host(:focus-visible) {
			outline: 2px solid var(--circular-range-fill);
			outline-offset: 4px;
		}

		:host::before {
			background:
				conic-gradient(
					from calc(var(--_start) * 1deg),
					var(--circular-range-fill-start) 0deg,
					var(--circular-range-fill-middle) calc((var(--_fill) - var(--_start)) * 0.5deg),
					var(--circular-range-fill-end) calc((var(--_fill) - var(--_start)) * 1deg),
					#0000 calc((var(--_fill) - var(--_start)) * 1deg)
				),
				conic-gradient(
					from calc(var(--_start) * 1deg),
					var(--circular-range-track) 0deg,
					var(--circular-range-track) calc((var(--_end) - var(--_start)) * 1deg),
					#0000 calc((var(--_end) - var(--_start)) * 1deg)
				);
			border-radius: 50%;
			content: "";
			grid-area: 1 / 1;
			height: 100%;
			mask: var(--_mask);
			width: 100%;
		}

		:host::after {
			counter-reset: val var(--_value);
			content: counter(val) attr(suffix);
			font-size: 200%;
			font-weight: 700;
			grid-area: 1 / 1;
		}

		range-thumb {
			grid-area: 1 / 1;
			height: 100%;
			pointer-events: none;
			rotate: calc(1deg * var(--_fill, 0));
			width: var(--circular-range-track-sz);
		}

		range-thumb::before {
			aspect-ratio: 1;
			background-color: var(--circular-range-thumb);
			border-radius: 50%;
			box-shadow: 0 0 0 2px Canvas;
			content: '';
			display: block;
			width: 100%;
		}

		/* indices */
		ul {
		aspect-ratio: 1;
	border-radius: 50%;
	grid-area: 1 / 1;
	list-style: none;
	margin:0;
	padding: 0;
	width: calc(100% - var(--circular-range-indice-gap, 0px) - (2 * var(--circular-range-track-sz)));
}
li {
	background: var(--circular-range-indice-c, #999);
	
	display: inline-block;
	height: 8px;
	offset-anchor: top;
	offset-distance: var(--_p, 0%);
	offset-path: content-box;
	width: 2px;
}

	`;

	#min;
	#max;
	#step;
	#startAngle;
	#endAngle;
	#range;
	#angleRange;
	#radian;
	#internals;
	lastValue;
	#CX;
	#CY;

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.#internals = this.attachInternals();
		const sheet = new CSSStyleSheet();
		sheet.replaceSync(CircularRange.#css);
		this.shadowRoot.adoptedStyleSheets = [sheet];
		this.shadowRoot.innerHTML = `<range-thumb></range-thumb><ul>${this.#generateIndices()}</ul>`;
	}

	connectedCallback() {
		this.tabIndex = 0;
		this.#readAttributes();
		this.#update();
		this.addEventListener('keydown', this.#keydown);
		this.addEventListener('pointerdown', this.#pointerdown);
	}

	static get observedAttributes() {
		return ['value'];
	}

	attributeChangedCallback() {
		this.#update();
	}

	get value() {
		return Number(this.getAttribute('value')) || 0;
	}

	set value(newValue) {
		this.#setValue(newValue);
	}

	#readAttributes() {
		this.#min = Number(this.getAttribute('min')) || 0;
		this.#max = Number(this.getAttribute('max')) || 100;
		this.#step = Number(this.getAttribute('step')) || 1;
		this.#startAngle = Number(this.getAttribute('start')) || 0;
		this.#endAngle = Number(this.getAttribute('end')) || 360;
		this.#range = this.#max - this.#min;
		this.#angleRange = this.#endAngle - this.#startAngle;
		this.#radian = this.#angleRange / this.#range;
		this.style.setProperty('--_start', this.#startAngle);
		this.style.setProperty('--_end', this.#endAngle);
	}

	#update() {
		const value = Number(this.getAttribute('value')) || 0;
		const fillPercentage = this.#range > 0 ? (value - this.#min) / this.#range : 0;
		const fillAngle = this.#startAngle + (fillPercentage * this.#angleRange);
		this.style.setProperty('--_value', value);
		this.style.setProperty('--_fill', fillAngle);
	}

	#setValue(newValue) {
		const steppedValue = Math.round((newValue - this.#min) / this.#step) * this.#step + this.#min;
		const clampedValue = Math.max(this.#min, Math.min(this.#max, steppedValue));
		if (this.value === clampedValue) return;
		this.setAttribute('value', clampedValue);
		this.#internals.setFormValue(clampedValue);
		this.dispatchEvent(new Event('input', { bubbles: true }));
	}

	#pointerdown(event) {
		this.setPointerCapture(event.pointerId);
		this.lastValue = Number(this.getAttribute('value')) || 0;
		this.#CX = this.offsetWidth / 2;
		this.#CY = this.offsetHeight / 2;
		this.addEventListener('pointermove', this.#pointerMove);
		this.addEventListener('pointerup', () => this.removeEventListener('pointermove', this.#pointerMove), { once: true });
	}

	#pointerMove(event) {
		const degree = (((Math.atan2(event.offsetY - this.#CY, event.offsetX - this.#CX) * 180 / Math.PI) + 90 + 360) % 360);
		const relativeDegree = (degree - this.#startAngle + 360) % 360;
		let value = (relativeDegree / this.#radian) + this.#min;

		if (this.#angleRange < 360) {
			if (relativeDegree > this.#angleRange) {
				const midGap = (360 - this.#angleRange) / 2;
				this.#setValue(relativeDegree - this.#angleRange < midGap ? this.#max : this.#min);
				return;
			}
		} else {
			if (Math.abs(value - this.lastValue) > this.#range / 2) {
				value = (value > this.lastValue) ? this.#min : this.#max;
			}
		}
		
		this.lastValue = value;
		this.#setValue(value);
	}

	#keydown(event) {
		if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown' && event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
		event.preventDefault();
		const currentValue = Number(this.getAttribute('value')) || this.#min;
		const newValue = currentValue + ((event.key === 'ArrowUp' || event.key === 'ArrowRight') ? this.#step : -this.#step);
		this.#setValue(newValue);
	}

	#generateIndices() {
		const count = parseInt(this.getAttribute('indices')) || 60;
		const step = 100 / count;

		return Array.from({ length: count }, (_, i) => {
			return `<li style="--_p:${i * step}%"></li>`;
		}).join('');
	}
}

customElements.define('circular-range', CircularRange);