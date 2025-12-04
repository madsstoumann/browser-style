/**
 * Configuration utility functions for CSP Manager
 * Handles loading, merging, and validating custom configurations
 */

/**
 * Merges configurations from attributes and returns a final config object.
 * @param {Object} defaults - Default configurations.
 * @param {HTMLElement} element - The custom element instance.
 * @returns {Promise<Object>} Merged configurations.
 */
export async function loadAndMergeConfigs(defaults, element) {
	const { cspDirectives, i18nData } = defaults;

	// Helper to load config from an attribute (URL or inline JSON)
	const loadConfig = async (attrName) => {
		const attrValue = element.getAttribute(attrName);
		if (!attrValue?.trim()) return null;

		const trimmed = attrValue.trim();
		if (trimmed.startsWith('./') || trimmed.startsWith('/') || trimmed.startsWith('http')) {
			try {
				const response = await fetch(trimmed);
				if (!response.ok) {
					console.warn(`Failed to fetch config from ${trimmed}: ${response.statusText}`);
					return null;
				}
				return await response.json();
			} catch (error) {
				console.error(`Error loading config from ${trimmed}:`, error);
				return null;
			}
		}
		try {
			return JSON.parse(trimmed);
		} catch (error) {
			console.error(`Error parsing inline JSON for ${attrName}:`, error);
			return null;
		}
	};

	const customDirectives = await loadConfig('directives');
	const customI18n = await loadConfig('i18n');
	const customRules = await loadConfig('rules');

	// Merge directives: simple object spread is sufficient
	const mergedDirectives = customDirectives && typeof customDirectives === 'object'
		? { ...cspDirectives, ...customDirectives }
		: cspDirectives;

	// Merge i18n: deep merge for nested language objects
	const mergedI18n = { ...i18nData };
	if (customI18n && typeof customI18n === 'object') {
		for (const lang in customI18n) {
			if (typeof customI18n[lang] === 'object') {
				mergedI18n[lang] = { ...(i18nData[lang] || {}), ...customI18n[lang] };
				// Ensure nested objects are also merged
				if (customI18n[lang].directives) {
					mergedI18n[lang].directives = { ...(i18nData[lang]?.directives || {}), ...customI18n[lang].directives };
				}
				if (customI18n[lang].ui) {
					mergedI18n[lang].ui = { ...(i18nData[lang]?.ui || {}), ...customI18n[lang].ui };
				}
				if (customI18n[lang].eval) {
					mergedI18n[lang].eval = { ...(i18nData[lang]?.eval || {}), ...customI18n[lang].eval };
				}
			}
		}
	}

	return {
		directives: mergedDirectives,
		i18n: mergedI18n,
		rules: customRules && typeof customRules === 'object' ? customRules : null,
	};
}

