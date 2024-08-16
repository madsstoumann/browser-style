export function addArrayEntry(dataEntryInstance, key, popoverId) {
	// const popover = document.getElementById(popoverId);
	// const inputs = popover.querySelectorAll('input');
	// const newEntry = {};

	// inputs.forEach(input => {
	// 	newEntry[input.name] = input.type === 'number' ? parseInt(input.value, 10) : input.value;
	// });

	const data = dataEntryInstance.data[key];
	// const schema = dataEntry.schema;
	console.log(data);

	// if (!data[key]) data[key] = [];
	// data[key].push(newEntry);

	// const formContent = document.getElementById('form-content');
	// formContent.innerHTML = dataEntry.methods.all(data, schema, true);
}

/**
 * Merges the given attributes and additional attributes into a single object,
 * and returns a string representation of the merged attributes.
 *
 * @param {Array<Object>} attributes - The attributes to merge.
 * @param {Array<Object>} additional - Additional attributes to merge.
 * @returns {string} - The string representation of the merged attributes.
 */
export function attrs(attributes, additionalAttributes = [], path = '') {
	const merged = {};

	// Merge attributes and additionalAttributes into one object
	attributes.concat(additionalAttributes).forEach(attr => {
			Object.entries(attr).forEach(([key, value]) => {
					if (merged[key]) {
							merged[key] = `${merged[key]} ${value}`.trim();
					} else {
							merged[key] = value;
					}
			});
	});

	// If path is provided, set or replace the "name" attribute
	if (path) {
			merged['name'] = path;
	}

	// Convert merged object into a string of HTML attributes
	return Object.entries(merged)
			.map(([key, value]) => key === value ? `${key}` : `${key}="${value}"`)
			.join(' ');
}


/**
 * Binds utility events to elements with data-util attribute.
 * @param {HTMLElement} formContent - The form content element.
 * @param {Object} dataEntryInstance - The data entry instance object.
 */
export function bindUtilityEvents(formContent, dataEntryInstance) {
	const elements = formContent.querySelectorAll('[data-util]');
	elements.forEach(element => {
		const utilFunction = element.dataset.util;
		const params = element.dataset.params ? JSON.parse(element.dataset.params) : {};
		if (dataEntryInstance.utils[utilFunction]) {
			element.addEventListener('click', () => {
				dataEntryInstance.utils[utilFunction](dataEntryInstance, ...Object.values(params));
			});
		}
	});
}

/**
 * Generates a random UUID.
 * @returns {number} The generated UUID.
 */
export function uuid() {
	return crypto.getRandomValues(new Uint32Array(1))[0] || Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}