/**
 * Validates the type of a given value.
 *
 * @param {*} value - The value to be validated.
 * @param {string} type - The type to validate against. Possible values are "integer", "string", "boolean", "number", "array", and "object".
 * @returns {boolean} - Returns true if the value matches the specified type, otherwise returns false.
 */
function validateType(value, type) {
	if (Array.isArray(type)) {
		// Check if any of the types in the array match
		return type.some(t => validateType(value, t));
	}

	if (type === "integer") {
		return Number.isInteger(value);
	}
	if (type === "string") {
		return typeof value === "string";
	}
	if (type === "boolean") {
		return typeof value === "boolean";
	}
	if (type === "number") {
		return typeof value === "number" && !isNaN(value);
	}
	if (type === "array") {
		return Array.isArray(value);
	}
	if (type === "object") {
		return typeof value === "object" && !Array.isArray(value) && value !== null;
	}
	if (type === "null") {
		return value === null;
	}
	return false;
}

/**
 * Validates the given data against the provided schema.
 *
 * @param {object} schema - The schema object describing the expected structure of the data.
 * @param {object} data - The data object to be validated.
 * @returns {object} - An object containing the validation result. It has two properties:
 *   - valid: A boolean indicating whether the data is valid or not.
 *   - errors: An array of error messages indicating which properties failed validation.
 */
function validateData(schema, data) {
	// Helper function to recursively validate objects
	function validateObject(schema, data, path = '') {
		let errors = [];

		for (const key of Object.keys(schema.properties)) {
			const propertyPath = path ? `${path}.${key}` : key;

			// Check if the property is required
			if (schema.required?.includes(key)) {
				if (data[key] === undefined) {
					errors.push({
						message: 'Missing required property',
						property: propertyPath,
						type: schema.properties[key].type,
						value: undefined
					});
					continue;
				}
			}

			const propertySchema = schema.properties[key];
			const value = data[key];

			// Validate the type of the property
			if (!validateType(value, propertySchema.type)) {
				errors.push({
					message: 'Invalid type for property',
					property: propertyPath,
					type: propertySchema.type,
					value
				});
				continue;
			}

			// Recursively validate nested objects
			if (propertySchema.type === 'object') {
				const result = validateObject(propertySchema, value, propertyPath);
				errors = errors.concat(result.errors);
			}

			// Recursively validate arrays
			else if (propertySchema.type === 'array') {
				if (!Array.isArray(value)) {
					errors.push({
						message: 'Invalid type for array property',
						property: propertyPath,
						type: 'array',
						value
					});
				} else {
					value.forEach((item, index) => {
						const result = validateObject(propertySchema.items, item, `${propertyPath}[${index}]`);
						errors = errors.concat(result.errors);
					});
				}
			}
		}
		return { valid: errors.length === 0, errors };
	}

	return validateObject(schema, data);
}

export { validateData };