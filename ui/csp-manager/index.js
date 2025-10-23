import cspDirectives from './csp-directives.json' with { type: 'json' };
import i18nData from './i18n.json' with { type: 'json' };
import styles from './index.css' with { type: 'css' };

class CspManager extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.adoptedStyleSheets = [styles];
	}

	/**
	 * Get translated text from i18n file
	 * @param {string} key - The translation key (supports dot notation for nested keys)
	 * @returns {string} Translated text or the key if not found
	 */
	t(key) {
		const keys = key.split('.');
		let value = i18nData[this.lang];

		for (const k of keys) {
			if (value && typeof value === 'object' && k in value) {
				value = value[k];
			} else {
				return key; // Fallback to key if not found
			}
		}

		return typeof value === 'string' ? value : key;
	}

	/**
	 * Initialize state from external JSON files
	 * Merges CSP directives configuration with i18n descriptions
	 */
	initializeState() {
		const state = {};
		const descriptions = i18nData[this.lang]?.directives || {};

		// Default enabled directives (matching original behavior)
		const defaultEnabled = ['base-uri', 'default-src', 'frame-ancestors', 'object-src', 'script-src', 'style-src'];

		Object.entries(cspDirectives).forEach(([key, config]) => {
			state[key] = {
				enabled: defaultEnabled.includes(key),
				defaults: [...config.defaults],
				added: [],
				description: descriptions[key] || ''
			};

			// Add boolean flag if type is boolean
			if (config.type === 'boolean') {
				state[key].boolean = true;
			}

			// Add tokens if type is token-list
			if (config.type === 'token-list' && config.tokens) {
				state[key].tokens = [...config.tokens];
			}
		});

		return state;
	}

	get policy() {
		// Return client-format policy: only enabled directives with their added values
		const clientPolicy = {};
		Object.entries(this.state).forEach(([key, value]) => {
			if (value.enabled) {
				clientPolicy[key] = {
					added: value.added || []
				};
				// Include defaults if present
				if (value.defaults && value.defaults.length > 0) {
					clientPolicy[key].defaults = value.defaults;
				}
			}
		});
		return clientPolicy;
	}

	set policy(clientPolicy) {
		if (typeof clientPolicy !== 'object' || clientPolicy === null) {
			return;
		}

		// Client policy approach: Only directives in clientPolicy are enabled
		// All directives start disabled, then we enable only what client provides
		Object.keys(this.state).forEach(key => {
			this.state[key].enabled = false;
		});

		Object.keys(clientPolicy).forEach(key => {
			if (this.state[key]) {
				// Enable this directive
				this.state[key].enabled = true;

				// Merge the client's added values
				if (clientPolicy[key] && Array.isArray(clientPolicy[key].added)) {
					this.state[key].added = [...clientPolicy[key].added];
				}

				// Optionally allow client to override defaults
				if (clientPolicy[key] && Array.isArray(clientPolicy[key].defaults)) {
					this.state[key].defaults = [...clientPolicy[key].defaults];
				}
			}
		});

		this.render();
	}

	get cspString() {
		return this.generateCspString();
	}

	/**
	 * Get list of available (disabled) directives
	 * @returns {Array<{key: string, description: string}>}
	 */
	getAvailableDirectives() {
		return Object.entries(this.state)
			.filter(([, valueObj]) => !valueObj.enabled)
			.map(([key, valueObj]) => ({
				key,
				description: valueObj.description
			}))
			.sort((a, b) => a.key.localeCompare(b.key));
	}

	/**
	 * Enable a directive by name
	 * @param {string} directiveName - The directive to enable
	 */
	enableDirective(directiveName) {
		if (this.state[directiveName] && !this.state[directiveName].enabled) {
			this.state[directiveName].enabled = true;
			this.render();
			this.updateCspString();
		}
	}

	updateCspString() {
		const cspString = this.generateCspString();
		this.shadowRoot.querySelector('pre code').innerHTML = cspString;
	}

	addValue(directive, value) {
		if (this.state[directive] && value) {
			this.state[directive].added.push(value);
			const ul = this.shadowRoot.querySelector(`[data-ul-for="${directive}"]`);
			if (ul) {
				const li = document.createElement('li');
				li.textContent = value;
				const button = document.createElement('button');
				button.dataset.remove = '';
				button.dataset.directive = directive;
				button.dataset.index = this.state[directive].added.length - 1;
				button.textContent = '×';
				li.append(button);
				ul.append(li);
			}
			this.updateCspString();
		}
	}

	removeValue(directive, index) {
		if (this.state[directive] && this.state[directive].added[index] !== undefined) {
			this.state[directive].added.splice(index, 1);
			this.updateCspString();
		}
	}

	generateCspString() {
		const policy = Object.entries(this.state)
			.filter(([, valueObj]) => valueObj.enabled)
			.map(([key, valueObj]) => {
				const allValues = [...valueObj.defaults, ...valueObj.added];
				if (allValues.length === 0) return `\t\t${key}`;
				return `\t\t${key} ${allValues.join(' ')}`;
			})
			.filter(part => part.trim() !== '')
			.join('; \n');

		return `&lt;meta http-equiv="Content-Security-Policy" content="\n${policy}\n\t"&gt;`;
	}

	connectedCallback() {
		document.documentElement.style.setProperty('interpolate-size', 'allow-keywords');
		this.lang = this.getAttribute('lang') || 'en';
		this.state = this.initializeState();
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
		}

		this.shadowRoot.addEventListener('click', (e) => {
			const target = e.target;
			if (target.tagName !== 'BUTTON') return;

			const directive = target.dataset.directive;

			if (target.dataset.add !== undefined) {
				const input = this.shadowRoot.querySelector(`input[type="text"][data-directive="${directive}"]`);
				if (input && input.value) {
					this.addValue(directive, input.value);
					input.value = '';
				}
			} else if (target.dataset.remove !== undefined) {
				const index = parseInt(target.dataset.index, 10);
				this.removeValue(directive, index);
				target.closest('li').remove();
			} else if (target.dataset.addDirective !== undefined) {
				const input = this.shadowRoot.querySelector('#directive-selector');
				if (input && input.value) {
					this.enableDirective(input.value.trim());
					input.value = '';
				}
			}
		});

		this.shadowRoot.addEventListener('change', (e) => {
			const target = e.target;
			if (target.type === 'checkbox' && target.dataset.directive) {
				const directive = target.dataset.directive;
				if (this.state[directive]) {
					this.state[directive].enabled = target.checked;
					this.updateCspString();
				}
			}
		});
	}

	render() {
		const availableDirectives = this.getAvailableDirectives();

		this.shadowRoot.innerHTML = `
			${Object.entries(this.state).map(([key, valueObj]) => {
				const hasTokens = valueObj.tokens && valueObj.tokens.length > 0;
				const inputListAttribute = hasTokens ? `list="${key}-tokens"` : '';
				const dataListElement = hasTokens
					? `<datalist id="${key}-tokens">
							${valueObj.tokens.map(token => `<option value="${token}"></option>`).join('')}
						</datalist>`
					: '';

				return `
					<details name="csp-directive">
						<summary>${key}</summary>
						<div>
							<small>${valueObj.description}</small>
							${valueObj.boolean
								? `<p>${this.t('ui.booleanDirectiveInfo')}</p>`
								: `
									<ul data-ul-for="${key}">
										${valueObj.defaults.map(v => `<li>${v}</li>`).join(' ')}
										${valueObj.added.map((v, i) => `<li>${v}<button data-remove data-directive="${key}" data-index="${i}">×</button></li>`).join(' ')}
									</ul>
									<fieldset>
										<input type="text" data-directive="${key}" placeholder="${this.t('ui.addNewValue')}" ${inputListAttribute}>
										<button data-add data-directive="${key}">${this.t('ui.add')}</button>
									</fieldset>
									${dataListElement}
								`
							}
							<label>
								<input type="checkbox" data-directive="${key}" data-sr ${valueObj.enabled ? 'checked' : ''}> ${this.t('ui.remove')} ${key}
							</label>
						</div>
					</details>
				`;
			}).join('')}
			<pre><code>${this.generateCspString()}</code></pre>
			<fieldset class="add-directive">
				<input
					type="text"
					list="available-directives"
					id="directive-selector"
					placeholder="${this.t('ui.addDirectivePlaceholder')}"
					autocomplete="off">
				<datalist id="available-directives">
					${availableDirectives.map(({ key, description }) =>
						`<option value="${key}">${description}</option>`
					).join('')}
				</datalist>
				<button data-add-directive>${this.t('ui.addDirective')}</button>
			</fieldset>`;
	}
}

customElements.define('csp-manager', CspManager);
