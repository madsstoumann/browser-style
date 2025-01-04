class NumberSpinner extends HTMLElement {
	static formAssociated = true;

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.adoptedStyleSheets = [stylesheet];

		const attrs = {
			form: this.getAttribute('form'),
			label: this.getAttribute('label') || '',
			max: Number(this.getAttribute('max')) || 100,
			min: Number(this.getAttribute('min')) || 0,
			name: this.getAttribute('name'),
			size: Number(this.getAttribute('size')) || 2,
			step: Number(this.getAttribute('step')) || 1,
			value: Number(this.getAttribute('value')) || 1
		};

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

		this.dec = this.shadowRoot.querySelector('[part=dec]');
		this.inc = this.shadowRoot.querySelector('[part=inc]');
		this.input = this.shadowRoot.querySelector('input');

		this.initialValue = attrs.value;
		this.internals = this.attachInternals();
		this.addEvents();
		this.formReset = this.formReset.bind(this);
	}

	get defaultValue() {
		return this.initialValue;
	}

	get value() {
		return this.input.value;
	}

	set value(val) {
		this.input.value = val;
		this.internals.setFormValue(val, this.getAttribute('name') || val);
	}

	get valueAsNumber() {
		return this.input.valueAsNumber;
	}

	connectedCallback() {
		const form = this.internals.form;
		if (form) {
			form.addEventListener('reset', this.formReset);
		}
	}

	disconnectedCallback() {
		const form = this.internals.form;
		if (form) {
			form.removeEventListener('reset', this.formReset);
		}
	}

	addEvents() {
		this.dec.addEventListener('click', () => { this.input.stepDown(); this.dispatch(); });
		this.inc.addEventListener('click', () => { this.input.stepUp(); this.dispatch(); });
		this.input.addEventListener('change', () => this.dispatch());
	}

	dispatch(eventType = 'change') {
		const value = this.input.valueAsNumber;
		this.dec.disabled = value <= this.input.min;
		this.inc.disabled = value >= this.input.max;
		this.value = value;
		if (eventType === 'reset') return;
		this.dispatchEvent(new Event('change', { bubbles: true }));
	}

	formReset() {
		this.value = this.initialValue;
		this.dispatch('reset');
	}
}

/* === STYLES === */
const stylesheet = new CSSStyleSheet()
stylesheet.replaceSync(`
	:host {
		align-items: center;
		contain: content;
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
		touch-action: manipulation;
		width: var(--number-spinner-button-w, 3ch);
		will-change: background-color; 
		&[disabled] {
			color: var(--number-spinner-button-c--disabled, GrayText);
			cursor: not-allowed;
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
		-moz-appearance: textfield;
		background: #0000;
		border: 0;
		text-align: center;
	}
	input::-webkit-outer-spin-button,
	input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
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
