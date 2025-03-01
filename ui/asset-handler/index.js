const styles = `
	:host *, :host *::after, :host *::before { box-sizing: border-box; }
	:host {
		--accent: light-dark(hsl(211, 100%, 50%), hsl(211, 60%, 50%));
		--accent-text: hsl(211, 100%, 95%);
		--error: light-dark(hsl(360, 60%, 46%), hsl(360, 40%, 56%));
		--success: light-dark(hsl(136, 41%, 41%), hsl(136, 21%, 51%));
		--asset-handler-cg: .5ch;
		--asset-handler-rg: 1em;
		font-family: ui-sans-serif, system-ui;
	}
	button {
		border: 0;
		color: #EEE;
		font-family: inherit;
		&[data-action=save] { background: var(--success); }
		&[data-action=delete] { background: var(--error); }
	}
	div {
		display: grid;
		margin-block-start: var(--asset-handler-rg);
		row-gap: var(--asset-handler-rg);
	}
	fieldset {
		all: unset;
		align-items: center;
		border-block-end: 1px dotted #CCC;
		display: flex;
		gap: var(--asset-handler-cg);
		padding-block-end: var(--asset-handler-rg);
	}
	button, label:has([type="checkbox"]) {
		background: light-dark(#EEE, #333);
		border-radius: 2.5ch;
		font-size: 12px;
		padding: .5ch 1.5ch;
		&:has(:checked) {
			background: var(--accent);
			color: var(--accent-text);
		}
	}
	label:has([type="file"]) {
		border: 2px dashed #CCC;
		display: grid;
		padding: 3ch;
		place-content: center;
		transition: border-color 0.3s ease;
		&::after {
			background: var(--accent);
			border-radius: 2.5ch;
			color: var(--accent-text);
			content: attr(title);
			padding: .5ch 1.5ch;
		}
		&.dragover {
			background-color: #CCC4;
		}
	}
	nav {
		margin-inline-start: auto;
	}
	[data-sr] {
		border: 0;
		clip: rect(0 0 0 0); 
		clip-path: inset(50%);
		height: 1px;
		overflow: hidden;
		position: absolute;
		white-space: nowrap; 
		width: 1px;
	}
}`;

export default class AssetHandler extends HTMLElement {
	static observedAttributes = ['asset-id'];
	#api; #assetId; #elements; #url;

	constructor() {
		super();
		this.config = null;
		this.shadow = this.attachShadow({ mode: 'open' });
		const sheet = new CSSStyleSheet();
		sheet.replaceSync(styles);
		this.shadow.adoptedStyleSheets = [sheet];

		this.#api = this.getAttribute('api');
		this.#assetId = this.getAttribute('asset-id');
		this.#url = {
			config: `${this.#api}/api/config/client`,
			list: `${this.#api}/api/asset-list/${this.#assetId}`,
			tags: `${this.#api}/api/asset/${this.#assetId}/tags`,
			upload: `${this.#api}/api/asset/${this.#assetId}`,
		}
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (name === 'asset-id' && oldValue !== newValue && this.config) {
			this.initialize(); 
		}
	}

	async connectedCallback() {
		if (!this.#api || !this.#assetId) return;
		try {
			this.config = await this.fetch(this.#url.config);
			if (this.config && Object.keys(this.config).length) {
				this.initialize();
			}
		} catch (error) {}
	}

	async fetch(url, options = {}) {
		try {
			const response = await fetch(url, options);
			if (!response.ok) throw new Error(`Failed to fetch from ${url}: ${response.status}`);
			return await response.json();
		} catch (error) {
			return null;
		}
	}

	async initialize() {
		this.shadow.innerHTML = `
			<form>
				<label title="${this.getAttribute('label') || 'Upload'}" part="dropzone">
					<input type="file" accept="${this.config.accept}" multiple data-sr>
				</label>
				<div>${await this.renderAssets()}</div>
			</form>`;

		this.#elements = {
			dropzone: this.shadow.querySelector('[part="dropzone"]'),
			form: this.shadow.querySelector('form'),
			input: this.shadow.querySelector('[type="file"]'),
			list: this.shadow.querySelector('div')
		};

		this.#elements.dropzone.addEventListener('dragover', e => {
			e.preventDefault();
			e.stopPropagation();
		});
		this.#elements.dropzone.addEventListener('dragenter', e => {
			e.preventDefault();
			e.stopPropagation();
			this.#elements.dropzone.classList.add('dragover');
		});
		this.#elements.dropzone.addEventListener('dragleave', e => {
			e.preventDefault();
			e.stopPropagation();
			this.#elements.dropzone.classList.remove('dragover');
		});
		this.#elements.dropzone.addEventListener('drop', e => {
			e.preventDefault();
			e.stopPropagation();
			this.#elements.dropzone.classList.remove('dragover');
			if (e.dataTransfer.files.length > 0) {
				this.uploadFile(e);
			}
		});

		this.#elements.form.addEventListener('click', this.handleFile.bind(this));
		this.#elements.input.addEventListener('change', this.uploadFile.bind(this));
	}

	async renderAssets(node) {
		const list = await this.fetch(this.#url.list);
		if (!list || !list.assets) return '';
		const html = list.assets.map(asset => `
		<fieldset data-name="${asset.name}">
		<img src="${this.#api}/${asset.path}?w=75" alt="${asset.name}">
			${this.renderTags(asset.tags)}
			<nav>
				<button type="button" data-action="save">${this.getAttribute('save')||'Save'}</button>
				<button type="button" data-action="delete">${this.getAttribute('delete')||'Delete'}</button>
			</nav>
		</fieldset>`).join('');
		return node ? node.innerHTML = html : html;
	}

	renderTags(tags) {
		return this.config.tags.map(tag => `
			<label>
				<input type="checkbox" value="${tag}" data-sr ${tags.includes(tag) ? 'checked' : ''}>
				${tag}
			</label>`).join('');
	}

	async handleFile(event) {
		const node = event.target;
		if (node.tagName !== 'BUTTON' || !node.dataset.action) return;

		const fieldset = node.closest('fieldset');
		const filename = fieldset.dataset.name;

		if (node.dataset.action === 'delete') {
			await this.fetch(`${this.#url.upload}?filename=${filename}`, { method: 'DELETE' });
			await this.renderAssets(this.#elements.list);
		} else if (node.dataset.action === 'save') {
			const tags = Array.from(fieldset.elements)
				.filter(el => el.type === 'checkbox' && el.checked)
				.map(el => el.value);
			await this.fetch(this.#url.tags, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ filename, tags })
			});
		}
	}

	async uploadFile(event) {
		let files;
		if (event.dataTransfer && event.dataTransfer.files) {
			files = event.dataTransfer.files;
		} else if (event.target && event.target.files) {
			files = event.target.files;
		}

		if (!files || files.length === 0) return;

		const formData = new FormData();
		const maxSizeBytes = this.config.maxFileSize * 1024 * 1024 || 0;

		Array.from(files).forEach(file => {
			if (file.size <= maxSizeBytes) formData.append('assets', file);
		});

		await this.fetch(this.#url.upload, { method: 'POST', body: formData });
		await this.renderAssets(this.#elements.list);
		if (event.target && event.target.value !== undefined) event.target.value = '';
	}
}

customElements.define('asset-handler', AssetHandler);
