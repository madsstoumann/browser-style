import { FormControl } from '../../../formControl.js';

export class NumberSpinner extends FormControl {
	constructor() {
		super();
	}

	initializeComponent() {
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

		this.root.innerHTML = `
			<button type="button" part="dec" tabindex="0">
				<slot name="dec"><svg part="svg" viewBox="0 0 24 24"><path d="M5 12l14 0" /></svg></slot>
			</button>
			<label aria-label="${attrs.label}">
			<input type="number"
				${attrs.form ? `form="${attrs.form}` : ''}
				${attrs.name ? `name="${attrs.name}` : ''}
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

		this.dec = this.root.querySelector('[part=dec]');
		this.inc = this.root.querySelector('[part=inc]');
		this.input = this.root.querySelector('input');
		this.initialValue = attrs.value;
		this.addEvents();
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
		super.value = value;
		if (eventType === 'reset') return;
		this.dispatchEvent(new Event('change', { bubbles: true }));
	}

	formReset() {
		super.value = this.initialValue;
		this.input.value = this.initialValue;
		this.dispatch('reset');
	}
}

NumberSpinner.register();
