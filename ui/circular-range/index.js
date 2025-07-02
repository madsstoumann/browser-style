class CircularRange extends HTMLElement {
	static formAssociated = true;
	static #css = `
		:host {
			--circular-range-fill: #0066cc;
			--circular-range-fill-end: var(--circular-range-fill);
			--circular-range-fill-middle: var(--circular-range-fill);
			--circular-range-fill-start: var(--circular-range-fill);
			--circular-range-indice-bdrs: 0;
			--circular-range-indice-c: #d9d9d9;
			--circular-range-indice-h: 5px;
			--circular-range-indice-w: 1px;
			--circular-range-indices-w: 80%;
			--circular-range-labels-w: 70%;
			--circular-range-output-ff: inherit;
			--circular-range-output-fs: 200%;
			--circular-range-output-fw: 700;
			--circular-range-output-gr: 2;
			--circular-range-rows: 5;
			--circular-range-thumb: #0066cc;
			--circular-range-thumb-min: #e0e0e0;
			--circular-range-track: #f0f0f0;
			--circular-range-track-sz: 1.5rem;
			--circular-range-w: 320px;

			--_ga: 1 / 1 / calc(var(--circular-range-rows) + 1) / 1;
			--_mask: radial-gradient(circle farthest-side at center, #0000 calc(100% - var(--circular-range-track-sz) - 1px), var(--circular-range-fill) calc(100% - var(--circular-range-track-sz)));

			aspect-ratio: 1;
			display: grid;
			grid-template-rows: repeat(var(--circular-range-rows), 1fr);
			place-items: center;
			touch-action: none;
			width: var(--circular-range-w);
		}

		:host(:focus-visible) {
			outline: 2px solid var(--circular-range-fill);
			outline-offset: 4px;
		}

		[part="track"],
		[part="fill"] {
			border-radius: 50%;
			grid-area: var(--_ga);
			height: 100%;
			mask: var(--_mask);
			width: 100%;
		}

		[part="track"] {
			background: conic-gradient(
				from calc(var(--_start) * 1deg),
				var(--circular-range-track) 0deg,
				var(--circular-range-track) calc((var(--_end) - var(--_start)) * 1deg),
				#0000 calc((var(--_end) - var(--_start)) * 1deg)
			);
		}

		[part="fill"]::before,
		[part="track"]::before,
		[part="track"]::after {
			background: var(--circular-range-track);
			border-radius: 50%;
			content: '';
			display: block;
			height: var(--circular-range-track-sz);
			offset-anchor: top;
    	offset-path: content-box;
			width: var(--circular-range-track-sz);
		}

		[part="fill"]::before {
			background: var(--circular-range-fill-start);
			offset-distance: var(--_tb);
		}

		[part="track"]::before { offset-distance: var(--_tb); }
		[part="track"]::after {offset-distance: var(--_ta); }

		:host(.at-min) range-thumb::before {
			background-color: var(--circular-range-thumb-min);
		}

		[part="fill"] {
			background: conic-gradient(
				from calc(var(--_start) * 1deg),
				var(--circular-range-fill-start) 0deg,
				var(--circular-range-fill-middle) calc((var(--_fill) - var(--_start)) * 0.5deg),
				var(--circular-range-fill-end) calc((var(--_fill) - var(--_start)) * 1deg),
				#0000 calc((var(--_fill) - var(--_start)) * 1deg)
			);
		}

		/* value counter */
		:host::after {
			align-self: end;
			counter-reset: val var(--_value);
			content: counter(val) attr(suffix);
			font-family: var(--circular-range-output-ff);
			font-size: var(--circular-range-output-fs);
			font-weight: var(--circular-range-output-fw);
			grid-column: 1;
			grid-row: var(--circular-range-output-gr);
			text-box: cap alphabetic;
		}

		range-thumb {
			grid-area: var(--_ga);
			height: 100%;
			pointer-events: none;
			rotate: calc(1deg * var(--_fill, 0));
			width: var(--circular-range-track-sz);
			will-change: transform;
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
			all: unset;
			aspect-ratio: 1;
			border-radius: 50%;
			grid-area: var(--_ga);
			padding: 0;
			width: var(--circular-range-indices-w);
			& > li {
				background: var(--circular-range-indice-c);
				border-radius: var(--circular-range-indice-bdrs);
				height: var(--circular-range-indice-h);
				width: var(--circular-range-indice-w);
			}
		}

		li {
			display: inline-block;
			offset-anchor: top;
			offset-distance: var(--_p, 0%);
			offset-path: content-box;
			user-select: none;
		}

		/* digits */
		ol {
			all: unset;
			aspect-ratio: 1;
			border-radius: 50%;
			font-size: x-small;
			grid-area: var(--_ga);
			padding: 0;
			width: var(--circular-range-labels-w);
			& > li { offset-rotate: 0deg; }
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
		this.shadowRoot.innerHTML = `
			<div part="track"></div>
			<div part="fill"></div>
			<range-thumb></range-thumb>
			<ol></ol>
			<ul></ul>
			<slot></slot>`;
	}

	connectedCallback() {
		this.tabIndex = 0;
		this.#readAttributes();
		this.shadowRoot.querySelector('ul').innerHTML = this.#generateIndices();
		this.#renderAndPositionLabels();
		this.#update();
		this.addEventListener('keydown', this.#keydown);
		this.addEventListener('pointerdown', this.#pointerdown);
	}

	static get observedAttributes() {
		return ['value', 'labels'];
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) return;
		if (name === 'labels') {
			this.#renderAndPositionLabels();
		}
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
		this.style.setProperty('--_tb', `${(this.#startAngle / 360) * 100}%`);
		this.style.setProperty('--_ta', `${(this.#endAngle / 360) * 100}%`);
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

		this.classList.toggle('at-min', this.hasAttribute('enable-min') && clampedValue === this.#min);
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
		const count = parseInt(this.getAttribute('indices')) || 0;
		if (count === 0) return '';
		const startPercent = this.#startAngle / 360 * 100;
		const rangePercent = this.#angleRange / 360 * 100;
		const step = rangePercent / (count - 1);

		return Array.from({ length: count }, (_, i) => {
			return `<li style="--_p:${startPercent + (i * step)}%"></li>`;
		}).join('');
	}

	#renderAndPositionLabels() {
		const labelsAttr = this.getAttribute('labels');
		const ol = this.shadowRoot.querySelector('ol');
		if (!ol) return;

		ol.innerHTML = '';
		if (!labelsAttr) return;

		const pairs = labelsAttr.split(',').map(pair => pair.split(':'));
		for (let i = 0; i < pairs.length; i++) {
			const [valueRaw, labelRaw] = pairs[i];
			if (valueRaw === undefined || labelRaw === undefined) continue;
			const value = Number(valueRaw.trim());
			const label = labelRaw.trim();
			const li = document.createElement('li');
			li.setAttribute('value', value);
			li.textContent = label;

			if (i === 0) {
				li.part.add('first-label');
			}
			if (i === pairs.length - 1) {
				li.part.add('last-label');
			}

			if (!isNaN(value)) {
				const percent = this.#range > 0 ? (value - this.#min) / this.#range : 0;
				const angle = this.#startAngle + percent * this.#angleRange;
				const arcPercent = angle / 360 * 100;
				li.style.setProperty('--_p', `${arcPercent}%`);
			}
			ol.appendChild(li);
		}
	}
}

customElements.define('circular-range', CircularRange);