# BarcodeScanner Component - Internal Architecture

## Overview

`<barcode-scanner>` is a Web Component built on the FormElement base class that provides both automatic barcode scanner support and manual barcode entry functionality. It emits custom events when barcodes are scanned and integrates seamlessly with HTML forms.

**Version:** 1.0.2 (index.js), 1.0.13 (package.json)

**Component Type:** Form-associated custom element extending FormElement

**Key Features:**
- Automatic scanner detection via keystroke timing
- Manual entry fallback with Enter key
- Configurable barcode length validation
- Debug mode with scan history logging
- Form integration via ElementInternals
- Auto-start option
- Visual feedback with three icon states
- Popover-based input interface

**Key architectural decisions:**
- **FormElement inheritance**: Provides form association, lifecycle hooks, and utilities
- **Keystroke timing heuristic**: Distinguishes scanner (<50ms) from manual typing
- **Popover API**: Uses native browser popover for input overlay
- **Private state object**: Encapsulates all component state
- **CSS anchor positioning**: Modern positioning for popover alignment

## Architecture Overview

### Component Lifecycle

```
constructor()
  ↓
  super() → FormElement initialization
  Parse attributes into #state (lines 39-47)
    - auto: Boolean
    - clear: Integer (ms)
    - debug: Boolean
    - maxLength: Integer (min 8)
    - minLength: Integer (1 to maxLength)
    - showInput: Boolean
    - terminateChar: String
    - uid: Generated UUID
  ↓
initializeComponent()  [lines 50-55]
  ↓
  Create shadow DOM with template (line 51)
  Cache element references (line 52)
  Add event listeners (line 53)
  Open popover if auto attribute (line 54)
  ↓
connectedCallback()
  ↓
  Component ready for scanning
  ↓
Input events
  ↓
  #handleInput() processes keystrokes
  Dispatches 'bs:entry' on valid barcode
  ↓
disconnectedCallback()
  ↓
  Cleanup
```

### State Management

**Private State Object** (lines 23-36):

```javascript
#state = {
  auto: false,              // Auto-start scanning
  clear: 2000,              // Display clear duration (ms)
  clearTimeout: null,       // Timeout reference
  debug: false,             // Debug mode flag
  debugData: [],            // Scan history array
  icons: {},                // Icon DOM references
  lastKeyTime: 0,           // Timestamp of last keystroke
  maxLength: 14,            // Max barcode digits
  minLength: 8,             // Min barcode digits
  showInput: false,         // Show input field flag
  terminateChar: '\n',      // Scanner termination character
  uid: ''                   // Unique component ID
}
```

## Data Flow Pipeline

### Scanner Detection Flow

```
Keystroke on input
  ↓
#handleInput(event)  [lines 113-146]
  ↓
  Calculate time since last keystroke (line 119)
  const timeDiff = currentTime - this.#state.lastKeyTime;
  ↓
  Determine if scanner (timeDiff < 50ms) (line 120)
  const isScanner = timeDiff < 50;
  ↓
  Update lastKeyTime (line 121)
  ↓
  Show scanning animation (line 123)
  ↓
  Check for termination:
    - terminateChar match (line 125)
    - Enter key press (line 126)
  ↓
  If terminated:
    Get numeric value (line 127)
    Validate length (line 128)
    ↓
    If valid:
      Convert to string (line 129)
      Dispatch 'bs:entry' event (line 130)
      ↓
      If debug mode:
        Store scan data (lines 131-138)
        Output to console (line 139)
      ↓
      Update placeholder with barcode (line 140)
      Dispatch 'bs:clear' event (line 141)
      Clear input (line 142)
  ↓
  Prevent default if Enter (line 145)
```

### Icon State Flow

```
#setIcons(scanning, isOpen)  [lines 97-106]
  ↓
  For each icon (on, off, scanning):
    'on': Hidden if scanning OR popover open
    'off': Hidden if popover closed
    'scanning': Hidden if not scanning
  ↓
  Toggle '--scanning' class for animation
```

## Class Details

### Static Properties

| Property | Type | Line | Purpose |
|----------|------|------|---------|
| `ICONS` | Object | 13-17 | SVG path definitions |

**Icon Definitions:**
- `on`: Barcode icon (inactive state)
- `off`: Error/stop icon (active but idle)
- `scanning`: Rotating icon (active scanning)

### Getters

| Getter | Line | Returns | Purpose |
|--------|------|---------|---------|
| `basePath` | 19-21 | String | Component's URL base path |

### Constructor (lines 38-48)

