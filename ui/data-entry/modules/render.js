import { attrs, getObjectByPath, isEmpty, setObjectByPath, toCamelCase, uuid } from './utility.js';

/* Main Render Function */
export function all(data, schema, instance, root = false, pathPrefix = '', form = null) {
	let content = Object.entries(schema.properties).map(([key, config]) => {
		const attributes = config?.render?.attributes || [];
		const method = config?.render?.method ? toCamelCase(config.render.method) : '';
		const renderMethod = instance.getRenderMethod(method);
		const label = config.title || 'LABEL';

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
				? safeRender(renderMethod, { label, value: data[key], attributes, options, config, instance, path, type: config.type })
				: data[key].map((item, index) => all(item, config.items, instance, false, `${path}[${index}]`)).join('');
			return method ? content : fieldset({ label, content, attributes });
		}

		return method
			? safeRender(renderMethod, { label, value: data[key], attributes, options, config, instance, path, type: config.type })
			: '';
	}).join('');

	if (form) {
		form.innerHTML = content;

		if (root && schema.form) {
			const buttonsHTML = schema.form
				.map(entry => {
					if (entry.type === 'submit') {
						return `<button type="submit" part="button">${entry.label}</button>`;
					} else if (entry.type === 'reset') {
						return `<button type="reset" part="button">${entry.label}</button>`;
					} else {
						return `<button type="button" 
										part="button method-${entry.method.toLowerCase()}" 
										data-action="${entry.action}" 
										data-method="${entry.method}" 
										data-content-type="${entry.contentType || 'form'}"
										${entry.autoSave !== undefined ? `data-auto-save="${entry.autoSave}"` : ''}>
							${entry.label}
						</button>`;
					}
				}).join('');
			form.innerHTML += `<nav part="nav">${buttonsHTML}</nav>`;
		}

		if (schema.messages && schema.messages.length > 0) {
			form.innerHTML += `<ui-toast></ui-toast>`;
		}

		return;
	}

	return content;
}

/* Autosuggest Method */
export const autosuggest = (params) => {
	const config = params.config?.render?.autosuggest || null;
	if (!config) return '';

	const { api, apiArrayPath, apiDisplayPath, apiTextPath, apiValuePath, defaults, label, mapping } = config;
	const { path, formID } = params;

	let display = '';
	let initialObject = null;
	let name = path;
	let value = '';

	if (defaults && params.value) {
		display = getObjectByPath(params.value, defaults.display) || '';
		value = getObjectByPath(params.value, defaults.value) || '';

		initialObject = {};
		setObjectByPath(initialObject, `${path}.${defaults.display}`, display);
		setObjectByPath(initialObject, `${path}.${defaults.value}`, value);

		if (defaults.value) {
			name = `${path}.${defaults.value}`;
		}
	}

	return `
	<auto-suggest 
		${api ? `api="${api}"` : ''}
		${apiArrayPath ? `api-array-path="${apiArrayPath}"` : ''}
		${apiDisplayPath ? `api-display-path="${apiDisplayPath}"` : ''}
		${apiTextPath ? `api-text-path="${apiTextPath}"` : ''}
		${apiValuePath ? `api-value-path="${apiValuePath}"` : ''}
		${display ? `display="${display}"` : ''}
		${label ? `label="${label}"` : ''}
		name="${name}"
		part="autosuggest" 
		${config.syncInstance ? `sync-instance="${config.syncInstance}"` : ''}
		${value ? `value="${value}"` : ''}
		${initialObject && !isEmpty(initialObject) ? `initial-object='${JSON.stringify(initialObject)}'` : ''}
		${mapping ? `data-mapping='${JSON.stringify(mapping)}'` : ''}
		${formID ? `form="${formID}"` : ''}></auto-suggest>`;
};

/* Array Checkboxes Render Method */
export const arrayCheckbox = (params) => {
	const { attributes = [], config, label, path = '', value } = params;
	const content = value.map((item, index) => {
	const checked = config.render?.summary ? !!item[config.render.summary] : false;
	const header = config.render?.label ? (item[config.render.label] || config.render.label) : 'LABEL';

	return `
		<label part="row">
			<span part="label">${header}</span>
			<input part="input" type="checkbox" name="${path}[${index}].${config.render?.summary || ''}" data-type="boolean"${checked ? ' checked' : ''}>
		</label>`
	}).join('');

	return fieldset({ attributes, content, label, path });
};

