import { createDataEntryInstance } from './modules/factory.js';
import { bindUtilityEvents } from './modules/utility.js';
import { validateData as defaultValidateData } from './modules/validate.js';
import { AutoSuggest } from '/ui/autosuggest/index.js';
import { RichText } from '/ui/rich-text/richtext.js';
/**
 * Data Entry
 * description
 * @author Mads Stoumann
 * @version 1.0.07
 * @summary 17-06-2024
 * @class
 * @extends {HTMLElement}
 */
class DataEntry extends HTMLElement {
	static observedAttributes = ['data', 'validation'];

	constructor() {
		super();
		this.form = document.createElement('form');
		this.form.method = 'POST';
		this.form.action = this.getAttribute('action');
		this.form.part = 'form';
		this.instance = createDataEntryInstance(this);
		this.customValidateData = null;
	}

	async connectedCallback() {
		if (this.hasAttribute('shadow')) {
			const shadow = this.attachShadow({ mode: 'open' });
			shadow.appendChild(this.form);
		} else {
			this.appendChild(this.form);
		}

		this.form.addEventListener('input', (event) => this.syncInstanceData(event));

		if (this.jsonData && this.jsonSchema) {
			this.instance.data = this.jsonData;
			this.instance.schema = this.jsonSchema;
			this.renderAll();
		} else {
			await this.fetchSchema();
			await this.fetchData();

			if (this.isEmpty(this.instance.data) || this.isEmpty(this.instance.schema)) {
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
	}

	convertValue(value, dataType, inputType, checked) {
    switch (dataType) {
        case 'number':
            return Number(value);
        case 'boolean':
            if (inputType === 'checkbox') {
                return checked; // Use the checked property for checkboxes
            }
            return value === 'true' || value === true;
        case 'object':
            try {
                return JSON.parse(value); // Handle objects and arrays
            } catch {
                return value;
            }
        default:
            return value; // Default to string if no specific type is provided
    }
}

	async fetchData() {
		const dataUrl = this.getAttribute('data');
		if (!dataUrl) return;
		this.instance.data = await (await fetch(dataUrl)).json();
	}

	async fetchSchema() {
		const schemaUrl = this.getAttribute('schema');
		if (!schemaUrl) return;
		this.instance.schema = await (await fetch(schemaUrl)).json();
	}

	isEmpty(obj) {
		return Object.keys(obj).length === 0;
	}

	renderAll() {
		if (this.isEmpty(this.instance.data) || this.isEmpty(this.instance.schema)) {
			console.warn('Data or schema is empty. Skipping render.');
			return;
		}
		this.form.innerHTML = this.instance.methods.all(this.instance.data, this.instance.schema, this.instance, true);
		bindUtilityEvents(this.form, this.instance);
	}

	shouldValidate() {
		return this.getAttribute('validation') === 'true';
	}

	syncInstanceData(event) {
    const { name, value, type, checked } = event.target;
    if (!name) return;

    const dataType = event.target.dataset.type; // Get the data type from the data-type attribute

    const path = name.split('.').reduce((acc, key, index, array) => {
        const match = key.match(/([^\[]+)\[?(\d*)\]?/);
        const prop = match[1];
        const idx = match[2];

        if (!acc[prop]) {
            acc[prop] = idx ? [] : {};
        }

        if (idx) {
            acc[prop][idx] = acc[prop][idx] || (array[index + 1] ? {} : this.convertValue(value, dataType, type, checked));
            return acc[prop][idx];
        }

        if (index === array.length - 1) {
            acc[prop] = this.convertValue(value, dataType, type, checked); // Convert value to the correct type
        }

        return acc[prop];
    }, this.instance.data);

    console.log('Updated data:', this.instance.data); // For debugging purposes
	}

	async validateData() {
		const validateData = this.customValidateData || defaultValidateData;
		return validateData(this.instance.schema, this.instance.data);
	}

	// Setters for jsonData and jsonSchema
	set jsonData(data) {
		this._jsonData = data;
		this.instance.data = data;
	}

	get jsonData() {
		return this._jsonData;
	}

	set jsonSchema(schema) {
		this._jsonSchema = schema;
		this.instance.schema = schema;
	}

	get jsonSchema() {
		return this._jsonSchema;
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