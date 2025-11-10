/**
 * Configuration utility functions for CSP Manager
 * Handles loading, merging, and validating custom configurations
 */

/**
 * Deep merge two objects, with source overriding target
 * @param {Object} target - Base object
 * @param {Object} source - Object to merge in (takes precedence)
 * @returns {Object} Merged object
 */
export function deepMerge(target, source) {
	const result = { ...target };

	for (const key in source) {
		if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
			result[key] = deepMerge(result[key] || {}, source[key]);
		} else {
			result[key] = source[key];
		}
	}

	return result;
}

/**
 * Load configuration from attribute value
 * Supports both inline JSON strings and URLs
 * @param {string} attrValue - Attribute value (JSON string or URL)
 * @returns {Promise<Object|null>} Parsed configuration or null
 */
export async function loadConfigFromAttribute(attrValue) {
	if (!attrValue || !attrValue.trim()) {
		return null;
	}

	const trimmed = attrValue.trim();

	// Check if it's a URL (starts with ./ or / or http)
	if (trimmed.startsWith('./') || trimmed.startsWith('/') || trimmed.startsWith('http')) {
		try {
			const response = await fetch(trimmed);
			if (!response.ok) {
				console.warn(`Failed to fetch config from ${trimmed}:`, response.statusText);
				return null;
			}
			return await response.json();
		} catch (error) {
			console.error(`Error loading config from ${trimmed}:`, error);
			return null;
		}
	}

	// Try to parse as inline JSON
	try {
		return JSON.parse(trimmed);
	} catch (error) {
		console.error('Error parsing inline JSON config:', error);
		return null;
	}
}

/**
 * Validate directives configuration structure
 * @param {Object} config - Directives config to validate
 * @returns {boolean} True if valid
 */
export function validateDirectivesConfig(config) {
	if (!config || typeof config !== 'object') {
		return false;
	}

	for (const [key, value] of Object.entries(config)) {
		// Each directive must be an object
		if (!value || typeof value !== 'object') {
			console.warn(`Invalid directive config for "${key}": must be an object`);
			return false;
		}

		// Must have a type
		if (!value.type || typeof value.type !== 'string') {
			console.warn(`Invalid directive config for "${key}": missing or invalid type`);
			return false;
		}

		// Defaults must be an array if present
		if (value.defaults !== undefined && !Array.isArray(value.defaults)) {
			console.warn(`Invalid directive config for "${key}": defaults must be an array`);
			return false;
		}

		// Tokens must be an array if present
		if (value.tokens !== undefined && !Array.isArray(value.tokens)) {
			console.warn(`Invalid directive config for "${key}": tokens must be an array`);
			return false;
		}
	}

	return true;
}

/**
 * Validate i18n configuration structure
 * @param {Object} config - i18n config to validate
 * @returns {boolean} True if valid
 */
export function validateI18nConfig(config) {
	if (!config || typeof config !== 'object') {
		return false;
	}

	// Check that each language is an object
	for (const [lang, data] of Object.entries(config)) {
		if (!data || typeof data !== 'object') {
			console.warn(`Invalid i18n config for language "${lang}": must be an object`);
			return false;
		}
	}

	return true;
}

/**
 * Validate evaluation rules configuration structure
 * @param {Object} config - Rules config to validate
 * @returns {boolean} True if valid
 */
export function validateRulesConfig(config) {
	if (!config || typeof config !== 'object') {
		return false;
	}

	// Basic structure validation - just check it's an object
	// More detailed validation could be added here
	return true;
}

/**
 * Load and merge all configurations
 * @param {Object} defaults - Default configurations
 * @param {HTMLElement} element - The custom element
 * @returns {Promise<Object>} Merged configurations
 */
export async function loadAndMergeConfigs(defaults, element) {
	const { cspDirectives, i18nData } = defaults;

	// Load custom configs from attributes
	const customDirectives = await loadConfigFromAttribute(element.getAttribute('directives'));
	const customI18n = await loadConfigFromAttribute(element.getAttribute('i18n'));
	const customRules = await loadConfigFromAttribute(element.getAttribute('rules'));

	// Merge directives
	let mergedDirectives = cspDirectives;
	if (customDirectives) {
		if (validateDirectivesConfig(customDirectives)) {
			mergedDirectives = deepMerge(cspDirectives, customDirectives);
		} else {
			console.warn('Invalid directives config, using defaults');
		}
	}

	// Merge i18n
	let mergedI18n = i18nData;
	if (customI18n) {
		if (validateI18nConfig(customI18n)) {
			mergedI18n = deepMerge(i18nData, customI18n);
		} else {
			console.warn('Invalid i18n config, using defaults');
		}
	}

	// Custom rules (will be validated in evaluate.js)
	let mergedRules = null;
	if (customRules) {
		if (validateRulesConfig(customRules)) {
			mergedRules = customRules;
		} else {
			console.warn('Invalid rules config, ignoring');
		}
	}

	return {
		directives: mergedDirectives,
		i18n: mergedI18n,
		rules: mergedRules
	};
}
