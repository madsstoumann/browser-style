# Async Loader

A customizable loading overlay component that displays a spinning indicator and handles error states. Uses the native `<popup>` API for modal display.

## Installation

```bash
npm install @browser.style/async-loader
```

## Basic Usage

```javascript
import '@browser.style/async-loader';
```

```html
<async-loader></async-loader>
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

- `allowclose` - Enables close button
- `errormsg` - Custom error message for timeouts
- `errortype` - Type of error (adds the value to the error part)
- `inline` - Display as inline element instead of popup
- `popover` - Popover type (defaults to 'manual' if not inline)
- `timeout` - Timeout in milliseconds

## Events

- `loader:start` - Trigger to start loading
- `loader:started` - Fired when loading starts
- `loader:stop` - Trigger to stop loading
- `loader:stopped` - Fired when loading stops
- `loader:error` - Fired when an error occurs (includes error in detail)

## Slots

- `success` - Custom content for success state (default is checkmark icon)
- `failed` - Custom content for failed state (default is warning icon)

## Parts

- `close` - Close button
- `error` - Error message container
- `icon` - Icons (close, success, failed)
- `spinner` - Loading spinner
- `status-success` - Success state container
- `status-failed` - Failed state container

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
  --async-loader-spinner-bg: light-dark(#f3f3f3, #333);
  --async-loader-spinner-bdw: calc(var(--async-loader-spinner-sz, 3.5rem) / 10);
  --async-loader-spinner-sz: 3.5rem;
  
  /* Layout */
  --async-loader-p: 1rem;
}
```

## Error Types

You can style different error types using `::part` selectors:

```css
async-loader::part(error-warning) {
  color: var(--async-loader-error-warning);
}

async-loader::part(error-critical) {
  color: var(--async-loader-error-critical);
}
```

## Examples

```html
<!-- Inline loader -->
<async-loader inline></async-loader>

<!-- Modal loader with close button -->
<async-loader allowclose timeout="5000" errormsg="Request timed out"></async-loader>

<!-- Custom success/error states -->
<async-loader>
  <span slot="success">✨ Done!</span>
  <span slot="failed">💥 Error!</span>
</async-loader>
```

```javascript
// Basic usage
const loader = document.querySelector('async-loader');
loader.dispatchEvent(new CustomEvent('loader:start'));

// With error handling
try {
  await someAsyncOperation();
  loader.dispatchEvent(new CustomEvent('loader:stop'));
} catch (error) {
  loader.handleError(error);
}
```


