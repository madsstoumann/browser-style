import { attrs, buttonAttrs, fetchOptions, getObjectByPath, isEmpty, resolveTemplateString, safeRender, t, toCamelCase, uuid } from './utility.js';

/* === all === */

export function all(data, schema, instance, root = false, pathPrefix = '', form = null) {
	const groupMap = new Map();
	const skipItems = new Set();
	const groupContent = new Map();

	if (root) {
		Object.entries(schema.properties).forEach(([key, config]) => {
			if (config.render?.group) {
				const groupKey = config.render.group;
				if (!groupMap.has(groupKey)) {
					groupMap.set(groupKey, []);
				}
				groupMap.get(groupKey).push({key, config});
				skipItems.add(key);
			}
		});

		groupMap.forEach((items, groupKey) => {
			groupContent.set(groupKey, items.map(({key, config}) => {
				const method = config?.render?.method ? toCamelCase(config.render.method) : '';
				const renderMethod = instance.getRenderMethod(method);
				const label = resolveTemplateString(config.title, data, instance.lang, instance.i18n, instance.constants) || '';
				const path = pathPrefix === 'DISABLE_PATH' ? '' : key;

				return method ? safeRender(renderMethod, {
					label,
					value: data[key],
					attributes: config?.render?.attributes || [],
					options: method === 'select' ? fetchOptions(config, instance) : [],
					config,
					instance,
					path,
					type: config.type
				}) : '';
			}).join(''));
		});
	}

	const arrayContent = [];
	const fieldsetGroups = [];
	const headline = schema.headline ? resolveTemplateString(schema.headline, data, instance.lang, instance.i18n, instance.constants) : '';
	const renderNav = schema.navigation;
	const standardContent = [];
	const title = schema.title ? resolveTemplateString(schema.title, data, instance.lang, instance.i18n, instance.constants) : '';

	let navContent = '';
	let schemaIndex = 0;

	Object.entries(schema.properties).forEach(([key, config]) => {
		if (skipItems.has(key)) return;

		const attributes = config?.render?.attributes || [];
		const method = config?.render?.method ? toCamelCase(config.render.method) : '';
		const renderMethod = instance.getRenderMethod(method);
		const label = resolveTemplateString(config.title, data, instance.lang, instance.i18n, instance.constants) || 'LABEL';
		const options = method === 'select' ? fetchOptions(config, instance) : [];
		const path = pathPrefix === 'DISABLE_PATH' ? '' : (pathPrefix ? `${pathPrefix}.${key}` : key);

		if (groupContent.has(key)) {
			fieldsetGroups.push({
				index: schemaIndex,
				content: fieldset({
					label,
					content: groupContent.get(key),
					path: key,
					attributes
				})
			});
		} else if (config.type === 'array') {
			if (renderNav) {
				navContent += `<a href="#section_${path}" part="link">${label}</a>`;
			}
			const content = method
				? safeRender(renderMethod, { label, value: data[key], attributes, options, config, instance, path, type: config.type })
				: data[key].map((item, index) => all(item, config.items, instance, false, `${path}[${index}]`)).join('');
			arrayContent.push({
				index: schemaIndex,
				content: method ? content : fieldset({ label, content, attributes })
			});
		} else if (config.type === 'object') {
			// Check if the object has a specific render method first
			if (config.render?.method) {
				standardContent.push({
					index: schemaIndex,
					content: safeRender(renderMethod, { 
						label, 
						value: data[key], 
						attributes, 
						options, 
						config, 
						instance, 
						path, 
						type: config.type 
					})
				});
			} else {
				const content = all(data[key], config, instance, false, path);
				standardContent.push({
					index: schemaIndex,
					content: fieldset({ label, content, attributes })
				});
			}
		} else {
			const content = config.type === 'object'
				? all(data[key], config, instance, false, path)
				: method
					? safeRender(renderMethod, { label, value: data[key], attributes, options, config, instance, path, type: config.type })
					: '';
			standardContent.push({
				index: schemaIndex,
				content: config.type === 'object' && !method
					? fieldset({ label, content, attributes })
					: content
			});
		}
		schemaIndex++;
	});

const getSchemaPosition = (key) => Object.keys(schema.properties).indexOf(key);

// Sort groups by their position in schema
const sortedGroups = fieldsetGroups.sort((a, b) => {
	const posA = getSchemaPosition(Object.keys(schema.properties)[a.index]);
	const posB = getSchemaPosition(Object.keys(schema.properties)[b.index]);
	return posA - posB;
}).map(item => item.content);

// Sort arrays by their position in schema  
const sortedArrays = arrayContent.sort((a, b) => {
	const posA = getSchemaPosition(Object.keys(schema.properties)[a.index]);
	const posB = getSchemaPosition(Object.keys(schema.properties)[b.index]);
	return posA - posB;
}).map(item => item.content);

// Standard content remains sorted by appearance order
const sortedStandard = standardContent.sort((a, b) => a.index - b.index).map(item => item.content);

const rootFieldset = root && sortedStandard.length
	? `<fieldset part="fieldset" id="section_root">${title ? `<legend part="legend">${title}</legend>` : ''}${sortedStandard.join('')}</fieldset>`
	: sortedStandard.join('');

const innerContent = `${rootFieldset}${sortedArrays.join('')}${sortedGroups.join('')}`;

	if (form || root) {
		const navElement = renderNav ? `<nav part="${renderNav}">${title ? `<a href="#section_root" part="link">${title}</a>` : ''}${navContent}</nav>` : '';
		const headlineElement = headline ? `<strong part="title">${headline}</strong>` : '';
		// const headerContent = (headlineElement || navElement) ? `<header part="header">${navElement}</header>` : '';
		let footerContent = `<ui-toast></ui-toast>`;

		if (schema.form) {
			if (schema.form.action) form.setAttribute('action', schema.form.action);
			if (schema.form.method) form.setAttribute('method', schema.form.method);
			if (schema.form.enctype) {
				const formEnctype = schema.form.enctype === 'json' ? 'application/json' 
					: schema.form.enctype === 'form' ? 'multipart/form-data' 
					: schema.form.enctype;
				form.setAttribute('enctype', formEnctype);
			}
			if (schema.form.autoSave !== undefined) {
				form.setAttribute('data-auto-save', schema.form.autoSave);
			}

			const buttonsHTML = schema.form.buttons?.map(entry => 
				`<button type="${entry.type || 'button'}" part="button" ${buttonAttrs(entry)}>${
					resolveTemplateString(entry.label, data, instance.lang, instance.i18n, instance.constants)
				}</button>`
			).join('');
			
			if (buttonsHTML) footerContent += `<nav part="nav">${buttonsHTML}</nav>`;
		}

		const rootContent = `${navElement}${headlineElement}<div part="main">${innerContent}</div><footer part="footer">${footerContent}</footer>`;
		if (form) {
			form.innerHTML = rootContent;
			return;
		}
		return rootContent;
	}
	return innerContent;
}

