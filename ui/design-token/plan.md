# Design Token Component Plan

## Overview

Create a `<design-token>` custom element that strictly follows the [W3C Design Tokens Community Group specification](https://www.designtokens.org/tr/third-editors-draft/). This component will serve as both a viewer and an editor for individual design tokens, supporting both "raw" (primitive) and "semantic" (composite/alias) types.

## Goals

1.  **Spec Compliance**: The internal state must mirror the JSON structure of the spec (`$value`, `$type`, `$description`, etc.).
2.  **Dual Mode**: Support **Display** (visualization) and **Edit** (modification) modes.
3.  **Semantic Support**: Handle token aliasing (`{group.token}`) and CSS functions (`light-dark()`, `clamp()`, etc.).
4.  **Extensibility**: specific renderers for different token types (Color, Typography, Dimension, etc.).

## Component Architecture

### Class Structure

```javascript
class DesignToken extends HTMLElement {
  #token = {}; // Internal state matching spec
  
  static get observedAttributes() {
    return ['name', 'type', 'value', 'description', 'render', 'property'];
  }
  
  // ... getters/setters
}
```

### State Management

The component will maintain a single source of truth in `#token`.
-   **Input**: Attributes or a `src` property (passing a JSON object) will populate `#token`.
-   **Output**: Changes in the editor will update `#token` and dispatch `change` / `input` events with the new state.

### Attributes & Properties

-   `src`: (Property only) Object. Sets the full token state.
-   `name`: String. The token name/key.
-   `type`: String. Corresponds to `$type` (e.g., `color`, `dimension`, `typography`).
-   `value`: String/JSON. Corresponds to `$value`.
-   `description`: String. Corresponds to `$description`.
-   `render`: String. Optional hint for visualization (e.g., `ratio`, `filter-function`). Matches the `render` key in JSON.
-   `property`: String. The CSS custom property name (e.g., `--my-color`). Defaults to `name` if unset. If `name` is unset, it is derived from the JSON structure.

## Rendering Strategy

The component will choose a renderer based on `render` (priority) or `$type` (fallback).

### 1. Header
Displays `name` and `$description`.

### 2. Visualization (The Trigger)
The main visual element will be a `<button>` that serves as a trigger for the editor popover.
-   **Structure**: `<button popovertarget="editor-popover">` containing the visual preview.
-   **Styling**: The button's appearance will adapt to the token type (e.g., a color swatch, a text preview, a shape).

### 3. Editor (The Popover)
A `<div id="editor-popover" popover>` that contains the editing interface.
-   **Behavior**: Opens when the trigger button is clicked.
-   **Content**: Dynamic form generation based on the token type.

-   **Raw Values**: Simple inputs (text, number, select).
-   **Composite Values**: Fieldsets for each property (e.g., Typography: Font Family, Size, Weight, etc.).
-   **Aliases/Semantic**:
    -   Input field that accepts `{...}` references.
    -   Support for CSS functions like `light-dark(lightRef, darkRef)`.
    -   **Extensions**: Support parsing `$extensions.cssFunc` (name + args) for complex semantic tokens.
    -   *Future*: Autocomplete for available tokens.

## Implementation Steps

### Phase 1: Core Structure
1.  Create `ui/design-token/index.js`.
2.  Implement `DesignToken` class with state management and attribute observation.
3.  Implement basic rendering loop (Header + generic value display).

### Phase 2: Type-Specific Renderers
Implement renderers for the most common types first:
1.  **Color**: Integrate logic from `ui/color-token`.
2.  **Dimension**: Value + Unit handling.
3.  **Typography**: Composite object handling.

### Phase 3: Semantic & Advanced Features
1.  **Alias Parsing**: Detect `{...}` syntax.
2.  **Function Support**: UI for `light-dark()`, `clamp()`.
3.  **Editor UI**: Polish the popover/editor experience.

### Phase 4: Integration
1.  Create a demo page using `ui/web-config-tokens/data/design-tokens-sample.json`.
2.  Verify two-way binding (updates reflect in JSON).

## References
-   `ui/color-token/index.js`: Reference for color handling and popover interaction.
-   `ui/web-config-tokens/index.js`: Reference for token traversal and list rendering.
-   `ui/web-config-tokens/data/design-tokens-sample.json`: Test data.
