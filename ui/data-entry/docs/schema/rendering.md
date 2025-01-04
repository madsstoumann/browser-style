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


input
select
richtext
array-details
autosuggest
array-units
array-link
media
barcode


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

## Select Fields

Select fields are versatile and can be configured in multiple ways to suit your data source and requirements. When you use the `select` method in your render object, you can define options in several ways:

### 1. **Static Options**

Provide a static array of options directly in the schema.

### 1. Basic Select with Instance Lookup
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
  
### 2. **Richtext**
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

### 3. **Array-Details**
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
- **add**: A boolean that indicates if you can add new entries to the array.
- **delete**: A boolean that indicates if you can delete entries from the array.

The `array-details` method is particularly useful for managing complex arrays of data where each item may have multiple fields, and you need to toggle the visibility of those fields for better organization.

### 4. **Autosuggest**
The `autosuggest` control is a more complex render method that allows you to enter text and receive suggestions based on data from an external API. This method is useful for fields like address lookup or selecting from a large dataset.

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

### 5. **Array Units**
The `array-units` method is used to render arrays of data where each item represents a unit with specific properties. This method is useful for managing lists of items with detailed information.

#### Example:
```json
{
  "type": "array",
  "title": "Units",
  "render": {
    "method": "array-units",
    "unitLabel": "${unitName}",
    "unitValue": "${unitDescription}",
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
- **unitLabel**: This defines the text displayed for each unit in the array.
- **unitValue**: The `unitValue` defines the content displayed for each unit.
- **add**: A boolean that indicates if you can add new units to the array.
- **delete**: A boolean that indicates if you can delete units from the array.

### 6. **Array Link**
The `array-link` method is used to render arrays of data where each item is a link. This method is useful for managing lists of links with specific properties.

#### Example:
```json
{
  "type": "array",
  "title": "Links",
  "render": {
    "method": "array-link",
    "linkLabel": "${linkText}",
    "linkUrl": "${linkUrl}",
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
- **linkLabel**: This defines the text displayed for each link in the array.
- **linkUrl**: The `linkUrl` defines the URL for each link.
- **add**: A boolean that indicates if you can add new links to the array.
- **delete**: A boolean that indicates if you can delete links from the array.

### 7. **Media**
The `media` method is used to render media elements such as images or videos. This method is useful for managing media content with specific properties.

#### Example:
```json
{
  "type": "object",
  "title": "Media",
  "render": {
    "method": "media",
    "mediaType": "image",
    "mediaUrl": "${mediaUrl}",
    "mediaAlt": "${mediaAlt}"
  },
  "properties": {
    "mediaUrl": { "type": "string", "title": "Media URL" },
    "mediaAlt": { "type": "string", "title": "Alt Text" }
  }
}
```

#### Breakdown:
- **mediaType**: This defines the type of media (e.g., image, video).
- **mediaUrl**: The `mediaUrl` defines the URL for the media.
- **mediaAlt**: The `mediaAlt` defines the alternative text for the media.

### 8. **Barcode**

The `barcode` method enables barcode scanning functionality within your forms. It is typically used in combination with array render methods like `array-units` to add items based on scanned barcodes.

#### Example:
```json
{
  "type": "object",
  "title": "Product",
  "render": {
    "method": "barcode",
    "barcode": {
      "api": "https://example.com/api/products?barcode=",
      "apiArrayPath": "results",
      "apiValuePath": "product.id",
      "apiDisplayPath": "product.name",
      "label": "Product Name",
      "mapping": {
        "product_id": "product.id",
        "product_name": "product.name"
      },
      "syncInstance": true
    }
  }
}
```

#### Breakdown:
- **api**: The URL of the API that returns product information based on the scanned barcode.
- **apiArrayPath**: The path to the array in the API response that contains the product data.
- **apiValuePath**: The path to the specific value to be stored (e.g., the ID of the product).
- **apiDisplayPath**: The path to the display value to be shown in the form (e.g., the product name).
- **mapping**: Defines how values from the API response map to the fields in the form (e.g., product ID and name).
- **syncInstance**: A boolean that indicates whether the form instance should be synchronized with the scanned barcode data.

## Key Takeaways
- You can customize how data fields are rendered using the `render` object within the schema.
- Render methods like `array-details`, `autosuggest`, `array-units`, `array-link`, `media`, and `barcode` allow for more advanced UI elements that can handle arrays of data, external data sources, and media content.
- Each render method supports additional attributes and settings to further tailor the behavior and appearance of the rendered elements.
