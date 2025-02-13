import { FormElement } from '../common/form.element.js';

/**
 * TextImport
 * @description Web Component that converts TSV or CSV files, with a custom mapping, into JSON objects.
 * @author Mads Stoumann
 * @version 1.0.0
 * @summary 13-02-2025
 * @class TextImport
 * @extends {FormElement}
 */
export class TextImport extends FormElement {
	get basePath() {
		return new URL('.', import.meta.url).href;
	}

	#elements = {};
	#state = {
		accept: '.txt',
		label: 'Select file',
		required: false
	};

	#converters = {
		int: value => parseInt(value, 10) || null,
		date: value => {
			const [month, day, year] = value.split('/');
			return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
		},
		float: value => parseFloat(value) || null
	};

	#formatters = {
		isbn: str => str.length > 13 ? str.slice(0, 13) : str,
		titleCase: str => str.toLowerCase().replace(/\b\w+/g, word => 
			word.charAt(0).toUpperCase() + word.slice(1)
		)
	};

	get converters() {
		return this.#converters;
	}

	set converters(newConverters) {
		this.#converters = { ...this.#converters, ...newConverters };
	}

	get formatters() {
		return this.#formatters;
	}

	set formatters(newFormatters) {
		this.#formatters = { ...this.#formatters, ...newFormatters };
	}

	constructor() {
		super();
		this.#state.uid = this.uuid();
		this.#state.accept = this.getAttribute('accept') || this.#state.accept;
		this.#state.label = this.getAttribute('label') || this.#state.label;
		this.#state.required = this.hasAttribute('required');
		console.log('init')
	}

	initializeComponent() {
		this.root.innerHTML = this.template();
		this.mapping = this.root.querySelector(`#popover${this.#state.uid}`);
		this.addRefs();
		this.addEvents();
		if (this.#state.auto) this.toggle.togglePopover(true);
	}

	async #processFile(file) {
	
		this.mapping.togglePopover(true);

		try {
			const text = await file.text();
			const lines = text.trim().split('\n');
			const separator = text.includes('\t') ? '\t' : ',';
			const headers = lines[0].split(separator);
			
			const data = lines.slice(1).map(line => {
				const values = line.split(separator);
				return headers.reduce((obj, header, index) => {
					obj[header] = values[index];
					return obj;
				}, {});
			});

			console.log('Converted data:', data);
			return data;
		} catch (error) {
			console.error('Error processing file:', error);
			return null;
		}
	}

	addEvents() {
		this.#elements.close.addEventListener('click', () => this.#elements.mapping.togglePopover(false));
		this.#elements.input.addEventListener('change', e => {
			const file = e.target.files[0];
			if (file) {
				this.#processFile(file);
			}
		});
	}

	addRefs() {
		this.#elements.close = this.mapping.querySelector('[part~=close]');
		this.#elements.input = this.root.querySelector('[part~=file]');
		this.#elements.mapping = this.root.querySelector('[part~=mapping]');
	}

	template() {
		return `
			<label part="row">
				<span part="label">${this.#state.label}${this.#state.required ? '<abbr title="required" part="abbr">*</abbr>' : ''}</span>
				<input type="file" name="file" accept="${this.#state.accept}" part="file">
			</label>
			<fieldset popover id="popover${this.#state.uid}" part="mapping">
				<button type="button" part="close">
					<svg part="icon" viewBox="0 0 24 24"><path d="M18 6l-12 12"/><path d="M6 6l12 12"/></svg>
				</button>
				HELLO WORLD
			</fieldset>
		`;
	}

	formReset() {
		super.value = '';
		this.input.value = '';
	}
}

TextImport.register();
