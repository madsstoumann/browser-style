import { FormElement } from '../common/form.element.js';
import { AutoSuggest } from '../auto-suggest/index.js';

/**
 * ProductTaxonomy
 * @description Web component that loads and searches product taxonomies, with built-in Schema.org preview.
 * @author Mads Stoumann
 * @version 1.2.0
 * @summary 02-11-2025
 * @class ProductTaxonomy
 * @extends {FormElement}
 */
export class ProductTaxonomy extends FormElement {
	#autoSuggest;
	#parsedData = [];
	#config = {};
	#elements = {};

	get basePath() {
		return new URL('.', import.meta.url).href;
	}

	constructor() {
		super();
	}

	initializeComponent() {
		this.#config = {
			mode: this.getAttribute('mode') || this.getAttribute('type') || 'google',
			data: this.getAttribute('data'),
			schema: this.getAttribute('schema') || '',
			label: this.getAttribute('label') || 'Product Taxonomy',
			placeholder: this.getAttribute('placeholder') || 'Search for a product category...',
			minLength: parseInt(this.getAttribute('minlength')) || 2,
			maxResults: parseInt(this.getAttribute('max-results')) || 50,
			listMode: this.getAttribute('list-mode') || 'datalist',
			noshadow: this.hasAttribute('noshadow'),
			required: this.hasAttribute('required'),
		};

		this.render();

