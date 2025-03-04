const styles = await fetch(new URL('./index.css', import.meta.url).href).then(r => r.text());
export default class GuiTabs extends HTMLElement {
	#initialized;
	#panels;
	#root;
	#tabs;
	
	constructor() {
		super();
		this.#initialized = false;
		this.#root = this.attachShadow({mode: 'open'});
		const sheet = new CSSStyleSheet();
		sheet.replaceSync(styles);
		this.#root.adoptedStyleSheets = [sheet];
	}

	connectedCallback() {
		if (!this.#initialized) {
			this.#render();
			this.#setupEventListeners();
			this.#setTab(this.#root.querySelector('[aria-selected="true"]'));
			this.#initialized = true;
		}
	}

	#render() {
		const tabs = Array.from(this.querySelectorAll('gui-tab')).map(tab => (tab.id = tab.id || crypto.randomUUID(), tab));
		this.#root.innerHTML = `
			<nav role="tablist">
				${tabs.map((tab) => {
					return `
						<a href="#${tab.id}" id="label-${tab.id}" role="tab" aria-selected="${tab.hasAttribute('active') ? true : false}" aria-controls="tab-${tab.id}">
							${tab.getAttribute('label')}
						</a>`;
				}
			).join('')}
			</nav>
			<div part="panels">
				${tabs.map((tab) => {
					return `
						<div role="tabpanel" id="tab-${tab.id}" aria-labelledby="label-${tab.id}" hidden>
							${tab.innerHTML}
						</div>
					`;
				}).join('')}
			</div>`
	}

	#setupEventListeners() {
		this.#tabs = Array.from(this.#root.querySelectorAll('a[role="tab"]'));
		this.#panels = Array.from(this.#root.querySelectorAll('div[role="tabpanel"]'));
		this.#tabs.forEach((tab) => {
			tab.addEventListener('click', e => {
				e.preventDefault();
				this.#setTab(tab);
			});
		});
	}

	#setTab(tab) {
		this.#panels.forEach(panel => {
			const active = panel.id == tab.getAttribute('aria-controls');
			panel.hidden = !active;
			panel.setAttribute('aria-selected', active);
		});
	}
}

customElements.define('gui-tabs', GuiTabs);