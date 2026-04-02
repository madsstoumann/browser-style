# DataEntry

A dynamic web component for creating data entry forms with JSON schema validation, internationalization support, and auto-save functionality.

## Installation

```bash
npm install @browser.style/data-entry
```

## Usage

```javascript
import '@browser.style/data-entry';
```

```html
<!-- Basic usage -->
<data-entry
  data="/api/data"
  schema="/api/schema"
  i18n="/api/i18n"
  lang="en">
</data-entry>

<!-- With all features -->
<data-entry
  auto-save="30"
  data="/api/data"
  debug
  i18n="/api/i18n"
  lang="en"
  lookup="/api/lookup"
  messages="/api/messages"
  primary-keys="id,code"
  schema="/api/schema"
  shadow>
</data-entry>
```

## Attributes

- `auto-save`: Auto-save interval in seconds
- `data`: URL to fetch form data
- `debug`: Enable debug logging
- `i18n`: URL to fetch translations
- `lang`: Language code (default: 'en')
- `lookup`: URL to fetch lookup data
- `messages`: URL to fetch validation messages
- `primary-keys`: Comma-separated primary key fields
- `schema`: URL to fetch JSON schema
- `shadow`: Use shadow DOM

## Properties

- `data`: Get/set form data object
- `schema`: Get/set JSON schema object
- `lookup`: Get/set lookup data array
- `i18n`: Get/set translations object
- `constants`: Get/set constants object
- `validateMethod`: Set custom validation function

## Events

- `de:custom`: Custom button clicked
- `de:entry`: Form data processed
- `de:notify`: Notification triggered
- `de:resetfields`: Fields reset
- `de:submit`: Form submitted
- `de:record-created`: New record created
- `de:record-deleted`: Record deleted
- `de:record-upserted`: Record updated

## Form Integration

```html
<form>
  <data-entry name="entry"></data-entry>
</form>
```

Access form values:
```javascript
const form = document.querySelector('form');
const entry = form.elements.entry;
console.log(entry.value); // Current form data
```

## Custom Validation

```javascript
const entry = document.querySelector('data-entry');
entry.validateMethod = (schema, data) => {
  // Custom validation logic
  return {
    valid: true,
    errors: []
  };
};
```

## Schema Example

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "title": "Name",
      "render": {
        "method": "input",
        "attributes": [
          { "type": "text" },
          { "required": "required" }
        ]
      }
    }
  }
}
