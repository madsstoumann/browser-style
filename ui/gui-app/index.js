import '@browser.style/gui-panel';
import '@browser.style/gui-tabs';

const icon = (paths, part) => `<svg part="icon${part ? ` ${part}`:''}" viewBox="0 0 24 24">${paths.map(d => `<path d="${d}" />`).join('')}</svg>`;
const styles = await fetch(new URL('./index.css', import.meta.url).href).then(r => r.text());

class GuiApp extends HTMLElement {
	#root; #elements;
	
	#ICONS = {
		panelEnd: ['M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z','M15 4l0 16'],
		panelStart: ['M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z', 'M9 4l0 16']
	};

	constructor() {
		super();
		this.#root = this.attachShadow({mode: 'open'});
		const sheet = new CSSStyleSheet();
		sheet.replaceSync(styles);
		this.#root.adoptedStyleSheets = [sheet];
		this.init();
	}

	init() {
		const hasFooter = !!this.querySelector('[slot="footer"]');
		const hasPanelEnd = !!this.querySelector('[slot="panel-end"]');
		const hasPanelStart = !!this.querySelector('[slot="panel-start"]');

		this.setDefaultAttributes(hasPanelStart, 'panel-start');
		this.setDefaultAttributes(hasPanelEnd, 'panel-end');

		if (hasPanelEnd || hasPanelStart) {
			this.addEventListener('gui-panel-mode', (event) => {
				const { docked, position } = event.detail;
				this.setAttribute(`panel-${position}-docked`, docked);
			});
		}

		this.#root.innerHTML = `
			<header part="header">
				${hasPanelStart ? `
					<button type="button" part="toggle-panel-start">
						${icon(this.#ICONS.panelStart, 'panel-start-icon')}
					</button>
				` : ''}
				<slot name="header"></slot>
				${hasPanelEnd ? `
					<button type="button" part="toggle-panel-end">
						${icon(this.#ICONS.panelEnd, 'panel-end-icon')}
					</button>
				` : ''}
			</header>
			${hasPanelStart ? '<slot name="panel-start"></slot>' : ''}
			<main part="main">
				<slot name="main"></slot>
			</main>
			${hasPanelEnd ? '<slot name="panel-end"></slot>' : ''}
			${hasFooter ? `<footer part="footer"><slot name="footer"></slot></footer>` : ''}
		`;

		this.#elements = {
			toggleStart: this.#root.querySelector('[part="toggle-panel-start"]'),
			toggleEnd: this.#root.querySelector('[part="toggle-panel-end"]')
		}

		this.#elements.toggleStart?.addEventListener('click', () => this.togglePanel('start'));
		this.#elements.toggleEnd?.addEventListener('click', () => this.togglePanel('end'));
	}

	setDefaultAttributes(hasPanel, panelType) {
		if (hasPanel) {
			if (!this.hasAttribute(panelType)) {
				this.setAttribute(panelType, 'closed');
			}
			if (!this.hasAttribute(`${panelType}-docked`)) {
				this.setAttribute(`${panelType}-docked`, 'true');
			}
		}
	}

	togglePanel(position) {
		const open = this.getAttribute(`panel-${position}`) === 'open';
		this.setAttribute(`panel-${position}`, open ? 'closed' : 'open');
	}
}

customElements.define('gui-app', GuiApp);
