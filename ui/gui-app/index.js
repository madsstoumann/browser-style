import '@browser.style/gui-panel';
import '@browser.style/gui-tabs';

/**
 * @module gui-app
 * @description 
 * @version 1.0.0
 * @date 2025-03-06
 * @author Mads Stoumann
 * @license MIT
 */

class GuiApp extends HTMLElement {
	#root;
	#ICONS = {
		panelEnd: ['M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z', 'M15 4l0 16'],
		panelStart: ['M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z', 'M9 4l0 16'],
		panelSettings: ['M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0', 'M12 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0', 'M12 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0']
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
		return `<svg part="icon${part ? ` ${part}` : ''}" viewBox="0 0 24 24">${this.#ICONS[type].map(d => `<path d="${d}" />`).join('')}</svg>`;
	}

	init() {
		const hasFooter = !!this.querySelector('[slot="footer"]');
		const hasPanelEnd = !!this.querySelector('[slot="panel-end"]');
		const hasPanelStart = !!this.querySelector('[slot="panel-start"]');
		const hasSettings = !!this.querySelector('[slot="settings"]');

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
				<nav part="header-nav">
					${hasPanelStart ? `<button type="button" part="toggle-panel-start">${this.#icon('panelStart', 'panel-start-icon')}</button>` : ''}
				</nav>
				<span part="title"><slot name="header"></slot></span>
				<nav part="header-nav">
					${hasSettings ? `<button type="button" popovertarget="settings" part="toggle-panel-settings">${this.#icon('panelSettings', 'panel-settings-icon')}</button>` : ''}
					${hasPanelEnd ? `<button type="button" part="toggle-panel-end">${this.#icon('panelEnd', 'panel-end-icon')}</button>` : ''}
				</nav>
			</header>
			${hasPanelStart ? '<slot name="panel-start"></slot>' : ''}
			<main part="main"><slot name="main"></slot></main>
			${hasPanelEnd ? '<slot name="panel-end"></slot>' : ''}
			${hasFooter ? '<footer part="footer"><slot name="footer"></slot></footer>' : ''}
			${hasSettings ? '<slot name="settings"></slot>' : ''}
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
