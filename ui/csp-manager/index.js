const styles = new CSSStyleSheet();
styles.replaceSync(`
		:host {
			--csp-manager-accent: hsl(211, 100%, 95%);
			--csp-manager-accent-dark: hsl(211, 50%, 50%);
			--csp-manager-buttonface: #efefef;
			--csp-manager-bdrs: .5rem;
			--csp-manager-ff-mono: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace;
			--csp-manager-ff-system: system-ui, sans-serif;
			--csp-manager-gap: 1rem;
			--csp-manager-tab-width: 2;
			
			display: grid;
			font-size: var(--csp-manager-font-size, 16px);
			row-gap: var(--csp-manager-gap);
		}

		button {
			background: var(--csp-manager-buttonface);
			border: 0;
			cursor: pointer;
		}

		button, input {
			border-radius: var(--csp-manager-bdrs);
			font-family: var(--csp-manager-ff-system);
			font-size: inherit;
		}

		details {
			border: 1px solid var(--csp-manager-buttonface);
			border-radius: var(--csp-manager-bdrs);
			padding: var(--csp-manager-gap);
			user-select: none;

			&:has([data-remove]) summary::after { content: ' *'; color: var(--csp-manager-accent-dark); }
			&:not(:has(:checked)) { background: var(--csp-manager-buttonface); opacity: .5; }
		}

		div {
			display: grid;
			margin-block-start: var(--csp-manager-gap);
			row-gap: var(--csp-manager-gap);
		}

		fieldset {
			all: unset;
			display: flex;
			gap: var(--csp-manager-gap);
			button { padding: 0 2ch; }
		}

		input {
			border: 1px solid var(--csp-manager-buttonface);
			flex: 1;
			padding: 1ch 2ch;
		}

		li {
			background: var(--csp-manager-buttonface);
			border-radius: var(--csp-manager-bdrs);
			display: grid;
			font-family: var(--csp-manager-ff-mono);
			font-size: small;
			gap: 1ch;
			grid-auto-flow: column;
			padding: .75ch 1.5ch;
			place-content: center;
			&:has(button) { background: var(--csp-manager-accent); }
			button { all: unset; display: inline-block; padding: 0 0.5ch; cursor: pointer; }
		}

		pre {
			all: unset;
			background: var(--csp-manager-buttonface);
			border-radius: var(--csp-manager-bdrs);
			font-size: small;
			overflow-x: auto;
			padding: 2ch;
			tab-size: var(--csp-manager-tab-width);
			white-space: pre-wrap;
			word-wrap: break-word;
		}
		
		ul {
			all: unset;
			display: flex;
			gap: calc(var(--csp-manager-gap) / 2);
			list-style: none;
		}

		summary {
			font-family: var(--csp-manager-ff-mono);
		}

		::details-content {
			height: 0;
			overflow: clip;
			transition: height 0.5s ease, content-visibility 0.4s ease allow-discrete;
		}
		[open]::details-content {
			height: auto;
		}
}
`);

