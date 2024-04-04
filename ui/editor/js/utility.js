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
					html += generateUIList(obj[prop]);
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

export async function go(u, t, o, s = null) {
	try {
		const r = await fetch(u, { ...o, signal: s });
		if (!r.ok) throw new Error(`HTTP error:${r.status}`);
		return t === "json" ? await r.json() : t === "text" ? await r.text() : r;
	} catch (e) {
		throw e.name === "AbortError" ? new Error("Timeout") : e;
	}
}

export function recreateObjectWithCheckedKeys(htmlElement, originalObject, parentKey = null) {
	const checkedKeys = Array.from(
		htmlElement.querySelectorAll('input[type="checkbox"]:checked')
	).map((checkbox) => checkbox.name);

	function createObject(obj, parentKey = null) {
		const newObj = {};

		if (Array.isArray(obj)) {
			newObj.groups = [];
			obj.forEach((item) => {
				const newItem = createObject(item, parentKey);
				if (newItem) {
					newObj.groups.push(newItem);
				}
			});
		} else if (typeof obj === "object") {
			if (obj.key && checkedKeys.includes(obj.key)) {
				newObj.key = obj.key;
				newObj.label = obj.label;

				const breakpointFieldset = htmlElement.querySelector(
					`fieldset[name="${obj.key}-breakpoints"]`
				);
				const uiType = htmlElement.querySelector(
					`select[name="${obj.key}-ui"]`
				);

				if (breakpointFieldset) {
					const checkedBreakpoints = Array.from(
						breakpointFieldset.querySelectorAll(
							'input[type="checkbox"]:checked'
						)
					).reduce((acc, checkbox) => {
						acc.push(checkbox.value);
						return acc;
					}, []);
					if (checkedBreakpoints.length > 0) {
						obj.breakpoints = checkedBreakpoints;
					}
				}

				if (uiType && uiType.value) obj.ui = uiType.value;
				if (obj.ui) {
					const uiObj = createUIObject(obj);
					if (uiObj !== undefined) {
						const fieldset = {
							part: obj.ui + (obj.uix ? ` ${obj.uix}` : ''),
							fields: Array.isArray(uiObj) ? uiObj : [uiObj],
						};
						newObj.fieldsets = newObj.fieldsets || [];
						newObj.fieldsets.push(fieldset);
					}
				}

				if (obj.groups) {
					newObj.groups = [];
					obj.groups.forEach((item) => {
						const newItem = createObject(item, obj.key);
						if (newItem) {
							newObj.groups.push(newItem);
						}
					});
				} 

				if (parentKey) {
					newObj.name = parentKey;
				}
				if (obj.ui === 'fieldset') {
					const fields = newObj.groups.reduce((acc, group) => {
						acc.push(...group.fieldsets[0].fields);
						return acc;
					}, []);
					newObj.fieldsets = [{fields}];
					delete newObj.groups;
				};
			}
		}
		return Object.keys(newObj).length ? newObj : null;
	}

	return createObject(originalObject, parentKey);
}

/* === HELPERS ===*/

function contrast(color) {
	const { r, g, b } = hexToRgb(color);
	const brightness = (299 * r + 587 * g + 114 * b) / 1000;
	return brightness <= 127 ? '#FFF' : '#000';
}

function createUIObject(obj) {
	const common = {
		...(obj.breakpoints && obj.breakpoints.length > 0 ? { "data-breakpoints": obj.breakpoints } : {}),
		// ...(obj.prefix ? { "data-prefix": obj.prefix } : {}),
		name: obj.key,
	};
	const prefix = obj.prefix ? `${obj.prefix}-` : '';

	switch (obj.ui) {
		case "button-group": {
			return obj.values.map((entry) => {
				const [name, value] = typeof entry === 'object' ? [entry.name, entry.value] : [entry, entry];
				return {
					textAfter: name,
					input: {
						...common,
						"data-sr": "",
						type: "radio",
						value: prefix + value
					},
					label: {
						style: `--_v:${value}`,
					},
				};
			});
		}
		case "color-grid": {
			return obj.values.flatMap(({ name, value }) => {
				return value.split(" ").map((color, index) => {
					const checkColor = contrast(color);
					return {
						textAfter: `${name}-${(index + 1) * 100}`,
						input: {
							...common,
							style: `--_v:${color};--_c:${checkColor};`,
							type: "radio",
							value: `${prefix}${name}-${(index + 1) * 100}`,
						},
					};
				});
			});
		}
		case "color-swatch": {
			return obj.values.flatMap(({ name, value }) => {
				const values = value.split(" ");
				return values.map((color) => { /* TODO: current, inherit, transparent */
					const checkColor = contrast(color);
					const label = values.length > 1 ? color : name;
					return {
						textAfter: label,
						input: {
							...common,
							style: `--_v:${color};--_c:${checkColor};`,
							type: "radio",
							value: `${prefix}${label}`,
						},
					};
				});
			});
		}
		case "font-list": {
			return obj.values.map((entry) => {
				const [name, value] = typeof entry === 'object' ? [entry.name, entry.value] : [entry, entry];
				return {
					textAfter: value,
					input: {
						...common,
						type: "radio",
						value: prefix + value
					},
					label: {
						style: `--_v:${name}`,
					},
				};
			});
		}
		case "position": {
			return obj.values.map((value) => {
				return {
					input: {
						...common,
						type: "radio",
						value: prefix + value
					}
				};
			});
		}
		case "radio-list": {
			return obj.values.map((value) => {
				return {
					textAfter: value,
					input: {
						...common,
						type: "radio",
						value: prefix + value,
					},
					label: {
						style: `--_v:${value}`
					},
				};
			});
		}
		case "range": {
			return {
				text: obj.label,
				input: {
					...common,
					...(obj.prefix ? { "data-prefix": obj.prefix } : {}),
					...(obj.values ? { "data-values": obj.values } : null),
					type: "range",
					value: 0,
				},
			};
		}
		case "select": {
			return {
				text: obj.label,
				ui: "select",
				input: {
					...common,
					value: '',
					options: obj.values.map((value) => {
						return {
							value: value,
							text: value,
						};
					}),
				},
			};
		}
		case "switch": {
			return {
				textAfter: obj.label,
				input: {
					...common,
					role: "switch",
					type: "checkbox",
					value: obj.values[0],
				},
			};
		}
		default:
			return undefined;
	}
}

function generateBreakpoints(prop) {
	if (!prop.hasOwnProperty("values")) return "";
	const breakpoints = ["sm", "md", "lg", "xl", "xxl"];
	return `<fieldset name="${prop.key}-breakpoints">${breakpoints
		.map(
			(breakpoint) =>
				`<label><input type="checkbox" value="${breakpoint}">${breakpoint}</label>`
		)
		.join("")}</fieldset>`;
}

function generateUIList(prop) {
	if (!prop.hasOwnProperty("values")) return "";
	const ui = [
		"button-group",
		"color-grid",
		"color-swatch",
		"font-list",
		"icon-group",
		"position",
		"radio-list",
		"range",
		"select",
		"switch",
	];
	const defaultUI = prop.ui ? prop.ui : "list";
	return `<select name="${prop.key}-ui">${ui.map((item) => `<option value="${item}"${defaultUI === item ? ` selected` : ""}>${item}</option>`).join("")}</select>`;
}

function hexToRgb(hex) {
	hex = hex.replace(/^#/, '');
	const bigint = parseInt(hex, 16);
	const r = (bigint >> 16) & 255;
	const g = (bigint >> 8) & 255;
	const b = bigint & 255;
	return { r, g, b };
}
