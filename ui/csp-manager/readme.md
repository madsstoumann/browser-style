# CSP Manager Web Component

A web component to interactively build and manage a Content Security Policy (CSP).

## Features

- **Interactive UI**: Easily add or remove values for all standard CSP directives.
- **Clean Interface**: Only enabled directives are shown. Hidden directives can be added via dropdown.
- **Add Directive Dropdown**: Add directives using a native HTML `<datalist>` with autocomplete for ease of use.
- **Live Preview**: See the generated `<meta>` tag update in real-time.
- **Smart UI for Different Directive Types**:
    - **Boolean Directives**: Directives like `upgrade-insecure-requests` are correctly handled as simple toggles without value inputs.
    - **Token-based Directives**: Directives like `sandbox` provide a dropdown of valid tokens for easy selection.
- **State Management**: Programmatically get and set the CSP state.
- **Customizable**: Style the component to match your application's theme using CSS Custom Properties.
- **Informative**: Each directive includes a short description of its purpose.
- **Internationalization Ready**: All UI text is externalized in `i18n.json` for easy translation.
- **Modular Architecture**: CSP specifications and UI text are separated into external JSON files for maintainability.
- **Accessible**: Screen-reader-only controls with proper ARIA patterns.

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

The component will render with a default set of enabled CSP directives. Disabled directives are hidden but can be added using the "Add Directive" dropdown at the bottom of the component.

## File Structure

The component consists of modular files for better maintainability:

- **`index.js`** - Main component logic
- **`index.css`** - Component styles (loaded as adopted stylesheet)
- **`csp-directives.json`** - CSP specification (defaults, types, tokens)
- **`i18n.json`** - Internationalization strings (directive descriptions and UI text)

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

#### Simplified Client Policy Format

**New in v2.0:** Clients now only need to specify the directives they want to enable. The component loads the full CSP specification from `csp-directives.json` and only enables the directives present in the client's policy.

```javascript
// Client only specifies what they need!
const clientPolicy = {
  "script-src": {
    "added": ["'unsafe-inline'", "cdn.example.com"]
  },
  "style-src": {
    "added": ["https://fonts.googleapis.com"]
  }
};
```

All other directives remain available but disabled (hidden from view until added via the dropdown).

#### Example: Loading Data from a Sitecore Field

A backend developer can render the component and pass the data from a Sitecore field directly into the `initial-policy` attribute.

Here is a conceptual example using Razor syntax, common in .NET-based CMSs:

```html
@{
  // Assume 'Model.CspJsonField' is a string field from a Sitecore item
  // containing the saved JSON policy (only enabled directives).
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

// Simplified format: Only specify directives you want to enable
const clientPolicy = {
  "script-src": {
    "added": ["https://example.com"]
  },
  "style-src": {
    "added": ["https://fonts.googleapis.com"]
  }
  // Only enabled directives need to be specified
};

cspManager.policy = clientPolicy;
```

The component will:
1. Disable all directives
2. Enable only the directives present in `clientPolicy`
3. Merge the `added` values with defaults from `csp-directives.json`
4. Optionally allow overriding `defaults` if provided

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

## Internationalization

All UI text is stored in `i18n.json` for easy translation. The component includes a `t()` method that retrieves translations with fallback to the key if not found.

### Current Structure

```json
{
  "en": {
    "directives": {
      "script-src": "Specifies valid sources for JavaScript.",
      ...
    },
    "ui": {
      "add": "Add",
      "addDirective": "Add Directive",
      "addNewValue": "Add new value",
      "addDirectivePlaceholder": "Add directive...",
      "booleanDirectiveInfo": "This is a boolean directive. It has no values.",
      "enable": "Enable"
    }
  }
}
```

### Adding a New Language

To add a new language, simply add a new language object to `i18n.json`:

```json
{
  "en": { ... },
  "es": {
    "directives": { ... },
    "ui": {
      "add": "Agregar",
      "addDirective": "Agregar Directiva",
      ...
    }
  }
}
```

Then set the `lang` property on the component:

```javascript
const cspManager = document.querySelector('csp-manager');
cspManager.lang = 'es';
cspManager.render(); // Re-render with new language
```

## Component Methods

The component exposes several public methods:

### `t(key)`
Get translated text from i18n file with dot notation support.

```javascript
cspManager.t('ui.add'); // Returns "Add"
cspManager.t('ui.nonExistent'); // Returns "ui.nonExistent" (fallback)
```

### `getAvailableDirectives()`
Returns an array of disabled directives that can be added.

```javascript
const available = cspManager.getAvailableDirectives();
// Returns: [{key: "font-src", description: "Specifies..."}, ...]
```

### `enableDirective(directiveName)`
Enables a directive by name and re-renders the component.

```javascript
cspManager.enableDirective('font-src');
```

### `addValue(directive, value)`
Adds a value to a specific directive's `added` array.

```javascript
cspManager.addValue('script-src', 'https://cdn.example.com');
```

### `removeValue(directive, index)`
Removes a value from a directive's `added` array by index.

```javascript
cspManager.removeValue('script-src', 0);
```
