/**
 * Validates the type of a given value.
 *
 * @param {*} value - The value to be validated.
 * @param {string} type - The type to validate against. Possible values are "integer", "string", "boolean", "number", "array", and "object".
 * @returns {boolean} - Returns true if the value matches the specified type, otherwise returns false.
 */
function validateType(value, type) {
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
		return typeof value === "number";
	}
	if (type === "array") {
		return Array.isArray(value);
	}
	if (type === "object") {
		return typeof value === "object" && !Array.isArray(value) && value !== null;
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
 *   - errors: An array of error messages if the data is invalid, otherwise an empty array.
 */
function validateData(schema, data) {
	function validateObject(schema, data) {
		for (const key of Object.keys(schema.properties)) {
			if (schema.required.includes(key)) {
				if (data[key] === undefined) {
					return { valid: false, errors: [`Missing required property: ${key}`] };
				}
			}

			const propertySchema = schema.properties[key];
			const value = data[key];
			if (!validateType(value, propertySchema.type)) {
				return { valid: false, errors: [`Invalid type for property: ${key}`] };
			}

			if (propertySchema.type === "object") {
				const result = validateObject(propertySchema, value);
				if (!result.valid) {
					return result;
				}
			} else if (propertySchema.type === "array") {
				for (const item of value) {
					const result = validateObject(propertySchema.items, item);
					if (!result.valid) {
						return result;
					}
				}
			}
		}
		return { valid: true, errors: [] };
	}
	return validateObject(schema, data);
}

export { validateData };