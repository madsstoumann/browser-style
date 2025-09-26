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
`);

class CspManager extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.adoptedStyleSheets = [styles];

		this.state = {
			// Fetch directives
			"child-src": { enabled: true, defaults: [], added: [] },
			"connect-src": { enabled: true, defaults: ["'self'"], added: [] },
			"default-src": { enabled: true, defaults: ["'self'"], added: [] },
			"font-src": { enabled: true, defaults: ["'self'", "data:"], added: [] },
			"frame-src": { enabled: true, defaults: [], added: [] },
			"img-src": { enabled: true, defaults: ["'self'", "data:"], added: [] },
			"manifest-src": { enabled: true, defaults: ["'self'"], added: [] },
			"media-src": { enabled: true, defaults: ["'self'"], added: [] },
			"object-src": { enabled: true, defaults: ["'none'"], added: [] },
			"script-src": { enabled: true, defaults: ["'self'"], added: [] },
			"script-src-elem": { enabled: false, defaults: [], added: [] },
			"script-src-attr": { enabled: false, defaults: [], added: [] },
			"style-src": { enabled: true, defaults: ["'self'"], added: [] },
			"style-src-elem": { enabled: false, defaults: [], added: [] },
			"style-src-attr": { enabled: false, defaults: [], added: [] },
			"worker-src": { enabled: false, defaults: [], added: [] },

			// Document directives
			"base-uri": { enabled: true, defaults: ["'self'"], added: [] },
			"plugin-types": { enabled: false, defaults: [], added: [] }, // Deprecated
			"sandbox": { enabled: false, defaults: [], added: [] },

			// Navigation directives
			"form-action": { enabled: true, defaults: ["'self'"], added: [] },
			"frame-ancestors": { enabled: true, defaults: ["'none'"], added: [] },

			// Reporting directives
			"report-to": { enabled: false, defaults: [], added: [] },
			"report-uri": { enabled: false, defaults: [], added: [] }, // Deprecated

			// Other directives
			"block-all-mixed-content": { enabled: false, defaults: [], added: [] },
			"require-sri-for": { enabled: false, defaults: [], added: [] },
			"trusted-types": { enabled: false, defaults: [], added: [] },
			"upgrade-insecure-requests": { enabled: true, defaults: [], added: [] },
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
			.filter(([, valueObj]) => valueObj.enabled) // Only include enabled directives
			.map(([key, valueObj]) => {
				const allValues = [...valueObj.defaults, ...valueObj.added];
				// Handle boolean directives that are enabled but have no values
				if (allValues.length === 0) return `\t\t${key}`;
				return `\t\t${key} ${allValues.join(' ')}`;
			})
			.filter(part => part.trim() !== '')
			.join('; \n');

		return `&lt;meta http-equiv="Content-Security-Policy" content="\n${policy}\n\t"&gt;`;
	}

	connectedCallback() {
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
			${Object.entries(this.state).map(([key, valueObj]) => `
			<details>
				<summary>${key}</summary>
				<div>
					<ul data-ul-for="${key}">
						${valueObj.defaults.map(v => `<li>${v}</li>`).join(' ')}
						${valueObj.added.map((v, i) => `<li>${v}<button data-remove data-directive="${key}" data-index="${i}">×</button></li>`).join(' ')}
					</ul>
					<label>
						<input type="checkbox" data-directive="${key}" ${valueObj.enabled ? 'checked' : ''}> Enable ${key}
					</label>
					<fieldset>
						<input type="text" data-directive="${key}" placeholder="Add new value">
						<button data-add data-directive="${key}">Add</button>
					</fieldset>
				</div>
			</details>`).join('')}
			<pre><code>${this.generateCspString()}</code></pre>`;
	}
}

customElements.define('csp-manager', CspManager);
