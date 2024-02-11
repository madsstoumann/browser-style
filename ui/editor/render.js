let globalBreakpoints = [], globalForm = '', globalIconObject = {};

export function renderAttributes(attributes, blacklist = ['icon']) {
	return Object.keys(attributes)
		.filter(key => !blacklist.includes(key))
		.map(key => `${key}="${attributes[key]}"`)
		.join(' ');
}

export function renderButton(obj, iconObject) {
	return `<button type="button" ${renderAttributes(obj)}>${obj.icon ? renderIcon(obj.icon, iconObject) : obj.title}</button>`;
}

export function renderElement(element) { console.log(element)
	if (globalForm && element.obj) {
		element.obj.form = globalForm;
		if (element.obj.input) {
			element.obj.input.form = globalForm;
		}
	}
	switch (element.ui) {
		case 'button':
			return renderButton(element.obj);
		case 'tag':
		 return renderTag(element)
		default:
			return renderInput(element.obj);
	}
}

export function renderBreakpoints(breakpoints) {
	return globalBreakpoints && `<code>${breakpoints.map(breakpoint => `<var data-bp="${breakpoint}"></var>`).join('')}</code>`;
}

export function renderFieldset(fieldset) {
	return `
		<fieldset${fieldset.name ? ` name="${fieldset.name}"`:''}${fieldset.part ? ` part="${fieldset.part}"`:''}>
			${fieldset.name ? `<legend>${fieldset.name}</legend>` : ''}
			${fieldset.fields ? fieldset.fields.map(renderElement).join('') : ''}
		</fieldset>
	`;
}

export function renderGroup(group, level = 0) {
	return `
		<details${group.open ? ' open':''}${group.name ? ` name="${group.name}"`:''}${group.part ? ` part="${group.part}"`:''} data-level="${level}">
			<summary>${group.label}
				<div part="button icon">${renderIcon(group.icon || 'plus')}</div>
			</summary>
			${group.groups ? group.groups.map(subgroup => renderGroup(subgroup, level + 1)).join('') : ''}
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
	const breakpoints = globalBreakpoints.length ? renderBreakpoints(globalBreakpoints) : '';
	const icon = obj.icon ? renderIcon(obj.icon) : '';
	const input = obj.input ? renderAttributes(obj.input) : '';
	const label = obj.label ? renderAttributes(obj.label) : '';
	const text = obj.text ? `<span>${obj.text}${breakpoints}</span>` : '';
	const textAfter = obj.textAfter ? `<span>${obj.textAfter}}${breakpoints}</span>` : '';

	return `
		<label ${label}>
		${text}
		<input ${input}>
		${icon}
		${textAfter}
		</label>
	`;
}

export function renderTag(obj) {
	const attributes = obj.attributes ? renderAttributes(obj.attributes) : '';
	return `<${obj.tag} ${attributes}>${obj.content}</${obj.tag}>`;
}

export function setBreakpoints(breakpoints) {
	globalBreakpoints = breakpoints;
}

export function setForm(form) {
	globalForm = form;
}

export function setIconObject(icons) {
	globalIconObject = icons;
}