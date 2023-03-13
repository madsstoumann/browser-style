/**
 * @function getScope
 * @param {Node} input
 * @param {String} scope fieldset, form, next, parent, root, querySelector, empty string (===input)
 * @param {Node} [fallback]
 * @description Gets a Node from a scope-string
 */
 function getScope(input, scope, fallback = input) {
	switch (scope) {
		case 'fieldset': return input.closest('fieldset');
		case 'form': return input.form;
		case 'next': return input.nextElementSibling;
		case 'parent': return input.parentNode;
		case 'prev': return input.previousElementSibling;
		case 'root': return document.documentElement;
		default: return scope.length ? document.querySelector(scope) : fallback;
	}
}

function rangeCircular(label) {
	const CX = label.offsetWidth / 2, CY = label.offsetHeight / 2;
	const input = label.firstElementChild;
	const radian = 360 / (input.max-0||100 - input.min-0);
	const pointerMove = event => {
		const degree = (((Math.atan2(event.offsetY - CY, event.offsetX - CX) * 180 / Math.PI) + 360) % 360);
		input.value = (degree / radian);
		input.dispatchEvent(new Event('input'));
	}
	label.addEventListener('pointerdown', () => label.addEventListener('pointermove', pointerMove));
	['pointerleave', 'pointerup'].forEach(evt => 	label.addEventListener(evt, () => label.removeEventListener('pointermove', pointerMove)));
}

/**
 * @function setMinMax
 * @param {Node} input
 * @description Sets min- and max-attributes and CSS Custom Properties for `input type=number||range`:
 * `data-scope`: See `getScope()`
 * `data-output`: Scope (see `data-scope`)
 */
 function setMinMax(input) {
	const label = input.labelFor || input.parentNode, max = (input.max || 100), min = input.min-0;
	const node = getScope(input, input.dataset.scope);
	const output = node && input.hasAttribute('data-output') ? getScope(input, input.dataset.output, node) : null;
	label.dataset.max = max; label.dataset.min = min;
	if (node) {
		node.style.setProperty('--max', max);
		node.style.setProperty('--min', min);
		if (output) {
			output.style.setProperty('--max', max);
			output.style.setProperty('--min', min);
		}
	}
}

/**
 * @function setPropertyValue
 * @param {Node} input
 * @description Sets a CSS Custom Property on a Node from various `data`-attributes:
 * `data-scope`: See `getScope()`
 * `data-key`: Name of property. If `data-key` is not specified, `name` will be used. If `name` is not specified, `--v` (value) will be used.
 * `data-unit`: A unit (suffix) to be appended to the value of the input, ie. "px"
 * `data-output`: Scope (see `data-scope`) for same or different node to set `textContent` with `value` plus `data-output-unit`
 * `data-output-unit`: (see above)
 */
function setPropertyValue(input) {
	const node = getScope(input, input.dataset.scope);
	const output = node && input.hasAttribute('data-output') ? getScope(input, input.dataset.output, node) : null;
	if (node) {
		const value = input.value + (input.dataset.unit || '');
		node.style.setProperty('--' + (input.dataset.key || input.name || 'v'), value);
		if (output) {
			const outputValue = input.value + (input.dataset.outputUnit || '');
			output.hasAttribute('data-output-value') ? output.dataset.outputValue = outputValue : output.textContent = outputValue;
			if (node !== output) output.style.setProperty('--v', value);
		}
	}
}

/* INIT */
const inputs = document.querySelectorAll('[data-scope]');
inputs.forEach(input => {
	if (['number', 'range'].includes(input.type)) setMinMax(input);
	if (input.parentNode?.dataset?.bs?.includes('circular-range')) rangeCircular(input.parentNode);
	input.addEventListener('input', () => setPropertyValue(input));
	input.dispatchEvent(new Event('input'));
});


document.querySelectorAll('[name="indeterminate"]').forEach(input => { input.indeterminate = true } )

/* TABS */
document.querySelectorAll(`[data-bs~="tabs"]`).forEach(tablist => {

	const fieldset = tablist.firstElementChild;
	const inputs = [...tablist.firstElementChild.elements]
	const panels = [...tablist.lastElementChild.children]
	
	// fieldset.role = 'tablist';
	/* Add to labels: role="tab" aria-selected="false" 
	Add to panel = role="tabpanel" 
	*/

	tablist.firstElementChild.addEventListener('input', event => {
		const tab = inputs.indexOf(event.target);
		panels.forEach((panel, index) => panel.hidden = (tab === index ? false : true))
	})
	/* Init tabs */
	inputs.forEach((input, index) => {
		// input.parentNode.ariaSelected = input.checked;
		input.checked && (panels[index].hidden = false)
	})
})


// const clickOutside = (node) => document.addEventListener('click', (event) => event.target.contains(node));

// document.querySelectorAll('select[is="custom"]').forEach(select => select.addEventListener('pointerdown', (event) => {
// 	const node = event.target;
// 	if (node.tagName === 'OPTION') {
// 		select.value = node.value;
// 		select.removeAttribute('size');
// 	}
// 	else {
// 		select.size = 3
// 	}
// }))