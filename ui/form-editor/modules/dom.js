/* Builds an element without innerHTML: h('label', { for: 'x' }, 'text', child) */
export function h(tag, attributes = {}, ...children) {
	const element = document.createElement(tag);
	for (const [key, value] of Object.entries(attributes)) {
		if (value === false || value === null || value === undefined) continue;
		if (key.startsWith('on') && typeof value === 'function') element.addEventListener(key.slice(2), value);
		else if (key === 'value' || (key in element && typeof value !== 'string')) element[key] = value;
		else element.setAttribute(key, value === true ? '' : value);
	}
	element.append(...children.flat(Infinity).filter(child => child !== null && child !== undefined && child !== false));
	return element;
}

/* A labelled control: label text above the control, as ui/base form.css expects. */
export const field = (label, control, hint) => h('label', {}, h('span', {}, label, hint ? h('small', {}, hint) : null), control);

/* A labelled checkbox: control first, as ui/base form.css expects. */
export const check = (label, checked, onchange) => h('label', {}, h('input', { type: 'checkbox', checked, onchange: event => onchange(event.target.checked) }), label);

export const select = (options, value, onchange, attributes = {}) => h('select', { ...attributes, onchange: event => onchange(event.target.value) },
	options.map(option => {
		const [optionValue, label] = Array.isArray(option) ? option : [option, option];
		return h('option', { value: optionValue, selected: optionValue === value }, label);
	})
);

export const button = (label, onclick, attributes = {}) => h('button', { type: 'button', ...attributes, onclick }, label);
