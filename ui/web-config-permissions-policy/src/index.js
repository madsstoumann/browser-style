import i18nData from './i18n.json' with { type: 'json' };

import { adoptSharedStyles, captureOpenDetailsState, createTranslator, restoreOpenDetailsState, setState } from '@browser.style/web-config-shared';

const FEATURE_GROUPS = {
	privacy: ['camera', 'microphone', 'geolocation', 'interest-cohort'],
	media: ['autoplay', 'picture-in-picture', 'display-capture', 'encrypted-media', 'fullscreen'],
	other: ['payment', 'screen-wake-lock', 'xr-spatial-tracking']
};

const ALL_FEATURES = Object.values(FEATURE_GROUPS).flat();

const MODES = { DISABLED: 'disabled', SELF: 'self', CUSTOM: 'custom' };

function jsonEqual(a, b) {
	if (a === b) return true;
	try {
		return JSON.stringify(a) === JSON.stringify(b);
	} catch {
		return false;
	}
}

function getMode(allowlist) {
	if (!Array.isArray(allowlist) || allowlist.length === 0) return MODES.DISABLED;
	if (allowlist.length === 1 && allowlist[0] === 'self') return MODES.SELF;
	return MODES.CUSTOM;
}

class WebConfigPermissionsPolicy extends HTMLElement {
	static formAssociated = true;
	static observedAttributes = ['lang', 'value'];

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this._loadStyles();
		this._internals = this.attachInternals();
		this.t = createTranslator(i18nData, () => this.lang || this.getAttribute('lang') || 'en');

