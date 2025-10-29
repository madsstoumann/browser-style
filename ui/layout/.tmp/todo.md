# Layout System Restructuring - Implementation Plan

**Project**: `@browser.style/layout` v2.0
**Status**: Planning Complete
**Started**: 2025-10-26

---

## 📋 Overview

Restructure the layout system to:
- Modernize architecture with extensible preset model
- Create reusable React and Web Components
- Build visual configurator for CMS integration
- Improve developer experience with zero-config defaults
- Support custom layouts and configurations

---

## 🎯 Phase 1: Core System Restructuring

### 1.1 Folder Structure Setup
- [ ] Create new folder structure:
  ```
  ui/layout-new/
  ├── layout.config                # Renamed from config.json (extensionless)
  ├── core/                         # Base CSS (unchanged)
  ├── layouts/                      # Moved from systems/layouts/
  ├── src/                          # NEW: Source code
  │   ├── types.ts                  # TypeScript definitions
  │   ├── preset.js                 # Preset model/utilities
  │   ├── builder.js                # CSS builder (refactored)
  │   ├── srcset.js                 # Srcset utilities
  │   └── components/
  │       ├── web/                  # Web component
  │       └── react/                # React component
  ├── configurator/                 # NEW: Configurator component
  │   ├── src/
  │   │   ├── web/
  │   │   └── react/
  │   └── package.json
  ├── build.js                      # Entry point for builder
  ├── index.js                      # Main exports
  └── package.json
  ```

### 1.2 Move Layouts Folder
- [ ] Move `systems/layouts/` → `layouts/`
- [ ] Verify all 8 layout JSON files are present:
  - [ ] columns.json
  - [ ] grid.json
  - [ ] bento.json
  - [ ] mosaic.json
  - [ ] ratios.json
  - [ ] asymmetrical.json
  - [ ] autofit.json
  - [ ] overflow.json
- [ ] Remove `systems/` folder

### 1.3 Configuration File Migration
- [ ] Rename `config.json` → `layout.config` (extensionless)
- [ ] Simplify structure (remove multi-system array, single system only)
- [ ] Update schema to new format:

```json
{
  "fileName": "layout.css",
  "element": "lay-out",
  "layer": "layout",
  "generateHTML": false,

  "core": ["base"],
  "common": ["animations"],

  "layoutContainer": {
    "layoutRootElement": "body",
    "maxLayoutWidth": { "value": "1024px", "cssProperty": "--layout-bleed-mw" },
    "layoutMargin": { "value": "1rem", "cssProperty": "--layout-mi" },
    "widthTokens": {
      "xs": { "value": "20rem", "cssProperty": "--layout-width-xs" },
      "sm": { "value": "30rem", "cssProperty": "--layout-width-sm" },
      "md": { "value": "48rem", "cssProperty": "--layout-width-md" },
      "lg": { "value": "64rem", "cssProperty": "--layout-width-lg" },
      "xl": { "value": "80rem", "cssProperty": "--layout-width-xl" },
      "xxl": { "value": "96rem", "cssProperty": "--layout-width-xxl" }
    }
  },

  "breakpoints": {
    "xs": { "type": "@media", "min": "240px", "max": null },
    "sm": { "type": "@media", "min": "380px", "max": null },
    "md": { "type": "@media", "min": "540px", "max": null },
    "lg": { "type": "@media", "min": "720px", "max": null },
    "xl": { "type": "@media", "min": "920px", "max": null },
    "xxl": { "type": "@media", "min": "1140px", "max": null }
  },

  "layouts": {
    "core": ["columns", "grid", "autofit"],
    "advanced": ["bento", "mosaic", "ratios", "asymmetrical"],
    "custom": []
  },

  "themes": {
    "primary": {
      "bg": "#f0f0f0",
      "color": "#333"
    },
    "secondary": {
      "bg": "#e0e0e0",
      "color": "#222"
    },
    "tertiary": {
      "bg": "#d0d0d0",
      "color": "#111"
    }
  }
}
```

---

## 🎯 Phase 2: Layout Preset JSON Model

### 2.1 TypeScript Definitions
- [ ] Create `src/types.ts` with complete type definitions:

