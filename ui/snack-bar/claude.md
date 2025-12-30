# SnackBar Component - Internal Architecture

## Overview

`<snack-bar>` is a lightweight notification system implemented as custom web elements following Material Design principles. It provides a flexible, accessible notification mechanism with support for different message types, positioning, actions, and both automatic and manual dismissal.

**Version:** 1.0.12

**Component Type:** Dual custom elements (SnackBar container + SnackItem notifications)

**Key Features:**
- Flexible positioning (9 positions via CSS)
- Four semantic types (info, success, warning, error)
- Auto-dismiss with configurable duration
- Action button support
- Manual and auto popover modes
- CSS custom properties for theming
- Light/dark mode support via `light-dark()`
- Shadow DOM encapsulation

**Key architectural decisions:**
- **Two-class architecture**: Container (SnackBar) + Items (SnackItem)
- **Popover API**: Native browser popover for overlay behavior
- **Shadow DOM per component**: Both classes use encapsulated styling
- **Adopted stylesheets**: CSS shared via CSSStyleSheet API
- **No dependencies**: Pure vanilla Web Components

## Architecture Overview

### Component Hierarchy

```
<snack-bar>                    // SnackBar class - Container
  #shadow-root
    <snack-item>               // SnackItem class - Notification
      #shadow-root
        <span part="message">
        <button part="action">
        <button part="close">
```

### Class Structure

**SnackBar (lines 174-237):**
- Manages popover container
- Handles item lifecycle
- Provides public API for adding notifications

**SnackItem (lines 111-172):**
- Represents single notification
- Handles display, actions, auto-dismissal
- Self-removes when dismissed

### Lifecycle Flow

```
SnackBar.connectedCallback()
  ↓
  Determine popover mode (auto/manual) (line 184)
  Set popover attribute (line 185)
  Export CSS parts (line 186)
  Setup beforetoggle listener (lines 188-191)
  Move existing snack-item children to shadow DOM (lines 194-199)
  ↓
add(message, part, duration, actionText)  [lines 202-226]
  ↓
  Create snack-item element
  Insert based on order attribute (lines 204-205)
  Call item.show() with config
  Open popover if needed (line 217)
  ↓
SnackItem.show()  [lines 143-171]
  ↓
  Set message and part attribute
  Create action button if needed (lines 150-155)
  Create close button if duration=0 or manual mode (lines 157-166)
  Set auto-dismiss timer if duration > 0 (lines 168-170)
  ↓
Auto-dismiss OR Close button click
  ↓
  Remove snack-item from DOM
  Close popover if empty (line 221)
```

## Data Flow

### Notification Creation

```
snackbar.add(message, part, duration, actionText)
  ↓
  Create snack-item element (line 203)
  ↓
  Check order attribute:
    'reverse' → insertBefore first child (line 204)
    default → appendChild (line 205)
  ↓
  item.show({...}) (lines 207-213)
  ↓
  Open popover if not open (line 217)
  ↓
  Return item reference for external manipulation (line 226)
```

### Auto-Dismiss Flow

```
show() with duration > 0
  ↓
  setTimeout (line 168-170)
  ↓
  After duration ms:
    this.remove() (line 169)
    Check if parent empty (line 220-221)
    Close popover if empty
```

### Manual Dismiss Flow

```
Close button click (lines 160-165)
  ↓
  Get parent snack-bar reference
  this.remove()
  ↓
  If parent shadow DOM empty:
    parent.hidePopover()
```

## Class Details

### SnackItem Class (lines 111-172)

**Private Properties:**

| Property | Type | Line | Purpose |
|----------|------|------|---------|
| `#elements` | Object | 112 | Shadow DOM references |
| `#timer` | Number | 113 | Auto-dismiss timeout ID |

**Constructor (lines 115-119):**
```javascript
constructor() {
  super();
  this.attachShadow({ mode: 'open' });
  this.shadowRoot.adoptedStyleSheets = [STYLES];
}
```

**connectedCallback (lines 121-137):**
- Parses attributes (message, duration, part, action, has-close)
- Determines if close button needed
- Calls show() with parsed config

**disconnectedCallback (lines 139-141):**
- Clears timer to prevent memory leaks

**show(config) (lines 143-171):**

