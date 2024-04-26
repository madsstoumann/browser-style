# xyController Class Documentation

## Overview
`xyController` is a custom web component designed for 2D navigation within a specified grid, useful in graphical applications or interfaces requiring spatial control.

## Attributes
- Inherits from `HTMLElement`.
- Monitors changes to `x` and `y` attributes.
- Registered under the HTML tag `<ui-xy>`.

## Constructor
Initializes the shadow DOM and sets up the component.

## Lifecycle Methods

### connectedCallback
- Attaches a shadow DOM.
- Creates and configures a button element as the navigation point, making it inert to avoid standard button behaviors.
- Parses attributes to set up initial configurations and applies styles.
- Adds event listeners for keyboard and pointer interactions.
- Initializes a `ResizeObserver` for dynamic adjustments based on element resizing.

### attributeChangedCallback
- Updates `x` or `y` properties when their attributes change.

## Methods

### keymove
Handles keyboard navigation using arrow keys, with support for shift and alt modifications to adjust movement increments.

### customEvent
Dispatches custom events like `xydown`, `xyup`, and `xymove`.

### down
Activates the component and triggers the `xydown` event.

### move
Updates the navigation point's position if the component is active.

### up
Deactivates the component and triggers the `xyup` event.

### refresh
Recalculates ratios and boundaries based on the component's dimensions.

### update
Applies new positions based on either user interaction or programmatic changes.

### updateXY
Converts logical position into visual adjustments using CSS variables.

### xyset
Sets the logical position based on external inputs.

## HTML Implementation Example

```html
<ui-xy grid-x="6" grid-y="6" min-x="0" max-x="100" min-y="0" max-y="100"></ui-xy>
```

This snippet creates a ui-xy element with a 6x6 grid, and logical x and y boundaries from 0 to 100.

## Event Listening

To interact with `xyController` in JavaScript, add event listeners to handle custom events:

```js
document.querySelector('ui-xy').addEventListener('xymove', function(event) {
  console.log(`Moved to X: ${event.detail.x}, Y: ${event.detail.y}`);
});

document.querySelector('ui-xy').addEventListener('xydown', function() {
  console.log('Interaction started');
});

document.querySelector('ui-xy').addEventListener('xyup', function() {
  console.log('Interaction ended');
});

document.querySelector('ui-xy').addEventListener('xytoggle', function() {
  console.log('Toggle on/off');
});
```

This JavaScript code listens to `xymove`, `xydown`, and `xyup` events, providing feedback in the console about the interactions with the component.

`xytoggle` is triggered through keyboard-navigation with `spacebar`. It's a boolean event, switching betwen `on` and `off`. 