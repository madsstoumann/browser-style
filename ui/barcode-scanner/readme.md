# BarcodeScanner

A web component that works with most barcode scanners, supporting both automatic and manual barcode entry.

## Installation

```bash
npm install @browser.style/barcode-scanner
```

## Basic Usage

```javascript
import '@browser.style/barcode-scanner';
```

```html
<barcode-scanner></barcode-scanner>
```

Click the icon to start scanning, or add the `auto` attribute to start automatically.

## Attributes

- `auto`: Start scanning immediately when page loads
- `clear`: Display duration in ms (default: 2000)
- `debug`: Show scan history in console
- `input`: Show input field for manual entry
- `maxlength`: Max digits in barcode (default: 14, min: 8)
- `minlength`: Min digits in barcode (default: 8)
- `terminate-char`: Scanner termination char (default: '\n')
- `styles`: Use default component styles

## Events

The component emits two events:

- `bs:entry`: Triggered on successful scan
```javascript
scanner.addEventListener('bs:entry', event => {
  console.log('Barcode:', event.detail.value);
});
```
- `bs:clear`: Can be dispatched to clear display

## Form Integration

```html
<form>
  <barcode-scanner name="scanner"></barcode-scanner>
</form>
```

Access values:
```javascript
const form = document.querySelector('form');
const scanner = form.elements.scanner;
console.log(scanner.value); // Last scanned barcode
```

## Debug Mode

With `debug` attribute, scan history shows:
- Timestamp
- Barcode value
- Source (scanner/manual)

## Manual Entry

Enable manual input with the `input` attribute:
```html
<barcode-scanner input></barcode-scanner>
```
