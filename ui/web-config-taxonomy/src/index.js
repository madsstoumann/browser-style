/**
 * @file Web component wrapper for taxonomy selection using auto-suggest.
 * @author Mads Stoumann
 * @version 1.0.0
 * @summary 06-01-2026
 */

import { createTaxonomySelector } from '../factory.js';
import { googleTaxonomyParser, facebookTaxonomyParser } from '../parsers.js';

/**
 * Taxonomy type presets with their configurations
 */
const TAXONOMY_PRESETS = {
	google: {
		dataUrl: 'google.txt',
		parser: googleTaxonomyParser,
		searchMode: 'local-keywords',
		label: 'Google Product Category',
		placeholder: 'e.g., headphones, coffee, toys'
	},
	facebook: {
		dataUrl: 'facebook.txt',
		parser: facebookTaxonomyParser,
		searchMode: 'local-keywords',
		label: 'Meta/Facebook Product Category',
		placeholder: 'e.g., food, games, clothing'
	},
	'google-fuzzy': {
		dataUrl: 'google.txt',
		parser: googleTaxonomyParser,
		searchMode: 'local-fuzzy',
		label: 'Google Product Category (Fuzzy)',
		placeholder: 'e.g., coffe, hphone, furnitur'
	}
};

// --- Schema.org generation helpers ---
function generateMicrodata(item) {
	if (!item) return '';
	const categories = item.categories || [];
	let html = '<div itemscope itemtype="https://schema.org/Product">\n';
	html += '  <meta itemprop="name" content="Example Product">\n';
	html += '  <div itemprop="category" itemscope itemtype="https://schema.org/DefinedTerm">\n';
	html += `    <meta itemprop="termCode" content="${item.id}">\n`;
	html += `    <meta itemprop="name" content="${item.name}">\n`;
	if (categories.length > 1) {
		html += '    <div itemprop="inDefinedTermSet" itemscope itemtype="https://schema.org/DefinedTermSet">\n';
		html += `      <meta itemprop="name" content="${categories.slice(0, -1).join(' > ')}">\n`;
		html += '    </div>\n';
	}
	html += '  </div>\n';
	html += '</div>';
	return html;
}

function generateJsonLd(item) {
	if (!item) return '';
	const categories = item.categories || [];
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
				"name": categories.length > 1 ? categories.slice(0, -1).join(' > ') : "Product Taxonomy"
			},
			"additionalProperty": {
				"@type": "PropertyValue",
				"name": "categoryPath",
				"value": item.path
			}
		}
	};
	return JSON.stringify(jsonld, null, 2);
}

class WebConfigTaxonomy extends HTMLElement {
	static formAssociated = true;
	static observedAttributes = ['type', 'value', 'label', 'placeholder', 'schema'];

	constructor() {
		super();
		this._internals = this.attachInternals();
		this._autoSuggest = null;
		this._schemaPreview = null;
		this._selectedItem = null;
		this._initialized = false;
	}

	async connectedCallback() {
		// Wait for auto-suggest to be defined
		await customElements.whenDefined('auto-suggest');

		this._render();
		await this._initializeTaxonomy();
		this._initialized = true;
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue || !this._initialized) return;

