import { createDataEntryInstance } from './modules/factory.js';
import { convertValue, isEmpty, getObjectByPath, setObjectByPath } from './modules/utility.js';
import { validateData as defaultValidateData } from './modules/validate.js';
import { mountComponents } from './modules/components.js';

/**
 * Data Entry
 * A custom web component for dynamically rendering and managing form entries based on a provided JSON schema and data.
 * This class supports automatic form rendering, data binding, schema validation, and custom event handling.
 * @author Mads Stoumann
 * @version 1.0.25
 * @summary 24-09-2024
 * @class
 * @extends {HTMLElement}
 */
class DataEntry extends HTMLElement {
	constructor() {
		super();
		this._customValidateData = null;
		this._i18n = {};

		this.form = document.createElement('form');
		this.form.part = 'form';
		this.primaryKey = this.getAttribute('primary-key') || 'id';
		this.lang = this.getAttribute('lang') || 'en';
		this.instance = createDataEntryInstance(this);
		this.instance.lang = this.lang;
	}

	/* === connectedCallback: Called when the component is added to the DOM */
	async connectedCallback() {
		const shadowRoot = this.hasAttribute('shadow') ? this.attachShadow({ mode: 'open' }) : this;
		shadowRoot.appendChild(this.form);

		this.form.addEventListener('input', (event) => {
			this.syncInstanceData(event)
		});

		this.form.addEventListener('submit', (event) => { /* Requires a submit button */
			event.preventDefault();
			this.handleDataSubmission();
		});

		this.form.addEventListener('click', (event) => {
			if (event.target.tagName === 'BUTTON' && event.target.dataset.action) {
				event.preventDefault();
				const { action, method, contentType } = event.target.dataset;

				if (contentType === 'custom') {
					this.dispatchEvent(new CustomEvent('de:custom', {
						detail: {
							action: action,
							method: method,
							formData: this.instance.data
						}
					}));
				} else {
					this.handleDataSubmission(action, method, contentType);
				}
			}
		});

		await this.loadResources();

		this.instance.i18n = this.i18n || {};

		if (this.instance.schema?.messages) {
			this.messages = this.mergeMessagesByCode(this.messages || [], this.instance.schema.messages);
		}

		if (isEmpty(this.instance.data) || isEmpty(this.instance.schema)) {
			this.debugLog('Data or schema is empty. Skipping render.');
			return;
		}

		if (this.validateJSON()) {
			const validationResult = await this.validateData();
			if (!validationResult.valid) {
				this.debugLog('Schema validation failed. Skipping render.');
				return;
			}
		}

		this.renderAll();
	}

