import '../design-token/index.js';
import { buildRegistry, exportTokensToCSS, toCssValue } from '../design-token-utils/index.js';

const styles = new CSSStyleSheet();
styles.replaceSync(`
	:host {
		--web-config-tokens-gap: .75rem;
		display: block;
		font-family: system-ui, sans-serif;
	}
	details { padding-inline-start: calc(attr(data-level type(<number>)) * 1rem); }
	[data-token-group] {
		display: grid;
		gap: var(--web-config-tokens-gap);
		grid-template-columns: repeat(4, 1fr);
	}
	[data-level="0"] {
		border-block-end: 1px dotted;
		padding-block: 1ch;
		& > summary {
			font-size: 1.5rem;
			font-weight: 500;
		}
	}
`);

export default class WebConfigTokens extends HTMLElement {
	#fullTokens = null;
	#registry = null;
	#tokenStyles = null;

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.adoptedStyleSheets = [styles];

		// Listen for token changes and update CSS variables
		this.addEventListener('token-changed', (e) => {
			this.handleTokenChange(e.detail);
		});
	}

	async connectedCallback() {
		const src = this.getAttribute('src');
		if (!src) return;
		try {
			const data = await (await fetch(src)).json();
			this.#fullTokens = data;
			this.#registry = buildRegistry(data);

			// Generate CSS custom properties from all tokens
			const tokenCSS = exportTokensToCSS(data, {
				layer: 'design-tokens',
				selector: ':host'
			});

			// Create and adopt stylesheet with token CSS
			this.#tokenStyles = new CSSStyleSheet();
			this.#tokenStyles.replaceSync(tokenCSS);
			this.shadowRoot.adoptedStyleSheets = [styles, this.#tokenStyles];

			this.shadowRoot.replaceChildren(this.render(data));
		} catch (e) {
			this.shadowRoot.innerHTML = `<p>Error loading tokens: ${e.message}</p>`;
		}
	}

	render(data, path = []) {
		if (data.$value !== undefined) {
			const el = document.createElement('design-token');
			const name = data.$extensions?.ui?.name || data.$extensions?.css?.name || path.join('-');
			el.setAttribute('name', name);
			el.registry = this.#registry; // Set registry first before src
			el.src = data;
			return el;
		}

		const entries = Object.entries(data).filter(([k]) => !k.startsWith('$'));

		if (!path.length) {
			const frag = document.createDocumentFragment();
			let first = true;
			entries.forEach(([k, v]) => {
				const node = this.render(v, [k]);
				if (first && node.tagName === 'DETAILS') {
					node.setAttribute('open', '');
					first = false;
				}
				frag.append(node);
			});
			return frag;
		}

		const details = document.createElement('details');
		const level = path.length - 1;
		details.setAttribute('data-level', level);
		details.setAttribute('name', level === 0 ? 'token-group' : path.slice(0, -1).join('-'));

		const summary = document.createElement('summary');
		summary.textContent = data.$extensions?.ui?.title || path.join('-');
		details.append(summary);

		const tokens = document.createElement('div');
		tokens.setAttribute('data-token-group', '');

		const groups = document.createDocumentFragment();
		let firstGroup = true;

		for (const [k, v] of entries) {
			const node = this.render(v, [...path, k]);
			if (v.$value !== undefined) {
				tokens.append(node);
			} else {
				if (firstGroup) {
					node.setAttribute('open', '');
					firstGroup = false;
				}
				groups.append(node);
			}
		}

		if (tokens.hasChildNodes()) details.append(tokens);
		details.append(groups);

		return details;
	}

	handleTokenChange({ token, cssVar }) {
		if (!cssVar || !this.#tokenStyles) return;

		// Regenerate CSS value for this token
		const cssValue = toCssValue(token, this.#registry);

		// Update the CSS variable in the host
		this.style.setProperty(cssVar, cssValue);
	}
}

customElements.define('web-config-tokens', WebConfigTokens);
