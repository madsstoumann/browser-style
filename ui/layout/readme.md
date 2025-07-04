# @browser.style/layout

A modern, configurable CSS layout and content styling system with support for responsive design using both media queries and container queries. This project uses a JSON-driven build process to generate optimized CSS from modular definitions for multiple, distinct systems.

## Installation

```bash
npm install @browser.style/layout
```

## Usage Options

### 1. Pre-built CSS (Recommended)

Use the optimized, pre-built CSS files for layout and content styling:

```css
/* Layout System */
@import '@browser.style/layout/dist/layout.css';

/* Content System */
@import '@browser.style/layout/dist/content.css';

/* Minified versions (production) */
@import '@browser.style/layout/dist/layout.min.css';
@import '@browser.style/layout/dist/content.min.css';
```

### 2. Custom Build (Advanced)

For advanced customization, you can modify the configuration and run the build process yourself.

```bash
# Modify ui/layout/config.json to your needs
npm run build
```

The build script (`ui/layout/build.js`) can also be used programmatically:

```javascript
import LayoutBuilder from '@browser.style/layout/builder';

// Custom build with your own configuration
const builder = new LayoutBuilder('./config.json', './systems/', './dist/');
await builder.buildSystems();
await builder.generateHTML();
```

## HTML Usage

The system generates CSS for different HTML elements based on the configuration.

### Layout System (`<lay-out>`)

Use the `<lay-out>` element for page and component structures.

```html
<lay-out sm="columns(2)" md="bento(6a-fixed)" xl="mosaic(photo-lg)">
  <div>Content 1</div>
  <div>Content 2</div>
  <div>Content 3</div>
  <div>Content 4</div>
  <div>Content 5</div>
  <div>Content 6</div>
</lay-out>
```

### Content System (`<item-card>`)

Use the `<item-card>` element for styling content items within a layout. These styles are often driven by container queries.

```html
<lay-out md="columns(3)">
  <item-card sm="stack(media, body)" md="columns(media, body)">
    <!-- card content -->
  </item-card>
  <item-card sm="stack(media, body)" md="columns(media, body)">
    <!-- card content -->
  </item-card>
  <item-card sm="stack(media, body)" md="columns(media, body)">
    <!-- card content -->
  </item-card>
</lay-out>
```

## Configuration (`config.json`)

The build process is controlled by `ui/layout/config.json`, which defines an array of "systems". Each system is an independent set of CSS rules and configurations.

```json
{
  "systems": [
    {
      "fileName": "layout.css",
      "path": "layouts",
      "layer": "layout",
      "element": "lay-out",
      "generateHTML": true,
      "core": ["base"],
      "common": ["animations", "demo"],
      "breakpoints": {
        "lg": {
          "type": "@media",
          "min": "720px",
          "layouts": ["bento", "columns", "grid"]
        }
      }
    },
    {
      "fileName": "content.css",
      "path": "content",
      "layer": "content",
      "element": "item-card",
      "generateHTML": false,
      "core": ["content"],
      "breakpoints": {
        "sm": {
          "type": "@container",
          "min": "280px",
          "layouts": ["stack", "columns", "rows"]
        }
      }
    }
  ]
}
```

### System Properties

- `fileName`: The name of the output CSS file.
- `path`: The subdirectory within `systems/` containing the JSON definitions.
- `layer`: The name for the CSS cascade layer.
- `element`: The HTML element this system targets.
- `generateHTML`: A boolean to enable or disable the generation of a demo HTML file.
- `core`: Core CSS files to include.
- `common`: Common CSS files to include.
- `breakpoints`: An object defining responsive breakpoints and the layouts to apply.

## Development & Building

### Build Commands

```bash
# Build all systems once
npm run build

# Build and watch for changes (development)
npm run dev

# Build minified versions for production
npm run build:min
```

### Build Features

- ✅ **Multi-System Output**: Generates separate CSS files for each configured system.
- ✅ **CSS Optimization**: Groups identical selectors and properties.
- ✅ **Mixed Query Types**: Supports both `@media` and `@container` queries.
- ✅ **Deduplication**: Eliminates redundant CSS rules.
- ✅ **Watch Mode**: Auto-rebuilds on file changes.
- ✅ **Layer Support**: Uses CSS `@layer` for proper cascade control.

