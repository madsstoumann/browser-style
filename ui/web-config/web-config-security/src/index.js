import i18nData from './i18n.json' with { type: 'json' };

const RE_CONTACT = /^Contact:\s*(.+)$/i;
const RE_EXPIRES = /^Expires:\s*(.+)$/i;
const RE_ENCRYPTION = /^Encryption:\s*(.+)$/i;
const RE_ACKNOWLEDGMENTS = /^Acknowledgments:\s*(.+)$/i;
const RE_PREFERRED_LANGUAGES = /^Preferred-Languages:\s*(.+)$/i;
const RE_CANONICAL = /^Canonical:\s*(.+)$/i;
const RE_POLICY = /^Policy:\s*(.+)$/i;
const RE_HIRING = /^Hiring:\s*(.+)$/i;

class WebConfigSecurity extends HTMLElement {
	static get observedAttributes() {
		return ['src', 'lang', 'value'];
	}

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this._loadStyles();
		this.i18nConfig = i18nData;
		this.state = {
			contact: [],
			expires: '',
			encryption: [],
			acknowledgments: [],
			preferredLanguages: '',
			canonical: [],
			policy: [],
			hiring: []
		};

		this.ready = new Promise(resolve => this._resolveReady = resolve);
		this._loadedUrls = { src: null };
	}

	t(key) {
		const keys = key.split('.');
		let value = this.i18nConfig[this.lang];
		for (const k of keys) {
			value = value?.[k];
		}
		return typeof value === 'string' ? value : key;
	}

	async _loadStyles() {
		try {
			const [shared, local] = await Promise.all([
				fetch(new URL('../../web-config-shared.css', import.meta.url)).then(r => r.text()),
				// fetch(new URL('./index.css', import.meta.url)).then(r => r.text())
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

	async _loadFromSecurityTxt(url) {
		try {
			const response = await fetch(url);
			const text = await response.text();
			await this.fromString(text);
		} catch (error) {
			console.error(`Failed to load security.txt from ${url}:`, error);
		}
	}

	_updateState(partialState) {
		let stateChanged = false;
		for (const [key, newValue] of Object.entries(partialState)) {
			if (JSON.stringify(this.state[key]) !== JSON.stringify(newValue)) {
				this.state[key] = newValue;
				stateChanged = true;
			}
		}

		if (stateChanged) {
			this.render();
			this.dispatchChangeEvent();
		}
	}

	get config() {
		return JSON.parse(JSON.stringify(this.state));
	}

	set config(data) {
		if (typeof data !== 'object' || data === null) return;
		this.state = { ...this.state, ...data };
		this.render();
		this.dispatchChangeEvent();
	}

	get value() {
		return this.generateSecurityTxt();
	}

	set value(val) {
		this.fromString(val);
	}

	get securityTxt() {
		return this.generateSecurityTxt();
	}

	async fromString(securityTxtString) {
		if (typeof securityTxtString !== 'string' || !securityTxtString.trim()) return;
		await this.ready;

		const newState = {
			contact: [],
			expires: '',
			encryption: [],
			acknowledgments: [],
			preferredLanguages: '',
			canonical: [],
			policy: [],
			hiring: []
		};

		const lines = securityTxtString.split('\n');

		for (const line of lines) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith('#')) continue;

			let match;
			if ((match = trimmed.match(RE_CONTACT))) newState.contact.push(match[1].trim());
			else if ((match = trimmed.match(RE_EXPIRES))) newState.expires = match[1].trim();
			else if ((match = trimmed.match(RE_ENCRYPTION))) newState.encryption.push(match[1].trim());
			else if ((match = trimmed.match(RE_ACKNOWLEDGMENTS))) newState.acknowledgments.push(match[1].trim());
			else if ((match = trimmed.match(RE_PREFERRED_LANGUAGES))) newState.preferredLanguages = match[1].trim();
			else if ((match = trimmed.match(RE_CANONICAL))) newState.canonical.push(match[1].trim());
			else if ((match = trimmed.match(RE_POLICY))) newState.policy.push(match[1].trim());
			else if ((match = trimmed.match(RE_HIRING))) newState.hiring.push(match[1].trim());
		}

		this.config = newState;
	}

	dispatchChangeEvent() {
		const detail = {
			config: this.config,
			securityTxt: this.securityTxt
		};
		this.dispatchEvent(new CustomEvent('sec-change', {
			bubbles: true,
			composed: true,
			detail
		}));
	}

	generateSecurityTxt() {
		let output = '';

		// Required fields
		this.state.contact.forEach(c => output += `Contact: ${c}\n`);
		if (this.state.expires) output += `Expires: ${this.state.expires}\n`;

		if (output) output += '\n';

		// Optional fields
		this.state.encryption.forEach(e => output += `Encryption: ${e}\n`);
		this.state.acknowledgments.forEach(a => output += `Acknowledgments: ${a}\n`);
		if (this.state.preferredLanguages) output += `Preferred-Languages: ${this.state.preferredLanguages}\n`;
		this.state.canonical.forEach(c => output += `Canonical: ${c}\n`);
		this.state.policy.forEach(p => output += `Policy: ${p}\n`);
		this.state.hiring.forEach(h => output += `Hiring: ${h}\n`);

		return output.trim();
	}

	async connectedCallback() {
		this.lang = this.getAttribute('lang') || 'en';
		this._resolveReady();

		const srcUrl = this.getAttribute('src');
		const value = this.getAttribute('value');

		if (srcUrl) {
			this._loadedUrls.src = srcUrl;
			await this._loadFromSecurityTxt(srcUrl);
		} else if (value) {
			await this.fromString(value);
		}

		const initialConfig = this.getAttribute('initial-config');
		if (initialConfig) {
			try {
				this.config = JSON.parse(initialConfig);
			} catch (e) {
				console.error('Failed to parse initial-config attribute:', e);
				this.render();
			}
		} else if (!srcUrl && !value) {
			this.render();
		}

		this._attachEventListeners();
	}

	async attributeChangedCallback(name, oldValue, newValue) {
		if (name === 'src' && oldValue !== newValue) {
			if (newValue && this._loadedUrls.src !== newValue) {
				this._loadedUrls.src = newValue;
				await this._loadFromSecurityTxt(newValue);
			}
		} else if (name === 'lang' && oldValue !== newValue) {
			this.lang = newValue;
			this.render();
		} else if (name === 'value' && oldValue !== newValue) {
			await this.fromString(newValue);
		}
	}

	_attachEventListeners() {
		this.shadowRoot.addEventListener('click', (e) => {
			const target = e.target.closest('button');
			if (!target) return;

			const action = target.dataset.action;
			const field = target.dataset.field;
			const index = parseInt(target.dataset.index, 10);

			if (action === 'add') {
				const input = this.shadowRoot.querySelector(`input[data-new="${field}"]`);
				if (input?.value) {
					const newValue = input.value.trim();
					this._updateState({ [field]: [...this.state[field], newValue] });
					input.value = '';
					input.focus();
				}
			} else if (action === 'remove') {
				const newList = this.state[field].filter((_, i) => i !== index);
				this._updateState({ [field]: newList });
			}
		});

		this.shadowRoot.addEventListener('input', (e) => {
			const field = e.target.dataset.field;
			if (!field) return;

			if (field === 'expires' || field === 'preferredLanguages') {
				this._updateState({ [field]: e.target.value });
			}
		});
	}

	_renderMultiField(field, label, hint, addLabel) {
		const values = this.state[field];
		return `
			<small>${label}</small>
				${values.length > 0 ? `
				<ul>
					${values.map((val, idx) => `
					<li>${val}
						<button data-action="remove" data-field="${field}" data-index="${idx}" title="${this.t('ui.remove')}">×</button>
					</li>
				`).join('')}
				</ul>
			` : ''}
			<fieldset>
				<input type="text" data-new="${field}" placeholder="${hint}">
				<button data-action="add" data-field="${field}">${this.t('ui.add')}</button>
			</fieldset>`;
	}

	_renderSingleField(field, label, hint, type = 'text') {
		return `
			<label for="${field}-input"><small>${label}</small>
				<input
					type="${type}"
					id="${field}-input"
					data-field="${field}"
					value="${this.state[field] || ''}"
					placeholder="${hint}"
				>
			</label>`;
	}

	render() {
		this.shadowRoot.innerHTML = `
			<details name="sec-manager" open>
				<summary>${this.t('ui.required')}</summary>
				<div>
					${this._renderMultiField('contact', this.t('ui.contact'), this.t('ui.contactHint'), this.t('ui.addContact'))}
					${this._renderSingleField('expires', this.t('ui.expires'), this.t('ui.expiresHint'), 'datetime-local')}
				</div>
			</details>

			<details name="sec-manager">
				<summary>${this.t('ui.optional')}</summary>
				<div>
					${this._renderMultiField('encryption', this.t('ui.encryption'), this.t('ui.encryptionHint'), this.t('ui.addEncryption'))}
					${this._renderMultiField('acknowledgments', this.t('ui.acknowledgments'), this.t('ui.acknowledgmentsHint'), this.t('ui.addAcknowledgment'))}
					${this._renderSingleField('preferredLanguages', this.t('ui.preferredLanguages'), this.t('ui.preferredLanguagesHint'))}
					${this._renderMultiField('canonical', this.t('ui.canonical'), this.t('ui.canonicalHint'), this.t('ui.add'))}
					${this._renderMultiField('policy', this.t('ui.policy'), this.t('ui.policyHint'), this.t('ui.addPolicy'))}
					${this._renderMultiField('hiring', this.t('ui.hiring'), this.t('ui.hiringHint'), this.t('ui.addHiring'))}
				</div>
			</details>

			<pre><code>${this.generateSecurityTxt() || this.t('ui.noOutput')}</code></pre>
		`;
	}
}

customElements.define('web-config-security', WebConfigSecurity);
