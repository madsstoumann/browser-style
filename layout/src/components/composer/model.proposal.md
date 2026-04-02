# Model Proposal: Enhanced Layout Configuration

## Overview

This proposal updates the layout model to support all proposed features:

- **Breakpoint-controlled spacing** (from `spacing.proposal.md`)
- **Header slot configuration** (from `header.proposal.md`)
- **Item animations with stagger** (from `animations.proposal.md`)
- **Layout morphing** (from `grid.animations.proposal.md`)

---

## Current Model Structure

```json
{
  "animation": { "name": "", "range": "" },
  "bleed": 0,
  "breakpoints": { "xs": "", "sm": "", "md": "", "lg": "", "xl": "", "xxl": "" },
  "colGap": 1,
  "columns": "1fr",
  "decorations": false,
  "maxWidth": "100vw",
  "overflow": "",
  "padBottom": 0,
  "padInline": 0,
  "padTop": 0,
  "rowGap": 1,
  "rows": "auto",
  "self": "auto",
  "size": "",
  "spaceBottom": 0,
  "spaceTop": 0,
  "width": ""
}
```

**Limitation:** Spacing/padding values are global — they apply to all breakpoints.

---

## Proposed Model Structure

```json
{
  "breakpoints": {
    "xs": {
      "layout": "",
      "p": 0,
      "px": 0,
      "py": 0,
      "g": 0
    },
    "sm": {
      "layout": "",
      "p": 0,
      "px": 0,
      "py": 0,
      "g": 0
    },
    "md": {
      "layout": "columns(2)",
      "p": 1,
      "px": null,
      "py": null,
      "g": 1
    },
    "lg": {
      "layout": "grid(3a)",
      "p": 2,
      "px": null,
      "py": null,
      "g": 2
    },
    "xl": {
      "layout": "mosaic(scatter)",
      "p": 3,
      "px": null,
      "py": null,
      "g": 2
    },
    "xxl": {
      "layout": "",
      "p": null,
      "px": null,
      "py": null,
      "g": null
    }
  },
  "global": {
    "bleed": 0,
    "columns": "1fr",
    "decorations": "",
    "maxWidth": "100vw",
    "overflow": "",
    "rows": "auto",
    "self": "auto",
    "size": "",
    "width": ""
  },
  "header": {
    "enabled": false,
    "headline": "",
    "description": ""
  },
  "animation": {
    "container": {
      "name": "",
      "range": ""
    },
    "items": {
      "name": "",
      "stagger": "normal"
    },
    "morph": false
  },
  "spacing": {
    "scale": {
      "s1": "0.5rem",
      "s2": "1rem",
      "s3": "2rem",
      "s4": "4rem"
    }
  }
}
```

---

## Property Definitions

### breakpoints.{bp}

Each breakpoint now contains layout AND spacing:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `layout` | `string` | `""` | Layout pattern (e.g., `"columns(2)"`, `"grid(3a)"`) |
| `p` | `number\|null` | `null` | All padding (0-4 scale) |
| `px` | `number\|null` | `null` | Inline padding override |
| `py` | `number\|null` | `null` | Block padding override |
| `g` | `number\|null` | `null` | Gap (0-4 scale) |

**Note:** `null` means "inherit from previous breakpoint" — only set values that change.

### global

Properties that apply across all breakpoints:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `bleed` | `number` | `0` | Bleed percentage (0-100) |
| `columns` | `string` | `"1fr"` | Default grid-template-columns |
| `decorations` | `string` | `""` | Gap decorations (`""`, `"cols"`, `"rows"`, `"cols rows"`) |
| `maxWidth` | `string` | `"100vw"` | Maximum inline size |
| `overflow` | `string` | `""` | Overflow mode |
| `rows` | `string` | `"auto"` | Default grid-template-rows |
| `self` | `string` | `"auto"` | Place-self value |
| `size` | `string` | `""` | Contain-intrinsic-size |
| `width` | `string` | `""` | Width preset (xs-xxl) |

### header

