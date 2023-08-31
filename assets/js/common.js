import indeterminate from './indeterminate.js';
// import popover from './popover.js';
import setProperty from './setProperty.js';

export function init(node, func) {
	document.querySelectorAll(node).forEach(func);
}

export function common() {
	init('[data-key]', (input) => {
		input.addEventListener('input', () => setProperty(input))
		setProperty(input)
	})
	init('fieldset[name]', (group) => indeterminate(group))
}