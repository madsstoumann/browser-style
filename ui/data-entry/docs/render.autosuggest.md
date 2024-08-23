## `autosuggest` Function

The `autosuggest` function is responsible for generating the HTML structure for an `<auto-suggest>` custom element. It uses configuration parameters provided in the schema to render a fully functional autocomplete input field.

### Parameters

- `params`: An object containing various parameters necessary for rendering the `<auto-suggest>` element. This object includes:
  - `config`: The configuration object, which is typically nested under `params.config.render.autosuggest`.
  - `path`: A string representing the path to the data in the overall form structure.
  - `formID`: The ID of the form to which this `<auto-suggest>` element belongs.
  - `value`: The current value of the data, which may be used to pre-fill the input fields.

### Configuration Object (Schema)

The configuration object (`config`) used by the `autosuggest` function contains the following keys:

- `api`: The API endpoint URL that the `<auto-suggest>` component will query to fetch suggestions.
- `apiKeyName`: The key name in the returned JSON object that represents the unique identifier for each suggestion.
- `apiValueName`: The key name in the returned JSON object that represents the display value for each suggestion.
- `label`: (Optional) A label for the `<auto-suggest>` input field.
- `mapping`: (Optional) An object that maps the fields in the autosuggest result to the form fields.
- `values`: (Optional) An object that specifies the initial values for the `key` and `value` fields. This object contains:
  - `key`: The path to the field in the data structure that corresponds to the `key`.
  - `value`: The path to the field in the data structure that corresponds to the `value`.

### Functionality

1. **Initial Configuration**: 
   - The function first extracts the `autosuggest` configuration from `params.config.render.autosuggest`.
   - If the configuration is not present, the function returns an empty string, effectively skipping the rendering of the `<auto-suggest>` component.

2. **Value Pre-Filling**:
   - If `values` and `params.value` are provided, the function attempts to pre-fill the `key` and `value` fields using the `getObjectByPath` utility function. This allows the `<auto-suggest>` component to display initial values based on existing data.

3. **Rendering**:
   - The function returns a string containing the HTML for the `<auto-suggest>` component.
   - This includes setting attributes such as `api`, `api-key`, `api-value`, `label`, and `data-mapping`.
   - The `data-mapping` attribute stores the mapping configuration as a JSON string, allowing the component to correctly map API response data to the corresponding form fields.
   - The `form` attribute is included if `formID` is provided, linking the `<auto-suggest>` component to a specific form.

### Example

Given a configuration like the following:

```json
"vendor": {
  "type": "object",
  "title": "vendor",
  "properties": {
    "vendor_id": {
      "type": "number",
      "title": "Id"
    },
    "vendor_name": {
      "type": "string",
      "title": "Name"
    }
  },
  "render": {
    "method": "autosuggest",
    "autosuggest": {
      "api": "https://example.com/api/vendors",
      "apiKeyName": "vendor_id",
      "apiValueName": "vendor_name",
      "label": "Vendor",
      "mapping": {
        "vendor_id": "vendor_id",
        "vendor_name": "vendor_name"
      },
      "values": {
        "key": "vendor_id",
        "value": "vendor_name"
      }
    }
  }
}
```

The `autosuggest` function would generate the following HTML:

```html
<auto-suggest 
  part="autosuggest" 
  name="vendor"
  api="https://example.com/api/vendors"
  api-key="vendor_id"
  api-value="vendor_name"
  key="123"
  label="Vendor"
  value="Example Vendor Name"
  data-mapping='{"vendor_id":"vendor_id","vendor_name":"vendor_name"}'
  form="formID"></auto-suggest>
```


### Notes

- Flexibility: The function is designed to be flexible and handle a variety of configurations, including optional attributes like mapping and values.
- Pre-filling: By using the values object, the <auto-suggest> component can be pre-filled with existing data, providing a better user experience.

