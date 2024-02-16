let globalBreakpoints = [], globalForm = '', globalIconObject = {}, globalId = 0;

export function renderAttributes(
	attributes,
	variableMapping = { globalId },
	blacklist = ['icon']) {
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

export function renderButton(obj, iconObject) {
	return `<button type="button" ${renderAttributes(obj)}>${obj.icon ? renderIcon(obj.icon, iconObject) : obj.title}</button>`;
}

export function renderElement(element) {
	if (element.obj) {
		if (element.obj.removeForm) {
			delete element.obj.form;
			delete element.obj.removeForm;
		} else {
			// Use form attribute from the object, or globalForm if it doesn't exist
			element.obj.form = element.obj.form || globalForm;
		}

		if (element.obj.input) {
			if (element.obj.input.removeForm) {
				delete element.obj.input.form;
				delete element.obj.input.removeForm;
			} else {
				element.obj.input.form = element.obj.input.form || globalForm;
			}
		}
	}

	switch (element.ui) {
		case 'button': return renderButton(element.obj);
		case 'output': return renderOutput(element.name, element.text);
		case 'tag': return renderTag(element)
		case 'textarea': return renderTextarea(element.obj);
		default:
			return renderInput(element.obj);
	}
}

export function renderBreakpoints(breakpoints) {
	return globalBreakpoints && `<code>${breakpoints.map(breakpoint => `<var data-bp="${breakpoint}"></var>`).join('')}</code>`;
}

export function renderFieldset(fieldset) {
	/* ${fieldset.name ? `<legend>${fieldset.name}</legend>` : ''} */
	return `
		<fieldset${fieldset.name ? ` name="${fieldset.name}"`:''}${fieldset.part ? ` part="${fieldset.part}"`:''}>${
			fieldset.fields ? fieldset.fields.map(renderElement).join('') : ''
		}</fieldset>
	`;
}

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

export function renderIcon(name) {
	try {
		return globalIconObject && globalIconObject[name]
			? `<svg viewBox="0 0 24 24">${globalIconObject[name].map(path => `<path d="${path}"/>`).join('')}</svg>`
			: '';
	} catch (error) {
		return '';
	}
}

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

export function renderOutput(name, text) {
	return `
	<label>
		${text ? `<strong>${text}:</strong>`: ''}
		<output name="${name}">${text}</output>
	</label>`;
}

export function renderTag(obj) {
	const attributes = obj.attributes ? renderAttributes(obj.attributes) : '';
	return `<${obj.tag} ${attributes}>${obj.content}</${obj.tag}>`;
}

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