```javascript
show({ message, part, duration = DEFAULT_DURATION, actionText, showClose } = {}) {
  // Set message (line 145-147)
  this.#elements.message.textContent = message || '';

  // Set part attribute (line 147)
  if (part) this.setAttribute('part', part);

  // Create action button if needed (lines 150-155)
  if (actionText) {
    const actionBtn = document.createElement('button');
    actionBtn.part = 'action';
    actionBtn.innerHTML = `<slot name="action">${actionText}</slot>`;
    this.shadowRoot.appendChild(actionBtn);
  }

  // Create close button if needed (lines 157-166)
  if (showClose) {
    const closeBtn = document.createElement('button');
    closeBtn.part = 'close';
    closeBtn.innerHTML = `<span part="icon"><slot name="icon">${SVG}</slot></span>`;
    closeBtn.addEventListener('click', () => {
      const parent = this.parentElement;
      this.remove();
      if (parent?.shadowRoot?.children.length === 0) {
        parent.hidePopover();
      }
    });
    this.shadowRoot.appendChild(closeBtn);
  }

  // Set auto-dismiss timer (lines 168-170)
  if (duration > 0) {
    this.#timer = setTimeout(() => this.remove(), duration);
  }
}
```

### SnackBar Class (lines 174-237)

**Private Properties:**

| Property | Type | Line | Purpose |
|----------|------|------|---------|
| `#isManual` | Boolean | 175 | Tracks popover mode |

**Constructor (lines 177-181):**
```javascript
constructor() {
  super();
  this.attachShadow({ mode: 'open' });
  this.shadowRoot.adoptedStyleSheets = [STYLES];
}
```

**connectedCallback (lines 183-200):**
```javascript
connectedCallback() {
  this.#isManual = this.getAttribute('popover') === 'manual';
  this.setAttribute('popover', this.#isManual ? 'manual' : 'auto');
  this.exportparts = 'action,close,icon,message';

  // Clear shadow DOM on popover close
  this.addEventListener('beforetoggle', event => {
    if (event.newState === 'closed') {
      this.shadowRoot.innerHTML = '';
    }
  });

  // Move existing children to shadow DOM
  [...this.querySelectorAll('snack-item')].forEach(item => {
    this.shadowRoot.appendChild(item);
    item.connectedCallback();
  });
}
```

**add(message, part, duration, actionText) (lines 202-226):**
```javascript
add(message, part, duration = DEFAULT_DURATION, actionText) {
  const item = document.createElement('snack-item');

  // Handle stacking order
  if (this.getAttribute('order') === 'reverse') {
    this.shadowRoot.insertBefore(item, this.shadowRoot.firstChild);
  } else {
    this.shadowRoot.appendChild(item);
  }

  // Configure item
  item.show({
    message,
    part,
    duration,
    actionText,
    showClose: duration === 0 || this.#isManual
  });

  // Open popover
  if (!this.matches(':popover-open')) {
    this.showPopover();
  }

  // Setup auto-close
  item.addEventListener('remove', () => {
    if (this.shadowRoot.children.length === 0) {
      this.hidePopover();
    }
  }, { once: true });

  return item;
}
```

**static register() (lines 228-233):**
```javascript
static register() {
  if (!customElements.get('snack-bar')) {
    customElements.define('snack-bar', SnackBar);
  }
  if (!customElements.get('snack-item')) {
    customElements.define('snack-item', SnackItem);
  }
}
```

## CSS Architecture

### Embedded Stylesheet (lines 3-109)

**CSS Custom Properties - SnackBar:**

| Property | Default | Purpose |
|----------|---------|---------|
| `--snack-bar-m` | 0.5rem | Margin from viewport |
| `--snack-bar-gap` | 0.5rem | Gap between items |
| `--snack-bar-mw` | 350px | Maximum width |

**CSS Custom Properties - SnackItem:**

