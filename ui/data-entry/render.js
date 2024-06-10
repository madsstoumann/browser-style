/**
 * Renders the form-data based on the provided schema.
 * 
 * @param {object} data - The data to be rendered.
 * @param {object} schema - The schema defining the rendering configuration.
 * @param {boolean} [root=false] - Whether the current rendering is the root of the form.
 * @returns {string} - The rendered output.
 */
function all(data, schema, root = false) {
	let content = Object.entries(schema.properties).map(([key, config]) => {
		const attributes = config?.render?.attributes || [];
		const method = config?.render?.method;
		const renderMethod = render.getMethod(method);
		const title = config.title || 'LABEL';
		const toolbar = config?.render?.toolbar ? render.toolbar(config.render.toolbar) : '';

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
					const popoverContent = config.render?.popover ? popover(config.render.popover) : '';
					return renderMethod(title, data[key], attributes, options, config) + popoverContent + toolbar;
				}
				catch {
					return;
				}
			} else if (config.items) {
				return data[key].map(item => all(item, config.items)).join('');
			}
		}

		if (method) {
			try {
				return renderMethod(title, data[key], attributes, options, config);
			} catch {
				return;
			}
		}
	}).join('');

	return root && schema?.render?.toolbar ? content + render.toolbar(schema.render.toolbar) : content;
}

/**
 * Converts an array of attribute objects into a string representation of HTML attributes.
 *
 * @param {Array<Object>} attributes - The array of attribute objects.
 * @param {Array<Object>} [additional] - The array of additional attribute objects.
 * @returns {string} - The string representation of HTML attributes.
 */
const attrs = (attributes = [], additional = []) => {
	const merged = {};
	attributes.concat(additional).forEach(attr => {
		Object.entries(attr).forEach(([key, value]) => {
			if (merged[key]) {
				merged[key] = `${merged[key]} ${value}`.trim();
			} else {
				merged[key] = value;
			}
		});
	});
	return Object.entries(merged)
		.map(([key, value]) => key === value ? `${key}` : `${key}="${value}"`)
		.join(' ');
};

/**
 * Renders a checklist fieldset.
 *
 * @param {string} label - The label for the checklist.
 * @param {Array} value - The array of values for the checklist.
 * @param {Object} attributes - The attributes for the checklist fieldset.
 * @param {Object} [_options] - The options for the checklist.
 * @param {Object} config - The configuration object for the checklist.
 * @returns {string} - The rendered checklist fieldset.
 */
const checklist = (label, value, attributes, _options, config) => {
	const checkitem = (item, config) => {
		let attributes, label, type, value;
		for (const [key, prop] of Object.entries(config.properties)) {
			if (prop.property === 'label') label = item[key];
			if (prop.property === 'type') type = item[key];
			if (prop.property === 'value') { value = item[key]; attributes = prop.render.attributes; }
		}
		return `
		<label part="row">
			<span part="label">${type}</span>
			<em part="header">${label}
				<input part="input" ${attrs(attributes)} value="${value}">
			</em>
		</label>`;
	};
	return fieldset(label, attributes, value.map(item => checkitem(item, config.items)).join(''))
}

/**
 * Renders a details element with a summary and nested fieldset.
 *
 * @param {string} label - The label for the details element.
 * @param {Array} value - The array of values for the details element.
 * @param {Object} attributes - The attributes for the details element.
 * @param {Object} [_options] - The options for the details element.
 * @param {Object} config - The configuration object for the details element.
 * @returns {string} - The rendered details element.
 */
const details = (label, value, attributes, _options, config) => {
	const detail = (value, config) => {
		const summary = config.render?.summary ? (value[config.render.summary] || config.render.summary) : 'SUMMARY';
		const header = config.render?.label ? (value[config.render.label] || config.render.label) : 'LABEL';

		return `
		<details part="details" ${attrs(attributes)}>
			<summary part="row summary">
				<span part="label">${icon()}${summary}</span>
				<em part="header">${header}</em>
			</summary>
			${all(value, config.items)}
		</details>`;
	};

	if (!Array.isArray(value)) return detail(value, config);
	return fieldset(label, attributes, value.map(item => detail(item, config)).join(''));
}

