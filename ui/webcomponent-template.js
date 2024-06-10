// import stylesheet from './main.css' with { type: 'css' };
/**
 * app
 * description
 * @author Mads Stoumann
 * @version 1.0.00
 * @summary 01-01-2024
 * @class
 * @extends {HTMLElement}
 */
class App extends HTMLElement {
	static observedAttributes = [];
	constructor() {
		super();
		
	}
	/**
	* Invoked when the custom element is connected to the document's DOM.
	* Initializes the shadow DOM, sets up event listeners, and performs necessary setup.
	*/
	async connectedCallback() {
		const shadow = this.attachShadow({ mode: 'open' })
		const template = document.createElement('template');
		//template.innerHTML = this.renderTemplate();
		// shadow.adoptedStyleSheets = [stylesheet];
		shadow.appendChild(template.content.cloneNode(true));
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (!newValue || oldValue === newValue) return;
		console.log(`Attribute: ${name} changed from ${oldValue} to ${newValue}`);
	}
}
customElements.define('custom-app', App);