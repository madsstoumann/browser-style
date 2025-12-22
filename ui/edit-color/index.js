import Color from "https://colorjs.io/dist/color.js";

const rgbSliders = {
	r: { min: 0, max: 100, step: 0.1, value: 0, label: 'R', suffix: '%' },
	g: { min: 0, max: 100, step: 0.1, value: 0, label: 'G', suffix: '%' },
	b: { min: 0, max: 100, step: 0.1, value: 0, label: 'B', suffix: '%' },
	alpha: { min: 0, max: 1, step: 0.001, value: 1, label: 'A', prefix: '/ ' }
};

const xyzSliders = {
	x: { min: 0, max: 1, step: 0.001, value: 0, label: 'X' },
	y: { min: 0, max: 1, step: 0.001, value: 0, label: 'Y' },
	z: { min: 0, max: 1, step: 0.001, value: 0, label: 'Z' },
	alpha: { min: 0, max: 1, step: 0.001, value: 1, label: 'A', prefix: '/ ' }
};

const spaces = {
	hsl: {
		h: { min: 0, max: 360, step: 0.1, value: 0, label: 'H' },
		s: { min: 0, max: 100, step: 0.1, value: 100, label: 'S', suffix: '%' },
		l: { min: 0, max: 100, step: 0.1, value: 50, label: 'L', suffix: '%' },
		alpha: { min: 0, max: 1, step: 0.001, value: 1, label: 'A', prefix: '/ ' }
	},
	hwb: {
		h: { min: 0, max: 360, step: 0.1, value: 0, label: 'H' },
		w: { min: 0, max: 100, step: 0.1, value: 0, label: 'W', suffix: '%' },
		b: { min: 0, max: 100, step: 0.1, value: 0, label: 'B', suffix: '%' },
		alpha: { min: 0, max: 1, step: 0.001, value: 1, label: 'A', prefix: '/ ' }
	},
	rgb: { ...rgbSliders },
	'display-p3': { ...rgbSliders },
	'a98-rgb': { ...rgbSliders },
	'prophoto-rgb': { ...rgbSliders },
	'rec2020': { ...rgbSliders },
	'srgb-linear': { ...rgbSliders },
	lab: {
		l: { min: 0, max: 100, step: 0.1, value: 50, label: 'l' },
		a: { min: -125, max: 125, step: 0.1, value: 0, label: 'a' },
		b: { min: -125, max: 125, step: 0.1, value: 0, label: 'b' },
		alpha: { min: 0, max: 1, step: 0.001, value: 1, label: 'A', prefix: '/ ' }
	},
	oklab: {
		l: { min: 0, max: 1, step: 0.001, value: 0.5, label: 'l' },
		a: { min: -0.4, max: 0.4, step: 0.001, value: 0, label: 'a' },
		b: { min: -0.4, max: 0.4, step: 0.001, value: 0, label: 'b' },
		alpha: { min: 0, max: 1, step: 0.001, value: 1, label: 'A', prefix: '/ ' }
	},
	lch: {
		l: { min: 0, max: 100, step: 0.1, value: 50, label: 'L' },
		c: { min: 0, max: 150, step: 0.1, value: 0, label: 'C' },
		h: { min: 0, max: 360, step: 0.1, value: 0, label: 'H' },
		alpha: { min: 0, max: 1, step: 0.001, value: 1, label: 'A', prefix: '/ ' }
	},
	oklch: {
		l: { min: 0, max: 1, step: 0.001, value: 0.5, label: 'L' },
		c: { min: 0, max: 0.4, step: 0.001, value: 0, label: 'C' },
		h: { min: 0, max: 360, step: 0.1, value: 0, label: 'H' },
		alpha: { min: 0, max: 1, step: 0.001, value: 1, label: 'A', prefix: '/ ' }
	},
	xyz: { ...xyzSliders },
	'xyz-d50': { ...xyzSliders },
	'xyz-d65': { ...xyzSliders }
};

export default class EditColor extends HTMLElement {
	#color;
	#elements = {};