Header slot configuration:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enabled` | `boolean` | `false` | Enable header slot |
| `headline` | `string` | `""` | Headline text (for preview) |
| `description` | `string` | `""` | Description text (for preview) |

### animation.container

Container-level scroll animation:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `name` | `string` | `""` | Animation name(s) |
| `range` | `string` | `""` | Animation range preset |

### animation.items

Item-level staggered animations:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `name` | `string` | `""` | Item animation name |
| `stagger` | `string` | `"normal"` | Stagger timing (`"fast"`, `"normal"`, `"slow"`, `"slower"`) |

### animation.morph

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `morph` | `boolean` | `false` | Enable View Transitions for layout changes |

### spacing.scale

Custom spacing scale (maps to CSS custom properties):

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `s1` | `string` | `"0.5rem"` | Spacing level 1 |
| `s2` | `string` | `"1rem"` | Spacing level 2 |
| `s3` | `string` | `"2rem"` | Spacing level 3 |
| `s4` | `string` | `"4rem"` | Spacing level 4 |

---

## Generated HTML Output

### Example Model

```json
{
  "breakpoints": {
    "md": { "layout": "columns(2)", "p": 1, "g": 1 },
    "lg": { "layout": "grid(3a)", "p": 2, "g": 2 },
    "xl": { "layout": "mosaic(scatter)", "p": 3, "g": 2 }
  },
  "header": {
    "enabled": true,
    "headline": "Featured Products",
    "description": "Our top picks"
  },
  "animation": {
    "container": { "name": "fade-right", "range": "" },
    "items": { "name": "fade-up", "stagger": "normal" },
    "morph": true
  }
}
```

### Generated Output

```html
<lay-out
  md="columns(2) p(1) g(1)"
  lg="grid(3a) p(2) g(2)"
  xl="mosaic(scatter) p(3) g(2)"
  animation="fade-right"
  animation-items="fade-up stagger-normal"
  animate-layout
>
  <header slot="header">
    <h2>Featured Products</h2>
    <p>Our top picks</p>
  </header>
  <item-card></item-card>
  <item-card></item-card>
  <item-card></item-card>
</lay-out>
```

---

## JavaScript Model Handler

### ModelHandler Class

```javascript
/**
 * Handles reading, updating, and serializing the layout model
 */
export class ModelHandler {
  constructor(defaults = {}) {
    this.model = this.createDefaultModel();
    this.listeners = new Set();

    if (defaults) {
      this.merge(defaults);
    }
  }

  /**
   * Create empty model with all defaults
   */
  createDefaultModel() {
    return {
      breakpoints: {
        xs: { layout: '', p: null, px: null, py: null, g: null },
        sm: { layout: '', p: null, px: null, py: null, g: null },
        md: { layout: '', p: null, px: null, py: null, g: null },
        lg: { layout: '', p: null, px: null, py: null, g: null },
        xl: { layout: '', p: null, px: null, py: null, g: null },
        xxl: { layout: '', p: null, px: null, py: null, g: null }
      },
      global: {
        bleed: 0,
        columns: '1fr',
        decorations: '',
        maxWidth: '100vw',
        overflow: '',
        rows: 'auto',
        self: 'auto',
        size: '',
        width: ''
      },
      header: {
        enabled: false,
        headline: '',
        description: ''
      },
      animation: {
        container: { name: '', range: '' },
        items: { name: '', stagger: 'normal' },
        morph: false
      },
      spacing: {
        scale: {
          s1: '0.5rem',
          s2: '1rem',
          s3: '2rem',
          s4: '4rem'
        }
      }
    };
  }

  /**
   * Deep merge values into model
   */
  merge(values) {
    this.model = this.deepMerge(this.model, values);
    this.notify();
  }

