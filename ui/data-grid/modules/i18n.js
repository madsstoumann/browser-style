import { consoleLog } from './utils.js';

/**
 * Parses a string into a JSON object and validates its structure.
 * @param {string} str - The JSON string to parse.
 * @param {Object} defaultLang - The default language object to fall back on.
 * @returns {Object} The parsed JSON object or the default language object if parsing fails.
 */
export function i18n(str, defaultLang) {
	try {
		const json = JSON.parse(str);
		if (typeof json === 'object') return json;
		throw new Error('Invalid JSON format');
	} catch (error) {
		consoleLog(`Error parsing JSON: ${error}`, '#F00');
		return defaultLang;
	}
}

/**
 * Translates a key into the corresponding localized string.
 * @param {Object} options - The options object containing localization settings.
 * @param {string} key - The key to be translated.
 * @returns {string} The translated string or a placeholder if the key is not found.
 */
export function baseTranslate(key, locale, obj) {
	try {
		const translation = obj[locale][key];
		return translation || `[${key}]`;
	} catch (error) {
		consoleLog(`Error translating key: ${error}`, '#F00');
		return `[${key}]`; // Return placeholder if an error occurs
	}
}
