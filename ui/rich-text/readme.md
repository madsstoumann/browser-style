# RichText

A customizable rich text editor web component with toolbar support and command system.

## Installation

```bash
npm install @browser.style/rich-text
```

## Usage

```javascript
import '@browser.style/rich-text';
```

```html
<!-- Basic usage -->
<rich-text>Initial content</rich-text>

<!-- With custom toolbar -->
<rich-text
  toolbar="b,i,u|h1,h2,h3|ol,ul,hr|img|link,unlink"
  event-mode="both"
  plaintext="false">
  <p>Initial formatted content</p>
</rich-text>
```

## Attributes

- `event-mode`: Event handling mode ('input', 'change', 'both')
- `input-types`: Comma-separated list of allowed input types
- `plaintext`: Enable plaintext-only mode (no formatting)
- `skip-toolbar`: Custom text for skip-to-content button
- `toolbar`: Pipe-separated groups of comma-separated commands

## Events

- `rt:content`: Content changed (provides new content)
- `rt:clear`: Clear content
- `rt:reset`: Reset to initial content

## Form Integration

```html
<form>
  <rich-text name="editor">
    Initial content
  </rich-text>
</form>
```

Access form values:
```javascript
const form = document.querySelector('form');
const editor = form.elements.editor;
console.log(editor.value); // Current HTML content
```

## Custom Commands

Add custom toolbar commands:

```javascript
const editor = document.querySelector('rich-text');
editor.addCustomCommand({
  key: 'custom',
  command: 'insertHTML',
  icon: 'M12,2A10,10 0 0,1 22,12', // SVG path
  title: 'Insert Custom',
  fn: (node) => {
    document.execCommand('insertHTML', false, '<div>Custom content</div>');
  }
});
```

## Toolbar Groups

Default toolbar groups are separated by `|` and commands within groups by `,`:

```html
<rich-text toolbar="b,i,u|h1,h2,h3|ol,ul">
  <!-- Basic formatting, headings, and lists -->
</rich-text>
```

Available commands:
- Text style: `b` (bold), `i` (italic), `u` (underline)
- Headings: `h1`, `h2`, `h3`
- Lists: `ol` (ordered), `ul` (unordered)
- Media: `img` (image), `link`, `unlink`
- Layout: `hr` (horizontal rule)

## Content Manipulation

```javascript
const editor = document.querySelector('rich-text');

// Clear content
editor.dispatchEvent(new Event('rt:clear'));

// Reset to initial content
editor.dispatchEvent(new Event('rt:reset'));

// Set new content
editor.setContent('<p>New content</p>', false);
```
