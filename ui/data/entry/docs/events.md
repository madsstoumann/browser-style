# Event Handling

DataEntry provides a comprehensive event system for responding to form interactions.

## Available Events

### Core Events

- `init`: Fired when DataEntry is initialized
- `change`: Fired when any form value changes
- `submit`: Fired on form submission
- `validate`: Fired during validation
- `error`: Fired when an error occurs

### Field Events

- `field:change`: Fired when a specific field changes
- `field:focus`: Fired when a field receives focus
- `field:blur`: Fired when a field loses focus

## Event Subscription

Subscribe to events using the `on` method:

```js
entry.on('change', (data) => {
  console.log('Form data:', data);
});

entry.on('field:change', (fieldName, value) => {
  console.log(`Field ${fieldName} changed to:`, value);
});
```

## Event Configuration in Schema

You can define event handlers directly in the schema:

```json
{
  "type": "string",
  "title": "Email",
  "render": {
    "method": "input",
    "events": {
      "blur": "validateEmail",
      "change": "updatePreview"
    }
  }
}
```

## Custom Events

Create and dispatch custom events:

```js
// Define custom event handler
entry.on('custom:save', (data) => {
  // Handle custom save event
});

// Trigger custom event
entry.emit('custom:save', formData);
```
