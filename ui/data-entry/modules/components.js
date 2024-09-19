import { getObjectByPath, isEmpty, setObjectByPath } from '/ui/data-entry/modules/utility.js';

/* === Object to store information about components */
const componentsInfo = {
	AutoSuggest: {
		bindFunction: bindAutoSuggest,
		path: '/ui/auto-suggest/index.js',
		tagName: 'auto-suggest',
	},
	RichText: {
		path: '/ui/rich-text/index.js',
		tagName: 'rich-text',
	},
	UiToast: {
		bindFunction: bindUiToast,
		path: '/ui/toast/index.js',
		tagName: 'ui-toast',
	},
};

export async function mountComponents(HTML, dataEntry) {
	const importPromises = Object.entries(componentsInfo).map(async ([componentName, { bindFunction, path, tagName }]) => {
		if (HTML.includes(`<${tagName}`)) {
			try {
				const module = await import(path);
				module[componentName].mount();
				if (bindFunction) {
					bindFunction(dataEntry);
				}
			} catch (error) {
				console.error(`Failed to load component ${componentName}:`, error);
			}
		}
	});
	await Promise.all(importPromises);
}

/* === BIND METHODS === */

function bindAutoSuggest(dataEntry) {
	dataEntry.form.querySelectorAll('auto-suggest').forEach(autoSuggest => {
		autoSuggest.addEventListener('autoSuggestSelect', (event) => handleAutoSuggestSelect(event.detail, autoSuggest, dataEntry));
	});
}

// Bind the UiToast component to enable showToast functionality
function bindUiToast(dataEntry) {
	const toastElement = dataEntry.form.querySelector('ui-toast');
	if (toastElement) {
		// Attach showToast method to use ui-toast if available
		dataEntry.showToast = (message, type = 'success', duration = 3000) => {
			toastElement.showToast(message, type, duration);
		};
	} else {
		// Fallback if ui-toast is not available
		dataEntry.showToast = (message, type = 'info', duration = 3000) => {
			dataEntry.debugLog(`Toast fallback: ${message} (Type: ${type})`);
		};
	}
}

/* === METHODS === */

function handleAutoSuggestSelect(detail, autoSuggest, dataEntry) {
	if (detail.isInitial) {
		Object.keys(detail).forEach(key => {
			if (key !== 'isInitial') {
				setObjectByPath(dataEntry.instance.data, key, detail[key]);
			}
		});
		dataEntry.processData();
		return;
	}

	const path = autoSuggest.getAttribute('name').split('.').slice(0, -1).join('.') || autoSuggest.getAttribute('name');
	const syncInstance = autoSuggest.getAttribute('sync-instance') === 'true';
	const mapping = JSON.parse(autoSuggest.dataset.mapping || '{}');
	let resultObject = Object.keys(detail).length === 1 && detail[path] ? { [path]: detail[path] } : {};

	Object.entries(mapping).forEach(([field, mappedKeyPath]) => {
		const fullPath = path ? `${path}.${field}` : field;
		
		// Check if the mappedKeyPath contains a template string
		let mappedValue;
		if (/\$\{.+?\}/.test(mappedKeyPath)) {
			// Replace the placeholders with the corresponding values from the detail object
			mappedValue = mappedKeyPath.replace(/\$\{(.+?)\}/g, (_match, p1) => {
				const value = getObjectByPath(detail, p1.trim());
				return value !== undefined ? value : '';  // Return empty string if not found
			});
		} else {
			// Fallback to the basic mapping if not a template string
			mappedValue = getObjectByPath(detail, mappedKeyPath);
		}

		setObjectByPath(resultObject, fullPath, mappedValue);
		const input = autoSuggest.getAttribute('form') ? document.forms[autoSuggest.getAttribute('form')].elements[fullPath] : dataEntry.form.elements[fullPath];
		if (input) {
			input.value = mappedValue || '';
		}
	});

	if (syncInstance && !isEmpty(resultObject)) {
		Object.keys(resultObject).forEach(key => setObjectByPath(dataEntry.instance.data, key, resultObject[key]));
		dataEntry.processData();
	}
}