```typescript
/**
 * Layout Preset - Complete configuration for a lay-out element
 */
export interface LayoutPreset {
  // Identity
  id: string
  name: string
  description?: string

  // Breakpoint-specific layouts
  breakpoints: {
    [breakpoint: string]: string    // e.g., "md": "columns(2)", "lg": "bento(4a)"
  }

  // Grid Configuration
  columns?: string                  // CSS grid-template-columns override
  rows?: string                     // CSS grid-template-rows override

  // Spacing
  colGap?: number                   // Column gap multiplier (default: 1)
  rowGap?: number                   // Row gap multiplier (default: 1)
  spaceBottom?: number              // Margin bottom multiplier (default: 0)
  spaceTop?: number                 // Margin top multiplier (default: 0)
  padBottom?: number                // Padding bottom multiplier (default: 0)
  padTop?: number                   // Padding top multiplier (default: 0)
  padInline?: number                // Padding inline multiplier (default: 0)

  // Constraints
  maxWidth?: string                 // CSS length/percentage (default: 100vw)
  width?: 'xs'|'sm'|'md'|'lg'|'xl'|'xxl'  // Width token
  bleed?: number                    // Bleed value 0-100 (undefined = no bleed)
  self?: string                     // place-self value (default: auto)

  // Visual & Behavior
  gapDecorations?: boolean          // Enable column/row rules (default: false)
  overflow?: ''|'preview'|'dynamic'|'none'  // Overflow mode
  theme?: string                    // Theme name (primary/secondary/tertiary/custom)
  animation?: string                // Animation value (reserved for future use)
}

/**
 * Layout Configuration (layout.config structure)
 */
export interface LayoutConfig {
  fileName: string
  element: string
  layer?: string
  generateHTML?: boolean
  core: string[]
  common: string[]
  layoutContainer: LayoutContainer
  breakpoints: Record<string, Breakpoint>
  layouts: LayoutsConfig
  themes: Record<string, ThemeConfig>
}

export interface LayoutContainer {
  layoutRootElement: string
  maxLayoutWidth: CSSPropertyMapping
  layoutMargin: CSSPropertyMapping
  widthTokens: Record<string, CSSPropertyMapping>
}

export interface CSSPropertyMapping {
  value: string
  cssProperty: string
}

export interface Breakpoint {
  type: '@media' | '@container'
  min: string | null
  max: string | null
  layouts?: string[]
}

export interface LayoutsConfig {
  core: string[]
  advanced: string[]
  custom: string[]
}

export interface ThemeConfig {
  bg: string
  color: string
}
```

### 2.2 Preset Utilities
- [ ] Create `src/preset.js` with utility functions:

```javascript
/**
 * Create and validate a layout preset
 * @param {Partial<LayoutPreset>} config - Preset configuration
 * @returns {LayoutPreset} Validated preset
 */
export function createPreset(config) { }

/**
 * Convert preset to HTML <lay-out> element string
 * @param {LayoutPreset} preset - Layout preset
 * @param {LayoutConfig} config - Layout configuration
 * @returns {string} HTML string
 */
export function presetToHTML(preset, config) { }

/**
 * Convert preset to HTML attributes object
 * @param {LayoutPreset} preset - Layout preset
 * @returns {Object} Attributes object
 */
export function presetToAttributes(preset) { }

/**
 * Validate preset structure and values
 * @param {any} preset - Preset to validate
 * @returns {boolean} Is valid
 */
export function validatePreset(preset) { }

/**
 * Merge preset with defaults
 * @param {Partial<LayoutPreset>} preset - Partial preset
 * @returns {LayoutPreset} Complete preset with defaults
 */
export function mergePresetDefaults(preset) { }
```

- [ ] Implement validation logic
- [ ] Implement HTML generation
- [ ] Add JSDoc documentation
- [ ] Write unit tests for preset utilities

---

## 🎯 Phase 3: Build System Refactoring

### 3.1 Refactor Builder
- [ ] Create `src/builder.js` based on current `build.js`
- [ ] Update config loading to read `layout.config` (extensionless)
- [ ] Simplify config parsing (no multi-system support)
- [ ] Add support for selective layout inclusion:
  - [ ] Core layouts (always included)
  - [ ] Advanced layouts (opt-in via config)
  - [ ] Custom layouts (from client paths)
