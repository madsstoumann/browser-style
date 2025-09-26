# CSP Manager Web Component

A web component to interactively build and manage a Content Security Policy (CSP).

## Features

- **Interactive UI**: Easily add or remove values for all standard CSP directives.
- **Live Preview**: See the generated `<meta>` tag update in real-time.
- **State Management**: Programmatically get and set the CSP state.
- **Customizable**: Style the component to match your application's theme using CSS Custom Properties.
- **Visual Indicators**: Directives with custom-added values are marked with an asterisk (*) for easy identification.

## Installation

Install the component from npm:

```bash
npm install @browser.style/csp-manager
```

## How to Use

1.  **Import the component**:

    ```javascript
    import '@browser.style/csp-manager';
    ```

2.  **Add the component to your HTML**:

    ```html
    <csp-manager></csp-manager>
    ```

The component will render with a default set of CSP directives. You can then interact with the UI to add or remove values.

## Styling

You can customize the appearance of the component by setting these CSS Custom Properties on the `<csp-manager>` element or a parent element.

| Property                      | Description                                     | Default Value                  |
| ----------------------------- | ----------------------------------------------- | ------------------------------ |
| `--csp-manager-accent`        | Accent color for highlighted items.             | `hsl(211, 100%, 95%)`          |
| `--csp-manager-accent-dark`   | A darker accent color, used for indicators.     | `hsl(211, 100%, 50%)`          |
| `--csp-manager-buttonface`    | Background color for buttons, inputs, and lists.| `#efefef`                      |
| `--csp-manager-bdrs`          | Border radius for elements.                     | `.5rem`                        |
| `--csp-manager-ff-mono`       | Monospaced font family.                         | `ui-monospace, ...`            |
| `--csp-manager-ff-system`     | System font family.                             | `system-ui, sans-serif`        |
| `--csp-manager-gap`           | Gap/spacing between elements.                   | `1rem`                         |
| `--csp-manager-tab-width`     | Tab width for the generated `<meta>` tag output.| `2`                            |
| `--csp-manager-font-size`     | Base font size for the component.               | `16px`                         |

### Example

```css
csp-manager {
  --csp-manager-accent: #e0f7fa;
  --csp-manager-accent-dark: #00796b;
  --csp-manager-font-size: 14px;
}
```

## Programmatic Access & CMS Integration

The component is designed to be easily integrated into a Content Management System (CMS) like Sitecore. It provides several ways to get and set its state.

### Initializing with the `initial-policy` Attribute (Recommended)

The easiest way to load data from a CMS is to pass it directly into the `initial-policy` attribute when the component is rendered. The component will automatically parse this data and initialize itself.

The value of the attribute should be a **JSON string**.

#### Example: Loading Data from a Sitecore Field

A backend developer can render the component and pass the data from a Sitecore field directly into the `initial-policy` attribute.

Here is a conceptual example using Razor syntax, common in .NET-based CMSs:

```html
@{
  // Assume 'Model.CspJsonField' is a string field from a Sitecore item
  // containing the saved JSON policy.
  // Ensure the string is correctly formatted as a single-line JSON.
  var initialPolicy = Model.CspJsonField;
}

<!-- The component will read this attribute on load -->
<csp-manager initial-policy="@initialPolicy"></csp-manager>
```

This declarative approach is clean and requires no extra JavaScript from the integrating developer.

### Manual Get/Set with Properties

For more dynamic scenarios, you can use the component's JavaScript properties to get or set its state after it has loaded.

#### The `policy` Property (Get/Set)

You can get or set the entire CSP configuration as a JavaScript object.

**Getting the State**

```javascript
const cspManager = document.querySelector('csp-manager');
const currentState = cspManager.policy;

// `currentState` is an object you can now save, e.g., by sending it to your server.
console.log(JSON.stringify(currentState));
```

**Setting the State**

```javascript
const cspManager = document.querySelector('csp-manager');

const savedState = {
  "script-src": { "defaults": ["'self'"], "added": ["https://example.com"] },
  "style-src": { "defaults": ["'self'", "'unsafe-inline'"], "added": [] }
  // ... other directives
};

cspManager.policy = savedState;
```

#### The `cspString` Property (Get)

To get the generated CSP `<meta>` tag as a string:

```javascript
const cspManager = document.querySelector('csp-manager');
const metaTagString = cspManager.cspString;

// The string will contain HTML entities for `<` and `>`
// so you may want to replace them for certain use cases.
const cleanString = metaTagString.replace(/&lt;/g, '<').replace(/&gt;/g, '>');

console.log(cleanString);
```
