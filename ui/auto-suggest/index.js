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
		
		this.internals = this.attachInternals();

		this.data = [];
		this.defaultValues = {
			input: this.getAttribute('display') || '',
			value: this.getAttribute('value') || ''
		};
		this.initialObject = this.getAttribute('initial-object') ? JSON.parse(this.getAttribute('initial-object')) : null;
		this.listId = `list${this.uuid()}`;

		/* Settings */
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
		this.settings.nolimit = this.hasAttribute('nolimit');
		this.settings.listMode = this.settings.listMode || 'datalist';

		/* Elements */
		const root = this.hasAttribute('noshadow') ? this: this.attachShadow({ mode: 'open' });
		if (!this.hasAttribute('noshadow')) {
			root.adoptedStyleSheets = [stylesheet];
		}
		root.innerHTML = this.template();

		this.debouncedFetch = this.debounced(300, this.fetchData.bind(this));
		this.input = root.querySelector('input');
		this.list = root.querySelector(`#${this.listId}`);
	}

	get form() { 
		return this.internals.form; 
	}

	get name() { 
		return this.getAttribute('name'); 
	}

	get type() { 
		return this.localName; 
	}

	get value() { 
		return this.internals.elementInternals?.value ?? '';
	}

	set value(v) { 
		this.internals.setFormValue(v);
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


		/* Events */
		this.input.addEventListener('keydown', (event) => {
			if (event.key === 'Enter') {
				event.preventDefault();
				if (this.settings.nolimit) {
					this.dispatchEvent(new CustomEvent('autoSuggestNoSelection'));
					this.reset();
				}
			}

			if (this.settings.listMode === 'ul') {
				if (event.key === 'ArrowDown') {
					event.preventDefault();
					if (this.list.children.length) {
						this.list.togglePopover(true);
						this.list.children[0].focus();
						if (event.key === 'Enter') {
							this.list.togglePopover(false);
						}
					}
				}
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
			this.list.addEventListener('click', (event) => {
				if (event.target && event.target.tagName === 'LI') {
					this.selectItem(event.target);
				}
			});

			this.list.addEventListener('beforetoggle', (event) => {	
				if (event.newState === 'closed') {
					this.removeAttribute('open');
				}
			});
		
			this.list.addEventListener('keydown', (event) => {
				if (event.target && event.target.tagName === 'LI') {
					if (event.key === 'ArrowDown') {
						event.preventDefault();
						const nextItem = event.target.nextElementSibling;
						if (nextItem) {
							nextItem.focus();
						}
					} else if (event.key === 'ArrowUp') {
						event.preventDefault();
						const prevItem = event.target.previousElementSibling;
						if (prevItem) {
							prevItem.focus();
						} else {
							this.input.focus();
						}
					} else if (event.key === 'Enter') {
						this.selectItem(event.target);
					}
				}
			});
		}

		if (this.internals.form) {
			this.internals.form.addEventListener('reset', this.formReset.bind(this));
		}
	}

	disconnectedCallback() {
		if (this.internals.form) {
			this.internals.form.removeEventListener('reset', this.formReset);
		}
	}

	/* Methods */

	debounced(delay, fn) {
		let timerId;
		return (...args) => {
			if (timerId) clearTimeout(timerId);
			timerId = setTimeout(() => { fn(...args); timerId = null; }, delay);
		};
	}

	dispatch(dataObj = null, isInitial = false) {
		const detail = dataObj ? JSON.parse(dataObj) : {};
		if (isInitial) {
			detail.isInitial = true;
		}
		this.dispatchEvent(new CustomEvent('autoSuggestSelect', { detail, bubbles: false }));
	}

	async fetchData(value) {
		if (!this.settings.cache || !this.data.length) {
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

				this.list.innerHTML = this.render(this.data);

				if (this.settings.listMode === 'ul' && this.data.length) {
					this.list.togglePopover(true);
					this.setAttribute('open', '');
				}

			} catch (error) {
				this.dispatchEvent(new CustomEvent('autoSuggestFetchError', { detail: error }));
			}
		}
	}

	formReset() {
		this.resetToDefault();
		this.dispatchEvent(new CustomEvent('autoSuggestClear'));
	}

	getNestedValue(obj, key) {
		if (!key) return undefined;
		return key.split('.').reduce((acc, part) => acc && typeof acc === 'object' ? acc[part] : undefined, obj);
	}

	render(data) {
		const common = (displayValue, textValue, dataValue, dataObject) => 
			`data-display="${displayValue}" data-text="${textValue||''}" data-value="${dataValue}" data-obj='${dataObject}'`;

		return data.map(obj => {
			const dataValue = this.getNestedValue(obj, this.settings.apiValuePath);
			const displayValue = this.getNestedValue(obj, this.settings.apiDisplayPath);
			const textValue = this.settings.apiTextPath ? this.getNestedValue(obj, this.settings.apiTextPath) : '';
			const dataObject = this.stringifyDataObject(obj);

			return this.settings.listMode === 'ul' 
				? `<li role="option" tabindex="0" ${common(displayValue, textValue, dataValue, dataObject)}>${displayValue}</li>`
				: `<option value="${displayValue}" ${common(displayValue, textValue, dataValue, dataObject)}>${textValue || ''}</option>`;
		}).join('');
	}

	reset(fullReset = true) {
		const isUL = this.settings.listMode === 'ul';

		if (fullReset) {
			this.resetToDefault();
		}
		this.data = [];
		this.list.innerHTML = isUL ? '' : `<option value="">`;
		if (isUL) {
			this.list.scrollTo(0, 0);
			this.list.togglePopover(false);
			this.removeAttribute('open');
		}
		this.input.setCustomValidity('');
		this.dispatchEvent(new CustomEvent('autoSuggestClear'));
	}

	resetToDefault() {
		if (this.initialObject) {
			const display = this.getNestedValue(this.initialObject, this.settings.apiDisplayPath);
			const value = this.getNestedValue(this.initialObject, this.settings.apiValuePath);
			this.input.value = display || this.defaultValues.input;
			this.value = value || this.defaultValues.value;
		} else {
			this.input.value = this.defaultValues.input;
			this.value = this.defaultValues.value;
		}
		this.input.setCustomValidity('');
		if (this.settings.listMode === 'ul') {
			this.list.togglePopover(false);
			this.removeAttribute('open');
		}
	}

	selectItem(target) {
		const { obj, value } = target.dataset;
		this.input.value = target.textContent.trim();
		this.value = value;
		this.reset(false);
		this.internals.setFormValue(value);
		this.dispatch(obj);
		setTimeout(() => this.input.focus(), 0);
	};

	stringifyDataObject(obj) {
		return JSON.stringify(obj)
			.replace(/\\/g, '\\\\')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	template() {
		const list = this.settings.listMode === 'ul' ? `<ul popover id="${this.listId}" part="list" role="listbox" style="position-anchor:--${this.listId}"></ul>` : `<datalist id="${this.listId}" part="list"></datalist>`;
		return `
		${this.settings.label ? `<label part="row"><span part="label">${this.settings.label}</span>` : ''}
			<input
				autocomplete="${this.getAttribute('autocomplete') || 'off'}"
				enterkeyhint="search"
				inputmode="search"
				${this.settings.listMode === 'ul' ? '' : `list="${this.listId}"`}
				minlength="${this.getAttribute('minlength') || 3}"
				name="${this.getAttribute('name') || 'key'}"
				part="input"
				placeholder="${this.getAttribute('placeholder') || ''}"
				spellcheck="${this.getAttribute('spellcheck') || false}"
				style="anchor-name:--${this.listId}"
				type="${this.getAttribute('type') || 'search'}"
				value="${this.defaultValues.input}">
		${this.settings.label ? `</label>` : ''}
		${list}`;
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

/* === STYLES === */
const stylesheet = new CSSStyleSheet()
stylesheet.replaceSync(`
	:host { /* Custom Styles Placeholder */ }
`);

if (!customElements.get('auto-suggest')) {
	customElements.define('auto-suggest', AutoSuggest);
}