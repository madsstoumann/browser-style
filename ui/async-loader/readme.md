# Async Loader

A customizable loading overlay component that displays a spinning indicator and handles error states. Perfect for showing loading states during async operations, with built-in timeout handling and error display.

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

- `allowclose` - Enables close button (boolean)
- `errormsg` - Custom error message for timeouts
- `errortype` - Type of error ('warning', 'critical', etc.)
- `inline` - Use inline popover instead of modal
- `timeout` - Timeout in milliseconds

## Events

- `loader:start` - Start loading state
- `loader:started` - Loading state started
- `loader:stop` - Stop loading state
- `loader:stopped` - Loading state stopped
- `loader:error` - Error occurred

## CSS Custom Properties

```css
async-loader {
  /* Background */
  --async-loader-bg: color-mix(in oklab, Canvas 80%, transparent 20%);
  
  /* Colors */
  --async-loader-c: CanvasText;
  --async-loader-close-bg: light-dark(#f3f3f3, #333);
  
  /* Spinner */
  --async-loader-spinner-accent: light-dark(#007bff, #337dcc);
  --async-loader-spinner-bg: light-dark(#f3f3f3, #333);
  --async-loader-spinner-bdw: .25rem;
  --async-loader-spinner-sz: 3.5rem;
  
  /* Error types */
  --async-loader-error-critical: red;
  --async-loader-error-warning: purple;
  
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

```javascript
// Basic loading with timeout
const loader = document.querySelector('async-loader');
loader.setAttribute('timeout', '5000');
loader.setAttribute('errormsg', 'Request timed out');
loader.dispatchEvent(new CustomEvent('loader:start'));

// Loading with error type
loader.setAttribute('errortype', 'warning');
loader.handleError(new Error('Warning: Connection unstable'));

// Closable loader
loader.setAttribute('allowclose', '');
loader.dispatchEvent(new CustomEvent('loader:start'));
```


