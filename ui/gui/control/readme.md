# GUI Control

A web component that creates a draggable control panel with various input types, perfect for prototyping and testing UI properties.

## Installation

```bash
npm install @browser.style/gui-control
```

## Basic Usage

```javascript
import '@browser.style/gui-control';
```

```html
<gui-control label="Controls" scope="#target"></gui-control>
```

## Attributes

- `label`: Panel title (default: 'Toggle Controls')
- `position`: Panel position ('left', 'bottom')
- `scope`: CSS selector for target element (default: documentElement)

## Methods

- `add(content, label, value, property, list)`: Add custom content
- `addButton(label, text, type, attributes, list)`: Add button
- `addCheckbox(label, value, property, attributes, list)`: Add checkbox
- `addColor(label, value, property, attributes, list)`: Add color picker
- `addDataList(name, options, list)`: Add datalist
- `addGroup(label, content)`: Add collapsible group
- `addInput(type, label, value, property, attributes, list)`: Add input
- `addRange(label, value, property, attributes, list)`: Add range slider
- `addSelect(label, value, property, attributes, list)`: Add select
- `addTextArea(label, value, property, attributes, list)`: Add textarea

## Events

The component emits one event:

- `gui-input`: Triggered on any input change
```javascript
control.addEventListener('gui-input', event => {
  console.log('Input:', event.detail.input);
  console.log('Value:', event.detail.value);
  console.log('Action:', event.detail.action);
});
```

## Example

```javascript
const gui = document.querySelector('gui-control');
gui.addColor('Background', '#303030', '--background');
gui.addRange('Opacity', '1', '--opacity', {
  min: 0,
  max: 1,
  step: 0.1
});
gui.addGroup('Typography', [
  ul => gui.addSelect('Font', 'sans-serif', '--font-family', {
    options: [
      { key: 'Sans-serif', value: 'sans-serif' },
      { key: 'Serif', value: 'serif' },
      { key: 'Monospace', value: 'monospace' }
    ]
  }, ul)
]);

