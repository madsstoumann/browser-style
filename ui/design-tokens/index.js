import '../design-token/index.js';

const styles = new CSSStyleSheet();
styles.replaceSync(`
	:host { display: block; font-family: system-ui, sans-serif; padding: 1rem; }
	details { margin-bottom: 1rem; }
	summary {
		cursor: pointer;
		text-transform: uppercase;
		font-weight: 600;
		padding: 0.5rem 0;
		border-bottom: 1px solid color-mix(in srgb, currentColor, transparent 80%);
	}
	.tokens {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1rem;
		padding: 1rem 0;
	}
`);

export default class DesignTokens extends HTMLElement {
	static get observedAttributes() {
		return ['src'];
	}

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.adoptedStyleSheets = [styles];
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (name === 'src' && oldValue !== newValue) {
			this.render();
		}
	}

	connectedCallback() {
		this.render();
	}

	async render() {
		const src = this.getAttribute('src');
		if (!src) return;

		try {
			const response = await fetch(src);
			const json = await response.json();
			const tokens = [];

			this.shadowRoot.innerHTML = Object.entries(json)
				.filter(([key]) => !key.startsWith('$'))
				.map(([key, value]) => `
					<details name="tokens" part="group">
						<summary part="header">${key}</summary>
						<div part="tokens">${this.renderGroup(value, key, tokens)}</div>
					</details>
				`).join('');

			this.shadowRoot.querySelectorAll('design-token').forEach((el, i) => {
				el.src = tokens[i];
			});

		} catch (e) {
			this.shadowRoot.innerHTML = `<div style="color:red">Error loading tokens: ${e.message}</div>`;
		}
	}

	renderGroup(group, path, tokens) {
		if (group.$value) {
			tokens.push(group); console.log(group);
			return `<design-token name="${path}"></design-token>`;
		}

		return Object.entries(group)
			.filter(([key]) => !key.startsWith('$'))
			.map(([key, value]) => this.renderGroup(value, `${path}.${key}`, tokens))
			.join('');
	}
}

customElements.define('design-tokens', DesignTokens);
