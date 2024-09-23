
# Additional Rendering Methods in DataEntry

Below are the descriptions of additional rendering methods in **DataEntry**, such as `arrayCheckbox`, `arrayGrid`, `entry`, `fieldset`, and more. These methods provide more complex functionality and control over how specific fields or arrays are displayed.

## Render Methods

### 1. **Array Checkbox**
Renders an array of checkboxes, where each checkbox corresponds to an item in the array.

#### Example:
```json
{
  "type": "array",
  "title": "Jobs",
  "render": {
    "method": "array-checkbox",
    "attributes": [
      { "part": "array-checkbox" }
    ],
    "summary": "active",
    "label": "job_name"
  }
}
```

- **Attributes**: Defines the part attribute for the array checkbox.
- **summary**: Defines the field to be summarized in the checkbox.
- **label**: The field label shown for each checkbox item.

### 2. **Array Grid**
Renders an array of items in a grid format, where each item is displayed as a set of fields.

#### Example:
```json
{
  "type": "array",
  "title": "Reviews",
  "render": {
    "method": "array-grid",
    "attributes": [
      { "part": "array-grid" }
    ],
    "label": "&nbsp;",
    "value": "&nbsp;",
    "add": true,
    "delete": true
  }
}
```

- **Attributes**: Specifies grid-related attributes.
- **label** and **value**: Optional settings for array-grid labels and values.

### 3. **Entry**
The `entry` method renders an entry form for adding new items to an array. It is often used in conjunction with methods like `array-details` or `array-checkbox`.

#### Example:
```json
{
  "render": {
    "method": "entry",
    "attributes": [
      { "form": "entryForm" }
    ]
  }
}
```

- **Attributes**: HTML attributes like `form` for managing form submission or settings.

### 4. **Fieldset**
The `fieldset` method is used to group multiple fields under one common title.

#### Example:
```json
{
  "render": {
    "method": "fieldset",
    "attributes": [
      { "part": "fieldset" }
    ]
  }
}
```

- **Attributes**: You can define various attributes to customize the fieldset, such as `part` or `name`.

### 5. **Icon**
The `icon` method is used to render an icon in the UI. This method often interacts with other render methods to provide visual enhancements.

#### Example:
```json
{
  "render": {
    "method": "icon",
    "attributes": [
      { "name": "delete-icon" },
      { "type": "icon" }
    ]
  }
}
```

### 6. **Media**
The `media` method is used to render image or media fields. For instance, it can be used to display uploaded images or external media.

#### Example:
```json
{
  "type": "object",
  "render": {
    "method": "media",
    "attributes": [
      { "name": "media_url" },
      { "alt": "image description" }
    ],
    "summary": "url",
    "label": "media_id"
  }
}
```

- **Attributes**: Attributes related to media display like `alt`, `name`, etc.
- **label** and **summary**: Define how to display media properties in the rendered output.

### 7. **Richtext**
Renders a rich text editor with customizable toolbar options.

#### Example:
```json
{
  "type": "string",
  "render": {
    "method": "richtext",
    "attributes": [
      { "toolbar": "h1,h2,b,i,u" }
    ]
  }
}
```

- **Attributes**: Specifies toolbar options like `h1`, `h2`, `bold`, `italic`, `underline`, etc.

### 8. **Textarea**
Renders a `<textarea>` for multi-line text input.

#### Example:
```json
{
  "render": {
    "method": "textarea",
    "attributes": [
      { "placeholder": "Enter description" },
      { "rows": "5" }
    ]
  }
}
```

- **Attributes**: HTML attributes like `placeholder`, `rows`, etc.

## Using Select Options

The `select` method, which renders a dropdown `<select>`, can populate its options in two ways:
1. **Array of Objects**: You can provide an array of objects with `key` and `value` properties for direct options.
   ```json
   {
     "render": {
       "method": "select",
       "options": [
         { "key": "1", "value": "Option 1" },
         { "key": "2", "value": "Option 2" }
       ]
     }
   }
   ```

2. **Lookup Key**: You can provide a string as the `options` value. This will be used as a lookup key to fetch global data from the `lookup` attribute (or potentially `global-data`) in the **DataEntry** component.
   ```json
   {
     "render": {
       "method": "select",
       "options": "product_type"
     }
   }
   ```

- **Global Data**: The global data is loaded via the `lookup` attribute (or `global-data`). This is a dataset used across multiple fields in the schema, enabling centralized management of options and other dynamic data.

### Example of Using Global Data:
```json
{
  "lookup": {
    "product_type": [
      { "key": "1", "value": "Electronics" },
      { "key": "2", "value": "Books" }
    ]
  },
  "properties": {
    "product_type_id": {
      "type": "number",
      "title": "Product Type",
      "render": {
        "method": "select",
        "options": "product_type"
      }
    }
  }
}
```

In this example, the `product_type_id` field is rendered as a select dropdown, with the options being fetched from the global `lookup` dataset.

## Key Takeaways
- **array-checkbox**, **array-grid**, **media**, and other methods give more advanced controls for rendering specific data types.
- **Global Data** (via `lookup` or `global-data`) is crucial for managing shared options across multiple form fields.
- Each render method supports customization through the `render` object and additional attributes.
