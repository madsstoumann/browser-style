export default class NavCompass extends HTMLElement {
	#root;
	#i18n = {
		'en': { 
			'N': { abbr: 'N', full: 'North' }, 
			'E': { abbr: 'E', full: 'East' }, 
			'S': { abbr: 'S', full: 'South' }, 
			'W': { abbr: 'W', full: 'West' } 
		},
		'es': { 
			'N': { abbr: 'N', full: 'Norte' }, 
			'E': { abbr: 'E', full: 'Este' }, 
			'S': { abbr: 'S', full: 'Sur' }, 
			'W': { abbr: 'O', full: 'Oeste' } 
		},
			'zh': { 
			'N': { abbr: '北', full: '北方' }, 
			'E': { abbr: '东', full: '东方' }, 
			'S': { abbr: '南', full: '南方' }, 
			'W': { abbr: '西', full: '西方' } 
		}
	};
	#lang;

	get basePath() {
		return new URL('.', import.meta.url).href;
	}

	static get observedAttributes() {
		return ['degree'];
	}

	set i18n(i18n) {
		this.#i18n = { ...this.#i18n, ...i18n };
	}

	constructor() {
		super();
		this.#lang = (this.getAttribute('lang') || document.documentElement.getAttribute('lang') || navigator.language || 'en')
		this.#root = this.attachShadow({ mode: 'open' });
		this.#loadStyles();
		this.#root.innerHTML = `
			<ul part="indices">${this.#generateIndices()}</ul>
			<nav part="directions">
				<abbr part="north" title="${this.#t('N', 'full')}">${this.#t('N', 'abbr')}</abbr>
				<abbr part="east" title="${this.#t('E', 'full')}">${this.#t('E', 'abbr')}</abbr>
				<abbr part="south" title="${this.#t('S', 'full')}">${this.#t('S', 'abbr')}</abbr>
				<abbr part="west" title="${this.#t('W', 'full')}">${this.#t('W', 'abbr')}</abbr>
				<div part="arrow" aria-hidden="true">
					<div part="arrow-head"></div>
					<div part="arrow-line"></div>
					<div part="arrow-tail"></div>
				</div>
				<h3 part="header">
					<span part="value" aria-live="polite"></span>
					<span part="label">${this.getAttribute('label')||''}</span>
				</h3>
			</nav>`;
		this.value = this.#root.querySelector('[part="value"]');
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (name === 'degree' && oldValue !== newValue) {
			this.#update(newValue);
		}
	}

	#t(term, type) {
		return (this.#i18n[this.#lang]?.[term]?.[type]) || term;
	}

	#generateIndices() {
		const count = parseInt(this.getAttribute('indices')) || 60;
		const step = 100 / count;
		const mark = count / parseInt(this.getAttribute('marks')) || 5;
		return Array.from({ length: count }, (_, i) => {
			return `<li style="--_p:${i * step}%" part="${i % mark === 0 ? 'indice-mark': 'indice'}"></li>`;
		}).join('');
	}

	async #loadStyles() {
		try {
			const cssPath = this.getAttribute('styles') || 
				(this.basePath ? `${this.basePath}index.css` : 'index.css');
			const response = await fetch(cssPath);
			if (response.ok) {
				const sheet = new CSSStyleSheet();
				sheet.replaceSync(await response.text());
				this.shadowRoot.adoptedStyleSheets = [sheet];
			}
		} catch (_) {}
	}

	#update(degree) {
		this.style.setProperty('--_d', `${degree}deg`);
		this.value.textContent = this.getAttribute('value') || `${degree}°`;
	}
}

customElements.define('nav-compass', NavCompass);