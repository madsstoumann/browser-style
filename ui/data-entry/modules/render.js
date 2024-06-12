import { attrs, uuid } from './utility.js';

/**
 * Renders all the data based on the provided schema and instance.
 * @param {object} data - The data object to be rendered.
 * @param {object} schema - The schema object that defines the structure of the data.
 * @param {object} instance - The instance object that provides rendering methods.
 * @param {boolean} [root=false] - Indicates if it's the root level rendering.
 * @returns {string} - The rendered content.
 */
export function all(data, schema, instance, root = false) {
	let content = Object.entries(schema.properties).map(([key, config]) => {
		const attributes = config?.render?.attributes || [];
		const method = config?.render?.method;
		const renderMethod = instance.getRenderMethod(method);
		const title = config.title || 'LABEL';
		const toolbar = config?.render?.toolbar ? instance.getRenderMethod('toolbar')(config.render.toolbar) : '';

		let options = config?.render?.options || [];
		if (typeof options === 'string') {
			const storedOptions = localStorage.getItem(options);
			try {
				options = JSON.parse(storedOptions) || [];
			} catch {
				options = [];
			}
		}

		if (config.type === 'array') {
			if (method) {
				try {
					const addEntry = config.render?.entry ? instance.getRenderMethod('entry')(config.render.entry, key, instance) : '';
					return renderMethod(title, data[key], attributes, options, config, instance) + addEntry + toolbar;
				} catch {
					return '';
				}
			} else if (config.items) {
				return data[key].map(item => all(item, config.items, instance)).join('');
			}
		}

		if (method) {
			try {
				return renderMethod(title, data[key], attributes, options, config, instance);
			} catch {
				return '';
			}
		}
		return '';
	}).join('');

	return root && schema?.render?.toolbar ? content + instance.getRenderMethod('toolbar')(schema.render.toolbar) : content;
}

/**
 * Renders a checklist fieldset.
 *
 * @param {string} label - The label for the checklist.
 * @param {Array} value - The array of checklist items.
 * @param {Object} attributes - The attributes for the checklist fieldset.
 * @param {Object} _options - The options object (not used in this function).
 * @param {Object} config - The configuration object for rendering the checklist.
 * @returns {string} The rendered HTML for the checklist fieldset.
 */
export const checklist = (label, value, attributes, _options, config) => {
	/**
	 * Renders a single checklist item.
	 *
	 * @param {Object} item - The checklist item object.
	 * @param {Object} config - The configuration object for rendering the checklist item.
	 * @returns {string} The rendered HTML for the checklist item.
	 */
	const checkitem = (item, config) => {
		let attributes, label, type, value;
		for (const [key, prop] of Object.entries(config.properties)) {
			if (prop.property === 'label') label = item[key];
			if (prop.property === 'type') type = item[key];
			if (prop.property === 'value') {
				value = item[key];
				attributes = prop.render.attributes;
			}
		}
		return `
			<label part="row">
				<span part="label">${type}</span>
				<em part="header">${label}
					<input part="input" ${attrs(attributes)} value="${value}">
				</em>
			</label>`;
	};

	return fieldset(label, attributes, value.map(item => checkitem(item, config.items)).join(''));
}

/**
 * Renders the details component.
 *
 * @param {string} label - The label for the details component.
 * @param {any} value - The value for the details component.
 * @param {object} attributes - The attributes for the details component.
 * @param {object} _options - The options object (not used in the function).
 * @param {object} config - The configuration object for rendering.
 * @param {object} instance - The instance object.
 * @returns {string} The rendered details component.
 */
export const details = (label, value, attributes, _options, config, instance) => {
	/**
	 * Renders the single `<details>` component.
	 *
	 * @param {any} value - The value for the detail component.
	 * @param {object} config - The configuration object for rendering.
	 * @returns {string} The rendered `<details>` component.
	 */
	const detail = (value, config) => {
		const summary = config.render?.summary ? (value[config.render.summary] || config.render.summary) : 'SUMMARY';
		const header = config.render?.label ? (value[config.render.label] || config.render.label) : 'LABEL';

		return `
			<details part="details" ${attrs(attributes)}>
				<summary part="row summary">
					<span part="label">${icon()}${summary}</span>
					<em part="header">${header}</em>
				</summary>
				${all(value, config.items, instance)}
			</details>`;
	};

	if (!Array.isArray(value)) return detail(value, config);
	return fieldset(label, attributes, value.map(item => detail(item, config)).join(''));
}

/**
 * Generates a popover HTML string based on the provided object and key.
 * @param {Object} obj - The object containing popover data.
 * @param {string} key - The key used for rendering the popover.
 * @param {object} instance - The instance object.
 * @returns {string} - The generated popover HTML string.
 */
export const entry = (obj, key, instance) => {
	/* Create a form to host the entry-fields */
	const formID = `form${uuid()}`;
	instance.parent.insertAdjacentHTML('beforeend', `<form id="${formID}" hidden></form>`);

	const { id, label, name, schema } = obj;
	const fields = all({}, schema, instance);

	return `
		<nav part="nav">
			<button type="button" part="micro" popovertarget="${id}" style="--_an:--${id};">
				${icon('plus')}${label}
			</button>
		</nav>
		<div id="${id}" popover="" style="--_pa:--${id};">
			<fieldset part="fieldset" name="${name}">
				<legend part="legend">${label}</legend>
				${fields}
				<nav part="nav">
					<button type="button" popovertarget="${id}" popovertargetaction="hide" class="--text fs-xs">Close</button>
					<button type="button" class="bg-success --light fs-xs" data-util="addArrayEntry" data-params='{"key": "${key}", "id": "${id}"}'>Add</button>
				</nav>
			</fieldset>
		</div>`;
};

