import { toCssValue } from '../design-token-utils/index.js';

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
	#registry = null;

	static get observedAttributes() {
		return ['src'];
	}

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
	}

	async connectedCallback() {
		if (!sharedSheet) {
			const cssUrl = new URL('../design-token-styles/index.css', import.meta.url).href;
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

	set registry(val) {
		this.#registry = val;
		// Only render if we already have a token
		if (this.#token && this.#token.$value !== undefined) {
			this.render();
		}
	}

	get registry() {
		return this.#registry;
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

		// Dispatch event to notify parent that token changed
		this.dispatchEvent(new CustomEvent('token-changed', {
			bubbles: true,
			composed: true,
			detail: { token, cssVar }
		}));

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

		// Use the CSS variable if available, otherwise compute the value
		if (cssVar) {
			this.style.setProperty('--_v', `var(${cssVar})`);
		} else {
			this.style.setProperty('--_v', toCssValue(token, this.#registry));
		}

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
				await import('../design-token-editors/color/index.js');
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
