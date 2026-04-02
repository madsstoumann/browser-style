# PrintPreview Component - Internal Architecture

## Overview

`<print-preview>` is a custom web component that provides a sophisticated print preview interface and page layout control system with template support. It allows users to preview and configure print settings before sending to the printer.

**Version:** Not specified in code

**Component Type:** Custom element extending HTMLElement (not FormElement)

**Key Features:**
- Full print preview with WYSIWYG interface
- 10 paper sizes (A3, A4, A5, B4, B5, JIS-B4, JIS-B5, letter, legal, ledger)
- Portrait/landscape orientation
- 4 independent margin controls
- 16 font family presets + 7 font sizes
- Template system for dynamic content
- Image handling (show/hide/outline)
- Keyboard shortcuts (Ctrl/Cmd + P)
- Internationalization support
- Clean API with preview(), print(), addTemplate(), setContent()

**Key architectural decisions:**
- **Singleton pattern**: Only one instance allowed per document
- **Body-child requirement**: Must be direct child of `<body>`
- **Popover API**: Full-screen modal interface
- **CSS custom properties**: Extensive customization via variables
- **Template function system**: Dynamic content generation
- **System print hook**: Intercepts browser print dialog

## Architecture Overview

### Component Lifecycle

```
constructor()
  ↓
  Attach shadow DOM (line 113)
  Initialize templates Map (line 114)
  Create base structure: <form> + <paper-tray> (line 117)
  Load styles asynchronously (line 120)
  Setup event listeners (line 121)
  ↓
  Setup popover toggle listener (lines 124-135)
    - On open: Hide body overflow, add keyboard listener
    - On close: Restore body overflow, remove keyboard listener
  ↓
  Setup system print listeners (lines 138-145)
    - beforeprint: Set mode='hidden'
    - afterprint: Remove mode attribute
  ↓
connectedCallback()  [lines 157-170]
  ↓
  Enforce singleton + body-child (line 158)
  If violated: Log error, cleanup, return (lines 159-160)
  ↓
  Set unique ID (line 164)
  Store as static #instance (line 165)
  Add popover attribute (line 166)
  Add page styles to document (line 167)
  Render form UI (line 168)
  Render initial content (line 169)
  ↓
attributeChangedCallback(name)  [lines 148-155]
  ↓
  If 'lang': Update #lang, re-render form
  If layout attributes: Update page styles
  ↓
disconnectedCallback()  [lines 172-174]
  ↓
  Call #cleanup()
```

### Static Properties

| Property | Type | Line | Purpose |
|----------|------|------|---------|
| `#pageStyleId` | String | 2 | ID for page styles in document head |
| `#id` | String | 3 | Unique component instance ID |
| `#instance` | PrintPreview | 4 | Singleton reference |
| `#printStyleId` | String | 5 | ID for print-specific styles |

### Static Initialization Block (lines 7-13)

```javascript
static {
  const id = [...crypto.getRandomValues(new Uint8Array(4))]
    .map(n => n.toString(16).padStart(2, '0')).join('');
  this.#id = `dp${id}`;
  this.#pageStyleId = `style-${id}`;
  this.#printStyleId = `print-${this.#id}`;
}
```

## Data Flow Pipeline

### Template Rendering Flow

```
addTemplate(name, template, settings)  [lines 396-401]
  ↓
  Store template function in Map (line 398)
  Store settings with '-settings' suffix (line 399)
  ↓
set data(value)  [lines 99-102]
  ↓
  Store value in _data
  Call #renderContent()
  ↓
#renderContent()  [lines 245-259]
  ↓
  If using template without data: exit (line 246)
  Get template function from Map (line 247)
  Get settings from Map (line 248)
  ↓
  If settings exist:
    Apply as attributes (lines 251-253)
    Re-render form (line 254)
  ↓
  Render template result OR <slot> (lines 257-258)
```

### Print Flow

```
preview()  [lines 407-409]
  ↓
  Call showPopover() (inherited)
  ↓
