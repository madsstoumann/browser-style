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

let sharedSheet;

export default class DesignToken extends HTMLElement {
	#token = {
		name: 'New Token',
		$type: 'color',
		$value: '#000000',
		$description: ''
	};
	#elements = {};
	#renderId = 0;
	#pendingValue = null;

	static get observedAttributes() {
		return ['src'];
	}

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
	}

	async connectedCallback() {
		if (!sharedSheet) {
			const cssUrl = new URL('./index.css', import.meta.url).href;
			const response = await fetch(cssUrl);
			const text = await response.text();
			sharedSheet = new CSSStyleSheet();
			sharedSheet.replaceSync(text);
		}
		
		this.shadowRoot.adoptedStyleSheets = [sharedSheet];
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

	ensureStructure() {
		if (this.#elements.dialog) return;

		this.shadowRoot.innerHTML = `
			<button type="button" command="show-modal" commandfor="dialog" part="design-token-button">
				<span id="token-name-display"></span>
			</button>

			<dialog id="dialog" closedby="any" part="design-token-dialog">
				<form method="dialog">
				<h2 id="dialog-title"></h2>
					<cq-box>
					
					<details name="token" open>
						<summary>Basic Info</summary>
						<fieldset>
							<label>
								Name
								<input name="name">
							</label>
							<label>
								Description
								<textarea name="description"></textarea>
							</label>
							<label>
								CSS Variable
								<input name="property">
							</label>
							<label>
								Value
								<input name="value">
							</label>
						<fieldset>
					</details>

					<details name="token">
						<summary>Advanced Editor</summary>
						<fieldset name="advanced" id="advanced-editor"></fieldset>
					</details>

					<details name="token">
						<summary>JSON Source</summary>
						<pre id="json-source"></pre>
					</details>
				</cq-box>
				<button value="save">Save</button>	
				</form>
				
			</dialog>
		`;

		this.#elements = {
			dialog: this.shadowRoot.getElementById('dialog'),
			tokenNameDisplay: this.shadowRoot.getElementById('token-name-display'),
			dialogTitle: this.shadowRoot.getElementById('dialog-title'),
			jsonSource: this.shadowRoot.getElementById('json-source'),
			form: this.shadowRoot.querySelector('form'),
			advancedEditor: this.shadowRoot.getElementById('advanced-editor'),
			nameInput: this.shadowRoot.querySelector('input[name="name"]'),
			descriptionInput: this.shadowRoot.querySelector('textarea[name="description"]'),
			propertyInput: this.shadowRoot.querySelector('input[name="property"]'),
			valueInput: this.shadowRoot.querySelector('input[name="value"]')
		};

		this.#elements.dialog.addEventListener('close', () => this.handleDialogClose());

		this.#elements.nameInput.addEventListener('input', () => {
			this.#elements.dialogTitle.textContent = this.#elements.nameInput.value;
		});
	}

	handleDialogClose() {
		const dialog = this.#elements.dialog;
		if (dialog.returnValue !== 'save') {
			this.render(); // Re-render to reset form if cancelled
			return;
		}

		const token = this.#token;
		const name = this.getAttribute('name') || token.name || 'Token';
		const $description = token.$description;
		const cssVar = token.$extensions?.css?.var || '';

		const newName = this.#elements.nameInput.value;
		const newDesc = this.#elements.descriptionInput.value;
		const newCssVar = this.#elements.propertyInput.value;
		const newValueStr = this.#elements.valueInput.value;

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
		if (token.$type === 'color' && this.#pendingValue?.components) {
			token.$value = {
				colorSpace: this.#pendingValue.space === 'hex' ? 'srgb' : this.#pendingValue.space,
				components: this.#pendingValue.components,
				alpha: this.#pendingValue.alpha
			};
		} else {
			let finalValue = newValueStr;
			
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
		
		this.render();
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

		this.ensureStructure();

		// Update static content
		this.#elements.tokenNameDisplay.textContent = token.name;
		this.#elements.dialogTitle.textContent = token.name;
		this.#elements.jsonSource.textContent = JSON.stringify(token, null, 2);

		this.#elements.nameInput.value = token.name;
		this.#elements.descriptionInput.value = $description || '';
		this.#elements.propertyInput.value = cssVar;

		let displayValue = $value;

		if (typeof $value === 'object') {
			displayValue = JSON.stringify($value);
		}
		this.#elements.valueInput.value = displayValue;

		let editorContent = null;
		this.#pendingValue = null;
		
		const isAlias = typeof $value === 'string' && $value.startsWith('{') && $value.endsWith('}');

		if ($type === 'color' && !isAlias) {
			try {
				await import('../edit-color/index.js');
				const editor = document.createElement('edit-color');
				editor.value = $value;
				editorContent = editor;
			} catch (e) {
				console.debug('Failed to load color editor:', e);
			}
		}

		if (this.#renderId !== renderId) return;

		if (editorContent) {
			const container = this.#elements.advancedEditor;
			container.replaceChildren(editorContent);

			editorContent.addEventListener('change', (e) => {
				this.#pendingValue = e.detail;
				const { css } = e.detail;
				const valueInput = this.#elements.valueInput;
				if (valueInput) {
					valueInput.value = css;
					this.style.setProperty('--_v', css);
				}
			});
		} else {
			this.#elements.advancedEditor.replaceChildren();
		}
	}
}

customElements.define('design-token', DesignToken);