/* === arrayCheckbox === */

export const arrayCheckbox = (params) =>
	renderArray({
		...params,
		renderItem: ({ value, config, path }) => {
			const checked = config.render?.value ? !!value[config.render.value] : false;
			const rowLabel = config.render?.label ? value[config.render.label] || config.render.label : 'LABEL';
			return `
				<label part="row">
					<span part="label" title="${rowLabel}">${rowLabel}</span>
					<input part="input" type="checkbox" value="${value[config.render.value]}" name="${path}" data-type="boolean" ${checked ? 'checked' : ''}>
				</label>`;
		},
	});

/* === arrayDetail === */

export const arrayDetail = ({ value, config, path, instance, attributes = [], name = '', index }) => {
	const cleanName = name?.replace(/\[\d+\]/g, '');
	const rowLabel = config.render?.label 
		? resolveTemplateString(config.render.label, value, instance.lang, instance.i18n, instance.constants) 
		: 'label';
	const rowValue = config.render?.value 
		? resolveTemplateString(config.render.value, value, instance.lang, instance.i18n, instance.constants) 
		: 'value';

	const cols = rowValue.split('|').map(col => `<span>${col}</span>`).join('');
	const arrayControl = config.render?.arrayControl || 'mark-remove';

	return `
		<details part="array-details" ${attrs(attributes)}${name ? ` name="${cleanName}"`:''}>
			<summary part="row summary">
				<output part="label" name="label_${name}">${rowLabel}</output>
				<span part="value">
					${icon('chevron right', 'sm', 'xs')}
					<output name="value_${name}">${cols}</output>
					${config.render?.delete ? `<label><input part="input delete" checked type="checkbox" name="${path}" data-array-control="${arrayControl}"></label>` : ''}
				</span>
			</summary>
			${all(value, config.items, instance, false, path)}
		</details>`;
};

/* === arrayDetails === */

export const arrayDetails = (params) => {
	const { config } = params;
	return renderArray({
		...params,
		renderItem: ({ value, config, path, instance, attributes, index }) =>
			arrayDetail({
				value,
				config,
				path,
				instance,
				attributes,
				name: path,
				index,
			}),
		entry: config.render?.add ? entry : null,
	});
}

/* === arrayGrid === */

