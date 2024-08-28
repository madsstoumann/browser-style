import { getObjectByPath, isEmpty, setObjectByPath } from '/ui/data-entry/modules/utility.js';

/* === Object to store information about components */
const componentsInfo = {
	AutoSuggest: {
		tagName: 'auto-suggest',
		bindFunction: bindAutoSuggest,
	},
	RichText: {
		tagName: 'rich-text',
	},
};

export async function mountComponents(HTML, dataEntry) {
	const importPromises = Object.entries(componentsInfo).map(async ([componentName, { tagName, bindFunction }]) => {
		if (HTML.includes(`<${tagName}`)) {
			try {
				const module = await import(`/ui/${tagName}/index.js`);
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

/* === METHODS === */

function handleAutoSuggestSelect(detail, autoSuggest, dataEntry) {
	if (detail.isInitial) {
		Object.keys(detail).forEach(key => {
			if (key !== 'isInitial') { // Ignore the isInitial flag itself
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
		const mappedValue = getObjectByPath(detail, mappedKeyPath);
		setObjectByPath(resultObject, fullPath, mappedValue);
		
		const input = autoSuggest.getAttribute('form') ? document.forms[autoSuggest.getAttribute('form')].elements[fullPath] : dataEntry.form.elements[fullPath];
		if (input) {
			input.value = mappedValue || '';
			input.setCustomValidity('');
			if (!input.checkValidity()) input.reportValidity();
		}
	});

	if (syncInstance && !isEmpty(resultObject)) {
		Object.keys(resultObject).forEach(key => setObjectByPath(dataEntry.instance.data, key, resultObject[key]));
		dataEntry.processData();
	}
}
