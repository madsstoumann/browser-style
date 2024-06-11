# JSON Schema Documentation

## Overview 
For each endpoint, create a [JSON schema](https://jsonschema.net/).

[Validate the schema](https://www.jsonschemavalidator.net/) and add extra information for **renderering**, as described below.


## Schema Structure

### Basic Structure 

Each schema should include properties and, optionally, definitions for nested objects. Here’s a basic example of a schema with rendering properties:

```json
{
  "title": "Example Schema",
  "type": "object",
  "properties": {
    "id": {
      "type": "integer",
      "title": "ID",
      "render": {
        "method": "input",
        "attributes": [
          { "disabled": "disabled" },
          { "name": "id" },
          { "type": "number" }
        ]
      }
    },
    "name": {
      "type": "string",
      "title": "Name",
      "render": {
        "method": "input",
        "attributes": [
          { "name": "name" },
          { "type": "text" }
        ]
      }
    },
    "description": {
      "type": "string",
      "title": "Description",
      "render": {
        "method": "textarea",
        "attributes": [
          { "name": "description" }
        ]
      }
    },
    "status": {
      "type": "string",
      "title": "Status",
      "render": {
        "method": "select",
        "options": "status_options"
      }
    }
  }
}
```

### Render Property

The `render` property is an object containing information for rendering form elements


#### Example
```json
{
  "title": "Label Text",
  "render": {
    "method": "input",
    "attributes": [
      { "disabled": "disabled" },
      { "name": "id" },
      { "type": "number" }
    ]
  }
}
```

> **Note:** The `title`-property is used as label-text.

### Attributes

`attrubutes` is an array of attributes that will be set directly on the `<fieldset>`, `<input>` etc. 

If the attribute has the **same** `key` and `value`, like:

```json
{ "checked": "checked" }
```

— a _boolean_ attribute will be set, like in:


```html
<input type="checkbox" checked>
```


### Methods

The `method` key in the `render`-object determines the type of form element/s to render.

- `all`: Used to render a complete form from JSON and a schema †
- `checklist`: Custom method to return an array of check-items ‡
- `details`: Returns a `<details`>-tag with a nested fieldset §
- `fieldset`: Renders a fieldset
- `grid`
- `img`
- `input`: Renders an input element. Define `type` and more in `attributes`
- `media`
- `richtext`: Renders a rich-text editor
- `select`: Renders a select element
- `textarea`: Renders a textarea element

---

#### Richtext Method

Returns a custom element, `<ui-richtext>`, with the field-content. 

The toolbar can be configured through `attributes`:

```json
"attributes": [
  { "toolbar": "h1,h2,h3|b,i,u,s|sub,sup|ol,ul,hr|img|link,unlink" }
]
```

Read more about the editor at [browser.style](https://browser.style/ui/rich-text).

---

#### Select method

If method is `select`, provide an additional property: `options`:

```json
{
  "method": "select",
  "options": "product_condition"
}
```

`options` can either be a `string` or an `array`. If it's a string, the string will be used as a key and look in `localStorage` for a match.

#### † The `all` method

This method should be used as the main method, when rendering the JSON and it's schema:

#### Example
```js
fetchData('https://endpoint.com/', 'schema_name')
  .then(({ data, schema }) => app.innerHTML = render.all(data, schema))
  .catch(error => console.error(error));
```

### Arrays

If a field has it's `type`-property set to "array", you can set a render method directly on it's root:

#### Example
```json
{
  "price": {
    "type": "array",
    "default": [],
    "render": {
      "method": "details"
    },
  }
}
```

### Array Methods

#### ‡ The `checklist` method

The `checklist`-method requires three fields: `label`, `type` and `value`.  
Since we cannot guarentee the JSON-structure will be named exactly like this, we need to add a `property` to these fields with the _values_ `label`, `type` and `value`.


#### Example
```json
{
  "attr_label": {
    "type": "string",
    "property": "label"
  },
  "attr_type": {
    "type": "string",
    "property": "type"
  },
  "attr_value": {
    "type": "integer",
    "property": "value"
  }
}
```

#### § The `details` Method
This method simply wraps the fields within a `<fieldset>`, nested in a `<details>`-tag.  
The `title` will be used for `<summary>`. 

Use `render`-methods (and `attributes`) for each sub-field.

Two additional fields can be provided, when using `details`:

```json
{
  "summary": "currency_code",
  "label": "value"
}
```

If a field exists with the value (in this example "currency_code"), the actual _value_ from the field will be used — otherwise the literal string will be used.

---

### Extending the render-object with a custom method

```js
import { render } from './render.js';

// Define a custom render method
const customRenderMethod = (label, value, attributes = [], options = [], config) => {
  return ``;
};

// Register the custom render method
render.extend('custom', customRenderMethod);
```

---

### Popovers

When working with arrays, `render` can be extended with a `popover`-object:

```json
{
  "popover": {
    "id": "add_attribute",
    "label": "Add attribute",
    "name": "new_attribute",
    "items": []
  }
}
```


---

### Toolbars

A `render`-object can also have a `toolbar`-property. It's an array of buttons, that'll be added after the main render-method.


Extend
```html
<script type="module">
		document.addEventListener('DOMContentLoaded', () => {
			document.querySelectorAll('data-entry').forEach(el => {
				function customUtility(instance, param1, param2) {
					console.log('Custom utility called with params:', param1, param2);
					console.log('Instance data:', instance.data);
				}
				el.instance.extendUtilityMethod('customUtility', customUtility);
				console.log(el.instance);
			});
		});
	</script>
  ```