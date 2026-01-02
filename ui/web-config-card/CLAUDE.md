# Web Config Card - Internal Architecture

## Overview

Web Config Card is a **web component for editing Content Card data models** with a visual schema-driven form interface. It dynamically generates form fields based on JSON schemas and supports nested objects, arrays, and form association.

**Component Type:** Web Component (Custom Element)

**Tag Name:** `web-config-card`

**Total LOC:** ~325 lines (index.js) + ~675 lines (schemas.js)

**Key architectural decisions:**
- **Schema-driven rendering**: Form fields generated from JSON schemas
- **Form associated**: Uses `ElementInternals` for native form integration
- **Auto type locking**: Type selector locks when valid type is provided
- **Event delegation**: Single form element handles all input/change/click events
- **Template literals**: HTML rendering via tagged template strings

## Architecture Overview

### Component Lifecycle

```
constructor()
  ↓
Create shadow DOM + internals
  ↓
Initialize state { type: '', data: {} }
  ↓
connectedCallback()
  ↓
Adopt shared styles
  ↓
Create bound event handlers
  ↓
render()
  ↓
attributeChangedCallback('value', ...)
  ↓
Parse JSON, set type, lock if valid
  ↓
render() + attach event listeners
  ↓
User edits form
  ↓
_handleInput/_handleChange/_handleClick
  ↓
_updateData() → _emitChange()
  ↓
Dispatch change/input events
```

### Data Flow

```
Input Sources:
  └─ value attribute → JSON.parse() → state.data + state.type

           ↓

Internal State (this.state):
  ├─ type: string           Selected card type (article, product, etc.)
  └─ data: object           Card data keyed by type

           ↓

Schema Lookup:
  └─ schemas[type] → properties → _renderField()

           ↓

Output:
  └─ this.value → JSON.stringify({ type, ...data })
```

## File Structure

```
web-config-card/
├── src/
│   ├── index.js        ~325 lines   Main web component
│   └── schemas.js      ~675 lines   Card type schemas
├── demo.html           ---          Demo with examples
├── index.html          ---          Basic usage page
├── package.json        ---          NPM package config
├── README.md           ---          User documentation
└── CLAUDE.md           ---          This file
```

## Component API

### Class Definition

**File:** [src/index.js](src/index.js)

**Lines 4-323:** `WebConfigCard extends HTMLElement`

**Registration:** Line 323: `customElements.define('web-config-card', WebConfigCard);`

### Static Properties (Lines 5-6)

- `formAssociated = true` - Enables form integration
- `observedAttributes = ['value']` - Watches value attribute

### Constructor (Lines 8-17)

Initializes shadow DOM, internals, and default state with empty type and data.

### Observed Attributes

| Attribute | Lines | Description |
|-----------|-------|-------------|
| `value` | 27-46 | JSON string with card data and type |

### Properties

#### `lockType` (Line 49-51)

Returns `true` if the type selector should be disabled.

#### `value` (Lines 53-67)

Getter returns JSON string of current state. Setter accepts string or object.

### Lifecycle Methods

| Method | Lines | Purpose |
|--------|-------|---------|
| `connectedCallback()` | 19-25 | Adopt styles, create handlers, initial render |
| `attributeChangedCallback()` | 27-46 | Parse value JSON, auto-lock type |

### Instance Methods

#### Event Handling

| Method | Lines | Purpose |
|--------|-------|---------|
| `_addEventListeners()` | 69-77 | Attach form event handlers |
| `_removeEventListeners()` | 79-86 | Detach form event handlers |
| `_handleInput(e)` | 88-94 | Handle text/number input changes |
| `_handleChange(e)` | 96-111 | Handle select/type changes |
| `_handleClick(e)` | 113-145 | Handle add/remove button clicks |

#### State Management

| Method | Lines | Purpose |
|--------|-------|---------|
| `_updateType(newType)` | 147-153 | Change card type, emit change |
| `_updateData(path, value)` | 155-166 | Update nested data by dot path |
| `_emitChange()` | 168-174 | Set form value, dispatch events |
| `_updateOutput()` | 176-182 | Update JSON preview |

#### Rendering

| Method | Lines | Purpose |
|--------|-------|---------|
| `_renderField(key, schema, value, path)` | 184-273 | Render schema field recursively |
| `render()` | 275-320 | Full component render |

### Events