/* Array Detail/Details Render Methods */
export const detail = ({ value, config, path, instance, attributes = [] }) => {
	const summary = config.render?.summary ? (value[config.render.summary] || config.render.summary) : 'SUMMARY';
	const header = config.render?.label ? (value[config.render.label] || config.render.label) : 'LABEL';

	return `
		<details part="array-details" ${attrs(attributes)}>
			<summary part="row summary">
				<span part="label">${summary}</span>
				<span part="header">
					${icon('chevron right', 'sm', 'xs')}
					<em>${header}</em>
					${config.render.delete ? `<label><input part="input delete" checked type="checkbox" name="${path}" data-array-control="true"></label>` : ''}
				</span>
			</summary>
			${all(value, config.items, instance, false, path)}
		</details>`;
};

export const arrayDetails = (params) => {
	const { attributes = [], config, instance, label, path = '', value } = params;
	const disableInputs = !!config.render?.autosuggest;

	if (disableInputs) {
		Object.values(config.items.properties).forEach(propConfig => {
			propConfig.render.attributes.push({ disabled: 'disabled' });
		});
	}

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
	const renderAutoSuggest = !!config.render?.autosuggest;

	const fields = Object.entries(config.items.properties)
		.map(([propKey, propConfig]) => {
			const attributes = [...propConfig.render.attributes, { form: formID }];

			if (renderAutoSuggest) {
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
	instance.parent.insertAdjacentHTML('beforeend', `<form id="${formID}" data-popover="${id}" hidden></form>`);

	return `
		<nav part="nav">
			<button type="button" part="micro" popovertarget="${id}" style="--_an:--${id};">
				${icon('plus')}${label}
			</button>
		</nav>
		<div id="${id}" popover="" style="--_pa:--${id};">
			<fieldset part="fieldset" name="${path}-entry">
				<legend part="legend">${label}</legend>
				${renderAutoSuggest ? autosuggest({ config, path, formID }) : ''}
				${fields}
				<nav part="nav">
					<button type="button" form="${formID}" part="close" popovertarget="${id}" popovertargetaction="hide">Close</button>
					<button type="button" form="${formID}" part="success" data-util="addArrayEntry" data-params='{ "path": "${path}" }'>Add</button>
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
export const arrayGrid = (params) => {
	const { attributes = [], config, instance, label, path = '', value } = params;
	const content = value.map((item, index) => `<fieldset>${all(item, config.items, instance, false, path ? `${path}[${index}]` : '')}</fieldset>`).join('');
	return fieldset({ label, content, attributes });
}

/* Icon Generation */
const icon = (type, size, stroke) => `<ui-icon type="${type||''}" size="${size||''}" stroke="${stroke||''}"></ui-icon>`;

/* Input Render Method */
export const input = (params) => {
	const { attributes = [], label, path = '', type = 'string', value } = params;
	const hiddenLabel = attributes.some(attr => attr['hidden-label'] === true);
	const filteredAttributes = attributes.filter(attr => !('hidden-label' in attr));
	const checked = filteredAttributes.some(attr => attr.type === 'checkbox') && value ? ' checked' : '';
	const hidden = filteredAttributes.some(attr => attr.type === 'hidden');

	// Prepare the input element
	const output = `<input part="input" value="${value !== undefined && value !== null ? value : ''}" ${attrs(filteredAttributes, path)} data-type="${type}" ${checked}></input>`;

	// Return the appropriate HTML based on the presence of 'hidden' and 'hidden-label' attributes
	return hidden 
			? output 
			: `<label part="row" ${hiddenLabel ? 'hidden' : ''}><span part="label">${label}</span>${output}</label>`;
};

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

/* Number Spinner */
export const numberSpinner = (params) => {
	const { attributes = [], label, path = '', value } = params;
	return `
		<number-spinner ${attrs(attributes, path, [], [], ['min', 'max', 'step'])} label="${label}" value="${value}" no-styles no-shadow>
			<ui-icon type="minus" slot="icon-minus"></ui-icon>
			<ui-icon type="plus" slot="icon-plus"></ui-icon>
		</number-spinner>`;
};

/* Richtext Render Method */
export const richtext = (params) => {
	const { attributes = [], label, path = '', value } = params;
	return `
		<div part="row">
			<span part="label">${label}</span>
			<rich-text part="richtext" event-mode="input" ${attrs(attributes, path)}>
				${value || ''}
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

// Render method wrapper with error handling
function safeRender(renderMethod, params) {
	try {
		return renderMethod(params);
	} catch {
		return '';
	}
}
