/**
 * @module gui-group
 * @description A collapsible group component that transforms into a details/summary structure.
 * @version 1.0.0
 * @date 2025-03-10
 * @author Mads Stoumann
 * @license MIT
 */
const styles = await fetch(new URL('./index.css', import.meta.url).href).then(r => r.text());

export default class GuiGroup extends HTMLElement {
	#root;
	get group() { return this.getAttribute('group') || ''; }
	get label() { return this.getAttribute('label') || ''; }

	constructor() {
		super();
		this.#root = this.attachShadow({ mode: 'open' });
		const sheet = new CSSStyleSheet();
		sheet.replaceSync(styles);
		this.#root.adoptedStyleSheets = [sheet];
		this.#root.innerHTML = `
		<details part="group" name="${this.group}">
			<summary part="summary">${this.label}</summary>
			<slot></slot>
		</details>`;
	}

	connectedCallback() {
		const level = parseInt(this.parentElement?.closest('gui-group')?.getAttribute('level') || -1) + 1;
		this.setAttribute('level', level);
		this.#root.querySelector('details').style.setProperty('--_level', level);
	}
}

customElements.define('gui-group', GuiGroup);
