import { renderInput, renderTextarea } from './render.js';
import { iterateObject } from './utils.js';

const formatPart = (part) => part.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();

/**
 * Finds a component by its key in an array of groups of components.
 * @param {string} key - The key of the component to find.
 * @param {Array} arr - The array of groups to search in.
 * @returns {Object|undefined} - The found component object, or undefined if not found.
 */
export function findComponentByKey(key, arr) {
	return arr.flatMap(group => group.items).find(obj => obj.key === key);
}

/**
 * Retrieves the connected parts of a given node within a specific group.
 * @param {HTMLElement} node - The node for which to retrieve connected parts.
 * @param {HTMLElement} group - The group element to manipulate based on the connected parts.
 * @returns {NodeList} - A list of connected parts matching the specified criteria.
 */
export function getConnectedParts(node, group) {
	try {
		group.style.display = 'none';
		if (!node || !node.dataset.part) return [];
		const component = node.closest('[data-component]');
		if (!component) return [];

		// Query connected parts using a selector
		const selector = `[data-component~="${component.dataset.component}"] [data-part~="${node.dataset.part}"], [data-component~="${component.dataset.component}"][data-part~="${node.dataset.part}"]`;
		const connectedParts = document.querySelectorAll(selector);
		if (connectedParts.length > 1) {
			group.style.display = 'grid';
		}
		return connectedParts;
	} catch (error) {
		console.error(`An error occurred in getConnectedParts: ${error.message}`);
		return [];
	}
}

/**
 * Mounts a component by finding its corresponding object in an array and updating its attributes.
 * @param {HTMLElement} component - The component element to mount.
 * @param {Array} arr - The array of components to search in.
 */
export function mountComponent(component, arr) {
	try {
		const key = component.getAttribute('key');
		if (!key) return; 
		const obj = findComponentByKey(key, arr);
		if (obj.info) {
			const element = component.firstElementChild;
			element.dataset.component = key;
			iterateObject(obj.info, 'part', (key, part) => { 
				const node = element.querySelector(part[key]);
				if (node) {
					node.dataset.part = formatPart(part[key]);
					node.dataset.styles = part['styles'];
					if (part['key']) node.dataset.modelKey = part['key'];
					if (part['content']) node.dataset.content = part['content'];
				}
			});
		}
	} catch (error) {
		console.error('Error initializing component:', error);
	}
}

/**
 * Handles the component search event.
 * @param {Event} event - The event object.
 * @param {Object} config - The configuration object.
 * @param {Object} compConfig - The component configuration object.
 * @param {Object} compInfo - The component information object.
 * @param {Function} compInsert - The component insert function.
 * @param {string} uid - The unique identifier.
 */
export const onComponentSearch = (event, config, compConfig, compInfo, compInsert, uid) => {
	if (event.inputType == "insertReplacementText" || event.inputType == null) {
		const value = event.target.value;
		if (value) {
			const options = Array.from(event.target.list.options);
			const match = options.find(option => option.value === value);
			if (match) {
				const component = findComponentByKey(match.dataset.componentKey, config.components);
				setComponentInfo(component, compConfig, compInfo, compInsert, uid);
			}
		}
		return;
	}
};

/**
 * Sets the component information based on the provided object.
 * @param {Object} obj - The object containing the component information.
 * @param {HTMLElement} compConfig - The component configuration element.
 * @param {HTMLElement} compInfo - The component info element.
 * @param {HTMLElement} compInsert - The component insert element.
 * @param {string} uid - The unique identifier.
 */
export function setComponentInfo(obj, compConfig, compInfo, compInsert, uid) {
	compInfo.value = obj.description || '';
	compInsert.value = obj.key || '';
	compConfig.hidden = !obj.config;

	if (obj.config) {
		compConfig.innerHTML = obj.config.map(prop => {
			const { key, label, ...input} = prop;
			const config = { text: label, input: { ...input, 'data-key': obj.key, 'data-prop': key, form: `elements${uid}` } };
			if (input.type === 'textarea') {
				delete config.input.type;
				return renderTextarea(config);
			} else {
				return renderInput(config);
			}
		}).join('');
	}
}