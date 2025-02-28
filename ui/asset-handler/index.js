export default class AssetHandler extends HTMLElement {
	static observedAttributes = ['asset-id'];
	#api; #assetId; #elements; #url;

	constructor() {
		super();
		this.config = null;
		this.shadow = this.attachShadow({ mode: 'open' });

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
			if (!this.config || Object.keys(this.config).length === 0) {
				console.warn('AssetHandler: Invalid or empty configuration');
				return;
			}

			this.initialize();
		} catch (error) {
			console.error('Error initializing AssetHandler:', error);
		}
	}

	async fetch(url, options = {}) {
		try {
			const response = await fetch(url, options);
			if (!response.ok) {
				throw new Error(`Failed to fetch from ${url}: ${response.status}`);
			}
			return await response.json();
		} catch (error) {
			console.error(`Error fetching from ${url}:`, error);
			return null;
		}
	}

	async initialize() {
		this.shadow.innerHTML = `
			<form part="form">
				<label part="label">
					<input type="file" accept="${this.config.accept}" part="input" multiple>
				</label>
				<ul part="list">${await this.renderAssets()}</ul>
			</form>`

		this.#elements = {
			form: this.shadow.querySelector('[part="form"]'),
			input: this.shadow.querySelector('[part="input"]'),
			list: this.shadow.querySelector('[part="list"]')
		};

		this.#elements.form.addEventListener('click', this.handleFile.bind(this));
		this.#elements.input.addEventListener('change', this.uploadFile.bind(this));
	}

	async renderAssets(node) {
		const list = await this.fetch(`${this.#url.list}`);
		if (!list || !list.assets) return '';
		const html = list.assets.map(asset => `
			<li>
				<img src="${this.#api}/${asset.path}?w=75" alt="${asset.name}" />
				<span>${asset.name}</span>
				<fieldset part="tag-list" data-name="${asset.name}">
					${this.renderTags(asset.tags)}
					<button type="button" part="button" data-action="save">SAVE</button>
					<button type="button" part="button" data-action="delete">DEL</button>
				</fieldset>
			</li>`).join('');

		return node ? node.innerHTML = html : html;
	}

	renderTags(tags) {
		return `
			${this.config.tags.map(tag => {
				const checked = tags.includes(tag) ? 'checked' : '';
				return `
					<label part="tag-label">
						<input type="checkbox" name="tags" value="${tag}" ${checked}>
						<span>${tag}</span>
					</label>
				`;
			}
		).join('')}`
	}

	async handleFile(event) {
		const node = event.target;
		if (node.tagName !== 'BUTTON' || !node.dataset.action) return;

		const fieldset = node.closest('fieldset');
		const filename = fieldset.dataset.name;

		switch(node.dataset.action) {
			case 'delete': {
				try {
					await this.fetch(`${this.#url.upload}?filename=${filename}`, { method: 'DELETE' });
					await this.renderAssets(this.#elements.list);
				} catch (error) {
					console.error('Error deleting file:', error);
				}
				break;
			}
			case 'save': {
				const tags = Array.from(fieldset.elements)
				.filter(element => element.type === 'checkbox' && element.checked)
				.map(element => element.value);
				try {
					const result = await this.fetch(this.#url.tags, {
						method: 'PUT',
						headers: {'Content-Type': 'application/json'},
						body: JSON.stringify({ filename, tags })
					});
				} catch (error) {
					console.error('Error updating tags:', error);
				}
				break;
			}
		}
	}

	async uploadFile(event) {
		const files = event.target.files;
		if (!files) return;
		const formData = new FormData();
		const maxSizeBytes = this.config.maxFileSize * 1024 * 1024 || 0;

		Array.from(files).forEach(file => { 
			if (file.size > maxSizeBytes) {
				console.error(`File too large. Maximum size is ${this.config.maxFileSize} MB.`);
				return;
			}
			formData.append('assets', file);
		});

		try {
			await this.fetch(this.#url.upload, { method: 'POST', body: formData });
			await this.renderAssets(this.#elements.list);
			event.target.value = '';
		} catch (error) {
			console.error('Error uploading files:', error);
		}
	}
}

customElements.define('asset-handler', AssetHandler);
