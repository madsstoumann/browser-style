import { attrs, fetchOptions, getObjectByPath, isEmpty, setObjectByPath, resolveTemplateString, safeRender, t, toCamelCase, uuid } from './utility.js';

/**
 * Renders the form elements based on the provided data and schema.
 *
 * @param {Object} data - The data to populate the form.
 * @param {Object} schema - The schema defining the form structure.
 * @param {Object} instance - The instance of the current component.
 * @param {boolean} [root=false] - Whether this is the root form.
 * @param {string} [pathPrefix=''] - The prefix for the data path.
 * @param {HTMLFormElement|null} [form=null] - The form element to render the content into.
 * @returns {string|void} - The generated HTML content or updates the form directly.
 */
export function all(data, schema, instance, root = false, pathPrefix = '', form = null) {
	const nonArrayContent = [];
	const arrayContent = [];
	const renderNav = schema.navigation;
	const headline = schema.headline ? resolveTemplateString(schema.headline, data, instance.lang, instance.i18n) : '';
	const title = schema.title ? resolveTemplateString(schema.title, data, instance.lang, instance.i18n) : '';
	let navContent = '';

	// Iterate over schema properties
	Object.entries(schema.properties).forEach(([key, config]) => {
		const attributes = config?.render?.attributes || [];
		const method = config?.render?.method ? toCamelCase(config.render.method) : '';
		const renderMethod = instance.getRenderMethod(method);
		const label = resolveTemplateString(config.title, data, instance.lang, instance.i18n) || 'LABEL';
		const options = method === 'select' ? fetchOptions(config, instance) : [];
		const path = pathPrefix === 'DISABLE_PATH' ? '' : (pathPrefix ? `${pathPrefix}.${key}` : key);

		// Handle different data types (object, array, others)
		if (config.type === 'object') {
			const content = all(data[key], config, instance, false, path);
			const objectContent = config.render && method
				? safeRender(renderMethod, { label, value: data[key], attributes, options, config, instance, path, type: config.type })
				: fieldset({ label, content, attributes });
			nonArrayContent.push(objectContent);
		} else if (config.type === 'array') {
			if (renderNav) {
				navContent += `<a href="#section_${path}" part="link">${label}</a>`;
			}
			const content = method
				? safeRender(renderMethod, { label, value: data[key], attributes, options, config, instance, path, type: config.type })
				: data[key].map((item, index) => all(item, config.items, instance, false, `${path}[${index}]`)).join('');
			arrayContent.push(method ? content : fieldset({ label, content, attributes }));
		} else {
			nonArrayContent.push(method
				? safeRender(renderMethod, { label, value: data[key], attributes, options, config, instance, path, type: config.type })
				: '');
		}
	});

	const fieldsetContent = (root && nonArrayContent.length)
		? `<fieldset part="fieldset" id="section_root">${title ? `<legend part="legend">${title}</legend>` : ''}${nonArrayContent.join('')}</fieldset>`
		: nonArrayContent.join('');
	const arrayContentHtml = arrayContent.join('');
	const innerContent = `${fieldsetContent} ${arrayContentHtml}`;

	if (form || root) {
		const navElement = renderNav ? `<nav part="${renderNav}">${title ? `<a href="#section_root" part="link">${title}</a>`:''}${navContent}</nav>` : '';
		const headlineElement = headline ? `<strong part="title">${headline}</strong>` : '';
		const headerContent = (headlineElement || navElement) ? `<header part="header">${navElement}${headlineElement}</header>` : '';
		let footerContent = `<ui-toast></ui-toast>`;

		if (schema.form) {
			// Set root-level form attributes if available
			if (schema.form.action) {
				form.setAttribute('action', schema.form.action);
			}
			if (schema.form.method) {
				form.setAttribute('method', schema.form.method);
			}
			if (schema.form.enctype) {
				const formEnctype = schema.form.enctype === 'json' ? 'application/json' 
					: schema.form.enctype === 'form' ? 'multipart/form-data' 
					: schema.form.enctype;
				form.setAttribute('enctype', formEnctype);
			}
			if (schema.form.autoSave !== undefined) {
				form.setAttribute('data-auto-save', schema.form.autoSave);
			}
		
			// Generate buttons from the form.buttons array
			const buttonsHTML = schema.form.buttons
		.map(entry => {
			const commonAttributes = Object.keys(entry)
				.filter(key => key !== 'label' && key !== 'class')
				.map(key => `data-${key}="${entry[key]}"`)
				.join(' ');

			const classAttribute = entry.class ? ` class="${entry.class}"` : '';

			return `<button type="${entry.type || 'button'}" part="button" ${commonAttributes}${classAttribute}>${
				resolveTemplateString(entry.label, data, instance.lang, instance.i18n)}</button>`;
			}).join('');
			footerContent += `<nav part="nav">${buttonsHTML}</nav>`;
		}

		const rootContent = `${headerContent}<div part="main">${innerContent}</div><footer part="footer">${footerContent}</footer>`;

		if (form) {
			form.innerHTML = rootContent;
			return;
		}
		return rootContent;
	}
	return innerContent;
}