export const arrayGrid = (params) =>
	renderArray({
		...params,
		renderItem: ({ value, config, path, instance }) =>
			`<fieldset>${all(value, config.items, instance, false, path)}</fieldset>`,
	});

/* === arrayUnit === */

export const arrayUnit = ({ value, config, path, instance, attributes = [], name = '', index }) => {
	const rowValue = config.render?.value;
	if (!rowValue) return '';

	const rowLabel = config.render?.label
	? resolveTemplateString(config.render.label, value, instance.lang, instance.i18n, instance.constants)
	: 'label';

	const cols = rowLabel.split('|').map(col => `<span>${col}</span>`).join('');
	const arrayControl = config.render?.arrayControl || 'mark-remove';

	// Ensure config.items and properties exist
	const allContent = config.items?.properties
		? Object.entries(config.items.properties)
				.map(([key, itemConfig]) => {
					const itemName = itemConfig.name || key;
					const isHidden = itemName !== rowValue ? 'hidden' : `part="unit"`;
					const content = safeRender(
						instance.getRenderMethod(itemConfig.render?.method || 'input'),
						{
							label: itemConfig.title || key,
							value: value[key] || '',
							attributes: itemConfig.render?.attributes || [],
							config: itemConfig,
							instance,
							path: `${path}.${key}`,
							type: itemConfig.type || 'string',
						}
					);
					return `<span ${isHidden}>${content}</span>`;
				})
				.join('')
		: '';

	return `
	<fieldset part="array-unit fieldset" ${attrs(attributes)}${name ? ` name="${name}"` : ''}>
			${allContent}
				<output part="value" name="value_${name}">${cols}</output>
				${config.render?.delete ? `<label><input part="input delete" checked type="checkbox" name="${path}" data-array-control="${arrayControl}"></label>` : ''}
			
	</fieldset>`;
};

/* === arrayUnits === */

export const arrayUnits = (params) => {
	const { config } = params;
	return renderArray({
		...params,
		renderItem: ({ value, config, path, instance, attributes, index }) =>
			arrayUnit({ value, config, path, instance, attributes, name: path, index }),
		entry: config.render?.add ? entry : null,
	});
};

