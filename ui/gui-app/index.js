import '@browser.style/gui-panel';
import '@browser.style/gui-tabs';

class GuiApp extends HTMLElement {
	#root;
	#ICONS = {
		panelEnd: ['M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z', 'M15 4l0 16'],
		panelStart: ['M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z', 'M9 4l0 16']
	};

	constructor() {
		super();
		this.#root = this.attachShadow({ mode: 'open' });
		this.#loadStyles();
		this.init();
	}

	async #loadStyles() {
		const styles = await fetch(new URL('./index.css', import.meta.url).href).then(r => r.text());
		const sheet = new CSSStyleSheet();
		sheet.replaceSync(styles);
		this.#root.adoptedStyleSheets = [sheet];
	}
	
	#icon(type, part) {
		const paths = this.#ICONS[type];
		return `<svg part="icon${part ? ` ${part}` : ''}" viewBox="0 0 24 24">${paths.map(d => `<path d="${d}" />`).join('')}</svg>`;
	}

	init() {
		const hasFooter = !!this.querySelector('[slot="footer"]');
		const hasPanelEnd = !!this.querySelector('[slot="panel-end"]');
		const hasPanelStart = !!this.querySelector('[slot="panel-start"]');

		['end', 'start'].forEach(pos => {
			if (this.querySelector(`[slot="panel-${pos}"]`)) {
				if (!this.hasAttribute(`panel-${pos}`)) this.setAttribute(`panel-${pos}`, 'closed');
				if (!this.hasAttribute(`panel-${pos}-docked`)) this.setAttribute(`panel-${pos}-docked`, 'true');
			}
		});

		if (hasPanelEnd || hasPanelStart) {
			this.addEventListener('gui-panel-mode', ({ detail: { docked, position } }) => {
				this.setAttribute(`panel-${position}-docked`, docked);
			});
		}

		this.#root.innerHTML = `
			<header part="header">
				${hasPanelStart ? `<button type="button" part="toggle-panel-start">${this.#icon('panelStart', 'panel-start-icon')}</button>` : ''}
				<slot name="header"></slot>
				${hasPanelEnd ? `<button type="button" part="toggle-panel-end">${this.#icon('panelEnd', 'panel-end-icon')}</button>` : ''}
			</header>
			${hasPanelStart ? '<slot name="panel-start"></slot>' : ''}
			<main part="main"><slot name="main"></slot></main>
			${hasPanelEnd ? '<slot name="panel-end"></slot>' : ''}
			${hasFooter ? '<footer part="footer"><slot name="footer"></slot></footer>' : ''}
		`;

		this.#root.querySelectorAll('[part^="toggle-panel-"]').forEach(btn => {
			const position = btn.getAttribute('part').replace('toggle-panel-', '');
			btn.addEventListener('click', () => {
				const open = this.getAttribute(`panel-${position}`) === 'open';
				this.setAttribute(`panel-${position}`, open ? 'closed' : 'open');
			});
		});
	}
}

customElements.define('gui-app', GuiApp);
