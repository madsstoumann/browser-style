import { attrs, uuid } from './utility.js';

export function all(data, schema, instance, root = false, pathPrefix = '') {
	let content = Object.entries(schema.properties).map(([key, config]) => {
			const attributes = config?.render?.attributes || [];
			const method = config?.render?.method;
			const renderMethod = instance.getRenderMethod(method);
			const label = config.title || 'LABEL';
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

			// If pathPrefix is 'DISABLE_PATH', set path to an empty string, thus bypassing dotted path generation
			const path = pathPrefix === 'DISABLE_PATH' ? '' : (pathPrefix ? `${pathPrefix}.${key}` : key);

			// Include the type from the schema in the parameters passed to the renderMethod
			if (config.type === 'object') {
				if (config.render && method) {
					try {
						return renderMethod({ label, value: data[key], attributes, options, config, instance, path, type: config.type });
					} catch {
						return '';
					}
				} else {
					return fieldset({ label, content: all(data[key], config, instance, false, path), attributes });
				}
			} else if (config.type === 'array') {
				if (method) {
					try {
						const addEntry = config.render?.entry ? instance.getRenderMethod('entry')({ obj: config.render.entry, key, instance }) : '';
						return renderMethod({ label, value: data[key], attributes, options, config, instance, path, type: config.type }) + addEntry + toolbar;
					} catch {
						return '';
					}
				} else if (config.items) {
						return data[key].map((item, index) => {
							const itempath = `${path}[${index}]`;
							return all(item, config.items, instance, false, itempath);
						}).join('');
				}
			}

			if (method) {
				try {
					return renderMethod({ label, value: data[key], attributes, options, config, instance, path, type: config.type });
				} catch {
					return '';
			}
		}
		return '';
	}).join('');

	return root && schema?.render?.toolbar ? content + instance.getRenderMethod('toolbar')(schema.render.toolbar) : content;
}


/* ARRAY */
export const array = (params) => {
	const { attributes, config, instance, label, path = '', value } = params;
	return value.map((item, index) => fieldset({ label: `${label} ${index + 1}`, content: all(item, config.items, instance, false, path ? `${path}[${index}]` : ''), attributes })).join('');
};

/* AUTOSUGGEST */
export const autosuggest = (params) => {
	const { attributes, path = '' } = params;
	return `<auto-suggest part="autosuggest" name="${path}" ${attrs(attributes)}></auto-suggest>`;
}

/* CHECKLIST */
export const checklist = (params) => {
	const { attributes, config, label, path = '', value } = params;
	return fieldset({
		label,
		content: value.map((item, index) => arraylistItem(item, config.items, path ? `${path}[${index}]` : '')).join(''),
		attributes
	});
}

/* DETAILS */
export const details = (params) => {
	const { attributes = [], config, instance, label, path = '', value } = params;

	const detail = (value, config, path) => {
		const summary = config.render?.summary ? (value[config.render.summary] || config.render.summary) : 'SUMMARY';
		const header = config.render?.label ? (value[config.render.label] || config.render.label) : 'LABEL';

		return `
			<details part="details" ${attrs(attributes)}>
				<summary part="row summary">
					<span part="label">${summary}</span>
					<span part="header">
						${icon('chevron right', 'sm', 'xs')}
						<em>${header}</em>
						${config.render.delete ? `<label><input part="input" checked class="bg-gray --fs-lg --cross" type="checkbox" data-util="removeArrayEntry" data-path="${path}"></label>` : ''}
					</span>
				</summary>
				${all(value, config.items, instance, false, path)}
			</details>`;
	};

	const content = value.map((item, index) => detail(item, config, path ? `${path}[${index}]` : '')).join('');

	// Generate the entry form if config.render.add is true
	let entryContent = '';
	if (config.render?.add) {
		entryContent = entry({ config, path });
	}

	return fieldset({
		label,
		content: content + entryContent,
		attributes
	});
};

