
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

## Form

The `form` attribute defines the configuration for form buttons that appear at the bottom of the form. These buttons can include reset, submit, and custom actions, and now allow for additional attributes such as `action`, `method`, and `enctype`.

### Syntax:
```json
"form": {
  "action": "/api/UpdateProduct/:id",
  "method": "POST",
  "enctype": "json",
  "autoSave": 0,
  "buttons": [
    {
      "type": "reset",
      "label": "Reset"
    },
    {
      "action": "/api/DeleteProduct/:id",
      "label": "${t:delete}",
      "method": "DELETE",
      "enctype": "form"
    },
    {
      "action": "/api/SetProduct/:id",
      "label": "${t:post}",
      "method": "POST",
      "enctype": "json"
    },
    {
      "type": "submit",
      "label": "Submit",
      "autoSave": 0
    }
  ]
}
```

### Root-Level Properties:

1. **action**: Defines the endpoint for submitting the entire form.
2. **method**: HTTP method used for submitting the form (`POST`, `PUT`, etc.).
3. **enctype**: Specifies the encoding type for the form submission (e.g., `json`, `form`).
4. **autoSave**: Optionally auto-save form data (set `0` to disable).

These properties are applied directly to the `<form>` element and can be overridden by individual button configurations.

### Button Types:

1. **Reset**: A reset button clears the form's inputs.
   ```json
   {
     "type": "reset",
     "label": "Reset"
   }
   ```
   - **label**: Text displayed on the button.
   
2. **Custom Action Buttons**: These buttons perform actions such as sending a `DELETE` or `POST` request. They can specify their own `action`, `method`, and `enctype`, or inherit them from the root `form` configuration.
   ```json
   {
     "action": "/api/DeleteProduct/:id",
     "label": "${t:delete}",
     "method": "DELETE",
     "enctype": "form"
   }
   ```
   - **action**: The endpoint to send data to.
   - **label**: Text displayed on the button (can be localized using `${t:}`).
   - **method**: HTTP method to be used (`POST`, `DELETE`, etc.).
   - **enctype**: Specifies the format for sending the data (`form`, `json`, or a custom value).

3. **Submit**: A submit button sends the form data when clicked. This button triggers the default form submission behavior and can also include custom attributes like `autoSave`.
   ```json
   {
     "type": "submit",
     "label": "Submit",
     "autoSave": 0
   }
   ```
   - **label**: Text displayed on the button.
   - **autoSave**: Optionally auto-save form data periodically (set to `0` to disable).

### Custom Buttons with `method: custom`:

In addition to the built-in buttons, custom buttons can be defined by specifying `"method": "custom"`. This enables the button to perform custom actions or events (like triggering a search) while still being a `submit` type to handle form submission:

```json
{
  "label": "Search",
  "method": "custom",
  "type": "submit"
}
```

In this case:
- The button can trigger custom JavaScript functionality while still acting as a submit button for accessibility and mobile-friendly form submissions.


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
