import { createDataEntryInstance } from './modules/factory.js';
import { bindUtilityEvents, convertValue, isEmpty, getObjectByPath, setObjectByPath } from './modules/utility.js';
import { validateData as defaultValidateData } from './modules/validate.js';
import { AutoSuggest } from '/ui/autosuggest/index.js';
import { RichText } from '/ui/rich-text/richtext.js';
/**
 * Data Entry
 * description
 * @author Mads Stoumann
 * @version 1.0.11
 * @summary 22-08-2024
 * @class
 * @extends {HTMLElement}
 */
class DataEntry extends HTMLElement {
	static observedAttributes = ['data', 'lookup', 'validation'];

	constructor() {
		super();
		this.form = document.createElement('form');
		this.form.method = 'POST';
		this.form.action = this.getAttribute('action');
		this.form.part = 'form';
		this.instance = createDataEntryInstance(this);
		this.customValidateData = null;
		this._lookup = null;
	}

	async connectedCallback() {
		if (this.hasAttribute('shadow')) {
			const shadow = this.attachShadow({ mode: 'open' });
			shadow.appendChild(this.form);
		} else {
			this.appendChild(this.form);
		}

		this.form.addEventListener('input', (event) => this.syncInstanceData(event));

		if (this.data && this.schema) {
			this.instance.data = this.data;
			this.instance.schema = this.schema;
			this.renderAll();
		} else {
			await this.loadResources();
			if (isEmpty(this.instance.data) || isEmpty(this.instance.schema)) {
				console.warn('Data or schema is empty. Skipping render.');
				return;
			}

			if (this.instance.data && this.instance.schema) {
				if (this.shouldValidate()) {
					const validationResult = await this.validateData();
					if (!validationResult.valid) {
						console.error('Validation errors:', validationResult.errors);
						return;
					}
				}
				this.renderAll();
			}
		}
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (!newValue || oldValue === newValue) return;

		if (name === 'lookup') {
			this.lookup = newValue;
		}
	}

	addArrayEntry(element, path) {
		const form = element.form;
		const formElements = Array.from(form.elements).filter(el => el.name.startsWith(`${path}.`));
		const newObject = {};

		formElements.forEach(el => {
				const fieldPath = el.name.slice(path.length + 1);
				const dataType = el.dataset.type || 'string';
				newObject[fieldPath] = convertValue(el.value, dataType, el.type, el.checked);
		});

		const array = getObjectByPath(this.instance.data, path);

		if (Array.isArray(array)) {
				array.push(newObject);

				const fieldset = this.form.querySelector(`fieldset[name="${path}-entry"]`);
				const schema = getObjectByPath(this.instance.schema, `properties.${path}`);

				if (fieldset && schema) {
						const newDetail = this.instance.methods.detail({
								value: newObject,
								config: schema,
								path: `${path}[${array.length - 1}]`,
								instance: this.instance,
								attributes: []
						});

						fieldset.insertAdjacentHTML('beforeend', newDetail);
						form.reset();
						console.log(this.instance.data);
				} else {
						console.error(`Fieldset with path "${path}" not found in the form.`);
				}
		} else {
				console.error(`Path "${path}" does not reference an array in the data.`);
		}
	}

	async fetchResource(attribute) {
		const url = this.getAttribute(attribute);
		if (!url) return null;

		try {
			const response = await fetch(url);
			return await response.json();
		} catch (error) {
			console.error(`Error fetching ${attribute}:`, error);
			return null;
		}
	}

	async loadResources() {
		this.instance.data = await this.fetchResource('data');
		this.instance.schema = await this.fetchResource('schema');
		this.instance.lookup = await this.fetchResource('lookup') || this.lookup;
	}

	removeArrayEntry(element, path) {
		const obj = getObjectByPath(this.instance.data, path);
		if (obj) {
			if (element.checked === false) {
				obj._remove = true;
			} else {
				delete obj._remove;
			}
		} else {
			console.error(`No object found at path: ${path}`);
		}
	}

	renderAll() {
		if (isEmpty(this.instance.data) || isEmpty(this.instance.schema)) {
			console.warn('Data or schema is empty. Skipping render.');
			return;
		}
		this.form.innerHTML = this.instance.methods.all(this.instance.data, this.instance.schema, this.instance, true);
		bindUtilityEvents(this.form, this);
	}

	shouldValidate() {
		return this.getAttribute('validation') === 'true';
	}

	syncInstanceData(event) {
		const { form, name, value, type, checked } = event.target;
		if (!name) return;
		if (form !== this.form) return;

		const dataType = event.target.dataset.type;
		setObjectByPath(this.instance.data, name, convertValue(value, dataType, type, checked));
		console.log('Updated data:', this.instance.data);
	}

	async validateData() {
		const validateData = this.customValidateData || defaultValidateData;
		return validateData(this.instance.schema, this.instance.data);
	}

	// Getter and setter for data
	set data(data) {
		this._jsonData = data;
		this.instance.data = data;
	}

	get data() {
		return this._jsonData;
	}

	// Getter and setter for schema
	set schema(schema) {
		this._jsonSchema = schema;
		this.instance.schema = schema;
	}

	get schema() {
		return this._jsonSchema;
	}

	// Getter and setter for lookup
	set lookup(lookup) {
		this._lookup = lookup;
		this.instance.lookup = lookup;
	}

	get lookup() {
		return this._lookup;
	}
}

/* Register element/s */
if (!customElements.get('auto-suggest')) {
	customElements.define('auto-suggest', AutoSuggest);
}
if (!customElements.get('rich-text')) {
	customElements.define('rich-text', RichText);
}
customElements.define('data-entry', DataEntry);

// Export the DataEntry class so it can be used externally
export default { DataEntry };
