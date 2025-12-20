# Design Token Component Implementation Plan

## Overview

A unified `<design-token>` custom element that can both **display** and **edit** any design token type, following the [W3C DTCG specification](https://www.designtokens.org/tr/third-editors-draft/).

The component maintains an internal state object that strictly follows the DTCG spec format, enabling:
1. Direct JSON import/export compatible with the spec
2. Future generation of CSS custom properties
3. Future "storybook-like" token documentation pages

---

## Architecture

### Core Principles

1. **Spec Compliance**: The internal state is always a valid DTCG token object
2. **Single Source of Truth**: Properties update state; state drives rendering
3. **Simple Editor First**: All types use a text input initially; type-specific editors added later
4. **Progressive Enhancement**: Display-first, edit on interaction (popover)

### Component Structure

```
ui/design-token/
├── index.js              # Main DesignToken component
├── renderers.js          # Type-specific display renderers
├── index.html            # Demo page
└── styles.css            # Component styles (optional, can be inline)
```

Future additions:
```
├── types/                # Type-specific editors (Phase 2+)
│   ├── color.js
│   ├── dimension.js
│   └── ...
├── utils/
│   ├── css-generator.js
│   └── reference-resolver.js
```

---

## Component API

### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `type` | string | Token type: `color`, `dimension`, `font-family`, `font-weight`, `duration`, `cubic-bezier`, `number`, `stroke-style`, `border`, `shadow`, `gradient`, or `semantic` |
| `name` | string | Token name (key in the JSON structure) |
| `value` | string/JSON | Token value (parsed as JSON if object, or raw CSS value) |
| `description` | string | Optional `$description` |
| `display` | string | Content to display (e.g., `"The quick brown fox"` for font-family) |
| `readonly` | boolean | If true, disable editing |

### Type Names

**Raw types** (lowercase CSS-style) represent single, primitive values:

| Type | DTCG Spec Name | CSS Property Examples |
|------|----------------|----------------------|
| `color` | color | color, background-color |
| `dimension` | dimension | width, padding, font-size |
| `font-family` | fontFamily | font-family |
| `font-weight` | fontWeight | font-weight |
| `duration` | duration | transition-duration |
| `cubic-bezier` | cubicBezier | transition-timing-function |
| `number` | number | line-height, opacity, z-index |
| `stroke-style` | strokeStyle | border-style |
| `shadow` | shadow | box-shadow |
| `gradient` | gradient | background-image |
| `border` | border | border |

**Semantic type** references other tokens or uses CSS functions:

| Type | Description |
|------|-------------|
| `semantic` | References other tokens via `{path.to.token}` or uses CSS functions like `light-dark()`, `clamp()` |

```html
<!-- Raw tokens -->
<design-token type="color" name="blue-500" value="#3366CC"></design-token>
<design-token type="dimension" name="spacing-md" value="1rem"></design-token>

<!-- Semantic tokens -->
<design-token type="semantic" name="text-primary" value="{color.gray.900}"></design-token>
<design-token type="semantic" name="surface" value="light-dark({color.light}, {color.dark})"></design-token>
```

### Properties

```javascript
// The component exposes a single state property that follows the DTCG spec
element.token = {
  "$type": "color",
  "$value": "#3366CC",
  "$description": "Primary brand color"
};

// Individual properties also update the internal state
element.type = "color";
element.name = "primary";
element.value = "#3366CC";
element.description = "Primary brand color";
element.display = "Sample text";
```

### Events

| Event | Detail | Description |
|-------|--------|-------------|
| `change` | `{ token, name }` | Fired when token value changes (on blur/submit) |
| `input` | `{ token, name }` | Fired on each edit (real-time) |

---

## Internal State Structure

The component always maintains a state object following the DTCG spec:

```javascript
this._state = {
  // The token key/name (not part of spec, stored separately)
  _name: "primary-color",

  // Standard DTCG properties
  "$type": "color",
  "$value": "#3366CC",  // Can be simple string OR complex object
  "$description": "Primary brand color",
  "$extensions": {
    "cssProp": "--primary",
    "cssFunc": {
      "name": "light-dark",
      "args": ["{color.light}", "{color.dark}"]
    }
  }
};
```

**Note**: For initial implementation, `$value` can be stored as the raw CSS string the user types. Complex DTCG objects (with colorSpace, components, etc.) are supported but not required.

---

## Display Rendering

The `display` attribute provides custom content to render with the token's style applied.

### How It Works

```html
<!-- Color token: shows color swatch -->
<design-token type="color" name="primary" value="#3366CC"></design-token>

<!-- Font family: shows custom text styled with the font -->
<design-token
  type="font-family"
  name="heading"
  value="Georgia, serif"
  display="The quick brown fox jumps over the lazy dog"
></design-token>

<!-- Font size: shows sample text at that size -->
<design-token
  type="dimension"
  name="text-xl"
  value="1.5rem"
  display="Large Text Sample"
></design-token>

<!-- No display: just shows name and value -->
<design-token type="number" name="z-modal" value="100"></design-token>
```

### Type-Specific Display Behavior

| Type | Default Display | With `display` attribute |
|------|----------------|-------------------------|
| `color` | Color swatch button | Color swatch button |
| `font-family` | Font name | Text styled with font |
| `font-weight` | Weight value | Text at that weight |
| `dimension` | Value with unit | Text/element at that size |
| `duration` | Duration value | Duration value |
| `cubic-bezier` | Curve values | Curve values |
| `number` | Number value | Number value |
| `shadow` | Shadow preview | Element with shadow |
| `border` | Border preview | Element with border |
| `gradient` | Gradient swatch | Gradient swatch |
| `semantic` | Value (reference or function) | Value |

---

## Editor (Phase 1: Simple Text Input)

For the initial implementation, ALL token types use a simple text input:

```html
<design-token>
  #shadow-root
    <button part="display" popovertarget="editor">
      <!-- Type-specific preview -->
    </button>
    <div part="info">
      <span part="name">{name}</span>
      <span part="value">{value}</span>
    </div>
    <form id="editor" popover>
      <label>
        <span>Value</span>
        <input type="text" name="value" value="{current value}" />
      </label>
    </form>
</design-token>
```

The text input accepts any valid CSS value for that property type. The value is stored directly as `$value` in the state.

### Future: Type-Specific Editors

Later phases will add specialized editors:
- **color**: Color picker with space selection
- **dimension**: Value + unit selector
- **cubic-bezier**: Visual curve editor
- **shadow**: Multi-field shadow builder
- etc.

---

## CSS Custom Property Generation

The value entered becomes the CSS custom property value:

```javascript
// Input
<design-token type="color" name="primary-500" value="#3366CC">

// Generated CSS
--primary-500: #3366CC;
```

For token references:
```javascript
// Input
<design-token type="color" name="text" value="{color.gray.900}">

// Generated CSS
--text: var(--color-gray-900);
```

---

## Implementation Phases

### Phase 1: Core Component (Start Here)

1. Create `DesignToken` class extending `HTMLElement`
2. Implement state management (`_state` object matching DTCG spec)
3. Implement attribute/property reflection
4. Render display button with type-specific preview
5. Render simple text input in popover
6. Emit `change` and `input` events with full token object
7. Support `display` attribute for custom display content

**Deliverables:**
- `index.js` - Main component
- `index.html` - Demo with various token types

### Phase 2: Type-Specific Renderers

1. Color swatch renderer
2. Font specimen renderer
3. Dimension visualization
4. Shadow/border preview
5. Gradient swatch

### Phase 3: Type-Specific Editors (Future)

1. Color picker with color space support
2. Dimension editor (value + unit)
3. Cubic bezier curve editor
4. Shadow builder

### Phase 4: Advanced Features (Future)

1. Token reference resolution for `semantic` type
2. Reference picker UI (select from available tokens)
3. CSS function builder for `semantic` type

### Phase 5: Integration (Future)

1. JSON import/export
2. CSS custom property generation
3. Group/collection support

---

## Rendering Strategy

### Shadow DOM Structure

```html
<design-token type="font-family" name="sans" value="Inter, sans-serif" display="Hello World">
  #shadow-root
    <button part="display" popovertarget="editor" style="--_value: Inter, sans-serif">
      <span part="preview">Hello World</span>  <!-- styled with font-family -->
    </button>
    <dl part="info">
      <dt part="name">sans</dt>
      <dd part="value">Inter, sans-serif</dd>
    </dl>
    <form id="editor" popover part="editor">
      <label>
        Value
        <input type="text" name="value" value="Inter, sans-serif" />
      </label>
    </form>
</design-token>
```

### CSS Parts

```css
design-token::part(display) { /* Preview button */ }
design-token::part(preview) { /* Content inside button */ }
design-token::part(info) { /* Name/value container */ }
design-token::part(name) { /* Token name */ }
design-token::part(value) { /* Token value */ }
design-token::part(editor) { /* Popover editor form */ }
```

---

## Example Usage

### Raw Tokens

```html
<!-- Color -->
<design-token
  type="color"
  name="primary-500"
  value="#3366CC"
  description="Primary brand color"
></design-token>

<!-- Font Family with sample text -->
<design-token
  type="font-family"
  name="heading"
  value="Georgia, Times, serif"
  display="The quick brown fox jumps over the lazy dog"
></design-token>

<!-- Dimension -->
<design-token
  type="dimension"
  name="text-2xl"
  value="1.5rem"
  display="Large Heading"
></design-token>

<!-- Shadow -->
<design-token
  type="shadow"
  name="shadow-md"
  value="0 4px 6px -1px rgb(0 0 0 / 0.1)"
></design-token>
```

### Semantic Tokens

```html
<!-- Simple reference -->
<design-token
  type="semantic"
  name="text-primary"
  value="{color.gray.900}"
  description="References base gray"
></design-token>

<!-- CSS function with references -->
<design-token
  type="semantic"
  name="surface"
  value="light-dark({color.white}, {color.gray.900})"
  description="Adaptive surface color"
></design-token>

<!-- Fluid spacing with clamp -->
<design-token
  type="semantic"
  name="spacing-fluid"
  value="clamp({spacing.sm}, 2vw, {spacing.lg})"
></design-token>
```

### From JavaScript

```javascript
const token = document.querySelector('design-token');

// Set via property
token.token = {
  "$type": "color",
  "$value": "#ff6600",
  "$description": "Accent color"
};

// Listen for changes
token.addEventListener('change', (e) => {
  console.log('Token updated:', e.detail.token);
  // { "$type": "color", "$value": "#ff6600", ... }
});
```

---

## State Management

### Attribute → State Flow

```javascript
// When attribute changes
attributeChangedCallback(name, oldVal, newVal) {
  switch(name) {
    case 'type':
      this._state.$type = newVal;
      break;
    case 'value':
      this._state.$value = this._parseValue(newVal);
      break;
    case 'description':
      this._state.$description = newVal;
      break;
    case 'name':
      this._state._name = newVal;
      break;
  }
  this._render();
}
```

### State → Event Flow

```javascript
// When user edits value
_onInput(e) {
  this._state.$value = e.target.value;
  this.dispatchEvent(new CustomEvent('input', {
    detail: { token: this._getToken(), name: this._state._name }
  }));
}

_onChange(e) {
  this._state.$value = e.target.value;
  this.dispatchEvent(new CustomEvent('change', {
    detail: { token: this._getToken(), name: this._state._name }
  }));
  this._render();
}

_getToken() {
  // Return clean DTCG-compliant object (without _name)
  const { _name, ...token } = this._state;
  return token;
}
```

---

## Type-to-CSS Mapping

For applying display styles:

```javascript
const typeToCSS = {
  'color': 'background-color',
  'font-family': 'font-family',
  'font-weight': 'font-weight',
  'dimension': 'font-size',
  'shadow': 'box-shadow',
  'border': 'border',
  'gradient': 'background-image',
  'stroke-style': 'border-style',
  'duration': null,      // no visual preview
  'cubic-bezier': null,  // no visual preview
  'number': null,        // no visual preview
  'semantic': null       // displays value as-is
};
```

---

## Testing Checklist

### Phase 1
- [ ] Component renders with all attributes
- [ ] State updates from attributes
- [ ] State updates from properties
- [ ] Popover opens on button click
- [ ] Text input shows current value
- [ ] `input` event fires during typing
- [ ] `change` event fires on blur/submit
- [ ] Event detail contains DTCG-compliant token object
- [ ] `display` attribute content renders correctly
- [ ] Color type shows color swatch
- [ ] Font-family type applies font to display text

### Future Phases
- [ ] All type-specific renderers work
- [ ] Type-specific editors work
- [ ] Token references display and resolve
- [ ] CSS functions supported
- [ ] JSON round-trip preserves all data

---

## Dependencies

- No external dependencies
- Native Custom Elements v1
- Native Popover API
- Constructable Stylesheets

---

## Browser Support

- Chrome 114+ (Popover API)
- Firefox 125+ (Popover API)
- Safari 17+ (Popover API)

---

## Future Considerations

### Token Groups (Storybook-like)

```html
<design-token-group src="tokens.json">
  <!-- Auto-generates sections with headlines -->
  <!-- Each token as <design-token> -->
</design-token-group>
```

### CSS Generation

```html
<design-token-css src="tokens.json">
  <!-- Generates and injects CSS custom properties -->
</design-token-css>
```

### Complex DTCG Values

When type-specific editors are added, they can output full DTCG objects:

```javascript
// Color with full DTCG structure
{
  "$type": "color",
  "$value": {
    "colorSpace": "oklch",
    "components": [0.7, 0.15, 250],
    "alpha": 1
  }
}
```

But simple CSS strings remain valid and are the default:

```javascript
// Color as simple CSS string
{
  "$type": "color",
  "$value": "#3366CC"
}

// Semantic token
{
  "$type": "semantic",
  "$value": "light-dark({color.light}, {color.dark})"
}
```
