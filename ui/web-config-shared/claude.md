# Web Config Shared

## Overview

Web Config Shared provides **shared stylesheet and utility functions** used by all `web-config-*` editor components. It ensures consistent styling and provides common helpers for state management, translation, and UI patterns.

## Architecture

### Package Structure

```
web-config-shared/
├── README.md             # Basic documentation
├── index.js              # Utility functions
├── index.css             # Shared stylesheet
└── package.json          # NPM package configuration
```

### Usage Pattern

Components import and use these utilities:

```javascript
import {
  adoptSharedStyles,
  createTranslator,
  setState,
  captureOpenDetailsState,
  restoreOpenDetailsState
} from '@browser.style/web-config-shared';
```

## API Reference

### `adoptSharedStyles(shadowRoot)`

Loads and adopts the shared stylesheet into a shadow root:

```javascript
async connectedCallback() {
  await adoptSharedStyles(this.shadowRoot);
  this.render();
}
```

**Implementation Details:**
- Fetches CSS once and caches the `CSSStyleSheet`
- Uses `adoptedStyleSheets` for efficient style sharing
- Returns a Promise that resolves when styles are ready

### `createTranslator(i18nData, getLang, fallbackLang?)`

Creates a translation function for internationalization:

```javascript
const i18n = {
  en: {
    title: 'Settings',
    save: 'Save Changes',
    errors: { required: 'This field is required' }
  },
  da: {
    title: 'Indstillinger',
    save: 'Gem ændringer',
    errors: { required: 'Dette felt er påkrævet' }
  }
};

const t = createTranslator(i18n, () => this.lang, 'en');

t('title');           // "Settings" or "Indstillinger"
t('errors.required'); // Supports nested keys
t('unknown.key');     // Returns key if not found
```

**Parameters:**
- `i18nData`: Object with language keys → translation objects, or a function returning same
- `getLang`: Current language string or function returning it
- `fallbackLang`: Fallback language (default: `'en'`)

### `setState(instance, partialState, options?)`

Updates component state and returns changed keys:

```javascript
class MyComponent extends HTMLElement {
  state = { count: 0, name: '' };

  update() {
    const changed = setState(this, { count: this.state.count + 1 });

    if (changed.includes('count')) {
      this.renderCount();
    }
  }
}
```

**Parameters:**
- `instance`: Object with `state` property
- `partialState`: Object with new values
- `options.equals`: Equality function (default: `Object.is`)
- `options.equalsByKey`: Per-key equality functions

**Returns:** Array of changed keys

### `captureOpenDetailsState(shadowRoot)`

Captures which `<details>` panels are open (for accordion groups):

```javascript
// Before re-render
const openState = captureOpenDetailsState(this.shadowRoot);

this.render();

// After re-render
restoreOpenDetailsState(this.shadowRoot, openState);
```

**Returns:** Array of `{ group, key }` objects

**Details element identification:**
Looks for key in this order:
1. `data-panel` attribute
2. `data-directive` attribute
3. `data-section` attribute
4. `id` attribute

### `restoreOpenDetailsState(shadowRoot, openState)`

Restores open/closed state of `<details>` panels:

```javascript
restoreOpenDetailsState(this.shadowRoot, openState);
```

**Parameters:**
- `shadowRoot`: Shadow root containing details elements
- `openState`: Array from `captureOpenDetailsState()`

## Shared Stylesheet

The shared CSS provides consistent styling for:

- Form elements (inputs, selects, buttons)
- Panel/section layouts
- Accordion patterns
- Color schemes (light/dark mode)
- Typography

### CSS Custom Properties

Components can override these properties:

```css
:host {
  --wc-accent: hsl(211, 100%, 95%);
  --wc-accent-dark: hsl(211, 50%, 50%);
  --wc-buttonface: #efefef;
  --wc-bdrs: .5rem;
  --wc-ff-mono: 'Courier New', monospace;
  --wc-ff-system: system-ui, sans-serif;
  --wc-gap: 1rem;
}
```

## Usage in Components

### Typical Component Setup

```javascript
import {
  adoptSharedStyles,
  createTranslator,
  setState,
  captureOpenDetailsState,
  restoreOpenDetailsState
} from '@browser.style/web-config-shared';

export class WebConfigExample extends HTMLElement {
  state = {};

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  async connectedCallback() {
    await adoptSharedStyles(this.shadowRoot);
    this.t = createTranslator(i18n, () => this.lang);
    this.render();
  }

  render() {
    const openState = captureOpenDetailsState(this.shadowRoot);

    this.shadowRoot.innerHTML = `
      <h2>${this.t('title')}</h2>
      <details name="sections" data-section="main" open>
        <summary>${this.t('sections.main')}</summary>
        <!-- content -->
      </details>
    `;

    restoreOpenDetailsState(this.shadowRoot, openState);
  }

  updateState(newValues) {
    const changed = setState(this, newValues);
    if (changed.length > 0) {
      this.render();
      this.dispatchChange();
    }
  }
}
```

## Import Map Configuration

For CMS integrations (like Contentful), bare imports need resolution:

```html
<script type="importmap">
  {
    "imports": {
      "@browser.style/web-config-shared": "https://browser.style/ui/web-config-shared/index.js"
    }
  }
</script>
```

## Consumer Components

Used by:
- web-config-csp
- web-config-manifest
- web-config-robots
- web-config-security

## Debugging Tips

1. **Styles not loading?** Check `adoptSharedStyles` is awaited
2. **Translations missing?** Verify i18n object structure and lang value
3. **State not updating?** Check `setState` returns expected changed keys
4. **Details state lost?** Ensure capture/restore around render