- [ ] Update CSS generation to handle new structure
- [ ] Remove HTML generation (move to separate demo package)
- [ ] Add preset-to-CSS generation support

### 3.2 Update Build Entry Point
- [ ] Update `build.js` to be a thin wrapper around `src/builder.js`
- [ ] Support CLI arguments: `--minify`, `--config`, `--output`
- [ ] Add watch mode support
- [ ] Add programmatic API:

```javascript
import { buildLayout } from '@browser.style/layout/build'

await buildLayout({
  config: './layout.config',
  output: './dist/layout.css',
  minify: true
})
```

### 3.3 Refactor Srcset Module
- [ ] Create `src/srcset.js` from current `index.js`
- [ ] Refactor existing functions:
  - [ ] `generateLayoutSrcsets()`
  - [ ] `getSrcset()`
  - [ ] `getLayoutConstraints()`
  - [ ] `generateConstrainedSizes()`
- [ ] Add new function: `autoGenerateSrcsets(preset, config, layoutsData)`
  - [ ] Extract srcset from layout JSONs based on breakpoints
  - [ ] Combine into formatted string
  - [ ] Return: `"default:100vw;540:50%;720:33.33%"`
- [ ] Update to work with new config structure
- [ ] Add comprehensive JSDoc
- [ ] Write unit tests

### 3.4 Update Main Entry Point
- [ ] Refactor `index.js` to export all public APIs:

```javascript
// Preset utilities
export { createPreset, presetToHTML, presetToAttributes, validatePreset } from './src/preset.js'

// Srcset utilities
export { getSrcset, getLayoutConstraints, autoGenerateSrcsets } from './src/srcset.js'

// Builder (for programmatic use)
export { buildLayout } from './src/builder.js'

// Components
export { Layout } from './src/components/react/Layout.jsx'
export { LayoutElement } from './src/components/web/LayoutElement.js'

// Types
export type { LayoutPreset, LayoutConfig } from './src/types.ts'
```

---

## 🎯 Phase 4: Component Development

### 4.1 Web Component (`src/components/web/`)
- [ ] Create `LayoutElement.js` custom element
- [ ] Define component interface:

```javascript
class LayoutElement extends HTMLElement {
  // Properties
  preset = null
  config = null

  // Attributes (individual overrides)
  // All LayoutPreset properties can be set as attributes

  // Methods
  setPreset(preset) { }
  generateSrcsets() { }
  render() { }
}
```

- [ ] Implement preset property setter
- [ ] Implement individual attribute setters
- [ ] Auto-generate srcsets when preset/attributes change
- [ ] Render internal `<lay-out>` element with all attributes
- [ ] Support slot for children
- [ ] Add lifecycle methods
- [ ] Register custom element: `customElements.define('layout-element', LayoutElement)`
- [ ] Write usage documentation
- [ ] Create examples

**Usage Example**:
```html
<layout-element id="hero"></layout-element>
<script type="module">
  import { LayoutElement } from '@browser.style/layout'

  const hero = document.getElementById('hero')
  hero.preset = {
    id: 'hero',
    breakpoints: { md: 'columns(2)', lg: 'bento(4a)' },
    spaceTop: 2,
    spaceBottom: 2
  }
</script>

<!-- Or with attributes -->
<layout-element
  md="columns(2)"
  lg="bento(4a)"
  space-top="2"
  space-bottom="2">
  <item-card></item-card>
</layout-element>
```

### 4.2 React Component (`src/components/react/`)
- [ ] Create `Layout.jsx` React component
- [ ] Add TypeScript definitions (`.d.ts`)
- [ ] Component interface:

```typescript
interface LayoutProps extends Partial<LayoutPreset> {
  preset?: LayoutPreset
  config?: LayoutConfig
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}
```

- [ ] Accept preset object or individual props
- [ ] Individual props override preset values
- [ ] Auto-generate srcsets
- [ ] Render `<lay-out>` element with all attributes
- [ ] Support children
- [ ] Add prop-types validation
- [ ] Write usage documentation
- [ ] Create examples

