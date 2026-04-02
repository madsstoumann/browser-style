# Rendering Methods in DataEntry

The rendering system in DataEntry allows you to control how each entry (object or array) is rendered through a `render` object in your schema.

## Basic Structure
Define a render object within your schema property like this:

### Example of a Render Object:
```json
"render": {
  "method": "input",
  "attributes": [
    { "name": "name" },
    { "placeholder": "Enter name" }
  ]
}
```

In this example, the `render` object tells **DataEntry** to use the built-in `input()`-method. This is a very simple method, that returns an `<input>`-field with all the `attributes` specified:


```html
<input name="name" placeholder="Enter name">
```

The `attributes` contains an array of objects, which you can extend with whatever you want.

If you just have simple `key/value`-pairs, you can use a single object instead:

```json
"render": {
  "method": "input",
  "attributes": [{
    "name": "name",
    "placeholder": "Enter name"
  }]
}
```

## Customizing Render Objects

You can customize various aspects of the render object by adding:

- **method**: The method defines the type of input or display element (e.g., `input`, `select`, `richtext`, etc.). You can define your own methods with `extendRenderMethod`.
- **attributes**: This array defines additional HTML attributes for the rendered element (e.g., `placeholder`, `type`, `disabled`, etc.).
  
Additionally, the `render` object can include settings for advanced controls like `autosuggest` and `array-details`, allowing more complex behaviors and structures.

## Built-in Render Methods

DataEntry provides the following built-in render methods for different field types:

### Basic Input Methods

#### 1. **input**
Renders a basic input field (text, number, date, etc.).

```json
{
  "render": {
    "method": "input",
    "attributes": [
      { "type": "text" },
      { "placeholder": "Enter text here" }
    ]
  }
}
```

**Attributes**: Supports all standard HTML input attributes like `type`, `placeholder`, `disabled`, `min`, `max`, `pattern`, etc.

**Formatter Support**: Use `formatter` property to transform display values:
```json
{
  "render": {
    "method": "input",
    "formatter": "${d:formatCurrency ${value} USD}"
  }
}
```

#### 2. **textarea**
Renders a multi-line text input.

```json
{
  "render": {
    "method": "textarea",
    "attributes": [
      { "rows": "5" },
      { "placeholder": "Enter description" }
    ]
  }
}
```

#### 3. **richtext**
Renders a WYSIWYG rich text editor with formatting options.

```json
{
  "render": {
    "method": "richtext",
    "attributes": [
      { "toolbar": "h1,h2,b,i,u,link" }
    ]
  }
}
```

**Note**: Requires the `@browser.style/rich-text` component.

#### 4. **link**
Renders a clickable hyperlink.

```json
{
  "render": {
    "method": "link",
    "attributes": [
      { "target": "_blank" }
    ]
  }
}
```

#### 5. **media**
The `media` method is used to render media elements such as images or videos with preview. This method is useful for managing media content with specific properties.

#### Example:
```json
{
  "render": {
    "method": "media",
    "attributes": [
      { "alt": "Product image" }
    ]
  }
}
```

#### Breakdown:
- Renders media elements (images, videos) with appropriate HTML tags
- **attributes**: Standard HTML attributes like `alt`, `width`, `height`, etc.
- Automatically detects media type based on file extension or MIME type

### Selection Methods

#### 6. **select**
Renders a dropdown select field with options from lookup data or schema.

```json
{
  "render": {
    "method": "select",
    "options": "condition",
    "attributes": [
      { "name": "condition" }
    ]
  }
}
```

**Option Sources**:
- `options`: Reference to lookup data key
- Static array in schema
- Dynamic options via `selectedOption` property

**Advanced Features**:
- `selectedOption`: Add a default option (e.g., "Select...")
- `selectedOptionDisabled`: Make default option unselectable
- `action`: Add action button next to select
- `label`: Template for option display text
- `value`: Field to use for option values

### Component-Based Methods

#### 7. **autosuggest**
The `autosuggest` control is a more complex render method that allows you to enter text and receive suggestions based on data from an external API. This method is useful for fields like address lookup or selecting from a large dataset.

#### Example:
```json
{
  "render": {
    "method": "autosuggest",
    "autosuggest": {
      "api": "https://api.example.com/search?q=",
      "apiArrayPath": "results",
      "apiValuePath": "id",
      "apiDisplayPath": "name",
      "label": "Search Products",
      "mapping": {
        "product_id": "id",
        "product_name": "name"
      },
      "syncInstance": true
    }
  }
}
```

#### Breakdown:
- **api**: The URL of the API that returns suggestions.
- **apiArrayPath**: The path to the array in the API response that contains the suggestion data.
- **apiValuePath**: The path to the specific value to be stored (e.g., the ID of the product).
- **apiDisplayPath**: The path to the display value to be shown in the dropdown (e.g., the product name).
- **mapping**: Defines how values from the API response map to the fields in the form (e.g., product ID and name).
- **syncInstance**: A boolean that indicates whether the form instance should be synchronized with the selected value from the suggestions.

**Note**: Requires the `@browser.style/auto-suggest` component.

#### 8. **barcode**
The `barcode` method enables barcode scanning functionality within your forms. It is typically used in combination with array render methods like `array-units` to add items based on scanned barcodes.

#### Example:
```json
{
  "render": {
    "method": "barcode",
    "barcode": {
      "api": "https://api.example.com/products/",
      "apiArrayPath": "data",
      "mapping": {
        "sku": "sku",
        "name": "name"
      }
    }
  }
}
```