		if (!this.#config.data) {
			console.error('ProductTaxonomy: The "data" attribute is required to specify a taxonomy file.');
			return;
		}
		this.#loadTaxonomyData();
	}

	async #loadTaxonomyData() {
		this.dispatchEvent(new CustomEvent('taxonomyLoadStart', { bubbles: true }));
		try {
			const response = await fetch(new URL(this.#config.data, this.basePath));
			if (!response.ok) {
				throw new Error(`Failed to load taxonomy data from "${this.#config.data}"`);
			}
			const text = await response.text();
			const lines = text.split('\n').filter(line => line.trim() && !line.startsWith('#'));

			this.#parsedData = this.#config.mode === 'facebook' ?
				this.#parseFacebookFormat(lines) :
				this.#parseGoogleFormat(lines);

			this.dispatchEvent(new CustomEvent('taxonomyLoadEnd', {
				detail: { count: this.#parsedData.length },
				bubbles: true
			}));
		} catch (error) {
			console.error('Error loading taxonomy data:', error);
			this.dispatchEvent(new CustomEvent('taxonomyLoadError', {
				detail: error,
				bubbles: true
			}));
		}
	}

	#parseGoogleFormat(lines) {
		return lines.map(line => {
			const match = line.match(/^(\d+)\s*-\s*(.+)$/);
			if (!match) return null;
			const [, id, path] = match;
			const categories = path.split('>').map(c => c.trim());
			return {
				id,
				name: categories[categories.length - 1],
				path,
				categories,
				searchText: path.toLowerCase()
			};
		}).filter(Boolean);
	}

	#parseFacebookFormat(lines) {
		return lines.map(line => {
			const firstComma = line.indexOf(',');
			if (firstComma === -1) return null;
			const id = line.substring(0, firstComma).trim();
			const path = line.substring(firstComma + 1).trim();
			const categories = path.split('>').map(c => c.trim());
			return {
				id,
				name: categories[categories.length - 1],
				path,
				categories,
				searchText: path.toLowerCase()
			};
		}).filter(Boolean);
	}

	search(query) {
		if (!query || query.length < this.#config.minLength) {
			return [];
		}
		const searchTerm = query.toLowerCase();
		const results = this.#parsedData.filter(item =>
			item.searchText.includes(searchTerm)
		);
		return results.slice(0, this.#config.maxResults);
	}

	#formatResults(results) {
		return results.map(item => ({
			...item,
			display: item.path,
			value: item.id
		}));
	}

	#escapeHtml(str) {
		return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}

	#generateMicrodata(item) {
		const categories = item.categories;
		const boilerplate = `<span class="schema-boilerplate">${this.#escapeHtml('<div itemscope itemtype="https://schema.org/Product">')}\n  ${this.#escapeHtml('<meta itemprop="name" content="Example Product">')}</span>\n`;
		let taxonomyHtml = `  ${this.#escapeHtml('<div itemprop="category" itemscope itemtype="https://schema.org/DefinedTerm">')}\n`;
		taxonomyHtml += `    ${this.#escapeHtml(`<meta itemprop="termCode" content="${item.id}">`)}\n`;
		taxonomyHtml += `    ${this.#escapeHtml(`<meta itemprop="name" content="${item.name}">`)}\n`;
		if (categories.length > 1) {
			taxonomyHtml += `    ${this.#escapeHtml('<div itemprop="inDefinedTermSet" itemscope itemtype="https://schema.org/DefinedTermSet">')}\n`;
			taxonomyHtml += `      ${this.#escapeHtml(`<meta itemprop="name" content="${categories.slice(0, -1).join(' > ')}">`)}\n`;
			taxonomyHtml += `    ${this.#escapeHtml('</div>')}\n`;
		}
		taxonomyHtml += `  ${this.#escapeHtml('</div>')}\n`;
		taxonomyHtml += `<span class="schema-boilerplate">${this.#escapeHtml('</div>')}</span>`;
		return boilerplate + taxonomyHtml;
	}

	#generateJsonLd(item) {
		const jsonld = {
			"@context": "https://schema.org",
			"@type": "Product",
			"name": "Example Product",
			"category": {
				"@type": "DefinedTerm",
				"termCode": item.id,
				"name": item.name,
				"inDefinedTermSet": {
					"@type": "DefinedTermSet",
					"name": this.#config.mode === 'google' ? "Google Product Taxonomy" : "Facebook Product Taxonomy"
				},
				"additionalProperty": {
					"@type": "PropertyValue",
					"name": "categoryPath",
					"value": item.path
				}
			}
		};
		if (item.categories.length > 1) {
			jsonld.category.inDefinedTermSet.name = item.categories.slice(0, -1).join(' > ');
		}
		return JSON.stringify(jsonld, null, 2);
	}

	render() {
		const showMicrodata = this.#config.schema.includes('microdata');
		const showJson = this.#config.schema.includes('json');

		this.root.innerHTML = `
			<style>
				.schema-preview { margin-block-start: 1rem; }
				.schema-preview h4 { margin-block: 0.5rem 0.25rem; }
				.schema-preview pre { background: #f5f5f5; padding: 0.5rem; overflow-x: auto; font-size: 0.75rem; border-radius: 0.25rem; }
				.schema-boilerplate { color: #999; }
			</style>
			<auto-suggest
				api="#"
				api-value-path="id"
				api-display-path="display"
				api-text-path="path"
				label="${this.#config.label}"
				list-mode="${this.#config.listMode}"
				minlength="${this.#config.minLength}"
				${this.#config.noshadow ? 'noshadow' : ''}
				placeholder="${this.#config.placeholder}"
				${this.#config.required ? 'required="true"' : ''}
			></auto-suggest>
			${(showMicrodata || showJson) ? '<div class="schema-preview" hidden>' : ''}
				${showMicrodata ? '<h4>Schema.org Microdata</h4><pre class="schema-microdata"></pre>' : ''}
				${showJson ? '<h4>Schema.org JSON-LD</h4><pre class="schema-jsonld"></pre>' : ''}
			${(showMicrodata || showJson) ? '</div>' : ''}
		`;
		this.#autoSuggest = this.root.querySelector('auto-suggest');
		this.#elements = {
			previewContainer: this.root.querySelector('.schema-preview'),
			microdata: this.root.querySelector('.schema-microdata'),
			jsonld: this.root.querySelector('.schema-jsonld'),
		};
		this.#setupAutoSuggest();
	}

	#setupAutoSuggest() {
		if (!this.#autoSuggest) return;

		const checkInterval = setInterval(() => {
			if (typeof this.#autoSuggest.fetchData === 'function') {
				clearInterval(checkInterval);
				this.#overrideAutoSuggestFetch();
				this.#forwardAutoSuggestEvents();
			}
		}, 50);
	}

	#overrideAutoSuggestFetch() {
		this.#autoSuggest.fetchData = (value) => {
			this.dispatchEvent(new CustomEvent('taxonomySearchStart', { bubbles: true }));
			const results = this.search(value);
			const formattedResults = this.#formatResults(results);
			this.#autoSuggest.data = formattedResults;
			this.#autoSuggest.list.innerHTML = this.#autoSuggest.render(formattedResults);
			if (this.#autoSuggest.settings.listMode === 'ul' && formattedResults.length) {
				this.#autoSuggest.list.togglePopover(true);
				this.#autoSuggest.setAttribute('open', '');
			}
			if (!formattedResults.length) {
				this.#autoSuggest.dispatchEvent(new CustomEvent('autoSuggestNoResults', { bubbles: true }));
			}
			this.dispatchEvent(new CustomEvent('taxonomySearchEnd', {
				detail: { count: results.length },
				bubbles: true
			}));
		};

		this.#autoSuggest.debouncedFetch = this.#autoSuggest.debounced(
			this.#autoSuggest.settings.debounceTime,
			this.#autoSuggest.fetchData.bind(this.#autoSuggest)
		);
	}

	#forwardAutoSuggestEvents() {
		this.#autoSuggest.addEventListener('autoSuggestSelect', () => {
			this.dispatchEvent(new CustomEvent('taxonomySelect', { detail: this.selectedItem, bubbles: true }));
			this.#updateSchemaPreview();
		});

		this.#autoSuggest.addEventListener('autoSuggestClear', () => {
			this.dispatchEvent(new CustomEvent('taxonomyClear', { bubbles: true }));
			if (this.#elements.previewContainer) {
				this.#elements.previewContainer.hidden = true;
			}
		});

		this.#autoSuggest.addEventListener('autoSuggestNoResults', (e) => {
			this.dispatchEvent(new CustomEvent('taxonomyNoResults', { detail: e.detail, bubbles: true }));
		});
	}

	#updateSchemaPreview() {
		if (!this.#elements.previewContainer) return;

		const item = this.selectedItem;
		if (item) {
			this.#elements.previewContainer.hidden = false;
			if (this.#elements.microdata) {
				this.#elements.microdata.innerHTML = this.#generateMicrodata(item);
			}
			if (this.#elements.jsonld) {
				this.#elements.jsonld.textContent = this.#generateJsonLd(item);
			}
		} else {
			this.#elements.previewContainer.hidden = true;
		}
	}

	get selectedItem() {
		if (!this.#autoSuggest) return null;
		const selectedValue = this.#autoSuggest.value;
		return this.#parsedData.find(item => item.id === selectedValue) || null;
	}

	setValue(id, display) {
		if (!this.#autoSuggest) return;
		this.#autoSuggest.value = id;
		this.#autoSuggest.displayValue = display;
		this.#updateSchemaPreview();
	}
}

ProductTaxonomy.register();
