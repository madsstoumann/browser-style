/**
 * Converts a string to camelCase format.
 * @param {string} str - The input string to be converted.
 * @returns {string} The camelCase formatted string.
 */
export function camelCase(str) {
	try {
		return str.split(' ').map((e, i) => i ? e.charAt(0).toUpperCase() + e.slice(1).toLowerCase() : e.toLowerCase()).join('');
	} catch (error) {
		this.console(`Error in camelCase: ${error}`, '#F00');
		return str; // Return the original string in case of an error
	}
};

/**
 * Capitalizes the first letter of a string and converts the rest of the string to lowercase.
 *
 * @param {string} str - The input string.
 * @returns {string} The capitalized string.
 */
export function capitalize(str) {
	return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Outputs a formatted console log if debug mode is enabled.
 * @param {string} str - The string to be logged.
 * @param {string} [bg='#000'] - The background color for formatting in the console.
 * @returns {void}
 */
export function consoleLog(str, bg = '#000', debug) {
	if (debug) {
		console.log(`%c${str}`, `background:${bg};color:#FFF;padding:0.5ch 1ch;`);
	}
}