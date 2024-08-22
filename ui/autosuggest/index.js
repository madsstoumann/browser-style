export class AutoSuggest extends HTMLElement {
	constructor() {
		super();
		
		this.callback = null;
		this.data = [];
		this.listId = `datalist-${this.uuid()}`;
		this.settings = {
			api: this.getAttribute('api') || '',
			apiKey: this.getAttribute('api-key') || '',
			apiValue: this.getAttribute('api-value') || '',
			cache: this.getAttribute('cache') === 'true' || false,
			invalid: this.getAttribute('invalid') || 'Invalid selection',
			label: this.getAttribute('label') || '',
			limit: this.getAttribute('limit') === 'true' || true,
		};

		const root = this.getAttribute('shadow') === 'true' ? this.attachShadow({ mode: 'open' }) : this;
		root.innerHTML = this.render();

		this.datalist = root.querySelector('datalist');
		this.form = this.getAttribute('form') ? document.forms[this.getAttribute('form')] : this.closest('form');
		this.input = root.querySelector('input:not([type="hidden"])');
		this.inputHidden = root.querySelector('input[type="hidden"]');
	}

	connectedCallback() {
		this.inputHidden.value = this.getAttribute('key') || '';
		this.input.value = this.getAttribute('value') || '';

		const limitToSelection = () => {
			const option = selected();
			this.input.setCustomValidity(option ? '' : this.settings.invalid);
			if (!this.input.checkValidity()) {
				this.input.reportValidity();
			} else {
				this.input.setCustomValidity('');
			}
		};

		const onentry = async (event) => {
			const value = this.input.value.length >= this.input.minLength && this.input.value.toLowerCase();
			if (!value) return;

			if (event.inputType == "insertReplacementText" || event.inputType == null) {
				const option = selected();
				if (option) {
					this.inputHidden.value = option.dataset.key;
					this.dispatchEvent(new CustomEvent('autoSuggestSelect', { detail: JSON.parse(option.dataset.obj) }));
					this.reset(false);
				}
				return;
			}

			if (!this.data.length || this.settings.cache === false) {
				this.dispatchEvent(new CustomEvent('autoSuggestFetchStart'));

				try {
					this.data = await (await fetch(this.settings.api + encodeURIComponent(value))).json();
					this.dispatchEvent(new CustomEvent('autoSuggestFetchEnd'));

					if ((Array.isArray(this.data) && !this.data.length) || (typeof this.data === 'object' && !Object.keys(this.data).length)) {
						this.dispatchEvent(new CustomEvent('autoSuggestNoResults'));
					}

					if (this.callback) {
						return this.callback(this.datalist, this.data);
					}
					this.datalist.innerHTML = this.data.map(obj => {
						const key = this.getNestedValue(obj, this.settings.apiKey);
						const value = this.getNestedValue(obj, this.settings.apiValue);
						return `<option value="${value}" data-key="${key}" data-obj='${obj ? JSON.stringify(obj) : ''}'>`;
					}).join('');
				} catch (error) {
					this.dispatchEvent(new CustomEvent('autoSuggestFetchError', { detail: error }));
				}
			}
		};

		const selected = () => {
			const option = [...this.datalist.options].filter(entry => entry.value === this.input.value);
			return option.length === 1 ? option[0] : 0;
		};

		this.input.addEventListener('input', this.debounced(200, event => onentry(event)));
		this.input.addEventListener('search', () => this.input.value.length === 0 ? this.reset(false) : this.settings.limit ? limitToSelection() : '');

		if (this.form) {
			this.form.addEventListener('reset', () => this.reset());
		}
	}

	// Method to reset the auto-suggest control
	reset(fullReset = true) {
		if (fullReset) {
			this.input.value = '';
			this.inputHidden.value = '';
		}
		this.data = [];
		this.datalist.innerHTML = `<option value="">`;
		this.input.setCustomValidity('');
		this.dispatchEvent(new CustomEvent('autoSuggestClear'));
	}

	debounced(delay, fn) {
		let timerId;
		return function(...args) {
			if (timerId) clearTimeout(timerId);
			timerId = setTimeout(() => { fn(...args); timerId = null; }, delay);
		};
	}

	getNestedValue(obj, key) {
		return key.split('.').reduce((acc, part) => {
			if (acc && typeof acc === 'object') {
				if (Array.isArray(acc) && !isNaN(part)) {
					return acc[parseInt(part)];
				}
				return acc[part];
			}
			return undefined;
		}, obj);
	}

	render() {
		return `
		<input type="hidden" name="${this.getAttribute('name') || 'key'}">
		${this.settings.label ? `<label part="row"><span part="label">${this.settings.label}</span>` : ''}
			<input
				autocomplete="${this.getAttribute('autocomplete') || 'off'}"
				list="${this.listId}"
				minlength="${this.getAttribute('minlength') || 3}"
				part="input"
				placeholder="${this.getAttribute('placeholder') || ''}"
				spellcheck="${this.getAttribute('spellcheck') || false}"
				type="${this.getAttribute('type') || 'search'}">
		${this.settings.label ? `</label>` : ''}
		<datalist id="${this.listId}" part="list"></datalist>`;
	}

	setCallback(callback) {
		if (typeof callback === 'function') {
			this.callback = callback;
		} else {
			console.warn('Provided callback is not a function');
		}
	}

	uuid() {
		return crypto.getRandomValues(new Uint32Array(1))[0] || Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
	}
}

customElements.define('auto-suggest', AutoSuggest);
