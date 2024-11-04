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
 * Generates a key-value object based on the provided state and node.
 *
 * @param {Object} state - The state object containing the table header information.
 * @param {HTMLElement} node - The DOM node from which to extract data keys.
 * @returns {Object|null} The key-value object or null if an error occurs or data keys are not found.
 *
 * @throws Will log an error message if an exception occurs during the creation of the key-value object.
 */
export function getKeyValueObject(state, node) {
	try {
		const keyFields = state.thead.filter(cell => cell.key).map(cell => cell.field);
		const dataKeys = node.parentNode.dataset.keys;

		if (!dataKeys) {
			console.warn("No 'data-keys' attribute found on the provided node.");
			return null;
		}

		const keyParts = dataKeys.split(',').map(part => part.trim());

		// Build the key-value object
		const keyValueObject = keyFields.reduce((acc, field, index) => {
			acc[field] = isNaN(keyParts[index]) ? keyParts[index] : Number(keyParts[index]);
			return acc;
		}, {});

		return keyValueObject;
	} catch (error) {
		console.error(`Error creating key-value object: ${error}`);
		return null;
	}
}

/**
 * Retrieves an object from the state based on the composite key found in the node's data-keys attribute.
 *
 * @param {Object} state - The state object containing thead and tbody arrays.
 * @param {HTMLElement} node - The DOM node containing the data-keys attribute.
 * @param {boolean} [typeCheck=false] - Whether to perform type-aware comparison for key matching.
 * @returns {Object|null} The matched row data and its index, or null if no match is found.
 *
 * @throws Will log an error message to the console if an error occurs during execution.
 */
export function getObj(state, node, typeCheck = false) {
	try {
		const keyFields = state.thead
			.filter(cell => cell.key)
			.map(cell => ({ field: cell.field, type: cell.type || 'string' }));
		const dataKeys = node.parentNode.dataset.keys;

		if (!dataKeys) {
			console.warn("No 'data-keys' attribute found on the provided node.");
			return null;
		}

		const keyParts = dataKeys.split(',').map(part => part.trim());

		// Find the row index and data that match the composite key
		const rowIndex = state.tbody.findIndex(row => 
			keyFields.every((keyConfig, index) => {
				const { field, type } = keyConfig;
				const rowValue = row[field];
				const keyPart = keyParts[index];
				
				// Perform type-aware comparison if typeCheck is true
				return typeCheck && type === 'number' 
					? Number(rowValue) === Number(keyPart)
					: String(rowValue).trim() === keyPart;
			})
		);

		if (rowIndex === -1) {
			return null;
		}

		// Return both the row data and its index
		return { row: state.tbody[rowIndex], rowIndex };
	} catch (error) {
		console.error(`Error retrieving object data: ${error}`);
		return null;
	}
}

/**
 * Sets up an overflow listener on the given DOM node.
 * The listener checks if the node is overflowing its bounds and calls a callback function if it is.
 *
 * @param {HTMLElement} node - The DOM node to observe for overflow.
 * @param {function} callback - Optional callback function to execute when overflow is detected.
 */
export function setupOverflowListener(node, callback) {
	const checkOverflow = () => {
		const isOverflowing = node.scrollHeight > node.clientHeight || node.scrollWidth > node.clientWidth;
		if (typeof callback === 'function') {
			callback(isOverflowing);
		}
	};
	const resizeObserver = new ResizeObserver(checkOverflow);
	resizeObserver.observe(node);
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
