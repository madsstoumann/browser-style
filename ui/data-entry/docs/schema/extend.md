
# Extending the Schema

When working with the **DataEntry** component, the schema can be extended with several additional fields that define how the component renders content and behaves. The following sections explain how to extend the schema with **Navigation**, **Headline**, **Title**, and **Form Buttons**.

## Navigation

The `navigation` attribute in the schema defines a navigation menu that can be rendered dynamically based on the schema's structure. It creates links to specific sections within the document.

- **Syntax**:
```json
"navigation": "nav"
```

- **Usage**: This specifies the part attribute to be applied to the `<nav>` element that renders the navigation. It’s useful when the form is long or contains multiple sections, allowing quick navigation between different sections of the UI.
- **How it works**: Each array or object field in your schema will generate a link within the navigation. The part attribute value will define styling for the navigation.

## Headline

The `headline` attribute allows you to dynamically render a title or heading at the top of your form, based on values in your data. It can also support localization via the `${}` pattern.

- **Syntax**:
  ```json
  "headline": "${name} (${id})"
  ```
- **Usage**: This renders a dynamic headline where `${name}` and `${id}` are replaced with the actual values from the data. You can use any data field enclosed in `${}` to populate the headline.
- **Translation**: If you want the headline to support translation, you can use `${t:}` to mark parts of the headline that need translation. For example:
  ```json
  "headline": "${t:product_name} (${id})"
  ```

## Title

The `title` attribute is a static or dynamic string that appears as the legend for the root fieldset of the form.

- **Syntax**:
  ```json
  "title": "${t:details}"
  ```
- **Usage**: This attribute works similarly to the headline, but it is specifically used to title the root fieldset of the form. The value can be either static or dynamic, with support for localization using `${t:}` for translation. For example, `${t:details}` will be replaced by a translated string like "Details" based on the current `lang` setting.

## Form Buttons

The `form` attribute defines the buttons that appear at the bottom of the form. These can include reset, submit, and other custom actions.

- **Syntax**:
  ```json
  "form": [
    {
      "type": "reset",
      "label": "Reset"
    },
    {
      "action": "/api/DeleteProduct/:id",
      "label": "${t:delete}",
      "method": "DELETE",
      "contentType": "form"
    },
    {
      "action": "/api/SetProduct/:id",
      "label": "${t:post}",
      "method": "POST",
      "contentType": "json"
    },
    {
      "type": "submit",
      "label": "Submit",
      "autoSave": 0
    }
  ]
  ```

### Button Types:
1. **Reset**: A reset button clears the form's inputs.
   ```json
   {
     "type": "reset",
     "label": "Reset"
   }
   ```
   - **label**: Text displayed on the button.
   
2. **Custom Action Buttons**: These buttons perform actions like sending a `DELETE` or `POST` request.
   ```json
   {
     "action": "/api/DeleteProduct/:id",
     "label": "${t:delete}",
     "method": "DELETE",
     "contentType": "form"
   }
   ```
   - **action**: The endpoint to send data to.
   - **label**: Text displayed on the button (can be localized using `${t:}`).
   - **method**: HTTP method used (`POST`, `DELETE`, etc.).
   - **contentType**: Specifies the format for sending the data (e.g., `form`, `json`).
   
3. **Submit**: A submit button sends the form data when clicked.
   ```json
   {
     "type": "submit",
     "label": "Submit",
     "autoSave": 0
   }
   ```
   - **label**: Text displayed on the button.
   - **autoSave**: Optionally auto-save form data (set `0` to disable).

### Localization:
- Button labels can be localized using `${t:}` keys.
  ```json
  {
    "label": "${t:delete}"
  }
  ```
  This key will be translated based on the language set in the `lang` attribute of the `DataEntry` component.

## Example of a Schema with Extended Fields:

```json
{
  "$schema": "https://json-schema.org/draft/2019-09/schema",
  "type": "object",

  "navigation": "nav",
  "headline": "${name} (${id})",
  "title": "${t:details}",

  "form": [
    {
      "type": "reset",
      "label": "Reset"
    },
    {
      "action": "/api/DeleteProduct/:id",
      "label": "${t:delete}",
      "method": "DELETE",
      "contentType": "form"
    },
    {
      "action": "/api/SetProduct/:id",
      "label": "${t:post}",
      "method": "POST",
      "contentType": "json"
    },
    {
      "type": "submit",
      "label": "Submit",
      "autoSave": 0
    }
  ],

  "properties": {
    "id": {
      "type": "number",
      "title": "Id"
    },
    "name": {
      "type": "string",
      "title": "Name"
    }
  }
}
```
