# Async Loader Component - Internal Architecture

## Overview

`<async-loader>` is a custom element that displays a loading spinner overlay with timeout handling, error display, and success/failure states. It operates in two modes: as a full-screen popover modal or as an inline element within other components.

**Version:** 1.0.3 (package.json)

**Component Type:** Autonomous custom element extending HTMLElement

**Key Characteristics:**
- Pure vanilla JavaScript, no dependencies
- Uses Shadow DOM with Constructable Stylesheets
- Native Popover API for modal display (non-inline mode)
- Event-driven control (start/stop via CustomEvents)
- Built-in timeout handling with configurable error messages
- Two display modes: popover (full-screen) and inline
- Customizable success/failure states via slots

**Use Cases:**
- Full-page loading overlays during async operations
- Inline loading indicators within buttons or cards
- API request progress indication
- Form submission feedback
- File upload progress

## Architecture Overview

### Component Structure

```
<async-loader>                              ← Host element (popover or inline)
  #shadow-root
    ├── <button part="close">               ← Close button (hidden by default)
    │     └── <svg part="icon">             ← X icon
    ├── <div part="spinner">                ← Spinning loader (conic gradient mask)
    ├── <div part="status-success" hidden>  ← Success state container
    │     └── <slot name="success">         ← Default: checkmark icon
    ├── <div part="status-failed" hidden>   ← Failed state container
    │     └── <slot name="failed">          ← Default: warning icon
    └── <output part="error" hidden>        ← Error message display
```

### Display Modes

**Popover Mode (default):**
- Full-screen overlay (100dvw × 100dvh)
- Uses native Popover API (`popover="manual"`)
- 3-row grid layout: close button, spinner, error message
- Semi-transparent background

**Inline Mode (`inline` attribute):**
- Compact, embeddable within other elements
- No popover, uses `hidden` attribute for visibility
- Smaller spinner (1rem vs 3.5rem)
- Shows success/failed states instead of just hiding
- No close button or error message display

### Lifecycle Flow

```
constructor()
  ↓
  attachShadow({ mode: 'open' })
  adoptedStyleSheets = [styles]
  ↓
connectedCallback()
  ↓
  Inject HTML template (close, spinner, status containers, error)
  ↓
  Cache DOM references into #elements object:
    close, error, spinner, status.failed, status.success
  ↓
  Set initial visibility:
    - Inline: hidden = true
    - Popover: setAttribute('popover', 'manual')
  ↓
  Attach event listeners:
    - 'loader:start' → startLoading()
    - 'loader:stop' → stopLoading()
    - close button click → stopLoading()
```

## State Machine

```
                    ┌─────────────────────────────────────┐
                    │                                     │
                    ▼                                     │
    ┌──────────┐  loader:start  ┌──────────┐            │
    │   IDLE   │ ─────────────► │ LOADING  │            │
    └──────────┘                └──────────┘            │
         ▲                           │                  │
         │                           │                  │
         │         ┌─────────────────┼──────────────┐   │
         │         │                 │              │   │
         │         ▼                 ▼              ▼   │
         │   ┌──────────┐     ┌──────────┐    ┌────────┐│
         │   │  ERROR   │     │ SUCCESS  │    │TIMEOUT ││
         │   └──────────┘     └──────────┘    └────────┘│
         │         │                 │              │   │
         │         │  loader:stop    │              │   │
         └─────────┴─────────────────┴──────────────┴───┘
```

### State Transitions

| From | To | Trigger | Action |
|------|-----|---------|--------|
| IDLE | LOADING | `loader:start` event | Show spinner, start timeout timer |
| LOADING | SUCCESS | `loader:stop` event | Hide spinner, show success (inline only) |
| LOADING | ERROR | `handleError()` call | Show error message, pause spinner |
| LOADING | TIMEOUT | Timeout expires | Call `handleError()` with timeout message |
| ERROR | IDLE | Close button click | Hide popover/element |
| SUCCESS | IDLE | (automatic for popover) | Hide popover |

## Event System

### Input Events (Triggers)

| Event | Description | Usage |
|-------|-------------|-------|
| `loader:start` | Start the loading state | `element.dispatchEvent(new CustomEvent('loader:start'))` |
| `loader:stop` | Stop loading (success) | `element.dispatchEvent(new CustomEvent('loader:stop'))` |

### Output Events (Notifications)

