# CSP Manager Web Component

A web component to interactively build and manage a Content Security Policy (CSP).

## Features

- **Interactive UI**: Easily add or remove values for all standard CSP directives.
- **Live Preview**: See the generated `<meta>` tag update in real-time.
- **State Management**: Programmatically get and set the CSP state.
- **Customizable**: Style the component to match your application's theme using CSS Custom Properties.
- **Visual Indicators**: Directives with custom-added values are marked with an asterisk (*) for easy identification.

## How to Use

1.  **Include the script**: Make sure the component's JavaScript file is loaded on your page.

    ```html
    <script src="index.js" type="module"></script>
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

## Programmatic Access (Getting and Setting State)

The component exposes properties that allow you to get the current state or load a new one. This is ideal for saving and loading configurations in a CMS or other system.

### The `policy` Property (Get/Set)

You can get or set the entire CSP configuration as a JavaScript object.

#### Getting the State

To get the current CSP configuration from the component:

```javascript
const cspManager = document.querySelector('csp-manager');
const currentState = cspManager.policy;

// `currentState` is an object you can now save, e.g., by sending it to your server.
console.log(JSON.stringify(currentState));
```

#### Setting the State

To load a previously saved state into the component:

```javascript
const cspManager = document.querySelector('csp-manager');

const savedState = {
  "script-src": { "defaults": ["'self'"], "added": ["https://example.com"] },
  "style-src": { "defaults": ["'self'", "'unsafe-inline'"], "added": [] }
  // ... other directives
};

cspManager.policy = savedState;
```
The component will automatically update and re-render to reflect the new state.

### The `cspString` Property (Get)

To get the generated CSP `<meta>` tag as a string:

```javascript
const cspManager = document.querySelector('csp-manager');
const metaTagString = cspManager.cspString;

// The string will contain HTML entities for `<` and `>`
// so you may want to replace them for certain use cases.
const cleanString = metaTagString.replace(/&lt;/g, '<').replace(/&gt;/g, '>');

console.log(cleanString);
```
