const styles = await fetch(new URL('./index.css', import.meta.url).href).then(r => r.text());

export default class GuiTabs extends HTMLElement {
	#root = this.attachShadow({ mode: 'open' });
	#initialized = false;

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
			<nav role="tablist">
				${tabs.map(tab => `
					<a href="#${tab.id}" id="label-${tab.id}" role="tab" aria-selected="${tab.hasAttribute('active')}" aria-controls="tab-${tab.id}">
						${this.#getIconSlot(tab)}
						${tab.getAttribute('label') || ''}
					</a>
				`).join('')}
			</nav>
			<div part="panels">
				${tabs.map(tab => `
					<div role="tabpanel" id="tab-${tab.id}" aria-labelledby="label-${tab.id}" hidden>
						${tab.innerHTML}
					</div>
				`).join('')}
			</div>`;
	}

	#setupEventListeners() {
		const tabs = this.#root.querySelectorAll('a[role="tab"]');
		const panels = this.#root.querySelectorAll('div[role="tabpanel"]');
		tabs.forEach(tab => tab.addEventListener('click', e => {
			e.preventDefault();
			this.#setTab(tab, panels);
		}));
	}

	#setTab(tab, panels = this.#root.querySelectorAll('div[role="tabpanel"]')) {
		panels.forEach(panel => {
			const active = panel.id === tab.getAttribute('aria-controls');
			panel.hidden = !active;
			panel.setAttribute('aria-selected', active);
		});
	}
}

customElements.define('gui-tabs', GuiTabs);