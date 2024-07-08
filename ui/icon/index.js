import stylesheet from './icon.css' with { type: 'css' };
class UIIcon extends HTMLElement {
	constructor() {
		super();
		const shadow = this.attachShadow({ mode: 'open' });
		shadow.adoptedStyleSheets = [stylesheet];
	}
}
customElements.define('ui-icon', UIIcon);