/**
 * Generates an HTML fieldset element with the specified label, attributes, and content.
 *
 * @param {string} label - The label for the fieldset.
 * @param {Object} attributes - The attributes to apply to the fieldset element.
 * @param {string} content - The content to include within the fieldset element.
 * @returns {string} The generated HTML for the fieldset element.
 */
const fieldset = (label, attributes, content) => `
	<fieldset ${attrs(attributes, [{ part: 'fieldset' }])}>
		<legend part="legend">${label}</legend>
		${content}
	</fieldset>`;
	

const grid = (label, value, attributes, _options, config) => {
	return fieldset(label, attributes, value.map(item => `<fieldset>${all(item, config.items)}</fieldset>`).join(''));
}

/**
 * Generates an HTML string representing an icon.
 *
 * @param {string} [type='triangle right'] - The type of the icon.
 * @param {string} [size='md'] - The size of the icon.
 * @returns {string} The HTML string representing the icon.
 */
const icon = (type = 'triangle right', size = 'md') => `<ui-icon type="${type}" size="${size}"></ui-icon>`;

/**
 * Generates an HTML image element with the specified label, source, and attributes.
 *
 * @param {string} label - The label or description of the image.
 * @param {string} value - The source URL of the image.
 * @param {Array} [attributes=[]] - An optional array of additional attributes to be added to the image element.
 * @returns {string} The HTML string representing the image element.
 */
const img = (label, value, attributes = []) => `<img part="img" src="${value}" ${attrs(attributes)} alt="${label}">`;

/**
 * Generates an HTML input element with an optional label.
 *
 * @param {string} label - The label for the input element.
 * @param {string} value - The value of the input element.
 * @param {Array} attributes - An array of attributes to be added to the input element.
 * @returns {string} - The HTML representation of the input element.
 */
const input = (label, value, attributes = []) => {
	const checked = attributes.some(attr => attr.type === 'checkbox') && value ? ' checked' : '';
	const hidden = attributes.some(attr => attr.type === 'hidden');
	const output = `<input part="input" value="${value}" ${attrs(attributes)}${checked}></input>`;
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
const media = (label, value, attributes, _options, config) => {
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
 * Renders a popover element.
 *
 * @param {Object} obj - The object defining the popover-info.
 * @returns {string} - The rendered popover HTML.
 */
const popover = (obj) => {
	const { id, label, name, items } = obj;
	return `
	<nav part="nav">
		<button type="button" part="micro" popovertarget="${id}" style="--_an:--${id};">
			${icon('plus')}${label}
		</button>
	</nav>
	<div id="${id}" popover="" style="--_pa:--${id};">
		<fieldset part="fieldset" name="${name}">
			<legend part="legend">${label}</legend>
			CONTENT
			<nav part="nav">
				<button type="button" popovertarget="${id}" popovertargetaction="hide" class="--text fs-xs">Close</button>
				<button type="button" class="bg-success --light fs-xs">Add</button>
			</nav>
		</fieldset>
	</div>`;
};

const richtext = (label, value, attributes = []) => `
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
const select = (label, value, attributes = [], options = []) => `
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
const textarea = (label, value, attributes = []) => `
	<label part="row">
		<span part="label">${label}</span>
		<textarea part="textarea" ${attrs(attributes)}>${value}</textarea>
	</label>
`;

const toolbar = (config) => {
	const buttons = config.map((button) => `
		<button part="button" type="button" ${attrs(button.attributes)}>
			${button.label}
		</button>
	`).join('');
	return `<nav part="nav toolbar">${buttons}</nav>`;

}

/* Export */
const render = {
	all,
	checklist,
	details,
	fieldset,
	grid,
	img,
	input,
	media,
	richtext,
	select,
	textarea,
	toolbar,
	extensions: {},

	extend(name, method) {
		this.extensions[name] = method;
	},

	getMethod(name) {
		return this.extensions[name] || this[name];
	}
};
export { render };