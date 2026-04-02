import { adoptSharedStyles } from '@browser.style/editor-shared';

const CHECK_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20.707 6.293a1 1 0 0 1 0 1.414l-10 10a1 1 0 0 1-1.414 0l-5-5a1 1 0 0 1 1.414-1.414l4.293 4.293 9.293-9.293a1 1 0 0 1 1.414 0'/%3E%3C/svg%3E")`;

function contrastColor(hex) {
	const r = parseInt(hex.slice(1, 3), 16) / 255;
	const g = parseInt(hex.slice(3, 5), 16) / 255;
	const b = parseInt(hex.slice(5, 7), 16) / 255;
	const toLinear = (c) => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	const L = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
	return L > 0.179 ? '#000' : '#fff';
}

class EditorColor extends HTMLElement {
	static formAssociated = true;

	#presets = [];
	#value = '';

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this._internals = this.attachInternals();
	}

	get presets() { return this.#presets; }
	set presets(v) {
		this.#presets = Array.isArray(v) ? v : [];
		this.render();
	}

	get value() { return this.#value; }
	set value(v) {
		const label = v || '';
		if (label === this.#value) return;
		this.#value = label;
		this._internals.setFormValue(label);
		this.#syncSelection();
	}

	async connectedCallback() {
		await adoptSharedStyles(this.shadowRoot);

		const localCss = new CSSStyleSheet();
		await localCss.replace(`
			fieldset {
				all: unset;
				display: flex;
				flex-wrap: wrap;
				gap: 1rem;
			}
			legend {
				font-family: var(--editor-ff-sans);
				font-size: small;
				padding-block-end: .5rem;
			}
			label {
				cursor: pointer;
				display: grid;
				gap: .25rem;
				justify-items: center;
			}
			input[type="radio"] {
				appearance: none;
				background: var(--_bg);
				block-size: 2.5rem;
				border: 2px solid transparent;
				border-radius: 50%;
				cursor: pointer;
				display: grid;
				inline-size: 2.5rem;
				margin: 0;
				place-content: center;
				transition: border-color .15s, box-shadow .15s;
			}
			input[type="radio"]::after {
				background: var(--_check);
				block-size: 1.25rem;
				content: '';
				display: block;
				inline-size: 1.25rem;
				mask: ${CHECK_SVG} no-repeat center / contain;
				opacity: 0;
				transition: opacity .15s;
			}
			input[type="radio"]:checked {
				border-color: var(--editor-accent-dark);
				box-shadow: 0 0 0 2px var(--editor-accent);
			}
			input[type="radio"]:checked::after {
				opacity: 1;
			}
			input[type="radio"]:focus-visible {
				outline: 2px solid var(--editor-focus-c);
				outline-offset: 2px;
			}
			span {
				font-family: var(--editor-ff-mono);
				font-size: x-small;
				opacity: .7;
			}
		`);
		this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, localCss];

		this.render();
	}

	render() {
		if (!this.shadowRoot.adoptedStyleSheets.length) return;

		const fieldset = document.createElement('fieldset');
		const legend = document.createElement('legend');
		legend.textContent = this.getAttribute('label') || 'Color';
		fieldset.appendChild(legend);

		for (const preset of this.#presets) {
			const label = document.createElement('label');
			label.title = preset.label;

			const input = document.createElement('input');
			input.type = 'radio';
			input.name = 'color';
			input.value = preset.label;
			input.style.setProperty('--_bg', preset.value);
			input.style.setProperty('--_check', contrastColor(preset.value));
			input.checked = preset.label === this.#value;

			input.addEventListener('change', () => {
				this.#value = preset.label;
				this._internals.setFormValue(preset.label);
				this.dispatchEvent(new CustomEvent('color-change', {
					bubbles: true,
					composed: true,
					detail: { label: preset.label, value: preset.value }
				}));
			});

			const span = document.createElement('span');
			span.textContent = preset.label;

			label.append(input, span);
			fieldset.appendChild(label);
		}

		this.shadowRoot.replaceChildren(fieldset);
	}

	#syncSelection() {
		const radios = this.shadowRoot.querySelectorAll('input[type="radio"]');
		for (const radio of radios) {
			radio.checked = radio.value === this.#value;
		}
	}
}

customElements.define('editor-color', EditorColor);
