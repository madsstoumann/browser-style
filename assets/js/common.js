import indeterminate from './indeterminate.js';
import initProperties from './setProperty.js';

export function init(node, func) {
	document.querySelectorAll(node).forEach(func);
}
export function common() {
	init('[data-key]', (input) => initProperties(input))
	init('fieldset[name]', (group) => indeterminate(group))
}