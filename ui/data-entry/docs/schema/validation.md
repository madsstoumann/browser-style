
# Schema Validation

DataEntry provides built-in validation for the schema-based form generation, ensuring that the data conforms to the specified schema. This can be customized using a user-provided validation method or the default validation mechanism.

## How Validation Works

By default, DataEntry validates the form data based on the provided schema. It checks for:

- **Required properties**: Ensures that required properties are present in the data.
- **Type matching**: Validates that the values conform to the types specified in the schema (e.g., `string`, `number`, `array`, `object`, etc.).

## Disabling Validation with `novalidate`

If you want to disable validation entirely, you can add the `novalidate` attribute to the `<data-entry>` component:

```html
<data-entry
  data="your.api/data"
  schema="your.api/schema"
  novalidate>
</data-entry>
```

This disables both built-in and custom validation for the component.

## Custom Validation

DataEntry allows you to set your own custom validation method (such as [ajv](https://www.npmjs.com/package/ajv)) using the `validateMethod` setter. The custom method should accept the schema and data as parameters and return an object containing a `valid` boolean and an `errors` array.

### Setting a Custom Validation Method

You can set a custom validation method in JavaScript as shown below:

```js
const myCustomValidator = (schema, data) => {
  // Custom validation logic
  return {
    valid: true, // or false if validation fails
    errors: []   // list of validation errors
  };
};

dataEntryInstance.validateMethod = myCustomValidator;
```

The custom method is invoked instead of the default validation. If no custom method is set, the default validation is used.

> Note: When using `ajv` in `strict` mode, you have to add a vocabulary of the extra properties in the schema: 
```js
ajv.addVocabulary([
  "form",
  "headline",
  "messages",
  "navigation",
  "render",
  "translations"
  ])
```

### Using `validateMethod` in JavaScript

The `validateMethod` can be set directly in JavaScript if preferred over using the attributes:

```js
const dataEntry = document.querySelector('data-entry');
dataEntry.validateMethod = myCustomValidator;
```

## Default Validation

If no custom validation method is provided, the default validation function is used. The default validation checks if the data matches the expected structure and types defined in the schema.

### Default Validation Logic

The default validation checks:
- If required properties are missing.
- If data types match the expected type (`integer`, `string`, `boolean`, `array`, `object`, etc.).
- If nested objects or arrays are properly structured.

Here’s an overview of the default validation process:

```js
/**
 * Validates the given data against the provided schema.
 * 
 * @param {object} schema - The schema object describing the expected structure of the data.
 * @param {object} data - The data object to be validated.
 * @returns {object} - An object containing:
 *   - valid: boolean indicating if the data is valid.
 *   - errors: array of error messages for any validation failures.
 */
function validateData(schema, data) {
  function validateObject(schema, data, path = '') {
    let errors = [];

    for (const key of Object.keys(schema.properties)) {
      const propertyPath = path ? \`\${path}.\${key}\` : key;

      if (schema.required?.includes(key) && data[key] === undefined) {
        errors.push({
          message: 'Missing required property',
          property: propertyPath,
          type: schema.properties[key].type,
          value: undefined
        });
        continue;
      }

      const propertySchema = schema.properties[key];
      const value = data[key];

      if (!validateType(value, propertySchema.type)) {
        errors.push({
          message: 'Invalid type for property',
          property: propertyPath,
          type: propertySchema.type,
          value
        });
        continue;
      }

      if (propertySchema.type === 'object') {
        const result = validateObject(propertySchema, value, propertyPath);
        errors = errors.concat(result.errors);
      } else if (propertySchema.type === 'array') {
        if (!Array.isArray(value)) {
          errors.push({
            message: 'Invalid type for array property',
            property: propertyPath,
            type: 'array',
            value
          });
        } else {
          value.forEach((item, index) => {
            const result = validateObject(propertySchema.items, item, \`\${propertyPath}[\${index}]\`);
            errors = errors.concat(result.errors);
          });
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  return validateObject(schema, data);
}
```

### Validating Data Types

The following types are supported in the default validation:

- **integer**
- **string**
- **boolean**
- **number**
- **array**
- **object**
- **null**

If the data does not match the expected type, an error is returned.

```js
function validateType(value, type) {
  if (Array.isArray(type)) {
    return type.some(t => validateType(value, t));
  }
  if (type === "integer") return Number.isInteger(value);
  if (type === "string") return typeof value === "string";
  if (type === "boolean") return typeof value === "boolean";
  if (type === "number") return typeof value === "number" && !isNaN(value);
  if (type === "array") return Array.isArray(value);
  if (type === "object") return typeof value === "object" && !Array.isArray(value) && value !== null;
  if (type === "null") return value === null;
  return false;
}
```

## Conclusion

The `validateMethod` allows users to provide custom validation logic to extend or replace the built-in validation. The built-in validation ensures data consistency based on the schema. The `novalidate` attribute can be used to skip validation when necessary. 

With these options, DataEntry provides a flexible validation system to ensure your data is valid before submission.
