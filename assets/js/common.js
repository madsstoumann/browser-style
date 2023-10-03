import indeterminate from './indeterminate.js';
// import popover from './popover.js';
import replaceSVG from './replaceSVG.js';
// import setProperty from './setProperty.js';
import initProperties from './setProperty.js';

export function init(node, func) {
	document.querySelectorAll(node).forEach(func);
}
export function common() {
	init('[data-key]', (input) => initProperties(input))
	init('fieldset[name]', (group) => indeterminate(group))
	init('img[data-replace-svg]', (node) => replaceSVG(node))
}