	/* === addArrayEntry: Adds a new entry to an array in the form data */
	addArrayEntry(element, path, insertBeforeSelector = `[part="nav"]`) {
		const form = element.form;

		if (element.type === 'submit') {
			if (!form.checkValidity()) {
				return;
			}

			// Prevent the form from actually submitting
			event.preventDefault(); 
		}

		const formElements = Array.from(form.elements).filter(el => el.name.startsWith(`${path}.`));

		const array = getObjectByPath(this.instance.data, path);
		if (!Array.isArray(array)) {
			this.handleError(1302, `Path "${path}" does not reference an array in the data.`);
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

		const newDetail = this.instance.methods.arrayDetail({
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
			this.handleError(1304, `Element with selector "${insertBeforeSelector}" not found within the fieldset.`);
			return;
		}

		form.reset();

		const popover = this.form.querySelector(`#${form.dataset.popover}`);
		if (popover) popover.hidePopover();
		this.processData();
	}

	bindCustomEvents(elementContainer, componentInstance) {
		const elements = elementContainer.querySelectorAll('[data-custom]');
		elements.forEach(element => {
			const customFunc = element.dataset.custom;
			const params = element.dataset.params ? JSON.parse(element.dataset.params) : {};
	
			if (componentInstance.custom && componentInstance.custom[customFunc]) {
				element.addEventListener('click', () => {
						componentInstance.custom[customFunc](element, componentInstance, ...Object.values(params));
				});
			}
			else if (typeof componentInstance[customFunc] === 'function') {
				element.addEventListener('click', () => {
					componentInstance[customFunc](element, ...Object.values(params));
				});
			}
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
			this.handleError(1301, `Error fetching ${attribute}: ${error.message}`);
			return null;
		}
	}

	/* === filterRemovedEntries: Filters out entries marked for removal from the data */
	filterRemovedEntries(data) {
		const filterRecursive = (obj) => {
			if (Array.isArray(obj)) {
				return obj.filter(item => !item._remove).map(filterRecursive);
			} else if (obj && typeof obj === 'object') {
				return Object.keys(obj).reduce((acc, key) => {
					if (key !== '_remove') {
						acc[key] = filterRecursive(obj[key]);
					}
					return acc;
				}, {});
			}
			return obj;
		};
		return filterRecursive(data);
	}

	/* === getErrorMessage: Fetches an error message based on a status code */
	getErrorMessage(code) {
		const messages = this.messages || [];
		const entry = messages.find(msg => msg.code === code);
		if (!entry) return { message: '', type: 'error' };
		const message = entry ? entry.message : null;
		const type = entry.type || 'info';
		return { message, type };
	}

	/* === handleDataSubmission: Common method to handle data submission logic === */
	handleDataSubmission(action, method, contentType = 'form') {
		const asJSON = contentType === 'json';
		const filteredData = this.filterRemovedEntries(this.instance.data);
		const data = asJSON ? JSON.stringify(filteredData) : this.prepareFormData(filteredData);
		const headers = asJSON ? { 'Content-Type': 'application/json' } : {};
		const id = filteredData[this.primaryKey];
	
		if (action) {
			fetch(action.replace(':id', id), {
				method: method || 'POST',
				headers: headers,
				body: data
			})
			.then(response => {
				if (!response.ok) { console.error(response.status);
					this.handleError(response.status, `HTTP error! status: ${response.statusText}`);
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				return response.json();
			})
			.then(result => {
				this.handleError(1200, 'Data submitted successfully!');
			})
			.catch(error => {
				this.handleError(1105, 'Network issue detected');
			});
		} else {
			this.processData();
		}
	}

	/* === handleError: Displays an error message based on a status code */
	handleError(code, msg = '') {
		const { message, type } = this.getErrorMessage(code);
		if (message && typeof this.showToast === 'function') {
			this.showToast(message, type, 3000);
		} else {
			this.debugLog(`Error ${code}: ${msg}`);
		}
	}

	handleNavigation() {
		this.form.querySelectorAll('a[part="link"]').forEach(link => {
			link.addEventListener('click', (event) => {
				event.preventDefault();
				const targetId = event.target.getAttribute('href').substring(1); // Remove the '#' from href
				const targetElement = document.getElementById(targetId);
		
				if (targetElement) {
						// Scroll to the target element
						targetElement.scrollIntoView({ behavior: 'smooth' });
		
						// Toggle the 'active' class on the clicked link
						document.querySelectorAll('a[part="link"]').forEach(link => {
								link.classList.remove('active');
						});
						event.target.classList.add('active');
				}
			});
	});
	}

	/* === loadResources: Loads data, schema, lookup and messages resources */
	async loadResources() {
		this.data = await this.fetchResource('data');
		this.schema = await this.fetchResource('schema');
		this.lookup = await this.fetchResource('lookup') || [];
		this.i18n = await this.fetchResource('i18n') || {};
		this.messages = await this.fetchResource('messages') || null; 
	}

	/* === mergeMessagesByCode: Merges two arrays of messages based on their `code`-property */
	mergeMessagesByCode(existingMessages, newMessages) {
		const messageMap = new Map(existingMessages.map(msg => [msg.code, msg]));
		newMessages.forEach(newMsg => {
			messageMap.set(newMsg.code, newMsg);
		});
		return Array.from(messageMap.values());
	}

	/* === prepareFormData: Helper method to prepare form data as FormData object */
	prepareFormData() {
		const formData = new FormData();
		for (const element of this.form.elements) {
			if (element.name && !element.disabled && element.value !== undefined && element.value !== 'undefined') {
				if (element.type === 'checkbox') {
					// If checkbox has no explicit value, append 'true' or 'false' based on checked state
					formData.append(element.name, element.checked ? 'true' : 'false');
				} else {
					// For all other element types, append the value directly
					formData.append(element.name, element.value);
				}
			}
		}
		return formData;
	}

	/* === processData: Prepares data and handles various actions */
	processData() {
		const dataMode = this.form.dataset.mode || 'form';
		const asObject = dataMode === 'object';
		const data = asObject ? this.instance.data : this.prepareFormData();
		this.debugLog('Processing data:', this.instance.data);
		this.dispatchEvent(new CustomEvent('dataEntry', { detail: { data } }));
	}

	/* === renderAll: Renders all form elements based on the data and schema */
	async renderAll() {
		if (isEmpty(this.instance.data) || isEmpty(this.instance.schema)) {
			this.debugLog('Data or schema is empty. Skipping render.');
			return;
		}
		this.instance.methods.all(this.instance.data, this.instance.schema, this.instance, true, '', this.form);
		await mountComponents(this.form.innerHTML, this);
		this.bindCustomEvents(this.form, this);
		this.handleNavigation();

		const autoSaveInterval = parseInt(this.form.dataset.autoSave, 10);
		if (autoSaveInterval > 0) {
			this.setupAutoSave(autoSaveInterval);
		}
	}

	/* === setupAutoSave: Configures auto-save functionality with a specified interval in seconds === */
	setupAutoSave(intervalInSeconds) {
		if (this.autoSaveTimer) {
			clearInterval(this.autoSaveTimer);
		}

		this.autoSaveTimer = setInterval(() => {
			this.handleDataSubmission();
			this.debugLog(`Auto-saving data every ${intervalInSeconds} seconds.`);
		}, intervalInSeconds * 1000);
	}

	/* === syncInstanceData: Synchronizes form data with the instance data */
	syncInstanceData(event) {
		const { form, name, value, type, checked, dataset } = event.target;
		if (!name || form !== this.form) return;
	
		// Handle array-control checkbox logic
		if (type === 'checkbox' && dataset.arrayControl === 'true') {
			const currentData = getObjectByPath(this.instance.data, name);
	
			if (checked === false) {
				if (currentData) currentData._remove = true;
				this.handleError(1302, `Marked object at path "${name}" for removal.`);
			} else {
				if (currentData && currentData._remove) delete currentData._remove;
				this.debugLog(`Undoing delete: Removed _remove flag at path "${name}".`);
			}
			this.processData();
			return;
		}
	
		// Default behavior for other inputs
		const dataType = event.target.dataset.type;
		setObjectByPath(this.instance.data, name, convertValue(value, dataType, type, checked));
		this.processData();
	}

	/* === validateData: Validates form data against the schema */
	async validateData() {
		const validateData = this._customValidateData || defaultValidateData;
		const validationResult = validateData(this.instance.schema, this.instance.data);

		if (!validationResult.valid) {
			this.debugLog('Schema validation failed:', validationResult.errors);
		}
		return validationResult;
	}

	/* === validateJSON: Checks if JSON schema validation is enabled */
	validateJSON() {
		return !this.hasAttribute('novalidate');
	}

	/* === Getters and setters */
	set data(data) {
		this._data = data;
		this.instance.data = data;
	}

	get data() {
		return this._data;
	}

	get i18n() {
		return this._i18n;
	}

	set i18n(value) {
		if (typeof value === 'object' && value !== null) {
			this._i18n = value;
		} else {
			console.error('i18n should be an object');
		}
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

	set validateMethod(method) {
		if (typeof method === 'function') {
			this._customValidateData = method;
		} else {
			console.error('Validation method must be a function');
		}
	}

	get validateMethod() {
		return this._customValidateData;
	}
}

/* === Register element */
customElements.define('data-entry', DataEntry);
export default { DataEntry };
