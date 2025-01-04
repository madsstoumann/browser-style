# Core Concepts

DataEntry is a JavaScript library for creating dynamic forms based on JSON schema definitions. This document covers the core concepts and basic usage.

## Initialization

Create a new DataEntry instance by passing a container element and options:

```js
const entry = new DataEntry(document.querySelector('#form-container'), {
  schema: mySchema,
  data: initialData,
  i18n: translations
});
```

### Configuration Options

- `schema`: (Required) JSON schema defining form structure
- `data`: (Optional) Initial form data
- `i18n`: (Optional) Translation object for internationalization
- `constants`: (Optional) Global variables accessible in schema
- `validate`: (Optional) Enable/disable form validation

## Basic Usage

```js
// Define a schema
const schema = {
  type: "object",
  properties: {
    name: {
      type: "string",
      title: "Name",
      render: {
        method: "input"
      }
    }
  }
};

// Initialize DataEntry
const entry = new DataEntry('#form', { schema });

// Get form data
const data = entry.getData();

// Set form data
entry.setData({ name: "John Doe" });

// Reset form
entry.reset();
```

## Lifecycle Methods

DataEntry provides several lifecycle methods you can hook into:

- `onInit`: Called after initialization
- `onChange`: Called when form data changes
- `onSubmit`: Called when form is submitted
- `onValidate`: Called during validation

Example:

```js
entry.onChange((data) => {
  console.log('Form data changed:', data);
});