		if (name === 'type') {
			// Re-initialize with new taxonomy type
			this._initializeTaxonomy();
		} else if (name === 'value' && newValue) {
			this._setValueFromAttribute(newValue);
		} else if (name === 'label' && this._autoSuggest) {
			this._autoSuggest.setAttribute('label', newValue || '');
		} else if (name === 'placeholder' && this._autoSuggest) {
			this._autoSuggest.setAttribute('placeholder', newValue || '');
		}
	}

	get type() {
		return this.getAttribute('type') || 'google';
	}

	set type(val) {
		this.setAttribute('type', val);
	}

	get value() {
		return this._selectedItem ? JSON.stringify(this._selectedItem) : '';
	}

	set value(val) {
		if (typeof val === 'string' && val) {
			try {
				this._selectedItem = JSON.parse(val);
				this._updateDisplay();
				this._updateSchemaPreview();
			} catch {
				// Try to find by ID if it's just an ID string
				this._setValueById(val);
			}
		} else if (val && typeof val === 'object') {
			this._selectedItem = val;
			this._updateDisplay();
			this._updateSchemaPreview();
		} else {
			this._selectedItem = null;
			this._updateDisplay();
			this._updateSchemaPreview();
		}
		this._syncFormValue();
	}

	get selectedItem() {
		return this._selectedItem;
	}

	get config() {
		return this._selectedItem;
	}

	set config(val) {
		this.value = val;
	}

	/**
	 * Get the schema output type(s) configured for this component
	 * @returns {string[]} Array of schema types: 'microdata', 'jsonld', or both
	 */
	get schemaTypes() {
		const schemaAttr = this.getAttribute('schema') || 'microdata jsonld';
		return schemaAttr.split(' ').filter(Boolean);
	}

	_render() {
		const type = this.type;
		const preset = TAXONOMY_PRESETS[type] || TAXONOMY_PRESETS.google;

		// Get custom label/placeholder or use preset defaults
		const label = this.getAttribute('label') || preset.label;
		const placeholder = this.getAttribute('placeholder') || preset.placeholder;
		const minlength = this.getAttribute('minlength') || (type === 'google-fuzzy' ? '3' : '2');
		const maxResults = this.getAttribute('max-results') || (type === 'google-fuzzy' ? '20' : '50');
		const minScore = this.getAttribute('min-score') || '0.5';

		// Create auto-suggest element
		this._autoSuggest = document.createElement('auto-suggest');
		this._autoSuggest.setAttribute('search-mode', preset.searchMode);
		this._autoSuggest.setAttribute('search-fields', 'path');
		this._autoSuggest.setAttribute('api-value-path', 'id');
		this._autoSuggest.setAttribute('api-display-path', 'path');
		this._autoSuggest.setAttribute('info-template', 'Loaded {count} categories');
		this._autoSuggest.setAttribute('status-template', 'Selected: {display}');
		this._autoSuggest.setAttribute('label', label);
		this._autoSuggest.setAttribute('list-mode', 'ul');
		this._autoSuggest.setAttribute('minlength', minlength);
		this._autoSuggest.setAttribute('placeholder', placeholder);
		this._autoSuggest.setAttribute('noshadow', '');

		if (type === 'google-fuzzy') {
			this._autoSuggest.setAttribute('min-score', minScore);
			this._autoSuggest.setAttribute('max-results', maxResults);
		}

		// Add slots
		const infoSlot = document.createElement('small');
		infoSlot.setAttribute('slot', 'info');
		const statusSlot = document.createElement('small');
		statusSlot.setAttribute('slot', 'status');

		this._autoSuggest.appendChild(infoSlot);
		this._autoSuggest.appendChild(statusSlot);

		// Create schema preview container as a collapsible details element
		this._schemaPreview = document.createElement('details');
		this._schemaPreview.className = 'schema-preview';
		this._schemaPreview.hidden = true;

		const summary = document.createElement('summary');
		summary.textContent = 'Schema.org Data';
		this._schemaPreview.appendChild(summary);

		const schemaTypes = this.schemaTypes;

		// Create microdata section if enabled
		if (schemaTypes.includes('microdata')) {
			const microdataHeading = document.createElement('h4');
			microdataHeading.textContent = 'Microdata';
			this._schemaPreview.appendChild(microdataHeading);

			const microdataPre = document.createElement('pre');
			const microdataCode = document.createElement('code');
			microdataCode.className = 'schema-microdata';
			microdataPre.appendChild(microdataCode);
			this._schemaPreview.appendChild(microdataPre);
		}

		// Create JSON-LD section if enabled
		if (schemaTypes.includes('jsonld')) {
			const jsonldHeading = document.createElement('h4');
			jsonldHeading.textContent = 'JSON-LD';
			this._schemaPreview.appendChild(jsonldHeading);

			const jsonldPre = document.createElement('pre');
			const jsonldCode = document.createElement('code');
			jsonldCode.className = 'schema-jsonld';
			jsonldPre.appendChild(jsonldCode);
			this._schemaPreview.appendChild(jsonldPre);
		}

		// Clear existing children using DOM methods
		while (this.firstChild) {
			this.removeChild(this.firstChild);
		}
		this.appendChild(this._autoSuggest);
		this.appendChild(this._schemaPreview);
	}

	_updateSchemaPreview() {
		if (!this._schemaPreview) return;

		if (!this._selectedItem) {
			this._schemaPreview.hidden = true;
			return;
		}

		this._schemaPreview.hidden = false;

		const microdataEl = this._schemaPreview.querySelector('.schema-microdata');
		const jsonldEl = this._schemaPreview.querySelector('.schema-jsonld');

		if (microdataEl) {
			microdataEl.textContent = generateMicrodata(this._selectedItem);
		}
		if (jsonldEl) {
			jsonldEl.textContent = generateJsonLd(this._selectedItem);
		}
	}

	async _initializeTaxonomy() {
		if (!this._autoSuggest) return;

		const type = this.type;
		const preset = TAXONOMY_PRESETS[type] || TAXONOMY_PRESETS.google;

		// Resolve data URL relative to this component's location
		const baseUrl = new URL('.', import.meta.url).href;
		const dataUrl = new URL(`../${preset.dataUrl}`, baseUrl).href;

		try {
			await createTaxonomySelector(this._autoSuggest, {
				dataUrl,
				parser: preset.parser
			});

			// Attach event listeners
			this._autoSuggest.addEventListener('autoSuggestSelect', (e) => {
				this._selectedItem = e.detail;
				this._syncFormValue();
				this._updateSchemaPreview();
				this.dispatchEvent(new CustomEvent('change', {
					detail: this._selectedItem,
					bubbles: true,
					composed: true
				}));
				this.dispatchEvent(new CustomEvent('taxonomy-select', {
					detail: this._selectedItem,
					bubbles: true,
					composed: true
				}));
			});

			this._autoSuggest.addEventListener('autoSuggestClear', () => {
				this._selectedItem = null;
				this._syncFormValue();
				this._updateSchemaPreview();
				this.dispatchEvent(new CustomEvent('change', {
					detail: null,
					bubbles: true,
					composed: true
				}));
				this.dispatchEvent(new CustomEvent('taxonomy-clear', {
					bubbles: true,
					composed: true
				}));
			});

			// If we have an initial value, set it
			const initialValue = this.getAttribute('value');
			if (initialValue) {
				this._setValueFromAttribute(initialValue);
			}

		} catch (error) {
			console.error('Failed to initialize taxonomy:', error);
			this.dispatchEvent(new CustomEvent('taxonomy-error', {
				detail: error,
				bubbles: true,
				composed: true
			}));
		}
	}

	_setValueFromAttribute(val) {
		try {
			const parsed = JSON.parse(val);
			this._selectedItem = parsed;
			this._updateDisplay();
			this._updateSchemaPreview();
		} catch {
			// If it's just an ID, we'd need to look it up in the dataset
			this._setValueById(val);
		}
	}

	_setValueById(id) {
		if (!this._autoSuggest?.fullDataset) return;

		const item = this._autoSuggest.fullDataset.find(i => i.id === id);
		if (item) {
			this._selectedItem = item;
			this._updateDisplay();
			this._updateSchemaPreview();
		}
	}

	_updateDisplay() {
		if (!this._autoSuggest) return;

		if (this._selectedItem) {
			this._autoSuggest.displayValue = this._selectedItem.path || '';
			this._autoSuggest.value = this._selectedItem.id || '';
		} else {
			this._autoSuggest.displayValue = '';
			this._autoSuggest.value = '';
		}
	}

	_syncFormValue() {
		const val = this._selectedItem ? JSON.stringify(this._selectedItem) : '';
		this._internals.setFormValue(val);
	}

	// Form-associated custom element methods
	formResetCallback() {
		this._selectedItem = null;
		this._updateDisplay();
		this._updateSchemaPreview();
		this._syncFormValue();
	}

	formDisabledCallback(disabled) {
		if (this._autoSuggest) {
			const input = this._autoSuggest.querySelector('input');
			if (input) input.disabled = disabled;
		}
	}
}

customElements.define('web-config-taxonomy', WebConfigTaxonomy);

export { WebConfigTaxonomy };