| Event | Bubbles | Detail | Description |
|-------|---------|--------|-------------|
| `loader:started` | Yes | None | Fired after loading begins |
| `loader:stopped` | Yes | None | Fired after loading ends |
| `loader:error` | Yes | `{ error: Error }` | Fired when error occurs |

### Event Flow Example

```javascript
// Start loading
loader.dispatchEvent(new CustomEvent('loader:start'));
// → Shows popover/inline spinner
// → Fires 'loader:started'
// → Starts timeout timer (if configured)

// Success path
loader.dispatchEvent(new CustomEvent('loader:stop'));
// → Hides popover or shows success state (inline)
// → Fires 'loader:stopped'

// Error path
loader.handleError(new Error('Network failed'));
// → Shows error message
// → Pauses spinner animation
// → Shows close button
// → Fires 'loader:error' with { error }
```

## Key Methods

### startLoading()

```javascript
startLoading = () => {
  if (this.#loading) return;              // Prevent double-start

  // Show the loader
  if (this.isInline) {
    this.hidden = false;
  } else {
    this.showPopover();
  }

  this.#loading = true;
  this.#elements.close.hidden = !this.hasAttribute('allowclose');
  this.#elements.error.hidden = true;
  this.#elements.error.part = `error ${this.getAttribute('errortype') || ''}`;
  this.#elements.spinner.style.animationPlayState = 'running';

  // Start timeout timer
  const timeout = this.getAttribute('timeout');
  if (timeout) {
    this.#timeoutId = setTimeout(() => this.handleTimeout(), parseInt(timeout));
  }

  this.dispatchEvent(new CustomEvent('loader:started', { bubbles: true }));
};
```

**Key behaviors:**
- Guards against double-start with `#loading` flag
- Dynamically adds `errortype` to error element's part list for custom styling
- Only starts timeout if attribute is set

### stopLoading(hasError)

```javascript
stopLoading = (hasError = false) => {
  if (hasError instanceof Event) hasError = false;  // Handle event listener calls

  this.#timeoutId && clearTimeout(this.#timeoutId);
  this.#timeoutId = null;
  this.#loading = false;

  if (this.isInline) {
    this.#elements.spinner.hidden = true;
    this.#elements.status.success.hidden = hasError;
    this.#elements.status.failed.hidden = !hasError;
  } else {
    this.togglePopover(false);
  }

  this.dispatchEvent(new CustomEvent('loader:stopped', { bubbles: true }));
};
```

**Key behaviors:**
- Handles being called directly or as event listener (Event check)
- Clears any pending timeout
- Inline mode shows success/failed state; popover mode just hides

### handleError(error)

```javascript
handleError = (error) => {
  if (this.isInline) {
    this.stopLoading(true);  // Show failed state
  }
  this.#elements.close.hidden = false;
  this.#elements.error.hidden = false;
  this.#elements.error.value = error.message;
  this.#loading = false;
  this.#elements.spinner.style.animationPlayState = 'paused';

  this.dispatchEvent(new CustomEvent('loader:error', {
    bubbles: true,
    detail: { error }
  }));
};
```

**Key behaviors:**
- Inline mode transitions to failed state
- Popover mode shows error message but keeps spinner visible (paused)
- Always shows close button on error
- Uses `<output>` element's `value` property for error message

## Spinner Animation

The spinner uses a CSS conic gradient mask technique:

```css
[part="spinner"] {
  animation: spin 1s linear infinite;
  background: var(--async-loader-spinner-accent);
  border-radius: 50%;

  /* Creates the "cut out" ring effect */
  mask:
    conic-gradient(#0000 10%, #000),     /* Partial transparency */
    linear-gradient(#000 0 0) content-box; /* Solid center */
  mask-composite: subtract;               /* Subtract center from ring */

  padding: calc(var(--async-loader-spinner-sz) / 10);  /* Ring thickness */
}

@keyframes spin {
  to { rotate: 1turn; }
}
```

**How it works:**
1. `conic-gradient(#0000 10%, #000)` creates a gradient that's transparent for 10% then solid
2. `linear-gradient` with `content-box` creates a solid center (inside padding)
3. `mask-composite: subtract` removes the center, leaving a ring
4. The 10% transparent section creates the "gap" in the spinner
5. `rotate: 1turn` spins it around

## Attributes Reference

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `allowclose` | Boolean | `false` | Shows close button when present |
| `errormsg` | String | `"Operation timed out"` | Custom message for timeout errors |
| `errortype` | String | `""` | Added to error element's part list for custom styling |
| `inline` | Boolean | `false` | Compact inline mode instead of popover |
| `popover` | String | `"manual"` | Popover type (auto-set if not inline) |
| `timeout` | Number | — | Timeout in milliseconds; triggers error if exceeded |

