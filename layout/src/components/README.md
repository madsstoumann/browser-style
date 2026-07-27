# @browser.style/layout - Web Components

This directory contains all web components for the layout system.

## Components

### LayOut
Responsive layout component with auto-generated srcsets for images. This is the live component.

### Legacy — `composer/`
`composer/` is **precursor-system code**: a schema-driven configurator (`model.json`,
`model.proposal.md`) from the component generation that preceded `ui/card` and its
`variant=`/`media=`/`content=` attributes. It is kept for reference only — not exported,
not maintained, and not part of the package API. The `LayOutConfigurator` barrel export
it once fed has been removed (it pointed at a `./configurator/` path that never shipped
and broke `import { LayOut }` with it).

## Usage

### Installation

```bash
npm install @browser.style/layout
```

### Import Components

```javascript
// Import both components from a single entry point
import { LayOut } from '@browser.style/layout/components'
```

### Basic Usage - LayOut

The `LayOut` component automatically loads layout data from the package and generates srcsets attributes:

```html
<script type="module">
  import { LayOut } from '@browser.style/layout/components'
  // Component auto-loads data - no initialization needed!
</script>

<!-- Use in your HTML -->
<lay-out md="columns(2)" lg="grid(3c)">
  <item-card>
    <img src="image.jpg" alt="...">
  </item-card>
  <item-card>
    <img src="image.jpg" alt="...">
  </item-card>
  <item-card>
    <img src="image.jpg" alt="...">
  </item-card>
</lay-out>
```

The component will automatically generate the `srcsets` attribute:
```html
<lay-out md="columns(2)" lg="grid(3c)" srcsets="540:50%;720:66.67%,33.33%,33.33%@1024">
  ...
</lay-out>
```

### Advanced Usage - Custom Config

If you have your own `layout.config.json` and generated `layouts-map.js`:

```javascript
import { LayOut } from '@browser.style/layout/components'
import { srcsetMap, srcsetConfig } from './layouts-map.js'

// Override with your custom configuration
LayOut.initialize(srcsetMap, srcsetConfig)
```

### Framework Integration

#### Vue 3
```javascript
// main.js or App.vue
import { LayOut } from '@browser.style/layout/components'
import '@browser.style/layout/css'

// Components are now available globally
```

```vue
<template>
  <lay-out md="columns(2)" lg="grid(3c)">
    <item-card v-for="item in items" :key="item.id">
      {{ item.content }}
    </item-card>
  </lay-out>
</template>
```

#### Svelte
```javascript
// +layout.svelte or +page.svelte
<script>
  import { LayOut } from '@browser.style/layout/components'
  import '@browser.style/layout/css'
</script>

<lay-out md="columns(2)" lg="grid(3c)">
  {#each items as item}
    <item-card>{item.content}</item-card>
  {/each}
</lay-out>
```

#### React
```jsx
// App.jsx
import { useEffect } from 'react'
import '@browser.style/layout/components'
import '@browser.style/layout/css'

function App() {
  return (
    <lay-out md="columns(2)" lg="grid(3c)">
      {items.map(item => (
        <item-card key={item.id}>{item.content}</item-card>
      ))}
    </lay-out>
  )
}
```

## API Reference

### LayOut

**Attributes:**
- `xs`, `sm`, `md`, `lg`, `xl`, `xxl` - Layout patterns for each breakpoint
- `srcsets` - Auto-generated srcsets string (read-only)

**Static Methods:**
- `LayOut.initialize(srcsetMap, srcsetConfig)` - Override with custom configuration

**Static Properties:**
- `LayOut.srcsetMap` - Map of layout patterns to srcsets
- `LayOut.srcsetConfig` - Configuration with breakpoints and maxLayoutWidth

## Package Exports

```javascript
// All components
import { LayOut } from '@browser.style/layout/components'

// CSS
import '@browser.style/layout/css'

// Layout maps (for custom initialization)
import { srcsetMap, srcsetConfig } from '@browser.style/layout/maps'

// Srcsets utilities (for vanilla JS)
import { generateSrcsets, applySrcsets } from '@browser.style/layout/srcsets'
```

## Browser Support

- All modern browsers with ES6 modules support
- Custom Elements v1
- ES6 Classes

## License

ISC