#### `change` and `input` (Lines 172-173)

Dispatched with `detail` containing `{ type, ...data }`. Events bubble and are composed.

## Schema Structure

**File:** [src/schemas.js](src/schemas.js)

### Exports

- `cardTypes` - Array of 25 valid card type names
- `schemas` - Object mapping type names to schema definitions
- `commonSchema` - Shared schemas (media, actions, ribbon, sticker)

### Schema Format

Each card type has a schema with `title` and `properties`. Properties can be:
- `type: 'string'` with optional `format`, `enum`, `placeholder`
- `type: 'number'` with optional `placeholder`
- `type: 'object'` with nested `properties`
- `type: 'array'` with `items` schema and optional `itemTitle`

### Field Types

| Type | Schema | Renders As |
|------|--------|------------|
| Text | `{ type: 'string' }` | text input |
| Date | `{ type: 'string', format: 'date' }` | date input |
| Select | `{ type: 'string', enum: [...] }` | select dropdown |
| Number | `{ type: 'number' }` | number input |
| Object | `{ type: 'object', properties: {...} }` | Nested fields |
| Array | `{ type: 'array', items: {...} }` | Repeatable items |

## Field Rendering Logic (Lines 184-273)

### _renderField(key, schema, value, path)

Recursively renders form fields based on schema type:

1. **String fields** - Renders select for enums, date input for date format, text input otherwise
2. **Number fields** - Renders number input with type coercion
3. **Object fields** - Recursively renders all properties
4. **Array fields** - Renders items with Add/Remove buttons, Add only on last item

## Event Handling (Lines 69-145)

### Event Delegation Pattern

All events are handled on the form element using bound handlers created in `connectedCallback()`.

### Input Handler (Lines 88-94)

Handles text and number inputs, updates data via path, coerces numbers.

### Change Handler (Lines 96-111)

Handles type selector and array item inputs.

### Click Handler (Lines 113-145)

Handles add/remove buttons for array items. Re-renders after array mutations.

## Data Path System

### Path Format

Nested data uses dot-notation: `article.authors.0.name`

### _updateData(path, value) (Lines 155-166)

Traverses path, creates missing objects, sets final value.

## Type Locking Logic (Lines 27-46)

When value attribute contains valid JSON with a type in `cardTypes`, sets `_typeLocked = true`.
The `lockType` getter returns this flag, used to disable the type selector.

## Dependencies

### Imports (Lines 1-2)

| Import | Source | Purpose |
|--------|--------|---------|
| `adoptSharedStyles` | `@browser.style/web-config-shared` | Shared CSS |
| `schemas` | `./schemas.js` | Card type schemas |
| `cardTypes` | `./schemas.js` | Valid type names |

## State Structure

```javascript
{
  type: 'article',
  data: {
    type: 'article',
    article: {
      authors: [
        { name: 'John Smith', role: 'Senior Editor' }
      ]
    }
  }
}
```

## Gotchas & Edge Cases

### 1. Event Listener Stacking (Lines 69-86)

Must call `_removeEventListeners()` before re-adding in render to prevent stacking.

### 2. Bound Handler References (Lines 20-23)

Same reference needed for `removeEventListener` - created once in `connectedCallback()`.

### 3. Type Locking Logic (Lines 33-41)

Only locks if type exists AND is in `cardTypes` array.

### 4. Add Button Only on Last Item (Lines 223-225)

Prevents multiple Add buttons and accidental duplicates.

### 5. Array Index in Path (Lines 228, 234)

Array items use numeric index: `authors.0.name`

### 6. Empty Value Handling (Lines 33, 259-262)

Empty arrays show Add button, empty data initializes to `{}`.

### 7. Number Type Coercion (Line 83)

Number inputs return strings, must convert with `Number()`.

## Related Components

- [web-config-shared](../web-config-shared/) - Shared utilities and styles
- [content-card](../content-card/) - Component for rendering content cards

## Debugging Tips

1. **Form not submitting value?** Check `name` attribute is set on component
2. **Type selector not locking?** Verify JSON type is in `cardTypes` array
3. **Fields not updating?** Check `data-path` attribute matches state structure
4. **Multiple items added?** Ensure event listeners aren't stacking
5. **Array buttons missing?** Verify schema has `itemTitle` for display
6. **Number fields saving strings?** Check `_handleInput` type coercion logic
