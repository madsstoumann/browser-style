# Plan: Interactive JSON Editor for Web Config Tokens

## Goal
Enhance `ui/web-config-tokens/src/index.js` to support full CRUD operations (Create, Read, Update, Delete) and reordering on the hierarchical JSON structure. The implementation will leverage native HTML forms, `fieldset`, `details`, and `FormData` for simplicity and performance.

## Core Concepts

1.  **Form-Based State**: The DOM structure (nested `<details>` and `<fieldset>`) will represent the JSON state.
2.  **Path-Based Naming**: Input names will use dot notation (e.g., `colors.primary.$value`) to map directly to the JSON structure.
3.  **Event Delegation**: A single event listener on the root `<form>` will handle all interactions (add, delete, move, rename, edit).
4.  **Visual vs. Key**:
    *   **Key**: The property name in the JSON object (e.g., `primary`).
    *   **Visual Name**: The human-readable title stored in `$extensions.ui.title`.
    *   **Editing**: Renaming a group updates the JSON key. Editing the title updates the extension.

## Implementation Steps

### 1. Restructure Rendering (`render` method)
*   Wrap the entire output in a `<form id="token-editor">`.
*   Use `<fieldset>` to group children of a node.
*   Use `<details>` for collapsible sections.
*   **Header/Summary**:
    *   Input for the **Key** (property name).
    *   Input for the **Title** (optional, maps to `$extensions.ui.title`).
    *   **Action Buttons**:
        *   `[-]` Delete
        *   `[↑]` Move Up
        *   `[↓]` Move Down
        *   `[+]` Add Child (in the fieldset)

### 2. Event Handling (`handleInteraction`)
*   Attach `click` and `input` listeners to the form.
*   **Actions**:
    *   **Delete**: `e.target.closest('details').remove()`.
    *   **Move Up/Down**: `previousElementSibling.before(current)` / `nextElementSibling.after(current)`.
    *   **Add**: Insert a new template (details/summary/fieldset) into the current fieldset.
    *   **Rename Key**: Update the `name` attributes of all children to reflect the new path. *Crucial Step*.
    *   **Update Value**: Handled natively by `input` events.

### 3. Path Management & Renaming
*   When a key is renamed (e.g., `colors` -> `theme`), all nested inputs must have their `name` attributes updated (e.g., `colors.primary` -> `theme.primary`).
*   **Strategy**:
    *   Store the full path in `data-path` on the container (`details`).
    *   On rename, traverse all children and replace the prefix in their `name` and `data-path` attributes.

### 4. Serialization (`toJSON`)
*   Use `new FormData(form)` to get all values.
*   Reconstruct the JSON object from the dot-notation keys.
*   **Handling Arrays/Order**: Since `FormData` respects DOM order, the reconstructed JSON will automatically reflect the visual order (reordering works "for free").

### 5. Integration
*   Update `ui/web-config-tokens/src/index.js`.
*   Ensure existing `<design-token>` components still work within this new structure.
*   Add CSS for the new controls (buttons, inputs).

## UI/UX Details
*   **Buttons**: Minimalist icons or text.
*   **Inputs**: Auto-width or flex-grow to fit content.
*   **Feedback**: Visual indication when a path is changed.

## 6. Empty State & Type Selection
*   **Empty State**: If the JSON is empty or a section has no children, provide a prominent "Add Token Group" or "Add Token" button.
*   **Type Selection**: When adding a new token, allow the user to select the `$type` from a predefined list (based on Section 7 of `design.tokens.md`).
    *   **Allowed Types**: `color`, `dimension`, `fontFamily`, `fontWeight`, `fontStyle`, `duration`, `cubicBezier`, `number`, `border`, `shadow`, `gradient`, `transition`, `aspectRatio`, `cornerShape`, `custom-path`.
    *   **Default**: `color` (most common).
    *   **Implementation**: A `<select>` dropdown in the "Add" dialog/prompt.
*   **Group Creation**: When adding a new group, use an `<input list="group-types">` with a `<datalist>` containing common group names (e.g., `color`, `typography`, `spacing`). This allows users to pick standard names or type their own custom group names.

## Technical Challenges
*   **Renaming Keys**: This is the hardest part. Changing a parent key requires updating the `name` attribute of *every* descendant input to ensure `FormData` produces the correct structure.
    *   *Solution*: A recursive helper function `updatePaths(element, oldPath, newPath)` triggered on `change` of a key input.

## Next Steps
1.  Modify `render` to output the form structure.
2.  Implement the `toJSON` logic.
3.  Implement the event delegation logic.
4.  Add the "Rename Key" path updater.