		this.state = {};
		for (const feature of ALL_FEATURES) {
			this.state[feature] = [];
		}

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
			equalsByKey[key] = jsonEqual;
		}
		const changedKeys = setState(this, partialState, { equalsByKey });
		if (changedKeys.length === 0) return;
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
		for (const feature of ALL_FEATURES) {
			if (feature in data && Array.isArray(data[feature])) {
				nextState[feature] = data[feature];
			}
		}
		if (Object.keys(nextState).length > 0) {
			this._updateState(nextState);
		}
	}

	get value() {
		return JSON.stringify(this.state, null, 2);
	}

	set value(val) {
		this.setAttribute('value', val);
	}

	get headerString() {
		const parts = [];
		for (const feature of ALL_FEATURES) {
			const allowlist = this.state[feature];
			if (!Array.isArray(allowlist) || allowlist.length === 0) {
				parts.push(`${feature}=()`);
			} else {
				const values = allowlist.map(v => v === 'self' ? 'self' : `"${v}"`).join(' ');
				parts.push(`${feature}=(${values})`);
			}
		}
		return parts.join(', ');
	}

	dispatchChangeEvent() {
		this.dispatchEvent(new CustomEvent('permissions-policy-change', {
			detail: { config: this.config, headerString: this.headerString },
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
				const parsed = JSON.parse(value);
				this._applyData(parsed);
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
		for (const feature of ALL_FEATURES) {
			if (feature in data && Array.isArray(data[feature])) {
				this.state[feature] = data[feature];
			}
		}
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) return;
		if (name === 'lang') {
			this.lang = newValue;
			this.render();
		} else if (name === 'value') {
			try {
				const parsed = JSON.parse(newValue);
				this._applyData(parsed);
				this.render();
				this.dispatchChangeEvent();
				this._internals.setFormValue(this.value);
			} catch (e) {
				// ignore invalid JSON
			}
		}
	}

	_renderFeatureRow(feature) {
		const allowlist = this.state[feature] || [];
		const mode = getMode(allowlist);
		const label = this.t(`features.${feature}`);
		const customOrigins = allowlist.filter(v => v !== 'self');

		const row = document.createElement('div');
		row.dataset.feature = feature;

		const small = document.createElement('small');
		small.textContent = label;
		row.appendChild(small);

		const select = document.createElement('select');
		select.dataset.feature = feature;
		select.dataset.action = 'mode';

		for (const [modeKey, modeLabel] of [[MODES.DISABLED, this.t('ui.disabled')], [MODES.SELF, this.t('ui.selfOnly')], [MODES.CUSTOM, this.t('ui.custom')]]) {
			const option = document.createElement('option');
			option.value = modeKey;
			option.textContent = modeLabel;
			if (mode === modeKey) option.selected = true;
			select.appendChild(option);
		}
		row.appendChild(select);

		if (mode === MODES.CUSTOM) {
			if (customOrigins.length > 0) {
				const ul = document.createElement('ul');
				customOrigins.forEach((origin, idx) => {
					const li = document.createElement('li');
					li.textContent = origin;
					const btn = document.createElement('button');
					btn.dataset.remove = '';
					btn.dataset.feature = feature;
					btn.dataset.index = String(idx);
					btn.title = this.t('ui.remove');
					btn.textContent = '\u00d7';
					li.appendChild(btn);
					ul.appendChild(li);
				});
				row.appendChild(ul);
			}

			const fieldset = document.createElement('fieldset');
			const input = document.createElement('input');
			input.type = 'text';
			input.dataset.new = feature;
			input.placeholder = this.t('ui.originHint');
			fieldset.appendChild(input);

			const addBtn = document.createElement('button');
			addBtn.dataset.action = 'add';
			addBtn.dataset.feature = feature;
			addBtn.textContent = this.t('ui.add');
			fieldset.appendChild(addBtn);

			row.appendChild(fieldset);
		}

		return row;
	}

	_attachEventListeners() {
		this.shadowRoot.addEventListener('change', (e) => {
			if (e.target.dataset.action === 'mode') {
				const feature = e.target.dataset.feature;
				const mode = e.target.value;
				if (mode === MODES.DISABLED) {
					this._updateState({ [feature]: [] });
				} else if (mode === MODES.SELF) {
					this._updateState({ [feature]: ['self'] });
				} else if (mode === MODES.CUSTOM) {
					const current = this.state[feature] || [];
					const hasSelf = current.includes('self');
					this._updateState({ [feature]: hasSelf ? current : ['self', ...current] });
				}
			}
		});

		this.shadowRoot.addEventListener('click', (e) => {
			const target = e.target.closest('button');
			if (!target) return;

			const feature = target.dataset.feature;

			if (target.dataset.action === 'add') {
				const input = this.shadowRoot.querySelector(`input[data-new="${feature}"]`);
				if (input?.value) {
					const newOrigin = input.value.trim();
					const current = this.state[feature] || [];
					this._updateState({ [feature]: [...current, newOrigin] });
					input.value = '';
					input.focus();
				}
			} else if (target.dataset.remove !== undefined) {
				const index = parseInt(target.dataset.index, 10);
				const current = this.state[feature] || [];
				const customOrigins = current.filter(v => v !== 'self');
				customOrigins.splice(index, 1);
				const hasSelf = current.includes('self');
				const newList = hasSelf ? ['self', ...customOrigins] : customOrigins;
				this._updateState({ [feature]: newList.length > 0 ? newList : [] });
			}
		});
	}

	render() {
		const openState = captureOpenDetailsState(this.shadowRoot);
		const root = this.shadowRoot;
		root.textContent = '';

		for (const [groupKey, features] of Object.entries(FEATURE_GROUPS)) {
			const details = document.createElement('details');
			details.setAttribute('name', 'permissions-policy');
			details.dataset.panel = groupKey;
			if (groupKey === 'privacy') details.open = true;
			details.dataset.status = 'ok';

			const summary = document.createElement('summary');
			summary.textContent = this.t(`ui.${groupKey}`);
			details.appendChild(summary);

			const wrapper = document.createElement('div');
			for (const feature of features) {
				wrapper.appendChild(this._renderFeatureRow(feature));
			}
			details.appendChild(wrapper);
			root.appendChild(details);
		}

		const pre = document.createElement('pre');
		const code = document.createElement('code');
		code.textContent = this.headerString;
		pre.appendChild(code);
		root.appendChild(pre);

		restoreOpenDetailsState(root, openState);
		this._attachEventListeners();
	}
}

customElements.define('web-config-permissions-policy', WebConfigPermissionsPolicy);
