# PrintPreview

A web component for print preview and page layout control with template support.

> **Note**: Only one `<print-preview>` element is allowed per page, and it must be a direct child of `<body>`.

## Installation

```bash
npm install @browser.style/print-preview
```

## Usage

```javascript
import '@browser.style/print-preview';
```

```html
<!-- Basic usage -->
<print-preview>
  <div class="content">Content to print</div>
</print-preview>

<!-- With template and settings -->
<print-preview
  font-family="ff-humanist"
  font-size="medium"
  lang="en"
  margin-bottom="15"
  margin-left="20"
  margin-right="20"
  margin-top="15"
  orientation="portrait"
  paper-size="A4"
  template="invoice">
</print-preview>
```

## Attributes

- `font-family`: Font family preset (default: 'ff-inherit')
- `font-size`: Font size preset (default: 'medium')
- `images`: Image handling ('show', 'hide', 'outline')
- `lang`: Language code (default: 'en')
- `margin-bottom`: Bottom margin in mm (default: '10mm')
- `margin-left`: Left margin in mm (default: '10mm')
- `margin-right`: Right margin in mm (default: '10mm')
- `margin-top`: Top margin in mm (default: '10mm')
- `orientation`: Page orientation ('portrait', 'landscape')
- `paper-size`: Paper format ('A4', 'A5', 'letter', etc.)
- `template`: Template name for content rendering

## Methods

- `preview()`: Show print preview dialog
- `print()`: Open browser print dialog
- `addTemplate(name, template, settings)`: Add custom template
- `setContent(html)`: Update content directly

## Templates

```javascript
const preview = document.querySelector('print-preview');

// Add custom template
preview.addTemplate('invoice', data => `
  <h1>${data.title}</h1>
  <table>${data.items.map(item => `
    <tr>
      <td>${item.name}</td>
      <td>${item.price}</td>
    </tr>
  `).join('')}</table>
`, {
  'paper-size': 'A4',
  'orientation': 'portrait',
  'margin-top': '20',
  'font-family': 'ff-humanist'
});

// Use template
preview.data = {
  title: 'Invoice #123',
  items: [
    { name: 'Item 1', price: '$10' },
    { name: 'Item 2', price: '$20' }
  ]
};
```

## Events

- `beforetoggle`: Fired before preview dialog opens/closes
- `beforeprint`: Fired before print dialog opens
- `afterprint`: Fired after print dialog closes

## Keyboard Shortcuts

- `Ctrl/Cmd + P`: Open print dialog when preview is open
