
# Global Data (Lookup Data) in DataEntry

Global data (also referred to as "lookup data") in **DataEntry** is a powerful feature that allows you to define reusable datasets that can be referenced in your schema to dynamically populate options in fields like dropdowns (`<select>`). This feature simplifies managing common lists, such as product types, conditions, or statuses, across your application.

## Using the Global Data Endpoint

Global data is typically provided via an external endpoint, loaded using the `lookup` (or potentially `global-data`) attribute on the **DataEntry** component.

### Example Data from a Lookup Endpoint

An example response from the global data endpoint might look like this:

```json
{
  "condition": [
    { "label": "New", "value": 1 },
    { "label": "Used", "value": 2 },
    { "label": "Refurbished", "value": 3 }
  ],
  "product_type": [
    { "label": "Book", "value": 1 },
    { "label": "Comic", "value": 2 },
    { "label": "Figure", "value": 3 },
    { "label": "Film", "value": 4 },
    { "label": "Game", "value": 5 }
  ]
}
```

In this example:
- `condition` is a list of conditions with labels (New, Used, Refurbished) and corresponding values.
- `product_type` is a list of product types (Book, Comic, etc.) with associated values.

These lists can be used in your schema to populate `<select>` fields with dynamic options.

## Defining the Global Data Endpoint in DataEntry

You can define the global data source by specifying a URL in the `lookup` attribute (or `global-data` if you rename it). **DataEntry** will then fetch this data and use it to populate fields as needed.

### Example Usage:
```html
<data-entry
  lookup="data/lookup.json"
  schema="data/schema.json"
  data="data/product.json"
  lang="en"
></data-entry>
```

In this example:
- The `lookup` attribute points to a file (`lookup.json`) that contains global data, like the example shown above.
- The schema and data are loaded via their respective endpoints.

## Using Global Data in the Schema

To reference global data in your schema, simply provide the key from the global data object in the `options` field of a `select` input.

### Example Schema with Global Data:
```json
{
  "type": "object",
  "properties": {
    "product_type_id": {
      "type": "number",
      "title": "Product Type",
      "render": {
        "method": "select",
        "options": "product_type"
      }
    },
    "condition_id": {
      "type": "number",
      "title": "Condition",
      "render": {
        "method": "select",
        "options": "condition"
      }
    }
  }
}
```

In this schema:
- The `product_type_id` field uses the `product_type` global data to populate its options.
- The `condition_id` field uses the `condition` global data for its dropdown options.

When **DataEntry** renders these fields, it will look for the `options` key (e.g., `product_type` or `condition`) in the global data, and if found, it will populate the dropdown (`<select>`) with the corresponding `label` and `value` pairs.

### Example of the Rendered Select Fields:
```html
<select name="product_type_id">
  <option value="1">Book</option>
  <option value="2">Comic</option>
  <option value="3">Figure</option>
  <option value="4">Film</option>
  <option value="5">Game</option>
</select>

<select name="condition_id">
  <option value="1">New</option>
  <option value="2">Used</option>
  <option value="3">Refurbished</option>
</select>
```

### Key Takeaways:
- **Global Data**: Use global data to populate dropdowns and other dynamic lists across your forms.
- **Endpoint**: Specify the endpoint for the global data in the `lookup` (or `global-data`) attribute of **DataEntry**.
- **Options Key**: Reference the global data in your schema using the `options` field in the `render` object.
- **Reusable**: By centralizing common data lists, you can reuse them across multiple form fields, reducing duplication and ensuring consistency.
