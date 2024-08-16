import { attrs, uuid } from './utility.js';

export function all(data, schema, instance, root = false, namePrefix = '') {
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

			const namePath = namePrefix ? `${namePrefix}.${key}` : key;

			if (config.type === 'object') {
					if (config.render && method) {
							try {
									return renderMethod(title, data[key], attributes, options, config, instance, namePath);
							} catch {
									return '';
							}
					} else {
							return fieldset(title, attributes, all(data[key], config, instance, false, namePath));
					}
			} else if (config.type === 'array') {
					if (method) {
							try {
									const addEntry = config.render?.entry ? instance.getRenderMethod('entry')(config.render.entry, key, instance) : '';
									return renderMethod(title, data[key], attributes, options, config, instance, namePath) + addEntry + toolbar;
							} catch {
									return '';
							}
					} else if (config.items) {
							// Here is where we ensure namePath is correctly propagated
							return data[key].map((item, index) => {
									const itemNamePath = `${namePath}[${index}]`; // This ensures the correct name path
									return all(item, config.items, instance, false, itemNamePath);
							}).join('');
					}
			}

			if (method) {
					try {
							return renderMethod(title, data[key], attributes, options, config, instance, namePath);
					} catch {
							return '';
					}
			}
			return '';
	}).join('');

	return root && schema?.render?.toolbar ? content + instance.getRenderMethod('toolbar')(schema.render.toolbar) : content;
}

/* ARRAY */
export const array = (label, value, attributes, options, config, instance, namePath = '') => {
		return value.map((item, index) => fieldset(`${label} ${index + 1}`, attributes, all(item, config.items, instance, false, `${namePath}[${index}]`))).join('');
};

/* AUTOSUGGEST */
export const autosuggest = (_label, value, attributes, options, config, _instance, namePath = '') => {
		return `<auto-suggest part="autosuggest" name="${namePath}" ${attrs(attributes)}></auto-suggest>`;
}

/* CHECKLIST */
export const checklist = (label, value, attributes, _options, config, _instance, namePath = '') => {

		const checkitem = (item, config, namePath) => {
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
										<input part="input" type="checkbox" class="bg-gray --fs-lg --cross" checked ${attrs(attributes, [], namePath)} value="${value}">
								</em>
						</label>`;
		};

		return fieldset(label, attributes, value.map((item, index) => checkitem(item, config.items, `${namePath}[${index}]`)).join(''));
}

/* DETAILS */
export const details = (label, value, attributes, _options, config, instance, namePath = '') => {

		const detail = (value, config, namePath) => {
				const summary = config.render?.summary ? (value[config.render.summary] || config.render.summary) : 'SUMMARY';
				const header = config.render?.label ? (value[config.render.label] || config.render.label) : 'LABEL';

				return `
						<details part="details" ${attrs(attributes)}>
								<summary part="row summary">
										<span part="label">${icon()}${summary}</span>
										<em part="header">${header}</em>
								</summary>
								${all(value, config.items, instance, false, namePath)}
						</details>`;
		};

		if (!Array.isArray(value)) return detail(value, config, namePath);
		return fieldset(label, attributes, value.map((item, index) => detail(item, config, `${namePath}[${index}]`)).join(''));
}

/* ENTRY */
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

/* FIELDSET */
export const fieldset = (label, attributes, content) => `
		<fieldset ${attrs(attributes, [{ part: 'fieldset' }])}>
				<legend part="legend">${label}</legend>
				${content}
		</fieldset>`;

/* GRID */
export const grid = (label, value, attributes, _options, config, instance, namePath = '') => {
		return fieldset(label, attributes, value.map((item, index) => `<fieldset>${all(item, config.items, instance, false, `${namePath}[${index}]`)}</fieldset>`).join(''));
}

/* ICON */
const icon = (type = 'triangle right', size = 'md') => `<ui-icon type="${type}" size="${size}"></ui-icon>`;

/* INPUT */
export const input = (label, value, attributes, _options, _config, _instance, namePath = '') => {
		const checked = attributes.some(attr => attr.type === 'checkbox') && value ? ' checked' : '';
		const hidden = attributes.some(attr => attr.type === 'hidden');
		const output = `<input part="input" value="${value || ''}" ${attrs(attributes, [], namePath)} ${checked}></input>`;
		return hidden ? output : `<label part="row"><span part="label">${label}</span>${output}</label>`;
}

/* MEDIA */
export const media = (label, value, attributes, _options, config, namePath = '') => {
		const mediaItem = (item, config, namePath) => {
				let attributes, src, value;
				for (const [key, prop] of Object.entries(config.properties)) {
						if (prop.property === 'src') src = item[key];
						if (prop.property === 'value') {
								value = item[key];
								attributes = prop.render.attributes;
						}
				}
				return `
				<label part="row">
						<input part="input" ${attrs(attributes, [], namePath)} value="${value || ''}" type="checkbox" checked>
						<img part="img" src="${src}" alt="${value || ''}">
				</label>`;
		}
		return fieldset(label, attributes, value.map((item, index) => mediaItem(item, config.items, `${namePath}[${index}]`)).join(''))
};

/* RICHTEXT */
export const richtext = (label, value, attributes = [], namePath = '') => `
		<div part="row">
				<span part="label">${label}</span>
				<rich-text part="richtext" ${attrs(attributes, [], namePath)}>
						${value}
				</rich-text>
		</div>`;

/* SELECT */
export const select = (label, value, attributes = [], options = [], namePath = '') => {
		return `
				<label part="row">
						<span part="label">${label}</span>
						<select part="select" ${attrs(attributes, [], namePath)}>
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
export const textarea = (label, value, attributes = [], namePath = '') => `
		<label part="row">
				<span part="label">${label}</span>
				<textarea part="textarea" ${attrs(attributes, [], namePath)}>${value}</textarea>
		</label>
`;

/* TOOLBAR */
export const toolbar = (config) => {
		const buttons = config.map((button) => `
				<button part="button" type="button" ${attrs(button.attributes)}>
						${button.label}
				</button>
		`).join('');
		return `<nav part="nav toolbar">${buttons}</nav>`;
}
