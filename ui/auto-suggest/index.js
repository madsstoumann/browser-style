/**
 * AutoSuggest
 * @description <auto-suggest> is a custom element that provides a search input field with auto-suggest functionality.
 * @author Mads Stoumann
 * @version 1.0.19
 * @summary 07-01-2025
 * @class AutoSuggest
 * @extends {HTMLElement}
 */
export class AutoSuggest extends HTMLElement {
	static formAssociated = true;

	constructor() {
		super();
		if (this.hasAttribute('nomount')) return;

		this.isFormControl = this.hasAttribute('formcontrol');
		this.internals = this.isFormControl ? this.attachInternals() : null;

		if (this.isFormControl) {
			const initialValue = this.getAttribute('value') || '';
			this.displayValue = this.getAttribute('display') || '';
			this.internals.setFormValue(initialValue, this.getAttribute('name') || '');
		}

		this.data = [];
		this.defaultValues = {
			input: this.getAttribute('display') || '',
			value: this.getAttribute('value') || ''
		};

		this.initialObject = JSON.parse(this.getAttribute('initial-object') || 'null');
		this.listId = `list${crypto.randomUUID().replace(/-/g, '')}`;

		this.settings = ['api', 'api-array-path', 'api-display-path', 'api-text-path', 'api-value-path', 'cache', 'invalid', 'label', 'list-mode'].reduce((settings, attr) => {
			const value = this.getAttribute(attr);
			settings[attr.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = value ?? null;
			return settings;
		}, {});

		if (!this.settings.api) {
			console.error('API endpoint is not defined.');
			return;
		}

		this.settings.cache = this.settings.cache === 'true';
		this.settings.listMode = this.settings.listMode || 'datalist';
		this.settings.nolimit = this.hasAttribute('nolimit');

		const root = this.hasAttribute('noshadow') ? this : this.attachShadow({ mode: 'open' });
		if (!this.hasAttribute('noshadow')) {
			root.adoptedStyleSheets = [stylesheet];
		}

		root.innerHTML = this.template();
		this.input = root.querySelector('input');
		this.list = root.querySelector(`#${this.listId}`);

		this.debouncedFetch = this.debounced(300, this.fetchData.bind(this));
	}

	get form() { return this.isFormControl ? this.internals.form : null; }
	get name() { return this.getAttribute('name'); }
	get type() { return this.localName; }
	get value() { 
		return this.isFormControl ? 
			(this.internals?.elementInternals?.value ?? this.getAttribute('value') ?? '') :
			(this.input?.value ?? '');
	}
	set value(v) { 
		if (this.isFormControl) {
			this.internals.setFormValue(v, this.getAttribute('name') || '');
			this.setAttribute('value', v || '');
		} else if (v) {
			this.setAttribute('value', v);
		} else {
			this.removeAttribute('value');
		}
	}

	connectedCallback() {
		const limitToSelection = () => {
			const option = selected();
			this.input.setCustomValidity(option ? '' : this.settings.invalid);
			this.input.reportValidity();
		};

		const onentry = (event) => {
			const value = this.input.value.length >= this.input.minLength ? this.input.value.toLowerCase() : '';
			if (!value) return;

			const option = selected();
			if (option && (event.inputType === "insertReplacementText" || event.inputType == null)) {
				this.value = option.dataset.value;
				this.reset(false);
				this.dispatch(option.dataset.obj);
				return;
			}

			this.debouncedFetch(value);
		};

		const selected = () => {
			if (this.settings.listMode === 'ul') return null;
			const option = [...this.list.options].find(entry => entry.value === this.input.value);
			return option || null;
		};

		this.input.addEventListener('keydown', (event) => {
			if (event.key === 'Enter') {
				event.preventDefault();
				if (this.settings.nolimit) {
					this.dispatchEvent(new CustomEvent('autoSuggestNoSelection', { bubbles: true }));
					this.reset();
				}
			}

			if (this.settings.listMode === 'ul' && event.key === 'ArrowDown' && this.list.children.length) {
				event.preventDefault();
				this.list.togglePopover(true);
				this.list.children[0].focus();
			}

			if (event.key === 'z' && (event.ctrlKey || event.metaKey)) {
				this.resetToDefault();
				if (this.initialObject) {
					this.dispatch(JSON.stringify(this.initialObject), true);
				}
			}
		});

		this.input.addEventListener('input', (event) => {
			event.stopPropagation();
			onentry(event);
		});

		this.input.addEventListener('search', () => {
			if (this.input.value.length === 0) {
				this.reset(false);
			} else if (!this.settings.nolimit) {
				limitToSelection();
			}
		});

		if (this.settings.listMode === 'ul') {
			this.setupULListeners();
		}

		if (this.isFormControl && this.internals.form) {
			this.internals.form.addEventListener('reset', this.formReset.bind(this));
		}
	}

	disconnectedCallback() {
		if (this.isFormControl && this.internals.form) {
			this.internals.form.removeEventListener('reset', this.formReset);
		}
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
		this.dispatchEvent(new CustomEvent('autoSuggestSelect', { 
			detail,
			bubbles: true 
		}));
	}

	async fetchData(value) {
		if (!this.settings.cache || !this.data.length) {
			this.dispatchEvent(new CustomEvent('autoSuggestFetchStart', { bubbles: true }));

			try {
				const response = await fetch(this.settings.api + encodeURIComponent(value));
				const fetchedData = await response.json();
				this.dispatchEvent(new CustomEvent('autoSuggestFetchEnd', { bubbles: true }));

				this.data = this.settings.apiArrayPath ? 
					this.getNestedValue(fetchedData, this.settings.apiArrayPath) || [] :
					Array.isArray(fetchedData) ? fetchedData : [];

				if (!this.data.length) {
					this.dispatchEvent(new CustomEvent('autoSuggestNoResults', { bubbles: true }));
				}

				this.list.innerHTML = this.render(this.data);

				if (this.settings.listMode === 'ul' && this.data.length) {
					this.list.togglePopover(true);
					this.setAttribute('open', '');
				}
			} catch (error) {
				this.dispatchEvent(new CustomEvent('autoSuggestFetchError', { 
					detail: error,
					bubbles: true 
				}));
			}
		}
	}

	formReset() {
		this.resetToDefault();
		this.dispatchEvent(new CustomEvent('autoSuggestClear', { bubbles: true }));
	}

	getNestedValue(obj, key) {
		if (!key) return undefined;
		return key.split('.').reduce((acc, part) => 
			acc && typeof acc === 'object' ? acc[part] : undefined, obj);
	}

	getDataAttributes(obj) {
		const dataValue = this.getNestedValue(obj, this.settings.apiValuePath);
		const displayValue = this.getNestedValue(obj, this.settings.apiDisplayPath);
		const textValue = this.settings.apiTextPath ? this.getNestedValue(obj, this.settings.apiTextPath) : '';
		const dataObject = this.stringifyDataObject(obj);
		return `data-display="${displayValue}" data-text="${textValue}" data-value="${dataValue}" data-obj='${dataObject}'`;
	}

	render(data) {
		return data.map(obj => {
			const attrs = this.getDataAttributes(obj);
			const display = this.getNestedValue(obj, this.settings.apiDisplayPath);
			return this.settings.listMode === 'ul' 
				? `<li role="option" tabindex="0" ${attrs}>${display}</li>`
				: `<option value="${display}" ${attrs}>${this.getNestedValue(obj, this.settings.apiTextPath) || ''}</option>`;
		}).join('');
	}

	reset(fullReset = true) {
		if (fullReset) {
			this.resetToDefault();
		}
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

		if (this.isFormControl) {
			this.displayValue = display;
			this.value = value;
		} else {
			this.input.value = display;
			this.value = value;
		}
		
		this.input.setCustomValidity('');
		if (this.settings.listMode === 'ul') {
			this.list.togglePopover(false);
			this.removeAttribute('open');
		}
	}

	selectItem(target) {
		const { obj, value } = target.dataset;
		const displayText = target.textContent.trim();
		
		if (this.isFormControl) {
			this.value = value;
			this.displayValue = displayText;
		} else {
			this.value = value;
			this.input.value = displayText;
		}
		
		this.reset(false);
		this.dispatch(obj);
		setTimeout(() => this.input.focus(), 0);
	}

	setupULListeners() {
		this.list.addEventListener('click', (event) => {
			if (event.target?.tagName === 'LI') {
				this.selectItem(event.target);
			}
		});

		this.list.addEventListener('beforetoggle', (event) => {
			if (event.newState === 'closed') {
				this.removeAttribute('open');
			}
		});

		this.list.addEventListener('keydown', (event) => {
			if (event.target?.tagName === 'LI') {
				if (event.key === 'ArrowDown') {
					event.preventDefault();
					const nextItem = event.target.nextElementSibling;
					if (nextItem) nextItem.focus();
				} else if (event.key === 'ArrowUp') {
					event.preventDefault();
					const prevItem = event.target.previousElementSibling;
					if (prevItem) prevItem.focus();
					else this.input.focus();
				} else if (event.key === 'Enter') {
					this.selectItem(event.target);
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

	static mount() {
		if (!customElements.get('auto-suggest')) {
			customElements.define('auto-suggest', this);
		}
	}
}

/* === STYLES === */
const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(':host { /* Custom Styles Placeholder */ }');

/* === EXPORTS === */
if (!customElements.get('auto-suggest')) {
	customElements.define('auto-suggest', AutoSuggest);
}