```javascript
constructor() {
  super();
  this.#state.auto = this.hasAttribute('auto');
  this.#state.clear = parseInt(this.getAttribute('clear'), 10) || 2000;
  this.#state.debug = this.hasAttribute('debug');
  this.#state.maxLength = Math.max(8, parseInt(this.getAttribute('maxlength'), 10) || 14);
  this.#state.minLength = Math.max(1, Math.min(
    parseInt(this.getAttribute('minlength'), 10) || 8,
    this.#state.maxLength
  ));
  this.#state.showInput = this.hasAttribute('input');
  this.#state.terminateChar = this.getAttribute('terminate-char') || '\n';
  this.#state.uid = this.uuid();
}
```

### Public Methods

| Method | Parameters | Returns | Purpose |
|--------|------------|---------|---------|
| `initializeComponent()` | None | void | Initialize shadow DOM |
| `formReset()` | None | void | Handle form reset |

### Private Methods

| Method | Line | Parameters | Returns | Purpose |
|--------|------|------------|---------|---------|
| `#handleToggle(e)` | 90-95 | Event | void | Manage popover state |
| `#setIcons(scanning, isOpen)` | 97-106 | Boolean, Boolean | void | Update icon visibility |
| `#checkValidRange(value, min, max)` | 108-111 | any, Number, Number | Boolean | Validate length |
| `#handleInput(event)` | 113-146 | KeyboardEvent | void | Process input |
| `#outputDebug()` | 148-151 | None | void | Log debug table |
| `#handleClear()` | 153-158 | None | void | Clear scanning state |

### #handleInput Deep Dive (lines 113-146)

```javascript
#handleInput(event) {
  const currentTime = performance.now();
  const input = event.target;
  const value = input.valueAsNumber;

  // Calculate keystroke interval
  const timeDiff = currentTime - this.#state.lastKeyTime;

  // Heuristic: <50ms = scanner, >=50ms = manual
  const isScanner = timeDiff < 50;

  // Update last keystroke time
  this.#state.lastKeyTime = currentTime;

  // Show scanning animation
  this.#setIcons(true, true);

  // Check for termination
  if (event.key === this.#state.terminateChar || event.key === 'Enter') {
    // Validate barcode length
    if (!isNaN(value) && this.#checkValidRange(value)) {
      const strValue = value.toString();

      // Dispatch entry event
      this.dispatchEvent(new CustomEvent('bs:entry', {
        detail: { value: strValue }
      }));

      // Debug logging
      if (this.#state.debug) {
        this.#state.debugData.unshift({
          timestamp: new Date().toISOString(),
          barcode: strValue,
          source: isScanner ? 'scanner' : 'manual'
        });
        this.#outputDebug();
      }

      // Visual feedback
      input.placeholder = strValue;
      this.dispatchEvent(new CustomEvent('bs:clear'));
      input.value = '';
    }

    event.preventDefault();
  }
}
```

## DOM Structure

### Shadow DOM Template (lines 75-88)

```html
<button type="button" popovertarget="popover-{uid}">
  <svg part="on" viewBox="0 0 24 24">
    <!-- Barcode icon paths -->
  </svg>
  <svg part="off" viewBox="0 0 24 24">
    <!-- Error icon paths -->
  </svg>
  <svg part="scanning" viewBox="0 0 24 24">
    <!-- Rotating icon paths -->
  </svg>
</button>
<label id="popover-{uid}" popover>
  <input
    autofocus
    data-sr                          <!-- Only if !showInput -->
    placeholder="0123456789123"
    type="number">
</label>
```

### Element References (lines 63-73)

```javascript
addRefs() {
  const root = this.root;
  this.button = root.querySelector('button');
  this.input = root.querySelector('input');
  this.toggle = root.querySelector('label');
  this.#state.icons = {
    on: root.querySelector('[part=on]'),
    off: root.querySelector('[part=off]'),
    scanning: root.querySelector('[part=scanning]')
  };
}
```

### CSS Parts for External Styling

| Part | Element | Purpose |
|------|---------|---------|
| `on` | svg | Icon when scanner inactive |
| `off` | svg | Icon when scanner active/idle |
| `scanning` | svg | Icon during active scanning |

## Event System

### Custom Events Dispatched

| Event | Detail | Trigger | Line |
|-------|--------|---------|------|
| `bs:entry` | `{ value: string }` | Valid barcode scanned | 130 |
| `bs:clear` | None | Barcode processed | 141 |

### DOM Events Handled

| Event | Target | Handler | Purpose | Line |
|-------|--------|---------|---------|------|
| `beforetoggle` | toggle (popover) | #handleToggle | Manage state | 58 |
| `keydown` | input | #handleInput | Process barcode | 59 |

## Attributes Reference

### Configuration

