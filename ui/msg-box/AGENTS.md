# MsgBox Component - Internal Architecture

## Overview

`<msg-box>` is a lightweight web component providing modern Promise-based replacements for the native `window.alert()`, `window.confirm()`, and `window.prompt()` dialogs using the HTML `<dialog>` element.

**Version:** 1.0.2

**Component Type:** Custom element extending HTMLElement

**Key Features:**
- Promise-based API for async/await usage
- Three dialog types: alert, confirm, prompt
- Built-in internationalization (6 languages)
- Light dismiss support via `dismiss` attribute
- CSS custom properties for theming
- Light/dark mode support via `light-dark()`
- Shadow DOM encapsulation
- CSS parts for external styling

**Key architectural decisions:**
- **Single class architecture**: One MsgBox class handles all three dialog types
- **Native dialog element**: Uses HTML `<dialog>` with `showModal()` for proper modal behavior
- **Shadow DOM**: Full encapsulation with adopted stylesheets
- **Promise-based returns**: All methods return Promises for async control flow
- **No dependencies**: Pure vanilla Web Component

## Architecture Overview

### Component Structure

```
<msg-box>
  #shadow-root
    <dialog part="dialog">
      <form part="form">
        <h2 part="headline">
        <span part="message">
        <input part="input">
        <footer part="footer">
          <button part="cancel">
          <button part="ok">
```

### Class Structure

**MsgBox (lines 83-156):**
- Manages dialog element and form
- Provides public API (alert, confirm, prompt)
- Handles internationalization
- Controls visibility of elements based on dialog type

### Lifecycle Flow

```
connectedCallback()  [lines 99-125]
  |
  Attach shadow DOM with open mode (line 100)
  Adopt stylesheet (line 101)
  |
  Create dialog HTML with:
    - closedby attribute based on dismiss (line 103)
    - form with headline, message, input, buttons
    - Translated button labels via #t() (lines 109-110)
  |
  Cache element references via part selectors (lines 115-117)
  |
  Setup event handlers:
    - cancel button onclick -> close(false) (line 119)
    - form onsubmit -> close(value) (lines 120-124)
  |
alert(message, headline) / confirm(message, headline) / prompt(message, value, headline)
  |
  Calls #show() with appropriate type parameter
  |
#show(message, headline, type, value)  [lines 131-148]
  |
  Configure visibility:
    - type 1 (alert): hide cancel button
    - type 2 (confirm): show both buttons
    - type 3 (prompt): show input field
  |
  Set content and show modal
  |
  Return Promise that resolves on dialog close
```

## Data Flow

### Dialog Invocation Flow

```
User calls: msgBox.alert('message', 'headline')
  |
alert() method (line 127)
  |
  Calls #show(message, headline, 1)
  |
#show() method (lines 131-148)
  |
  Hide/show elements based on type:
    - cancel.hidden = (type === 1) (line 133)
    - head.hidden = !headline (line 134)
    - input.hidden = (type !== 3) (line 136)
  |
  Set input properties for prompt mode (line 137)
  Set values (lines 135, 138-139)
  |
  dialog.showModal() (line 141)
  |
  Return new Promise (lines 142-147)
    - Resolves on dialog.onclose
    - Returns true, false, or input value
```

### Return Value Logic (lines 143-146)

```
dialog.onclose event
  |
  Get dialog.returnValue
  |
  Parse result:
    - 'true' string -> boolean true
    - truthy value -> that value (input text)
    - falsy value -> boolean false
  |
  resolve(result)
```

## Class Details

### MsgBox Class (lines 83-156)

**Private Properties:**

| Property | Type | Line | Purpose |
|----------|------|------|---------|
| `#elements` | Object | 84 | Cached shadow DOM references |
| `#i18n` | Object | 86-93 | Translation lookup table |

**#elements Cache Structure:**
```javascript
{
  cancel: HTMLButtonElement,   // Cancel button
  dialog: HTMLDialogElement,   // Dialog element
  form: HTMLFormElement,       // Form wrapper
  headline: HTMLHeadingElement,// h2 title
  input: HTMLInputElement,     // Prompt input field
  message: HTMLSpanElement     // Message text container
}
```

**#i18n Translations (lines 86-93):**
```javascript
{
  de: { ok: 'OK', cancel: 'Abbrechen' },
  en: { ok: 'OK', cancel: 'Cancel' },
  es: { ok: 'Aceptar', cancel: 'Cancelar' },
  ja: { ok: 'OK', cancel: 'キャンセル' },
  ru: { ok: 'ОК', cancel: 'Отмена' },
  zh: { ok: '确定', cancel: '取消' }
}
```

**i18n Setter (lines 95-97):**
```javascript
set i18n(translations) {
  Object.assign(this.#i18n, translations);
}
```
Allows adding or overriding translations at runtime.

**connectedCallback (lines 99-125):**
- Attaches shadow DOM with open mode
- Adopts shared stylesheet
- Creates dialog structure with translated buttons
- Caches element references by part attribute
- Sets up cancel click and form submit handlers

**Public Methods (lines 127-129):**