	static get observedAttributes() {
		return ['value'];
	}

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
	}

	async connectedCallback() {
		const cssUrl = new URL('../design-token/index.css', import.meta.url).href;
		const response = await fetch(cssUrl);
		const text = await response.text();
		const sheet = new CSSStyleSheet();
		sheet.replaceSync(text);
		this.shadowRoot.adoptedStyleSheets = [sheet];

		this.render();
		this.addEventListener('update-from-input', (e) => {
			this.value = e.detail.value;
		});
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (name === 'value' && newValue !== oldValue) {
			this.value = newValue;
		}
	}

	set value(val) {
		if (!val) return;
		
		try {
			if (typeof val === 'string') {
				this.#color = new Color(val);
			} else if (typeof val === 'object') {
				const { colorSpace, components, alpha } = val;
				let spaceId = colorSpace === 'rgb' ? 'srgb' : colorSpace;
				if (spaceId === 'display-p3') spaceId = 'p3';
				this.#color = new Color(spaceId, components, alpha ?? 1);
			}
			this.updateUI();
		} catch (e) {
			console.warn('Invalid color value:', val, e);
		}
	}

	get value() {
		if (!this.#color) return null;
		return {
			colorSpace: this.#color.spaceId === 'srgb' ? 'rgb' : this.#color.spaceId,
			components: this.#color.coords,
			alpha: this.#color.alpha
		};
	}

	render() {
		const spaceOptions = Object.keys(spaces).map(space => `<option value="${space}">${space}</option>`).join('');

		this.shadowRoot.innerHTML = `
			<div part="edit-color-preview"></div>
			<fieldset part="edit-color-row">
				<label>Color Value:
					<input type="text" placeholder="Enter color value">
				</label>
				<label>Color Space:
					<select>
						<option value="hex">hex</option>
						${spaceOptions}
					</select>
				</label>
			</fieldset>
			<div></div>
		`;

		this.#elements = {
			preview: this.shadowRoot.querySelector('[part="edit-color-preview"]'),
			spaceSelect: this.shadowRoot.querySelector('select'),
			slidersContainer: this.shadowRoot.lastElementChild,
			valueInput: this.shadowRoot.querySelector('input[type="text"]')
		};

		this.#elements.spaceSelect.addEventListener('change', () => {
			this.renderSliders();
			this.updateValue();
		});

		this.#elements.valueInput.addEventListener('change', (e) => {
			this.value = e.target.value;
		});

		this.#elements.slidersContainer.addEventListener('input', (e) => {
			const target = e.target;
			const row = target.closest('[part=edit-color-row]');
			if (!row) return;
			
			const range = row.querySelector('input[type="range"]');
			const num = row.querySelector('input[type="number"]');
			
			if (target === range) {
				num.value = range.value;
			} else if (target === num) {
				range.value = num.value;
			}
			
			this.updateValue();
		});
	
		if (this.#color) {
			this.updateUI();
		}
	}

	updateUI() {
		if (!this.#color || !this.#elements.preview) return;

		// Update preview
		this.#elements.preview.style.setProperty('--preview-color', this.#color.toString());

		// Update input if it's not the active element
		if (this.#elements.valueInput && this.#elements.valueInput !== this.shadowRoot.activeElement) {
			this.#elements.valueInput.value = this.#color.toString({ precision: 4 });
		}

		// Set space select
		let initialSpace = this.#color.spaceId === 'srgb' ? 'rgb' : this.#color.spaceId;
		if (!spaces[initialSpace]) initialSpace = 'rgb';
		this.#elements.spaceSelect.value = initialSpace;

		this.renderSliders();
	}

	renderSliders() {
		if (!this.#color || !this.#elements.slidersContainer) return;

		const spaceName = this.#elements.spaceSelect.value;
		const effectiveSpaceName = spaceName === 'hex' ? 'rgb' : spaceName;
		const spaceDef = spaces[effectiveSpaceName];
		
		if (!spaceDef) return;

		const channels = Object.keys(spaceDef);
		const targetSpace = (effectiveSpaceName === 'rgb') ? 'srgb' : effectiveSpaceName;
		
		if (this.#color.spaceId !== targetSpace) {
			this.#color = this.#color.to(targetSpace);
		}

		const coords = this.#color.coords;
		const alpha = this.#color.alpha;

		this.#elements.slidersContainer.innerHTML = channels.map((channel, index) => {
			const def = spaceDef[channel];
			const isAlpha = channel === 'alpha';
			
			let val;
			if (isAlpha) {
				val = alpha;
			} else {
				val = coords[index];
				if (effectiveSpaceName === 'rgb') val *= 100;
			}
			
			if (isNaN(val)) val = def.value || 0;
			const step = def.step || 1;
			const decimals = (step.toString().split('.')[1] || '').length;
			val = Number(val.toFixed(decimals));

			return `
				<fieldset part="edit-color-row">
					<label>${def.label || channel}</label>
					<input type="range" min="${def.min}" max="${def.max}" step="${step}" value="${val}">
					<input type="number" min="${def.min}" max="${def.max}" step="${step}" value="${val}">
				</fieldset>
			`;
		}).join('');
	}

	updateValue() {
		if (!this.#color || !this.#elements.slidersContainer) return;

		const inputs = this.#elements.slidersContainer.querySelectorAll('input[type="number"]');
		const spaceName = this.#elements.spaceSelect.value;
		const effectiveSpaceName = spaceName === 'hex' ? 'rgb' : spaceName;
		const spaceDef = spaces[effectiveSpaceName];
		const channels = Object.keys(spaceDef);

		const newComponents = [];
		let newAlpha = 1;

		inputs.forEach((input, idx) => {
			const val = Number(input.value);
			if (channels[idx] === 'alpha') {
				newAlpha = val;
			} else {
				newComponents.push(effectiveSpaceName === 'rgb' ? val / 100 : val);
			}
		});

		this.#color.coords = newComponents;
		this.#color.alpha = newAlpha;

		let cssString;
		if (spaceName === 'hex') {
			cssString = this.#color.to('srgb').toString({ format: "hex" });
		} else if (spaceName === 'rgb') {
			cssString = this.#color.to('srgb').toString({ format: "rgb", precision: 4 });
		} else {
			cssString = this.#color.toString({ precision: 4 });
		}

		this.#elements.preview.style.setProperty('--preview-color', cssString);
		
		if (this.#elements.valueInput && this.#elements.valueInput !== this.shadowRoot.activeElement) {
			this.#elements.valueInput.value = cssString;
		}

		this.dispatchEvent(new CustomEvent('change', {  
			bubbles: true,
			detail: { 
				space: spaceName, 
				components: newComponents, 
				alpha: newAlpha,
				css: cssString
			} 
		}));
	}
}

customElements.define('edit-color', EditColor);