  /**
   * Get value by dot-notation path
   * @example get('breakpoints.lg.layout')
   */
  get(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.model);
  }

  /**
   * Set value by dot-notation path
   * @example set('breakpoints.lg.layout', 'grid(3a)')
   */
  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, key) => {
      if (!(key in obj)) obj[key] = {};
      return obj[key];
    }, this.model);

    target[lastKey] = value;
    this.notify();
  }

  /**
   * Subscribe to model changes
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all subscribers
   */
  notify() {
    this.listeners.forEach(fn => fn(this.model));
  }

  /**
   * Deep merge helper
   */
  deepMerge(target, source) {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  /**
   * Export model as JSON
   */
  toJSON() {
    return JSON.stringify(this.model, null, 2);
  }

  /**
   * Import model from JSON
   */
  fromJSON(json) {
    const parsed = typeof json === 'string' ? JSON.parse(json) : json;
    this.model = this.deepMerge(this.createDefaultModel(), parsed);
    this.notify();
  }
}
```

### AttributeBuilder Class

```javascript
/**
 * Generates HTML attributes from model
 */
export class AttributeBuilder {
  constructor(model) {
    this.model = model;
  }

  /**
   * Build breakpoint attribute value
   * Combines layout + spacing tokens
   */
  buildBreakpointValue(bp) {
    const config = this.model.breakpoints[bp];
    if (!config) return '';

    const tokens = [];

    // Layout pattern
    if (config.layout) {
      tokens.push(config.layout);
    }

    // Spacing tokens (only if set)
    if (config.p !== null && config.p !== undefined) {
      tokens.push(`p(${config.p})`);
    }
    if (config.px !== null && config.px !== undefined) {
      tokens.push(`px(${config.px})`);
    }
    if (config.py !== null && config.py !== undefined) {
      tokens.push(`py(${config.py})`);
    }
    if (config.g !== null && config.g !== undefined) {
      tokens.push(`g(${config.g})`);
    }

    return tokens.join(' ');
  }

  /**
   * Build all attributes as object
   */
  buildAttributes() {
    const attrs = {};

    // Breakpoint attributes
    for (const bp of ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']) {
      const value = this.buildBreakpointValue(bp);
      if (value) {
        attrs[bp] = value;
      }
    }

    // Global attributes
    const { global } = this.model;
    if (global.bleed) attrs.bleed = global.bleed;
    if (global.columns !== '1fr') attrs.columns = global.columns;
    if (global.decorations) attrs['gap-decorations'] = global.decorations;
    if (global.maxWidth !== '100vw') attrs['max-width'] = global.maxWidth;
    if (global.overflow) attrs.overflow = global.overflow;
    if (global.rows !== 'auto') attrs.rows = global.rows;
    if (global.self !== 'auto') attrs.self = global.self;
    if (global.size) attrs.size = global.size;
    if (global.width) attrs.width = global.width;

    // Container animation
    const { container } = this.model.animation;
    if (container.name) {
      attrs.animation = container.name;
      if (container.range) {
        attrs.range = container.range;
      }
    }

    // Item animation
    const { items } = this.model.animation;
    if (items.name) {
      const staggerClass = items.stagger !== 'normal' ? ` stagger-${items.stagger}` : '';
      attrs['animation-items'] = `${items.name}${staggerClass}`;
    }

    // Layout morphing
    if (this.model.animation.morph) {
      attrs['animate-layout'] = '';
    }

    return attrs;
  }

  /**
   * Build attributes as HTML string
   */
  toHTML() {
    const attrs = this.buildAttributes();
    return Object.entries(attrs)
      .map(([key, value]) => value === '' ? key : `${key}="${value}"`)
      .join(' ');
  }

  /**
   * Build header slot HTML
   */
  buildHeaderSlot() {
    const { header } = this.model;
    if (!header.enabled) return '';

    const parts = ['<header slot="header">'];
    if (header.headline) {
      parts.push(`  <h2>${header.headline}</h2>`);
    }
    if (header.description) {
      parts.push(`  <p>${header.description}</p>`);
    }
    parts.push('</header>');

    return parts.join('\n');
  }

  /**
   * Build complete lay-out element
   */
  toElement(itemCount = 4, itemTag = 'item-card') {
    const attrsString = this.toHTML();
    const headerSlot = this.buildHeaderSlot();
    const items = Array(itemCount).fill(`<${itemTag}></${itemTag}>`).join('\n  ');

    return `<lay-out ${attrsString}>
  ${headerSlot}
  ${items}
</lay-out>`;
  }
}
```

### FormBinder Class

```javascript
/**
 * Binds form elements to model using data attributes
 */
