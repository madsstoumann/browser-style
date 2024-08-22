import { attrs, uuid } from './utility.js';

/* Main Render Function */
export function all(data, schema, instance, root = false, pathPrefix = '') {
	let content = Object.entries(schema.properties).map(([key, config]) => {
		const attributes = config?.render?.attributes || [];
		const method = config?.render?.method;
		const renderMethod = instance.getRenderMethod(method);
		const label = config.title || 'LABEL';
		const toolbar = config?.render?.toolbar ? instance.getRenderMethod('toolbar')(config.render.toolbar) : '';

		let options = [];

		if (method === 'select') {
			const optionsKey = config?.render?.options;

			if (Array.isArray(optionsKey)) {
				options = optionsKey;
			} else if (typeof optionsKey === 'string') {
				if (instance.lookup && Array.isArray(instance.lookup[optionsKey])) {
					options = instance.lookup[optionsKey];
				} else {
					const storedOptions = localStorage.getItem(optionsKey);
					if (storedOptions) {
						try {
							options = JSON.parse(storedOptions) || [];
						} catch {
							options = [];
						}
					}
				}
			}
		}

		const path = pathPrefix === 'DISABLE_PATH' ? '' : (pathPrefix ? `${pathPrefix}.${key}` : key);

		if (config.type === 'object') {
			return config.render && method
				? safeRender(renderMethod, { label, value: data[key], attributes, options, config, instance, path, type: config.type })
				: fieldset({ label, content: all(data[key], config, instance, false, path), attributes });
		}

		if (config.type === 'array') {
			const content = method
				? safeRender(renderMethod, { label, value: data[key], attributes, options, config, instance, path, type: config.type }) + toolbar
				: data[key].map((item, index) => all(item, config.items, instance, false, `${path}[${index}]`)).join('');
			return method ? content : fieldset({ label, content, attributes });
		}

		return method
			? safeRender(renderMethod, { label, value: data[key], attributes, options, config, instance, path, type: config.type })
			: '';
	}).join('');

	return root && schema?.render?.toolbar ? content + instance.getRenderMethod('toolbar')(schema.render.toolbar) : content;
}

/* Array Render Method */
export const array = (params) => {
	const { attributes, config, instance, label, path = '', value } = params;
	const content = value.map((item, index) => fieldset({
		label: `${label} ${index + 1}`,
		content: all(item, config.items, instance, false, path ? `${path}[${index}]` : ''),
		attributes
	})).join('');
	return content;
};

/* Autosuggest Render Method */
// export const autosuggest = (params) => {
// 	console.log(params);
// 	const { attributes, path = '' } = params;
// 	return `<auto-suggest part="autosuggest" name="${path}"></auto-suggest>`;
// }

export const autosuggest = ({ autoSuggestConfig, path, formID }) => {
	const { api, key, value, label } = autoSuggestConfig;

	return `
		<auto-suggest 
			part="autosuggest" 
			name="${path}"
			api="${api}"
			api-key="${key}"
			api-value="${value}"
			label="${label}"
			${formID ? `form="${formID}"` : ''}
			></auto-suggest>`;
};

/* Detail/Details Render Methods */
export const detail = ({ value, config, path, instance, attributes = [] }) => {
	const summary = config.render?.summary ? (value[config.render.summary] || config.render.summary) : 'SUMMARY';
	const header = config.render?.label ? (value[config.render.label] || config.render.label) : 'LABEL';

	return `
		<details part="details" ${attrs(attributes)}>
			<summary part="row summary">
				<span part="label">${summary}</span>
				<span part="header">
					${icon('chevron right', 'sm', 'xs')}
					<em>${header}</em>
					${config.render.delete ? `<label><input part="input delete" checked type="checkbox" data-util="removeArrayEntry" data-params='{ "path": "${path}" }'></label>` : ''}
				</span>
			</summary>
			${all(value, config.items, instance, false, path)}
		</details>`;
};

export const details = (params) => {
	const { attributes = [], config, instance, label, path = '', value } = params;

	const content = value.map((item, index) => detail({
		value: item,
		config,
		path: path ? `${path}[${index}]` : '',
		instance,
		attributes
	})).join('');

	const entryContent = config.render?.add ? entry({ config, instance, path }) : '';

	return fieldset({ attributes, content: content + entryContent, label, path });
};

