import '@browser.style/gui-icon-button';
import '@browser.style/gui-panel';
import '@browser.style/gui-tabs';
import { CommandHandler } from '@browser.style/gui-icon-button';

/**
 * @module gui-app
 * @description 
 * @version 1.0.1
 * @date 2025-03-07
 * @author Mads Stoumann
 * @license MIT
 */
import { renderIcon, icoSidebarLeft, icoSidebarRight } from '../gui-icon/index.js';
class GuiApp extends HTMLElement {
	#root;
  #commandHandlerCleanup;

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

		 // Initialize the command handler
		this.#commandHandlerCleanup = CommandHandler.initialize(this);

		this.#root.innerHTML = `
			<header part="header">
				<nav part="header-nav">
					${hasPanelStart ? `<button type="button" part="toggle-panel-start">${renderIcon(icoSidebarLeft, 'panel-start-icon')}</button>` : ''}
					<slot name="header-start-nav"></slot></span>
				</nav>
				<span part="title"><slot name="header"></slot></span>
				<nav part="header-nav">
					<slot name="header-end-nav"></slot></span>
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

	disconnectedCallback() {
		// Clean up event listener when component is removed
		if (this.#commandHandlerCleanup) {
			this.#commandHandlerCleanup();
		}
	}
}

customElements.define('gui-app', GuiApp);