**Usage Example**:
```jsx
import { Layout, createPreset } from '@browser.style/layout'

const heroPreset = createPreset({
  id: 'hero',
  breakpoints: { md: 'columns(2)', lg: 'bento(4a)' },
  spaceTop: 2,
  spaceBottom: 2
})

function Hero() {
  return (
    <Layout preset={heroPreset}>
      <HeroCard />
      <HeroCard />
    </Layout>
  )
}

// Or with individual props
function Hero() {
  return (
    <Layout
      md="columns(2)"
      lg="bento(4a)"
      spaceTop={2}
      spaceBottom={2}>
      <HeroCard />
    </Layout>
  )
}
```

### 4.3 Component Testing
- [ ] Set up testing framework (Vitest)
- [ ] Write tests for web component
- [ ] Write tests for React component
- [ ] Test srcset auto-generation
- [ ] Test preset merging
- [ ] Test attribute handling

---

## 🎯 Phase 5: Layout Configurator Component

### 5.1 Package Structure
- [ ] Create `configurator/` subfolder
- [ ] Create `configurator/package.json`:

```json
{
  "name": "@browser.style/layout-configurator",
  "version": "1.0.0",
  "description": "Visual layout configurator for @browser.style/layout",
  "type": "module",
  "main": "dist/index.js",
  "exports": {
    ".": "./dist/index.js",
    "./web": "./dist/web/LayoutConfigurator.js",
    "./react": "./dist/react/LayoutConfigurator.jsx"
  },
  "peerDependencies": {
    "@browser.style/layout": "^2.0.0",
    "react": "^18.0.0"
  }
}
```

- [ ] Create build configuration
- [ ] Set up separate npm publishing

### 5.2 Web Component Configurator
- [ ] Create `configurator/src/web/LayoutConfigurator.js`
- [ ] Component features:
  - [ ] Breakpoint selector (tabs/dropdown)
  - [ ] Layout type selector with icon previews
  - [ ] Layout variant selector (e.g., columns(1-6), grid(3a-6b))
  - [ ] Property editors:
    - [ ] Spacing controls (spaceTop, spaceBottom, padTop, padBottom, padInline)
    - [ ] Gap controls (colGap, rowGap)
    - [ ] Bleed slider (0-100)
    - [ ] Width token selector
    - [ ] Max width input
    - [ ] Theme selector
    - [ ] Overflow mode selector
    - [ ] Gap decorations toggle
  - [ ] Preview pane showing current layout
  - [ ] Export/copy preset JSON
  - [ ] Import preset JSON
- [ ] Configuration options:
  - [ ] Accept `config` prop (LayoutConfig object)
  - [ ] Accept `configPath` prop (read from file)
  - [ ] Accept `layouts` prop (custom layouts)
- [ ] Events:
  - [ ] `preset-changed` - Emits LayoutPreset
  - [ ] `breakpoint-changed` - Emits current breakpoint
  - [ ] `layout-selected` - Emits selected layout
- [ ] Styling:
  - [ ] CSS custom properties for theming
  - [ ] Responsive design
  - [ ] Accessibility (ARIA labels, keyboard navigation)

**Usage Example**:
```html
<layout-configurator id="config"></layout-configurator>
<script type="module">
  import { LayoutConfigurator } from '@browser.style/layout-configurator'

  const config = document.getElementById('config')
  config.addEventListener('preset-changed', (e) => {
    console.log('Preset:', e.detail.preset)
  })
</script>
```

### 5.3 React Configurator
- [ ] Create `configurator/src/react/LayoutConfigurator.jsx`
- [ ] TypeScript definitions
- [ ] Component interface:

```typescript
interface LayoutConfiguratorProps {
  config?: LayoutConfig
  configPath?: string
  layouts?: LayoutData[]
  initialPreset?: LayoutPreset
  onChange?: (preset: LayoutPreset) => void
  onBreakpointChange?: (breakpoint: string) => void
  onLayoutSelect?: (layout: string) => void
}
```

- [ ] Same features as web component
- [ ] React-friendly API (onChange callbacks)
- [ ] Controlled/uncontrolled modes
- [ ] Add prop-types validation

