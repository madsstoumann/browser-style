export function generateNestedList(obj) {
	if (typeof obj !== 'object' || obj === null) {
		return '';
	}

	let html = '<ul>';

	for (let prop in obj) {
		if (obj.hasOwnProperty(prop)) {
			if (obj[prop] && typeof obj[prop] === 'object') {
				if (obj[prop].hasOwnProperty('key')) {
					html += '<li><label><input type="checkbox" name="' + obj[prop].key + '">' + obj[prop].label + '</label>';
					html += generateNestedList(obj[prop].groups);
					html += generateBreakpoints(obj[prop]);
					html += '</li>';
				} else {
					html += generateNestedList(obj[prop]);
				}
			}
		}
	}

	html += '</ul>';
	return html;
}

function generateBreakpoints(prop) {
	if (!prop.hasOwnProperty('values')) return '';
	const breakpoints = ['sm', 'md', 'lg', 'xl', 'xxl'];
	return `<fieldset name="${prop.key}-breakpoints">${
		breakpoints.map(breakpoint => `<label><input type="checkbox" value="${breakpoint}">${breakpoint}</label>`).join('')
	}</fieldset>`;
}

export async function go(u,t,o,s=null){try{const r=await fetch(u,{...o,signal:s});if(!r.ok)throw new Error(`HTTP error:${r.status}`);return t==='json'?await r.json():(t==='text'?await r.text():r);}catch(e){throw e.name==='AbortError'?new Error('Timeout'):e;}}

export function recreateObjectWithCheckedKeys(htmlElement, originalObject) {
	const checkedKeys = Array.from(htmlElement.querySelectorAll('input[type="checkbox"]:checked')).map(checkbox => checkbox.name);

	function createObject(obj) {
		const newObj = {};

			if (Array.isArray(obj)) {
				newObj.groups = [];
				obj.forEach(item => {
					const newItem = createObject(item);
					if (newItem) {
						newObj.groups.push(newItem);
					}
				});
			}
			else if (typeof obj === 'object') {
				if (obj.key && checkedKeys.includes(obj.key)) {
					newObj.key = obj.key;
					newObj.label = obj.label;
					const breakpointFieldset = htmlElement.querySelector(`fieldset[name="${obj.key}-breakpoints"]`);
					if (breakpointFieldset) {
						// Extract checked breakpoints
						const checkedBreakpoints = Array.from(breakpointFieldset.querySelectorAll('input[type="checkbox"]:checked')).reduce((acc, checkbox) => {
							acc.push(checkbox.value);
							return acc;
						}, []);
						// Add breakpoints property only if at least one breakpoint is checked
						if (checkedBreakpoints.length > 0) {
							newObj.breakpoints = checkedBreakpoints;
						}
					}

					if (obj.groups) {
						newObj.groups = [];
						obj.groups.forEach(item => {
							const newItem = createObject(item);
							if (newItem) {
								newObj.groups.push(newItem);
							}
						});
					}
				}
			}
		return Object.keys(newObj).length ? newObj : null;
	}

	return createObject(originalObject);
}
