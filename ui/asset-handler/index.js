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
				<label>
					<input type="file" accept="${this.config.accept}" multiple>
				</label>
				<ul>${await this.renderAssets()}</ul>
			</form>`;

		this.#elements = {
			form: this.shadow.querySelector('form'),
			input: this.shadow.querySelector('[type="file"]'),
			list: this.shadow.querySelector('ul')
		};

		this.#elements.form.addEventListener('click', this.handleFile.bind(this));
		this.#elements.input.addEventListener('change', this.uploadFile.bind(this));
	}

	async renderAssets(node) {
		const list = await this.fetch(this.#url.list);
		if (!list || !list.assets) return '';
		const html = list.assets.map(asset => `
			<li>
				<img src="${this.#api}/${asset.path}?w=75" alt="${asset.name}" />
				<span>${asset.name}</span>
				<fieldset data-name="${asset.name}">
					${this.renderTags(asset.tags)}
					<button type="button" data-action="save">SAVE</button>
					<button type="button" data-action="delete">DEL</button>
				</fieldset>
			</li>`).join('');
		return node ? node.innerHTML = html : html;
	}

	renderTags(tags) {
		return this.config.tags.map(tag => `
			<label>
				<input type="checkbox" value="${tag}" ${tags.includes(tag) ? 'checked' : ''}>
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
		const files = event.target.files;
		if (!files) return;
		const formData = new FormData();
		const maxSizeBytes = this.config.maxFileSize * 1024 * 1024 || 0;

		Array.from(files).forEach(file => {
			if (file.size <= maxSizeBytes) formData.append('assets', file);
		});

		await this.fetch(this.#url.upload, { method: 'POST', body: formData });
		await this.renderAssets(this.#elements.list);
		event.target.value = '';
	}
}

customElements.define('asset-handler', AssetHandler);
