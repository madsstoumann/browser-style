# Nav Compass

A highly customizable compass web component that can work in two modes: course (compass rotates) or bearing (arrow rotates). Supports multiple languages, customizable appearance, and configurable display options.

## Installation

```bash
npm install @browser.style/nav-compass
```

## Basic Usage

```javascript
import '@browser.style/nav-compass';
```

```html
<nav-compass degree="28.5"></nav-compass>
```

## Attributes

- `degree`: The compass direction in degrees (0-359.9)
- `mode`: Compass mode - "bearing" (default, arrow rotates) or "course" (compass rotates)
- `lang`: Language for cardinal directions (supports "en", "es", "zh")
- `value`: Optional custom value to display instead of degrees
- `label`: Optional label to display below the value (units, etc.)
- `indices`: Number of indices around the compass (default: 60)
- `marks`: Determines which indices are marked as major (default: every 5th)

## CSS Custom Properties

- `--nav-compass-arrow-width`: Width of the compass arrow (default: 8cqi)
- `--nav-compass-arrow-line-width`: Width of the arrow line (default: 1.5cqi)
- `--nav-compass-bg`: Background color of the compass (default: light/dark theme sensitive)
- `--nav-compass-c`: Text color (default: light/dark theme sensitive)
- `--nav-compass-ff`: Font family (default: system font stack)
- `--nav-compass-directions-p`: Padding for cardinal directions (default: .5ch 1ch)
- `--nav-compass-label-fs`: Font size for the label (default: 5cqi)
- `--nav-compass-label-fw`: Font weight for the label (default: 500)
- `--nav-compass-indices-c`: Color for the indices (default: currentColor)
- `--nav-compass-indice-fs`: Font size for indices (default: 2.5cqi)
- `--nav-compass-indice-fw`: Font weight for regular indices (default: 300)
- `--nav-compass-indice-mark-fw`: Font weight for major indices (default: 900)
- `--nav-compass-arrow-bg`: Color of the compass arrow (default: currentColor)

## JavaScript API

### Custom Translations

Add or override translations for cardinal directions:

```javascript
const myCompass = document.querySelector('nav-compass');
myCompass.i18n = {
  'de': { 
    'N': { abbr: 'N', full: 'Nord' }, 
    'E': { abbr: 'O', full: 'Ost' }, 
    'S': { abbr: 'S', full: 'Süd' }, 
    'W': { abbr: 'W', full: 'West' } 
  }
};
```

## Examples

### Basic Compass (Bearing Mode)
```html
<nav-compass degree="45"></nav-compass>
```

### Course Mode Compass
```html
<nav-compass degree="180" mode="course"></nav-compass>
```

### Wind Speed Display
```html
<nav-compass degree="90" value="5" label="m/s"></nav-compass>
```

### Localized Compass
```html
<nav-compass degree="270" lang="es"></nav-compass>
```

### Customized Appearance
```html
<nav-compass 
  degree="120" 
  style="--nav-compass-arrow-bg: red; --nav-compass-bg: #f0f0f0;"
></nav-compass>
```
