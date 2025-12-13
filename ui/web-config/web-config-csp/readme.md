# Web Config CSP Web Component

A powerful, interactive web component for building and managing Content Security Policy (CSP) directives with built-in security evaluation.

[![npm version](https://img.shields.io/npm/v/@browser.style/web-config-csp.svg)](https://www.npmjs.com/package/@browser.style/web-config-csp)

## Features

- **Interactive Editor**: Easily add, remove, and manage CSP directives through an intuitive UI.
- **Security Evaluation**: Real-time security checks based on Google's CSP Evaluator logic.
- **Live Preview**: See the generated `<meta>` tag update as you make changes.
- **i18n Support**: Full internationalization support (English and Danish included).
- **CMS Integration**: Designed for easy integration with headless CMSs like Contentful or Storyblok.
- **Event-Driven**: Fires a `csp-change` event on every modification for easy integration.
- **Flexible**: Supports importing from existing CSP strings and exporting to JSON or a header string.

---

## Installation

```bash
npm install @browser.style/web-config-csp
```

Or include it directly in your HTML:

```html
<script type="module" src="https://unpkg.com/@browser.style/web-config-csp/src/index.js"></script>
```

---

## Quick Start

```html
<web-config-csp evaluate></web-config-csp>
```

- `evaluate`: Enables the security evaluation feature.
- `lang="da"`: Sets the language to Danish.

---

## API and Usage

### Attributes

- `evaluate`: (Boolean) Enables security evaluation.
- `lang`: (String) Sets the language (e.g., "en", "da").
- `initial-policy`: (String) A JSON string representing the initial policy to load.
- `directives`: (String) A URL or inline JSON for custom directive configurations.
- `i18n`: (String) A URL or inline JSON for custom translations.
- `rules`: (String) A URL or inline JSON for custom evaluation rules.

### Properties

- `policy` (get/set): Gets or sets the current CSP policy as a JavaScript object.
- `cspString` (get): Gets the generated CSP meta tag string.

### Methods

- `fromString(cspString)`: Parses a CSP string and loads it into the manager.
- `enableDirective(directiveName)`: Programmatically enables a directive.
- `setDirectivesConfig(config)`: Sets custom directive definitions.
- `setI18nConfig(config)`: Sets custom internationalization data.
- `setRulesConfig(config)`: Sets custom evaluation rules.

### Events

- `csp-change`: Fired whenever the CSP policy is modified. The `event.detail` object contains the `policy` object, the `cspString`, and `evaluations` (if enabled).

---

## Customization

The component is highly customizable through CSS custom properties for styling and through configuration files for functionality. You can define custom directives, add new languages, and create your own security evaluation rules.

See the [Custom Configuration Demo](https://browser.style/ui/web-config/web-config-csp/config.html) for live examples.

---

## Development

To run the project locally, simply start a web server in the component's directory.

```bash
# In ui/web-config/web-config-csp/
npx serve
```

The component is written in modern JavaScript and uses ES modules, so no build step is required for development.

---

## License

This project is licensed under the ISC License. See the [LICENSE](../../LICENSE) file for details.
