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

Each layout type is defined in a separate JSON file with the following structure:

```json
{
  "name": "Human-readable name",
  "prefix": "css-prefix",
  "layouts": [
    {
      "id": "short-id",
      "description": "Description of the layout",
      "columns": "CSS grid columns",
      "items": 3,
      "repeatable": true,
      "rules": [
        {
          "selector": "*:nth-of-type(3n+1)",
          "properties": {
            "--layout-ga": "span 2 / span 1"
          }
        }
      ]
    }
  ]
}
```

#### Structure Properties

- **name**: Human-readable name for the layout type (e.g., "Bento Layouts")
- **prefix**: CSS prefix used for class generation (e.g., "bento" generates `bento(layout-id)`)
- **layouts**: Array of individual layout definitions

#### Layout Properties

- **id**: Short identifier without prefix (e.g., "left-right" instead of "asym(left-right)")
- **description**: Human-readable description of the layout
- **columns**: CSS grid-template-columns value
- **items**: Number of items this layout supports
- **repeatable**: Boolean indicating if the layout can repeat with more items
- **rules**: Array of CSS rules to apply to specific child elements

#### Benefits of New Structure

- **Flexible prefixes**: Easy to change CSS class prefixes without editing each layout
- **Modular organization**: Clear separation between metadata and layout definitions  
- **Extensible**: Easy to add new layout types or modify existing ones
- **Human-readable**: Clear naming and structure for maintenance

#### Layout Type Categories

The layout system is organized into distinct categories based on their behavior and use cases:

**True Bento Layouts (`bento.json`)**
- Fixed, non-repeatable layouts inspired by traditional Japanese bento boxes
- Highly curated arrangements with specific item counts (6-9 items)
- Complex grid positioning with artistic asymmetry
- Examples: `bento(6a-fixed)`, `bento(7b-fixed)`, `bento(9a-fixed)`
- Use prefix: `bento`

**Grid Layouts (`grid.json`)**
- Repeatable grid patterns with mixed item sizes
- Large and small items in predictable patterns
- Can accommodate unlimited items through repetition
- Examples: `grid(2sm:1lg-h)`, `grid(1lg-v:4sm)`  
- Use prefix: `grid`

**Other Layout Types**
- `asymmetrical.json`: Basic asymmetrical patterns
- `columns.json`: Column-based layouts
- `ratios.json`: Proportional layouts
- `autofit.json`: Auto-fitting grids
- `mosaic.json`: Mosaic-style arrangements

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
