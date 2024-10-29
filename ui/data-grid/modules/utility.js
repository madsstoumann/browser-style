/**
 * Adds multiple event listeners to a specified element.
 *
 * @param {HTMLElement} element - The DOM element to which the event listeners will be added.
 * @param {string[]} events - An array of event names to listen for.
 * @param {Function} handler - The function to handle the events.
 */
export function addEventListeners(element, events, handler) {
	events.forEach(event => element.addEventListener(event, handler));
}

/**
 * Calculates the number of pages needed to display a given number of items.
 *
 * @param {number} items - The total number of items.
 * @param {number} itemsPerPage - The number of items to display per page.
 * @returns {number} The total number of pages.
 * @throws {Error} If itemsPerPage is less than or equal to 0.
 */
export function calculatePages(items, itemsPerPage) {
	if (itemsPerPage <= 0) {
		throw new Error('Invalid value: items per page should be greater than 0');
	}
	if (items === 0) return 0;
	return Math.ceil(items / itemsPerPage);
}

/**
 * Converts a string to camelCase.
 *
 * @param {string} str - The string to convert.
 * @returns {string} The camelCase version of the input string.
 */
export function camelCase(str) {
	if (!str) return ''; // Handles null, undefined, or empty strings
	return str
		.toLowerCase()
		.split(' ')
		.map((word, index) => index === 0 ? word : capitalize(word))
		.join('');
}

/**
 * Capitalizes the first letter of a string.
 *
 * @param {string} str - The string to capitalize.
 * @returns {string} The capitalized string.
 */
export function capitalize(str) {
	if (typeof str !== 'string' || !str.length) return str;
	return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Logs a message to the console with a specified background color if debug mode is enabled.
 *
 * @param {string} message - The message to log.
 * @param {string} [bg='#000'] - The background color for the log message.
 * @param {boolean} [debug=false] - Flag to enable or disable logging.
 */
export function consoleLog(message, bg = '#000', debug = false) {
	if (debug) {
		console.log(`%c${message}`, `background:${bg};color:#FFF;padding:0.5ch 1ch;`);
	}
}

/**
 * Retrieves an object from the state based on a composite key derived from the node's parent dataset.
 *
 * @param {Object} state - The state object containing thead and tbody arrays.
 * @param {Object} state.thead - Array of header cell objects, each containing a `uid` and `field` property.
 * @param {Object} state.tbody - Array of row objects to search through.
 * @param {HTMLElement} node - The DOM node whose parent's dataset contains the composite key.
 * @returns {Object|null} - The matched row object from tbody or null if no match is found.
 */
export function getObj(state, node) {
	try {
		const keyFields = state.thead.filter(cell => cell.key).map(cell => cell.field);
		// Verify `data-keys` exists, otherwise log a warning and return null
		const dataKeys = node.parentNode.dataset.keys;
		if (!dataKeys) {
			console.warn("No 'data-keys' attribute found on the provided node.");
			return null;
		}

		// Extract composite key from `data-keys` and split it into parts
		const keyParts = dataKeys.split(',');

		// Find the row that matches all parts of the composite key
		return state.tbody.find(row => 
			keyFields.every((field, index) => row[field] === keyParts[index])
		) || null;
	} catch (error) {
		console.error(`Error retrieving object data: ${error}`);
		return null;
	}
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
	if (!i18n || typeof i18n !== 'object') return key;
	return i18n[lang]?.[key] || key;
}
