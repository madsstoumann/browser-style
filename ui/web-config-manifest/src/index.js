import i18nData from './i18n.json' with { type: 'json' };

import { adoptSharedStyles, captureOpenDetailsState, createTranslator, restoreOpenDetailsState, setState } from '@browser.style/web-config-shared';

class WebConfigManifest extends HTMLElement {
	static formAssociated = true;
	static observedAttributes = ['lang', 'value', 'src'];

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this._loadStyles();
		this._internals = this.attachInternals();
		this._loadedUrls = { src: null };
		this.t = createTranslator(i18nData, () => this.lang || this.getAttribute('lang') || 'en');
		
		this.state = {
			name: '',
			short_name: '',
			description: '',
			display: 'standalone',
			orientation: 'any',
			theme_color: '#222222',
			background_color: '#eeeeee',
			start_url: '/',
			scope: '/',
			icons: []
		};
	}

	_applyManifestData(data) {
		if (typeof data !== 'object' || data === null) return;

		const nextState = { ...this.state };
		const stringKeys = ['name', 'short_name', 'description', 'display', 'orientation', 'theme_color', 'background_color', 'start_url', 'scope'];
		for (const key of stringKeys) {
			if (key in data) nextState[key] = String(data[key] ?? '');
		}
		if (Array.isArray(data.icons)) nextState.icons = data.icons;

		this._updateState(nextState);
	}

	async _loadFromManifestJson(url) {
		try {
			const response = await fetch(url);
			const text = await response.text();
			const parsed = JSON.parse(text);
			this._applyManifestData(parsed);
		} catch (error) {
			console.error(`Failed to load manifest.json from ${url}:`, error);
			this.render();
			this._internals.setFormValue(this.value);
		}
	}

	async _loadStyles() {
		try {
			await adoptSharedStyles(this.shadowRoot);
		} catch (error) {
			console.error('Failed to load styles:', error);
		}
	}

	async connectedCallback() {
		const srcUrl = this.getAttribute('src');
		const value = this.getAttribute('value');

		if (srcUrl) {
			this._loadedUrls.src = srcUrl;
			await this._loadFromManifestJson(srcUrl);
			return;
		}

		if (value) {
			try {
				this._applyManifestData(JSON.parse(value));
				return;
			} catch (e) {
				// ignore invalid JSON
			}
		}

		this.render();
		this._internals.setFormValue(this.value);
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) return;
		if (name === 'lang') this.render();
		if (name === 'src') {
			if (newValue && this._loadedUrls.src !== newValue) {
				this._loadedUrls.src = newValue;
				this._loadFromManifestJson(newValue);
			}
			return;
		}
		if (name === 'value') {
			try {
				this._applyManifestData(JSON.parse(newValue));
			} catch (e) {
				// Invalid JSON, ignore
			}
		}
	}

	get value() {
		return JSON.stringify(this.state, null, 2);
	}

	set value(val) {
		this.setAttribute('value', val);
	}

	_updateState(partialState, skipRender = false) {
		const changedKeys = setState(this, partialState);
		if (changedKeys.length === 0) return;
		if (!skipRender) this.render();
		else this.updateOutput();
		this.dispatchChangeEvent();
		this._internals.setFormValue(this.value);
	}

	dispatchChangeEvent() {
		this.dispatchEvent(new CustomEvent('manifest-change', { 
			detail: this.state,
			bubbles: true,
			composed: true 
		}));
	}

	updateOutput() {
		const code = this.shadowRoot.querySelector('code');
		if (code) {
			code.textContent = this.value;
		}
	}

	render() {
		const s = this.state;
		const openState = captureOpenDetailsState(this.shadowRoot);

		this.shadowRoot.innerHTML = `
			<!-- Identity -->
				<details name="manifest-accordion" data-panel="identity" open>
				<summary>${this.t('ui.identity')}</summary>
				<div>
					<label>
						<small>${this.t('ui.name')}</small>
						<input type="text" value="${s.name}" data-key="name" placeholder="${this.t('ui.nameHint')}">
					</label>
					<label>
						<small>${this.t('ui.shortName')}</small>
						<input type="text" value="${s.short_name}" data-key="short_name" placeholder="${this.t('ui.shortNameHint')}">
					</label>
					<label>
						<small>${this.t('ui.description')}</small>
						<textarea data-key="description" placeholder="${this.t('ui.descriptionHint')}">${s.description}</textarea>
					</label>
				</div>
			</details>

			<!-- Presentation -->
			<details name="manifest-accordion" data-panel="presentation">
				<summary>${this.t('ui.presentation')}</summary>
				<div>
					<label>
						<small>${this.t('ui.display')}</small>
						<select data-key="display">
							${['fullscreen', 'standalone', 'minimal-ui', 'browser'].map(k => 
								`<option value="${k}" ${s.display === k ? 'selected' : ''}>${this.t(`options.display.${k}`)}</option>`
							).join('')}
						</select>
					</label>
					<label>
						<small>${this.t('ui.orientation')}</small>
						<select data-key="orientation">
							${['any', 'natural', 'landscape', 'portrait'].map(k => 
								`<option value="${k}" ${s.orientation === k ? 'selected' : ''}>${this.t(`options.orientation.${k}`)}</option>`
							).join('')}
						</select>
					</label>
					
						<small>${this.t('ui.themeColor')}</small>
						<fieldset>
							<input type="color" value="${s.theme_color}" data-key="theme_color">
							<input type="text" value="${s.theme_color}" data-key="theme_color">
						</fieldset>
					
					
						<small>${this.t('ui.backgroundColor')}</small>
						<fieldset>
							<input type="color" value="${s.background_color}" data-key="background_color">
							<input type="text" value="${s.background_color}" data-key="background_color">
						</fieldset>
					
				</div>
			</details>

			<!-- Navigation -->
			<details name="manifest-accordion" data-panel="navigation">
				<summary>${this.t('ui.navigation')}</summary>
				<div>
					<label>
						<small>${this.t('ui.startUrl')}</small>
						<input type="text" value="${s.start_url}" data-key="start_url" placeholder="${this.t('ui.startUrlHint')}">
					</label>
					<label>
						<small>${this.t('ui.scope')}</small>
						<input type="text" value="${s.scope}" data-key="scope" placeholder="${this.t('ui.scopeHint')}">
					</label>
				</div>
			</details>

			<!-- Output -->
			<pre><code>${this.value}</code></pre>
		`;

		restoreOpenDetailsState(this.shadowRoot, openState);

		this.addEventListeners();
	}

	addEventListeners() {
		this.shadowRoot.querySelectorAll('input, select, textarea').forEach(el => {
			el.addEventListener('input', (e) => {
				const key = e.target.dataset.key;
				if (key) {
					this._updateState({ [key]: e.target.value }, true);
					
					// Sync color inputs (text <-> color picker)
					if (key === 'theme_color' || key === 'background_color') {
						const siblings = this.shadowRoot.querySelectorAll(`[data-key="${key}"]`);
						siblings.forEach(sib => {
							if (sib !== e.target) sib.value = e.target.value;
						});
					}
				}
			});
		});
	}
}

customElements.define('web-config-manifest', WebConfigManifest);
