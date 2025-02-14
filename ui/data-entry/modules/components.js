import { getObjectByPath, isEmpty, mapObject, setObjectByPath } from './utility.js';

/* === Object to store information about components */
const componentsInfo = {
	AutoSuggest: {
		bindFunction: bindAutoSuggest,
		path: '@browser.style/auto-suggest',
		tagName: 'auto-suggest',
	},
	BarcodeScanner: {
		bindFunction: bindBarcodeScanner,
		path: '@browser.style/barcode-scanner',
		tagName: 'barcode-scanner',
	},
	DataMapper: {
		bindFunction: bindDataMapper,
		path: '@browser.style/data-mapper',
		tagName: 'data-mapper'
	},
	RichText: {
		path: '@browser.style/rich-text',
		tagName: 'rich-text',
	},
	SnackBar: {
		bindFunction: bindSnackBar,
		path: '@browser.style/snack-bar',
		tagName: 'snack-bar',
	}
};

/**
 * Mounts components dynamically based on the provided HTML content and data entry object.
 *
 * This function scans the HTML content for specific tags defined in the `componentsInfo` object.
 * If a tag is found, it dynamically imports the corresponding module, mounts the component,
 * and optionally binds a function to the data entry object.
 *
 * @param {string} HTML - The HTML content to scan for component tags.
 * @param {Object} dataEntry - The data entry object to bind functions to, if specified.
 * @returns {Promise<void>} A promise that resolves when all components have been mounted.
 *
 * @throws {Error} If a component fails to load, an error is logged to the console.
 */
export async function mountComponents(HTML, dataEntry) {
	const importPromises = Object.entries(componentsInfo).map(
		async ([componentName, { bindFunction, path, tagName }]) => {
			if (HTML.includes(`<${tagName}`)) {
				try {
					const module = await import(path);
					// Handle both default and named exports
					const Component = module.default || module[componentName];
					Component.register();
					if (bindFunction) {
						bindFunction(dataEntry);
					}
				} catch (error) {
					console.error(`Failed to load component ${componentName}:`, error);
				}
			}
		}
	);
	await Promise.all(importPromises);
}

/* === BIND METHODS === */

function bindAutoSuggest(dataEntry) {
	dataEntry.form.querySelectorAll('auto-suggest').forEach((autoSuggest) => {
		autoSuggest.addEventListener('autoSuggestSelect', (event) =>
			handleAutoSuggestSelect(event.detail, autoSuggest, dataEntry)
		);
	});
}

function bindBarcodeScanner(dataEntry) {
	dataEntry.form
		.querySelectorAll('barcode-scanner')
		.forEach((barcodeScanner) => {
			barcodeScanner.addEventListener('bs:entry', (event) =>
				handleBarcodeEntry(event, barcodeScanner, dataEntry)
			);
		});
}

function bindDataMapper(dataEntry) {
	dataEntry.form.querySelectorAll('data-mapper').forEach((dataMapper) => {
			// Find the property containing datamapper configuration
			const schemaProperty = Object.entries(dataEntry.instance.schema.properties)
				.find(([_, config]) => config?.render?.method === 'datamapper');

			if (!schemaProperty) {
				console.warn('No datamapper configuration found in schema');
				return;
			}

			const [propertyName, propertyConfig] = schemaProperty;
			const datamapperConfig = propertyConfig?.render?.datamapper;

			if (datamapperConfig) {
				// Set custom formatters if defined in schema
				if (datamapperConfig.formatters) {
					const parsedFormatters = {};
					// Convert formatter function strings to actual functions
					Object.entries(datamapperConfig.formatters).forEach(([key, formatter]) => {
						try {
							parsedFormatters[key] = new Function('return ' + formatter.function)();
						} catch (error) {
							console.warn(`Failed to parse formatter function for ${key}:`, error);
						}
					});
					dataMapper.formatters = parsedFormatters;
				}

				// Set custom mapping if defined in schema
				if (datamapperConfig.customMapping) {
					dataMapper.customMapping = datamapperConfig.customMapping;
				}
			}

			// Handle processed data
			dataMapper.addEventListener('dm:processed', (event) => {
				const processed = dataMapper.querySelector('[part="processed"]');
				if (processed) {
					processed.textContent = `${event.detail.length} processed`;
				}
				setObjectByPath(dataEntry.instance.data, propertyName, event.detail);
				dataEntry.processData();
				dataMapper.dispatchEvent(new CustomEvent('dm:close'));
			});
		});
}

// Bind the SnackBar component to enable showMsg functionality
function bindSnackBar(dataEntry) {
	const snackBar = dataEntry.form.querySelector('snack-bar');
	if (snackBar) {
		dataEntry.showMsg = (message, type = 'success', duration = 3000) => {
			snackBar.add(message, type, duration);
		};
	} else {
		// Fallback if ui-toast is not available
		dataEntry.showMsg = (message, type = 'info', duration = 3000) => {
			dataEntry.debugLog(`Toast fallback: ${message} (Type: ${type})`);
		};
	}
}

/* === METHODS === */

/* === AUTO-SUGGEST === */
function handleAutoSuggestSelect(detail, autoSuggest, dataEntry) {
	// Handle initial data population
	if (detail.isInitial) {
		Object.entries(detail)
			.filter(([key]) => key !== 'isInitial')
			.forEach(([key, value]) =>
				setObjectByPath(dataEntry.instance.data, key, value)
			);
		dataEntry.processData();
		return;
	}

	const path = autoSuggest.getAttribute('path');
	if (!path) return;

	const config = getObjectByPath(dataEntry.instance.schema.properties, path);
	if (!config?.render?.autosuggest?.mapping) return;

	// Map values and determine sync behavior
	const { mapping } = config.render.autosuggest;
	const syncInstance = autoSuggest.getAttribute('sync-instance') === 'true';
	const resultObject = mapObject(detail, mapping, syncInstance ? path : '');
	if (isEmpty(resultObject)) return;

	// Update form inputs
	const form =
		document.forms[autoSuggest.getAttribute('form')] || dataEntry.form;
	Object.entries(resultObject).forEach(([key, value]) => {
		const input = form.elements[`${path}.${key}`];
		if (input) input.value = value ?? '';
	});

	// Update instance data if needed
	if (syncInstance) {
		Object.entries(resultObject).forEach(([key, value]) =>
			setObjectByPath(dataEntry.instance.data, key, value)
		);
		dataEntry.processData();
	}
}

/* === BARCODE SCANNER === */
async function handleBarcodeEntry(event, barcodeScanner, dataEntry) {
	try {
		const path = barcodeScanner.getAttribute('path');
		if (!path) return;

		const config = getObjectByPath(dataEntry.instance.schema.properties, path);
		if (!config?.render?.barcode) return;

		const { api, apiArrayPath, mapping } = config.render.barcode;

		const response = await fetch(
			`${api}${encodeURIComponent(event.detail.value)}`
		);
		if (!response.ok) throw new Error('Network response was not ok');

		const data = await response.json();
		let obj = apiArrayPath ? getObjectByPath(data, apiArrayPath) : data;

		obj = Array.isArray(obj)
			? obj[0]
			: typeof obj === 'object'
			? obj
			: null;

		if (!obj) return;

		const mappedObject = mapObject(obj, mapping, '');
		const addMethod = config.render?.addMethod || 'arrayUnit';
		dataEntry.addArrayEntries(path, [mappedObject], addMethod);

	} catch (error) {
		dataEntry.showMsg('Error processing barcode', 'error');
	}
}