| Method | Parameters | Type | Returns |
|--------|------------|------|---------|
| `alert(message, headline?)` | String, String | 1 | Promise |
| `confirm(message, headline?)` | String, String | 2 | Promise<boolean> |
| `prompt(message, value?, headline?)` | String, String, String | 3 | Promise<string or false> |

**#show (lines 131-148):**
Core private method that:
1. Destructures element references
2. Sets visibility based on dialog type
3. Configures input for prompt mode (required, autofocus)
4. Sets text content
5. Opens modal dialog
6. Returns Promise resolving on close

**#t (lines 150-153):**
Translation lookup with fallback chain: lang attribute -> browser language -> English -> raw text.

## CSS Architecture

### Embedded Stylesheet (lines 1-81)

**CSS Custom Properties:**

| Property | Default | Purpose |
|----------|---------|---------|
| `--AccentColor` | `light-dark(hsl(211, 100%, 50%), hsl(211, 60%, 50%))` | Button primary color |
| `--AccentColorText` | `hsl(211, 100%, 95%)` | OK button text color |
| `--msgbox-backdrop` | `#0004` | Modal backdrop color |
| `--msgbox-bdrs` | `1.75rem` | Dialog border radius |
| `--msgbox-bxsh` | `none` | Dialog box shadow |
| `--msgbox-ff` | `ui-sans-serif, system-ui` | Font family |
| `--msgbox-p` | `1.5rem` | Dialog padding |

**Host Styles (lines 3-10):**
Defines accent color custom properties using light-dark() for automatic theme adaptation.

**Button Part Styles (lines 7-20):**
- Cancel button: transparent background, accent color text
- OK button: accent color background, light text
- Focus-visible states use color-mix() for subtle darkening

**Dialog Styles (lines 32-47):**
- Responsive width: min 25rem, max min(90vw, 32rem)
- Uses color-scheme for native light/dark support
- Backdrop with semi-transparent overlay

**Interactive States (lines 73-80):**
Hover states only applied when hover is supported via `@media (hover: hover)`.

## Public API

### Methods

| Method | Parameters | Returns | Purpose |
|--------|------------|---------|---------|
| `alert(message, headline?)` | String, String | Promise | Show alert dialog |
| `confirm(message, headline?)` | String, String | Promise<boolean> | Show confirm dialog |
| `prompt(message, value?, headline?)` | String, String, String | Promise<string or false> | Show prompt dialog |

### Properties

| Property | Type | Access | Purpose |
|----------|------|--------|---------|
| `i18n` | Object | set | Add/override translations |

### Attributes

| Attribute | Type | Default | Purpose |
|-----------|------|---------|---------|
| `lang` | String | navigator.language | Button label language |
| `dismiss` | Boolean | false | Enable light dismiss (click outside/Escape closes) |

### CSS Parts

| Part | Element | Purpose |
|------|---------|---------|
| `dialog` | dialog | Main dialog container |
| `form` | form | Form wrapper |
| `headline` | h2 | Dialog title |
| `message` | span | Message text |
| `input` | input | Prompt text input |
| `footer` | footer | Button container |
| `cancel` | button | Cancel button |
| `ok` | button | OK/Submit button |

## Integration Patterns

### Basic Alert

```javascript
const msgBox = document.querySelector('msg-box');
await msgBox.alert('Operation completed successfully.');
console.log('User acknowledged');
```

### Alert with Headline

```javascript
await msgBox.alert('A system error has occurred.', 'Error');
```

### Confirm Dialog

```javascript
const confirmed = await msgBox.confirm('Are you sure you want to delete this item?');
if (confirmed) {
  deleteItem();
}
```

### Prompt with Default Value

```javascript
const name = await msgBox.prompt('Enter your name:', 'John Doe', 'User Profile');
if (name) {
  console.log('Hello, ' + name);
}
```

### Light Dismiss Mode

```html
<msg-box dismiss></msg-box>
```
Dialog can be closed by clicking outside or pressing Escape.

### Custom Language

```html
<msg-box lang="de"></msg-box>
```
Buttons will show "OK" and "Abbrechen".

### Adding Custom Translations

```javascript
const msgBox = document.querySelector('msg-box');
msgBox.i18n = {
  pirate: { ok: 'Aye!', cancel: 'Nay!' },
  fr: { ok: 'Valider', cancel: 'Annuler' }
};
```

### Custom Styling

```css
msg-box {
  --AccentColor: #e91e63;
  --AccentColorText: white;
  --msgbox-bdrs: 0.5rem;
  --msgbox-bxsh: 0 4px 20px rgba(0,0,0,0.3);
}

msg-box::part(dialog) {
  max-width: 400px;
}

msg-box::part(headline) {
  color: #e91e63;
}
```

### Chained Dialogs

```javascript
const name = await msgBox.prompt('What is your name?');
if (name) {
  const confirm = await msgBox.confirm('Delete user "' + name + '"?', 'Confirm Delete');
  if (confirm) {
    await deleteUser(name);
    await msgBox.alert('User "' + name + '" has been deleted.', 'Success');
  }
}
```

