# GUI Panel

A draggable, popover-based GUI panel web component.

## Installation

```bash
npm install @browser.style/gui-panel
```

## Usage

Import and use the component in your JavaScript:

```javascript
import GuiPanel from '@browser.style/gui-panel';
```

Add the component to your HTML:

```html
<gui-panel>
  <div slot="content">
    <!-- Your panel content here -->
  </div>
</gui-panel>
```

### Slots

- `content` - Main panel content
- `footer` - Optional footer content
- `close` - Optional custom close button icon
- `scheme` - Optional custom color scheme toggle icon

### Attributes

- `open` - Shows the panel when added
- `title` - Sets the panel title (default: "GUI Panel")

### CSS Custom Properties

- `--gui-panel-bg` - Background color (default: Canvas)
- `--gui-panel-bdrs` - Border radius (default: 10px)
- `--gui-panel-bxsh` - Box shadow
- `--gui-panel-c` - Text color (default: CanvasText)
- `--gui-panel-ff` - Font family
- `--gui-panel-fs` - Font size (default: 1rem)
- `--gui-panel-gap` - Internal spacing (default: .75rem)
- `--gui-panel-m` - Margin (default: 1rem)
- `--gui-panel-w` - Width (default: 265px)
- `--gui-panel-x` - Horizontal position
- `--gui-panel-y` - Vertical position

## Features

- Draggable panel (drag by title)
- Color scheme toggle
- Auto-hiding footer when empty
- Uses native popover API
- Light/dark mode support