| Attribute | Type | Default | Purpose |
|-----------|------|---------|---------|
| `auto` | Boolean | false | Auto-start scanning |
| `clear` | Number | 2000 | Display clear duration (ms) |
| `debug` | Boolean | false | Enable debug logging |
| `input` | Boolean | false | Show visible input |
| `maxlength` | Number | 14 | Max barcode digits (min 8) |
| `minlength` | Number | 8 | Min barcode digits |
| `terminate-char` | String | '\n' | Scanner termination char |
| `name` | String | - | Form element name |
| `styles` | Boolean | false | Load component CSS |

### Attribute Validation

**maxLength** (line 43):
```javascript
Math.max(8, parseInt(this.getAttribute('maxlength'), 10) || 14)
```
- Enforced minimum of 8

**minLength** (line 44):
```javascript
Math.max(1, Math.min(
  parseInt(this.getAttribute('minlength'), 10) || 8,
  this.#state.maxLength
))
```
- Constrained between 1 and maxLength

## CSS Styling

### Key CSS Rules (index.css)

**Host Positioning (lines 13-18):**
```css
:host {
  --bg: light-dark(#EEE, #666);
  position: fixed;
  inset-block-end: 1rem;
  inset-inline-end: 1rem;
  z-index: 1000;
}
```

**Button Styling (lines 19-30):**
```css
:host button {
  aspect-ratio: 1;
  background: var(--bg);
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  display: grid;
  padding: 0.75rem;
  place-content: center;
}

:host button.--open {
  background: green;
}
```

**Input Styling (lines 31-46):**
```css
:host input {
  background: var(--bg);
  border: 0;
  caret-color: transparent;
  font-family: monospace;
  font-size: 1.5rem;
  padding: 0.5rem 1rem;
  position: fixed;
  inset-block-end: 1rem;
  inset-inline-end: 4rem;
  width: 15ch;
}
```

**Icon Animation (lines 61-66):**
```css
:host svg.--scanning {
  animation: rotate 1.5s linear infinite;
}

@keyframes rotate {
  to { transform: rotate(360deg); }
}
```

**Screen Reader Hidden (line 84 in template):**
```css
[data-sr] {
  /* Visually hidden but accessible */
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: clip;
  position: absolute;
  width: 1px;
}
```

## Integration Patterns

### Basic Usage

```html
<barcode-scanner></barcode-scanner>

<script>
document.querySelector('barcode-scanner')
  .addEventListener('bs:entry', (e) => {
    console.log('Scanned:', e.detail.value);
  });
</script>
```

### With Auto-Start and Debug

```html
<barcode-scanner auto debug input></barcode-scanner>
```

### Form Integration

```html
<form>
  <barcode-scanner
    name="scanner"
    minlength="12"
    maxlength="14">
  </barcode-scanner>
</form>

<script>
const form = document.querySelector('form');
form.addEventListener('submit', (e) => {
  console.log(form.elements.scanner.value);
});
</script>
```

### Custom Terminate Character

```html
<barcode-scanner terminate-char="\t"></barcode-scanner>
```

### Event Handling

```javascript
const scanner = document.querySelector('barcode-scanner');

scanner.addEventListener('bs:entry', (event) => {
  console.log('Barcode:', event.detail.value);
  // Process barcode
});

scanner.addEventListener('bs:clear', () => {
  console.log('Display cleared');
});
```

## Deep Dives

### Scanner vs Manual Detection (line 119-120)

```javascript
const timeDiff = currentTime - this.#state.lastKeyTime;
const isScanner = timeDiff < 50;
```

**Heuristic explanation:**
- Barcode scanners simulate rapid keyboard input
- Characters arrive in <50ms intervals
- Human typing is typically >100ms between keystrokes
- 50ms threshold provides reliable differentiation

**Edge cases:**
- Very fast typists could trigger scanner detection
- Slow scanners might be detected as manual
- Enter key always forces entry (manual override)

### Validation Logic (lines 108-111, 128)

```javascript
#checkValidRange(value, min = this.#state.minLength, max = this.#state.maxLength) {
  const length = value.toString().length || 0;
  return length >= min && length <= max;
}
```

**Validation flow:**
1. Convert value to string to count digits
2. Check length against min/max bounds
3. Also check `!isNaN(value)` before validation (line 128)

### Icon State Machine (lines 97-106)

```javascript
#setIcons(scanning = false, isOpen = true) {
  Object.entries(this.#state.icons).forEach(([key, icon]) => {
    icon.toggleAttribute('hidden',
      key === 'on' ? (scanning || !isOpen) :
      key === 'off' ? isOpen :
      !scanning
    );
  });
  this.#state.icons.scanning?.classList.toggle('--scanning', scanning);
}
```