/**
 * Generates an autosuggest HTML element based on the provided configuration and parameters.
 *
 * @param {Object} params - The parameters for rendering the autosuggest element.
 * @param {Object} params.config - The configuration object for rendering.
 * @param {Object} params.config.render - The render configuration.
 * @param {Object} params.config.render.autosuggest - The autosuggest configuration.
 * @param {string} [params.config.render.autosuggest.api] - The API endpoint for fetching suggestions.
 * @param {string} [params.config.render.autosuggest.apiArrayPath] - The path to the array of suggestions in the API response.
 * @param {string} [params.config.render.autosuggest.apiDisplayPath] - The path to the display value in the API response.
 * @param {string} [params.config.render.autosuggest.apiTextPath] - The path to the text value in the API response.
 * @param {string} [params.config.render.autosuggest.apiValuePath] - The path to the value in the API response.
 * @param {Object} [params.config.render.autosuggest.defaults] - Default values for the autosuggest element.
 * @param {string} [params.config.render.autosuggest.defaults.display] - The default display value.
 * @param {string} [params.config.render.autosuggest.defaults.value] - The default value.
 * @param {string} [params.config.render.autosuggest.label] - The label for the autosuggest element.
 * @param {Object} [params.config.render.autosuggest.mapping] - Mapping configuration for the autosuggest element.
 * @param {string} [params.config.render.autosuggest.syncInstance] - Sync instance identifier.
 * @param {string} params.path - The path for the autosuggest element.
 * @param {string} [params.formID] - The form ID to which the autosuggest element belongs.
 * @param {Object} [params.value] - The initial value for the autosuggest element.
 * @returns {string} The HTML string for the autosuggest element.
 */
export const autosuggest = (params) => {
	const config = params.config?.render?.autosuggest;
	if (!config) return '';

	const {
		api,
		apiArrayPath,
		apiDisplayPath,
		apiTextPath,
		apiValuePath,
		defaults,
		label,
		mapping,
		syncInstance
	} = config;
	const { path, formID, value: paramValue } = params;

	const display = defaults && paramValue ? getObjectByPath(paramValue, defaults.display) || '' : '';
	const value = defaults && paramValue ? getObjectByPath(paramValue, defaults.value) || '' : '';
	const name = defaults?.value ? `${path}.${defaults.value}` : path;

	const initialObject = defaults && paramValue ? {
		[`${path}.${defaults.display}`]: display,
		[`${path}.${defaults.value}`]: value
	} : null;

	return `
		<auto-suggest 
			${api ? `api="${api}"` : ''}
			${apiArrayPath ? `api-array-path="${apiArrayPath}"` : ''}
			${apiDisplayPath ? `api-display-path="${apiDisplayPath}"` : ''}
			${apiTextPath ? `api-text-path="${apiTextPath}"` : ''}
			${apiValuePath ? `api-value-path="${apiValuePath}"` : ''}
			${display ? `display="${display}"` : ''}
			${label ? `label="${label}"` : ''}
			list-mode="ul"
			name="${name}"
			part="autosuggest" 
			${syncInstance ? `sync-instance="${syncInstance}"` : ''}
			${value ? `value="${value}"` : ''}
			${initialObject && !isEmpty(initialObject) ? `initial-object='${JSON.stringify(initialObject)}'` : ''}
			${mapping ? `data-mapping='${JSON.stringify(mapping)}'` : ''}
			${formID ? `form="${formID}"` : ''}></auto-suggest>`;
};