export class FormBinder {
  constructor(form, modelHandler) {
    this.form = form;
    this.handler = modelHandler;
    this.debounceTimer = null;
  }

  /**
   * Initialize form binding
   */
  init() {
    // Single delegated event listener
    this.form.addEventListener('input', this.handleInput.bind(this));
    this.form.addEventListener('change', this.handleChange.bind(this));

    // Subscribe to model changes for reverse binding
    this.handler.subscribe(() => this.syncFormFromModel());

    // Initial sync
    this.syncFormFromModel();
  }

  /**
   * Handle input events (for real-time updates)
   */
  handleInput(event) {
    const { target } = event;
    if (!target.dataset.model) return;

    // Debounce rapid inputs
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.updateModelFromField(target);
    }, 50);
  }

  /**
   * Handle change events (for selects, checkboxes)
   */
  handleChange(event) {
    const { target } = event;
    if (!target.dataset.model) return;

    this.updateModelFromField(target);
  }

  /**
   * Update model from a form field
   * Field must have data-model="path.to.property"
   */
  updateModelFromField(field) {
    const path = field.dataset.model;
    let value;

    switch (field.type) {
      case 'checkbox':
        value = field.checked;
        break;
      case 'number':
      case 'range':
        value = field.value === '' ? null : Number(field.value);
        break;
      default:
        value = field.value;
    }

    this.handler.set(path, value);
  }

  /**
   * Sync form fields from current model state
   */
  syncFormFromModel() {
    const fields = this.form.querySelectorAll('[data-model]');

    fields.forEach(field => {
      const path = field.dataset.model;
      const value = this.handler.get(path);

      switch (field.type) {
        case 'checkbox':
          field.checked = Boolean(value);
          break;
        case 'number':
        case 'range':
          field.value = value ?? '';
          break;
        default:
          field.value = value ?? '';
      }
    });
  }
}
```

---

## Form HTML Structure

### Example Form Markup

```html
<form id="layout-composer">
  <!-- Breakpoint Panel -->
  <fieldset>
    <legend>Large Breakpoint (lg)</legend>

    <label>
      Layout
      <select data-model="breakpoints.lg.layout">
        <option value="">None</option>
        <optgroup label="Columns">
          <option value="columns(2)">2 Columns</option>
          <option value="columns(3)">3 Columns</option>
        </optgroup>
        <optgroup label="Grid">
          <option value="grid(3a)">Grid 3a</option>
          <option value="grid(3b)">Grid 3b</option>
        </optgroup>
      </select>
    </label>

    <label>
      Padding
      <input type="number" data-model="breakpoints.lg.p" min="0" max="4" step="1">
    </label>

    <label>
      Gap
      <input type="number" data-model="breakpoints.lg.g" min="0" max="4" step="1">
    </label>
  </fieldset>

  <!-- Header Panel -->
  <fieldset>
    <legend>Header</legend>

    <label>
      <input type="checkbox" data-model="header.enabled">
      Enable Header
    </label>

    <label>
      Headline
      <input type="text" data-model="header.headline">
    </label>

    <label>
      Description
      <input type="text" data-model="header.description">
    </label>
  </fieldset>

  <!-- Animation Panel -->
  <fieldset>
    <legend>Container Animation</legend>

    <label>
      Animation
      <select data-model="animation.container.name">
        <option value="">None</option>
        <option value="fade-in">Fade In</option>
        <option value="fade-up">Fade Up</option>
        <option value="fade-right">Fade Right</option>
      </select>
    </label>

    <label>
      Range
      <select data-model="animation.container.range">
        <option value="">Default</option>
        <option value="contain">Contain</option>
        <option value="cover">Cover</option>
        <option value="exit">Exit</option>
      </select>
    </label>
  </fieldset>

  <!-- Item Animation Panel -->
  <fieldset>
    <legend>Item Animation</legend>

    <label>
      Animation
      <select data-model="animation.items.name">
        <option value="">None</option>
        <option value="fade-up">Fade Up</option>
        <option value="zoom-in">Zoom In</option>
        <option value="slide-up">Slide Up</option>
      </select>
    </label>

    <label>
      Stagger
      <select data-model="animation.items.stagger">
        <option value="fast">Fast (50ms)</option>
        <option value="normal" selected>Normal (100ms)</option>
        <option value="slow">Slow (150ms)</option>
        <option value="slower">Slower (200ms)</option>
      </select>
    </label>

    <label>
      <input type="checkbox" data-model="animation.morph">
      Animate Layout Changes
    </label>
  </fieldset>
