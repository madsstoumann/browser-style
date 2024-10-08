/**
 * AutoSuggest
 * @description <auto-suggest> is a custom element that provides a search input field with auto-suggest functionality.
 * @author Mads Stoumann
 * @version 1.0.14
 * @summary 28-08-2024
 * @class AutoSuggest
 * @extends {HTMLElement}
 */
export class AutoSuggest extends HTMLElement {
	constructor() {
		super();

		this.data = [];
		this.defaultValues = {
			input: this.getAttribute('display') || '',
			inputHidden: this.getAttribute('value') || ''
		};
		this.initialObject = this.getAttribute('initial-object') ? JSON.parse(this.getAttribute('initial-object')) : null;
		this.listId = `datalist-${this.uuid()}`;
		this.settings = ['api', 'api-array-path', 'api-display-path', 'api-text-path', 'api-value-path', 'cache', 'invalid', 'label', 'limit'].reduce((settings, attr) => {
			const value = this.getAttribute(attr);
			settings[attr.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = value ?? null;  // Set to null if value is undefined or null
			return settings;
	}, {});

		this.settings.cache = this.settings.cache === 'true';
		this.settings.limit = this.settings.limit !== 'false';

		const root = this.getAttribute('shadow') === 'true' ? this.attachShadow({ mode: 'open' }) : this;
		root.innerHTML = this.render();

		this.datalist = root.querySelector('datalist');
		this.eventMode = this.getAttribute('event-mode') || 'custom'; /* custom, input, both */
		this.form = this.getAttribute('form') ? document.forms[this.getAttribute('form')] : this.closest('form');
		this.input = root.querySelector('input:not([type="hidden"])');
		this.inputHidden = root.querySelector('input[type="hidden"]');
	}

	connectedCallback() {
		const limitToSelection = () => {
			const option = selected();
			this.input.setCustomValidity(option ? '' : this.settings.invalid);
			this.input.reportValidity();
		};

		const onentry = async (event) => {
			const value = this.input.value.length >= this.input.minLength ? this.input.value.toLowerCase() : '';
			if (!value) return;
		
			const option = selected();
			if (option && (event.inputType === "insertReplacementText" || event.inputType == null)) {
				this.inputHidden.value = option.dataset.value;
				this.reset(false);
				this.dispatchEventMode(option.dataset.obj);
				return;
			}
		
			if (!this.data.length || !this.settings.cache) {
				this.dispatchEvent(new CustomEvent('autoSuggestFetchStart'));

				try {
					const response = await fetch(this.settings.api + encodeURIComponent(value));
					const fetchedData = await response.json();
					this.dispatchEvent(new CustomEvent('autoSuggestFetchEnd'));

					if (this.settings.apiArrayPath) {
						this.data = this.getNestedValue(fetchedData, this.settings.apiArrayPath) || [];
					} else {
						this.data = Array.isArray(fetchedData) ? fetchedData : [];
					}


					if (!this.data.length) {
						this.dispatchEvent(new CustomEvent('autoSuggestNoResults'));
					}

					this.datalist.innerHTML = this.data.map(obj => {
						const dataValue = this.getNestedValue(obj, this.settings.apiValuePath);
						const displayValue = this.getNestedValue(obj, this.settings.apiDisplayPath);
						const textValue = this.settings.apiTextPath ? this.getNestedValue(obj, this.settings.apiTextPath) : '';
						const dataObject = JSON.stringify(obj)
							.replace(/\\/g, '\\\\')
							.replace(/"/g, '&quot;')
							.replace(/'/g, '&#39;');
						return `<option value="${displayValue}" data-value="${dataValue}" data-obj='${dataObject}'>${textValue ? textValue : ''}</option>`;
					}).join('');
				} catch (error) {
					this.dispatchEvent(new CustomEvent('autoSuggestFetchError', { detail: error }));
				}
			}
		};


		const selected = () => {
			const option = [...this.datalist.options].find(entry => entry.value === this.input.value);
			return option || null;
		};

		this.input.addEventListener('keydown', (event) => {
			if (event.key === 'z' && (event.ctrlKey || event.metaKey)) {
				this.resetToDefault();
				if (this.initialObject) {
					this.dispatchEventMode(JSON.stringify(this.initialObject), true);
				}
			}
		});

		this.input.addEventListener('input', this.debounced(200, onentry));
		this.input.addEventListener('search', () => this.input.value.length === 0 ? this.reset(false) : this.settings.limit ? limitToSelection() : '');

		if (this.form) {
			this.form.addEventListener('reset', () => this.reset());
		}
	}

	dispatchEventMode(dataObj = null, isInitial = false) {
		const detail = dataObj ? JSON.parse(dataObj) : {};
		if (isInitial) {
			detail.isInitial = true;
		}
		if (['custom', 'both'].includes(this.eventMode)) {
			this.dispatchEvent(new CustomEvent('autoSuggestSelect', { detail }));
		}
		if (['input', 'both'].includes(this.eventMode)) {
			this.inputHidden.dispatchEvent(new Event('input', { bubbles: true }));
		}
	}

	debounced(delay, fn) {
		let timerId;
		return (...args) => {
			if (timerId) clearTimeout(timerId);
			timerId = setTimeout(() => { fn(...args); timerId = null; }, delay);
		};
	}

	getNestedValue(obj, key) {
		return key.split('.').reduce((acc, part) => acc && typeof acc === 'object' ? acc[part] : undefined, obj);
	}

	render() {
		return `
		<input type="hidden" name="${this.getAttribute('name') || 'key'}" value="${this.defaultValues.inputHidden}">
		${this.settings.label ? `<label part="row"><span part="label">${this.settings.label}</span>` : ''}
			<input
				autocomplete="${this.getAttribute('autocomplete') || 'off'}"
				list="${this.listId}"
				minlength="${this.getAttribute('minlength') || 3}"
				part="input"
				placeholder="${this.getAttribute('placeholder') || ''}"
				spellcheck="${this.getAttribute('spellcheck') || false}"
				type="${this.getAttribute('type') || 'search'}"
				value="${this.defaultValues.input}">
		${this.settings.label ? `</label>` : ''}
		<datalist id="${this.listId}" part="list"></datalist>`;
	}

	reset(fullReset = true) {
		if (fullReset) {
			this.resetToDefault();
		}
		this.data = [];
		this.datalist.innerHTML = `<option value="">`;
		this.input.setCustomValidity('');
		this.dispatchEvent(new CustomEvent('autoSuggestClear'));
	}

	resetToDefault() {
		if (this.initialObject) {
			const display = this.getNestedValue(this.initialObject, this.settings.apiDisplayPath);
			const value = this.getNestedValue(this.initialObject, this.settings.apiValuePath);
			this.input.value = display || this.defaultValues.input;
			this.inputHidden.value = value || this.defaultValues.inputHidden;
			this.inputHidden.setAttribute('value', value || this.defaultValues.inputHidden);
		} else {
			this.input.value = this.defaultValues.input;
			this.inputHidden.value = this.defaultValues.inputHidden;
			this.inputHidden.setAttribute('value', this.defaultValues.inputHidden);
		}
		this.input.setCustomValidity('');
	}

	uuid() {
		return crypto.getRandomValues(new Uint32Array(1))[0] || Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
	}

	static mount() {
		if (!customElements.get('auto-suggest')) {
			customElements.define('auto-suggest', this);
		}
	}
}