/**
 * Generates a set of checkboxes based on the provided parameters.
 *
 * @param {Object} params - The parameters for generating the checkboxes.
 * @param {Array} [params.attributes=[]] - Additional attributes for the fieldset.
 * @param {Object} params.config - Configuration object for rendering the checkboxes.
 * @param {string} params.config.render.value - The key to determine if a checkbox is checked.
 * @param {string} params.config.render.label - The key to determine the label of each checkbox.
 * @param {string} params.label - The label for the fieldset.
 * @param {string} [params.path=''] - The path for the checkbox name attribute.
 * @param {Array} params.value - The array of values to generate checkboxes from.
 * @returns {string} The HTML string for the fieldset containing the checkboxes.
 */
export const arrayCheckbox = (params) => {
	const { attributes = [], config, label, path = '', value } = params;
	const content = value.map((item, index) => {
		const checked = config.render?.value ? !!item[config.render.value] : false;
		const rowLabel = config.render?.label ? (item[config.render.label] || config.render.label) : 'LABEL';

		return `
			<label part="row">
				<span part="label">${rowLabel}</span>
				<input part="input" type="checkbox" value="${item[config.render.value]}" name="${path}[${index}].${config.render?.value || ''}" data-type="boolean"${checked ? ' checked' : ''}>
			</label>`;
	}).join('');

	return fieldset({ attributes, content, label, path });
};

/**
 * Renders a detail element with a summary and content based on the provided configuration.
 *
 * @param {Object} params - The parameters for rendering the array detail element.
 * @param {*} params.value - The value to be rendered.
 * @param {Object} params.config - The configuration object for rendering.
 * @param {string} params.path - The path to the current element.
 * @param {Object} params.instance - The instance of the current element.
 * @param {Array} [params.attributes=[]] - Additional attributes for the detail element.
 * @param {string} [params.name=''] - The name attribute for the detail element.
 * @returns {string} The rendered array detail element as an HTML string.
 */
export const arrayDetail = ({ value, config, path, instance, attributes = [], name = '', index }) => {
	const rowLabel = config.render?.label 
		? resolveTemplateString(config.render.label, value, instance.lang, instance.i18n) 
		: 'label';
	const rowValue = config.render?.value 
		? resolveTemplateString(config.render.value, value, instance.lang, instance.i18n) 
		: 'value';

	const cols = rowValue.split('|').map(col => `<span>${col}</span>`).join('');
	const arrayControl = config.render?.arrayControl || 'mark-remove';

	return `
		<details part="array-details" ${attrs(attributes)}${name ? ` name="${name}"`:''}>
			<summary part="row summary">
				<output part="label" name="label_${name}[${index}]">${rowLabel}</output>
				<span part="value">
					${icon('chevron right', 'sm', 'xs')}
					<output name="value_${name}[${index}]">${cols}</output>
					${config.render?.delete ? `<label><input part="input delete" checked type="checkbox" name="${path}" data-array-control="${arrayControl}"></label>` : ''}
				</span>
			</summary>
			${all(value, config.items, instance, false, path)}
		</details>`;
};

