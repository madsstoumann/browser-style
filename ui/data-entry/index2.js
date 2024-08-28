import { createDataEntryInstance } from './modules/factory.js';
import { bindUtilityEvents, convertValue, isEmpty, getObjectByPath, setObjectByPath } from './modules/utility.js';
import { validateData as defaultValidateData } from './modules/validate.js';
import { AutoSuggest } from '/ui/autosuggest/index.js';
import { RichText } from '/ui/rich-text/richtext.js';

/**
 * Data Entry
 * A custom web component for dynamically rendering and managing form entries based on a provided JSON schema and data.
 * This class supports automatic form rendering, data binding, schema validation, and custom event handling.
 * @author Mads Stoumann
 * @version 1.0.16
 * @summary 27-08-2024
 * @class
 * @extends {HTMLElement}
 */
class DataEntry extends HTMLElement {
	constructor() {
		super();
		this.customValidateData = null;
		this.form = document.createElement('form');
		this.form.part = 'form';
		this.instance = createDataEntryInstance(this);

		this.form.addEventListener('submit', (event) => {
			event.preventDefault();	
			this.handleFormSubmission();
		});
	}

	/* === connectedCallback: Called when the component is added to the DOM */
	async connectedCallback() {
		const shadowRoot = this.hasAttribute('shadow') ? this.attachShadow({ mode: 'open' }) : this;
		shadowRoot.appendChild(this.form);

		this.form.addEventListener('input', (event) => {
			this.syncInstanceData(event);
			// if (this.form.dataset.eventMode === 'auto') {
			// 	this.form.dispatchEvent(new Event('submit'));
			// }
		});

		await this.loadResources();
		if (isEmpty(this.instance.data) || isEmpty(this.instance.schema)) {
			this.debugLog('Data or schema is empty. Skipping render.');
			return;
		}

		if (this.shouldValidate() && !(await this.validateData()).valid) {
			return;
		}
		this.renderAll();
	}

	/* === addArrayEntry: Adds a new entry to an array in the form data */
	addArrayEntry(element, path, insertBeforeSelector = `[part="nav"]`) {
		const form = element.form;
		const formElements = Array.from(form.elements).filter(el => el.name.startsWith(`${path}.`));

		// Temporarily enable disabled fields for validation
		formElements.forEach(el => {
			if (el.disabled) {
				el.disabled = false;
				el.dataset.wasDisabled = 'true';
			}
		});
		const isValid = form.checkValidity();
	
		// Re-disable the fields that were originally disabled
		formElements.forEach(el => {
			if (el.dataset.wasDisabled === 'true') {
				el.disabled = true;
				delete el.dataset.wasDisabled; // Clean up the tracking attribute
			}
		});
	
		if (!isValid) {
			this.debugLog('Form is invalid, cannot add entry.');
			return;
		}
	
		const array = getObjectByPath(this.instance.data, path);
		if (!Array.isArray(array)) {
			this.debugLog(`Path "${path}" does not reference an array in the data.`);
			return;
		}
	
		const fieldset = this.form.querySelector(`fieldset[name="${path}-entry"]`);
		const schema = getObjectByPath(this.instance.schema, `properties.${path}`);
		
		if (!fieldset || !schema) {
			this.debugLog(`Fieldset with path "${path}" or schema not found.`);
			return;
		}
	
		const newObject = {};
		formElements.forEach(el => {
			const fieldPath = el.name.slice(path.length + 1);
			const dataType = el.dataset.type || 'string';
			newObject[fieldPath] = convertValue(el.value, dataType, el.type, el.checked);
		});
	
		array.push(newObject);
	
		const newDetail = this.instance.methods.detail({
			value: newObject,
			config: schema,
			path: `${path}[${array.length - 1}]`,
			instance: this.instance,
			attributes: []
		});
	
		const siblingElm = fieldset.querySelector(insertBeforeSelector);
	
		if (siblingElm) {
			siblingElm.insertAdjacentHTML('beforebegin', newDetail);
		} else {
			this.debugLog(`Element with selector "${insertBeforeSelector}" not found within the fieldset.`);
			return;
		}
	
		form.reset();
	
		const popover = this.form.querySelector(`#${form.dataset.popover}`);
		if (popover) popover.hidePopover();
		this.handleFormSubmission();
		// this.debugLog('Updated data:', this.instance.data);
	}

