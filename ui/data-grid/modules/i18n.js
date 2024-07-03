import { consoleLog } from './utils.js';

export function baseTranslate(key, locale, obj) {
	try {
		const translation = obj[locale]?.[key];
		return translation || `[${key}]`;
	} catch (error) {
		consoleLog(`Error translating key: ${error.message}`, '#F00');
		return `[${key}]`;
	}
}

export function i18n(str, defaultLang) {
	try {
		const json = JSON.parse(str);
		if (typeof json === 'object') {
			return json;
		}
		throw new Error('Invalid JSON format');
	} catch (error) {
		consoleLog(`Error parsing JSON: ${error.message}`, '#F00');
		return defaultLang;
	}
}