class CspManager extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.adoptedStyleSheets = [styles];

		this.state = {
			"base-uri": { enabled: true, defaults: ["'self'"], added: [], description: "Restricts the URLs which can be used in a document's &lt;base&gt; element." },
			"child-src": { enabled: false, defaults: ["'self'"], added: [], description: "Defines valid sources for web workers and nested browsing contexts." },
			"connect-src": { enabled: false, defaults: ["'self'"], added: [], description: "Restricts the URLs which can be loaded using script interfaces (e.g., fetch, XHR)." },
			"default-src": { enabled: true, defaults: ["'self'"], added: [], description: "Serves as a fallback for the other fetch directives." },
			"fenced-frame-src": { enabled: false, defaults: [], added: [], description: "Specifies valid sources for nested browsing contexts loaded into &lt;fencedframe&gt; elements." },
			"font-src": { enabled: false, defaults: ["'self'", "data:"], added: [], description: "Specifies valid sources for fonts loaded using @font-face." },
			"form-action": { enabled: false, defaults: ["'self'"], added: [], description: "Restricts the URLs which can be used as the target of a form submissions." },
			"frame-ancestors": { enabled: true, defaults: ["'none'"], added: [], description: "Specifies valid parents that may embed a page using &lt;frame&gt;, &lt;iframe&gt;, &lt;object&gt;, or &lt;embed&gt;." },
			"frame-src": { enabled: false, defaults: ["'self'"], added: [], description: "Specifies valid sources for frames and iframes." },
			"img-src": { enabled: false, defaults: ["'self'", "data:"], added: [], description: "Specifies valid sources of images and favicons." },
			"manifest-src": { enabled: false, defaults: ["'self'"], added: [], description: "Specifies valid sources of application manifest files." },
			"media-src": { enabled: false, defaults: ["'self'"], added: [], description: "Specifies valid sources for loading media using &lt;audio&gt; and &lt;video&gt;." },
			"object-src": { enabled: true, defaults: ["'none'"], added: [], description: "Specifies valid sources for the &lt;object&gt; and &lt;embed&gt; elements." },
			"report-to": { enabled: false, defaults: [], added: [], description: "Provides a reporting endpoint for CSP violations." },
			"require-sri-for": { enabled: false, defaults: [], added: [], tokens: ["script", "style"], description: "Enforces Subresource Integrity on scripts and/or stylesheets." },
			"require-trusted-types-for": { enabled: false, defaults: [], added: [], tokens: ["'script'"], description: "Enforces Trusted Types for scripts that create HTML from strings." },
			"sandbox": { enabled: false, defaults: [], added: [], tokens: ["allow-downloads", "allow-forms", "allow-modals", "allow-orientation-lock", "allow-pointer-lock", "allow-popups", "allow-popups-to-escape-sandbox", "allow-presentation", "allow-same-origin", "allow-scripts", "allow-top-navigation", "allow-top-navigation-by-user-activation", "allow-top-navigation-to-custom-protocols"], description: "Enables a sandbox for the requested resource, similar to the &lt;iframe&gt; sandbox attribute." },
			"script-src": { enabled: true, defaults: ["'self'"], added: [], description: "Specifies valid sources for JavaScript." },
			"script-src-elem": { enabled: false, defaults: [], added: [], description: "Specifies valid sources for JavaScript &lt;script&gt; elements." },
			"script-src-attr": { enabled: false, defaults: [], added: [], description: "Specifies valid sources for JavaScript inline event handlers." },
			"style-src": { enabled: true, defaults: ["'self'"], added: [], description: "Specifies valid sources for stylesheets." },
			"style-src-elem": { enabled: false, defaults: [], added: [], description: "Specifies valid sources for stylesheets &lt;style&gt; elements and &lt;link&gt; elements with rel=\"stylesheet\"." },
			"style-src-attr": { enabled: false, defaults: [], added: [], description: "Specifies valid sources for inline styles applied to individual DOM elements." },
			"trusted-types": { enabled: false, defaults: ["'none'"], added: [], description: "Specifies an allowlist of Trusted Types policies." },
			"upgrade-insecure-requests": { enabled: false, defaults: [], added: [], boolean: true, description: "Instructs user agents to treat all of a site's insecure URLs (HTTP) as though they have been replaced with secure URLs (HTTPS)." },
			"worker-src": { enabled: false, defaults: [], added: [], description: "Specifies valid sources for Worker, SharedWorker, or ServiceWorker scripts." }
		};
	}

	get policy() {
		return this.state;
	}

	set policy(newState) {
		if (typeof newState !== 'object' || newState === null) {
			return;
		}

		Object.keys(newState).forEach(key => {
			if (this.state[key] && newState[key] && Array.isArray(newState[key].added)) {
				this.state[key].added = [...newState[key].added];
			}
		});

		this.render();
	}

	get cspString() {
		return this.generateCspString();
	}

	updateCspString() {
		const cspString = this.generateCspString();
		this.shadowRoot.querySelector('pre code').innerHTML = cspString;
	}

	addValue(directive, value) {
		if (this.state[directive] && value) {
			this.state[directive].added.push(value);
			const ul = this.shadowRoot.querySelector(`[data-ul-for="${directive}"]`);
			if (ul) {
				const li = document.createElement('li');
				li.textContent = value;
				const button = document.createElement('button');
				button.dataset.remove = '';
				button.dataset.directive = directive;
				button.dataset.index = this.state[directive].added.length - 1;
				button.textContent = '×';
				li.append(button);
				ul.append(li);
			}
			this.updateCspString();
		}
	}

	removeValue(directive, index) {
		if (this.state[directive] && this.state[directive].added[index] !== undefined) {
			this.state[directive].added.splice(index, 1);
			this.updateCspString();
		}
	}

	generateCspString() {
		const policy = Object.entries(this.state)
			.filter(([, valueObj]) => valueObj.enabled)
			.map(([key, valueObj]) => {
				const allValues = [...valueObj.defaults, ...valueObj.added];
				if (allValues.length === 0) return `\t\t${key}`;
				return `\t\t${key} ${allValues.join(' ')}`;
			})
			.filter(part => part.trim() !== '')
			.join('; \n');

		return `&lt;meta http-equiv="Content-Security-Policy" content="\n${policy}\n\t"&gt;`;
	}

	connectedCallback() {
		document.documentElement.style.setProperty('interpolate-size', 'allow-keywords');
		const initialPolicy = this.getAttribute('initial-policy');

		if (initialPolicy) {
			try {
				this.policy = JSON.parse(initialPolicy);
			} catch (e) {
				console.error('Failed to parse initial-policy attribute:', e);
				this.render();
			}
		} else {
			this.render();
		}

		this.shadowRoot.addEventListener('click', (e) => {
			const target = e.target;
			if (target.tagName !== 'BUTTON') return;

			const directive = target.dataset.directive;

			if (target.dataset.add !== undefined) {
				const input = this.shadowRoot.querySelector(`input[type="text"][data-directive="${directive}"]`);
				if (input && input.value) {
					this.addValue(directive, input.value);
					input.value = '';
				}
			} else if (target.dataset.remove !== undefined) {
				const index = parseInt(target.dataset.index, 10);
				this.removeValue(directive, index);
				target.closest('li').remove();
			}
		});

		this.shadowRoot.addEventListener('change', (e) => {
			const target = e.target;
			if (target.type === 'checkbox' && target.dataset.directive) {
				const directive = target.dataset.directive;
				if (this.state[directive]) {
					this.state[directive].enabled = target.checked;
					this.updateCspString();
				}
			}
		});
	}

	render() {
		this.shadowRoot.innerHTML = `
			${Object.entries(this.state).map(([key, valueObj]) => {
				const hasTokens = valueObj.tokens && valueObj.tokens.length > 0;
				const inputListAttribute = hasTokens ? `list="${key}-tokens"` : '';
				const dataListElement = hasTokens
					? `<datalist id="${key}-tokens">
							${valueObj.tokens.map(token => `<option value="${token}"></option>`).join('')}
						</datalist>`
					: '';

				return `
					<details name="csp-directive">
						<summary>${key}</summary>
						<div>
							<small>${valueObj.description}</small>
							${valueObj.boolean
								? `<p>This is a boolean directive. It has no values.</p>`
								: `
									<ul data-ul-for="${key}">
										${valueObj.defaults.map(v => `<li>${v}</li>`).join(' ')}
										${valueObj.added.map((v, i) => `<li>${v}<button data-remove data-directive="${key}" data-index="${i}">×</button></li>`).join(' ')}
									</ul>
									<fieldset>
										<input type="text" data-directive="${key}" placeholder="Add new value" ${inputListAttribute}>
										<button data-add data-directive="${key}">Add</button>
									</fieldset>
									${dataListElement}
								`
							}
							<label>
								<input type="checkbox" data-directive="${key}" ${valueObj.enabled ? 'checked' : ''}> Enable ${key}
							</label>
						</div>
					</details>
				`;
			}).join('')}
			<pre><code>${this.generateCspString()}</code></pre>`;
	}
}

customElements.define('csp-manager', CspManager);
