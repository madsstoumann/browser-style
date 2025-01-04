class NumberSpinner extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.adoptedStyleSheets = [stylesheet];
		const attrs = {
			form: '',
			name: '',
			size: 2,
			min: 0,
			max: 100,
			step: 1,
			value: 1,
			label: ''
		};

		Object.keys(attrs).forEach(attr => {
			if (this.hasAttribute(attr)) {
				attrs[attr] = this.getAttribute(attr);
				if (typeof attrs[attr] === 'number') {
					attrs[attr] = Number(attrs[attr]);
				}
			}
		});

		this.shadowRoot.innerHTML = `
			<button type="button" part="dec" tabindex="0">
			<slot name="dec"><svg part="svg" viewBox="0 0 24 24"><path d="M5 12l14 0" /></svg></slot>
			</button>
			<label aria-label="${attrs.label}">
			<input type="number"
				${attrs.form ? `form="${attrs.form}"` : ''}
				${attrs.name ? `name="${attrs.name}"` : ''}
				size="${attrs.size}"
				min="${attrs.min}"
				max="${attrs.max}"
				step="${attrs.step}"
				value="${attrs.value}">
			</label>
			<button type="button" part="inc" tabindex="0">
			<slot name="inc"><svg part="svg" viewBox="0 0 24 24"><path d="M12 5l0 14"/><path d="M5 12l14 0"/></svg></slot>
			</button>
		`;
		this.input = this.shadowRoot.querySelector('input');
		this.internals = this.attachInternals();
		this.addEvents();
	}

	static get formAssociated() {
		return true
	}

	get value() {
		return this.input.value;
	}

	set value(val) {
		this.input.value = val;
		this.internals.setFormValue(val, this.getAttribute('name'));
	}

	get valueAsNumber() {
		return this.input.valueAsNumber;
	}

	addEvents() {
		const [dec, inc] = this.shadowRoot.querySelectorAll('button');
		const dispatch = () => {
			this.dispatchEvent(new CustomEvent('change', {
				bubbles: true,
				detail: { value: this.input.valueAsNumber }
			}));
			dec.disabled = this.input.valueAsNumber <= this.input.min;
			inc.disabled = this.input.valueAsNumber >= this.input.max;
			this.value = this.input.valueAsNumber;
		};

		dec.addEventListener('click', () => { this.input.stepDown(); dispatch(); });
		inc.addEventListener('click', () => { this.input.stepUp(); dispatch(); });
		this.input.addEventListener('input', dispatch);
		this.input.addEventListener('change', dispatch);
	}
}

/* === STYLES === */
const stylesheet = new CSSStyleSheet()
stylesheet.replaceSync(`
	:host {
		align-items: center;
		display: flex;
	}
	button, input {
		font-family: var(--number-spinner-ff, inherit);
		font-size: var(--number-spinner-fs, inherit);
	}
	button {
		aspect-ratio: var(--number-spinner-button-asr, 1);
		background-color: var(--number-spinner-button-bg, ButtonFace);
		border: var(--number-spinner-button-b, 0);
		border-radius: var(--number-spinner-button-bdrs, 50%);
		color: var(--number-spinner-button-c, ButtonText);
		display: inline-grid;
		padding: var(--number-spinner-button-p, 1px 6px);
		place-content: center;
		width: var(--number-spinner-button-w, 3ch);
		&[disabled] {
			color: var(--number-spinner-button-c--disabled, GrayText);
		}
		@media ( hover: hover ) {
			&:hover {
				background-color: var(--number-spinner-button-bg--hover, 
				light-dark(
					color-mix(in srgb, ButtonFace, #000 5%),
					color-mix(in srgb, ButtonFace, #FFF 10%)
				));
			}
		}
	}
	input {
		background: #0000;
		border: 0;
		text-align: center;
	}
	input::-webkit-outer-spin-button,
	input::-webkit-inner-spin-button {
		-webkit-appearance: none;
	}
	[part=svg] {
		aspect-ratio: 1;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
		width: 100%;
	}
`);

customElements.define('number-spinner', NumberSpinner);