User configures settings
  ↓
print()  [lines 411-426]
  ↓
  Add print-specific styles (line 412)
  Set mode='printing' (line 413)
  ↓
  Define cleanup function (lines 415-420)
  Register cleanup for afterprint (line 422)
  Register cleanup for focus (line 423)
  ↓
  Trigger window.print() (line 425)
  ↓
System print dialog
  ↓
On print complete OR dialog cancel:
  cleanup() executes
  ↓
  Remove print styles (line 416)
  Remove mode attribute (line 417)
  Remove event listeners (lines 418-419)
```

## Paper Sizes

### Paper Size Definitions (lines 44-55)

| Size | Width | Height | Ratio |
|------|-------|--------|-------|
| A5 | 148mm | 210mm | 1.414 |
| A4 | 210mm | 297mm | 1.414 |
| A3 | 297mm | 420mm | 1.414 |
| B5 | 176mm | 250mm | 1.420 |
| B4 | 250mm | 353mm | 1.412 |
| JIS-B5 | 182mm | 257mm | 1.412 |
| JIS-B4 | 257mm | 364mm | 1.416 |
| letter | 8.5in | 11in | 1.294 |
| legal | 8.5in | 14in | 1.647 |
| ledger | 11in | 17in | 1.545 |

## Font Family System

### 16 Font Family Presets (lines 359-378)

| Key | Font Stack |
|-----|------------|
| `ff-system-ui` | system-ui, sans-serif |
| `ff-transitional` | Charter, Cambria, Georgia |
| `ff-old-style` | Iowan Old Style, Palatino |
| `ff-humanist` | Seravek, Gill Sans |
| `ff-geometric` | Avenir, Montserrat |
| `ff-classical` | Optima, Candara |
| `ff-grotesque` | Inter, Roboto |
| `ff-monospace` | Nimbus Mono PS, Courier |
| `ff-code` | Cascadia Code, Source Code Pro |
| `ff-industrial` | Bahnschrift, DIN |
| `ff-rounded` | Hiragino Maru Gothic, Quicksand |
| `ff-slab` | Rockwell, DejaVu Serif |
| `ff-antique` | Superclarendon, Georgia |
| `ff-didone` | Didot, Bodoni MT |
| `ff-handwritten` | Segoe Print, Bradley Hand |
| `ff-inherit` | inherit |

## DOM Structure

### Shadow DOM Structure

```html
<form>
  <fieldset>
    <!-- Paper size select -->
    <select name="paper-size">...</select>

    <!-- Orientation select -->
    <select name="orientation">...</select>

    <!-- Font family select -->
    <select name="font-family">...</select>

    <!-- Font size select -->
    <select name="font-size">...</select>

    <!-- Margin inputs -->
    <fieldset>
      <input type="number" name="margin-top">
      <input type="number" name="margin-right">
      <input type="number" name="margin-bottom">
      <input type="number" name="margin-left">
    </fieldset>

    <!-- Image handling -->
    <select name="images">...</select>

    <!-- Action buttons -->
    <button name="print">Print</button>
    <button name="close">Close</button>
  </fieldset>
</form>
<paper-tray>
  <!-- Content rendered here -->
</paper-tray>
```

### Content Structure

```html
<paper-tray>
  <paper-sheet>
    <!-- Page 1 content -->
  </paper-sheet>
  <paper-sheet>
    <!-- Page 2 content -->
  </paper-sheet>
  <!-- ... -->