#### Breakdown:
- **api**: The URL of the API that returns product information based on the scanned barcode.
- **apiArrayPath**: The path to the array in the API response that contains the product data.
- **mapping**: Defines how values from the API response map to the fields in the form (e.g., product SKU and name).

**Note**: Requires the `@browser.style/barcode-scanner` component.

#### 9. **datamapper**
Renders a file upload interface for CSV/Excel import.

```json
{
  "render": {
    "method": "datamapper"
  }
}
```

**Note**: Requires the `@browser.style/data-mapper` component.

### Array Rendering Methods

#### 10. **array-details**
The `array-details` method is used to render arrays of data where each item can be expanded or collapsed using a `<details>` element. This method requires additional `label` and `value` properties to define the summary and display for each entry.

#### Example:
```json
{
  "type": "array",
  "title": "Categories",
  "render": {
    "method": "array-details",
    "label": "${name}",
    "value": "${description}",
    "add": true,
    "delete": true
  },
  "items": {
    "type": "object",
    "properties": {
      "name": { "type": "string", "title": "Category Name" },
      "description": { "type": "string", "title": "Description" }
    }
  }
}
```

#### Breakdown:
- **label**: This defines the text displayed in the `<summary>` element, which is used as the clickable area of the `<details>` toggle.
- **value**: The `value` defines the content displayed inside the expanded `<details>` section. Supports `|` separator for columns.
- **add**: A boolean that indicates if you can add new entries to the array.
- **delete**: A boolean that indicates if you can delete entries from the array.
- **arrayControl**: Control type for deletion (default: "mark-remove")

The `array-details` method is particularly useful for managing complex arrays of data where each item may have multiple fields, and you need to toggle the visibility of those fields for better organization.

#### 11. **array-units**
The `array-units` method is used to render arrays of data where each item represents a unit with specific properties. This method renders arrays as compact single-line units with one visible field and hidden fields for the rest.

#### Example:
```json
{
  "type": "array",
  "title": "Units",
  "render": {
    "method": "array-units",
    "label": "${unitName}",
    "add": true,
    "delete": true
  },
  "items": {
    "type": "object",
    "properties": {
      "unitName": { "type": "string", "title": "Unit Name" },
      "unitDescription": { "type": "string", "title": "Description" }
    }
  }
}
```

#### Breakdown:
- **label**: This defines the text displayed for each unit in the array.
- **add**: A boolean that indicates if you can add new units to the array.
- **delete**: A boolean that indicates if you can delete units from the array.

**Use case**: Compact lists where only one field needs to be visible (e.g., tags, simple lists).

#### 12. **array-grid**
Renders arrays as a grid of editable fieldsets.

```json
{
  "type": "array",
  "render": {
    "method": "array-grid",
    "add": true,
    "delete": true
  }
}
```

**Use case**: Tabular data where all fields are visible and editable inline.

#### 13. **array-checkbox**
Renders arrays as a list of checkboxes for multi-select scenarios.

```json
{
  "type": "array",
  "render": {
    "method": "array-checkbox",
    "label": "name",
    "value": "enabled"
  }
}
```

**Use case**: Permission lists, feature toggles, multi-select from predefined options.

#### 14. **array-link**
The `array-link` method is used to render arrays of data where each item is a link. This method is useful for managing lists of links with specific properties.

#### Example:
```json
{
  "type": "array",
  "title": "Links",
  "render": {
    "method": "array-link",
    "label": "${linkText}",
    "value": "${url}",
    "add": true,
    "delete": true
  },
  "items": {
    "type": "object",
    "properties": {
      "linkText": { "type": "string", "title": "Link Text" },
      "linkUrl": { "type": "string", "title": "URL" }
    }
  }
}
```

#### Breakdown:
- **label**: This defines the text displayed for each link in the array.
- **value**: The URL for each link.
- **add**: A boolean that indicates if you can add new links to the array.
- **delete**: A boolean that indicates if you can delete links from the array.

**Use case**: Managing lists of URLs, related resources, or navigation links.

### Container Methods

#### 15. **fieldset**
Groups related fields within a fieldset element.

```json
{
  "render": {
    "method": "fieldset",
    "label": "Contact Information"
  }
}
```

#### 16. **entry**
Creates a popover form for adding new array items.

**Note**: This is typically generated automatically when arrays have `add: true`. The entry method creates:
- A popover with form fields
- Add, reset, and close buttons
- Optional autosuggest and barcode scanner integration

```json
{
  "type": "array",
  "render": {
    "method": "array-details",
    "add": true,
    "addMethod": "arrayUnit",
    "autosuggest": { /* config */ },
    "barcode": { /* config */ }
  }
}
```

## Customizing Render Objects

You can customize various aspects of the render object by adding:

- **method**: The method defines the type of input or display element (e.g., `input`, `select`, `richtext`, etc.). You can define your own methods with `extendRenderMethod`.
- **attributes**: This array defines additional HTML attributes for the rendered element (e.g., `placeholder`, `type`, `disabled`, etc.).
  
Additionally, the `render` object can include settings for advanced controls like `autosuggest` and `array-details`, allowing more complex behaviors and structures.

## Key Takeaways
- You can customize how data fields are rendered using the `render` object within the schema.
- Render methods like `array-details`, `autosuggest`, `array-units`, `array-link`, `media`, and `barcode` allow for advanced UI elements that can handle arrays of data, external data sources, and media content.
- Each render method supports additional attributes and settings to further tailor the behavior and appearance of the rendered elements.
- Use the `formatter` property with input fields to transform display values using dynamic functions.

