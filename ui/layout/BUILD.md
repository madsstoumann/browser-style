# Layout Build System

This layout system uses a JSON-driven build process to generate optimized CSS from modular layout definitions.

## Quick Start

```bash
# Build CSS once
npm run build

# Build and watch for changes (development)
npm run dev

# Build CSS with watch mode
npm run build:watch
```

## File Structure

```
├── config.json           # Main configuration (breakpoints & layouts)
├── build/                # Layout definitions (JSON)
│   ├── autofit.json      # Auto-fitting grid layouts
│   ├── asymmetrical.json # Asymmetrical layouts
│   ├── bento.json        # Bento box layouts
│   ├── columns.json      # Column layouts
│   └── ...
├── build-css.js          # Build script
└── dist.css              # Generated output (optimized CSS)
```

## Configuration

### `config.json`
- **breakpoints**: Define responsive breakpoints with `@media` or `@container` queries
- **core**: Specify core CSS modules to include

### Layout JSON Files
Each layout type is defined in a separate JSON file with:
- **Layout definitions**: Grid patterns, rules, and properties
- **Human-readable descriptions**: Documentation for each layout
- **CSS mappings**: Property mappings and selector rules

## Usage

```css
@import '@browser.style/layout/dist.css';
```

```html
<lay-out sm="columns(2)" md="bento(1lg-v:2sm)" xl="mosaic(photo)">
  <div>Content 1</div>
  <div>Content 2</div>
  <div>Content 3</div>
</lay-out>
```

## Build Features

- ✅ **CSS optimization**: Groups identical selectors and properties
- ✅ **Mixed query types**: Supports both `@media` and `@container` queries
- ✅ **Deduplication**: Eliminates redundant CSS rules
- ✅ **Watch mode**: Auto-rebuilds on file changes
- ✅ **Layer support**: Uses CSS `@layer` for proper cascade control
