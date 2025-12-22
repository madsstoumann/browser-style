const styles = `
	:host {
		display: inline-block;
		--_v: initial;
	}
	button {
		appearance: none;
		border: 1px solid #ccc;
		background: #fff;
		padding: 0.5rem;
		border-radius: 4px;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		text-align: left;
		font-family: inherit;
	}
	/* Preview Box */
	button::before {
		content: '';
		display: block;
		width: 1.5rem;
		height: 1.5rem;
		border: 1px solid #eee;
		border-radius: 4px;
		background: #eee; /* Fallback */
		flex-shrink: 0;
	}
	
	/* Type-specific previews */
	:host([type="color"]) button::before {
		background: var(--_v);
	}
	:host([type="border"]) button::before {
		background: transparent;
		border: var(--_v);
	}
	:host([type="shadow"]) button::before {
		background: #fff;
		box-shadow: var(--_v);
	}
	:host([type="gradient"]) button::before {
		background: var(--_v);
	}
	:host([type="aspectRatio"]) button::before {
		width: 2rem;
		height: auto;
		aspect-ratio: var(--_v);
		background: #ccc;
	}

	dialog {
		border: none;
		border-radius: 1rem;

		form {
			display: grid;
			gap: .75rem;
		}

		h2 {
			font-weight: 500;
			margin: 0;
			text-box: cap alphabetic;
		}

		input, select, textarea {
			border: 1px solid #EEE;
			border-radius: .25rem;
			font-family: inherit;
			font-size: .75rem;
			padding: .25rem .5rem;
		}

		label {
			display: inline-grid;
			font-size: 12px;
			gap: .125rem;
		}

		textarea {
			field-sizing: content;
			resize: vertical;
		}
	}
`;

function toCssValue(token) {
	const { $type, $value } = token;
	if (typeof $value === 'string') return $value;
	
	if ($type === 'color' && typeof $value === 'object') {
		const { colorSpace, components, alpha } = $value;
		const a = alpha ?? 1;
		// Map common spaces to CSS color functions
		if (colorSpace === 'oklab') return `oklab(${components[0]} ${components[1]} ${components[2]} / ${a})`;
		if (colorSpace === 'oklch') return `oklch(${components[0]} ${components[1]} ${components[2]} / ${a})`;
		if (colorSpace === 'srgb' || colorSpace === 'rgb') return `color(srgb ${components[0]} ${components[1]} ${components[2]} / ${a})`;
		if (colorSpace === 'display-p3' || colorSpace === 'p3') return `color(display-p3 ${components[0]} ${components[1]} ${components[2]} / ${a})`;
		return 'transparent';
	}
	
	if ($type === 'shadow' && typeof $value === 'object') {
		const shadows = Array.isArray($value) ? $value : [$value];
		return shadows.map(s => `${s.offsetX} ${s.offsetY} ${s.blur} ${s.spread} ${s.color}`).join(', ');
	}
	
	if ($type === 'border' && typeof $value === 'object') {
		return `${$value.width} ${$value.style} ${$value.color}`;
	}
	
	if ($type === 'gradient') {
		const stops = Array.isArray($value) ? $value : [];
		if (!stops.length) return '';

		const stopList = stops.map(s => `${s.color} ${s.position * 100}%`).join(', ');
		const ext = token.$extensions?.css || {};
		const type = ext.gradientType || 'linear';
		const angle = ext.angle || 'to bottom';
		const shape = ext.shape || 'circle';
		const position = ext.position || 'center';

		if (type === 'linear') return `linear-gradient(${angle}, ${stopList})`;
		if (type === 'radial') return `radial-gradient(${shape} at ${position}, ${stopList})`;
		if (type === 'conic') return `conic-gradient(from ${angle} at ${position}, ${stopList})`;
		
		return `linear-gradient(${angle}, ${stopList})`;
	}

	return '';
}