**Usage Example**:
```jsx
import { LayoutConfigurator } from '@browser.style/layout-configurator/react'

function ConfigPanel() {
  const [preset, setPreset] = useState(null)

  return (
    <LayoutConfigurator
      onChange={setPreset}
      initialPreset={heroPreset}
    />
  )
}
```

### 5.4 Sanity.io Integration
- [ ] Create `configurator/sanity/` folder
- [ ] Create Sanity schema example:

```javascript
export const layoutPreset = {
  name: 'layoutPreset',
  type: 'object',
  title: 'Layout Preset',
  fields: [
    { name: 'id', type: 'string', title: 'ID' },
    { name: 'name', type: 'string', title: 'Name' },
    { name: 'description', type: 'text', title: 'Description' },
    { name: 'preset', type: 'object', title: 'Configuration' }
  ],
  components: {
    input: LayoutConfiguratorInput
  }
}
```

- [ ] Create Sanity input component wrapper
- [ ] Add documentation for Sanity integration
- [ ] Create example Sanity Studio setup

### 5.5 Configurator Styling
- [ ] Create `configurator/src/styles.css`
- [ ] Use CSS custom properties for theming
- [ ] Create dark/light mode support
- [ ] Ensure responsive design
- [ ] Add icon system (use generated layout icons)

---

## 🎯 Phase 6: Enhanced Srcset Auto-Generation

### 6.1 Srcset Generation Logic
- [ ] Implement `autoGenerateSrcsets(preset, config, layoutsData)` in `src/srcset.js`
- [ ] Algorithm:
  1. Extract breakpoints from preset
  2. For each breakpoint, find layout pattern (e.g., "columns(2)")
  3. Look up layout in layoutsData to get srcset value
  4. Convert breakpoint name to pixel value using config
  5. Combine into formatted string
- [ ] Handle edge cases:
  - [ ] Missing layout data
  - [ ] Invalid layout patterns
  - [ ] Undefined breakpoints
- [ ] Return format: `"default:100vw;540:50%;720:33.33%"`

### 6.2 Integration with Components
- [ ] Web component: Auto-call `autoGenerateSrcsets()` when preset is set
- [ ] React component: Auto-generate in render/useEffect
- [ ] Allow manual override via `srcsets` prop/attribute
- [ ] Update components to pass generated srcsets to `<lay-out>` element

### 6.3 Testing
- [ ] Test srcset generation with various presets
- [ ] Test with all layout types
- [ ] Test with multiple breakpoints
- [ ] Test override functionality
- [ ] Test with missing/invalid data

---

## 🎯 Phase 7: Distribution Strategy

### 7.1 Main Package Structure
- [ ] Update `package.json`:

```json
{
  "name": "@browser.style/layout",
  "version": "2.0.0",
  "description": "Modern CSS layout system with React/Web components",
  "type": "module",
  "main": "index.js",
  "exports": {
    ".": {
      "types": "./src/types.d.ts",
      "import": "./index.js"
    },
    "./css": "./dist/layout.css",
    "./css/min": "./dist/layout.min.css",
    "./build": "./build.js",
    "./preset": "./src/preset.js",
    "./srcset": "./src/srcset.js"
  },
  "files": [
    "index.js",
    "build.js",
    "layout.config",
    "core/",
    "layouts/",
    "src/",
    "dist/layout.css",
    "dist/layout.min.css",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "node build.js",
    "build:min": "node build.js --minify",
    "prepublishOnly": "npm run build && npm run build:min"
  },
  "bin": {
    "browser-style-layout": "./cli.js"
  }
}
```

- [ ] Create CLI wrapper (`cli.js`) for build command
- [ ] Do NOT include demo HTML files
- [ ] Include pre-generated CSS with core layouts
- [ ] Include all layout JSONs for reference

### 7.2 Demo Package (Optional)
- [ ] Create separate `@browser.style/layout-demos` package (optional)
- [ ] Move demo HTML generation code
- [ ] Move icon generation code
- [ ] Separate package.json
- [ ] Decide if this is worth maintaining