| Property | Default | Purpose |
|----------|---------|---------|
| `--snack-item-bg` | light-dark(#18191B, #FFF) | Background |
| `--snack-item-c` | light-dark(#E2E3E8, #313132) | Text color |
| `--snack-item-ac` | light-dark(#7AB8FF, #3061EA) | Action color |
| `--snack-item-ff` | system-ui, sans-serif | Font family |
| `--snack-item-fs` | 1rem | Font size |
| `--snack-item-lh` | 1.4 | Line height |
| `--snack-item-p` | 1ch 1.75ch | Padding |
| `--snack-item-pie` | 1ch | Padding inline-end |
| `--snack-item-w` | auto | Width |
| `--snack-item-bdrs` | 0.33rem | Border radius |
| `--snack-item-bxsh` | 0 1px 3px... | Box shadow |
| `--snack-item-icon-size` | 1.5rem | Icon size |
| `--snack-item-close-align` | center | Close alignment |

### Positioning System (lines 12-32)

```css
/* Default: bottom-right */
:host {
  inset-block: auto var(--snack-bar-m);
  inset-inline: auto var(--snack-bar-m);
  justify-items: end;
}

/* Top positioning */
:host([position~="top"]) {
  inset-block: var(--snack-bar-m) auto;
}

/* Left positioning */
:host([position~="left"]) {
  inset-inline: var(--snack-bar-m) auto;
  justify-items: start;
}

/* Center positioning */
:host([position~="center"]) {
  inset-inline: 50%;
  justify-items: center;
  translate: -50% 0;
}

/* Full center */
:host([position="center center"]) {
  inset-block: 50%;
  translate: -50% -50%;
}
```

### Semantic Type Variants (lines 89-108)

```css
[part~="info"] {
  --snack-item-bg: #d1ecf1;
  --snack-item-c: #0c5460;
  --snack-item-ac: #007bff;
}

[part~="success"] {
  --snack-item-bg: #d4edda;
  --snack-item-c: #155724;
  --snack-item-ac: #28a745;
}

[part~="warning"] {
  --snack-item-bg: #fff3cd;
  --snack-item-c: #856404;
  --snack-item-ac: #cc5500;
}

[part~="error"] {
  --snack-item-bg: #f8d7da;
  --snack-item-c: #721c24;
  --snack-item-ac: #dc3545;
}
```

## Public API

### SnackBar Methods

| Method | Parameters | Returns | Purpose |
|--------|------------|---------|---------|
| `add(message, part, duration, actionText)` | String, String, Number, String | SnackItem | Add notification |
| `showPopover()` | None | void | Open container (inherited) |
| `hidePopover()` | None | void | Close container (inherited) |

### SnackItem Methods

| Method | Parameters | Returns | Purpose |
|--------|------------|---------|---------|
| `show(config)` | Object | void | Display message |

### Attributes

**SnackBar:**

| Attribute | Type | Default | Purpose |
|-----------|------|---------|---------|
| `popover` | String | 'auto' | 'auto' or 'manual' |
| `position` | String | '' | Space-separated positions |
| `order` | String | '' | 'reverse' for top stacking |

**SnackItem:**

| Attribute | Type | Default | Purpose |
|-----------|------|---------|---------|
| `message` | String | '' | Initial message |
| `duration` | Number | 3000 | Auto-dismiss time (ms) |
| `part` | String | '' | Type variant |
| `action` | String | '' | Action button text |
| `has-close` | Boolean | false | Show close button |

### CSS Parts

| Part | Element | Purpose |
|------|---------|---------|
| `action` | button | Action button |
| `close` | button | Close button |
| `icon` | span | Close icon container |
| `message` | span | Message text |

### Slots

| Slot | Element | Purpose |
|------|---------|---------|
| `action` | button content | Custom action text |
| `icon` | close button | Custom close icon |

## Integration Patterns

### Basic Auto-Dismissing Notification

```javascript
const snackbar = document.querySelector('snack-bar');
snackbar.add('Processing complete', 'success', 3000);
```

### Persistent Notification with Action

```javascript
const item = snackbar.add('Item deleted', 'warning', 0, 'Undo');
item.shadowRoot.querySelector('[part="action"]').onclick = () => {
  // Handle undo
  item.remove();
};
```

### Manual Popover Control

```html
<snack-bar popover="manual" position="top center"></snack-bar>
```

### Reverse Stacking Order

```html
<snack-bar order="reverse"></snack-bar>
```

New items appear at top of stack.

### Multiple Positions

```html
<snack-bar id="top" position="top center"></snack-bar>
<snack-bar id="bottom" position="bottom left"></snack-bar>
```

### Custom Styling

```css
snack-bar::part(custom-error) {
  --snack-item-bg: #f44336;
  --snack-item-c: #ffffff;
  --snack-item-ac: lightcoral;
  --snack-item-bdrs: 5rem;
  --snack-item-fs: small;
}
```

```javascript
snackbar.add('Error!', 'custom-error', 0);
```

### Pre-populated Notifications

```html
<snack-bar popover="manual">
  <snack-item message="Info message" part="info" duration="0"></snack-item>
  <snack-item message="Success!" part="success" duration="0"></snack-item>
</snack-bar>
```

## Deep Dives

### Popover Mode Behavior

**Auto mode (default):**
- Click outside dismisses popover
- Escape key dismisses popover
- Close button only shown when duration=0

**Manual mode:**
- Requires explicit close (button or API)
- Close button always shown
- User must actively dismiss

### Stacking Order Logic (lines 204-205)

```javascript
if (this.getAttribute('order') === 'reverse') {
  this.shadowRoot.insertBefore(item, this.shadowRoot.firstChild);
} else {
  this.shadowRoot.appendChild(item);
}
```

- Default: New items added at bottom (appendChild)
- Reverse: New items added at top (insertBefore)

### Close Button Visibility Logic (line 127)

```javascript
const showClose = duration === 0 ||
  this.closest('snack-bar')?.getAttribute('popover') === 'manual';
```

Close button shown when:
1. `duration === 0` (persistent notification)
2. Parent snack-bar is in manual mode

### Auto-Close on Empty (lines 220-221)

```javascript
item.addEventListener('remove', () => {
  if (this.shadowRoot.children.length === 0) {
    this.hidePopover();
  }
}, { once: true });
```

When last item removed, popover automatically closes.

## Gotchas and Edge Cases

### 1. Duration = 0 Behavior (lines 126-127)

**Issue:** `duration === 0` treated as persistent.

**Impact:** Auto-shows close button, never auto-dismisses.

### 2. Popover Auto-Close (line 221)

**Issue:** Only closes when shadow DOM becomes empty.

**Impact:** Items removed synchronously can cause race conditions.

### 3. Parent Element Dependency (line 163)

**Issue:** Close button removal checks `parentElement`.

**Code:**
```javascript
const parent = this.parentElement;
```

**Impact:** Orphaned items won't attempt popover control.

### 4. Custom Element Registration (lines 229-232)

**Issue:** Uses `customElements.get()` to prevent double registration.

**Impact:** Safe for multiple imports.

### 5. Part Attribute Behavior (line 147)

**Issue:** Only set if provided, never cleared.

**Impact:** Multiple part names can be space-separated.

### 6. Timer Cleanup (line 140)

**Issue:** Timer cleared on disconnection.

**Code:**
```javascript
disconnectedCallback() {
  clearTimeout(this.#timer);
}
```

**Impact:** Prevents memory leaks when items removed early.

### 7. HTML Content vs Attributes (lines 194-199)

**Issue:** Initial HTML children moved to shadow DOM.

**Impact:** Subsequent additions must use JavaScript API.

### 8. Position Attribute Syntax (lines 17-32)

**Issue:** Uses word-boundary selectors.

**Code:**
```css
[position~="top"]
```

**Impact:** Supports space-separated values like "top center".

### 9. Light Dismiss Behavior

**Issue:** Auto mode dismisses on outside click or Escape.

**Impact:** May surprise users expecting notifications to persist.

### 10. Action Slot Target (line 152)

**Issue:** Slot wraps text content inside button.

**Impact:** External handlers must query shadowRoot for button.

## Dependencies

### No External Dependencies

- Pure vanilla Web Components
- Uses only standard browser APIs

### Browser APIs Used

| API | Purpose |
|-----|---------|
| Popover API | `showPopover()`, `hidePopover()`, `:popover-open` |
| Shadow DOM | `attachShadow()`, `adoptedStyleSheets` |
| Custom Elements | `HTMLElement` extension, lifecycle callbacks |
| CSSStyleSheet | Constructable stylesheets |

## Constants

| Constant | Value | Line | Purpose |
|----------|-------|------|---------|
| `DEFAULT_DURATION` | 3000 | 1 | Auto-dismiss time (ms) |

## File Summary

| File | Lines | Purpose |
|------|-------|---------|
| index.js | 237 | Both component classes + styling |
| index.html | ~300 | Demo page with examples |
| readme.md | ~200 | User documentation |
| package.json | ~50 | Package metadata |

## Summary Table

| Aspect | Details |
|--------|---------|
| **Total Lines** | 237 (index.js) |
| **Classes** | 2 (SnackBar, SnackItem) |
| **Public Methods** | 2 (add, show) |
| **CSS Custom Properties** | 14+ |
| **Exported Parts** | 4 (action, close, icon, message) |
| **Attributes** | 6 |
| **Shadow DOM Slots** | 2 (action, icon) |
| **Type Variants** | 4 (info, success, warning, error) |
| **Position Options** | 9 (3x3 grid + center) |
| **Dependencies** | None |
