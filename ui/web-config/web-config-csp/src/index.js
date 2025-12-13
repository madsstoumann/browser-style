import cspDirectives from './csp-directives.json' with { type: 'json' };
import i18nData from './i18n.json' with { type: 'json' };
import { evaluatePolicy } from './evaluate.js';
import { loadAndMergeConfigs } from './config-utils.js';

class WebConfigCsp extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this._loadStyles();
		this.evaluations = null;
		this.state = {};

		// Create templates for reuse
		this._templates = {
			directive: document.createElement('template'),
			value: document.createElement('template'),
		};
		this._templates.value.innerHTML = `<li><button data-remove>×</button></li>`;

		this.ready = new Promise(resolve => this._resolveReady = resolve);
	}

	async _loadStyles() {
		try {
			const [shared, local] = await Promise.all([
				fetch(new URL('../../web-config-shared.css', import.meta.url)).then(r => r.text()),
				fetch(new URL('./index.css', import.meta.url)).then(r => r.text())
			]);
			
			const sharedSheet = new CSSStyleSheet();
			await sharedSheet.replace(shared);
			
			const localSheet = new CSSStyleSheet();
			await localSheet.replace(local);
			
			this.shadowRoot.adoptedStyleSheets = [sharedSheet, localSheet];
		} catch (error) {
			console.error('Failed to load styles:', error);
		}
	}

	t(key) {
		const keys = key.split('.');
		let value = this.i18nConfig[this.lang];
		for (const k of keys) {
			value = value?.[k];
		}
		return typeof value === 'string' ? value : key;
	}

	_initializeState(directivesConfig) {
		const state = {};
		const descriptions = this.i18nConfig[this.lang]?.directives || {};
		for (const [key, config] of Object.entries(directivesConfig)) {
			state[key] = {
				enabled: !!config.enabled,
				defaults: [...config.defaults],
				added: [],
				description: descriptions[key] || '',
				boolean: config.type === 'boolean',
				tokens: config.type === 'token-list' ? [...(config.tokens || [])] : undefined,
			};
		}
		return state;
	}

	_updateState(partialState) {
		let stateChanged = false;
		for (const key in partialState) {
			if (JSON.stringify(this.state[key]) !== JSON.stringify(partialState[key])) {
				this.state[key] = partialState[key];
				stateChanged = true;
			}
		}

		if (stateChanged) {
			this.render();
			if (this.hasAttribute('evaluate')) {
				this.runEvaluation();
			}
			this.dispatchChangeEvent();
		}
	}

	get policy() {
		const clientPolicy = {};
		for (const [key, value] of Object.entries(this.state)) {
			if (value.enabled) {
				clientPolicy[key] = { added: value.added || [] };
				if (value.defaults?.length > 0) {
					clientPolicy[key].defaults = value.defaults;
				}
			}
		}
		return clientPolicy;
	}

	set policy(clientPolicy) {
		if (typeof clientPolicy !== 'object' || clientPolicy === null) return;

		const newState = this._initializeState(this.directivesConfig);
		for (const key in clientPolicy) {
			if (newState[key]) {
				newState[key].enabled = true;
				newState[key].added = [...(clientPolicy[key].added || [])];
				if (clientPolicy[key].defaults) {
					newState[key].defaults = [...clientPolicy[key].defaults];
				}
			}
		}
		this.state = newState; // Directly set state without triggering update cycle yet
		this.render();
		if (this.hasAttribute('evaluate')) this.runEvaluation();
		this.dispatchChangeEvent();
	}

	async fromString(cspString) {
		if (typeof cspString !== 'string' || !cspString.trim()) return;
		await this.ready;

		const newPolicy = {};
		const directives = cspString.trim().split(';').filter(d => d.trim());
		directives.forEach(directive => {
			const parts = directive.trim().split(/\s+/);
			const key = parts.shift();
			if (this.state[key]) {
				const defaults = this.state[key].defaults || [];
				newPolicy[key] = { added: parts.filter(p => !defaults.includes(p)) };
			}
		});
		this.policy = newPolicy;
	}

	get cspString() {
		return this.generateCspString();
	}

	async _loadConfiguration(newConfig = {}) {
		const { directives: customDirectives, i18n: customI18n, rules: customRules } = newConfig;

		// Load from attributes only on first load
		if (Object.keys(newConfig).length === 0) {
			const merged = await loadAndMergeConfigs({ cspDirectives, i18nData }, this);
			this.directivesConfig = merged.directives;
			this.i18nConfig = merged.i18n;
			this.rulesConfig = merged.rules;
		} else {
			// Merge provided configs
			if (customDirectives) this.directivesConfig = { ...this.directivesConfig, ...customDirectives };
			if (customI18n) {
				const mergedI18n = { ...this.i18nConfig };
				for (const lang in customI18n) {
					mergedI18n[lang] = { ...(this.i18nConfig[lang] || {}), ...customI18n[lang] };
					if (customI18n[lang].directives) mergedI18n[lang].directives = { ...(this.i18nConfig[lang]?.directives || {}), ...customI18n[lang].directives };
					if (customI18n[lang].ui) mergedI18n[lang].ui = { ...(this.i18nConfig[lang]?.ui || {}), ...customI18n[lang].ui };
					if (customI18n[lang].eval) mergedI18n[lang].eval = { ...(this.i18nConfig[lang]?.eval || {}), ...customI18n[lang].eval };
				}
				this.i18nConfig = mergedI18n;
			}
			if (customRules) this.rulesConfig = customRules;
		}

		const newState = this._initializeState(this.directivesConfig);
		// Preserve existing state
		for (const key in newState) {
			if (this.state[key]) {
				newState[key].enabled = this.state[key].enabled;
				newState[key].added = [...this.state[key].added];
			}
		}
		this.state = newState;
		this.render();
		if (this.hasAttribute('evaluate')) this.runEvaluation();
		this.dispatchChangeEvent();
	}

	setDirectivesConfig(config) { this._loadConfiguration({ directives: config }); }
	setI18nConfig(config) { this._loadConfiguration({ i18n: config }); }
	setRulesConfig(config) { this._loadConfiguration({ rules: config }); }

	getAvailableDirectives() {
		return Object.entries(this.state)
			.filter(([, value]) => !value.enabled)
			.map(([key, value]) => ({ key, description: value.description }))
			.sort((a, b) => a.key.localeCompare(b.key));
	}

	enableDirective(directiveName) {
		if (this.state[directiveName] && !this.state[directiveName].enabled) {
			const updatedDirective = { ...this.state[directiveName], enabled: true };
			this._updateState({ [directiveName]: updatedDirective });
		}
	}

	runEvaluation() {
		this.evaluations = evaluatePolicy(this.state, this.t.bind(this), this.rulesConfig);
		this.render(); // Re-render to show evaluation results
	}

	dispatchChangeEvent() {
		const detail = { policy: this.policy, cspString: this.cspString };
		if (this.hasAttribute('evaluate') && this.evaluations) {
			detail.evaluations = this.evaluations;
		}
		this.dispatchEvent(new CustomEvent('csp-change', { bubbles: true, composed: true, detail }));
	}

	_addValue(directive, value) {
		if (this.state[directive] && value) {
			const updatedDirective = { ...this.state[directive], added: [...this.state[directive].added, value] };
			this._updateState({ [directive]: updatedDirective });
		}
	}

	_removeValue(directive, index) {
		if (this.state[directive]?.added[index] !== undefined) {
			const newAdded = [...this.state[directive].added];
			newAdded.splice(index, 1);
			const updatedDirective = { ...this.state[directive], added: newAdded };
			this._updateState({ [directive]: updatedDirective });
		}
	}

	_toggleDirective(directive, isEnabled) {
		if (this.state[directive]) {
			const updatedDirective = { ...this.state[directive], enabled: isEnabled };
			this._updateState({ [directive]: updatedDirective });
		}
	}

	generateCspString() {
		const policy = Object.entries(this.state)
			.filter(([, value]) => value.enabled)
			.map(([key, value]) => {
				const allValues = [...value.defaults, ...value.added];
				return allValues.length === 0 ? `\t\t${key}` : `\t\t${key} ${allValues.join(' ')}`;
			})
			.join('; \n');
		return `&lt;meta http-equiv="Content-Security-Policy" content="\n${policy}\n\t"&gt;`;
	}

	async connectedCallback() {
		this.lang = this.getAttribute('lang') || 'en';
		await this._loadConfiguration();

		const initialPolicy = this.getAttribute('initial-policy');
		if (initialPolicy) {
			try {
				this.policy = JSON.parse(initialPolicy);
			} catch (e) {
				console.error('Failed to parse initial-policy attribute:', e);
				this.render();
			}
		} else {
			this.render();
			if (this.hasAttribute('evaluate')) this.runEvaluation();
		}

		this._resolveReady();
		this._attachEventListeners();
	}

	_attachEventListeners() {
		this.shadowRoot.addEventListener('click', (e) => {
			const target = e.target.closest('button');
			if (!target) return;

			const directive = target.dataset.directive;
			if (target.dataset.add !== undefined) {
				const input = this.shadowRoot.querySelector(`input[data-directive="${directive}"]`);
				if (input?.value) {
					this._addValue(directive, input.value);
					input.value = '';
				}
			} else if (target.dataset.remove !== undefined) {
				this._removeValue(directive, parseInt(target.dataset.index, 10));
			} else if (target.dataset.addDirective !== undefined) {
				const input = this.shadowRoot.querySelector('#directive-selector');
				if (input?.value) {
					this.enableDirective(input.value.trim());
					input.value = '';
				}
			}
		});

		this.shadowRoot.addEventListener('change', (e) => {
			if (e.target.type === 'checkbox' && e.target.dataset.directive) {
				this._toggleDirective(e.target.dataset.directive, e.target.checked);
			}
		});
	}

	_renderDirective(key, valueObj) {
		const { description, boolean, tokens, defaults, added, enabled } = valueObj;
		const evaluation = this.hasAttribute('evaluate') && enabled ? this.evaluations?.[key] : null;
		const severityAttr = evaluation ? `data-severity="${evaluation.severity}"` : '';

		const findingsHtml = evaluation?.findings.map(finding => `
			<div class="eval-finding" data-severity="${finding.severity}">
				<strong>${finding.message}</strong>
				${finding.recommendation ? `<em>${finding.recommendation}</em>` : ''}
			</div>`).join('') || '';

		const valuesHtml = boolean ? `<p>${this.t('ui.booleanDirectiveInfo')}</p>` : `
			<ul data-ul-for="${key}">
				${defaults.map(v => `<li>${v}</li>`).join('')}
				${added.map((v, i) => `<li>${v}<button data-remove data-directive="${key}" data-index="${i}">×</button></li>`).join('')}
			</ul>
			<fieldset>
				<input type="text" data-directive="${key}" placeholder="${this.t('ui.addNewValue')}" ${tokens ? `list="${key}-tokens"` : ''}>
				<button data-add data-directive="${key}">${this.t('ui.add')}</button>
			</fieldset>
			${tokens ? `<datalist id="${key}-tokens">${tokens.map(token => `<option value="${token}"></option>`).join('')}</datalist>` : ''}
		`;

		return `
			<details name="csp-directive" ${severityAttr} ${enabled ? '' : 'style="display:none;"'}>
				<summary>${key}</summary>
				<div>
					<small>${description}</small>
					${valuesHtml}
					<div class="eval-findings">${findingsHtml}</div>
					<label>
						<input type="checkbox" data-directive="${key}" data-sr ${enabled ? 'checked' : ''}> ${this.t('ui.remove')} ${key}
					</label>
				</div>
			</details>`;
	}

	render() {
		const availableDirectives = this.getAvailableDirectives();
		const directivesHtml = Object.entries(this.state).map(([key, value]) => this._renderDirective(key, value)).join('');

		this.shadowRoot.innerHTML = `
			${directivesHtml}
			<pre><code>${this.generateCspString()}</code></pre>
			<fieldset class="add-directive">
				<input type="text" list="available-directives" id="directive-selector" placeholder="${this.t('ui.addDirectivePlaceholder')}" autocomplete="off">
				<datalist id="available-directives">
					${availableDirectives.map(({ key, description }) => `<option value="${key}">${description}</option>`).join('')}
				</datalist>
				<button data-add-directive>${this.t('ui.addDirective')}</button>
			</fieldset>`;
	}
}

customElements.define('web-config-csp', WebConfigCsp);
