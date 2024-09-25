import { dynamicFunctions } from "./dynamic.js";

/**
 * Merges and filters attributes, then converts them into a string of HTML attributes.
 *
 * @param {Array<Object>} attributes - The initial set of attributes.
 * @param {string} [path=''] - An optional path to set as the name attribute.
 * @param {Array<Object>} [additionalAttributes=[]] - Additional attributes to merge.
 * @param {Array<string>} [attributesToRemove=[]] - List of attribute keys to remove.
 * @param {Array<string>} [attributesToInclude=[]] - List of attribute keys to include.
 * @returns {string} A string of HTML attributes.
 */
export function attrs(
	attributes, 
	path = '', 
	additionalAttributes = [], 
	attributesToRemove = [], 
	attributesToInclude = []
) {
	const merged = {};

	// Merge all attributes, respecting attributesToRemove and attributesToInclude
	attributes.concat(additionalAttributes).forEach(attr => {
		Object.entries(attr).forEach(([key, value]) => {
			// Include the attribute if it's in the include list (if provided) and not in the remove list
			const shouldInclude = 
				(attributesToInclude.length === 0 || attributesToInclude.includes(key)) &&
				!attributesToRemove.includes(key);

			if (shouldInclude) {
				if (merged[key]) {
					merged[key] = `${merged[key]} ${value}`.trim();
				} else {
					merged[key] = value;
				}
			}
		});
	});

	// If a path is provided, set the name attribute to it
	if (path) {
		merged['name'] = path;
	}

	// Convert the merged attributes object into a string of HTML attributes
	return Object.entries(merged)
		.map(([key, value]) => {
			// Handle the case where the key and value are both "name"
			if (key === 'name' && value === 'name') {
				return `${key}="${value}"`;
			}
			return key === value ? `${key}` : `${key}="${value}"`;
		}).join(' ');
}

/**
 * Converts a given value to a specified data type.
 *
 * @param {any} value - The value to be converted.
 * @param {string} dataType - The target data type ('number', 'boolean', 'object', etc.).
 * @param {string} inputType - The type of input element (e.g., 'checkbox').
 * @param {boolean} checked - The checked state of a checkbox input.
 * @returns {any} - The converted value.
 */
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

/**
 * Deeply merges two objects or arrays. If both target and source are arrays,
 * they are merged based on a unique identifier (key). If both are objects,
 * they are merged recursively.
 *
 * @param {Object|Array} target - The target object or array to merge into.
 * @param {Object|Array} source - The source object or array to merge from.
 * @param {string|null} [key=null] - The unique identifier key for merging arrays.
 * @returns {Object|Array} - The merged object or array.
 */
export function deepMerge(target, source, key = null) {
	if (Array.isArray(target) && Array.isArray(source)) {
		// If both are arrays, merge them based on a unique identifier (key)
		const mergedArray = new Map(target.map(item => [getKey(item, key), item]));
		source.forEach(item => {
			const itemKey = getKey(item, key);
			if (mergedArray.has(itemKey)) {
				mergedArray.set(itemKey, deepMerge(mergedArray.get(itemKey), item, key));
			} else {
				mergedArray.set(itemKey, item);
			}
		});
		return Array.from(mergedArray.values());
	} else if (isObject(target) && isObject(source)) {
		// If both are objects, merge them recursively
		const result = { ...target };
		for (const key in source) {
			if (isObject(source[key]) && key in target) {
				result[key] = deepMerge(target[key], source[key], key);
			} else {
				result[key] = source[key];
			}
		}
		return result;
	}
	return source;
}

/**
 * Fetches options based on the provided configuration and instance.
 *
 * @param {Object} config - The configuration object.
 * @param {Object} config.render - The render configuration.
 * @param {Array|string} config.render.options - The options key, which can be an array or a string.
 * @param {Object} instance - The instance object.
 * @param {Object} instance.lookup - The lookup object containing arrays of options.
 * @returns {Array} The fetched options array.
 */
export function fetchOptions(config, instance) {
	const optionsKey = config?.render?.options;
	let options = [];

	if (Array.isArray(optionsKey)) {
		options = optionsKey;
	} else if (typeof optionsKey === 'string') {
		if (instance.lookup && Array.isArray(instance.lookup[optionsKey])) {
			options = instance.lookup[optionsKey];
		} else {
			const storedOptions = localStorage.getItem(optionsKey);
			if (storedOptions) {
				try {
					options = JSON.parse(storedOptions) || [];
				} catch {
					options = [];
				}
			}
		}
	}
	return options;
}

/**
 * Retrieves the value from an object based on a given dot-separated path.
 *
 * @param {Object} obj - The object from which to retrieve the value.
 * @param {string} path - The dot-separated path string (e.g., 'a.b.c' or 'a.b[0].c').
 * @returns {*} - The value found at the specified path, or undefined if the path is invalid.
 */
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

