# Async Loader

A customizable loading overlay component that displays a spinning indicator and handles error states. Uses the native Popover API for modal display.

## Installation

```bash
npm install @browser.style/async-loader
```

```javascript
import '@browser.style/async-loader';
```

## Basic Usage

```html
<async-loader></async-loader>

<script>
  const loader = document.querySelector('async-loader');

  // Start loading
  loader.dispatchEvent(new CustomEvent('loader:start'));

  // Stop loading
  loader.dispatchEvent(new CustomEvent('loader:stop'));

  // Handle errors
  loader.handleError(new Error('Something went wrong'));
</script>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `allowclose` | Boolean | `false` | Enables close button |
| `errormsg` | String | `"Operation timed out"` | Custom error message for timeouts |
| `errortype` | String | — | Type of error (adds value to the error part for styling) |
| `inline` | Boolean | `false` | Display as inline element instead of popover |
| `popover` | String | `"manual"` | Popover type (auto-set if not inline) |
| `timeout` | Number | — | Timeout in milliseconds |

## Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `startLoading()` | — | Start the loading state programmatically |
| `stopLoading(hasError)` | `hasError`: Boolean | Stop loading; pass `true` to show failed state (inline only) |
| `handleError(error)` | `error`: Error | Display error message and pause spinner |
| `handleTimeout()` | — | Called automatically when timeout expires |

## Events

### Input Events (Triggers)

| Event | Description |
|-------|-------------|
| `loader:start` | Dispatch to start loading |
| `loader:stop` | Dispatch to stop loading |

### Output Events (Notifications)

| Event | Detail | Description |
|-------|--------|-------------|
| `loader:started` | — | Fired when loading starts |
| `loader:stopped` | — | Fired when loading stops |
| `loader:error` | `{ error: Error }` | Fired when an error occurs |

## Slots

| Slot | Default | Description |
|------|---------|-------------|
| `success` | Checkmark icon | Custom content for success state (inline only) |
| `failed` | Warning icon | Custom content for failed state (inline only) |

## CSS Parts

| Part | Description |
|------|-------------|
| `close` | Close button |
| `error` | Error message container |
| `icon` | SVG icons (close, success, failed) |
| `spinner` | Loading spinner |
| `status-success` | Success state container |
| `status-failed` | Failed state container |

## CSS Custom Properties

```css
async-loader {
  /* Background & Colors */
  --async-loader-bg: color-mix(in oklab, Canvas 80%, transparent 20%);
  --async-loader-c: CanvasText;

  /* Close Button */
  --async-loader-close-bg: light-dark(#f3f3f3, #333);

  /* Error Display */
  --async-loader-error-bg: light-dark(CanvasText, Canvas);
  --async-loader-error-c: light-dark(Canvas, CanvasText);

  /* Spinner */
  --async-loader-spinner-accent: light-dark(#007bff, #337dcc);
  --async-loader-spinner-bdrs: 50%;
  --async-loader-spinner-p: calc(var(--async-loader-spinner-sz) / 10);
  --async-loader-spinner-sz: 3.5rem;

  /* Layout */
  --async-loader-p: 1rem;
}
```

## Custom Error Styling

Use the `errortype` attribute and `::part` selectors:

```html
<async-loader errortype="critical"></async-loader>
```

```css
async-loader::part(error critical) {
  --async-loader-error-bg: red;
  --async-loader-error-c: white;
}

async-loader::part(error warning) {
  --async-loader-error-bg: darkorange;
  --async-loader-error-c: white;
}
```

## Examples

### Inline Loader

```html
<button onclick="submitForm(this)">
  <async-loader inline></async-loader>
  Submit
</button>
```

### Modal Loader with Timeout

```html
<async-loader allowclose timeout="5000" errormsg="Request timed out"></async-loader>
```

### Custom Success/Failed States

```html
<async-loader inline>
  <span slot="success">Done!</span>
  <span slot="failed">Error!</span>
</async-loader>
```

### Complete Async Pattern

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
