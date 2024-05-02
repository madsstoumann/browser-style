# colorPicker Custom Element Documentation

## Overview
`colorPicker` is a custom HTML element that extends `HTMLElement` to provide a sophisticated color picker. This component allows users to select and manipulate colors based on Hue, Saturation, Value (HSV), and Alpha (transparency) through a visual interface integrated within the element's shadow DOM.

## Properties
- `observedAttributes`: Returns an array of attributes that this element will react to when they change. Currently, it includes 'value'.
- `color`: An object maintaining the current color in various formats (hsla, hsva, rgba, hex).

## Methods
### Constructor
Initializes the element with a shadow DOM and inserts the required HTML structure including:
- XY control for saturation and brightness.
- Sliders for hue and alpha values.
- A button to display the chosen color and copy its hex code.

### attributeChangedCallback(name, oldValue, newValue)
Responds to changes in attribute values, specifically the 'value' attribute to adjust the color settings internally.

### connectedCallback()
Sets up event listeners for the sliders and XY control to update the color values dynamically.

### hexToRgb(hex)
Converts a hex color code to RGB.

### hsvaToHsla(h, s, v, a)
Converts color values from HSV format to HSL format.

### rgbaToHex(r, g, b, a)
Converts color values from RGBA to hex format.

### rgbToHsv(r, g, b)
Converts RGB color values to HSV format.

### updateColor(prop, value)
Updates specific properties of the color object and applies changes to the UI.

## Event Handling
The component dispatches a 'change' event whenever the color is updated through user interactions, enabling integration with other components or callback functions.

## Usage Example in HTML
```html
<ui-color-picker value="#334455"></ui-color-picker>
```

## Listening to Changes in JavaScript

```js
document.querySelector('ui-color-picker').addEventListener('change', (event) => {
  console.log('Color changed to:', event.detail.hex);
});
```

## Customization
The element's appearance can be customized via CSS variables and parts exposed in its shadow DOM.