	/* === bindAutoSuggestEvents: Binds events for auto-suggest elements */
	bindAutoSuggestEvents() {
		this.form.querySelectorAll('auto-suggest').forEach(autoSuggest => {
			autoSuggest.addEventListener('autoSuggestSelect', (event) => {
				const detail = event.detail;
				const path = autoSuggest.getAttribute('name').split('.').slice(0, -1).join('.') || autoSuggest.getAttribute('name');
				const syncInstance = autoSuggest.getAttribute('sync-instance') === 'true';
				const mapping = JSON.parse(autoSuggest.dataset.mapping || '{}');
				let resultObject = Object.keys(detail).length === 1 && detail[path] ? { [path]: detail[path] } : {};

				Object.entries(mapping).forEach(([field, mappedKeyPath]) => {
					const fullPath = path ? `${path}.${field}` : field;
					const mappedValue = getObjectByPath(detail, mappedKeyPath);
					setObjectByPath(resultObject, fullPath, mappedValue);
					const input = autoSuggest.getAttribute('form') ? document.forms[autoSuggest.getAttribute('form')].elements[fullPath] : this.form.elements[fullPath];
					if (input) {
						input.value = mappedValue || '';
						input.setCustomValidity('');
						if (!input.checkValidity()) input.reportValidity();
					}
				});

				if (syncInstance && !isEmpty(resultObject)) {
					Object.keys(resultObject).forEach(key => setObjectByPath(this.instance.data, key, resultObject[key]));
					this.syncInstanceData(event);
					this.handleFormSubmission();
				}

				// console.log('Updated instance data after sync:', this.instance.data);
			});
		});
	}

	/* === debugLog: Logs debug messages if debug mode is enabled */
	debugLog(...args) {
		if (this.hasAttribute('debug')) {
			console.log(...args);
		}
	}

	/* === fetchResource: Fetches JSON data from a specified attribute URL */
	async fetchResource(attribute) {
		const url = this.getAttribute(attribute);
		if (!url) return null;

		try {
			const response = await fetch(url);
			return await response.json();
		} catch (error) {
			this.debugLog(`Error fetching ${attribute}:`, error);
			return null;
		}
	}

	/* === handleFormSubmission: Prepares and dispatches form data for submission */
	handleFormSubmission() {
		const dataMode = this.form.dataset.mode || 'form';
		const data = this.prepareSubmission(dataMode === 'object');
		console.log(data)
	}

	/* === loadResources: Loads data, schema, and lookup resources */
	async loadResources() {
		this.data = await this.fetchResource('data');
		this.schema = await this.fetchResource('schema');
		this.lookup = await this.fetchResource('lookup') || [];
	}

	/* === prepareSubmission: Prepares data for submission based on the mode */
	prepareSubmission(asObject = false) {
		if (asObject) {
			return this.instance.data;
		} else {
			const formData = new FormData();
			for (const element of this.form.elements) {
				if (element.name && !element.disabled) {
					formData.append(element.name, element.value);
				}
			}
			return formData;
		}
	}

	/* === removeArrayEntry: Removes an entry from an array in the form data */
	removeArrayEntry(element, path) {
		const obj = getObjectByPath(this.instance.data, path);
		if (obj) {
			if (element.checked === false) {
				obj._remove = true;
			} else {
				delete obj._remove;
			}
			this.debugLog(element.checked === false ? 'Marked object for removal:' : 'Removed object from removal:', obj);
		} else {
			this.debugLog(`No object found at path: ${path}`);
		}
	}

	/* === renderAll: Renders all form elements based on the data and schema */
	renderAll() {
		if (isEmpty(this.instance.data) || isEmpty(this.instance.schema)) {
			this.debugLog('Data or schema is empty. Skipping render.');
			return;
		}
		this.instance.methods.all(this.instance.data, this.instance.schema, this.instance, true, '', this.form);
		bindUtilityEvents(this.form, this);
		this.bindAutoSuggestEvents();
	}

	/* === shouldValidate: Checks if JSON schema validation is enabled */
	shouldValidate() {
		return this.getAttribute('validation') === 'true';
	}

	/* === syncInstanceData: Synchronizes form data with the instance data */
	syncInstanceData(event) {
		const { form, name, value, type, checked } = event.target;
		if (!name) return;
		if (form !== this.form) return;
	
		const dataType = event.target.dataset.type;
		setObjectByPath(this.instance.data, name, convertValue(value, dataType, type, checked));
		this.debugLog('Updated data:', this.instance.data);
	}

	/* === validateData: Validates form data against the schema */
	async validateData() {
		const validateData = this.customValidateData || defaultValidateData;
		return validateData(this.instance.schema, this.instance.data);
	}

	/* === Getters and setters */

	set data(data) {
		this._data = data;
		this.instance.data = data;
	}

	get data() {
		return this._data;
	}

	set lookup(lookup) {
		this._lookup = lookup;
		this.instance.lookup = lookup;
	}

	get lookup() {
		return this._lookup;
	}

	set schema(schema) {
		this._schema = schema;
		this.instance.schema = schema;
	}

	get schema() {
		return this._schema;
	}
}

/* === Register element/s */
if (!customElements.get('auto-suggest')) {
	customElements.define('auto-suggest', AutoSuggest);
}
if (!customElements.get('rich-text')) {
	customElements.define('rich-text', RichText);
}
customElements.define('data-entry', DataEntry);

export default { DataEntry };