</paper-tray>
```

## CSS Architecture

### CSS Custom Properties (lines 347-392)

**Page Layout:**
```css
--page-width        /* Paper width in units */
--page-height       /* Paper height in units */
--page-ratio        /* Aspect ratio for preview scaling */
--page-margin-top   /* Top margin */
--page-margin-right /* Right margin */
--page-margin-bottom/* Bottom margin */
--page-margin-left  /* Left margin */
--page-root-size    /* Font size preset */
--page-font         /* Selected font family */
```

**Font Families:**
```css
--ff-system-ui      /* Modern sans-serif stack */
--ff-transitional   /* Charter, Cambria stack */
/* ... 14 more ... */
```

### CSS Parts

| Part | Element | Purpose |
|------|---------|---------|
| `table` | table | Style tables in templates |
| `tbody` | tbody | Body rows |
| `tfoot` | tfoot | Footer rows |
| `left` | td/th | Text alignment left |
| `right` | td/th | Text alignment right |
| `paper` | svg | Paper size icon |
| `fontsize` | svg | Font size icon |
| `image` | svg | Image icon |
| `margin` | svg | Margin icon |
| `printer` | svg | Printer icon |
| `close` | svg | Close button icon |

### Print Media Styles (lines 112-152 in CSS)

```css
@media print {
  /* Hide component during system print */
  :host([mode="hidden"]) { display: none !important; }

  /* Remove margins, hide form */
  :host { margin: 0; padding: 0; }
  :host form { display: none; }

  /* Page breaks between sheets */
  paper-sheet {
    break-after: page;
    page-break-after: always;
  }

  /* Prevent orphaned last page */
  paper-sheet:last-child {
    break-after: avoid;
  }
}
```

## Public API

### Properties (Getters)

| Property | Line | Default | Purpose |
|----------|------|---------|---------|
| `fontSize` | 88 | 'medium' | Current font size |
| `fontFamily` | 89 | 'ff-inherit' | Current font family |
| `marginBottom` | 90 | '10mm' | Bottom margin |
| `marginLeft` | 91 | '10mm' | Left margin |
| `marginRight` | 92 | '10mm' | Right margin |
| `marginTop` | 93 | '10mm' | Top margin |
| `orientation` | 94 | 'portrait' | Page orientation |
| `paperSize` | 95 | 'A4' | Paper size |
| `template` | 96 | 'default' | Current template name |
| `useTemplate` | 97 | Boolean | Whether using template |

### Properties (Setters)

| Property | Type | Purpose |
|----------|------|---------|
| `data` | any | Set template data, triggers render |

### Methods

| Method | Parameters | Returns | Purpose |
|--------|------------|---------|---------|
| `preview()` | None | void | Show preview popover |
| `print()` | None | void | Initiate print workflow |
| `addTemplate(name, template, settings)` | String, Function, Object | void | Add template |
| `defaultTemplate(data)` | any | String | Built-in JSON template |
| `setContent(html)` | String | void | Set content directly |

### Static Methods

| Method | Purpose |
|--------|---------|
| `register()` | Register custom element |

### Static i18n Accessor (lines 82-83)

```javascript
static get i18n() { return PrintPreview.#i18n; }
static set i18n(value) { PrintPreview.#i18n = { ...PrintPreview.#i18n, ...value }; }
```

## Event System

### Keyboard Handler (lines 104-109)

```javascript
#handleKeyPress = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
    e.preventDefault();
    this.print();
  }
}
```

### Form Handlers (lines 210-220)

```javascript
#handleFormChange = {
  'paper-size': (v) => this.setAttribute('paper-size', v),
  'orientation': (v) => this.setAttribute('orientation', v),
  'font-family': (v) => this.setAttribute('font-family', v),
  'font-size': (v) => this.setAttribute('font-size', v),
  'margin-top': (v) => this.setAttribute('margin-top', `${v}mm`),
  'margin-right': (v) => this.setAttribute('margin-right', `${v}mm`),
  'margin-bottom': (v) => this.setAttribute('margin-bottom', `${v}mm`),
  'margin-left': (v) => this.setAttribute('margin-left', `${v}mm`),
  'images': (v) => this.setAttribute('images', v)
}
```

### Event Listeners (lines 331-345)

| Event | Target | Handler | Purpose |
|-------|--------|---------|---------|
| `submit` | shadowRoot | preventDefault | Prevent form submit |
| `change` | shadowRoot | #handleFormChange | Handle settings |
| `click` | shadowRoot | print/close | Handle buttons |

## Observed Attributes (lines 21-32)

```javascript
static observedAttributes = [
  'font-family',
  'font-size',
  'lang',
  'margin-bottom',
  'margin-left',
  'margin-right',
  'margin-top',
  'orientation',
  'paper-size',
  'template'
]
```

## Integration Patterns

### Basic Usage

```html
<print-preview>
  <paper-sheet>
    <h1>Page 1</h1>
  </paper-sheet>