/**
 * Generates HTML content for an array of details and optionally an entry field.
 *
 * @param {Object} params - The parameters for rendering the array details.
 * @param {Array} [params.attributes=[]] - The attributes to be applied to the fieldset.
 * @param {Object} params.config - The configuration object for rendering.
 * @param {Object} params.instance - The instance object related to the rendering context.
 * @param {string} params.label - The label for the fieldset.
 * @param {string} [params.path=''] - The path to the current fieldset in the data structure.
 * @param {Array} params.value - The array of values to be rendered as details.
 * @returns {string} The generated HTML content for the array details and entry field.
 */
export const arrayDetails = (params) => {
	const { attributes = [], config, instance, label, path = '', value } = params;
	const content = value.map((item, index) => arrayDetail({
		value: item,
		config,
		path: path ? `${path}[${index}]` : '',
		instance,
		attributes,
		name: path,
		index
	})).join('');

	const entryContent = config.render?.add ? entry({ config, instance, path }) : '';
	return fieldset({ attributes, content: `${content}${entryContent}`, label, path });
};

/**
 * Generates an HTML string representing a grid of fieldsets based on the provided parameters.
 *
 * @param {Object} params - The parameters for generating the grid.
 * @param {Array} [params.attributes=[]] - An array of attributes to be applied to the fieldset.
 * @param {Object} params.config - Configuration object for the items.
 * @param {Object} params.instance - The instance object.
 * @param {string} params.label - The label for the fieldset.
 * @param {string} [params.path=''] - The path for the fieldset.
 * @param {Array} params.value - The array of values to be rendered in the grid.
 * @returns {string} The generated HTML string representing the grid of fieldsets.
 */
export const arrayGrid = (params) => {
	const { attributes = [], config, instance, label, path = '', value } = params;
	const content = value.map((item, index) => {
		const itemPath = path ? `${path}[${index}]` : '';
		return `<fieldset>${all(item, config.items, instance, false, itemPath)}</fieldset>`;
	}).join('');
	return fieldset({ label, content, attributes, path });
};

/**
 * Renders a data entry form based on the provided configuration.
 *
 * @param {Object} params - The parameters for rendering the entry form.
 * @param {Object} params.config - The configuration object for the form.
 * @param {Object} params.config.items - The items configuration for the form fields.
 * @param {Object} params.config.items.properties - The properties of the items to be rendered as form fields.
 * @param {string} [params.config.title] - The title of the form.
 * @param {boolean} [params.config.render.autosuggest] - Flag to determine if autosuggest should be rendered.
 * @param {Object} params.instance - The instance object containing the parent element.
 * @param {HTMLElement} params.instance.parent - The parent element where the form will be inserted.
 * @param {string} [params.path=''] - The path for the form fields.
 * @returns {string} The HTML string for the rendered entry form.
 */
