import { FormControl } from '/formControl.js';

export class AutoSuggest extends FormControl {
	constructor() {
		super();
		this.data = [];
		this.defaultValues = {
			input: this.getAttribute('display') || '',
			value: this.getAttribute('value') || ''
		};
	}

	initializeComponent() {
		this.data = [];
		this.defaultValues = {
			input: this.getAttribute('display') || '',
			value: this.getAttribute('value') || ''
		};
		this.initialObject = JSON.parse(this.getAttribute('initial-object') || 'null');
		this.listId = `list${this.uuid()}`;

		this.settings = ['api', 'api-array-path', 'api-display-path', 'api-text-path', 'api-value-path', 'cache', 'debounce', 'invalid', 'label', 'list-mode'].reduce((s, attr) => {
			s[attr.replace(/-([a-z])/g, (_, l) => l.toUpperCase())] = this.getAttribute(attr) ?? null;
			return s;
		}, {});

		if (!this.settings.api) {
			console.error('API endpoint is not defined.');
			return;
		}

		this.settings.cache = this.settings.cache === 'true';
		this.settings.listMode = this.settings.listMode || 'datalist';
		this.settings.nolimit = this.hasAttribute('nolimit');
		this.settings.debounceTime = parseInt(this.settings.debounce) || 300;

		this.root.innerHTML = this.template();
		this.input = this.root.querySelector('input');
		this.list = this.root.querySelector(`#${this.listId}`);

		// Now that elements exist, set up initial values
		if (this.input && this.isFormControl) {
			const displayValue = this.getAttribute('display') || '';
			this.input.value = displayValue;
			this.setAttribute('display', displayValue);
		}

		this.debouncedFetch = this.debounced(this.settings.debounceTime, this.fetchData.bind(this));
	}

	get displayValue() {
		return this.isFormControl ? 
			(this.getAttribute('display') || this.input?.value || '') :
			null;
	}

	set displayValue(v) {
		if (!this.isFormControl) return;
		this.setAttribute('display', v);
		if (this.initialized && this.input) {
			this.input.value = v;
		}
	}

	connectedCallback() {
		super.connectedCallback();
		if (!this.initialized || !this.input) return;

		// Ensure input element exists before setting up listeners
		this.setupListeners();
	}

