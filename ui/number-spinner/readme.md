# NumberSpinner

A web component that provides a number input with increment and decrement buttons.

## Installation

```bash
npm install @browser.style/number-spinner
```

## Usage

```javascript
import '@browser.style/number-spinner';
```

```html
<!-- Basic usage -->
<number-spinner
  min="0"
  max="100"
  step="1"
  value="1">
</number-spinner>

<!-- With label and custom size -->
<number-spinner
  label="Quantity"
  min="0"
  max="1000"
  size="4"
  step="10"
  value="100">
</number-spinner>
```

## Attributes

- `form`: Associate with form by ID
- `label`: Input label text
- `max`: Maximum value (default: 100)
- `min`: Minimum value (default: 0)
- `name`: Input name for form submission
- `size`: Input field width in characters (default: 2)
- `step`: Step increment/decrement value (default: 1)
- `value`: Initial value (default: 1)

## Events

- `change`: Fired when value changes (via buttons or manual input)

## Form Integration

```html
<form>
  <number-spinner
    name="quantity"
    min="0"
    max="100"
    value="1">
  </number-spinner>
</form>
```

Access form values:
```javascript
const form = document.querySelector('form');
const spinner = form.elements.quantity;
console.log(spinner.value); // Current value
```

## Customization

Override button content using slots:
```html
<number-spinner>
  <span slot="dec">−</span>
  <span slot="inc">+</span>
</number-spinner>
