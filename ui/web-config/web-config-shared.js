let _sharedStylesheetPromise;

export async function adoptSharedStyles(shadowRoot) {
	if (!_sharedStylesheetPromise) {
		_sharedStylesheetPromise = (async () => {
			const sharedCss = await fetch(new URL('./web-config-shared.css', import.meta.url)).then(r => r.text());
			const sheet = new CSSStyleSheet();
			await sheet.replace(sharedCss);
			return sheet;
		})();
	}

	const sharedSheet = await _sharedStylesheetPromise;
	shadowRoot.adoptedStyleSheets = [sharedSheet];
}

export function createTranslator(i18nData, getLang, fallbackLang = 'en') {
	return function t(key) {
		const lang = (typeof getLang === 'function' ? getLang() : getLang) || fallbackLang;
		const keys = String(key).split('.');
		let value = i18nData?.[lang];
		for (const k of keys) value = value?.[k];
		if (typeof value === 'string') return value;

		// fallback language
		value = i18nData?.[fallbackLang];
		for (const k of keys) value = value?.[k];
		return typeof value === 'string' ? value : key;
	};
}

export function jsonEqual(a, b) {
	if (a === b) return true;
	try {
		return JSON.stringify(a) === JSON.stringify(b);
	} catch {
		return false;
	}
}

/**
 * Updates `instance.state` with `partialState` and returns an array of changed keys.
 */
export function setState(instance, partialState, { equals = Object.is, equalsByKey } = {}) {
	if (!instance || typeof instance !== 'object') return [];
	if (!partialState || typeof partialState !== 'object') return [];
	if (!instance.state || typeof instance.state !== 'object') instance.state = {};

	const changedKeys = [];
	for (const [key, nextValue] of Object.entries(partialState)) {
		const prevValue = instance.state[key];
		const eq = equalsByKey?.[key] ?? equals;
		if (!eq(prevValue, nextValue)) {
			instance.state[key] = nextValue;
			changedKeys.push(key);
		}
	}
	return changedKeys;
}