## Package Contents

The relevant development files are located in the `ui/layout/` directory:

```
ui/layout/
├── dist/                 # Compiled output
│   ├── layout.css        # Pre-built CSS for layout system
│   ├── content.css       # Pre-built CSS for content system
│   ├── layout.min.css    # Minified layout CSS
│   ├── content.min.css   # Minified content CSS
│   └── *.html            # Demo files for each layout type
├── systems/              # System JSON definitions
│   ├── layouts/          # JSON files for the "layout" system
│   └── content/          # JSON files for the "content" system
├── core/                 # Core CSS files (base, content, etc.)
├── config.json           # Build configuration
├── build.js              # Build script
└── README.md             # This documentation
```

## CSS Layer Structure

The generated CSS uses CSS cascade layers for better control and organization. Layers are created on a per-system, per-breakpoint basis.

```css
/* Layers for the "layout" system */
@layer layout.xs;
@layer layout.sm;
@layer layout.md;

/* Layers for the "content" system */
@layer content.xs;
@layer content.sm;
@layer content.md;
```

This structure provides:
- ✅ **Predictable Cascade**: Layers ensure consistent styling precedence.
- ✅ **System Isolation**: Styles for `layout` and `content` are kept separate.
- ✅ **Breakpoint Isolation**: Each breakpoint has its own layer.
- ✅ **Easy Overrides**: You can override styles by targeting specific layers.

## Framework Integration (React, Vue, & Angular)

This CSS-only system is designed to work seamlessly with modern web frameworks. Because it uses standard CSS to style custom HTML tags (`<lay-out>`, `<item-card>`), **no JavaScript components or plugins are required.**

You can use the custom tags directly in your components as if they were native HTML elements. Just import the generated CSS into your project.

### React Example

In your React component, you can use the custom tags directly in your JSX. React will render them correctly without any extra configuration.

```jsx
import '@browser.style/layout/dist/layout.css';
import '@browser.style/layout/dist/content.css';

function MyComponent() {
  return (
    <lay-out md="columns(2)" lg="asym(l-r)">
      <item-card sm="stack(media, body)">
        <h2>Card 1</h2>
        <p>Some content here.</p>
      </item-card>
      <item-card sm="stack(media, body)">
        <h2>Card 2</h2>
        <p>Some content here.</p>
      </item-card>
    </lay-out>
  );
}
```

### Vue Example

In your Vue components, you can use the custom tags directly in your templates. Vue's compiler will handle them correctly.

```vue
<template>
  <lay-out md="columns(2)" lg="asym(l-r)">
    <item-card sm="stack(media, body)">
      <h2>Card 1</h2>
      <p>Some content here.</p>
    </item-card>
    <item-card sm="stack(media, body)">
      <h2>Card 2</h2>
      <p>Some content here.</p>
    </item-card>
  </lay-out>
</template>

<style>
@import '@browser.style/layout/dist/layout.css';
@import '@browser.style/layout/dist/content.css';
</style>
```

### Angular Example

To use custom elements in Angular, you need to include `CUSTOM_ELEMENTS_SCHEMA` in the module where you are using them. This tells the Angular compiler to allow non-standard tags.

**In your `app.module.ts` (or feature module):**
```typescript
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@NgModule({
  // ... other module properties
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
```

**In your global `styles.css`:**
```css
@import '@browser.style/layout/dist/layout.css';
@import '@browser.style/layout/dist/content.css';
```

**In your component template:**
```html
<lay-out md="columns(2)" lg="asym(l-r)">
  <item-card sm="stack(media, body)">
    <h2>Card 1</h2>
    <p>Some content here.</p>
  </item-card>
  <item-card sm="stack(media, body)">
    <h2>Card 2</h2>
    <p>Some content here.</p>
  </item-card>
</lay-out>
```

## License

ISC

---

columns(l-r)
columns(r-l)
image()
rows(t-b) // default
rows(b-t)
stack(t-l)
stack(t-c)
stack(t-r)
stack(c-l)
stack(c-c)
stack(c-r)
stack(b-l)
stack(b-c)
stack(b-r)
stack(flip-t)
stack(flip-r)
stack(flip-b)
stack(flip-l)
stack(slide-t)
stack(slide-r)
stack(slide-b)
stack(slide-l)
text()