import { renderInput } from './render.js';

/**
 * Adds a class to a DOM node based on the input value.
 * @param {HTMLElement} node - The DOM node to add the class to.
 * @param {HTMLInputElement} input - The input element containing the value.
 * @param {HTMLElement} list - The HTML element where the updated class list will be rendered.
 * @returns {void}
 */
export function addClass(node, input, list) {
	try {
		const value = input.value.trim();
		if (node && value) {
			const classesToAdd = value.split(/\s+/);
			node.classList.add(...classesToAdd);
			updateClassList(node, list);
			input.value = '';
		}
	} catch (error) {
		console.error('An error occurred while adding a class:', error.message);
	}
}

/**
 * Copies the given classes to the clipboard.
 * @param {string} classes - The classes to be copied.
 * @throws {Error} If the Clipboard API is not supported in the browser.
 */
export function copyClasses(classes) {
	try {
		if (!navigator.clipboard) {
			throw new Error('Clipboard API is not supported in this browser.');
		}
		navigator.clipboard.writeText(classes);
	} catch (error) {
		console.error('Error in copyClasses:', error.message);
	}
}

/**
 * Filters an array of CSS class names based on a specified breakpoint.
 * @param {string[]} classList - The array of CSS class names to filter.
 * @param {string} breakpoint - The breakpoint to filter the class names by.
 * @param {string[]} breakpoints - The array of available breakpoints.
 * @returns {string[]} - The filtered array of CSS class names.
 */
// export function filterClassesByBreakpoint(classList, breakpoint, breakpoints) {
// 	try {
// 		if (!breakpoint) {
// 			return classList.filter(className => !breakpoints.slice(1).some(prefix => className.startsWith(prefix)));
// 		} else if (breakpoints.includes(breakpoint)) {
// 			return classList.filter(className => className === breakpoint || className.startsWith(breakpoint));
// 		} else {
// 			throw new Error('Invalid breakpoint specified');
// 		}
// 	} catch (error) {
// 		console.error(`Error in filterClassesByBreakpoint: ${error.message}`);
// 		return classList;
// 	}
// }

/**
 * Returns the classList of an HTML element and its optional `data-removed` attribute.
 * @param {HTMLElement} node - The HTML element.
 * @returns {Object} - Object containing the classList and removed classes of the specified element.
 */
export function getClasses(node) {
	if (!node) return;
	try {
		const classes = Array.from(node.classList).filter(className => className.trim() !== '') //.sort();
		const removed = Array.from(node.dataset?.removed?.trim().split(/\s+/) || []).filter(className => className.trim() !== '') //.sort();
		return { classes, removed };
	} catch (error) {
		console.error('An error occurred while getting classes:', error.message);
	}
}

/**
 * Parses a utility string based on the provided configuration.
 *
 * @param {string} string - The utility string to parse.
 * @param {object} config - The configuration object containing delimiters and utility options.
 * @param {string} config.stateDelimiter - The delimiter used to separate different parts of the utility string.
 * @param {string} config.prefixDelimiter - The delimiter used to separate the prefix and value in the utility string.
 * @param {string[]} config.colorschemes - An array of available colorschemes.
 * @param {string[]} config.breakpoints - An array of available breakpoints.
 * @param {string[]} config.structurals - An array of available structurals.
 * @param {string[]} config.dynamics - An array of available dynamics.
 * @returns {object} - An object containing the parsed utility string parts.
 */
export function parseUtilityString(string, config) {
	const { stateDelimiter, prefixDelimiter, colorschemes, breakpoints, structurals, dynamics } = config;
	const parts = string.split(stateDelimiter);

	let colorscheme = '';
	let breakpoint = '';
	let structural = '';
	let dynamic = '';
	let prefix = '';
	let value = '';

	if (parts.length >= 1 && colorschemes.includes(parts[0])) {
		colorscheme = parts.shift();
	}

	if (parts.length >= 1 && breakpoints.includes(parts[0])) {
		breakpoint = parts.shift();
	}

	if (parts.length >= 1 && structurals.includes(parts[0])) {
		structural = parts.shift();
	}

	if (parts.length >= 1 && dynamics.includes(parts[0])) {
		dynamic = parts.shift();
	}

	if (parts.length === 1 && !parts[0].includes(prefixDelimiter)) {
		// If there's only one part and it doesn't contain the prefixDelimiter,
		// assign it to value and set prefix to an empty string
		value = parts[0];
	} else if (parts.length >= 1) {
		// If there's at least one part, split it using the prefixDelimiter
		const prefixAndValue = parts[0].split(prefixDelimiter);
		prefix = prefixAndValue.shift(); // Get the prefix
		value = prefixAndValue.join(prefixDelimiter); // Get the value
	}

	return {
		colorscheme,
		breakpoint,
		structural,
		dynamic,
		prefix,
		value
	};
}

/**
 * Removes the specified classes from a DOM node.
 * @param {HTMLElement} node - The DOM node from which to remove the classes.
 * @param {HTMLElement} list - The HTML element where the updated class list will be rendered.
 */
export function remClasses(node, list) {
	try {
		delete node.dataset.removed;
		updateClassList(node, list);
	}
	catch (error) { console.error('An error occurred while removing classes:', error.message); }
}

/**
 * Reverts the classes of a given node to its original state and updates the class list.
 * @param {HTMLElement} node - The node whose classes need to be reverted.
 * @param {HTMLElement} list - The HTML element where the updated class list will be rendered.
 */
export function revertClasses(node, list) {
	try {
		node.className = node.dataset.classes;
		updateClassList(node, list);
	}
	catch (error) { console.error('An error occurred while reverting classes:', error.message); }
}

/**
 * Sets the unit class for a given node by adding or removing CSS classes.
 * @param {HTMLElement} node - The HTML element to modify.
 * @param {Array} group - An array of elements to remove from the node's classes.
 * @param {string} value - The CSS class to add to the node.
 */
export function setUnitClass(node, group, value) {
	const { classes, removed } = getClasses(node);
	group.forEach(element => {
		classes.forEach(className => {
			if (className.includes(element.value)) {
				node.classList.remove(className);
			}
		});
		removed.forEach(className => {
			if (className.includes(element.value)) {
				node.dataset.removed = node.dataset.removed.replace(className, '');
			}
		});
	});
	node.classList.add(value);
}

/**
 * Updates the class list of a given node and renders the updated class list in the provided HTML element.
 * @param {HTMLElement} node - The node whose class list needs to be updated.
 * @param {HTMLElement} list - The HTML element where the updated class list will be rendered.
 * @returns {void}
 */
export function updateClassList(node, list) {
	if (!node) return;
	try {
		const { classes, removed } = getClasses(node);
		list.innerHTML = 
			classes.map(value => renderInput({ textAfter:value, input: { name:'classname', value, checked:'', role: 'switch', type:'checkbox' }})).join('\n') +
			removed.map(value => renderInput({ textAfter:value, input: { name:'classname', value, role: 'switch', type:'checkbox' }})).join('\n');
	} catch (error) {
		console.error('An error occurred while updating class list:', error.message);
	}
}