/* Merges HTML attributes, optionally removing specified attributes. */
export function attrs(attributes, path = '', additionalAttributes = [], attributesToRemove = []) {
	const merged = {};
	attributes.concat(additionalAttributes).forEach(attr => {
		Object.entries(attr).forEach(([key, value]) => {
			if (!attributesToRemove.includes(key)) {
				if (merged[key]) {
					merged[key] = `${merged[key]} ${value}`.trim();
				} else {
					merged[key] = value;
				}
			}
		});
	});

	if (path) {
		merged['name'] = path;
	}

	return Object.entries(merged)
		.map(([key, value]) => {
			// Handle the case where key and value are both "name"
			if (key === 'name' && value === 'name') {
			return `${key}="${value}"`;
			}
		return key === value ? `${key}` : `${key}="${value}"`;
	}).join(' ');
}

/* Binds utility event listeners to elements based on data-util attributes. */	
export function bindUtilityEvents(elementContainer, componentInstance) {
	const elements = elementContainer.querySelectorAll('[data-util]');
	elements.forEach(element => {
		const utilFunction = element.dataset.util;
		const params = element.dataset.params ? JSON.parse(element.dataset.params) : {};

		if (componentInstance.utils && componentInstance.utils[utilFunction]) {
			element.addEventListener('click', () => {
					componentInstance.utils[utilFunction](element, componentInstance, ...Object.values(params));
			});
		}
		else if (typeof componentInstance[utilFunction] === 'function') {
			element.addEventListener('click', () => {
				componentInstance[utilFunction](element, ...Object.values(params));
			});
		}
	});
}

/* Converts a value to the specified data type. */
export function convertValue(value, dataType, inputType, checked) {
	switch (dataType) {
		case 'number':
			return Number(value);
		case 'boolean':
			if (inputType === 'checkbox') {
				return checked;
			}
			return value === 'true' || value === true;
		case 'object':
			try {
				return JSON.parse(value);
			} catch {
				return value;
			}
		default:
			return value;
	}
}

/* Retrieves a nested object or value based on a dot-notated path. */
export function getObjectByPath(obj, path) {
	return path.split('.').reduce((acc, key) => {
		if (acc === null || acc === undefined) {
			return undefined;
		}

		const match = key.match(/([^\[]+)\[?(\d*)\]?/);
		const prop = match[1];
		const idx = match[2];

		if (idx === '') {
			return acc[prop];
		}

		if (idx !== undefined) {
			return acc[prop] && Array.isArray(acc[prop]) ? acc[prop][idx] : undefined;
		}

		return acc[prop];
	}, obj);
}

/* Checks if an object is empty (has no properties). */
export function isEmpty(obj) {
	return obj && Object.keys(obj).length === 0;
}

/* Sets a value in an object based on a dot-notated path. */
export function setObjectByPath(obj, path, value) {
	path.split('.').reduce((acc, key, index, array) => {
		const match = key.match(/([^\[]+)\[?(\d*)\]?/);
		const prop = match[1];
		const idx = match[2];

		if (!acc[prop]) {
			acc[prop] = idx ? [] : {};
		}

		if (idx) {
			if (index === array.length - 1) {
				acc[prop][idx] = value;
			} else {
				acc[prop][idx] = acc[prop][idx] || {};
			}
			return acc[prop][idx];
		}

		if (index === array.length - 1) {
			acc[prop] = value;
		}

		return acc[prop];
	}, obj);
}

/* Converts a string to camelCase. */
export function toCamelCase(str) {
	return str
		.toLowerCase()
		.split('-')
		.map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
		.join('');
}


/* Converts a string to PascalCase. */
export function toPascalCase(str) {
	return str
		.split('-')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join('');
}

/* Generates a unique identifier (UUID). */
export function uuid() {
	return crypto.getRandomValues(new Uint32Array(1))[0] || Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}