/**
 * Checks if the given object is empty.
 *
 * An object is considered empty if it is null, undefined, or an object with no own properties.
 *
 * @param {Object|null|undefined} obj - The object to check.
 * @returns {boolean} - Returns true if the object is empty, otherwise false.
 */
export function isEmpty(obj) {
	if (obj === null || obj === undefined) {
		return true;
	}

	return typeof obj === 'object' && Object.keys(obj).length === 0;
}

/**
 * Resolves a template string by replacing placeholders with corresponding values from the data object.
 * If a placeholder starts with 't:', it will be treated as a translation key.
 * If a placeholder starts with 'd:', it will call a dynamic function from the dynamicFunctions object.
 *
 * @param {string} template - The template string containing placeholders in the format ${key}.
 * @param {Object} data - The data object containing values to replace the placeholders.
 * @param {string} [lang='en'] - The language code for translation (default is 'en').
 * @param {Object} [i18n={}] - The i18n object containing translations.
 * @returns {string} - The resolved string with placeholders replaced by corresponding values or dynamic function results.
 */
export function resolveTemplateString(template, data, lang = 'en', i18n = {}) {
	return template.replace(/\$\{([^}]+)\}/g, (_, key) => {
		if (key.startsWith('t:')) {
			// Translation
			const translationKey = key.slice(2).trim();
			return t(translationKey, lang, i18n) || '';
		}
		if (key.startsWith('d:')) {
			// Dynamic function with optional parameters
			const [functionName, ...params] = key.slice(2).trim().split(/\s+/);
			
			if (dynamicFunctions[functionName]) {
				// Resolve params either as direct values or lookups in the data object
				const parsedParams = params.map(param => {
					// If the param is wrapped in ${}, treat it as a reference to data object
					if (param.startsWith('${') && param.endsWith('}')) {
						const dataKey = param.slice(2, -1);
						return getObjectByPath(data, dataKey);
					}
					// Attempt to look up the parameter directly in the data object
					const directLookup = getObjectByPath(data, param);
					return directLookup !== undefined ? directLookup : param;  // Return lookup or static value
				});
				// Call the dynamic function with the resolved parameters
				return dynamicFunctions[functionName](...parsedParams);
			}
		}
		// If no dynamic function or translation, use object data
		return getObjectByPath(data, key.trim()) || '';
	});
}

/**
 * Safely executes a render method with the given parameters.
 * If an error occurs during the execution, it returns an empty string.
 *
 * @param {Function} renderMethod - The render method to be executed.
 * @param {any} params - The parameters to be passed to the render method.
 * @returns {string} The result of the render method or an empty string if an error occurs.
 */
export function safeRender(renderMethod, params) {
	try {
		return renderMethod(params);
	} catch {
		return '';
	}
}

/**
 * Sets a value on an object at a specified path.
 *
 * @param {Object} obj - The object to modify.
 * @param {string} path - The path at which to set the value, with properties separated by dots.
 * @param {*} value - The value to set at the specified path.
 */
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

/**
 * Translates a given key into the specified language using the provided i18n object.
 *
 * @param {string} key - The key to be translated.
 * @param {string} lang - The language code to translate the key into.
 * @param {object} i18n - The i18n object containing translations.
 * @returns {string} - The translated string or the key if no translation is found.
 */
export function t(key, lang, i18n) {
	return i18n[lang]?.[key] || key;
}

/**
 * Converts a hyphenated string to camelCase.
 *
 * @param {string} str - The hyphenated string to convert.
 * @returns {string} The camelCase version of the input string.
 */
export function toCamelCase(str) {
	return str
		.toLowerCase()
		.split('-')
		.map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
		.join('');
}

/**
 * Converts a kebab-case string to PascalCase.
 *
 * @param {string} str - The kebab-case string to convert.
 * @returns {string} The converted PascalCase string.
 */
export function toPascalCase(str) {
	return str
		.split('-')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join('');
}

/**
 * Generates a unique identifier (UUID).
 *
 * This function uses the `crypto.getRandomValues` method to generate a random
 * 32-bit unsigned integer. If the generated value is zero, it falls back to
 * generating a random number using `Math.random` multiplied by `Number.MAX_SAFE_INTEGER`.
 *
 * @returns {number} A unique identifier as a 32-bit unsigned integer.
 */
export function uuid() {
	return crypto.getRandomValues(new Uint32Array(1))[0] || Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}

/* === Helper functions */

function getKey(item, key) {
	if (key === null) {
		// If no key is provided, use the stringified item as a fallback unique key
		return JSON.stringify(item);
	} else if (Array.isArray(key)) {
		// If key is an array of fields, combine them into a composite key
		return key.map(k => item[k]).join('_');
	}
	return item[key];
}

function isObject(item) {
	return item && typeof item === 'object' && !Array.isArray(item);
}