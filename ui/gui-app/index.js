import '@browser.style/gui-group';
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
import { renderIconButton, iconStyles, icoSidebarLeft, icoSidebarRight } from '../gui-icon/index.js';
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
		const iconSheet = new CSSStyleSheet();
		iconSheet.replaceSync(iconStyles);
		this.#root.adoptedStyleSheets = [sheet, iconSheet];
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

		this.#commandHandlerCleanup = CommandHandler.initialize(this);

		this.#root.innerHTML = `
			<header part="header">
				<nav part="header-nav">
					${hasPanelStart ? renderIconButton(icoSidebarLeft, 'Toggle left panel', 'toggle-panel-start') : ''}
					<slot name="header-start-nav"></slot>
				</nav>
				<span part="title"><slot name="header"></slot></span>
				<nav part="header-nav">
					<slot name="header-end-nav"></slot>
					${hasPanelEnd ? renderIconButton(icoSidebarRight, 'Toggle right panel', 'toggle-panel-end') : ''}
				</nav>
			</header>
			${hasPanelStart ? '<slot name="panel-start"></slot>' : ''}
			<main part="main"><slot name="main"></slot></main>
			${hasPanelEnd ? '<slot name="panel-end"></slot>' : ''}
			${hasFooter ? '<footer part="footer"><slot name="footer"></slot></footer>' : ''}
			${hasGuiPanels ? '<slot name="gui-panels"></slot>' : ''}
		`;

		this.#root.querySelectorAll('[part*="toggle-panel-"]').forEach(btn => {
			const position = btn.getAttribute('part').includes('start') ? 'start' : 'end';
			btn.addEventListener('click', () => {
				const open = this.getAttribute(`panel-${position}`) === 'open';
				this.setAttribute(`panel-${position}`, open ? 'closed' : 'open');
			});
		});
	}

	disconnectedCallback() {
		if (this.#commandHandlerCleanup) {
			this.#commandHandlerCleanup();
		}
	}
}

customElements.define('gui-app', GuiApp);