export default class DesignToken extends HTMLElement {
	#token = {
		name: 'New Token',
		$type: 'color',
		$value: '#000000',
		$description: ''
	};
	#renderId = 0;

	static get observedAttributes() {
		return ['src'];
	}

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		const sheet = new CSSStyleSheet();
		sheet.replaceSync(styles);
		this.shadowRoot.adoptedStyleSheets = [sheet];
	}

	connectedCallback() {
		this.render();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (name === 'name' && oldValue !== newValue) {
			this.render();
		}
	}

	set src(val) {
		this.#token = val;
		this.render();
	}

	get src() {
		return this.#token;
	}

	async render() {
		const renderId = ++this.#renderId;
		const token = this.#token;
		const { $type, $value, $description, $extensions } = token;
		const name = this.getAttribute('name') || token.name || 'Token';
		token.name = name;
		
		const cssVar = $extensions?.css?.var || '';

		// Set host attributes for styling
		if ($type) {
			this.setAttribute('type', $type);
		}
		
		this.style.setProperty('--_v', toCssValue(token));

		let displayValue = $value;
		const supportedEditors = ['color'];

		if (typeof $value === 'object') {
			if (supportedEditors.includes($type)) {
				try {
					const module = await import(`./editors/${$type}.js`);
					if (this.#renderId !== renderId) return;
					if (module.formatValue) {
						displayValue = module.formatValue($value);
					} else {
						displayValue = JSON.stringify($value);
					}
				} catch (e) {
					displayValue = JSON.stringify($value);
				}
			} else {
				displayValue = JSON.stringify($value);
			}
		}

		let editorContent = null;
		let pendingValue = null;
		
		if ($type && supportedEditors.includes($type)) {
			try {
				const module = await import(`./editors/${$type}.js`);
				if (this.#renderId !== renderId) return;
				if (module.default) {
					editorContent = module.default(token);
				}
			} catch (e) {
				if (this.#renderId !== renderId) return;
				console.debug(`No editor for type: ${$type}`, e);
			}
		}

		if (this.#renderId !== renderId) return;

		this.shadowRoot.innerHTML = `
			<button type="button" command="show-modal" commandfor="dialog">
				${token.name}
			</button>
			<dialog id="dialog" closedby="any">
				<form method="dialog">
					<h2>${token.name}</h2>
					
					<label>
						Name
						<input name="name" value="${token.name}">
					</label>

					<label>
						Description
						<textarea name="description">${$description || ''}</textarea>
					</label>

					<label>
						CSS Variable
						<input name="property" value="${cssVar}">
					</label>

					<label>
						Value
						<input name="value" value="${displayValue}">
					</label>

					<details open ${!editorContent ? 'hidden' : ''}>
						<summary>Advanced Editor</summary>
						<fieldset name="advanced" id="advanced-editor"></fieldset>
					</details>

					<details>
						<summary>JSON Source</summary>
						<pre>${JSON.stringify(token, null, 2)}</pre>
					</details>

					<button value="save">Save</button>
				</form>
			</dialog>
		`;

		const dialog = this.shadowRoot.getElementById('dialog');
		const form = dialog.querySelector('form');
		const valueInput = form.querySelector('input[name="value"]');

		// Live preview and value tracking
		valueInput.addEventListener('input', (e) => {
			const val = e.target.value;
			this.style.setProperty('--_v', val);
			pendingValue = { css: val };
			
			// Notify advanced editor if it exists
			const editorContainer = this.shadowRoot.getElementById('advanced-editor');
			if (editorContainer && editorContent) {
				const editor = editorContainer.firstElementChild;
				if (editor) {
					editor.dispatchEvent(new CustomEvent('update-from-input', {
						detail: { value: val }
					}));
				}
			}
		});

		dialog.addEventListener('close', async () => {
			if (dialog.returnValue === 'save') {
				const newName = form.elements.name.value;
				const newDesc = form.elements.description.value;
				const newCssVar = form.elements.property.value;
				const newValueStr = form.elements.value.value;

				// Update Name
				if (newName && newName !== name) {
					if (!token.$extensions) token.$extensions = {};
					if (!token.$extensions.ui) token.$extensions.ui = {};
					token.$extensions.ui.name = newName;
					this.setAttribute('name', newName);
				}

				// Update Description
				if (newDesc !== $description) {
					token.$description = newDesc;
				}

				// Update CSS Variable
				if (newCssVar !== cssVar) {
					if (!token.$extensions) token.$extensions = {};
					if (!token.$extensions.css) token.$extensions.css = {};
					token.$extensions.css.var = newCssVar;
				}

				// Update Value
				if (token.$type === 'color' && pendingValue?.components) {
					token.$value = {
						colorSpace: pendingValue.space === 'hex' ? 'srgb' : pendingValue.space,
						components: pendingValue.components,
						alpha: pendingValue.alpha
					};
				} else {
					let finalValue = newValueStr;
					
					// Try to interpret color string via editor module
					if (supportedEditors.includes(token.$type)) {
						try {
							const module = await import(`./editors/${token.$type}.js`);
							if (module.parseValue) {
								const parsed = module.parseValue(finalValue);
								if (typeof parsed === 'object') {
									token.$value = parsed;
								} else {
									token.$value = finalValue;
								}
							} else {
								// Fallback for other types
								try {
									if (finalValue.trim().startsWith('[') || finalValue.trim().startsWith('{')) {
										token.$value = JSON.parse(finalValue);
									} else {
										token.$value = finalValue;
									}
								} catch {
									token.$value = finalValue;
								}
							}
						} catch (e) {
							token.$value = finalValue;
						}
					} else {
						// Try to parse JSON for other types
						try {
							if (finalValue.trim().startsWith('[') || finalValue.trim().startsWith('{')) {
								token.$value = JSON.parse(finalValue);
							} else {
								token.$value = finalValue;
							}
						} catch {
							token.$value = finalValue;
						}
					}
				}
				
				this.render();
			} else {
				this.render();
			}
		});

		if (editorContent) {
			const container = this.shadowRoot.getElementById('advanced-editor');
			if (typeof editorContent === 'string') {
				container.innerHTML = editorContent;
			} else {
				container.replaceChildren(editorContent);
			}

			container.addEventListener('editor-change', (e) => {
				pendingValue = e.detail;
				const { css } = e.detail;
				if (valueInput) {
					valueInput.value = css;
					this.style.setProperty('--_v', css);
				}
			});
		}
	}
}

customElements.define('design-token', DesignToken);
