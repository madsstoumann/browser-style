class uiComponent extends HTMLElement { 
	connectedCallback() {
		document.body.dispatchEvent(new CustomEvent('uiComponentConnected', {detail: {component: this}}));
	}
}
customElements.define('ui-component', uiComponent);