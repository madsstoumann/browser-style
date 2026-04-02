
# Components

**DataEntry** comes with built-in support for various UI components. These components are loaded dynamically based on the HTML content of the form and provide extended functionality, such as auto-suggestions and rich text editors. This document describes the built-in components and how to extend DataEntry with your custom components.

## Built-in Components

All built-in components are from [browser.style/ui](https://browser.style/ui).  
Read full documentation for each of the components there.

### 1. **AutoSuggest (`<auto-suggest>`)**
The **AutoSuggest** component provides real-time suggestions as the user types, fetching data from an external API. It automatically populates relevant fields when an option is selected.

#### Example:
```html
<auto-suggest api="/api/products" label="Product Name"></auto-suggest>
```

### 2. **RichText (`<rich-text>`)**
The **RichText** component is a WYSIWYG (What You See Is What You Get) editor for input fields requiring formatted text.

#### Example:
```html
<rich-text name="description"></rich-text>
```

### 3. **SnackBar (`<snack-bar>`)**
The **SnackBar** component is used for displaying toast notifications, such as success or error messages. It is automatically triggered when certain events occur (e.g., form submission) but can also be manually triggered via the `showMsg` method.

#### Example:
```html
<snack-bar></snack-bar>
```

### 4. **BarcodeScanner (`<barcode-scanner>`)**
The **BarcodeScanner** component enables barcode scanning functionality. It automatically populates form fields when a barcode is successfully scanned.

#### Example:
```html
<barcode-scanner></barcode-scanner>
```

### 5. **DataMapper (`<data-mapper>`)**
The **DataMapper** component provides functionality for importing and mapping external data (CSV/TSV files) into the form. It allows users to map imported columns to form fields.

#### Example:
```html
<data-mapper></data-mapper>
```

## How Components are Loaded

In DataEntry, components are dynamically loaded based on the HTML content of the form. The `mountComponents` function is responsible for checking if the HTML contains certain tags (like `<auto-suggest>` or `<snack-bar>`) and then loading the corresponding JavaScript modules.

Here’s how components are loaded:

```javascript
export async function mountComponents(HTML, dataEntry) {
  const importPromises = Object.entries(componentsInfo).map(async ([componentName, { bindFunction, path, tagName }]) => {
    if (HTML.includes(`<${tagName}`)) {
      try {
        const module = await import(path);
        module[componentName].mount();
        if (bindFunction) {
          bindFunction(dataEntry);
        }
      } catch (error) {
        console.error(`Failed to load component ${componentName}:`, error);
      }
    }
  });
  await Promise.all(importPromises);
}
```

## How to Extend DataEntry with Custom Components

### 1. **Define Your Custom Component**

You can define a custom component as an ES6 class that extends `HTMLElement`.

#### Example:
```javascript
class MyCustomComponent extends HTMLElement {
  constructor() {
    super();
    this.innerHTML = '<div>Custom Content Here</div>';
  }
}

// Register the custom component
customElements.define('my-custom-component', MyCustomComponent);
```

### 2. **Add the Component to `componentsInfo`**

Once you define your custom component, you can add it to the `componentsInfo` object. This allows the component to be dynamically loaded like the built-in components.

#### Example:
```javascript
const componentsInfo = {
  MyCustomComponent: {
    path: '/path/to/my-custom-component.js',
    tagName: 'my-custom-component',
  }
};
```

### 3. Adding a custom bindMethod
You can easily add a custom bindMethod to your custom component. Here's an example for the `<snack-bar>`-component:

```js
SnackBar: {
  bindFunction: bindSnackBar,
  path: '@browser.style/snack-bar',
  tagName: 'snack-bar',
}
```

Then, we add the custom `bindFunction`:

```js
function bindSnackBar(dataEntry) {
  const snackBar = dataEntry.form.querySelector('snack-bar');
  if (snackBar) {
    dataEntry.showMsg = (message, type = 'success', duration = 3000) => {
      snackBar.add(message, type, duration);
    };
  } else {
    // Fallback if snack-bar is not available
    dataEntry.showMsg = (message, type = 'info', duration = 3000) => {
      dataEntry.debugLog(`Toast fallback: ${message} (Type: ${type})`);
    };
  }
}
```


### 4. **Use Your Custom Component in the Form**

Now, you can use the custom component in your DataEntry form or schema just like any other built-in component.

#### Example in HTML:
```html
<my-custom-component></my-custom-component>
```

#### Example in Schema:
```json
{
  "type": "object",
  "properties": {
    "customField": {
      "type": "string",
      "title": "Custom Field",
      "render": {
        "method": "my-custom-component"
      }
    }
  }
}
```

When this component is encountered in the form or schema, it will be loaded and displayed accordingly.

## Conclusion

DataEntry's built-in components provide a solid foundation for common UI elements like auto-suggest and rich-text input. However, the extensibility of the system allows you to define and register your custom components, making it a versatile tool for dynamic form generation and user interface customization.
