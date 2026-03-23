import i18nData from './i18n.json' with { type: 'json' };

import { adoptSharedStyles, captureOpenDetailsState, createTranslator, restoreOpenDetailsState, setState } from '@browser.style/web-config-shared';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
const PRESET_HEADERS = ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'];

function jsonEqual(a, b) {
	if (a === b) return true;
	try {
		return JSON.stringify(a) === JSON.stringify(b);
	} catch {
		return false;
	}
}

class WebConfigCors extends HTMLElement {
	static formAssociated = true;
	static observedAttributes = ['lang', 'value'];

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this._loadStyles();
		this._internals = this.attachInternals();
		this.t = createTranslator(i18nData, () => this.lang || this.getAttribute('lang') || 'en');

		this.state = {
			allowed_origins: [],
			allowed_methods: ['GET', 'OPTIONS'],
			allowed_headers: [],
			expose_headers: [],
			max_age: 86400,
			allow_credentials: false
		};

		this.ready = new Promise(resolve => this._resolveReady = resolve);
	}

	async _loadStyles() {
		try {
			await adoptSharedStyles(this.shadowRoot);
		} catch (error) {
			console.error('Failed to load styles:', error);
		}
	}

	_updateState(partialState) {
		const equalsByKey = {};
		for (const key of Object.keys(partialState)) {
			if (Array.isArray(partialState[key])) equalsByKey[key] = jsonEqual;
		}
		const changedKeys = setState(this, partialState, { equalsByKey });
		if (changedKeys.length === 0) return;

		if (this.state.allowed_origins.includes('*') && this.state.allow_credentials) {
			this.state.allow_credentials = false;
		}

		this.render();
		this.dispatchChangeEvent();
		this._internals.setFormValue(this.value);
	}

	get config() {
		return structuredClone(this.state);
	}

	set config(data) {
		if (typeof data !== 'object' || data === null) return;
		const nextState = {};
		if (Array.isArray(data.allowed_origins)) nextState.allowed_origins = data.allowed_origins;
		if (Array.isArray(data.allowed_methods)) nextState.allowed_methods = data.allowed_methods;
		if (Array.isArray(data.allowed_headers)) nextState.allowed_headers = data.allowed_headers;
		if (Array.isArray(data.expose_headers)) nextState.expose_headers = data.expose_headers;
		if (typeof data.max_age === 'number') nextState.max_age = data.max_age;
		if (typeof data.allow_credentials === 'boolean') nextState.allow_credentials = data.allow_credentials;
		if (Object.keys(nextState).length > 0) this._updateState(nextState);
	}

	get value() {
		return JSON.stringify(this.state, null, 2);
	}

	set value(val) {
		this.setAttribute('value', val);
	}

	get headerStrings() {
		const headers = [];
		if (this.state.allowed_origins.length > 0) {
			headers.push(`Access-Control-Allow-Origin: ${this.state.allowed_origins.join(', ')}`);
		}
		if (this.state.allowed_methods.length > 0) {
			headers.push(`Access-Control-Allow-Methods: ${this.state.allowed_methods.join(', ')}`);
		}
		if (this.state.allowed_headers.length > 0) {
			headers.push(`Access-Control-Allow-Headers: ${this.state.allowed_headers.join(', ')}`);
		}
		if (this.state.expose_headers.length > 0) {
			headers.push(`Access-Control-Expose-Headers: ${this.state.expose_headers.join(', ')}`);
		}
		headers.push(`Access-Control-Max-Age: ${this.state.max_age}`);
		if (this.state.allow_credentials) {
			headers.push('Access-Control-Allow-Credentials: true');
		}
		return headers.join('\n');
	}

	dispatchChangeEvent() {
		this.dispatchEvent(new CustomEvent('cors-change', {
			detail: { config: this.config, headerStrings: this.headerStrings },
			bubbles: true,
			composed: true
		}));
	}

	async connectedCallback() {
		this.lang = this.getAttribute('lang') || 'en';
		this._resolveReady();

		const value = this.getAttribute('value');
		if (value) {
			try {
				this._applyData(JSON.parse(value));
			} catch (e) {
				// ignore invalid JSON
			}
		}

		const initialConfig = this.getAttribute('initial-config');
		if (initialConfig) {
			try {
				this._applyData(JSON.parse(initialConfig));
			} catch (e) {
				console.error('Failed to parse initial-config attribute:', e);
			}
		}

		this.render();
		this._internals.setFormValue(this.value);
	}

	_applyData(data) {
		if (typeof data !== 'object' || data === null) return;
		if (Array.isArray(data.allowed_origins)) this.state.allowed_origins = data.allowed_origins;
		if (Array.isArray(data.allowed_methods)) this.state.allowed_methods = data.allowed_methods;
		if (Array.isArray(data.allowed_headers)) this.state.allowed_headers = data.allowed_headers;
		if (Array.isArray(data.expose_headers)) this.state.expose_headers = data.expose_headers;
		if (typeof data.max_age === 'number') this.state.max_age = data.max_age;
		if (typeof data.allow_credentials === 'boolean') this.state.allow_credentials = data.allow_credentials;
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) return;
		if (name === 'lang') {
			this.lang = newValue;
			this.render();
		} else if (name === 'value') {
			try {
				this._applyData(JSON.parse(newValue));
				this.render();
				this.dispatchChangeEvent();
				this._internals.setFormValue(this.value);
			} catch (e) {
				// ignore invalid JSON
			}
		}
	}

	_renderMultiField(field, label, hint) {
		const values = this.state[field] || [];
		const container = document.createDocumentFragment();

		const small = document.createElement('small');
		small.textContent = label;
		container.appendChild(small);

		if (values.length > 0) {
			const ul = document.createElement('ul');
			values.forEach((val, idx) => {
				const li = document.createElement('li');
				li.textContent = val;
				const btn = document.createElement('button');
				btn.dataset.remove = '';
				btn.dataset.field = field;
				btn.dataset.index = String(idx);
				btn.title = this.t('ui.remove');
				btn.textContent = '\u00d7';
				li.appendChild(btn);
				ul.appendChild(li);
			});
			container.appendChild(ul);
		}

		const fieldset = document.createElement('fieldset');
		const input = document.createElement('input');
		input.type = 'text';
		input.dataset.new = field;
		input.placeholder = hint;
		fieldset.appendChild(input);

		const addBtn = document.createElement('button');
		addBtn.dataset.action = 'add';
		addBtn.dataset.field = field;
		addBtn.textContent = this.t('ui.add');
		fieldset.appendChild(addBtn);

		container.appendChild(fieldset);
		return container;
	}

	_attachEventListeners() {
		this.shadowRoot.addEventListener('click', (e) => {
			const target = e.target.closest('button');
			if (!target) return;

			const field = target.dataset.field;

			if (target.dataset.action === 'add') {
				const input = this.shadowRoot.querySelector(`input[data-new="${field}"]`);
				if (input?.value) {
					const newValue = input.value.trim();
					const current = this.state[field] || [];
					if (!current.includes(newValue)) {
						this._updateState({ [field]: [...current, newValue] });
					}
					input.value = '';
					input.focus();
				}
			} else if (target.dataset.remove !== undefined) {
				const index = parseInt(target.dataset.index, 10);
				const current = this.state[field] || [];
				this._updateState({ [field]: current.filter((_, i) => i !== index) });
			} else if (target.dataset.preset !== undefined) {
				const header = target.dataset.preset;
				const current = this.state.allowed_headers || [];
				if (!current.includes(header)) {
					this._updateState({ allowed_headers: [...current, header] });
				}
			}
		});

		this.shadowRoot.addEventListener('change', (e) => {
			const target = e.target;

			if (target.dataset.method) {
				const method = target.dataset.method;
				const current = this.state.allowed_methods || [];
				if (target.checked) {
					this._updateState({ allowed_methods: [...current, method] });
				} else {
					this._updateState({ allowed_methods: current.filter(m => m !== method) });
				}
			} else if (target.dataset.key === 'allow_credentials') {
				this._updateState({ allow_credentials: target.checked });
			}
		});

		this.shadowRoot.addEventListener('input', (e) => {
			if (e.target.dataset.key === 'max_age') {
				const val = parseInt(e.target.value, 10);
				if (Number.isFinite(val) && val >= 0) {
					this._updateState({ max_age: val });
				}
			}
		});
	}

	render() {
		const openState = captureOpenDetailsState(this.shadowRoot);
		const root = this.shadowRoot;
		root.textContent = '';

		const hasWildcard = this.state.allowed_origins.includes('*');
		const missingOptions = !this.state.allowed_methods.includes('OPTIONS');

		// Origins section
		const originsDetails = document.createElement('details');
		originsDetails.setAttribute('name', 'cors-config');
		originsDetails.dataset.panel = 'origins';
		originsDetails.open = true;
		originsDetails.dataset.status = 'ok';

		const originsSummary = document.createElement('summary');
		originsSummary.textContent = this.t('ui.origins');
		originsDetails.appendChild(originsSummary);

		const originsWrapper = document.createElement('div');
		originsWrapper.appendChild(this._renderMultiField('allowed_origins', this.t('ui.allowedOrigins'), this.t('ui.allowedOriginsHint')));
		originsDetails.appendChild(originsWrapper);
		root.appendChild(originsDetails);

		// Methods section
		const methodsDetails = document.createElement('details');
		methodsDetails.setAttribute('name', 'cors-config');
		methodsDetails.dataset.panel = 'methods';
		methodsDetails.dataset.status = missingOptions ? 'warn' : 'ok';

		const methodsSummary = document.createElement('summary');
		methodsSummary.textContent = this.t('ui.methods');
		methodsDetails.appendChild(methodsSummary);

		const methodsWrapper = document.createElement('div');
		const methodsSmall = document.createElement('small');
		methodsSmall.textContent = this.t('ui.allowedMethods');
		methodsWrapper.appendChild(methodsSmall);

		const methodsFieldset = document.createElement('fieldset');
		for (const method of HTTP_METHODS) {
			const label = document.createElement('label');
			const checkbox = document.createElement('input');
			checkbox.type = 'checkbox';
			checkbox.dataset.method = method;
			checkbox.checked = this.state.allowed_methods.includes(method);
			label.appendChild(checkbox);
			label.appendChild(document.createTextNode(` ${method}`));
			methodsFieldset.appendChild(label);
		}
		methodsWrapper.appendChild(methodsFieldset);

		if (missingOptions) {
			const warn = document.createElement('small');
			warn.dataset.status = 'warn';
			warn.textContent = this.t('ui.optionsWarning');
			methodsWrapper.appendChild(warn);
		}

		methodsDetails.appendChild(methodsWrapper);
		root.appendChild(methodsDetails);

		// Headers section
		const headersDetails = document.createElement('details');
		headersDetails.setAttribute('name', 'cors-config');
		headersDetails.dataset.panel = 'headers';
		headersDetails.dataset.status = 'ok';

		const headersSummary = document.createElement('summary');
		headersSummary.textContent = this.t('ui.headers');
		headersDetails.appendChild(headersSummary);

		const headersWrapper = document.createElement('div');
		headersWrapper.appendChild(this._renderMultiField('allowed_headers', this.t('ui.allowedHeaders'), this.t('ui.allowedHeadersHint')));

		const presetsSmall = document.createElement('small');
		presetsSmall.textContent = this.t('ui.presets');
		headersWrapper.appendChild(presetsSmall);

		const presetsFieldset = document.createElement('fieldset');
		for (const header of PRESET_HEADERS) {
			const btn = document.createElement('button');
			btn.dataset.preset = header;
			btn.textContent = header;
			const isActive = (this.state.allowed_headers || []).includes(header);
			if (isActive) btn.disabled = true;
			presetsFieldset.appendChild(btn);
		}
		headersWrapper.appendChild(presetsFieldset);

		headersWrapper.appendChild(this._renderMultiField('expose_headers', this.t('ui.exposeHeaders'), this.t('ui.exposeHeadersHint')));

		headersDetails.appendChild(headersWrapper);
		root.appendChild(headersDetails);

		// Options section
		const optionsDetails = document.createElement('details');
		optionsDetails.setAttribute('name', 'cors-config');
		optionsDetails.dataset.panel = 'options';
		optionsDetails.dataset.status = hasWildcard && this.state.allow_credentials ? 'danger' : 'ok';

		const optionsSummary = document.createElement('summary');
		optionsSummary.textContent = this.t('ui.options');
		optionsDetails.appendChild(optionsSummary);

		const optionsWrapper = document.createElement('div');

		const maxAgeLabel = document.createElement('label');
		const maxAgeSmall = document.createElement('small');
		maxAgeSmall.textContent = this.t('ui.maxAge');
		maxAgeLabel.appendChild(maxAgeSmall);
		const maxAgeInput = document.createElement('input');
		maxAgeInput.type = 'number';
		maxAgeInput.min = '0';
		maxAgeInput.dataset.key = 'max_age';
		maxAgeInput.value = String(this.state.max_age);
		maxAgeInput.placeholder = this.t('ui.maxAgeHint');
		maxAgeLabel.appendChild(maxAgeInput);
		optionsWrapper.appendChild(maxAgeLabel);

		const credLabel = document.createElement('label');
		const credCheckbox = document.createElement('input');
		credCheckbox.type = 'checkbox';
		credCheckbox.dataset.key = 'allow_credentials';
		credCheckbox.checked = this.state.allow_credentials;
		if (hasWildcard) credCheckbox.disabled = true;
		credLabel.appendChild(credCheckbox);
		credLabel.appendChild(document.createTextNode(` ${this.t('ui.allowCredentials')}`));
		optionsWrapper.appendChild(credLabel);

		if (hasWildcard) {
			const credWarn = document.createElement('small');
			credWarn.dataset.status = 'warn';
			credWarn.textContent = this.t('ui.credentialsWarning');
			optionsWrapper.appendChild(credWarn);
		}

		optionsDetails.appendChild(optionsWrapper);
		root.appendChild(optionsDetails);

		// Output
		const pre = document.createElement('pre');
		const code = document.createElement('code');
		code.textContent = this.headerStrings || this.t('ui.noOutput');
		pre.appendChild(code);
		root.appendChild(pre);

		restoreOpenDetailsState(root, openState);
		this._attachEventListeners();
	}
}

customElements.define('web-config-cors', WebConfigCors);
