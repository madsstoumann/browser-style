const styles = await fetch(new URL('./index.css', import.meta.url).href).then(r => r.text());
export default class GuiTabs extends HTMLElement {
	#active;
	#initialized;
	#panels;
	#root;
	#tabs;
	
	constructor() {
		super();
		this.#active = 0;
		this.#initialized = false;

		this.#root = this.attachShadow({mode: 'open'});
		const sheet = new CSSStyleSheet();
		sheet.replaceSync(styles);
		this.#root.adoptedStyleSheets = [sheet];
	}

	connectedCallback() {
		if (!this.#initialized) {
			this.#render();
			this.setupEventListeners();
			this.#initialized = true;
		}
	}

	#render() {
		const tabs = Array.from(this.querySelectorAll('gui-tab')).map(tab => (tab.id = tab.id || `tab-${crypto.randomUUID()}`, tab));
		this.#root.innerHTML = `
			<nav role="tablist">
				${tabs.map((tab, index) => {
					return `
						<a href="#${tab.id}" role="tab" aria-selected="${index === this.#active}" aria-controls="${tab.id}">
							${tab.getAttribute('label')}
						</a>`;
				}
			).join('')}
			</nav>
			<div part="panels">
				${tabs.map((tab) => {
					return `
						<div role="tabpanel" id="${tab.id}" aria-labelledby="${tab.id}">
							${tab.innerHTML}
						</div>
					`;
				}).join('')}
			</div>`
	}

	setupEventListeners() {
		this.#tabs = Array.from(this.#root.querySelectorAll('a[role="tab"]'));
		this.#panels = Array.from(this.#root.querySelectorAll('div[role="tabpanel"]'));
		this.#tabs.forEach((tab) => {
			tab.addEventListener('click', e => {
				e.preventDefault();
				const panel = this.#panels.find(panel => panel.id == tab.getAttribute('aria-controls'));
				if (panel) {
					panel.scrollIntoView({
						block: 'nearest',
						inline: 'start'
					});
				}
			});
		});
	}
}

// Register custom elements
customElements.define('gui-tabs', GuiTabs);