/* Entry Render Method */
export const entry = (params) => {
	const { config, instance, path = '' } = params;
	const formID = `form${uuid()}`;
	const id = `popover-${uuid()}`;
	const label = config.title || 'Add New Entry';
	const autoSuggestConfig = config.render?.autosuggest;

	const fields = Object.entries(config.items.properties)
		.map(([propKey, propConfig]) => {
			const attributes = [...propConfig.render.attributes, { form: formID }];

			if (autoSuggestConfig) {
				// attributes.push({ disabled: 'disabled' });
				attributes.push({ required: 'required' });
			}

			return input({
				label: propConfig.title,
				attributes,
				path: `${path}.${propKey}`,
				type: propConfig.type || 'string',
				value: ''
			});
		}).join('');

	if (!fields) return '';
	instance.parent.insertAdjacentHTML('beforeend', `<form id="${formID}" hidden></form>`);

	return `
		<nav part="nav">
			<button type="button" part="micro" popovertarget="${id}" style="--_an:--${id};">
				${icon('plus')}${label}
			</button>
		</nav>
		<div id="${id}" popover="" style="--_pa:--${id};">
			<fieldset part="fieldset" name="${path}-entry">
				<legend part="legend">${label}</legend>
				${autoSuggestConfig ? autosuggest({ autoSuggestConfig, path, formID }) : ''}
				${fields}
				<nav part="nav">
					<button type="button" form="${formID}" part="close" popovertarget="${id}" popovertargetaction="hide">Close</button>
					<button type="button" form="${formID}" part="success" data-popover="${id}" data-util="addArrayEntry" data-params='{ "path": "${path}" }'>Add</button>
				</nav>
			</fieldset>
		</div>`;
};

/* Fieldset Render Method */
export const fieldset = ({ attributes, content, label, path }) => {
	return `
		<fieldset ${attrs(attributes, '', [{ part: 'fieldset' }])}${path ? ` name="${path}-entry"` : ''}>
			<legend part="legend">${label}</legend>
			${content}
		</fieldset>`;
}

/* Grid Render Method */
export const grid = (params) => {
	const { attributes = [], config, instance, label, path = '', value } = params;
	const content = value.map((item, index) => `<fieldset>${all(item, config.items, instance, false, path ? `${path}[${index}]` : '')}</fieldset>`).join('');
	return fieldset({ label, content, attributes });
}

/* Icon Generation */
const icon = (type, size, stroke) => `<ui-icon type="${type||''}" size="${size||''}" stroke="${stroke||''}"></ui-icon>`;

/* Input Render Method */
export const input = (params) => {
	const { attributes = [], label, path = '', type = 'string', value } = params;
	const checked = attributes.some(attr => attr.type === 'checkbox') && value ? ' checked' : '';
	const hidden = attributes.some(attr => attr.type === 'hidden');
	const output = `<input part="input" value="${value || ''}" ${attrs(attributes, path)} data-type="${type}" ${checked}></input>`;
	return hidden ? output : `<label part="row"><span part="label">${label}</span>${output}</label>`;
}

/* Media Render Method */
export const media = (params) => {
	const { attributes = [], config, label, path = '', value } = params;
	const itemDelete = config.render.delete;
	const itemSrc = config.render?.summary || '';
	const itemValue = config.render?.label || '';

	const mediaItem = (item, path) => `
		<label part="row">
			${itemDelete ? `<input part="input delete" value="${item[itemValue]}"type="checkbox" checked data-util="removeArrayEntry" data-params='{ "path": "${path}" }'>`: ''}
			<img part="img" src="${item[itemSrc]}" alt="">
		</label>`;

	const content = value.map((item, index) => mediaItem(item, path ? `${path}[${index}]` : '')).join('');
	return fieldset({ label, content, attributes });
};

/* Richtext Render Method */
export const richtext = (params) => {
	const { attributes = [], label, path = '', value } = params;
	return `
		<div part="row">
			<span part="label">${label}</span>
			<rich-text part="richtext" ${attrs(attributes, path)}>
				${value}
			</rich-text>
		</div>`;
};

/* Select Render Method */
export const select = (params) => {
	const { attributes = [], label, options = [], path = '', type = 'string', value } = params;
	return `
		<label part="row">
			<span part="label">${label}</span>
			<select part="select" ${attrs(attributes, path, [], ['type'])} data-type="${type}">
				${options.map(option => `
					<option value="${option.value}" ${option.value === value ? 'selected' : ''}>
						${option.label}
					</option>
				`).join('')}
			</select>
		</label>`;
};

/* Textarea Render Method */
export const textarea = (params) => {
	const { attributes = [], label, path = '', value } = params;
	return `
		<label part="row">
			<span part="label">${label}</span>
			<textarea part="textarea" ${attrs(attributes, path)}>${value}</textarea>
		</label>`;
};

/* Toolbar Generation */
export const toolbar = (config) => {
	const buttons = config.map((button) => `
		<button part="button" type="button" ${attrs(button.attributes)}>
			${button.label}
		</button>
	`).join('');
	return `<nav part="nav toolbar">${buttons}</nav>`;
}

// Render method wrapper with error handling
function safeRender(renderMethod, params) {
	try {
		return renderMethod(params);
	} catch {
		return '';
	}
}
