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
export function parseClassString(string, config) {
	const { breakpoints, colorschemes, ranges, selectors, states, stateDelimiter } = config;
	const parts = string.split(stateDelimiter);

	let breakpoint = '';
	let colorscheme = '';
	let range = '';
	let selector = '';
	let state = '';
	let value = '';

	if (parts.length >= 1 && colorschemes.includes(parts[0])) {
		colorscheme = parts.shift();
	}

	if (parts.length >= 1 && breakpoints.includes(parts[0])) {
		breakpoint = parts.shift();
	}

	if (parts.length >= 1 && ranges.includes(parts[0])) {
		range = parts.shift();
	}

	if (parts.length >= 1 && selectors.includes(parts[0])) {
		selector = parts.shift();
	}

	if (parts.length >= 1 && states.includes(parts[0])) {
		state = parts.shift();
	}

	value = parts.shift();

	return {
		colorscheme,
		breakpoint,
		range,
		selector,
		state,
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
 * Toggles a CSS class on a DOM node based on a boolean value.
 *
 * @param {HTMLElement} node - The DOM node to toggle the class on.
 * @param {string} value - The CSS class name to toggle.
 * @param {boolean} checked - The boolean value indicating whether to add or remove the class.
 */
export function toggleClass(node, value, checked) {
	if (!checked) {
		node.classList.remove(value);
		node.dataset.removed = `${node.dataset.removed || ''} ${value}`;
	} else {
		node.classList.add(value);
		node.dataset.removed = node.dataset.removed.replace(value, '');
	}
}

/**
 * Toggles classes on elements based on the checked state.
 *
 * @param {NodeList} elements - The elements to toggle classes on.
 * @param {Node} node - The node to toggle classes on.
 * @param {boolean} checked - The checked state to determine whether to add or remove classes.
 */
export function toggleClasses(elements, node, checked) {
	if (elements instanceof NodeList || Array.isArray(elements)) {
		elements.forEach(element => {
			toggleClass(node, element.value, checked);
			element.checked = checked;
		});
	} else {
		// If it's a single element
		toggleClass(node, elements.value, checked);
		elements.checked = checked;
	}
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