const styles = new CSSStyleSheet();
styles.replaceSync(`
	:host {
		--nav-compass-arrow-width: 8cqi;
		--nav-compass-arrow-line-width: 1.5cqi;

		aspect-ratio: 1;
		background: var(--nav-compass-bg, light-dark(hsl(0, 0%, 95%), hsl(0, 0%, 15%)));
		border-radius: 50%;
		color: var(--nav-compass-c, light-dark(hsl(0, 0%, 15%), hsl(0, 0%, 85%)));
		color-scheme: light dark;
		container-type: inline-size;
		font-family: var(--nav-compass-ff, ui-sans-serif, system-ui, sans-serif);
		display: grid;
		inline-size: 100%;
		overflow: clip;
		place-content: center;
		position: relative;
	}

	/* === Directions === */
	:host::part(directions),
	:host::part(indices) {
		all: unset;
		box-sizing: border-box;
		inset: 0;
		position: absolute;
		width: 100%;
	}
	:host::part(directions) {
		display: grid;
		font-size: var(--weather-api-compass-fs, 7cqi);
		font-weight: var(--weather-api-compass-text-fw, 500);
		grid: repeat(3, 1fr) / repeat(3, 1fr);
	}
	:host [part~=directions] abbr {
		padding: var(--nav-compass-directions-p, .5ch 1ch);
		text-decoration: none; 
	}
	:host::part(north) { grid-area: 1 / 2; place-self: start center; }
	:host::part(east) { grid-area: 2 / 3; place-self: center end; }
	:host::part(south) { grid-area: 3 / 2; place-self: end center; }
	:host::part(west) { grid-area: 2 / 1; place-self: center start; }

	/* === Arrow === */
	:host::part(arrow) {
		display: grid;
		grid-area: 1 / 2 / 4 / 3;
		grid-template-rows: min-content 1fr min-content;
		height: 100%;
		place-self: center;
		rotate: var(--_d, 0deg);
	}
	:host::part(arrow)::before {
		aspect-ratio: 1;
		background: var(--nav-compass-arrow-bg, currentColor);
		clip-path: polygon(50% 0, 100% 100%, 0% 100%);
		content: '';
		grid-area: 1 / 1 / 2 / 2;
		width: var(--nav-compass-arrow-width);
	}
	:host::part(arrow)::after {
		aspect-ratio: 1;
		border: 1.5cqi solid var(--nav-compass-arrow-bg, currentColor);
		border-radius: 50%;
		box-sizing: border-box;
		content: '';
		grid-area: 3 / 1 / 4 / 2;
		width: var(--nav-compass-arrow-width);
	} 
	:host::part(arrow-line) {
		background: var(--nav-compass-arrow-bg, currentColor);
		grid-area: 2 / 1 / 3 / 2;
		justify-self: center;
		mask: linear-gradient(180deg, #FFF 0%, #FFF 30%, #0000 30%, #0000 70%, #FFF 70%, #FFF 100%);
		width: var(--nav-compass-arrow-line-width);
	}

	/* === Header: Label / Value === */
	:host::part(header) {
		grid-area: 2 / 2 / 3 / 3;
		line-height: 1.2;
		margin: 0;
		place-content: center;
		text-align: center;
	}
	:host::part(label) {
		display: block;
		font-size: var(--nav-compass-label-fs, 5cqi);
		font-weight: var(--nav-compass-label-fw, 500);
	}
	:host::part(value) {
		font-size: var(--nav-compass-label-fs, 10cqi);
		font-weight: var(--nav-compass-label-fw, 300);
	}

	/* === Indices & Marks === */
	:host::part(indices) {
		border-radius: 50%;
		color: var(--nav-compass-indices-c, currentColor);
	}
	:host::part(indice),
	:host::part(indice-mark) {
		display: inline-block;
		font-size: var(--nav-compass-indice-fs, 2.5cqi);
		font-weight: var(--nav-compass-indice-fw, 300);
		offset-anchor: top;
		offset-distance: var(--_p, 0%);
		offset-path: content-box;
		width: fit-content;
	}
	:host::part(indice-mark) {
		font-weight: var(--nav-compass-indice-mark-fw, 900);
	}

	/* === Bearing (default) / Course Mode === */
	:host([mode="course"]) {
		rotate: calc(0deg - var(--_d, 0deg));
	}
	:host([mode="course"])::part(header) {
		rotate: var(--_d, 0deg);
	}
`);

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
		this.#root.adoptedStyleSheets = [styles];
		this.#root.innerHTML = `
			<ul part="indices">${this.#generateIndices()}</ul>
			<nav part="directions">
				<abbr part="north" title="${this.#t('N', 'full')}">${this.#t('N', 'abbr')}</abbr>
				<abbr part="east" title="${this.#t('E', 'full')}">${this.#t('E', 'abbr')}</abbr>
				<abbr part="south" title="${this.#t('S', 'full')}">${this.#t('S', 'abbr')}</abbr>
				<abbr part="west" title="${this.#t('W', 'full')}">${this.#t('W', 'abbr')}</abbr>
				<div part="arrow"><b part="arrow-line"></b></div>
				<h3 part="header">
					<span part="value"></span>
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
			const percentage = `${(i * step)}%`;
			return `<li style="--_p:${percentage}" part="${i % mark === 0 ? 'indice-mark': 'indice'}">|</li>`;
		}).join('');
	}

	#update(degree) {
		this.style.setProperty('--_d', `${degree}deg`);
		this.value.textContent = `${this.getAttribute('value') || `${degree}°`}`;
	}
}

customElements.define('nav-compass', NavCompass);