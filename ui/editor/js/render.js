let globalBreakpoints = [], globalForm = '', globalIconObject = {}, globalId = 0;

/**
 * Renders attributes based on the provided object, with optional variable mapping and blacklist.
 *
 * @param {Object} attributes - The attributes object.
 * @param {Object} [variableMapping={ globalId }] - The variable mapping object.
 * @param {Array} [blacklist=['icon']] - The blacklist array.
 * @returns {string} - The rendered attributes as a string.
 */
export function renderAttributes(
	attributes,
	variableMapping = { globalId },
	blacklist = ['icon', 'options']) {
	return Object.keys(attributes)
		.filter((key) => !blacklist.includes(key))
		.map((key) => {
			let value = attributes[key];
			if (
				typeof value === 'string' &&
				value.includes('{{') &&
				value.includes('}}')
			) {
				const match = value.match(/{{(.*?)}}/);
				if (match) {
					const variable = match[1].trim();
					value = value.replace(`{{${variable}}}`, variableMapping[variable] || '');
				}
			}
			return `${key}="${value}"`;
		}).join(' ');
}

/**
 * Renders a button element with the provided attributes and optional icon.
 * @param {object} obj - The object containing the button attributes.
 * @param {object} iconObject - The object containing the icon attributes.
 * @returns {string} The rendered button element as a string.
 */
export function renderButton(obj, iconObject) {
	return `<button type="button" ${renderAttributes(obj.attr)}>${obj.icon ? renderIcon(obj.icon, iconObject) : obj.attr?.title || ''}</button>`;
}

/**
 * Renders an element based on its UI type.
 * @param {Object} element - The element to be rendered.
 * @returns {string} - The rendered element.
 */
export function renderElement(element) {
	if (element) {
		if (element.removeForm) {
			delete element.form;
			delete element.removeForm;
		} else {
			// Use form attribute from the object, or globalForm if it doesn't exist
			element.form = element.form || globalForm;
		}

		if (element.input) {
			if (element.input.removeForm) {
				delete element.input.form;
				delete element.input.removeForm;
			} else {
				element.input.form = element.input.form || globalForm;
			}
		}
	}

	switch (element.ui) {
		case 'button': return renderButton(element);
		case 'output': return renderOutput(element.name, element.text);
		case 'select': return renderSelect(element);
		case 'tag': return renderTag(element)
		case 'textarea': return renderTextarea(element);
		default: return renderInput(element);
	}
}

/**
 * Renders breakpoints as HTML code.
 * @param {Array} breakpoints - An array of breakpoints.
 * @returns {string} - The rendered HTML code.
 */
export function renderBreakpoints(breakpoints) {
	return globalBreakpoints && `<code>${breakpoints.map(breakpoint => `<var data-bp="${breakpoint}"></var>`).join('')}</code>`;
}

/**
 * Renders a list of components as a datalist element.
 * @param {Array} array - An array of component groups, each containing a name and an array of items.
 * @param {string} id - The identifier to be used in the datalist's id attribute.
 * @returns {string} - The HTML representation of the datalist element.
 */
export function renderComponentList(array, id) {
	return `<datalist id="components${id}">${
		array.map(
			group => `<optgroup label="${group.name}">${group.items.map(
				component => `<option value="${component.name}" data-component-key="${component.key}">${group.name}</option>`
			).join('')}</optgroup>`
		).join('')}</datalist>`
}

/**
 * Renders a fieldset element with optional name and part attributes.
 * @param {Object} fieldset - The fieldset object.
 * @returns {string} The rendered fieldset element as a string.
 */
export function renderFieldset(fieldset) {
	return `
		<fieldset${fieldset.name ? ` name="${fieldset.name}"`:''}${fieldset.part ? ` part="${fieldset.part}"`:''}>${
			fieldset.fields ? fieldset.fields.map(renderElement).join('') : ''
		}</fieldset>
	`;
}

/**
 * Renders a group element with details and summary tags.
 * @param {object} group - The group object containing the properties of the group.
 * @returns {string} - The rendered HTML string of the group element.
 */
export function renderGroup(group) {
	return `
		<details${group.open ? ' open':''}${group.name ? ` name="${group.name}"`:''}${group.part ? ` part="${group.part}"`:''}>
			<summary>${group.label}
				<div part="button icon">${renderIcon(group.icon || 'plus')}</div>
			</summary>
			${group.groups ? group.groups.map(subgroup => renderGroup(subgroup)).join('') : ''}
			${group.fieldsets ? group.fieldsets.map(renderFieldset).join('') : ''}
		</details>
	`;
}

/**
 * Renders an icon based on the given name.
 * @param {string} name - The name of the icon.
 * @returns {string} The SVG markup for the icon.
 */
export function renderIcon(name) {
	try {
		return globalIconObject && globalIconObject[name]
			? `<svg viewBox="0 0 24 24">${globalIconObject[name].map(path => `<path d="${path}"/>`).join('')}</svg>`
			: '';
	} catch (error) {
		return '';
	}
}

/**
 * Renders an input element with optional label, icon, and additional text.
 * @param {object} obj - The object containing the input configuration.
 * @returns {string} The rendered HTML string.
 */
