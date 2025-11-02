import { FormElement } from '../common/form.element.js';

/**
 * ProductTaxonomy
 * @description Web component that loads and searches product taxonomies (Google or Facebook)
 * @author Mads Stoumann
 * @version 1.0.0
 * @summary 02-11-2025
 * @class ProductTaxonomy
 * @extends {FormElement}
 */
export class ProductTaxonomy extends FormElement {

	get basePath() {
		return new URL('.', import.meta.url).href;
	}

	constructor() {
		super();
		this.taxonomyData = [];
		this.parsedData = [];
	}

	initializeComponent() {
		// Get configuration from attributes
		this.mode = this.getAttribute('mode') || this.getAttribute('type') || 'google';
		this.dataSource = this.getAttribute('data') || this.getDefaultDataSource();
		this.label = this.getAttribute('label') || 'Product Taxonomy';
		this.placeholder = this.getAttribute('placeholder') || 'Search for a product category...';
		this.minLength = parseInt(this.getAttribute('minlength')) || 2;

		// Load and parse the taxonomy data
		this.loadTaxonomyData();
	}

	/**
	 * Gets the default data source based on mode
	 */
	getDefaultDataSource() {
		const sources = {
			google: `${this.basePath}taxonomy-with-ids.en-US.txt`,
			facebook: `${this.basePath}fb_product_categories_en_US.txt`
		};
		return sources[this.mode] || sources.google;
	}

	/**
	 * Loads taxonomy data from the specified source
	 */
	async loadTaxonomyData() {
		try {
			this.dispatchEvent(new CustomEvent('taxonomyLoadStart', { bubbles: true }));

			const response = await fetch(this.dataSource);
			if (!response.ok) {
				throw new Error(`Failed to load taxonomy data: ${response.statusText}`);
			}

			const text = await response.text();
			this.taxonomyData = text.split('\n').filter(line => line.trim() && !line.startsWith('#'));

			// Parse the data based on mode
			this.parsedData = this.mode === 'facebook' ?
				this.parseFacebookFormat() :
				this.parseGoogleFormat();

			this.dispatchEvent(new CustomEvent('taxonomyLoadEnd', {
				detail: { count: this.parsedData.length },
				bubbles: true
			}));

			// Render the component after data is loaded
			this.render();
		} catch (error) {
			console.error('Error loading taxonomy data:', error);
			this.dispatchEvent(new CustomEvent('taxonomyLoadError', {
				detail: error,
				bubbles: true
			}));
		}
	}

	/**
	 * Parses Google taxonomy format
	 * Format: "ID - Category > Subcategory > ..."
	 */
	parseGoogleFormat() {
		return this.taxonomyData.map(line => {
			const match = line.match(/^(\d+)\s*-\s*(.+)$/);
			if (!match) return null;

			const [, id, path] = match;
			const categories = path.split('>').map(c => c.trim());
			const name = categories[categories.length - 1];

			return {
				id,
				name,
				path,
				categories,
				searchText: path.toLowerCase()
			};
		}).filter(Boolean);
	}

	/**
	 * Parses Facebook taxonomy format
	 * Format: "ID,category > subcategory > ..."
	 */
	parseFacebookFormat() {
		return this.taxonomyData.map(line => {
			const firstComma = line.indexOf(',');
			if (firstComma === -1) return null;

			const id = line.substring(0, firstComma).trim();
			const path = line.substring(firstComma + 1).trim();
			const categories = path.split('>').map(c => c.trim());
			const name = categories[categories.length - 1];

			return {
				id,
				name,
				path,
				categories,
				searchText: path.toLowerCase()
			};
		}).filter(Boolean);
	}

	/**
	 * Searches taxonomy data based on query
	 */
	search(query) {
		if (!query || query.length < this.minLength) {
			return [];
		}

		const searchTerm = query.toLowerCase();
		const results = this.parsedData.filter(item =>
			item.searchText.includes(searchTerm)
		);

		// Limit results to prevent overwhelming the UI
		const maxResults = parseInt(this.getAttribute('max-results')) || 50;
		return results.slice(0, maxResults);
	}

	/**
	 * Formats search results for auto-suggest
	 */
	formatResults(results) {
		return results.map(item => ({
			id: item.id,
			name: item.name,
			path: item.path,
			categories: item.categories,
			display: item.path,
			value: item.id
		}));
	}

	/**
	 * Renders the component
	 */
	render() {
		// Use a dummy API that won't be called (we'll override fetchData)
		this.root.innerHTML = `
			<auto-suggest
				api="#"
				api-value-path="id"
				api-display-path="display"
				api-text-path="path"
				label="${this.label}"
				list-mode="${this.getAttribute('list-mode') || 'datalist'}"
				minlength="${this.minLength}"
				${this.hasAttribute('noshadow') ? 'noshadow' : ''}
				placeholder="${this.placeholder}"
				${this.hasAttribute('required') ? 'required="true"' : ''}
			></auto-suggest>
		`;

		// Get the auto-suggest element
		this.autoSuggest = this.root.querySelector('auto-suggest');

		// Override the auto-suggest's fetchData method to use our search
		this.setupAutoSuggest();
	}

	/**
	 * Sets up the auto-suggest integration
	 */
	setupAutoSuggest() {
		if (!this.autoSuggest) return;

		// Wait for auto-suggest to mount
		if (!this.autoSuggest.initialized) {
			setTimeout(() => this.setupAutoSuggest(), 50);
			return;
		}

		// Override the fetchData method before it gets called
		this.autoSuggest.fetchData = (value) => {
			// Use our local search instead of API call
			this.dispatchEvent(new CustomEvent('taxonomySearchStart', { bubbles: true }));

			const results = this.search(value);
			const formattedResults = this.formatResults(results);

			this.autoSuggest.data = formattedResults;
			this.autoSuggest.list.innerHTML = this.autoSuggest.render(formattedResults);

			if (this.autoSuggest.settings.listMode === 'ul' && formattedResults.length) {
				this.autoSuggest.list.togglePopover(true);
				this.autoSuggest.setAttribute('open', '');
			}

			if (!formattedResults.length) {
				this.autoSuggest.dispatchEvent(new CustomEvent('autoSuggestNoResults', { bubbles: true }));
			}

			this.dispatchEvent(new CustomEvent('taxonomySearchEnd', {
				detail: { count: results.length },
				bubbles: true
			}));
		};

		// Also override the debounced version
		this.autoSuggest.debouncedFetch = this.autoSuggest.debounced(
			this.autoSuggest.settings.debounceTime,
			this.autoSuggest.fetchData.bind(this.autoSuggest)
		);

		// Forward auto-suggest events
		['autoSuggestSelect', 'autoSuggestClear', 'autoSuggestNoResults'].forEach(eventName => {
			this.autoSuggest.addEventListener(eventName, (e) => {
				const newEventName = eventName.replace('autoSuggest', 'taxonomy');
				this.dispatchEvent(new CustomEvent(newEventName, {
					detail: e.detail,
					bubbles: true
				}));
			});
		});
	}

	/**
	 * Gets the currently selected taxonomy item
	 */
	get selectedItem() {
		if (!this.autoSuggest) return null;
		const value = this.autoSuggest.value;
		return this.parsedData.find(item => item.id === value) || null;
	}

	/**
	 * Sets the value programmatically
	 */
	setValue(id, display) {
		if (!this.autoSuggest) return;
		this.autoSuggest.value = id;
		this.autoSuggest.displayValue = display;
	}
}

ProductTaxonomy.register();
