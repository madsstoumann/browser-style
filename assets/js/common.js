import indeterminate from './indeterminate.js';
import initProperties from './setProperty.js';

export function init(node, func, ...args) {
	document.querySelectorAll(node).forEach(element => {
		func(element, ...args);
	});
}
export function common() {
	init('[data-key]', (input) => initProperties(input))
	init('fieldset[name]', (group) => indeterminate(group))
}