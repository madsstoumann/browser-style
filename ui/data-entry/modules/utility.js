export function addArrayEntry(element, dataEntry, path) {
	const form = element.form;
	const formElements = Array.from(form.elements).filter(el => el.name.startsWith(`${path}.`));
	const newObject = {};

	formElements.forEach(el => {
		const fieldPath = el.name.slice(path.length + 1);
		const dataType = el.dataset.type || 'string';
		newObject[fieldPath] = convertValue(el.value, dataType, el.type, el.checked);
	});

	const array = getObjectByPath(dataEntry.instance.data, path);

	if (Array.isArray(array)) {
		array.push(newObject);

		const fieldset = dataEntry.form.querySelector(`fieldset[name="${path}-entry"]`);
		const schema = getObjectByPath(dataEntry.instance.schema, `properties.${path}`);

		if (fieldset && schema) {
			const newDetail = dataEntry.instance.methods.detail({
				value: newObject,
				config: schema,
				path: `${path}[${array.length - 1}]`,
				instance: dataEntry.instance,
				attributes: []
			});

			fieldset.insertAdjacentHTML('beforeend', newDetail);
			form.reset();
			console.log(dataEntry.instance.data);
		} else {
			console.error(`Fieldset with path "${path}" not found in the form.`);
		}
	} else {
		console.error(`Path "${path}" does not reference an array in the data.`);
	}
}

export function removeArrayEntry(element, dataEntry, path) {
	const obj = getObjectByPath(dataEntry.instance.data, path);

	if (obj) {
		if (element.checked === false) {
			obj._remove = true;
		} else {
			delete obj._remove;
		}
	} else {
			console.error(`No object found at path: ${path}`);
	}
}

/* Attrs */
export function attrs(attributes, additionalAttributes = [], path = '') {
	const merged = {};
	attributes.concat(additionalAttributes).forEach(attr => {
		Object.entries(attr).forEach(([key, value]) => {
			if (merged[key]) {
				merged[key] = `${merged[key]} ${value}`.trim();
			} else {
				merged[key] = value;
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

/* Bind Utility Events */
export function bindUtilityEvents(formContent, dataEntry) {
	const elements = formContent.querySelectorAll('[data-util]');
	elements.forEach(element => {
		const utilFunction = element.dataset.util;
		const params = element.dataset.params ? JSON.parse(element.dataset.params) : {};
		if (dataEntry.instance.utils[utilFunction]) {
			element.addEventListener('click', () => {
				dataEntry.instance.utils[utilFunction](element, dataEntry, ...Object.values(params));
			});
		}
	});
}

/* Convert Value */
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
			return value; // Default to string if no specific type is provided
	}
}

/*  */
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

/*  */
export function isEmpty(obj) {
	return obj && Object.keys(obj).length === 0;
}

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

export function uuid() {
	return crypto.getRandomValues(new Uint32Array(1))[0] || Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}