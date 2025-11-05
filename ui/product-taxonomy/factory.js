/**
 * @file A factory function to enhance an <auto-suggest> element with taxonomy data.
 * @author Mads Stoumann
 * @version 1.4.0
 * @summary 05-11-2025
 */

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

	} catch (error) {
		console.error('Error setting up taxonomy selector:', error);
		autoSuggestElement.dispatchEvent(new CustomEvent('taxonomyLoadError', {
			detail: error,
			bubbles: true
		}));
	}
}