export const entry = (params) => {
	const { config, instance, path = '' } = params;
	const formID = `form${uuid()}`;
	const id = `popover-${uuid()}`;
	const label = config.title || 'Add New Entry';
	const renderAutoSuggest = !!config.render?.autosuggest;

	const fields = Object.entries(config.items.properties)
		.map(([propKey, propConfig]) => {
			const attributes = [...(propConfig.render?.attributes || []), { form: formID }];
			attributes.forEach(attr => {
				if ('value' in attr) {
					attr.value = resolveTemplateString(attr.value, instance.data, instance.lang, instance.i18n);
				}
			});

			const renderMethod = propConfig.render?.method || 'input';
			const options = renderMethod === 'select' ? fetchOptions(propConfig, instance) : [];
			const renderFunction = renderMethod === 'select' ? select : input;

			return renderFunction({
				attributes,
				label: propConfig.title,
				options,
				path: `${path}.${propKey}`,
				type: propConfig.type || 'string'
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
					<button type="button" form="${formID}" part="button close" popovertarget="${id}" popovertargetaction="hide">${t('close', instance.lang, instance.i18n)}</button>
					<button type="reset" form="${formID}" part="button reset">${t('reset', instance.lang, instance.i18n)}</button>
					<button type="submit" form="${formID}" part="button add" data-custom="addArrayEntry" data-params='{ "path": "${path}" }'>${t('add', instance.lang, instance.i18n)}</button>
				</nav>
			</fieldset>
		</div>`;
};

/**
 * Generates an HTML fieldset element with the provided attributes, content, label, and path.
 *
 * @param {Object} options - The options for the fieldset.
 * @param {Object} options.attributes - The attributes to be added to the fieldset element.
 * @param {string} options.content - The inner HTML content of the fieldset.
 * @param {string} options.label - The label for the fieldset, which will be used in the legend element.
 * @param {string} [options.path] - An optional path that will be used to generate the fieldset's ID and name attributes.
 * @returns {string} The generated HTML string for the fieldset element.
 */
export const fieldset = ({ attributes, content, label, path }) => {
	const fieldsetId = path ? `section_${path}` : '';
	const fieldsetAttributes = attrs(attributes, '', [{ part: 'fieldset' }]);
	const nameAttribute = path ? ` name="${path}-entry"` : '';

	return `
		<fieldset id="${fieldsetId}" ${fieldsetAttributes}${nameAttribute}>
			<legend part="legend">${label}</legend>
			${content}
		</fieldset>`;
};

/**
 * Generates an HTML string for a UI icon component.
 *
 * @param {string} type - The type of the icon.
 * @param {string} size - The size of the icon.
 * @param {string} stroke - The stroke of the icon.
 * @returns {string} The HTML string for the UI icon component.
 */
const icon = (type, size, stroke) => `<ui-icon type="${type||''}" size="${size||''}" stroke="${stroke||''}"></ui-icon>`;

/**
 * Generates an HTML input element with specified attributes and value.
 *
 * @param {Object} params - The parameters for the input element.
 * @param {Array} [params.attributes=[]] - An array of attribute objects for the input element.
 * @param {string} params.label - The label for the input element.
 * @param {string} [params.path=''] - The path for the input element.
 * @param {string} [params.type='string'] - The type of the input element.
 * @param {string|number|boolean} params.value - The value of the input element.
 * @returns {string} The HTML string for the input element, optionally wrapped in a label.
 */
export const input = (params) => {
	const { attributes = [], instance, label, path = '', type = 'string', value } = params;
	const finalValue = value ?? attributes.find(attr => attr.value !== undefined)?.value ?? '';
	const filteredAttributes = attributes.filter(attr => !('value' in attr));
	const hiddenLabel = filteredAttributes.some(attr => attr['hidden-label']);
	const checked = filteredAttributes.some(attr => attr.type === 'checkbox') && finalValue ? ' checked' : '';
	const hidden = filteredAttributes.some(attr => attr.type === 'hidden');
	const isRequired = filteredAttributes.some(attr => attr.required === 'required');
	const inputElement = `<input part="input" value="${finalValue}" ${attrs(filteredAttributes, path)} data-type="${type}" ${checked}>`;

	return hidden 
		? inputElement 
		: `<label part="row" ${hiddenLabel ? 'hidden' : ''}>
			<span part="label">${isRequired ? `<abbr title="${t('required', instance.lang, instance.i18n)}">*</abbr>` : ''}${label}</span>
			${inputElement}
		</label>`;
};

/**
 * Renders a media fieldset with provided parameters.
 *
 * @param {Object} params - The parameters for rendering the media fieldset.
 * @param {Array} [params.attributes=[]] - Additional attributes for the fieldset.
 * @param {Object} params.config - Configuration object for rendering.
 * @param {Object} params.config.render - Render configuration.
 * @param {boolean} params.config.render.delete - Flag to determine if delete checkbox should be rendered.
 * @param {string} [params.config.render.summary] - Path to the summary image source.
 * @param {string} [params.config.render.label] - Path to the label value.
 * @param {string} [params.label] - Label for the fieldset.
 * @param {string} [params.path=''] - Path for the fieldset.
 * @param {Array} params.value - Array of media items to be rendered.
 * @returns {string} - The rendered HTML string for the media fieldset.
 */
export const media = (params) => {
	const { attributes = [], config, label, path = '', value } = params;
	const { delete: itemDelete, summary: itemSrc = '', label: itemValue = '' } = config.render || {};

	const mediaItem = (item, itemPath) => `
		<label part="row">
			${itemDelete ? `<input part="input delete" value="${item[itemValue]}" type="checkbox" checked data-custom="removeArrayEntry" data-params='{ "path": "${itemPath}" }'>` : ''}
			<img part="img" src="${item[itemSrc]}" alt="">
		</label>`;

	const content = value.map((item, index) => mediaItem(item, path ? `${path}[${index}]` : '')).join('');
	return fieldset({ label, content, attributes, path });
};

/**
 * Generates a rich text input field as an HTML string.
 *
 * @param {Object} params - The parameters for the rich text input field.
 * @param {Array} [params.attributes=[]] - An array of attributes to be added to the rich text element.
 * @param {string} params.label - The label for the rich text input field.
 * @param {string} [params.path=''] - The path to be used for the attributes.
 * @param {string} params.value - The initial value of the rich text input field.
 * @returns {string} The HTML string for the rich text input field.
 */
export const richtext = (params) => {
	const { attributes = [], instance, label, path = '', value } = params;
	const isRequired = attributes.some(attr => attr.required === 'required');
	return `
		<label part="row">
			<span part="label">${isRequired ? `<abbr title="${t('required', instance.lang, instance.i18n)}">*</abbr>` : ''}${label}</span>
			<rich-text part="richtext" event-mode="input" ${attrs(attributes, path)}>
				${value || ''}
			</rich-text>
		</label>`;
};

/**
 * Generates a select dropdown HTML string based on the provided parameters.
 *
 * @param {Object} params - The parameters for generating the select dropdown.
 * @param {Array} [params.attributes=[]] - An array of attribute objects to be applied to the select element.
 * @param {string} params.label - The label text for the select dropdown.
 * @param {Array} [params.options=[]] - An array of option objects for the select dropdown.
 * @param {string} [params.path=''] - The path to be used for the select element.
 * @param {string} [params.type='string'] - The type attribute for the select element.
 * @param {*} params.value - The value to be selected in the dropdown.
 * @returns {string} The generated HTML string for the select dropdown.
 */
export const select = (params) => {
	const { attributes = [], label, options = [], path = '', type = 'string', value = -1 } = params;
	const attributeValue = attributes.find(attr => 'value' in attr)?.value;
	const finalValue = (value !== -1 && value !== undefined) ? value
									 : (attributeValue !== undefined) ? attributeValue
									 : '';
	const filteredAttributes = attributes.filter(attr => !('value' in attr));

	return `
		<label part="row">
			<span part="label">${label}</span>
			<select part="select" ${attrs(filteredAttributes, path, [], ['type'])} data-type="${type}">
				${options.map(option => `
					<option value="${option.value}" ${String(option.value) === String(finalValue) ? 'selected' : ''}>
						${option.label}
					</option>
				`).join('')}
			</select>
		</label>`;
};

/**
 * Generates an HTML string for a labeled textarea element.
 *
 * @param {Object} params - The parameters for the textarea element.
 * @param {Array} [params.attributes=[]] - An array of attributes to be added to the textarea element.
 * @param {string} params.label - The label text for the textarea element.
 * @param {string} [params.path=''] - The path to be used in the attributes.
 * @param {string} params.value - The initial value of the textarea element.
 * @returns {string} The HTML string for the labeled textarea element.
 */
export const textarea = (params) => {
	const { attributes = [], label, path = '', value = '' } = params;
	const textareaAttributes = attrs(attributes, path);
	return `
		<label part="row">
			<span part="label">${label}</span>
			<textarea part="textarea" ${textareaAttributes}>${value}</textarea>
		</label>`;
};
