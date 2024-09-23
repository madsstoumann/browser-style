
# Rendering Methods in DataEntry

In **DataEntry**, users can customize the way each data entry is rendered by providing a `render` object inside the schema for each property. This allows control over how specific fields are displayed in the UI. Below we’ll explain how you can provide a render object, customize it, and the detailed information about various rendering methods available, including the more complex `array-details` and `autosuggest` methods.

## Providing a Render Object

The `render` object is specified for each property inside the schema. It allows you to define how the UI should render specific data fields. This includes the method of rendering (such as `input`, `select`, `array-details`, etc.) and any additional attributes required for that rendering.

### Example of a Render Object:
```json
{
  "type": "string",
  "title": "Name",
  "render": {
    "method": "input",
    "attributes": [
      { "name": "name" },
      { "placeholder": "Enter name" }
    ]
  }
}
```

In this example, the `render` object tells **DataEntry** to render the `name` field as an `input` element with a placeholder.

## Customizing Render Objects

Users can customize various aspects of the render object by adding:
- **method**: The method defines the type of input or display element (e.g., `input`, `select`, `richtext`, etc.).
- **attributes**: This array defines additional HTML attributes for the rendered element (e.g., `placeholder`, `type`, `disabled`, etc.).
  
Additionally, the `render` object can include settings for advanced controls like `autosuggest` and `array-details`, allowing more complex behaviors and structures.

## Render Methods

### 1. **Input**
Renders a basic input field (e.g., text, number, date, etc.).

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

- **Attributes**: Specify standard HTML attributes like `type`, `placeholder`, `disabled`, etc.

### 2. **Select**
Renders a dropdown `<select>` element populated with options.

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

- **Options**: The `options` field defines where the options will be pulled from (e.g., from a data source).

> TODO!
  
### 3. **Richtext**
Renders a rich text editor with various formatting options.

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

### 4. **Array-Details**
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
- **value**: The `value` defines the content displayed inside the expanded `<details>` section.
- **add**: A boolean that indicates if the user can add new entries to the array.
- **delete**: A boolean that indicates if the user can delete entries from the array.

The `array-details` method is particularly useful for managing complex arrays of data where each item may have multiple fields, and users need to toggle the visibility of those fields for better organization.

### 5. **Autosuggest**
The `autosuggest` control is a more complex render method that allows users to enter text and receive suggestions based on data from an external API. This method is useful for fields like address lookup or selecting from a large dataset.

#### Example:
```json
{
  "type": "object",
  "title": "Vendor",
  "render": {
    "method": "autosuggest",
    "autosuggest": {
      "api": "https://example.com/api/vendors?q=",
      "apiArrayPath": "results",
      "apiValuePath": "vendor.id",
      "apiDisplayPath": "vendor.name",
      "label": "Vendor Name",
      "mapping": {
        "vendor_id": "vendor.id",
        "vendor_name": "vendor.name"
      },
      "syncInstance": true
    }
  }
}
```

#### Breakdown:
- **api**: The URL of the API that returns suggestions.
- **apiArrayPath**: The path to the array in the API response that contains the suggestion data.
- **apiValuePath**: The path to the specific value to be stored (e.g., the ID of the vendor).
- **apiDisplayPath**: The path to the display value to be shown in the dropdown (e.g., the vendor name).
- **mapping**: Defines how values from the API response map to the fields in the form (e.g., vendor ID and name).
- **syncInstance**: A boolean that indicates whether the form instance should be synchronized with the selected value from the suggestions.

## Key Takeaways
- You can customize how data fields are rendered using the `render` object within the schema.
- Render methods like `array-details` and `autosuggest` allow for more advanced UI elements that can handle arrays of data and external data sources.
- Each render method supports additional attributes and settings to further tailor the behavior and appearance of the rendered elements.