## Deep Dives

### closedby Attribute Behavior (line 103)

The dialog uses `closedby` attribute based on the `dismiss` attribute:

**Values:**
- `any`: Dialog closes on Escape, close button, or click outside (light dismiss)
- `closerequest`: Dialog closes only via explicit close request (form submit/cancel)

This uses the modern `closedby` attribute for native light dismiss support.

### Return Value Processing (lines 143-145)

```javascript
const result = dialog.returnValue === 'true' ? true : dialog.returnValue || false;
```

**Logic:**
1. If returnValue is exactly `'true'` string -> return boolean `true` (confirm OK)
2. If returnValue is any other truthy value -> return that value (prompt input)
3. If returnValue is falsy -> return boolean `false` (cancel/escape)

### Dialog Type Mapping

| Type | Method | cancel.hidden | input.hidden | Return |
|------|--------|---------------|--------------|--------|
| 1 | alert | true | true | void |
| 2 | confirm | false | true | boolean |
| 3 | prompt | false | false | string or false |

### Language Detection (line 151)

Priority:
1. `lang` attribute on element
2. Browser's primary language (e.g., 'en' from 'en-US')
3. Falls back to English if translation missing

## Gotchas and Edge Cases

### 1. Single Instance Reuse

**Issue:** Dialog state is reused between calls.

**Impact:** Previous values/states may leak if not properly reset.

**Solution:** `#show()` explicitly sets all element states on each call.

### 2. CSS lightdark() vs light-dark() (line 33)

**Issue:** Code uses `lightdark()` (no hyphen) which may be a typo.

**Impact:** Should be `light-dark()` for standard CSS. May cause dark mode issues in strict browsers.

### 3. closedby Browser Support

**Issue:** `closedby` attribute is relatively new.

**Impact:** Older browsers may ignore the attribute. Dialog behavior falls back to default.

### 4. Form Submission vs Button Click (lines 120-124)

**Issue:** Form submit handler uses `e.submitter.value` for non-prompt dialogs.

**Impact:** OK button must have `value="true"` attribute for confirm to work correctly.

### 5. Empty Headline Handling (line 134)

**Issue:** Empty string headline hides the h2 element entirely.

**Impact:** No visual gap for headline space when not provided.

### 6. Autofocus Behavior (line 137)

**Issue:** `autofocus` is set dynamically on input for prompt mode.

**Impact:** In prompt mode, input is auto-focused. In alert/confirm, OK button has static `autofocus`.

### 7. Promise Resolution Timing

**Issue:** Promise resolves on `dialog.onclose` event.

**Impact:** If dialog is closed programmatically via `dialog.close()`, the promise still resolves. Multiple rapid calls could have race conditions.

### 8. No Escape Key Prevention (line 103)

**Issue:** With `closedby="closerequest"`, Escape key behavior depends on browser implementation.

**Impact:** Some browsers may still close on Escape even without `dismiss` attribute.

### 9. text-box CSS Property (line 61)

**Issue:** Uses `text-box: trim-both cap;` which is experimental.

**Impact:** Leading/trailing space trimming may not work in all browsers.

### 10. Translation Fallback Chain

**Issue:** Falls back through lang -> navigator -> 'en' -> raw text.

**Impact:** Unknown keys show raw key as button text (e.g., "ok" not "OK").

## Dependencies

### No External Dependencies

- Pure vanilla Web Component
- Uses only standard browser APIs

### Browser APIs Used

| API | Purpose |
|-----|---------|
| `HTMLDialogElement` | `showModal()`, `close()`, `returnValue` |
| `Shadow DOM` | `attachShadow()`, `adoptedStyleSheets` |
| `Custom Elements` | `HTMLElement` extension, lifecycle callbacks |
| `CSSStyleSheet` | Constructable stylesheets |
| `light-dark()` | CSS color scheme function |
| `color-mix()` | CSS color mixing function |

### Browser Compatibility Notes

| Feature | Support |
|---------|---------|
| `<dialog>` | All modern browsers |
| `closedby` attribute | Chrome 134+, experimental |
| `light-dark()` | Chrome 123+, Firefox 120+, Safari 17.5+ |
| `color-mix()` | Chrome 111+, Firefox 113+, Safari 16.2+ |
| `text-box` | Experimental, limited support |

## File Summary

| File | Lines | Purpose |
|------|-------|---------|
| index.js | 157 | Component class + embedded styles |
| index.html | 52 | Demo page with examples |
| readme.md | 78 | User documentation |
| package.json | 36 | Package metadata |
| confirm.png | - | Screenshot for documentation |

## Summary Table

| Aspect | Details |
|--------|---------|
| **Total Lines** | 157 (index.js) |
| **Classes** | 1 (MsgBox) |
| **Public Methods** | 3 (alert, confirm, prompt) |
| **Properties** | 1 (i18n setter) |
| **CSS Custom Properties** | 6 |
| **Exported Parts** | 8 |
| **Attributes** | 2 (lang, dismiss) |
| **Built-in Languages** | 6 (de, en, es, ja, ru, zh) |
| **Dependencies** | None |