</form>
```

---

## Initialization Example

```javascript
import { ModelHandler, AttributeBuilder, FormBinder } from './model-handler.js';
import modelDefaults from './model.json' with { type: 'json' };

// Initialize
const handler = new ModelHandler(modelDefaults);
const form = document.getElementById('layout-composer');
const preview = document.getElementById('preview');

// Bind form to model
const binder = new FormBinder(form, handler);
binder.init();

// Update preview on model changes
handler.subscribe((model) => {
  const builder = new AttributeBuilder(model);
  preview.innerHTML = builder.toElement(4);
});
```

---

## Migration from Current Model

### Conversion Function

```javascript
/**
 * Convert old model format to new format
 */
function migrateModel(oldModel) {
  const newModel = {
    breakpoints: {},
    global: {
      bleed: oldModel.bleed || 0,
      columns: oldModel.columns || '1fr',
      decorations: oldModel.decorations ? 'cols rows' : '',
      maxWidth: oldModel.maxWidth || '100vw',
      overflow: oldModel.overflow || '',
      rows: oldModel.rows || 'auto',
      self: oldModel.self || 'auto',
      size: oldModel.size || '',
      width: oldModel.width || ''
    },
    header: {
      enabled: false,
      headline: '',
      description: ''
    },
    animation: {
      container: {
        name: oldModel.animation?.name || '',
        range: oldModel.animation?.range || ''
      },
      items: { name: '', stagger: 'normal' },
      morph: false
    },
    spacing: {
      scale: {
        s1: '0.5rem',
        s2: '1rem',
        s3: '2rem',
        s4: '4rem'
      }
    }
  };

  // Convert breakpoints
  for (const bp of ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']) {
    newModel.breakpoints[bp] = {
      layout: oldModel.breakpoints?.[bp] || '',
      p: null,
      px: null,
      py: null,
      g: null
    };
  }

  // Map global spacing to first active breakpoint
  const firstActiveBp = Object.entries(newModel.breakpoints)
    .find(([, config]) => config.layout)?.[0];

  if (firstActiveBp) {
    // Convert old spacing values to new scale (approximate)
    const padValue = Math.max(oldModel.padTop || 0, oldModel.padBottom || 0, oldModel.padInline || 0);
    const gapValue = Math.max(oldModel.colGap || 1, oldModel.rowGap || 1);

    newModel.breakpoints[firstActiveBp].p = Math.min(4, Math.round(padValue));
    newModel.breakpoints[firstActiveBp].g = Math.min(4, Math.round(gapValue));
  }

  return newModel;
}
```

---

## Summary

### Key Changes

| Aspect | Old Model | New Model |
|--------|-----------|-----------|
| Spacing | Global properties | Per-breakpoint with 0-4 scale |
| Breakpoints | String value only | Object with layout + spacing |
| Header | Not supported | `header` object |
| Item animation | Not supported | `animation.items` object |
| Layout morphing | Not supported | `animation.morph` flag |
| Form binding | Manual attribute mapping | Declarative `data-model` paths |

### Benefits

1. **Unified breakpoint config** — Layout and spacing together
2. **Simpler form binding** — Single `data-model` attribute
3. **Reactive updates** — Subscribe pattern for preview sync
4. **Type-safe paths** — Dot notation for nested properties
5. **Migration path** — Conversion function for existing configs
