
# Extending DataEntry with Custom and Render Methods

**DataEntry** is designed to be flexible and extensible, allowing users to define their own **render-methods** and **custom-methods**. This document explains how to extend **DataEntry** with these methods and integrate them into your forms.

## Extending Render Methods

Render methods are responsible for generating HTML content for specific fields or components in your form. By default, **DataEntry** comes with a set of built-in render methods. However, you can extend these methods to provide custom rendering behavior.

### How to Extend a Render Method

To extend a render method, use the `extendRenderMethod` function. This function allows you to define a new method and make it available to your form schema.

### Example of Extending a Render Method:

```javascript
const myRenderMethod = (params) => {
    const { label, value, attributes } = params;
    return `<label>${label}<input type="text" value="${value}" ${attributes}></label>`;
};

// Extend DataEntry with the new render method
instance.extendRenderMethod('myRenderMethod', myRenderMethod);
```

In this example:
- The `myRenderMethod` is defined to render a simple input field with a label.
- It is then added to **DataEntry** using the `extendRenderMethod` function.

Once extended, this render method can be used in your schema like so:

```json
{
  "type": "object",
  "properties": {
    "custom_field": {
      "type": "string",
      "title": "Custom Field",
      "render": {
        "method": "myRenderMethod"
      }
    }
  }
}
```

## Extending Custom Methods

Custom methods in **DataEntry** provide the ability to define custom behavior for elements. These methods are typically triggered by user interactions (such as `onclick` events) and are defined using `data-custom` attributes in your form schema.

### How to Extend a Custom Method

To define a custom method, use the `extendCustomMethod` function. This allows you to add a custom method that will be triggered by user interactions.

### Example of Extending a Custom Method:

```javascript
const myCustomMethod = (element, instance, ...params) => {
    console.log("Custom method triggered with parameters:", params);
    element.style.backgroundColor = 'yellow';
};

// Extend DataEntry with the custom method
instance.extendCustomMethod('highlight', myCustomMethod);
```

In this example:
- The `highlight` method changes the background color of the element when triggered.
- The method is then added to **DataEntry** using the `extendCustomMethod` function.

You can trigger this method by adding a `data-custom` attribute to an element in your schema:

```json
{
  "type": "object",
  "properties": {
    "highlighted_field": {
      "type": "string",
      "title": "Highlighted Field",
      "render": {
        "method": "input",
        "attributes": [
          {
            "data-custom": "highlight"
          }
        ]
      }
    }
  }
}
```

When the element (in this case, an input field) is clicked, the `highlight` method will be triggered.

### Using `data-params` to Pass Parameters

In addition to `data-custom`, you can use the `data-params` attribute to pass parameters to your custom method. This allows for more dynamic behavior based on the provided parameters.

### Example:

```json
{
  "type": "object",
  "properties": {
    "dynamic_field": {
      "type": "string",
      "title": "Dynamic Field",
      "render": {
        "method": "input",
        "attributes": [
          {
            "data-custom": "highlight",
            "data-params": "{ "color": "blue" }"
          }
        ]
      }
    }
  }
}
```

In this example:
- The `data-params` attribute is used to pass a `color` parameter to the `highlight` method.
- The custom method can then access this parameter and adjust its behavior accordingly.

## Extending with Dynamic Functions

In addition to render and custom methods, **DataEntry** supports dynamic functions that allow you to perform operations or transformations dynamically.

### How to Extend a Dynamic Function

You can extend dynamic functions using the `extendDynamicFunction` method, which makes the function available across your form schema.

### Example:

```javascript
const currentDateFunction = () => new Date().toISOString().split('T')[0];

// Extend DataEntry with the new dynamic function
instance.extendDynamicFunction('currentDate', currentDateFunction);
```

You can then use this dynamic function in your schema by referencing it:

```json
{
  "type": "object",
  "properties": {
    "date_field": {
      "type": "string",
      "title": "Date",
      "render": {
        "method": "input",
        "attributes": [
          {
            "value": "${currentDate}"
          }
        ]
      }
    }
  }
}
```

In this example:
- The `currentDate` function dynamically generates the current date and populates the `value` attribute of the input field.

## Conclusion

Extending **DataEntry** with custom methods, render methods, and dynamic functions provides flexibility and allows you to tailor the behavior and appearance of your forms to your specific requirements. By using the `extendRenderMethod`, `extendCustomMethod`, and `extendDynamicFunction` methods, you can easily add custom behavior and rendering logic to any form field or component.