/**
 * Renders a fieldset element with a legend and content.
 *
 * @param {string} label - The label for the fieldset.
 * @param {object} attributes - The attributes to apply to the fieldset element.
 * @param {string} content - The content to be placed inside the fieldset.
 * @returns {string} The rendered fieldset element as a string.
 */
export const fieldset = (label, attributes, content) => `
	<fieldset ${attrs(attributes, [{ part: 'fieldset' }])}>
		<legend part="legend">${label}</legend>
		${content}
	</fieldset>`;

/**
 * Renders a grid fieldset.
 *
 * @param {string} label - The label for the grid.
 * @param {Array} value - The array of values to render in the grid.
 * @param {Object} attributes - The attributes for the grid fieldset.
 * @param {Object} _options - The options for rendering the grid.
 * @param {Object} config - The configuration object for the grid.
 * @param {object} instance - The instance object.
 * @returns {string} - The rendered grid fieldset.
 */
export const grid = (label, value, attributes, _options, config, instance) => {
	return fieldset(label, attributes, value.map(item => `<fieldset>${all(item, config.items, instance)}</fieldset>`).join(''));
}

/**
 * Generates an HTML string representing an icon.
 *
 * @param {string} [type='triangle right'] - The type of the icon.
 * @param {string} [size='md'] - The size of the icon.
 * @returns {string} The HTML string representing the icon.
 */
export const icon = (type = 'triangle right', size = 'md') => `<ui-icon type="${type}" size="${size}"></ui-icon>`;

/**
 * Generates an HTML input element with an optional label.
 *
 * @param {string} label - The label for the input element.
 * @param {string} value - The value of the input element.
 * @param {Array} attributes - An array of attributes to be added to the input element.
 * @returns {string} - The HTML representation of the input element.
 */
export const input = (label, value, attributes = []) => {
	const checked = attributes.some(attr => attr.type === 'checkbox') && value ? ' checked' : '';
	const hidden = attributes.some(attr => attr.type === 'hidden');
	const output = `<input part="input" value="${value||''}" ${attrs(attributes)}${checked}></input>`;
	return hidden ? output : `<label part="row"><span part="label">${label}</span>${output}</label>`;
}

/**
 * Renders a media fieldset with checkboxes for each item.
 *
 * @param {string} label - The label for the media fieldset.
 * @param {Array} value - The array of media items.
 * @param {Object} attributes - The attributes for the media fieldset.
 * @param {Object} _options - The options object (not used in this function).
 * @param {Object} config - The configuration object.
 * @returns {string} - The rendered media fieldset HTML.
 */
export const media = (label, value, attributes, _options, config) => {
	const mediaItem = (item, config) => {
		let attributes, src, value;
		for (const [key, prop] of Object.entries(config.properties)) {
			if (prop.property === 'src') src = item[key];
			if (prop.property === 'value') { value = item[key]; attributes = prop.render.attributes; }
		}
		return `
		<label part="row">
			<input part="input" ${attrs(attributes)} value="${value}" checked>
			<img part="img" src="${src}" alt="${value}">
		</label>`;
	}
	return fieldset(label, attributes, value.map(item => mediaItem(item, config.items)).join(''))
};

/**
 * Renders a rich text input field with a label.
 *
 * @param {string} label - The label for the input field.
 * @param {string} value - The initial value of the input field.
 * @param {Array} attributes - Additional attributes for the input field.
 * @returns {string} The HTML markup for the rich text input field.
 */
export const richtext = (label, value, attributes = []) => `
	<div part="row">
		<span part="label">${label}</span>
		<ui-richtext part="richtext" ${attrs(attributes)}>
			${value}
		</ui-richtext>
	</div>`;

/**
 * Generates an HTML string for a labeled select element.
 *
 * @param {string} label - The text for the label.
 * @param {string} value - The selected value of the select element.
 * @param {Array<Object>} attributes - An array of attribute objects for the select element.
 * @param {Array<Object>} options - An array of option objects for the select element.
 * @returns {string} The HTML string for the labeled select element.
 */
export const select = (label, value, attributes = [], options = []) => `
	<label part="row">
		<span part="label">${label}</span>
		<select part="select" ${attrs(attributes)}>
			${options.map(option => `
				<option value="${option.value}" ${option.value === value ? 'selected' : ''}>
					${option.label}
				</option>
			`).join('')}
		</select>
	</label>
`;

/**
 * Generates an HTML string for a labeled textarea element.
 *
 * @param {string} label - The text for the label.
 * @param {string} value - The text content of the textarea element.
 * @param {Array<Object>} attributes - An array of attribute objects for the textarea element.
 * @returns {string} The HTML string for the labeled textarea element.
 */
export const textarea = (label, value, attributes = []) => `
	<label part="row">
		<span part="label">${label}</span>
		<textarea part="textarea" ${attrs(attributes)}>${value}</textarea>
	</label>
`;

/**
 * Renders a toolbar based on the provided configuration.
 *
 * @param {Array} config - The configuration for the toolbar buttons.
 * @returns {string} The HTML representation of the rendered toolbar.
 */
export const toolbar = (config) => {
	const buttons = config.map((button) => `
		<button part="button" type="button" ${attrs(button.attributes)}>
			${button.label}
		</button>
	`).join('');
	return `<nav part="nav toolbar">${buttons}</nav>`;
}