### 7.3 Configurator Package
- [ ] Configure `configurator/package.json` for publishing
- [ ] Set up build process
- [ ] Include only dist files
- [ ] Add peerDependencies
- [ ] Add README with usage examples

### 7.4 Pre-generated CSS Strategy
- [ ] Build CSS with core layouts (columns, grid, autofit)
- [ ] Include all breakpoints from default layout.config
- [ ] Minify for production
- [ ] Both files included in package:
  - `dist/layout.css` (unminified, for development)
  - `dist/layout.min.css` (minified, for production)

---

## 🎯 Phase 8: Client Developer Experience

### 8.1 Zero-Config Usage Documentation
- [ ] Create README section for zero-config usage
- [ ] Example:

```bash
npm install @browser.style/layout
```

```javascript
// Import CSS
import '@browser.style/layout/css'

// Use in HTML/JSX
<lay-out md="columns(2)" lg="grid(3a)">
  <div>Item 1</div>
  <div>Item 2</div>
</lay-out>
```

### 8.2 Custom Config Usage Documentation
- [ ] Document creating custom `layout.config` at project root
- [ ] Document running build command:

```bash
npx browser-style-layout build --config ./layout.config --output ./dist/layout.css
```

- [ ] Document customization options:
  - [ ] Custom breakpoints
  - [ ] Selective layout inclusion
  - [ ] Custom themes
  - [ ] Custom width tokens

### 8.3 Component Usage Documentation
- [ ] React component examples
- [ ] Web component examples
- [ ] Preset creation examples
- [ ] Srcset usage examples

### 8.4 Custom Layouts Documentation
- [ ] Document creating custom layout JSON
- [ ] Document adding to layout.config:

```json
{
  "layouts": {
    "core": ["columns", "grid"],
    "custom": ["./layouts/my-custom-layout.json"]
  }
}
```

- [ ] Document rebuilding CSS with custom layouts
- [ ] Provide layout JSON template

### 8.5 Migration Guide
- [ ] Create MIGRATION.md for v1 → v2
- [ ] Document breaking changes:
  - [ ] config.json → layout.config
  - [ ] systems/layouts → layouts
  - [ ] API changes
  - [ ] Component usage
- [ ] Provide migration scripts if needed

---

## 🎯 Phase 9: Theme Configuration

### 9.1 Theme System in Config
- [ ] Add themes section to layout.config:

```json
{
  "themes": {
    "primary": {
      "bg": "#f0f0f0",
      "color": "#333"
    },
    "secondary": {
      "bg": "#e0e0e0",
      "color": "#222"
    },
    "tertiary": {
      "bg": "#d0d0d0",
      "color": "#111"
    },
    "brand": {
      "bg": "#ff6b6b",
      "color": "#ffffff"
    }
  }
}
```

### 9.2 Theme CSS Generation
- [ ] Update builder to generate CSS custom properties for themes
- [ ] Generate for each theme:

```css
lay-out[theme="primary"] {
  --layout-bg: #f0f0f0;
  --layout-c: #333;
}
```

### 9.3 Theme in Presets
- [ ] Support theme property in LayoutPreset
- [ ] Validate theme exists in config
- [ ] Include in HTML generation:

```javascript
const preset = {
  id: 'hero',
  theme: 'brand',
  breakpoints: { md: 'columns(2)' }
}

// Generates: <lay-out theme="brand" md="columns(2)">
```

### 9.4 Theme Documentation
- [ ] Document theme configuration
- [ ] Document theme usage in presets
- [ ] Document custom theme creation
- [ ] Provide theme examples

---

## 📦 Implementation Checklist Summary

### Phase 1: Core Restructuring (8 tasks)
- [ ] Create folder structure
- [ ] Move layouts/ folder
- [ ] Remove systems/ folder
- [ ] Rename config.json → layout.config
- [ ] Simplify config structure
- [ ] Add layouts configuration
- [ ] Add themes configuration
- [ ] Verify all files in place

### Phase 2: Preset Model (4 tasks)
- [ ] Create TypeScript definitions (src/types.ts)
- [ ] Implement preset utilities (src/preset.js)
- [ ] Write documentation
- [ ] Write unit tests