	setupListeners() {
		const selected = () => this.settings.listMode === 'ul' ? null : 
			[...this.list.options].find(entry => entry.value === this.input.value);

		this.input.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				if (this.settings.nolimit) {
					this.dispatchEvent(new CustomEvent('autoSuggestNoSelection', { bubbles: true }));
					this.reset();
				}
			}
			if (this.settings.listMode === 'ul' && e.key === 'ArrowDown' && this.list.children.length) {
				e.preventDefault();
				this.list.togglePopover(true);
				this.list.children[0].focus();
			}
			if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
				this.resetToDefault();
				if (this.initialObject) this.dispatch(JSON.stringify(this.initialObject), true);
			}
		});

		this.input.addEventListener('input', (e) => {
			const value = this.input.value.length >= this.input.minLength ? this.input.value.toLowerCase() : '';
			if (!value) return;

			const option = selected();
			if (option && (e.inputType === "insertReplacementText" || e.inputType == null)) {
				this.value = option.dataset.value;
				this.reset(false);
				this.dispatch(option.dataset.obj);
				return;
			}
			this.debouncedFetch(value);
		});

		this.input.addEventListener('search', () => {
			if (this.input.value.length === 0) this.reset(false);
			else if (!this.settings.nolimit) {
				const option = selected();
				this.input.setCustomValidity(option ? '' : this.settings.invalid);
				this.input.reportValidity();
			}
		});

		if (this.settings.listMode === 'ul') this.setupULListeners();
	}

	debounced(delay, fn) {
		let timerId;
		return (...args) => {
			clearTimeout(timerId);
			timerId = setTimeout(() => { fn(...args); timerId = null; }, delay);
		};
	}

	dispatch(dataObj = null, isInitial = false) {
		if (!dataObj) return;
		const detail = JSON.parse(dataObj);
		if (isInitial) detail.isInitial = true;
		this.dispatchEvent(new CustomEvent('autoSuggestSelect', { detail, bubbles: true }));
	}

	async fetchData(value) {
		if (!this.settings.cache || !this.data.length) {
			this.dispatchEvent(new CustomEvent('autoSuggestFetchStart', { bubbles: true }));
			try {
				const response = await fetch(this.settings.api + encodeURIComponent(value));
				const data = await response.json();
				this.dispatchEvent(new CustomEvent('autoSuggestFetchEnd', { bubbles: true }));

				this.data = this.settings.apiArrayPath ? 
					this.getNestedValue(data, this.settings.apiArrayPath) || [] :
					Array.isArray(data) ? data : [];

				if (!this.data.length) {
					this.dispatchEvent(new CustomEvent('autoSuggestNoResults', { bubbles: true }));
				}

				this.list.innerHTML = this.render(this.data);

				if (this.settings.listMode === 'ul' && this.data.length) {
					this.list.togglePopover(true);
					this.setAttribute('open', '');
				}
			} catch (error) {
				this.dispatchEvent(new CustomEvent('autoSuggestFetchError', { detail: error, bubbles: true }));
			}
		}
	}

	formReset() {
		this.resetToDefault();
		this.dispatchEvent(new CustomEvent('autoSuggestClear', { bubbles: true }));
	}

	getNestedValue(obj, key) {
		return key ? key.split('.').reduce((acc, part) => 
			acc && typeof acc === 'object' ? acc[part] : undefined, obj) : undefined;
	}

	render(data) {
		return data.map(obj => {
			const value = this.getNestedValue(obj, this.settings.apiValuePath);
			const display = this.getNestedValue(obj, this.settings.apiDisplayPath);
			const text = this.settings.apiTextPath ? this.getNestedValue(obj, this.settings.apiTextPath) : '';
			const dataObj = this.stringifyDataObject(obj);
			return this.settings.listMode === 'ul' 
				? `<li role="option" tabindex="0" data-display="${display}" data-text="${text}" data-value="${value}" data-obj='${dataObj}'>${display}</li>`
				: `<option value="${display}" data-display="${display}" data-text="${text}" data-value="${value}" data-obj='${dataObj}'>${text || ''}</option>`;
		}).join('');
	}

	reset(fullReset = true) {
		if (fullReset) this.resetToDefault();
		this.data = [];
		this.list.innerHTML = this.settings.listMode === 'ul' ? '' : '<option value="">';
		
		if (this.settings.listMode === 'ul') {
			this.list.scrollTo(0, 0);
			this.list.togglePopover(false);
			this.removeAttribute('open');
		}
		
		this.input.setCustomValidity('');
		this.dispatchEvent(new CustomEvent('autoSuggestClear', { bubbles: true }));
	}

	resetToDefault() {
		const display = this.getNestedValue(this.initialObject, this.settings.apiDisplayPath) || this.defaultValues.input;
		const value = this.getNestedValue(this.initialObject, this.settings.apiValuePath) || this.defaultValues.value;

		this.displayValue = display;
		this.input.value = display;
		this.value = value;

		this.input.setCustomValidity('');
		if (this.settings.listMode === 'ul') {
			this.list.togglePopover(false);
			this.removeAttribute('open');
		}
	}

	selectItem(target) {
		const { obj, value } = target.dataset;
		const displayText = target.textContent.trim();

		this.value = value;
		this.displayValue = displayText;
		this.input.value = displayText;

		this.reset(false);
		this.dispatch(obj);
		setTimeout(() => this.input.focus(), 0);
	}

	setupULListeners() {
		this.list.addEventListener('click', (e) => {
			if (e.target?.tagName === 'LI') this.selectItem(e.target);
		});

		this.list.addEventListener('beforetoggle', (e) => {
			if (e.newState === 'closed') this.removeAttribute('open');
		});

		this.list.addEventListener('keydown', (e) => {
			if (e.target?.tagName === 'LI') {
				if (e.key === 'ArrowDown') {
					e.preventDefault();
					const next = e.target.nextElementSibling;
					if (next) next.focus();
				} else if (e.key === 'ArrowUp') {
					e.preventDefault();
					const prev = e.target.previousElementSibling;
					if (prev) prev.focus();
					else this.input.focus();
				} else if (e.key === 'Enter') {
					this.selectItem(e.target);
				}
			}
		});
	}

	stringifyDataObject(obj) {
		return `${JSON.stringify(obj)}`.replace(/["'\\]/g, c => ({ '"': '&quot;', "'": '&#39;', '\\': '\\\\' }[c]));
	}

	template() {
		const list = this.settings.listMode === 'ul' 
			? `<ul popover id="${this.listId}" part="list" role="listbox" style="position-anchor:--${this.listId}"></ul>`
			: `<datalist id="${this.listId}" part="list"></datalist>`;
		return `
			${this.settings.label ? `<label part="row"><span part="label">${this.settings.label}</span>` : ''}
				<input
					autocomplete="${this.getAttribute('autocomplete') || 'off'}"
					enterkeyhint="search"
					inputmode="search"
					${this.settings.listMode === 'ul' ? '' : `list="${this.listId}"`}
					minlength="${this.getAttribute('minlength') || 3}"
					part="input"
					placeholder="${this.getAttribute('placeholder') || ''}"
					spellcheck="${this.getAttribute('spellcheck') || false}"
					style="anchor-name:--${this.listId}"
					type="${this.getAttribute('type') || 'search'}"
					value="${this.defaultValues.input}">
			${this.settings.label ? '</label>' : ''}
			${list}`;
	}
}

if (!customElements.get('auto-suggest')) {
	customElements.define('auto-suggest', AutoSuggest);
}
