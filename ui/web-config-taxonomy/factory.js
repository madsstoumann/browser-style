/**
 * @file A factory function to enhance an <auto-suggest> element with taxonomy data and schema rendering.
 * @author Mads Stoumann
 * @version 2.0.0
 * @summary 05-11-2025
 */

// --- Helper functions for Schema.org preview ---
function escapeHtml(str) {
	return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function generateMicrodata(item) {
	const categories = item.categories;
	const boilerplate = `<span class="schema-boilerplate">${escapeHtml('<div itemscope itemtype="https://schema.org/Product">')}\n  ${escapeHtml('<meta itemprop="name" content="Example Product">')}</span>\n`;
	let taxonomyHtml = `  ${escapeHtml('<div itemprop="category" itemscope itemtype="https://schema.org/DefinedTerm">')}\n`;
	taxonomyHtml += `    ${escapeHtml(`<meta itemprop="termCode" content="${item.id}">`)}\n`;
	taxonomyHtml += `    ${escapeHtml(`<meta itemprop="name" content="${item.name}">`)}\n`;
	if (categories.length > 1) {
		taxonomyHtml += `    ${escapeHtml('<div itemprop="inDefinedTermSet" itemscope itemtype="https://schema.org/DefinedTermSet">')}\n`;
		taxonomyHtml += `      ${escapeHtml(`<meta itemprop="name" content="${categories.slice(0, -1).join(' > ')}">`)}\n`;
		taxonomyHtml += `    ${escapeHtml('</div>')}\n`;
	}
	taxonomyHtml += `  ${escapeHtml('</div>')}\n`;
	taxonomyHtml += `<span class="schema-boilerplate">${escapeHtml('</div>')}</span>`;
	return boilerplate + taxonomyHtml;
}

function generateJsonLd(item) {
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
				"name": "Product Taxonomy"
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

function createSchemaPreviewElement(schemaTypes) {
	const container = document.createElement('div');
	container.className = 'schema-preview';
	container.hidden = true;

	if (schemaTypes.includes('microdata')) {
		container.innerHTML += `<h4>Schema.org Microdata</h4><pre class="schema-microdata"></pre>`;
	}
	if (schemaTypes.includes('jsonld')) {
		container.innerHTML += `<h4>Schema.org JSON-LD</h4><pre class="schema-jsonld"></pre>`;
	}
	return container;
}

function updateSchemaPreview(previewEl, item) {
	if (!previewEl || !item) {
		if (previewEl) previewEl.hidden = true;
		return;
	}
	previewEl.hidden = false;
	const microdataEl = previewEl.querySelector('.schema-microdata');
	const jsonldEl = previewEl.querySelector('.schema-jsonld');

	if (microdataEl) microdataEl.innerHTML = generateMicrodata(item);
	if (jsonldEl) jsonldEl.textContent = generateJsonLd(item);
}


/**
 * Fetches and parses taxonomy data from a given URL.
 * @param {string} url - The URL of the taxonomy file.
 * @param {Function} parser - The parser function to process each line.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of parsed taxonomy items.
 * @throws {Error} If the data cannot be fetched or parsed.
 */
async function fetchAndParseTaxonomy(url, parser) {
	if (!parser || typeof parser !== 'function') {
		throw new Error('A valid parser function must be provided.');
	}
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to load taxonomy data from "${url}"`);
	}
	const text = await response.text();
	const lines = text.split('\n').filter(line => line.trim() && !line.startsWith('#'));

	return lines.map(line => {
		const item = parser(line);
		if (item) {
			// Add the _searchText property for auto-suggest's local search
			item._searchText = item.path.toLowerCase();
		}
		return item;
	}).filter(Boolean);
}

/**
 * Enhances an <auto-suggest> element to function as a taxonomy selector.
 * It fetches data from a specified URL, parses it, and injects it into the auto-suggest component.
 *
 * @param {HTMLElement} autoSuggestElement - The <auto-suggest> custom element to enhance.
 * @param {object} options - Configuration options.
 * @param {string} options.dataUrl - The URL of the taxonomy data file.
 * @param {Function} options.parser - The parser function (e.g., googleTaxonomyParser).
 * @returns {Promise<void>} A promise that resolves when the setup is complete.
 */
export async function createTaxonomySelector(autoSuggestElement, { dataUrl, parser }) {
	if (!autoSuggestElement || autoSuggestElement.tagName !== 'AUTO-SUGGEST') {
		console.error('The provided element must be an <auto-suggest> component.');
		return;
	}

	try {
		// Dispatch a start event
		autoSuggestElement.dispatchEvent(new CustomEvent('taxonomyLoadStart', { bubbles: true }));

		const parsedData = await fetchAndParseTaxonomy(new URL(dataUrl, import.meta.url).href, parser);

		// Inject the parsed data into the auto-suggest component's dataset
		autoSuggestElement.fullDataset = parsedData;

		// Dispatch a load-end event with the count
		autoSuggestElement.dispatchEvent(new CustomEvent('taxonomyLoadEnd', {
			detail: { count: parsedData.length },
			bubbles: true
		}));

		// Handle schema rendering if requested
		const schemaAttr = autoSuggestElement.getAttribute('schema');
		if (schemaAttr) {
			const schemaTypes = schemaAttr.split(' ').filter(Boolean);
			const schemaPreviewEl = createSchemaPreviewElement(schemaTypes);
			autoSuggestElement.insertAdjacentElement('afterend', schemaPreviewEl);

			autoSuggestElement.addEventListener('autoSuggestSelect', (e) => {
				updateSchemaPreview(schemaPreviewEl, e.detail);
			});

			autoSuggestElement.addEventListener('autoSuggestClear', () => {
				if (schemaPreviewEl) schemaPreviewEl.hidden = true;
			});
		}

	} catch (error) {
		console.error('Error setting up taxonomy selector:', error);
		autoSuggestElement.dispatchEvent(new CustomEvent('taxonomyLoadError', {
			detail: error,
			bubbles: true
		}));
	}
}