**State transitions:**
| State | `on` | `off` | `scanning` |
|-------|------|-------|------------|
| Closed | visible | hidden | hidden |
| Open, idle | hidden | visible | hidden |
| Scanning | hidden | hidden | visible + rotating |

### Debug Data Structure (lines 131-138)

```javascript
this.#state.debugData.unshift({
  timestamp: new Date().toISOString(),
  barcode: strValue,
  source: isScanner ? 'scanner' : 'manual'
});
```

**Structure:**
- Array with newest entries first (unshift)
- ISO timestamp for sorting
- Source identification for troubleshooting

**Output:**
```javascript
#outputDebug() {
  console.clear();
  console.table(this.#state.debugData);
}
```

## Gotchas and Edge Cases

### 1. Fast Typer Detection (line 119)

**Issue:** 50ms threshold may incorrectly identify fast typing as scanner.

**Mitigation:** Enter key always works for manual entry (line 126).

### 2. NaN Handling (line 128)

**Issue:** `input.valueAsNumber` returns NaN for invalid input.

**Code:**
```javascript
if (!isNaN(value) && this.#checkValidRange(value)) {
```

**Impact:** Invalid values never trigger events.

### 3. Debug Data Growth (line 132)

**Issue:** Array grows unbounded with `unshift`.

**Impact:** Memory leak in long-running sessions with debug enabled.

**Recommendation:** Add max length check or periodic cleanup.

### 4. Terminate Character Detection (lines 125-126)

**Issue:** Both `terminateChar` AND Enter trigger entry.

**Impact:** If scanner sends Enter AND custom char, could double-trigger.

**Code:**
```javascript
if (event.key === this.#state.terminateChar || event.key === 'Enter')
```

### 5. Input Type="number" (line 86)

**Issue:** Number input handles leading zeros differently.

**Impact:** Barcode "0123456789" becomes 123456789 internally.

**Workaround:** Placeholder preserves original string (line 140).

### 6. RAF + setTimeout in Clear (lines 156-157)

**Issue:** Nested async for icon state change.

```javascript
requestAnimationFrame(() => setTimeout(() => this.#setIcons(false, true), 50));
```

**Reason:** Prevents visual glitch during popover closing.

### 7. Popover Autofocus (line 84)

**Issue:** Input always autofocus when popover opens.

**Impact:** Could cause unexpected focus jumps for keyboard users.

### 8. No Visual Validation Feedback

**Issue:** Only shows feedback when `input` attribute present.

**Impact:** Hidden mode provides no UI feedback for invalid barcodes.

### 9. Form Association (inherited)

**Issue:** Requires ElementInternals for form submission.

**Impact:** Older browsers without support won't include value in FormData.

### 10. Multiple Icon Toggles (line 123)

**Issue:** Icons update on every keydown, even for invalid input.

**Impact:** Scanning animation shows for any key press.

## Dependencies

### External Package

```json
{
  "dependencies": {
    "@browser.style/common": "^1.0.1"
  }
}
```

### Inherited from FormElement

| Method | Purpose |
|--------|---------|
| `uuid()` | Generate unique ID |
| `mount()` | Manual initialization |
| `register()` | Register custom element |
| `icon()` | Generate SVG from paths |

### Browser APIs Used

| API | Purpose |
|-----|---------|
| `ElementInternals` | Form association |
| `Popover API` | `showPopover()`, `beforetoggle` event |
| `performance.now()` | High-precision timing |
| `CustomEvent` | Event dispatching |
| `ShadowDOM` | Encapsulation |
| `crypto.getRandomValues()` | UUID generation |

## Browser Compatibility

**Required APIs:**
- `customElements.define()` - Web Components v1
- `attachShadow()` - Shadow DOM
- `attachInternals()` - ElementInternals API
- `popover` attribute - HTML Popover API (Chrome 114+, Safari 17+)
- `light-dark()` - CSS light/dark function (Chrome 123+)
- `crypto.getRandomValues()` - Crypto API

## File Summary

| File | Lines | Purpose |
|------|-------|---------|
| index.js | 168 | Main component class |
| index.css | 66 | Component styling |
| index.html | ~100 | Demo page |
| package.json | ~50 | Package metadata |
| readme.md | ~100 | User documentation |

## Summary Table

| Aspect | Details |
|--------|---------|
| **Type** | Form-associated Web Component |
| **Base Class** | FormElement (extends HTMLElement) |
| **Shadow DOM** | Yes (open mode) |
| **Form Associated** | Yes (automatic) |
| **Custom Events** | `bs:entry`, `bs:clear` |
| **CSS Parts** | `on`, `off`, `scanning` |
| **Attributes** | 8 |
| **Private Methods** | 6 |
| **Dependencies** | @browser.style/common |
| **Lines of Code** | 168 (JS), 66 (CSS) |
