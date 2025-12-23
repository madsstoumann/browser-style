# Design Token Editors

Web component editors for working with W3C design tokens.

## Features

- **EditColor** (`<edit-color>`) - Advanced color picker for all CSS color spaces
- Future editors for gradients, shadows, borders, typography, etc.

## Installation

```bash
npm install @browser-style/design-token-editors
```

## Usage

### Color Editor

```javascript
import '@browser-style/design-token-editors/color';

// Or import the class
import { EditColor } from '@browser-style/design-token-editors';
```

```html
<edit-color value="#1976D2"></edit-color>
```

The color editor supports:
- All CSS color spaces (sRGB, display-p3, oklab, oklch, etc.)
- Real-time preview with alpha channel
- W3C design token format input/output
- Change events with detailed color information

### Token Format

The editor accepts both string and object formats:

```javascript
// String format (hex, CSS color functions)
editor.value = '#1976D2';
editor.value = 'oklch(0.7 0.27 240)';

// W3C token format
editor.value = {
  colorSpace: 'display-p3',
  components: [0.1, 0.46, 0.82],
  alpha: 1
};
```

### Events

Listen for changes:

```javascript
editor.addEventListener('change', (e) => {
  const { css, space, components, alpha } = e.detail;
  console.log('New color:', css);
});
```

## Dependencies

- Shared styles from `@browser-style/design-token-styles`
- [Color.js](https://colorjs.io/) for color space conversions

## Future Editors

Coming soon:
- `<edit-gradient>` - Gradient editor
- `<edit-shadow>` - Shadow editor
- `<edit-border>` - Border editor
- `<edit-typography>` - Typography editor

## License

MIT
