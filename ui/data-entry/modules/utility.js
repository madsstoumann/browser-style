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
		// First check instance.lookup
		if (instance.lookup && Array.isArray(instance.lookup[optionsKey])) {
			options = instance.lookup[optionsKey];
		} 
		// Then check instance.data
		else if (instance.data && getObjectByPath(instance.data, optionsKey)) {
			const dataOptions = getObjectByPath(instance.data, optionsKey);
			// Handle both array and single object cases
			if (Array.isArray(dataOptions)) {
				options = dataOptions;
			} else if (typeof dataOptions === 'object') {
				// Convert single object to array with one item
				options = [dataOptions];
			}
		}
		// Finally check localStorage
		else {
			const storedOptions = localStorage.getItem(optionsKey);
			if (storedOptions) {
				try {
					const parsed = JSON.parse(storedOptions);
					options = Array.isArray(parsed) ? parsed : [parsed];
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
export function resolveTemplateString(template, data, lang = 'en', i18n = {}, constants = {}) {
	// Add null check for template
	if (!template) return '';
	
	return template.replace(/\$\{([^}]+)\}/g, (_, key) => {
		const trimmedKey = key.trim();
		
		if (trimmedKey.startsWith('t:')) {
			return t(trimmedKey.slice(2).trim(), lang, i18n) || '';
		}
		
		if (trimmedKey.startsWith('v:')) {
			const value = constants[trimmedKey.slice(2).trim()];
			return value !== undefined ? value : '';
		}
		
		if (trimmedKey.startsWith('d:')) {
			const parts = trimmedKey.slice(2).trim().split(/\s+/);
			const fn = dynamicFunctions[parts[0]];
			
			if (fn) {
				const params = parts.slice(1).map(param => 
					param.startsWith('${') && param.endsWith('}')
						? getObjectByPath(data, param.slice(2, -1))
						: getObjectByPath(data, param) ?? param
				);
				return fn(...params);
			}
		}

		return getObjectByPath(data, trimmedKey) || '';
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

/**
 * Creates HTML button attributes string with consistent data- prefix
 * @param {Object} entry - Button configuration object
 * @returns {string} Space-separated attribute string
 */
export function buttonAttrs(entry) {
	const commonAttributes = Object.keys(entry)
		.filter(key => key !== 'label' && key !== 'class')
		.map(key => `data-${key}="${entry[key]}"`)
		.join(' ');
	
	const classAttribute = entry.class ? ` class="${entry.class}"` : '';
	return `${commonAttributes}${classAttribute}`;
}

/**
 * Checks if an object with the same specified properties already exists in an array
 * @param {Array} array - Array to check
 * @param {Object} newItem - Item to check for
 * @param {Array} properties - Properties to compare
 * @returns {boolean} True if item exists
 */
export function itemExists(array, newItem, properties) {
  return array.some(item => 
    properties.every(prop => 
      item[prop] !== undefined && 
      newItem[prop] !== undefined && 
      item[prop] === newItem[prop]
    )
  );
}

/**
 * Maps values from a source object to a target object using a mapping configuration
 * @param {Object} sourceObj - The source object containing the values to map
 * @param {Object} mapping - The mapping configuration object
 * @param {string} [basePath=''] - Base path for nested properties
 * @returns {Object} - The mapped object with processed values
 */
export function mapObject(sourceObj, mapping, basePath = '') {
  const result = {};

  Object.entries(mapping).forEach(([field, config]) => {
    const fullPath = basePath ? `${basePath}.${field}` : field;
    let mappedValue;

    // Handle string mapping (direct path)
    if (typeof config === 'string') {
      mappedValue = getObjectByPath(sourceObj, config);
    } 
    // Handle object mapping configuration
    else if (typeof config === 'object') {
      if ('value' in config) {
        mappedValue = config.value;
      } else if ('path' in config) {
        // Handle template strings in path
        if (/\$\{.+?\}/.test(config.path)) {
          mappedValue = config.path.replace(/\$\{(.+?)\}/g, (_match, p1) => {
            const value = getObjectByPath(sourceObj, p1.trim());
            return value !== undefined ? value : '';
          });
        } else {
          mappedValue = getObjectByPath(sourceObj, config.path);
        }
      }

      // Apply type conversion if specified
      if (config.type) {
        try {
          switch (config.type) {
            case 'number':
              mappedValue = Number(mappedValue);
              break;
            case 'boolean':
              mappedValue = Boolean(mappedValue);
              break;
            case 'date':
              mappedValue = new Date(mappedValue).toISOString();
              break;
            case 'string':
            default:
              mappedValue = String(mappedValue);
          }
        } catch (error) {
          console.error(`Type conversion failed for ${field}:`, error);
        }
      }
    }

    setObjectByPath(result, fullPath, mappedValue);
  });

  return result;
}