/* === autosuggest === */

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
		path="${path}"
		${syncInstance ? `sync-instance="${syncInstance}"` : ''}
		${value ? `value="${value}"` : ''}
		${initialObject && !isEmpty(initialObject) ? `initial-object='${JSON.stringify(initialObject)}'` : ''}
		${formID ? `form="${formID}"` : ''}></auto-suggest>`;
};

/* === barcode === */
export const barcode = ({ config, path, formID }) => { 
	return `<barcode-scanner path="${path}"></barcode-scanner>`;
};

/* === entry === */

export const entry = (params) => {
	const { config, instance, path = '' } = params;
	const formID = `form${uuid()}`;
	const id = `popover-${uuid()}`;
	const label = config.title || 'Add New Entry';
	const renderAutoSuggest = !!config.render?.autosuggest;
	const renderBarcodeScanner = !!config.render?.barcode;

	const fields = Object.entries(config.items.properties)
		.map(([propKey, propConfig]) => {
			const attributes = [...(propConfig.render?.attributes || []), { form: formID }];
			attributes.forEach(attr => {
				if ('value' in attr) {
					attr.value = resolveTemplateString(attr.value, instance.data, instance.lang, instance.i18n, instance.constants);
				}
			});

			const renderMethod = propConfig.render?.method || 'input';
			const options = renderMethod === 'select' ? fetchOptions(propConfig, instance) : [];
			const renderFunction = renderMethod === 'select' ? select : input;

			return renderFunction({
				attributes,
				label: propConfig.title,
				options,
				instance,
				path: `${path}.${propKey}`,
				type: propConfig.type || 'string'
			});
		}).join('');

	if (!fields) return '';
	instance.parent.insertAdjacentHTML('beforeend', `<form id="${formID}" data-popover="${id}" hidden></form>`);

	return `
		<nav part="nav">
			${renderBarcodeScanner ? barcode({ config, path, formID }) : ''}
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
					<button type="submit" form="${formID}" part="button add" data-render-method="${config.render?.addMethod || 'arrayDetail'}" data-custom="addArrayEntry" data-params='{ "path": "${path}" }'>${t('add', instance.lang, instance.i18n)}</button>
				</nav>
			</fieldset>
		</div>`;
};

/* === fieldset === */

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

/* === icon === */

const icon = (type, size, stroke) => `<ui-icon type="${type||''}" size="${size||''}" stroke="${stroke||''}"></ui-icon>`;

/* === input === */

export const input = (params) => {
	const { attributes = [], config, instance, label, path = '', type = 'string', value } = params;
	let finalValue = value ?? attributes.find(attr => attr.value !== undefined)?.value ?? '';
	if (config?.render?.formatter) {
		try {
				finalValue = resolveTemplateString(config.render.formatter, { ...instance.data, value: finalValue }, instance.lang, instance.i18n, instance.constants);
		} catch (_) {}
	}

	const filteredAttributes = attributes.filter(attr => !('value' in attr));
	const hiddenLabel = filteredAttributes.some(attr => attr['hidden-label']);
	const checked = filteredAttributes.some(attr => attr.type === 'checkbox') && finalValue ? ' checked' : '';
	const hidden = filteredAttributes.some(attr => attr.type === 'hidden');
	const isRequired = filteredAttributes.some(attr => attr.required === 'required');
	const inputElement = `<input part="input" value="${finalValue}" ${attrs(filteredAttributes, path)} data-type="${type}" ${checked}>`;

	return hidden 
		? inputElement 
		: `<label part="row" ${hiddenLabel ? 'hidden' : ''}>
			<span part="label">${isRequired ? `<abbr title="${instance ? t('required', instance.lang, instance.i18n): ''}">*</abbr>` : ''}${label}</span>
			${inputElement}
		</label>`;
};

/* === media === */

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

/* === renderArray === */

export const renderArray = ({ value, config, path, instance, renderItem, attributes = [], label = '', entry }) => { 
	const content = value.map((item, index) =>
		renderItem({
			value: item,
			config,
			path: path ? `${path}[${index}]` : '',
			instance,
			attributes,
			index,
		})
	).join('');

	const entryContent = entry ? entry({ config, instance, path }) : '';
	return fieldset({
		attributes,
		content: `${content}${entryContent}`,
		label,
		path,
	});
};

/* === richtext === */

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

/* === select === */
export const select = (params) => {
	const { attributes = [], config, label, options = [], path = '', type = 'string', value = -1, instance } = params;
	const attributeValue = attributes.find(attr => 'value' in attr)?.value;
	const selectedOption = config?.render?.selectedOption;
	const selectedOptionDisabled = config?.render?.selectedOptionDisabled;
	const action = config?.render?.action;
	const renderLabel = config?.render?.label;
	const valueField = config?.render?.value || 'value';

	// Add selectedOption only if it's an object (with value/label properties)
	let finalOptions = [...options];
	if (selectedOption && typeof selectedOption === 'object' && 'value' in selectedOption) {
		finalOptions = [selectedOption, ...options];
	}

	// Process options
	finalOptions = finalOptions.map(option => {
		// For template strings or direct property access in renderLabel
		const optionLabel = renderLabel 
			? renderLabel.includes('${') 
				? resolveTemplateString(renderLabel, option, instance.lang, instance.i18n, instance.constants)
				: option[renderLabel]
			: option.label || option[valueField];

		return {
			value: option[valueField] || option.value || '',
			label: optionLabel || option.label || ''  // Preserve original label if no renderLabel
		};
	});

	// For primitive selectedOption, just use the value for matching
	const finalValue = typeof selectedOption === 'object' && 'value' in selectedOption 
		? selectedOption.value
		: selectedOption !== undefined 
			? selectedOption
			: value !== -1 
				? value
				: attributeValue;

	const filteredAttributes = attributes.filter(attr => !('value' in attr));

	// Create button HTML if action exists
	const buttonHTML = action ? 
		`<button type="button" part="button" ${buttonAttrs(action)}>${
			resolveTemplateString(action.label, instance.data, instance.lang, instance.i18n, instance.constants)
		}</button>` : '';
	

	return `
		<label part="row${action ? ' action' : ''}">
			<span part="label">${label}</span>
			<select part="select" ${attrs(filteredAttributes, path, [], ['type'])} data-type="${type}">
				${finalOptions.map(option => {
					const optionValue = String(option.value);
					const isSelected = optionValue === String(finalValue);
					return `
						<option value="${optionValue}"
							${isSelected ? 'selected' : ''}
							${isSelected && selectedOptionDisabled ? 'disabled' : ''}>
							${option.label}
						</option>`;
				}).join('')}
			</select>
			${buttonHTML}
		</label>`;
};

/* === textarea === */

export const textarea = (params) => {
	const { attributes = [], label, path = '', value = '' } = params;
	const textareaAttributes = attrs(attributes, path);
	return `
		<label part="row">
			<span part="label">${label}</span>
			<textarea part="textarea" ${textareaAttributes}>${value}</textarea>
		</label>`;
};
