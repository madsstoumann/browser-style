const styles = `
	:host {
		display: inline-block;
		vertical-align: middle;
	}
	button {
		appearance: none;
		background: transparent;
		border: 1px solid color-mix(in srgb, currentColor, transparent 80%);
		border-radius: 0.25rem;
		cursor: pointer;
		padding: 0.25rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-family: inherit;
		font-size: 0.875rem;
		color: inherit;
		min-width: 0;
		max-width: 100%;
	}
	button:hover {
		background: color-mix(in srgb, currentColor, transparent 95%);
		border-color: color-mix(in srgb, currentColor, transparent 60%);
	}
	.preview {
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 0.125rem;
		background-color: #eee;
		background-image:
			linear-gradient(45deg, #ccc 25%, transparent 25%),
			linear-gradient(-45deg, #ccc 25%, transparent 25%),
			linear-gradient(45deg, transparent 75%, #ccc 75%),
			linear-gradient(-45deg, transparent 75%, #ccc 75%);
		background-size: 8px 8px;
		background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
		overflow: hidden;
		position: relative;
		flex-shrink: 0;
	}
	.preview-content {
		width: 100%;
		height: 100%;
	}
	.label {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	[popover] {
		padding: 1rem;
		border: 1px solid #ccc;
		border-radius: 0.5rem;
		box-shadow: 0 4px 12px rgba(0,0,0,0.1);
		min-width: 200px;
	}
	h3 { margin: 0 0 1rem 0; font-size: 1rem; }
	pre { background: #f5f5f5; padding: 0.5rem; border-radius: 4px; overflow: auto; max-width: 400px; }
`;

export default class DesignToken extends HTMLElement {
	#token = {
		name: 'New Token',
		$type: 'color',
		$value: '#000000',
		$description: ''
	};

	static get observedAttributes() {
		return ['name', 'type', 'value', 'description', 'render', 'property', 'src'];
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
		if (oldValue === newValue) return;
		if (name === 'src') {
			try {
				this.src = JSON.parse(newValue);
			} catch (e) {
				console.warn('Invalid JSON in src attribute', e);
			}
			return;
		}
		this.#updateStateFromAttribute(name, newValue);
		this.render();
	}

	set src(data) {
		if (!data) return;
		// If data is a full token object (has $value), use it directly
		if (data.$value) {
			this.#token = { ...data };
		} else {
			// Heuristic: if it's a wrapper { "token-name": { $value: ... } }
			const keys = Object.keys(data);
			if (keys.length === 1 && data[keys[0]]?.$value) {
				this.#token = { ...data[keys[0]], name: keys[0] };
			} else {
				this.#token = { ...data };
			}
		}
		this.render();
	}

	get src() {
		return this.#token;
	}

	#updateStateFromAttribute(name, value) {
		switch (name) {
			case 'name':
				this.#token.name = value;
				break;
			case 'type':
				this.#token.$type = value;
				break;
			case 'value':
				try {
					this.#token.$value = JSON.parse(value);
				} catch {
					this.#token.$value = value;
				}
				break;
			case 'description':
				this.#token.$description = value;
				break;
			case 'render':
				this.#token.render = value;
				break;
			case 'property':
				if (!this.#token.$extensions) this.#token.$extensions = {};
				this.#token.$extensions.cssProp = value;
				break;
		}
	}

	render() {
		const { name, $value, $type, $description, render } = this.#token;
		const displayType = render || $type || 'unknown';
		const displayName = name || 'Token';
		
		// Basic preview logic
		let previewStyle = '';
		if (displayType === 'color' && typeof $value === 'string') {
			previewStyle = `background-color: ${$value}`;
		}

		this.shadowRoot.innerHTML = `
			<button type="button" popovertarget="editor" title="${$description || ''}">
				<div class="preview">
					<div class="preview-content" style="${previewStyle}"></div>
				</div>
				<span class="label">${displayName}</span>
			</button>
			<div id="editor" popover>
				<h3>Edit ${displayName}</h3>
				<pre>${JSON.stringify(this.#token, null, 2)}</pre>
			</div>
		`;
	}
}

customElements.define('design-token', DesignToken);
