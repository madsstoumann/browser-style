import { dynamicFunctions } from "./dynamic.js";

/* === attrs === */
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

/* === buttonAttrs === */
export function buttonAttrs(entry) {
	const commonAttributes = Object.keys(entry)
		.filter(key => key !== 'label' && key !== 'class')
		.map(key => `data-${key}="${entry[key]}"`)
		.join(' ');
	
	const classAttribute = entry.class ? ` class="${entry.class}"` : '';
	return `${commonAttributes}${classAttribute}`;
}

/* === convertValue === */
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

/* === deepMerge === */
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

/* === fetchOptions === */
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

/* === getKey === */
export function getKey(item, key) {
	if (key === null) {
		return JSON.stringify(item);
	} else if (Array.isArray(key)) {
		return key.map(k => item[k]).join('_');
	}
	return item[key];
}

/* === getObjectByPath === */
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

/* === getValueWithFallback === */
export function getValueWithFallback(data, key, config) {
	const mainValue = data[key];
	if (mainValue !== undefined) {
		return mainValue;
	}
	const fallbackData = config?.render?.data;
	return fallbackData?.[key];
}

/* === isEmpty === */
export function isEmpty(obj) {
	if (obj === null || obj === undefined) {
		return true;
	}

	return typeof obj === 'object' && Object.keys(obj).length === 0;
}

/* === isObject === */
export function isObject(item) {
	return item && typeof item === 'object' && !Array.isArray(item);
}

/* === itemExists === */
export function itemExists(array, newItem, properties) {
  return array.some(item => 
    properties.every(prop => 
      item[prop] !== undefined && 
      newItem[prop] !== undefined && 
      item[prop] === newItem[prop]
    )
  );
}

/* === mapObject === */
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

/* === processAttributes === */
export function processAttributes(attributes, data, instance) {
  try {
    return attributes.map(attr => {
      const processed = {};
      Object.entries(attr).forEach(([key, value]) => {
        processed[key] = resolveTemplateString(value, data, instance.lang, instance.i18n, instance.constants);
      });
      return processed;
    });
  } catch (error) {
    console.warn('Error processing attributes:', error);
    return attributes;
  }
}

/* === processConfigValue === */
function processConfigValue(value, data, instance) {
  if (typeof value === 'string') {
    return resolveTemplateString(value, data, instance.lang, instance.i18n, instance.constants);
  } 
  if (Array.isArray(value)) {
    return value.map(item => 
      typeof item === 'string' ? resolveTemplateString(item, data, instance.lang, instance.i18n, instance.constants) : item
    );
  }
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value).reduce((acc, [k, v]) => {
      acc[k] = typeof v === 'string' ? resolveTemplateString(v, data, instance.lang, instance.i18n, instance.constants) : v;
      return acc;
    }, {});
  }
  return value;
}

/* === processRenderConfig === */
export function processRenderConfig(config, data, instance) {
  if (!config?.render) return config;

  try {
    const processed = { ...config };
    Object.entries(config.render).forEach(([key, value]) => {
      processed.render[key] = processConfigValue(value, data, instance);
    });
    return processed;
  } catch (error) {
    console.warn('Error processing render config:', error);
    return config;
  }
}

/* === resolveTemplateString === */
export function resolveTemplateString(template, data, lang = 'en', i18n = {}, constants = {}, fallback = '') {
  try {
    // Early returns for invalid or non-template strings
    if (!template) return '';
    if (typeof template !== 'string') return template;
    if (!template.includes('${')) return template;
    
    return template.replace(/\$\{([^}]+)\}/g, (_, key) => {
      const trimmedKey = key.trim();
      
      // Handle translation strings
      if (trimmedKey.startsWith('t:')) {
        return t(trimmedKey.slice(2).trim(), lang, i18n) || '';
      }
      
      // Handle constants/variables
      if (trimmedKey.startsWith('v:')) {
        const value = constants[trimmedKey.slice(2).trim()];
        return value !== undefined ? value : '';
      }
      
      // Handle dynamic functions
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
  } catch (error) {
    console.warn('Template resolution failed:', error);
    return fallback || template;
  }
}

/* === safeRender === */
export function safeRender(renderMethod, params) {
	try {
		return renderMethod(params);
	} catch {
		return '';
	}
}

/* === setObjectByPath === */
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

/* === t === */
export function t(key, lang, i18n) {
	return i18n[lang]?.[key] || key;
}

/* === toCamelCase === */
export function toCamelCase(str) {
	return str
		.toLowerCase()
		.split('-')
		.map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
		.join('');
}

/* === toPascalCase === */
export function toPascalCase(str) {
	return str
		.split('-')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join('');
}

/* === uuid === */
export function uuid() {
	return crypto.getRandomValues(new Uint32Array(1))[0] || Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}