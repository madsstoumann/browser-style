const styles = await fetch(new URL('./index.css', import.meta.url).href).then(r => r.text());

export default class GuiTabs extends HTMLElement {
	#root = this.attachShadow({ mode: 'open' });
	#initialized = false;
	#tabs = [];  // Store tab elements
	#panels = []; // Store panel elements

	constructor() {
		super();
		const sheet = new CSSStyleSheet();
		sheet.replaceSync(styles);
		this.#root.adoptedStyleSheets = [sheet];
	}

	connectedCallback() {
		if (this.#initialized) return;
		this.#render();
		this.#setupEventListeners();
		this.#setTab(this.#root.querySelector('[aria-selected="true"]'));
		this.#initialized = true;
	}

	#getIconSlot(tab) {
		const slot = tab.querySelector('slot[name="icon"]');
		if (!slot) return '';
		const iconContent = slot.innerHTML;
		slot.remove();
		return `<span part="icon">${iconContent}</span>`;
	}

	#render() {
		const tabs = Array.from(this.querySelectorAll('gui-tab')).map(tab => (tab.id ||= crypto.randomUUID(), tab));
		this.#root.innerHTML = `
			<nav role="tablist" part="tabs">
				${tabs.map(tab => `
					<a draggable="false" href="#${tab.id}" id="label-${tab.id}" role="tab" part="tab" aria-selected="${tab.hasAttribute('active')}" aria-controls="tab-${tab.id}">
						${this.#getIconSlot(tab)}
						<span part="label">${tab.getAttribute('label') || ''}</span>
					</a>
				`).join('')}
			</nav>
			<div part="panels">
				${tabs.map(tab => `
					<div role="tabpanel" part="panel" id="tab-${tab.id}" aria-labelledby="label-${tab.id}" hidden>
						${tab.innerHTML}
					</div>
				`).join('')}
			</div>`;
	}

	#setupEventListeners() {
		this.#tabs = Array.from(this.#root.querySelectorAll('a[role="tab"]'));
		this.#panels = Array.from(this.#root.querySelectorAll('div[role="tabpanel"]'));
		this.#tabs.forEach(tab => tab.addEventListener('click', e => {
			e.preventDefault();
			this.#setTab(tab);
		}));
	}

	#setTab(tab) {
		this.#tabs.forEach(t => {
			t.setAttribute('aria-selected', t === tab);
		});
		this.#panels.forEach(panel => {
			const active = panel.id === tab.getAttribute('aria-controls');
			panel.hidden = !active;
		});
	}
}

customElements.define('gui-tabs', GuiTabs);