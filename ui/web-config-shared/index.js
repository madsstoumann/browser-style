let _sharedStylesheetPromise;

export async function adoptSharedStyles(shadowRoot) {
	if (!_sharedStylesheetPromise) {
		_sharedStylesheetPromise = (async () => {
			const sharedCss = await fetch(new URL('./index.css', import.meta.url)).then(r => r.text());
			const sheet = new CSSStyleSheet();
			await sheet.replace(sharedCss);
			return sheet;
		})();
	}

	const sharedSheet = await _sharedStylesheetPromise;
	shadowRoot.adoptedStyleSheets = [sharedSheet];
}

export function createTranslator(i18nData, getLang, fallbackLang = 'en') {
	const lookup = (lang, key) => {
		let value = i18nData?.[lang];
		for (const part of String(key).split('.')) value = value?.[part];
		return typeof value === 'string' ? value : undefined;
	};

	return function t(key) {
		const lang = (typeof getLang === 'function' ? getLang() : getLang) || fallbackLang;
		return lookup(lang, key) ?? lookup(fallbackLang, key) ?? key;
	};
}

/**
 * Updates `instance.state` with `partialState` and returns an array of changed keys.
 */
export function setState(instance, partialState, { equals = Object.is, equalsByKey } = {}) {
	if (!instance || typeof instance !== 'object') return [];
	if (!partialState || typeof partialState !== 'object') return [];
	instance.state ??= {};

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

function getDetailsKey(detailsEl) {
	return detailsEl?.dataset?.panel
		|| detailsEl?.dataset?.directive
		|| detailsEl?.dataset?.section
		|| detailsEl?.id
		|| null;
}

/**
 * Captures the currently open <details> panels so a full re-render can restore them.
 *
 * Intended for accordions that use the `name` attribute for grouping.
 */
export function captureOpenDetailsState(shadowRoot) {
	if (!shadowRoot) return [];
	const open = [];
	shadowRoot.querySelectorAll('details[open]').forEach(detailsEl => {
		const group = detailsEl.getAttribute('name');
		const key = getDetailsKey(detailsEl);
		if (!group || !key) return;
		open.push({ group, key });
	});
	return open;
}

/**
 * Restores open <details> panels captured by `captureOpenDetailsState`.
 */
export function restoreOpenDetailsState(shadowRoot, openState) {
	if (!shadowRoot || !Array.isArray(openState) || openState.length === 0) return;

	const openTokens = new Set(openState.map(({ group, key }) => `${group}::${key}`));
	const groups = new Set(openState.map(({ group }) => group));

	shadowRoot.querySelectorAll('details').forEach(detailsEl => {
		const group = detailsEl.getAttribute('name');
		if (!group || !groups.has(group)) return;
		const key = getDetailsKey(detailsEl);
		if (!key) return;
		const token = `${group}::${key}`;
		if (openTokens.has(token)) detailsEl.setAttribute('open', '');
		else detailsEl.removeAttribute('open');
	});
}