### Phase 3: Build System (10 tasks)
- [ ] Refactor builder (src/builder.js)
- [ ] Update config loading
- [ ] Add selective layout inclusion
- [ ] Update CSS generation
- [ ] Create build.js entry point
- [ ] Add CLI support
- [ ] Refactor srcset module (src/srcset.js)
- [ ] Add autoGenerateSrcsets function
- [ ] Update main index.js exports
- [ ] Write unit tests

### Phase 4: Components (8 tasks)
- [ ] Create web component (src/components/web/)
- [ ] Implement preset handling
- [ ] Implement auto-srcset generation
- [ ] Create React component (src/components/react/)
- [ ] Add TypeScript definitions
- [ ] Write documentation
- [ ] Create examples
- [ ] Write component tests

### Phase 5: Configurator (12 tasks)
- [ ] Create configurator package structure
- [ ] Create web component configurator
- [ ] Implement UI controls
- [ ] Implement preview
- [ ] Add import/export
- [ ] Create React configurator
- [ ] Add TypeScript support
- [ ] Create Sanity integration
- [ ] Create Sanity schema
- [ ] Write documentation
- [ ] Create examples
- [ ] Write tests

### Phase 6: Srcset Enhancement (5 tasks)
- [ ] Implement auto-generation algorithm
- [ ] Handle edge cases
- [ ] Integrate with web component
- [ ] Integrate with React component
- [ ] Write tests

### Phase 7: Distribution (8 tasks)
- [ ] Update package.json
- [ ] Create CLI wrapper
- [ ] Configure exports
- [ ] Pre-generate CSS
- [ ] Configure configurator package
- [ ] Set up publishing workflow
- [ ] Create README files
- [ ] Decide on demo package

### Phase 8: Documentation (10 tasks)
- [ ] Write zero-config guide
- [ ] Write custom config guide
- [ ] Write component usage guide
- [ ] Write custom layouts guide
- [ ] Write API documentation
- [ ] Create migration guide
- [ ] Create examples repository
- [ ] Create video tutorials (optional)
- [ ] Create interactive demos
- [ ] Update website

### Phase 9: Themes (6 tasks)
- [ ] Add themes to config schema
- [ ] Update builder for theme CSS
- [ ] Add theme to preset model
- [ ] Implement theme validation
- [ ] Write theme documentation
- [ ] Create theme examples

---

## 🎨 Key Design Decisions

### ✅ Confirmed Decisions
1. **Config file**: `layout.config` (extensionless, following modern conventions)
2. **Gap decorations**: Include as `gapDecorations` boolean in preset
3. **Animation**: Include attribute in preset for future use
4. **Theme**: Include in preset, with global theme definitions in layout.config
5. **Overflow**: Include in preset (layout-specific behavior)
6. **Size**: Exclude from preset (content-specific optimization)
7. **Default layouts**: Hybrid - core layouts included, advanced opt-in
8. **CSS generation**: Pre-generated with optional custom rebuild
9. **Configurator**: Hybrid - props-based with optional config reading
10. **Srcset**: Auto-generate based on preset

### 📊 Package Structure
- **Main package**: `@browser.style/layout` - includes everything
- **Configurator**: `@browser.style/layout-configurator` - separate package
- **Demos**: Optional separate package (TBD)

### 🔄 Backward Compatibility
- **Breaking changes**: v1 → v2 is a major version bump
- **Migration guide**: Provide comprehensive migration documentation
- **Deprecation**: v1 remains available, v2 is recommended for new projects

---

## 🚀 Next Steps

1. Review and approve this plan
2. Begin with Phase 1 (Core Restructuring)
3. Work through phases sequentially
4. Test after each phase
5. Create preview releases for testing
6. Gather feedback
7. Iterate as needed
8. Final release v2.0.0

---

## 📝 Notes

- This is a comprehensive restructuring that maintains backward compatibility where possible
- The preset model provides a foundation for future enhancements
- Components make the system more accessible to modern frameworks
- The configurator enables visual editing for non-developers
- Pre-generated CSS ensures zero-config usage works out of the box
- Custom config support enables advanced customization

---

**Status**: ✅ Planning Complete - Ready to Begin Implementation
