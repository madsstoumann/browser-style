import { findComponentByKey } from './components.js';
import { getNestedProperty, parseResponse, replacePlaceholder, setNestedProperty } from './utils.js';

/**
 * Handles the text edit event.
 * @param {Event} event - The text edit event.
 * @param {HTMLElement} active - The active element.
 */
export const onTextEdit = (event, active) => {
	if (!event.detail.content) return;
	const plaintextOnly = active?.dataset?.content === 'text' || false;
	active[plaintextOnly ? 'textContent' : 'innerHTML'] = event.detail.content;
};

/**
 * Prompts the user for an API key if necessary and makes a POST request to a specified service URL.
 * If a placeholder '{{PROMPT}}' is found in the service body, it will be replaced with the value of the 'node.dataset.aiPrompt' property concatenated with the value of 'this.active.textContent'.
 * Handles the response from the service (e.g., converts it to JSON, checks for errors, etc.).
 * @param {HTMLElement} node - The HTML element associated with the AI service.
 * @returns {Promise<void>} - A promise that resolves when the request is completed.
 */
export async function prompt(node) {
	if (!node || !node.dataset.aiService) return;
	const service = this.config.content[0].ai.find(obj => obj.service === node.dataset.aiService);
	if (!service.apikey) {
		const apiKey = window.prompt('Enter your API key:');
		service.apikey = apiKey;
		replacePlaceholder(service.headers, '{{APIKEY}}', apiKey);
		service.headers.Authorization = service.headers.Authorization.replace('{{APIKEY}}', apiKey);
	}

	if (service.apikey && service.body) {
		const suggest = node.dataset.aiSuggest-0 || this.formContent.elements.aisuggest?.valueAsNumber || 1;
		const prompt = `${node.dataset.aiPrompt || this.formContent.elements.aiprompt.value}${suggest > 1 ? ` (${suggest}). ${service.multiple}`:''}: ${this.active.textContent}`;
		const body = JSON.stringify(service.body).replace('{{PROMPT}}', prompt);
		
		try {
			this.setAttribute('loader', 'overlay');
			const response = await fetch(service.url, {
				method: service.method || 'POST',
				headers: service.headers,
				body
			});

			const json = await response.json();
			const { foundObject } = getNestedProperty(json, service.result);

			if (foundObject !== undefined) {
				const result = parseResponse(foundObject);
				console.log(result)
			}
		} catch (error) {
			console.error('Error:', error);
		}
		finally {
			this.removeAttribute('loader');
		}
	}
}

/**
* Saves the content of the active component.
*/
export function save(node, components, dispatchCallback) {
	if (node.dataset.modelKey) {
		const parent = node.closest('[data-component]');
		const saveRichText = node.dataset.content === 'richtext';
		if (parent) {
			const component = findComponentByKey(parent.dataset.component, components);
			if (component) {
				const model = component.model ? JSON.parse(JSON.stringify(component.model)) : undefined;
				if (model) {
					// Select all nodes with data-model-key attribute within the parent
					const nodesWithModelKey = parent.querySelectorAll('[data-model-key]');
					// Iterate through each node and update the model
					nodesWithModelKey.forEach(node => {
						const { foundObject, keys } = getNestedProperty(model, node.dataset.modelKey);
						if (foundObject !== undefined) {
							setNestedProperty(model, keys, (saveRichText ? node.innerHTML : node.textContent ) );
						}
					});
					if (typeof dispatchCallback === 'function') {
						dispatchCallback('saveContent', { component: parent.dataset.component, model });
					}
				}
			}
		}
	}
}