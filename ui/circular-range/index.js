class CircularRange extends HTMLElement {
	static formAssociated = true;
	static #css = `
		:host {
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

		*:not([part="thumb"]) { user-select: none; }

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
				from calc(var(--_start) * 1deg),
				var(--circular-range-fill-start) 0deg,
				var(--circular-range-fill-middle) calc((var(--_fill) - var(--_start)) * 0.5deg),
				var(--circular-range-fill-end) calc((var(--_fill) - var(--_start)) * 1deg),
				#0000 calc((var(--_fill) - var(--_start)) * 1deg)
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
			pointer-events: none;
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
			counter-reset: val var(--_value);
			content: counter(val) attr(suffix);
			font-family: var(--circular-range-output-ff);
			font-size: var(--circular-range-output-fs);
			font-weight: var(--circular-range-output-fw);
			grid-column: 1;
			grid-row: var(--circular-range-output-gr);
			text-box: cap alphabetic;
		}

		/* === INDICES === */

		[part="indices"] {
			all: unset;
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
			all: unset;
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
	#max;
	#min;
	#radian;
	#range;
	#shiftStep;
	#startAngle;
	#step;
	lastValue;

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
			<div part="thumb"></div>
			<ul part="indices"></ul>
			<ol part="labels"></ol>
			<slot></slot>`;
	}

	connectedCallback() {
		this.tabIndex = 0;
		this.#readAttributes();
		this.shadowRoot.querySelector('[part="indices"]').innerHTML = this.#generateIndices();
		this.#renderAndPositionLabels();
		this.#update();
		this.#updateActiveLabel();
		this.addEventListener('keydown', this.#keydown);
		this.addEventListener('pointerdown', this.#pointerdown);
	}

	static get observedAttributes() {
		return ['value', 'active-label'];
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) return;
		if (name === 'value') {
			this.#update();
		} else if (name === 'active-label') {
			this.#updateActiveLabel();
		}
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
		this.#shiftStep = Number(this.getAttribute('shift-step')) || this.#step;
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

	#updateActiveLabel() {
		const activeLabelValue = this.getAttribute('active-label');
		const labels = this.shadowRoot.querySelectorAll('[part="labels"] li');

		labels.forEach(label => {
			label.part.remove('active-label');
		});

		if (activeLabelValue) {
			const activeLabel = this.shadowRoot.querySelector(`[part="labels"] li[value="${activeLabelValue}"]`);
			if (activeLabel) {
				activeLabel.part.add('active-label');
			}
		}
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
		const step = event.shiftKey ? this.#shiftStep : this.#step;
		const newValue = currentValue + ((event.key === 'ArrowUp' || event.key === 'ArrowRight') ? step : -step);
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
		const ol = this.shadowRoot.querySelector('[part="labels"]');
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
			li.part.add(`label-${value}`);
			li.textContent = label;

			if (value >= this.#min && value <= this.#max) {
				const degree = ((value - this.#min) * this.#radian) + this.#startAngle;
				const percent = (degree / 360) * 100;
				li.style.setProperty('--_p', `${percent}%`);
			}

			ol.appendChild(li);
		}
	}
}

customElements.define('circular-range', CircularRange);