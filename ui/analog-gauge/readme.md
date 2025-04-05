# Analog Gauge

A customizable analog gauge web component.

## Installation
Import the component in your JavaScript:

```javascript
import "@browser.style/analog-gauge";
```

Add the component to your HTML:

```html
<!-- Basic gauge with value and range -->
<analog-gauge value="50" min="0" max="100"></analog-gauge>

<!-- With label, min and max labels -->
<analog-gauge 
  value="1032" 
  label="hPa" 
  min="950" 
  max="1050" 
  min-label="Low" 
  max-label="High"
  values="11">
</analog-gauge>
```

### Supported Attributes

The component accepts these attributes:

- `value`: Current value (number)
- `min`: Minimum value (default: 0)
- `max`: Maximum value (default: 100)
- `suffix`: Text to append after value (e.g., "%", "°")
- `label`: Main label text
- `min-label`: Label for minimum value
- `max-label`: Label for maximum value
- `values`: Specify value markers in two formats:
  - A single number (e.g., "11") to generate evenly spaced markers
  - A comma-separated list (e.g., "Low,Mid,High") for custom labels