export function renderInput(obj) {
	if (obj?.input['data-values']) obj.input.max = obj.input['data-values'].length - 1;
	const breakpoints = globalBreakpoints.length ? renderBreakpoints(globalBreakpoints) : '';
	const icon = obj.icon ? renderIcon(obj.icon) : '';
	const input = obj.input ? renderAttributes(obj.input) : '';
	const label = obj.label ? renderAttributes(obj.label) : '';
	const text = obj.text ? `<span>${obj.text}${breakpoints}</span>` : '';
	const textAfter = obj.textAfter ? `<span>${obj.textAfter}${breakpoints}</span>` : '';

	return `
		<label ${label}>
		${text}
		<input ${input}>
		${icon}
		${textAfter}
		</label>
	`;
}

/**
 * Renders the chat based on the provided object.
 * @param {Object} obj - The object containing chat data.
 * @param {Array} obj.items - An array of chat items.
 * @param {Array} obj.users - An array of chat users.
 * @returns {string} - The rendered chat HTML.
 */
export function renderChat(obj) {
	const abbr = name => {
		let words = name.split(' '), init = '';
		if (words.length > 1) { init = words.map(word => word.charAt(0)).join(''); } else { init = name.slice(0, 2); }
		return init; 
	};
	const hex = str => "#" + ("00000" + (Math.abs(str.split('').reduce((hash, char) => char.charCodeAt(0) + ((hash << 5) - hash), 0)) % (1 << 24)).toString(16)).slice(-6).toUpperCase();
	const avatar = user => `<picture part="avatar" style="--_bg:${hex(user.name)};"><abbr title="${user.name}">${abbr(user.name)}</abbr><img src="${user.imageUrl}" alt="${user.name}"></picture>`;

	const list = obj.items.map(item => {
		const user = obj.users.find(u => u.id === item.userId);
		const isCurrentUser = user && user.isCurrentUser;
		const value = isCurrentUser ? 1 : 0;
		return `<li${item.time ? ` data-time="${item.time}"`:''} value="${value}">
			${user ? avatar(user) : ''}
			<div part="message">
				${item.message.text}
				${item.message.readTime ? `<time datetime="${item.message.readTime}"></time>` : ''}
			</div>
		</li>`;
	}).join('');
	return `<ol part="messages">${list}</ol>`;
}


/**
 * Renders an output element with an optional label.
 * @param {string} name - The name attribute for the output element.
 * @param {string} text - The text to be displayed as the label.
 * @returns {string} The rendered output element as a string.
 */
export function renderOutput(name, text) {
	return `
	<label>
		${text ? `<strong>${text}:</strong>`: ''}
		<output name="${name}">${text}</output>
	</label>`;
}

export function renderSelect(obj) {
	const breakpoints = globalBreakpoints.length ? renderBreakpoints(globalBreakpoints) : '';
	const input = obj.input ? renderAttributes(obj.input) : '';
	const label = obj.label ? renderAttributes(obj.label) : '';
	const text = obj.text ? `<span>${obj.text}${breakpoints}</span>` : '';
	const textAfter = obj.textAfter ? `<span>${obj.textAfter}</span>` : '';
	const hr = (option) => (option.break ? '<hr>' : '');
	const optionsHTML = obj.input.options.map(option => {
		if (option.group) {
		// Render <optgroup> for grouped options
			return `
				<optgroup label="${option.group.label}">
					${option.group.options.map(groupOption => `<option value="${groupOption.value}">${groupOption.text}</option>${hr(groupOption)}`).join('')}
				</optgroup>`;
			} else {
				// Render regular <option>
				return `<option value="${option.value}">${option.text}${hr(option)}</option>`;
			}
	}).join('');

	return `
		<label ${label}>
			${text}
			<select ${input}>
				${optionsHTML}
			</select>
			${textAfter}
		</label>
	`;
}


/**
 * Renders a HTML tag with attributes and content.
 * @param {Object} obj - The object representing the tag.
 * @returns {string} The rendered HTML tag.
 */
export function renderTag(obj) {
	const attr = obj.attr ? renderAttributes(obj.attr) : '';
	return `<${obj.tag} ${attr}>
		${obj.content}
		${obj.fieldsets ? obj.fieldsets.map(renderFieldset).join('') : ''}
	</${obj.tag}>`;
}

/**
* Renders a template string by replacing placeholders with values from the provided configuration.
* @param {string} template - The template string with placeholders in the format {{key}}.
* @param {Array} config - An array of objects with key-value pairs to replace the placeholders in the template.
* @returns {string} The rendered template string.
*/
export function renderTemplateFromString(template, config = {}) {
	if (!template) return '';
	return decodeURIComponent(template).replace(/\{\{(\w+)\}\}/g, (match, key) => {
		const configItem = config.find(item => item.key === key);
		return configItem !== undefined ? configItem.value : match;
	});
}

/**
 * Renders a textarea element with optional label, text, and attributes.
 * @param {Object} obj - The object containing the input, label, text, and textAfter properties.
 * @returns {string} The rendered HTML string.
 */
export function renderTextarea(obj) {
	const input = obj.input ? renderAttributes(obj.input) : '';
	const label = obj.label ? renderAttributes(obj.label) : '';
	const text = obj.text ? `<span>${obj.text}</span>` : '';
	const textAfter = obj.textAfter ? `<span>${obj.textAfter}</span>` : '';

	return `
		<label ${label}>
		${text}
		<textarea ${input}>${obj.input.value ? `${obj.input.value}`:''}</textarea>
		${textAfter}
		</label>
	`;
}

/* === Functions for updating global variables === */
export function setBreakpoints(breakpoints) {
	globalBreakpoints = breakpoints;
}

export function setForm(form, id) {
	globalForm = form+id;
	globalId = id;
}

export function setIconObject(icons) {
	globalIconObject = icons;
}