function isLikelyUrl(value) {
	const urlPattern = /^(http|https):\/\/[^\s$.?#].[^\s]*$/;
	return urlPattern.test(value);
}

function isLikelySkuOrId(value) {
	const noSpaces = !/\s/.test(value);
	const alphanumeric = /^[a-zA-Z0-9]+$/.test(value);
	return noSpaces && alphanumeric;
}

function isLikelyImageUrl(value) {
	const imagePattern = /\.(jpeg|jpg|gif|png|svg)$/;
	return imagePattern.test(value);
}

export function generateRenderMethod(type, key, value) {
	const baseAttributes = [{ name: key }];
	const iso8601DateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[\+\-]\d{2}:\d{2})?$/;

	if (type === 'string') {
		if (iso8601DateRegex.test(value)) {
			return {
				method: 'input',
				attributes: baseAttributes.concat([{ type: 'datetime-local' }, { placeholder: 'Enter date and time' }])
			};
		}

		if (isLikelyUrl(value)) {
			if (isLikelyImageUrl(value)) {
				return {
					method: 'img',
					attributes: baseAttributes.concat([{ alt: 'none' }])
				};
			} else {
				return {
					method: 'input',
					attributes: baseAttributes.concat([{ type: 'url' }, { placeholder: 'Enter URL' }])
				};
			}
		}

		if (isLikelySkuOrId(value)) {
			return {
				method: 'input',
				attributes: baseAttributes.concat([{ type: 'text' }, { placeholder: `Enter ${key}` }])
			};
		}

		if (value.length >= 100) {
			return {
				method: 'richtext',
				attributes: [{ toolbar: 'h1,h2,h3|b,i,u,s|sub,sup|ol,ul,hr|img|link,unlink' }]
			};
		}

		return {
			method: 'input',
			attributes: baseAttributes.concat([{ type: 'text' }, { placeholder: `Enter ${key}` }])
		};
	}

	if (type === 'number') {
		return {
			method: 'input',
			attributes: baseAttributes.concat([{ type: 'number' }, { placeholder: `Enter ${key}` }])
		};
	}

	if (type === 'boolean') {
		return {
			method: 'input',
			attributes: baseAttributes.concat([{ type: 'checkbox' }])
		};
	}

	return {
		method: 'input',
		attributes: baseAttributes.concat([{ type: 'text' }, { placeholder: `Enter ${key}` }])
	};
}

export function generateSchemaFromData(data, disabledKeys = [], toolbar = null, schemaId = 'http://example.com/example.json', schemaUri = 'https://json-schema.org/draft/2019-09/schema') {
	const schema = {
		$schema: schemaUri,
		$id: schemaId,
		type: 'object',
		default: {},
		properties: {},
		required: [],
	};

	if (toolbar) {
		schema.render = { toolbar };
	}

	for (const [key, value] of Object.entries(data)) {
		let type = typeof value;
		const render = generateRenderMethod(type, key, value);

		if (value === null) {
			// If the value is null, set type to ["object", "null"]
			type = ["object", "null"];
		} else if (type === 'object' && !Array.isArray(value)) {
			schema.properties[key] = {
				type: 'object',
				title: key,
				properties: generateSchemaFromData(value, disabledKeys).properties,
				required: Object.keys(value),
			};
			continue;
		} else if (Array.isArray(value)) {
			const itemSchema = generateSchemaFromData(value[0] || {}, disabledKeys);
			const isMediaArray = value.some(item => isLikelyImageUrl(item.url || item));

			render.summary = 'LABEL';
			render.label = 'VALUE';

			// Add property attributes to each item under properties
			for (const [itemKey, itemValue] of Object.entries(itemSchema.properties)) {
				if (!itemValue.property) {
					itemValue.property = itemKey.toLowerCase();  // Example logic to set property
				}
			}

			schema.properties[key] = {
				type: 'array',
				title: toTitleCase(key),
				items: {
					type: 'object',
					properties: itemSchema.properties,
					required: Object.keys(itemSchema.properties),
				},
				render: {
					method: isMediaArray ? 'media' : 'array',
					attributes: [{ part: isMediaArray ? 'media' : 'array' }],
					summary: render.summary,
					label: render.label,
				},
			};
			continue;
		}

		const propertyObject = {
			type: type, // Use the updated type, which can now be ["object", "null"]
			title: toTitleCase(key),
			render,
		};

		if (isLikelyImageUrl(value)) {
			propertyObject.property = 'src';
		}

		// Check if the key is in the disabledKeys array
		if (disabledKeys.includes(key)) {
			propertyObject.render.attributes = propertyObject.render.attributes || [];
			propertyObject.render.attributes.push({ disabled: "disabled" });
		}

		schema.properties[key] = propertyObject;
		schema.required.push(key);
	}

	return schema;
}


export function addEntryToSchema(schema, key, value, disabledKeys = []) {
	if (!schema.properties[key] || !Array.isArray(value)) {
		return; // Ensure the key exists in the schema and the value is an array
	}

	const isMediaArray = value.some(item => isLikelyImageUrl(item.url || item));
	let entryProperties = {};

	try {
		entryProperties = generateEntryProperties(value[0]);
	} catch (error) {
		console.error(`Error generating entry properties for key "${key}":`, error);
	}

	schema.properties[key].render.entry = {
		id: `add_${key}`,
		label: 'Add row',
		name: '',
		schema: {
			type: 'object',
			properties: entryProperties
		}
	};
}

function generateEntryProperties(data) {
	const properties = {};
	for (const [key, value] of Object.entries(data)) {
		const type = typeof value;
		const render = generateRenderMethod(type, key, value);
		properties[key] = {
			title: toTitleCase(key),
			type: type === 'number' ? 'number' : 'string',
			render: render
		};

		if (isLikelyImageUrl(value)) {
			properties[key].property = 'src';
		}
	}
	return properties;
}

function toTitleCase(str) {
	return str.split('_')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
}