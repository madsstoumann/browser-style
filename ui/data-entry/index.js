import { createDataEntryInstance } from './modules/factory.js';
import { convertValue, deepMerge, isEmpty, getObjectByPath, setObjectByPath } from './modules/utility.js';
import { validateData as defaultValidateData } from './modules/validate.js';
import { mountComponents } from './modules/components.js';

/**
 * DataEntry is a custom HTML element that provides a comprehensive data entry form with various functionalities, based on a provided JSON schema and data.
 * It supports schema validation, internationalization, dynamic form rendering, and auto-save mechanisms.
 * @author Mads Stoumann
 * @version 1.0.27
 * @summary 26-09-2024
 * 
 * @class
 * @extends HTMLElement
 * 
 * @property {Object} data - The data object associated with the form.
 * @property {Object} i18n - The internationalization object containing translations.
 * @property {Object} lookup - The lookup object for reference data.
 * @property {Object} schema - The JSON schema defining the structure of the form data.
 * @property {Function} validateMethod - Custom validation method for the form data.
 * 
 * @fires CustomEvent#de:custom - Dispatched when a custom button is clicked.
 * @fires CustomEvent#de:entry - Dispatched when form data is processed.
 * 
 * @example
 * <data-entry lang="en" shadow debug></data-entry>
 * 
 * @example
 * document.querySelector('data-entry').data = { id: 1, name: 'Sample' };
 * 
 * @example
 * document.querySelector('data-entry').validateMethod = (schema, data) => {
 *   // Custom validation logic
 *   return { valid: true, errors: [] };
 * };
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

	/**
	 * Handles the component's connection to the DOM.
	 * 
	 * This method is called when the element is added to the document's DOM. It sets up the shadow DOM if required,
	 * attaches the form to the shadow DOM, and adds event listeners for form input and submission. It also loads
	 * necessary resources, merges translations and messages, validates the JSON schema, and renders the component.
	 * 
	 * @async
	 * @method connectedCallback
	 * @returns {Promise<void>} A promise that resolves when the component is fully connected and rendered.
	 */
	async connectedCallback() {
		const shadowRoot = this.hasAttribute('shadow') ? this.attachShadow({ mode: 'open' }) : this;
		shadowRoot.appendChild(this.form);

		this.form.addEventListener('input', this.syncInstanceData.bind(this));

		this.form.addEventListener('submit', (event) => { 
			event.preventDefault();
			const submitter = event.submitter;
			if (submitter?.dataset.method === 'custom') {
				this.dispatchEvent(new CustomEvent('de:custom', {
					detail: {
						data: this.instance.data,
						submitter
					}
				}));
			} else {
				this.handleDataSubmission();
			}
		});

		await this.loadResources();

		if (this.instance.schema?.translations) {
			this.i18n = deepMerge(this.i18n || {}, this.instance.schema.translations);
		}

		this.instance.i18n = this.i18n || {};

		if (this.instance.schema?.messages) {
			this.messages = deepMerge(this.messages || [], this.instance.schema.messages, 'code');
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

	/**
	 * Called when the element is disconnected from the document's DOM.
	 * Clears the auto-save timer if it exists and performs cleanup before rendering.
	 */
	disconnectedCallback() {
		if (this.autoSaveTimer) {
			clearInterval(this.autoSaveTimer);
		}
		this.cleanupBeforeRender();
	}

	/**
	 * Adds a new entry to an array within the form data.
	 *
	 * @param {HTMLElement} element - The form element that triggered the addition.
	 * @param {string} path - The path to the array within the form data.
	 * @param {string} [insertBeforeSelector='[part="nav"]'] - The CSS selector to determine where to insert the new entry in the DOM.
	 *
	 * @returns {void}
	 *
	 * @throws {Error} If the path does not reference an array in the data.
	 * @throws {Error} If the element with the specified selector is not found within the fieldset.
	 */
	addArrayEntry(element, path, insertBeforeSelector = `[part="nav"]`) {
		const form = element.form;

		if (element.type === 'submit') {
			if (!form.checkValidity()) {
				return;
			}
			event.preventDefault(); 
		}

		const formElements = Array.from(form.elements).filter(el => el.name.startsWith(`${path}.`));

		const array = getObjectByPath(this.instance.data, path);
		if (!Array.isArray(array)) {
			this.notify(1002, `Path "${path}" does not reference an array in the data.`);
			return;
		}

		const fieldset = this.form.querySelector(`fieldset[name="${path}-entry"]`);
		const schema = getObjectByPath(this.instance.schema, `properties.${path}`);

		if (!fieldset || !schema) {
			this.debugLog(`Fieldset with path "${path}" or schema not found.`);
			return;
		}

		const newObject = formElements.reduce((acc, el) => {
			const fieldPath = el.name.slice(path.length + 1);
			const dataType = el.dataset.type || 'string';
			acc[fieldPath] = convertValue(el.value, dataType, el.type, el.checked);
			return acc;
		}, {});

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
			this.notify(1004, `Element with selector "${insertBeforeSelector}" not found within the fieldset.`);
			return;
		}

		form.reset();

		const popover = this.form.querySelector(`#${form.dataset.popover}`);
		if (popover) popover.hidePopover();
		this.processData();
	}

	/**
	 * Binds custom buttons within the form to dispatch a custom event when clicked.
	 * 
	 * This method selects all buttons within the form that have a `data-method="custom"` attribute
	 * and attaches a click event listener to each of them. When a button is clicked, it prevents
	 * the default action and dispatches a `de:custom` event with the instance data and the button
	 * that was clicked as the event detail.
	 * 
	 * @fires CustomEvent#de:custom
	 */
	bindCustomButtons() {
		this.form.querySelectorAll('button[data-method="custom"]').forEach(button => {
			button.addEventListener('click', (event) => {
				event.preventDefault();
				this.dispatchEvent(new CustomEvent('de:custom', {
					detail: {
						data: this.instance.data,
						submitter: event.currentTarget
					}
				}));
			});
		});
	}

	/**
	 * Binds custom events to elements within a given container.
	 *
	 * This function searches for elements with the `data-custom` attribute within the specified
	 * container and binds click event listeners to them. When an element is clicked, it invokes
	 * the corresponding custom function defined in the `componentInstance`.
	 *
	 * @param {HTMLElement} elementContainer - The container element that holds the elements to bind events to.
	 * @param {Object} componentInstance - The instance of the component that contains custom functions.
	 */
	bindCustomEvents(elementContainer, componentInstance) {
		elementContainer.querySelectorAll('[data-custom]').forEach(element => {
			const customFunc = element.dataset.custom;
			const params = element.dataset.params ? JSON.parse(element.dataset.params) : {};
			const handler = componentInstance.custom?.[customFunc] || componentInstance[customFunc];

			if (typeof handler === 'function') {
				element.addEventListener('click', () => handler.call(componentInstance, element, ...Object.values(params)));
			}
		});
	}

	/**
	 * Cleans up the form before rendering by performing the following actions:
	 * - Unbinds custom buttons by replacing them with their clones.
	 * - Unbinds custom events by replacing elements with the `data-custom` attribute with their clones.
	 * - Clears the innerHTML of the form to remove all elements.
	 */
	cleanupBeforeRender() {
		this.form.querySelectorAll('button[data-method="custom"]').forEach(button => {
				button.removeEventListener('click', this.handleCustomClick);
		});
		this.form.querySelectorAll('[data-custom]').forEach(element => {
				const customFunc = element.dataset.custom;
				if (customFunc && this[customFunc]) {
						element.removeEventListener('click', this[customFunc]);
				}
		});
		this.form.innerHTML = '';  
	}

	/**
	 * Logs debug messages to the console if the 'debug' attribute is present.
	 *
	 * @param {...any} args - The messages or objects to log.
	 */
	debugLog(...args) {
		if (this.hasAttribute('debug')) {
			console.log(...args);
		} else {
			console.warn('An issue occurred. Please try again.');
		}
	}

	/**
	 * Fetches a resource from a URL specified by an attribute.
	 *
	 * @param {string} attribute - The name of the attribute containing the URL to fetch.
	 * @returns {Promise<Object|null>} A promise that resolves to the fetched resource as a JSON object, or null if an error occurs or the URL is not provided.
	 * @throws {Error} Throws an error if the HTTP response is not ok.
	 */
	async fetchResource(attribute) {
		const url = this.getAttribute(attribute);
		if (!url) return null;

		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return await response.json();
		} catch (error) {
			this.notify(1001, `Error fetching ${attribute}: ${error.message}`);
			return null;
		}
	}

	/**
	 * Recursively filters out entries from the provided data structure based on specified keys.
	 *
	 * @param {Object|Array} data - The data structure to filter, which can be an object or an array.
	 * @param {Array<string>} [keys=['_remove']] - The keys to filter out from the data structure. Defaults to ['_remove'].
	 * @returns {Object|Array} - The filtered data structure with specified keys removed.
	 */
	filterRemovedEntries(data, keys = ['_remove']) {
		const filterRecursive = (obj) => {
			if (Array.isArray(obj)) {
				return obj.filter(item => !keys.some(key => item[key])).map(filterRecursive);
			} else if (obj && typeof obj === 'object') {
				return Object.entries(obj).reduce((acc, [key, value]) => {
					if (!keys.includes(key)) {
						acc[key] = filterRecursive(value);
					}
					return acc;
				}, {});
			}
			return obj;
		};
		return filterRecursive(data);
	}

	/**
	 * Retrieves the error message and type based on the provided error code.
	 *
	 * @param {string} code - The error code to search for in the messages array.
	 * @returns {{ message: string, type: string }} An object containing the error message and its type.
	 */
	getErrorMessage(code) {
		const entry = (this.messages || []).find(msg => msg.code === code) || {};
		return { message: entry.message || '', type: entry.type || 'error' };
	}

	/**
	 * Handles the submission of form data.
	 *
	 * @param {string} action - The action URL to which the form data will be submitted.
	 * @param {string} method - The HTTP method to be used for the form submission (e.g., 'POST', 'GET').
	 * @param {string} [enctype='form'] - The encoding type of the form data (e.g., 'application/json', 'multipart/form-data').
	 *
	 * @returns {void}
	 */
	handleDataSubmission(action, method, enctype = 'form') {
		const formAction = this.form.getAttribute('action') || action;
		const formMethod = this.form.getAttribute('method') || method || 'POST';
		const formEnctype = this.form.getAttribute('enctype') || enctype;
		const filteredData = this.filterRemovedEntries(this.instance.data);
		const isMultipart = formEnctype.includes('multipart/form-data');
		const headers = isMultipart ? {} : { 'Content-Type': formEnctype };

		let data;

		if (formEnctype.includes('json')) {
			data = JSON.stringify(filteredData);
		} else if (isMultipart) {
			const hasFile = Array.from(this.form.elements).some(el => el.type === 'file');
			if (!hasFile) {
				this.debugLog('Warning: Multipart form but no files detected.');
			}
			data = this.prepareFormData();
		} else {
			data = new URLSearchParams(filteredData).toString();
		}

		const id = filteredData[this.primaryKey];

		if (formAction) {
			fetch(formAction.replace(':id', id), {
				method: formMethod,
				headers,
				body: data
			})
			.then(response => {
				if (!response.ok) {
					this.notify(1007, `HTTP error! status: ${response.statusText}`);
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				return response.json();
			})
			.then(() => {
				this.notify(1005, 'Data submitted successfully!');
			})
			.catch(error => {
				let statusCode = 1006;
				let errorMessage = 'Network issue detected';
				const statusMatch = error.message.match(/status:\s*(\d+)/);
				if (statusMatch) {
						statusCode = parseInt(statusMatch[1], 10);
						errorMessage = `HTTP error! status: ${statusCode}`;
				}
				this.notify(statusCode, errorMessage);
			});
		} else {
			this.processData();
		}
	}

	/**
	 * Handles navigation by adding click event listeners to links matching the specified selector.
	 * When a link is clicked, it prevents the default action, scrolls smoothly to the target element,
	 * and toggles the active class on the clicked link.
	 *
	 * @param {string} [selector='a[part="link"]'] - The CSS selector for the links to handle navigation.
	 * @param {string} [activeClass='active'] - The class to add to the clicked link to indicate it is active.
	 */
	handleNavigation(selector = 'a[part="link"]', activeClass = 'active') {
		this.form.querySelectorAll(selector).forEach(link => {
			link.addEventListener('click', (event) => {
				event.preventDefault();
				const targetId = link.getAttribute('href').substring(1); // Remove the '#' from href
				const targetElement = document.getElementById(targetId);

				if (targetElement) {
					targetElement.scrollIntoView({ behavior: 'smooth' });
					this.form.querySelectorAll(selector).forEach(link => link.classList.remove(activeClass));
					link.classList.add(activeClass);
				}
			});
		});
	}

	/**
	 * Asynchronously loads various resources required for data entry.
	 * 
	 * This method fetches the following resources in parallel:
	 * - data
	 * - schema
	 * - lookup
	 * - i18n (internationalization)
	 * - messages
	 * 
	 * Once fetched, the resources are assigned to the corresponding properties of the instance.
	 * If the lookup resource is not available, it defaults to an empty array.
	 * If the i18n resource is not available, it defaults to an empty object.
	 * If the messages resource is not available, it defaults to null.
	 * 
	 * @returns {Promise<void>} A promise that resolves when all resources are loaded.
	 */
	async loadResources() {
		const resources = await Promise.all([
			this.fetchResource('data'),
			this.fetchResource('schema'),
			this.fetchResource('lookup'),
			this.fetchResource('i18n'),
			this.fetchResource('messages')
		]);

		[this.data, this.schema, this.lookup, this.i18n, this.messages] = resources;
		this.lookup = this.lookup || [];
		this.i18n = this.i18n || {};
		this.messages = this.messages || null;
	}

	/**
	 * Handles a notification by displaying a toast message or logging it.
	 *
	 * @param {number} code - The error code.
	 * @param {string} [msg=''] - An optional message to log if no specific error message is found.
	 */
	notify(code, msg = '') {
		const { message, type } = this.getErrorMessage(code);
		if (message) {
			if (typeof this.showToast === 'function') {
				this.showToast(message, type, 3000);
			} else {
				this.debugLog(`Error ${code}: ${message}`);
			}
		} else {
			this.debugLog(`Error ${code}: ${msg}`);
		}
	}

	/**
	 * Prepares form data by iterating over the form elements and appending their values to a FormData object.
	 * 
	 * @returns {FormData} The FormData object containing the form elements' names and values.
	 */
	prepareFormData() {
		const formData = new FormData();
		Array.from(this.form.elements).forEach(element => {
			if (element.name && !element.disabled && element.value !== undefined && element.value !== 'undefined') {
				const value = element.type === 'checkbox' 
					? (element.checked ? (element.value || 'true') : (element.dataset.unchecked || 'false')) 
					: element.value || '';
				formData.append(element.name, value);
			}
		});
		return formData;
	}

	/**
	 * Processes the form data based on the form's enctype attribute.
	 * If the enctype includes 'json', it uses the instance's data.
	 * Otherwise, it prepares the form data.
	 * Logs the processed data for debugging and dispatches a 'dataEntry' event with the data.
	 *
	 * @method processData
	 * @fires CustomEvent#dataEntry - Dispatched with the processed data.
	 */
	processData() {
		const enctype = this.form.getAttribute('enctype') || 'multipart/form-data';
		const data = enctype.includes('json') ? this.instance.data : this.prepareFormData();
		this.debugLog('Processing data:', data);
		this.dispatchEvent(new CustomEvent('de:entry', { detail: { data } }));
	}

	/* === renderAll: Renders all form elements based on the data and schema */
	/**
	 * Asynchronously renders all components based on the instance's data and schema.
	 * 
	 * This method performs the following steps:
	 * 1. Checks if the instance's data or schema is empty and skips rendering if true.
	 * 2. Calls the `all` method on the instance's methods with the instance's data, schema, and other parameters.
	 * 3. Mounts components using the inner HTML of the form.
	 * 4. Binds custom buttons and events to the form.
	 * 5. Handles navigation.
	 * 6. Sets up auto-save functionality if the form's dataset specifies an auto-save interval.
	 * 
	 * @async
	 * @returns {Promise<void>} A promise that resolves when all components are rendered and additional setup is complete.
	 */
	async renderAll() {
		if (isEmpty(this.instance.data) || isEmpty(this.instance.schema)) {
			this.notify(1001, 'Data or schema is empty. Cannot proceed.');
			return;
		}
		this.cleanupBeforeRender();
		this.instance.methods.all(this.instance.data, this.instance.schema, this.instance, true, '', this.form);
		await mountComponents(this.form.innerHTML, this);

		this.bindCustomButtons();
		this.bindCustomEvents(this.form, this);
		this.handleNavigation();

		const autoSaveInterval = parseInt(this.form.dataset.autoSave, 10);
		if (!isNaN(autoSaveInterval) && autoSaveInterval > 0) {
			this.setupAutoSave(autoSaveInterval);
		}
	}

	/**
	 * Sets up an auto-save mechanism that triggers data submission at specified intervals.
	 * 
	 * @param {number} intervalInSeconds - The interval in seconds at which data should be auto-saved.
	 */
	setupAutoSave(intervalInSeconds) {
		if (this.autoSaveTimer) {
			clearInterval(this.autoSaveTimer);
		}

		this.autoSaveTimer = setInterval(() => {
			this.handleDataSubmission();
			this.debugLog(`Auto-saving data every ${intervalInSeconds} seconds.`);
		}, intervalInSeconds * 1000);
	}

	/**
	 * Synchronizes instance data based on the event from a form input.
	 *
	 * @param {Event} event - The event object from the form input.
	 * @param {HTMLFormElement} event.target.form - The form element that triggered the event.
	 * @param {string} event.target.name - The name attribute of the form input.
	 * @param {string} event.target.value - The value of the form input.
	 * @param {string} event.target.type - The type of the form input (e.g., "checkbox", "text").
	 * @param {boolean} event.target.checked - The checked state of the form input (for checkboxes).
	 * @param {DOMStringMap} event.target.dataset - The dataset of the form input, containing custom data attributes.
	 */
	syncInstanceData(event) {
		const { form, name, value, type, checked, dataset } = event.target;
		if (!name || form !== this.form) return;

		const currentData = getObjectByPath(this.instance.data, name);

		if (type === 'checkbox' && dataset.arrayControl === 'true') {
			if (checked) {
				if (currentData && currentData._remove) delete currentData._remove;
				this.debugLog(`Undoing delete: Removed _remove flag at path "${name}".`);
			} else {
				if (currentData) currentData._remove = true;
				this.notify(1003, `Marked object at path "${name}" for removal.`);
			}
		} else {
			const dataType = dataset.type;
			setObjectByPath(this.instance.data, name, convertValue(value, dataType, type, checked));
		}

		this.processData();
	}

	/**
	 * Validates the data against the schema.
	 * Uses a custom validation function if provided, otherwise defaults to `defaultValidateData`.
	 *
	 * @async
	 * @returns {Promise<Object>} The result of the validation, containing a `valid` boolean and an `errors` array if invalid.
	 */
	async validateData() {
		const validateData = this._customValidateData || defaultValidateData;
		const validationResult = validateData(this.instance.schema, this.instance.data);

		if (!validationResult.valid) {
			validationResult.errors.forEach(error => {
				this.debugLog(`Validation error in ${error.dataPath}: ${error.message}`);
				this.notify(1008, `Validation failed: ${error.message}`);
		});
		}
		return validationResult;
	}

	/**
	 * Checks if JSON schema validation is enabled.
	 *
	 * @returns {boolean} True if validation is enabled, false otherwise.
	 */
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
