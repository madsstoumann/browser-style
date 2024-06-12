export function generateRenderMethod(type, key) {
  const baseAttributes = [{ name: key }];
  if (type === 'string') {
    // Check if the string is a valid ISO 8601 date
    const iso8601DateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[\+\-]\d{2}:\d{2})?$/;

    if (iso8601DateRegex.test(key)) {
      return {
        method: 'input',
        attributes: baseAttributes.concat([{ type: 'datetime-local' }, { placeholder: 'Enter date and time' }])
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

  // Add more type handling as needed

  // Default case for unsupported types
  return {
    method: 'input',
    attributes: baseAttributes.concat([{ type: 'text' }, { placeholder: `Enter ${key}` }])
  };
}

export function generateSchemaFromData(data, schemaId, schemaUri) {
  const schema = {
    $schema: schemaUri,
    $id: schemaId,
    type: 'object',
    properties: {},
    required: [],
  };

  for (const [key, value] of Object.entries(data)) {
    const type = typeof value;
    const render = generateRenderMethod(type, key);

    if (type === 'object' && value !== null && !Array.isArray(value)) {
      schema.properties[key] = {
        type: 'object',
        title: key,
        properties: generateSchemaFromData(value, schemaId, schemaUri).properties,
        required: Object.keys(value),
      };
    } else if (Array.isArray(value)) {
      schema.properties[key] = {
        type: 'array',
        title: key,
        items: {
          type: 'object',
          properties: generateSchemaFromData(value[0] || {}, schemaId, schemaUri).properties,
        },
        render: {
          method: 'entry',
          attributes: [{ id: `add_${key}` }, { label: `Add ${key}` }, { name: `new_${key}` }],
        },
      };
    } else {
      schema.properties[key] = {
        type: 'string', // Always set type to string
        title: key,
        render,
      };
      schema.required.push(key);
    }
  }

  return schema;
}
