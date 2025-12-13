import i18n from './i18n.json' with { type: 'json' };

class WebConfigManifest extends HTMLElement {
	static formAssociated = true;
	static observedAttributes = ['lang', 'value'];

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this._loadStyles();
		this._internals = this.attachInternals();
		
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

	connectedCallback() {
		this.render();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) return;
		if (name === 'lang') this.render();
		if (name === 'value') {
			try {
				const parsed = JSON.parse(newValue);
				this.state = { ...this.state, ...parsed };
				this.render();
			} catch (e) {
				// Invalid JSON, ignore or handle error
			}
		}
	}

	get value() {
		return JSON.stringify(this.state, null, 2);
	}

	set value(val) {
		this.setAttribute('value', val);
	}

	get t() {
		const lang = this.getAttribute('lang') || 'en';
		return i18n[lang] || i18n['en'];
	}

	updateState(key, value) {
		this.state[key] = value;
		this.updateOutput();
		this.dispatchEvent(new CustomEvent('manifest-change', { 
			detail: this.state,
			bubbles: true,
			composed: true 
		}));
		this._internals.setFormValue(this.value);
	}

	updateOutput() {
		const code = this.shadowRoot.querySelector('code');
		if (code) {
			code.textContent = this.value;
		}
	}

	render() {
		const t = this.t;
		const s = this.state;

		this.shadowRoot.innerHTML = `
			<!-- Identity -->
			<details name="manifest-accordion" open>
				<summary>${t.ui.identity}</summary>
				<div>
					<label>
						<small>${t.ui.name}</small>
						<input type="text" value="${s.name}" data-key="name" placeholder="${t.ui.nameHint}">
					</label>
					<label>
						<small>${t.ui.shortName}</small>
						<input type="text" value="${s.short_name}" data-key="short_name" placeholder="${t.ui.shortNameHint}">
					</label>
					<label>
						<small>${t.ui.description}</small>
						<textarea data-key="description" placeholder="${t.ui.descriptionHint}">${s.description}</textarea>
					</label>
				</div>
			</details>

			<!-- Presentation -->
			<details name="manifest-accordion">
				<summary>${t.ui.presentation}</summary>
				<div>
					<label>
						<small>${t.ui.display}</small>
						<select data-key="display">
							${Object.entries(t.options.display).map(([k, v]) => 
								`<option value="${k}" ${s.display === k ? 'selected' : ''}>${v}</option>`
							).join('')}
						</select>
					</label>
					<label>
						<small>${t.ui.orientation}</small>
						<select data-key="orientation">
							${Object.entries(t.options.orientation).map(([k, v]) => 
								`<option value="${k}" ${s.orientation === k ? 'selected' : ''}>${v}</option>`
							).join('')}
						</select>
					</label>
					
						<small>${t.ui.themeColor}</small>
						<fieldset>
							<input type="color" value="${s.theme_color}" data-key="theme_color">
							<input type="text" value="${s.theme_color}" data-key="theme_color">
						</fieldset>
					
					
						<small>${t.ui.backgroundColor}</small>
						<fieldset>
							<input type="color" value="${s.background_color}" data-key="background_color">
							<input type="text" value="${s.background_color}" data-key="background_color">
						</fieldset>
					
				</div>
			</details>

			<!-- Navigation -->
			<details name="manifest-accordion">
				<summary>${t.ui.navigation}</summary>
				<div>
					<label>
						<small>${t.ui.startUrl}</small>
						<input type="text" value="${s.start_url}" data-key="start_url" placeholder="${t.ui.startUrlHint}">
					</label>
					<label>
						<small>${t.ui.scope}</small>
						<input type="text" value="${s.scope}" data-key="scope" placeholder="${t.ui.scopeHint}">
					</label>
				</div>
			</details>

			<!-- Output -->
			<pre><code>${this.value}</code></pre>
		`;

		this.addEventListeners();
	}

	addEventListeners() {
		this.shadowRoot.querySelectorAll('input, select, textarea').forEach(el => {
			el.addEventListener('input', (e) => {
				const key = e.target.dataset.key;
				if (key) {
					this.updateState(key, e.target.value);
					
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