</print-preview>
```

### With Attributes

```html
<print-preview
  font-family="ff-humanist"
  font-size="large"
  paper-size="letter"
  orientation="landscape"
  margin-top="20"
  margin-bottom="20">
  <paper-sheet>Content</paper-sheet>
</print-preview>
```

### Template Pattern

```javascript
const pp = document.querySelector('print-preview');

pp.addTemplate('invoice', (data) => `
  <paper-sheet>
    <h1>Invoice #${data.id}</h1>
    <table part="table">
      <tbody part="tbody">
        ${data.items.map(item => `
          <tr>
            <td>${item.name}</td>
            <td part="right">${item.price}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </paper-sheet>
`, {
  'paper-size': 'A4',
  'font-family': 'ff-transitional'
});

pp.data = { id: 123, items: [...] };
pp.preview();
```

### Dynamic Content

```javascript
const pp = document.querySelector('print-preview');
pp.setContent('<paper-sheet><p>New content</p></paper-sheet>');
pp.print();
```

### Custom Styling

```css
print-preview::part(table) {
  border-collapse: collapse;
  width: 100%;
}

print-preview::part(right) {
  text-align: right;
}
```

### Adding Languages

```javascript
PrintPreview.i18n = {
  es: {
    bottom: 'Abajo',
    close: 'Cerrar',
    font_family: 'Familia de fuentes',
    // ... more translations
  }
};
document.querySelector('print-preview').setAttribute('lang', 'es');
```

## Deep Dives

### Page Style Generation (lines 347-392)

```javascript
#updatePageStyles() {
  const { width, height, ratio } = PrintPreview.#paperSizes[this.paperSize];
  const isLandscape = this.orientation === 'landscape';

  // Calculate dimensions based on orientation
  const pageWidth = isLandscape ? height : width;
  const pageHeight = isLandscape ? width : height;
  const pageRatio = isLandscape ? 1/ratio : ratio;

  // Generate CSS custom properties
  const styles = `
    :root {
      --page-width: ${pageWidth};
      --page-height: ${pageHeight};
      --page-ratio: ${pageRatio};
      --page-margin-top: ${this.marginTop};
      --page-margin-right: ${this.marginRight};
      --page-margin-bottom: ${this.marginBottom};
      --page-margin-left: ${this.marginLeft};
      --page-root-size: ${this.fontSize};
      --page-font: var(--${this.fontFamily});
      /* Font family definitions... */
    }
  `;

  // Update style element in document head
  document.getElementById(PrintPreview.#pageStyleId).textContent = styles;
}
```

### Print Style Injection (lines 187-202)

```javascript
#addPrintStyle() {
  const style = document.createElement('style');
  style.id = PrintPreview.#printStyleId;
  style.textContent = `
    @media print {
      body > *:not(print-preview) {
        display: none !important;
      }
      @page {
        margin: ${this.marginTop} ${this.marginRight} ${this.marginBottom} ${this.marginLeft};
        size: ${this.paperSize} ${this.orientation};
      }
    }
  `;
  document.head.appendChild(style);
}
```

### Singleton Enforcement (lines 157-162)

```javascript
connectedCallback() {
  if (PrintPreview.#instance || this.parentElement !== document.body) {
    console.error(this.#t().errors[
      PrintPreview.#instance ? 'single_instance' : 'body_child'
    ]);
    this.#cleanup();
    return;
  }
  // ...
}
```

## Gotchas and Edge Cases

### 1. Singleton Constraint (line 158)

**Issue:** Only ONE instance allowed per document.

**Error:** Logged to console, element removed.

### 2. Body-Child Requirement (line 158)

**Issue:** Must be direct child of `<body>`.

**Error:** Logged to console, element removed.

### 3. Popover API Dependency

**Issue:** Relies on browser Popover API.

**Compatibility:** Chrome 114+, Firefox 125+, Safari 17.4+

### 4. Template Data Synchronization (line 246)

**Issue:** Template won't render without data.

**Solution:** Set data property to trigger render.

### 5. Image Handling (lines 383-387)

**Issue:** `images="hide"` removes images from print.

**Modes:**
- `show` (default): Print normally
- `hide`: `display: none` on images
- `outline`: Hide content, show dotted border

### 6. Print Dialog Cleanup (lines 422-423)

**Issue:** Cleanup fires after print OR after focus.

**Reason:** Handles both print completion and dialog cancel.

### 7. Body Overflow Management (lines 126-132)

**Issue:** Toggles `document.body.style.overflow`.

**Impact:** Prevents scrolling behind popover.

### 8. Margin Unit Handling

**Issue:** Form inputs accept numbers only (0-100).

**Solution:** Component appends 'mm' automatically.

### 9. Content ID Generation (line 117)

**Issue:** Uses paper-tray element, not unique ID.

**Impact:** Content reference via `this.content`.

### 10. Shadow DOM Content (line 117)

**Issue:** Content inside paper-sheet is NOT in shadow DOM.

**Impact:** External styles affect content.

## Internationalization

### i18n Object Structure (lines 57-80)

```javascript
#i18n = {
  en: {
    bottom: 'Bottom',
    close: 'Close',
    errors: {
      single_instance: 'Only one <print-preview> allowed',
      body_child: 'Must be direct child of <body>'
    },
    font_family: 'Font Family',
    font_size: 'Font Size',
    hide: 'Hide',
    images: 'Images',
    left: 'Left',
    orientation: 'Orientation',
    orientation_landscape: 'Landscape',
    orientation_portrait: 'Portrait',
    outline: 'Outline',
    paper_size: 'Paper Size',
    print: 'Print',
    right: 'Right',
    show: 'Show',
    top: 'Top'
  }
}
```

### Translation Helper (line 86)

```javascript
#t = () => PrintPreview.#i18n[this.#lang];
```

## Dependencies

### External Package (package.json)

```json
{
  "dependencies": {
    "@browser.style/common": "^1.0.1"
  }
}
```

### Browser APIs Used

| API | Purpose |
|-----|---------|
| Web Components | customElements.define() |
| Shadow DOM | attachShadow(), adoptedStyleSheets |
| Popover API | showPopover(), hidePopover() |
| CSSStyleSheet | Constructable stylesheets |
| Fetch API | CSS file loading |
| Crypto API | Random ID generation |
| Print API | window.print(), beforeprint, afterprint |

## File Summary

| File | Lines | Purpose |
|------|-------|---------|
| index.js | 431 | Main component class |
| index.css | 152 | Shadow DOM + print styles |
| index.html | ~300 | Demo page |
| package.json | ~50 | Package metadata |
| readme.md | ~100 | User documentation |

## Summary Table

| Aspect | Details |
|--------|---------|
| **Type** | Custom Element (HTMLElement) |
| **Shadow DOM** | Yes (open mode) |
| **Singleton** | Yes (one per document) |
| **Paper Sizes** | 10 |
| **Font Families** | 16 presets |
| **Font Sizes** | 7 (xx-small to xx-large) |
| **Margin Controls** | 4 independent |
| **Image Modes** | 3 (show, hide, outline) |
| **Orientations** | 2 (portrait, landscape) |
| **CSS Parts** | 11 |
| **CSS Custom Properties** | 20+ |
| **Observed Attributes** | 10 |
| **Public Methods** | 5 |
| **i18n Keys** | 16 |
| **Dependencies** | @browser.style/common |
