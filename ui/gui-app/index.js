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
import { renderIcon, icoSidebarLeft, icoSidebarRight } from '../gui-icon/index.js';
class GuiApp extends HTMLElement {
	#root;

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

	init() {
		const hasFooter = !!this.querySelector('[slot="footer"]');
		const hasGuiPanels = !!this.querySelector('[slot="gui-panels"]');
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
				<nav part="header-nav">
					${hasPanelStart ? `<button type="button" part="toggle-panel-start">${renderIcon(icoSidebarLeft, 'panel-start-icon')}</button>` : ''}
				</nav>
				<span part="title"><slot name="header"></slot></span>
				<nav part="header-nav">
					${hasPanelEnd ? `<button type="button" part="toggle-panel-end">${renderIcon(icoSidebarRight, 'panel-end-icon')}</button>` : ''}
				</nav>
			</header>
			${hasPanelStart ? '<slot name="panel-start"></slot>' : ''}
			<main part="main"><slot name="main"></slot></main>
			${hasPanelEnd ? '<slot name="panel-end"></slot>' : ''}
			${hasFooter ? '<footer part="footer"><slot name="footer"></slot></footer>' : ''}
			${hasGuiPanels ? '<slot name="gui-panels"></slot>' : ''}
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
