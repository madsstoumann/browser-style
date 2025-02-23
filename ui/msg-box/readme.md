# MsgBox

A web component that provides modern replacements for `window.alert()`, `window.confirm()`, and `window.prompt()` using the native `<dialog>` element.

## Installation

```bash
npm install @browser.style/msg-box
```

## Basic Usage

```javascript
import '@browser.style/msg-box';
```

```html
<msg-box></msg-box>
```

```javascript
const msgBox = document.querySelector('msg-box');

// Alert
msgBox.alert('Message', 'Optional title');

// Confirm
const status = await msgBox.confirm('Are you sure?', 'Optional title');
console.log(status); // true or false

// Prompt
const value = await msgBox.prompt('Enter value:', 'Default value', 'Optional title');
console.log(value); // Entered value or false if cancelled
```

## Attributes

- `lang`: Set language for button labels (defaults to browser language)

## CSS Properties

- `--AccentColor`: Primary color for buttons (default: system accent color)
- `--AccentColorText`: Text color for primary buttons
- `--msgbox-backdrop`: Background color of dialog backdrop
- `--msgbox-bdrs`: Border radius of dialog
- `--msgbox-bxsh`: Box shadow of dialog
- `--msgbox-p`: Padding of dialog

## Internationalization

The component includes translations for 20 languages. You can add or override translations:

```javascript
msgBox.i18n = {
  pirate: { ok: 'Aye!', cancel: 'Nay!' }
};
```

## Methods

- `alert(message, headline?)`: Shows alert dialog
- `confirm(message, headline?)`: Shows confirm dialog, returns Promise<boolean>
- `prompt(message, value?, headline?)`: Shows prompt dialog, returns Promise<string | false>

All methods return Promises that resolve when the dialog is closed:
- Alert: No return value
- Confirm: Returns `true` (OK) or `false` (Cancel/Escape)
- Prompt: Returns input value (OK) or `false` (Cancel/Escape)
