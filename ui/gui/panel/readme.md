# GUI Panel

A draggable, resizable popover-based GUI panel web component. Features docking capabilities, color scheme toggle, and uses the native Popover API.

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
- `close` - Optional custom close button icon
- `scheme` - Optional custom color scheme toggle icon
- `externalend` - Custom icon for external panel (right side)
- `sidebarend` - Custom icon for docked panel (right side)
- `externalstart` - Custom icon for external panel (left side)
- `sidebarstart` - Custom icon for docked panel (left side)

### Attributes

- `open` - Shows the panel when added
- `title` - Sets the panel title (default: "GUI Panel")
- `dock` - Docks the panel to either side ("start" or "end")
- `docked` - Start panel as docked
- `dismiss` - Makes the panel auto-dismiss when clicking outside
- `noscheme` - Hides the color scheme toggle button
- `noshadow` - Disables Shadow DOM encapsulation
- `popover` - Controls popover behavior ("auto" or "manual")
- `position` - Sets initial position ("top", "bottom", "left", "center" or combinations)
- `resize` - Enables resize handlers ("inline-start", "inline-end", "block-start", "block-end")

### CSS Custom Properties

#### Dimensions & Spacing
- `--gui-panel-w` - Width (default: 265px)
- `--gui-panel-h` - Height (auto by default)
- `--gui-panel-gap` - Internal spacing (default: .5rem)
- `--gui-panel-m` - Margin (default: 1rem)

#### Visual Styling
- `--gui-panel-bg` - Background color (default: Canvas)
- `--gui-panel-bdrs` - Border radius (default: 10px)
- `--gui-panel-bxsh` - Box shadow
- `--gui-panel-c` - Text color (default: CanvasText)

#### Typography
- `--gui-panel-ff` - Font family (default: system-ui)
- `--gui-panel-fs` - Font size (default: 1rem)

#### Resize Handles
- `--gui-panel-rz-touch` - Touch target size for resize handles (default: 12px)
- `--gui-panel-rz-area` - Visual size of resize handles (default: 6px)

#### Resize & Position
- `--gui-panel-w` - Width and minimum width when resizing (default: 265px)
- `--gui-panel-x` - Horizontal position
- `--gui-panel-y` - Vertical position

### Features

- Draggable panel (drag by title)
- Color scheme toggle
- Resizable from any edge (when enabled)
- Dockable to either side of the viewport
- Uses native popover API
- Touch-optimized resize handles
- RTL support
- Light/dark mode support

### Example

```html
<gui-panel 
  open 
  resize="inline-end block-end" 
  position="bottom left" 
  dock="start"
  dismiss
>
  <div slot="content">
    Panel content here
  </div>
</gui-panel>
