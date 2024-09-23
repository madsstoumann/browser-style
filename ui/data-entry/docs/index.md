
# DataEntry Documentation

DataEntry is an advanced Web Component that renders a UI from an endpoint (data) and a schema. This documentation provides an overview of how to use DataEntry, including setting data, schema, lookup, and messages.

## Using HTML Attributes

You can set `data`, `schema`, `lookup`, and `messages` using HTML attributes when declaring the `<data-entry>` component:

```html
<data-entry
  data="data/product.json"
  schema="data/schema.json"
  lookup="data/lookup.json"
  messages="data/messages.json"
  lang="en"
  debug>
</data-entry>
```

- `data`: URL of the data resource (JSON file).
- `schema`: URL of the schema resource (JSON Schema).
- `lookup`: URL for global lookup data (optional).
- `messages`: URL for custom messages (optional).
- `lang`: Sets the language for translation.
- `debug`: Enables debug logging to the console.

## Using JavaScript

If you prefer to set data, schema, or other resources directly using JavaScript, you can do so by accessing the DataEntry instance and its properties.

### Setting Data and Schema Programmatically

You can directly set the `data`, `schema`, `lookup`, or `messages` using JavaScript:

```javascript
const dataEntry = document.querySelector('data-entry');

// Set data
dataEntry.data = {
  id: 1,
  name: "Example Product",
  description: "This is an example product."
};

// Set schema
dataEntry.schema = {
  type: "object",
  properties: {
    id: { type: "number" },
    name: { type: "string" },
    description: { type: "string" }
  }
};

// Set lookup
dataEntry.lookup = {
  product_type: [
    { label: "Book", value: 1 },
    { label: "Comic", value: 2 },
  ]
};

// Set messages
dataEntry.messages = [
  { code: 400, message: "Bad Request", type: "info" },
  { code: 404, message: "Not Found", type: "error" }
];
```

## Validation and Form Submission

DataEntry automatically validates the form based on the provided schema. You can control whether validation is enforced by setting the `novalidate` attribute.

### Auto-Save Functionality

You can also enable auto-save functionality by specifying the `data-auto-save` attribute on the form with a time interval (in seconds). The form will automatically submit the data at the given interval.

```html
<form data-auto-save="60"> <!-- Auto-save every 60 seconds -->
```

## Debugging

If you include the `debug` attribute, DataEntry will log helpful information to the console during rendering, form submissions, and when handling errors.
