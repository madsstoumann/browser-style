const stylesheet = new CSSStyleSheet()
stylesheet.replaceSync(`
	:host {
		background: var(--CanvasGray);
		border-radius: 0.5ch;
		padding: 1ch 2ch;
	}
	code {
		color: var(--ButtonText);
		font-size: smaller;
	}
`)
export default class uiLocation extends HTMLElement {
	connectedCallback() {
		this.attachShadow({ mode: "open" }).adoptedStyleSheets = [stylesheet]
		this.fetchLocation()
	}

	async fetchLocation() {
		const [error, geolabel, iplabel, token] = ['error', 'geolabel', 'iplabel', 'token'].map(attr => this.getAttribute(attr) || '')
		try {
			const data = await (await fetch(`https://ipinfo.io/json?token=${token}`)).json();
			this.shadowRoot.innerHTML = `
				<strong>${geolabel}</strong> ${data.city ? `${data.city}, ${data.region}, ${data.country}` : error || 'Location not available'}.
				<strong>${iplabel}</strong> <code>${data.ip || error}</code>`
		} catch (err) {
			this.shadowRoot.innerHTML = `<strong>${error}</strong>`
			console.error(err);
		}
	}
}
customElements.define("ui-location", uiLocation);