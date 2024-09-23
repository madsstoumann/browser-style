
# Built-in Components in DataEntry

**DataEntry** includes a set of built-in components to facilitate form generation and user interactions. These components are used to render specific elements in the UI, such as input fields, dropdowns, and toast notifications. Below is an overview of the default components and how they work.

## Built-in Components

### 1. **`<ui-toast>`**
The **Toast** component provides brief notifications to the user, typically used for displaying messages such as success, warnings, or errors. It automatically disappears after a few seconds.

### 2. **`<ui-icon>`**
The **Icon** component renders various icons based on the specified type and size. It is often used within buttons or labels to add visual cues.

#### Example:
```html
<ui-icon type="chevron-right" size="small"></ui-icon>
```

### 3. **`<auto-suggest>`**
The **Auto-Suggest** component provides a text input with dynamic suggestions fetched from an API. It is commonly used for selecting items based on user input, such as addresses or product names.

#### Example:
```html
<auto-suggest api="/api/products" label="Product Name"></auto-suggest>
```

## How to Extend DataEntry with Custom Components

In addition to the built-in components, you can define and register your own custom components in **DataEntry**. Extending **DataEntry** with custom components allows you to create reusable UI elements that cater to your specific needs.

### Steps to Extend with Custom Components

1. **Create a Custom Component**

First, you need to define your custom component as a class that extends `HTMLElement`. You can then use this component in your form or interface.

#### Example of a Custom Component:

```javascript
class MyCustomButton extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = '<button>Click me!</button>';
    }
}

// Define the custom component
customElements.define('my-custom-button', MyCustomButton);
```

2. **Use the Custom Component in DataEntry**

Once your custom component is defined, you can use it in your schema or directly in the form HTML.

#### Example in HTML:

```html
<data-entry>
  <my-custom-button></my-custom-button>
</data-entry>
```

This will render your custom button inside the **DataEntry** form.

### Registering and Using a Custom Component

You can also define custom logic and attributes for your component. The following example shows how to register a custom component that takes an attribute and dynamically updates its content.

#### Example of a Custom Component with Attributes:

```javascript
class CustomLabel extends HTMLElement {
  constructor() {
    super();
    const label = this.getAttribute('label');
    this.innerHTML = `<span>${label}</span>`;
  }
}

// Register the custom component
customElements.define('custom-label', CustomLabel);
```

#### Example Usage in HTML:

```html
<custom-label label="This is a custom label"></custom-label>
```

When rendered, the label will display the text provided in the `label` attribute.

### Using Custom Components in the Schema

You can also integrate custom components directly into your schema, allowing **DataEntry** to render them as part of the form generation process.

#### Example Schema with a Custom Component:

```json
{
  "type": "object",
  "properties": {
    "custom_button": {
      "type": "string",
      "title": "Click Me",
      "render": {
        "method": "my-custom-button"
      }
    }
  }
}
```

In this example, the `my-custom-button` component is rendered as part of the form, and any interactions with it can be handled as needed.

## Conclusion

By using the built-in components or creating your own, you can enhance the functionality and appearance of your forms in **DataEntry**. Whether you are displaying a simple icon or creating complex input mechanisms, extending with custom components offers great flexibility and customization.
