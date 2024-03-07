import { findComponentByKey } from './components.js';
import { containsRichText, getNestedProperty, parseResponse, replacePlaceholder, setNestedProperty } from './utils.js';

/**
 * Handles the text edit event.
 * @param {Event} event - The text edit event.
 * @param {HTMLElement} active - The active element.
 */
export const onTextEdit = (event, active) => {
	try {
		if (!event.detail.content) return;
		const plaintextOnly = active?.dataset?.content === 'text' || false;
		active[plaintextOnly ? 'textContent' : 'innerHTML'] = event.detail.content;
	} catch (error) {
		console.error('Error in onTextEdit:', error.message);
	}
};

/**
 * Calls an AI service with the provided options.
 *
 * @param {Object} options - The options for the AI service.
 * @param {HTMLElement} options.app - The app element.
 * @param {HTMLElement} options.content - The content element.
 * @param {HTMLInputElement} options.input - The input element.
 * @param {HTMLElement} options.node - The node element.
 * @param {HTMLElement} options.result - The result node element.
 * @param {Array} options.services - The array of AI services.
 * @returns {Promise<void>} - A promise that resolves when the AI service is called.
 */
export async function aiPrompt(options) {
	const { app, content, input, node, result, services } = options;

	try {
		if (!node || !services || !node.dataset.aiService) return;

		const service = services.find(obj => obj.service === node.dataset.aiService);
		if (!service) return;

		if (!service.apikey) {
			const apiKey = window.prompt('Enter your API key:');
			service.apikey = apiKey;
			replacePlaceholder(service.headers, '{{APIKEY}}', apiKey);
			service.headers.Authorization = service.headers.Authorization.replace('{{APIKEY}}', apiKey);
		}

		if (service.apikey && service.body) {
			const isRichText = containsRichText(content);
			const value = isRichText ? content.innerHTML : content.textContent;
			const prompt = `${(node.dataset.aiPrompt || (input ? input.value : ''))}${isRichText ? ` (${service.richtext})` : ''}: ${value}`;
			const body = JSON.stringify(service.body, (key, value) => {
				if (typeof value === 'string') {
					// Escape double quotation marks within the string
					return value.replace(/"/g, '\\"');
				}
				return value;
			}).replace('{{PROMPT}}', prompt);
			console.log(body);

			app.setAttribute('loader', 'overlay');
			const response = await fetch(service.url, {
				method: service.method || 'POST',
				headers: service.headers,
				body,
			});

			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}

			const json = await response.json();
			const { foundObject } = getNestedProperty(json, service.resultKey);

			if (foundObject !== undefined) {
				result.innerHTML = `<div>${parseResponse(foundObject)}</div>`;
			}
		}
	} catch (error) {
		// Handle specific error types
		if (error instanceof TypeError) {
			console.error('Type error:', error.message);
		} else if (error instanceof SyntaxError) {
			console.error('Syntax error:', error.message);
		} else {
			console.error('An error occurred:', error.message);
		}
	} finally {
		app.removeAttribute('loader');
	}
}

/**
 * Saves content from a specified node to the component model and dispatches a 'uie-save-content' event.
 * @param {HTMLElement} node - The node from which to extract content.
 * @param {Array} components - An array of components.
 * @param {EventTarget} app - The event target for dispatching the 'uie-save-content' event.
 */
export function onSave(node, components, app) {
	try {
		if (!node || !node.dataset || !node.dataset.modelKey) {
			throw new Error('Invalid node or missing data-model-key attribute');
		}

		const parent = node.closest('[data-component]');

		if (!parent) {
			throw new Error('Parent element with data-component attribute not found');
		}

		const component = findComponentByKey(parent.dataset.component, components);

		if (!component) {
			throw new Error('Component not found');
		}

		const model = component.model ? JSON.parse(JSON.stringify(component.model)) : undefined;

		if (!model) {
			throw new Error('Component model is undefined');
		}

		const nodesWithModelKey = parent.querySelectorAll('[data-model-key]');

		if (!nodesWithModelKey || nodesWithModelKey.length === 0) {
			throw new Error('No nodes with data-model-key attribute found');
		}

		nodesWithModelKey.forEach(node => {
			const { foundObject, keys } = getNestedProperty(model, node.dataset.modelKey);

			if (foundObject !== undefined) {
				setNestedProperty(model, keys, node.dataset.content === 'richtext' ? node.innerHTML : node.textContent);
			}
		});

		app.dispatchEvent(new CustomEvent('uie-save-content', { detail: { component: parent.dataset.component, model } }));
	} catch (error) {
		console.error('Error in onSave:', error.message);
	}
}