## CSS Custom Properties Reference

### Layout & Background
| Property | Default | Description |
|----------|---------|-------------|
| `--async-loader-bg` | `color-mix(in oklab, Canvas 80%, transparent 20%)` | Overlay background |
| `--async-loader-c` | `CanvasText` | Text color |
| `--async-loader-p` | `1rem` | Padding |

### Close Button
| Property | Default | Description |
|----------|---------|-------------|
| `--async-loader-close-bg` | `light-dark(#f3f3f3, #333)` | Close button hover background |

### Error Display
| Property | Default | Description |
|----------|---------|-------------|
| `--async-loader-error-bg` | `light-dark(CanvasText, Canvas)` | Error background |
| `--async-loader-error-c` | `light-dark(Canvas, CanvasText)` | Error text color |

### Spinner
| Property | Default | Description |
|----------|---------|-------------|
| `--async-loader-spinner-accent` | `light-dark(#007bff, #337dcc)` | Spinner color |
| `--async-loader-spinner-bdrs` | `50%` | Spinner border radius |
| `--async-loader-spinner-p` | `calc(sz / 10)` | Spinner ring thickness |
| `--async-loader-spinner-sz` | `3.5rem` (inline: `1rem`) | Spinner size |

## CSS Parts

| Part | Description |
|------|-------------|
| `close` | Close button |
| `error` | Error message container (`<output>`) |
| `error {errortype}` | Error with custom type (e.g., `error warning`) |
| `icon` | SVG icons (close, success, failed) |
| `spinner` | Loading spinner element |
| `status-success` | Success state container |
| `status-failed` | Failed state container |

## Slots

| Slot | Default Content | Description |
|------|-----------------|-------------|
| `success` | Checkmark SVG icon | Custom success state content |
| `failed` | Warning circle SVG icon | Custom failed state content |

## Usage Patterns

### Basic Async Operation

```javascript
const loader = document.querySelector('async-loader');

async function fetchData() {
  loader.dispatchEvent(new CustomEvent('loader:start'));
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    loader.dispatchEvent(new CustomEvent('loader:stop'));
    return data;
  } catch (error) {
    loader.handleError(error);
  }
}
```

### With Timeout

```html
<async-loader timeout="5000" errormsg="Request timed out. Please try again."></async-loader>
```

```javascript
// If operation takes > 5 seconds, handleTimeout() is called automatically
loader.dispatchEvent(new CustomEvent('loader:start'));
await slowOperation();
loader.dispatchEvent(new CustomEvent('loader:stop'));
```

### Inline Button Loader

```html
<button onclick="submitForm(this)">
  <async-loader inline></async-loader>
  Submit
</button>
```

```javascript
async function submitForm(button) {
  const loader = button.querySelector('async-loader');
  loader.dispatchEvent(new CustomEvent('loader:start'));
  try {
    await fetch('/api/submit', { method: 'POST' });
    loader.dispatchEvent(new CustomEvent('loader:stop'));
  } catch (error) {
    loader.handleError(error);
  }
}
```

### Custom Error Styling

```html
<async-loader errortype="critical"></async-loader>
```

```css
async-loader::part(error critical) {
  --async-loader-error-bg: red;
  --async-loader-error-c: white;
}
```

### Custom Success/Failed Content

```html
<async-loader inline>
  <span slot="success">Done!</span>
  <span slot="failed">Failed</span>
</async-loader>
```

## Gotchas & Edge Cases

1. **Double-start prevention**: `startLoading()` returns early if already loading. Call `stopLoading()` first to reset.

2. **Event listener handling**: `stopLoading()` checks if first argument is an Event and ignores it, allowing direct use as event listener.

3. **Popover auto-configuration**: If not inline and no `popover` attribute, component auto-sets `popover="manual"`.

4. **Error part composition**: The `errortype` attribute value is appended to the part list, enabling `::part(error warning)` selectors.

5. **Inline success/failed states**: Only inline mode shows success/failed states. Popover mode simply hides.

6. **Timeout behavior**: Timeout only starts when `loader:start` is dispatched, not on `connectedCallback`.

7. **Animation pause on error**: Spinner animation is paused (not stopped) on error, preserving visual state.

8. **Close button visibility**: Always shown on error, regardless of `allowclose` attribute.