/* ENTRY */
export const entry = (params) => {
	const { config, path = '' } = params;
	const id = `popover-${uuid()}`; // Unique ID for the popover
	const label = config.title || 'Add New Entry';

	// Generate the form fields using the input method for each property
	const fields = Object.entries(config.items.properties)
		.map(([propKey, propConfig]) => {
			return input({
				label: propConfig.title,
				attributes: propConfig.render.attributes,
				path: `${path}.${propKey}`,
				type: propConfig.type || 'string',
				value: '' // Default to empty since it's for a new entry
			});
		})
		.join('');

	return `
		<nav part="nav">
			<button type="button" part="micro" popovertarget="${id}" style="--_an:--${id};">
				${icon('plus')}${label}
			</button>
		</nav>
		<div id="${id}" popover="" style="--_pa:--${id};">
			<fieldset part="fieldset" name="${path}-entry">
				<legend part="legend">${label}</legend>
				${fields}
				<nav part="nav">
					<button type="button" popovertarget="${id}" popovertargetaction="hide" class="--text fs-xs">Close</button>
					<button type="button" class="bg-success --light fs-xs" data-util="addArrayEntry" data-path="${path}">Add</button>
				</nav>
			</fieldset>
		</div>`;
};

/* FIELDSET */
export const fieldset = (params) => {
	const { attributes = [], content, label } = params;
	return `
		<fieldset ${attrs(attributes, [{ part: 'fieldset' }])}>
			<legend part="legend">${label}</legend>
			${content}
		</fieldset>`;
};

/* GRID */
export const grid = (params) => {
	const { attributes = [], config, instance, label, path = '', value } = params;
	return fieldset({
		label,
		content: value.map((item, index) => `<fieldset>${all(item, config.items, instance, false, path ? `${path}[${index}]` : '')}</fieldset>`).join(''),
		attributes
	});
}

/* ICON */
const icon = (type = 'triangle right', size = 'md', stroke = '') => `<ui-icon type="${type}" size="${size}" stroke="${stroke}"></ui-icon>`;

/* INPUT */
export const input = (params) => {
	const { attributes = [], label, path = '', type = 'string', value } = params;
	const checked = attributes.some(attr => attr.type === 'checkbox') && value ? ' checked' : '';
	const hidden = attributes.some(attr => attr.type === 'hidden');
	const output = `<input part="input" value="${value || ''}" ${attrs(attributes, [], path)} data-type="${type}" ${checked}></input>`;
	return hidden ? output : `<label part="row"><span part="label">${label}</span>${output}</label>`;
}

/* MEDIA */
export const media = (params) => {
	const { attributes = [], config, label, path = '', value } = params;
	const itemDelete = config.render.delete;
	const itemSrc = config.render?.summary || '';
	const itemValue = config.render?.label || '';

	const mediaItem = (item, config, path) => {
		console.log(config)
		return `
		<label part="row">
			${itemDelete ? `<input part="input" value="${item[itemValue]}" name="${path}.${itemValue}" type="checkbox" class="bg-gray --fs-lg --cross" checked>`: ''}
			<img part="img" src="${item[itemSrc]}" alt="">
		</label>`;
	}
	return fieldset({
		label,
		content: value.map((item, index) => mediaItem(item, config.items, path ? `${path}[${index}]` : '')).join(''),
		attributes
	});
};

/* RICHTEXT */
export const richtext = (params) => {
	const { attributes = [], label, path = '', value } = params;
	return `
		<div part="row">
			<span part="label">${label}</span>
			<rich-text part="richtext" ${attrs(attributes, [], path)}>
				${value}
			</rich-text>
		</div>`;
};

/* SELECT */
export const select = (params) => {
	const { attributes = [], label, options = [], path = '', value } = params;
	return `
		<label part="row">
			<span part="label">${label}</span>
			<select part="select" ${attrs(attributes, [], path)}>
				${options.map(option => `
					<option value="${option.value}" ${option.value === value ? 'selected' : ''}>
						${option.label}
					</option>
				`).join('')}
			</select>
		</label>
	`;
};

/* TEXTAREA */
export const textarea = (params) => {
	const { attributes = [], label, path = '', value } = params;
	return `
		<label part="row">
			<span part="label">${label}</span>
			<textarea part="textarea" ${attrs(attributes, [], path)}>${value}</textarea>
		</label>
	`;
};

/* TOOLBAR */
export const toolbar = (config) => {
	const buttons = config.map((button) => `
		<button part="button" type="button" ${attrs(button.attributes)}>
			${button.label}
		</button>
	`).join('');
	return `<nav part="nav toolbar">${buttons}</nav>`;
}
