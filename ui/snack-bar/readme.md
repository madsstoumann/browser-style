# SnackBar

A lightweight notification component supporting different message types, actions, and positioning.

## Installation

```bash
npm install @browser.style/snack-bar
```

## Usage

```javascript
import '@browser.style/snackbar';
```

```html
<!-- Basic usage -->
<snack-bar position="bottom right"></snack-bar>

<!-- With manual control -->
<snack-bar position="top center" popover="manual"></snack-bar>
```

## JavaScript API

```javascript
const snackbar = document.querySelector('snack-bar');

// Simple message
snackbar.add('Message text', 'info', 3000);

// With action button
snackbar.add('Message with action', 'warning', 0, 'Undo');

// Different types
snackbar.add('Success message', 'success', 3000);
snackbar.add('Error message', 'error', 0);
```

## Attributes

- `position`: Message position ('top', 'bottom', 'left', 'right', 'center')
- `popover`: Popover behavior ('auto', 'manual')
- `order`: Message stacking order ('normal', 'reverse')

## Message Types

- `info`: Blue theme
- `success`: Green theme
- `warning`: Yellow theme
- `error`: Red theme

## Item Properties

- `message`: Text content
- `part`: Message type ('info', 'success', 'warning', 'error')
- `duration`: Display duration in ms (0 for manual close)
- `actionText`: Optional action button text

## Events

The component uses the Popover API and emits:
- `beforetoggle`: Before showing/hiding
- Item removal triggers automatic popover hiding when empty

## Styling

Custom properties for styling:

```css
snack-bar {
  --snack-bar-m: .5rem;      /* Margin */
  --snack-bar-gap: .5rem;    /* Gap between items */
  --snack-bar-mw: 350px;     /* Maximum width */
}

snack-item {
  --snack-item-bg: #fff;     /* Background */
  --snack-item-c: #000;      /* Text color */
  --snack-item-ac: #007bff;  /* Action color */
  --snack-item-ff: system-ui;/* Font family */
  --snack-item-fs: 1rem;     /* Font size */
  --snack-item-lh: 1.4;      /* Line height */
}
```

## Examples

```javascript
// Multiple messages
const snackbar = document.querySelector('snack-bar');
snackbar.add('Processing...', 'info', 2000);
snackbar.add('Success!', 'success', 3000);

// Manual control
const manual = document.querySelector('snack-bar[popover="manual"]');
const item = manual.add('Confirm action?', 'warning', 0, 'Confirm');
item.addEventListener('click', e => {
  if (e.target.matches('[part="action"]')) {
    // Handle action click
    item.remove();
  }
});
