import i18nData from './i18n.json' with { type: 'json' };

import { adoptSharedStyles, createTranslator, setState } from '@browser.style/web-config-shared';

const RE_CONTACT = /^Contact:\s*(.+)$/i;
const RE_EXPIRES = /^Expires:\s*(.+)$/i;
const RE_ENCRYPTION = /^Encryption:\s*(.+)$/i;
const RE_ACKNOWLEDGMENTS = /^Acknowledgments:\s*(.+)$/i;
const RE_PREFERRED_LANGUAGES = /^Preferred-Languages:\s*(.+)$/i;
const RE_CANONICAL = /^Canonical:\s*(.+)$/i;
const RE_POLICY = /^Policy:\s*(.+)$/i;
const RE_HIRING = /^Hiring:\s*(.+)$/i;

function jsonEqual(a, b) {
	if (a === b) return true;
	try {
		return JSON.stringify(a) === JSON.stringify(b);
	} catch {
		return false;
	}
}

function toDatetimeLocalValue(dateOrIsoString) {
	if (!dateOrIsoString) return '';
	const date = dateOrIsoString instanceof Date ? dateOrIsoString : new Date(dateOrIsoString);
	if (Number.isNaN(date.getTime())) return '';
	const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
	return local.toISOString().slice(0, 16);
}

function fromDatetimeLocalValue(value) {
	if (!value) return '';
	const [datePart, timePart] = value.split('T');
	if (!datePart || !timePart) return '';
	const [year, month, day] = datePart.split('-').map(n => parseInt(n, 10));
	const [hour, minute, secondPart] = timePart.split(':');
	const second = secondPart ? parseInt(secondPart, 10) : 0;
	const date = new Date(year, month - 1, day, parseInt(hour, 10), parseInt(minute, 10), Number.isFinite(second) ? second : 0, 0);
	if (Number.isNaN(date.getTime())) return '';
	// security.txt expects an RFC3339 datetime; omit milliseconds for a more typical value.
	return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

class WebConfigSecurity extends HTMLElement {
	static get observedAttributes() {
		return ['src', 'lang', 'value'];
	}

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this._loadStyles();
		this.t = createTranslator(i18nData, () => this.lang || this.getAttribute('lang') || 'en');
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

	async _loadStyles() {
		try {
			await adoptSharedStyles(this.shadowRoot);
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
		const changedKeys = setState(this, partialState, {
			equalsByKey: {
				contact: jsonEqual,
				encryption: jsonEqual,
				acknowledgments: jsonEqual,
				canonical: jsonEqual,
				policy: jsonEqual,
				hiring: jsonEqual
			}
		});

		if (changedKeys.length === 0) return;
		this.render();
		this.dispatchChangeEvent();
	}

	get config() {
		return structuredClone(this.state);
	}

	set config(data) {
		if (typeof data !== 'object' || data === null) return;
		this._updateState(data);
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

			if (field === 'expires') {
				this._updateState({ expires: fromDatetimeLocalValue(e.target.value) });
			} else if (field === 'preferredLanguages') {
				this._updateState({ preferredLanguages: e.target.value });
			}
		});
	}

	_renderMultiField(field, label, hint) {
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
		const value = type === 'datetime-local'
			? toDatetimeLocalValue(this.state[field])
			: (this.state[field] || '');
		return `
			<label for="${field}-input"><small>${label}</small>
				<input
					type="${type}"
					id="${field}-input"
					data-field="${field}"
					value="${value}"
					placeholder="${hint}"
				>
			</label>`;
	}

	render() {
		this.shadowRoot.innerHTML = `
			<details name="sec-manager" open data-status="ok">
				<summary>${this.t('ui.required')}</summary>
				<div>
					${this._renderMultiField('contact', this.t('ui.contact'), this.t('ui.contactHint'))}
					${this._renderSingleField('expires', this.t('ui.expires'), this.t('ui.expiresHint'), 'datetime-local')}
				</div>
			</details>

			<details name="sec-manager">
				<summary>${this.t('ui.optional')}</summary>
				<div>
					${this._renderMultiField('encryption', this.t('ui.encryption'), this.t('ui.encryptionHint'))}
					${this._renderMultiField('acknowledgments', this.t('ui.acknowledgments'), this.t('ui.acknowledgmentsHint'))}
					${this._renderSingleField('preferredLanguages', this.t('ui.preferredLanguages'), this.t('ui.preferredLanguagesHint'))}
					${this._renderMultiField('canonical', this.t('ui.canonical'), this.t('ui.canonicalHint'))}
					${this._renderMultiField('policy', this.t('ui.policy'), this.t('ui.policyHint'))}
					${this._renderMultiField('hiring', this.t('ui.hiring'), this.t('ui.hiringHint'))}
				</div>
			</details>

			<pre><code>${this.generateSecurityTxt() || this.t('ui.noOutput')}</code></pre>
		`;
	}
}

customElements.define('web-config-security', WebConfigSecurity);
