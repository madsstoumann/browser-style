import { FormElement } from '../common/form.element.js';

/**
 * ProductTaxonomy
 * @description Web component that loads and searches product taxonomies (Google or Facebook).
 * @author Mads Stoumann
 * @version 1.1.0
 * @summary 02-11-2025
 * @class ProductTaxonomy
 * @extends {FormElement}
 */
export class ProductTaxonomy extends FormElement {
	#autoSuggest;
	#parsedData = [];
	#config = {};

	get basePath() {
		return new URL('.', import.meta.url).href;
	}

	constructor() {
		super();
	}

	initializeComponent() {
		this.#config = {
			mode: this.getAttribute('mode') || this.getAttribute('type') || 'google',
			label: this.getAttribute('label') || 'Product Taxonomy',
			placeholder: this.getAttribute('placeholder') || 'Search for a product category...',
			minLength: parseInt(this.getAttribute('minlength')) || 2,
			maxResults: parseInt(this.getAttribute('max-results')) || 50,
			listMode: this.getAttribute('list-mode') || 'datalist',
			noshadow: this.hasAttribute('noshadow'),
			required: this.hasAttribute('required'),
		};
		this.#config.dataSource = this.getAttribute('data') || this.#getDefaultDataSource();

		this.render();
		this.#loadTaxonomyData();
	}

	#getDefaultDataSource() {
		const sources = {
			google: `${this.basePath}google.txt`,
			facebook: `${this.basePath}facebook.txt`
		};
		return sources[this.#config.mode] || sources.google;
	}

	async #loadTaxonomyData() {
		this.dispatchEvent(new CustomEvent('taxonomyLoadStart', { bubbles: true }));
		try {
			const response = await fetch(this.#config.dataSource);
			if (!response.ok) {
				throw new Error(`Failed to load taxonomy data: ${response.statusText}`);
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

	render() {
		this.root.innerHTML = `
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
		`;
		this.#autoSuggest = this.root.querySelector('auto-suggest');
		this.#setupAutoSuggest();
	}

	#setupAutoSuggest() {
		if (!this.#autoSuggest) return;

		// The auto-suggest component might not be fully initialized yet.
		// We'll wait for it by checking for one of its methods.
		const checkInterval = setInterval(() => {
			if (typeof this.#autoSuggest.fetchData === 'function') {
				clearInterval(checkInterval);
				this.#overrideAutoSuggestFetch();
				this.#forwardAutoSuggestEvents();
			}
		}, 50);
	}

	#overrideAutoSuggestFetch() {
		// Override the fetchData method to use our local search
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

		// Also override the debounced version
		this.#autoSuggest.debouncedFetch = this.#autoSuggest.debounced(
			this.#autoSuggest.settings.debounceTime,
			this.#autoSuggest.fetchData.bind(this.#autoSuggest)
		);
	}

	#forwardAutoSuggestEvents() {
		['autoSuggestSelect', 'autoSuggestClear', 'autoSuggestNoResults'].forEach(eventName => {
			this.#autoSuggest.addEventListener(eventName, (e) => {
				const newEventName = eventName.replace('autoSuggest', 'taxonomy');
				this.dispatchEvent(new CustomEvent(newEventName, {
					detail: e.detail,
					bubbles: true
				}));
			});
		});
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
	}
}

ProductTaxonomy.register();
