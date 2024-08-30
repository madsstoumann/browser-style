# Documentation for `WebComponentTemplate`

## Overview 

`WebComponentTemplate` is a base class for creating custom web components with optional Shadow DOM and styles. 
It provides flexibility to choose whether to use Shadow DOM or not and to include or exclude default styles.

### Class Definition

```js
export class WebComponentTemplate extends HTMLElement {
  constructor() {
    super();

    // Determine if Shadow DOM should be used
    const useShadow = !this.hasAttribute('no-shadow');
    
    // Determine if styles should be included
    const noStyles = this.hasAttribute('no-styles');
    
    // Attach shadow root or use the element itself
    this.root = useShadow ? this.attachShadow({ mode: 'open' }) : this;

    // If not using Shadow DOM, prepare to manage slots manually
    if (!useShadow) {
      this.getSlots();
    }

    // If using Shadow DOM and styles are not excluded, set up stylesheets
    if (useShadow && !noStyles) {
      this.stylesheet = new CSSStyleSheet();
      this.root.adoptedStyleSheets = [this.stylesheet];
    }
  }

  connectedCallback() {
    // Append slots if not using Shadow DOM
    if (!this.shadowRoot) {
      this.appendSlots();
    }
  }

  appendSlots() {
    // Method to insert slotted elements into the appropriate places in the template
    if (this.slots) {
      this.slots.childNodes.forEach((node) => {
        const name = node.getAttribute('slot');
        const placeholder = this.querySelector(`slot[name="${name}"]`);
        if (name && placeholder) {
          placeholder.outerHTML = node.outerHTML;
        }
      });
    }
  }

  getSlots() {
    // Method to collect slotted elements into a DocumentFragment
    this.slots = new DocumentFragment();
    this.querySelectorAll('[slot]').forEach((el) => {
      this.slots.appendChild(el.cloneNode(true)); // Clone nodes to prevent moving them from the light DOM
    });
  }

  static mount() {
    // Define the custom element if it hasn't been defined yet
    if (!customElements.get(this.tagName)) {
      customElements.define(this.tagName, this);
    }
  }
}
```

## Key Features
- **Shadow DOM Optionality:** By using the `no-shadow` attribute, you can choose whether to use Shadow DOM for encapsulation or use the component in the global DOM context.

- **Dynamic Stylesheets:** If Shadow DOM is used and `no-styles` is not set, a `CSSStyleSheet` object is created, allowing scoped styling within the Shadow DOM.

- **Manual Slot Management:** If Shadow DOM is not used, the component can manually handle slotted content using the `getSlots` and `appendSlots` methods.

- **Extensibility:** The class can be easily extended to create custom web components with consistent behaviors and optional Shadow DOM usage.

## Guide: Extending `WebComponentTemplate` to Create a Custom Web Component

### Example: NumberSpinner

`NumberSpinner` is a custom component that extends `WebComponentTemplate`. 
It provides a number input field with increment and decrement buttons.

```js
import { WebComponentTemplate } from '/path/webcomponent.js';

export class NumberSpinner extends WebComponentTemplate {
  static tagName = 'number-spinner';

  constructor() {
    super();

    const label = this.getAttribute('label');
    this.root.innerHTML = `
      <fieldset part="number-spinner-container">
        <legend part="number-spinner-label">
          <slot name="label">${label}</slot>
        </legend>
        <div part="number-spinner-controls">
          <button type="button" part="number-spinner-decrement">
            <slot name="icon-minus">-</slot>
          </button>
          <label part="number-spinner-input-wrapper" aria-label="${label}">
            <input type="number" part="number-spinner-input"
              max="${this.getAttribute('max') || 100}"
              min="${this.getAttribute('min') || 0}"
              step="${this.getAttribute('step') || 1}"
              value="${this.getAttribute('value')}">
          </label>
          <button type="button" part="number-spinner-increment">
            <slot name="icon-plus">+</slot>
          </button>
        </div>
      </fieldset>`;

    this.input = this.root.querySelector('input');
    this.label = this.root.querySelector('[part="number-spinner-label"]');
    this.stepDownButton = this.root.querySelector('[part="number-spinner-decrement"]');
    this.stepUpButton = this.root.querySelector('[part="number-spinner-increment"]');
  }

  connectedCallback() {
    super.connectedCallback();
    this.stepUpButton.addEventListener('click', () => this.input.stepUp());
    this.stepDownButton.addEventListener('click', () => this.input.stepDown());
  }
}
```

## Key Features and Instructions for NumberSpinner

1. Markup and Initialization:
    - The constructor sets up the component's markup. If `no-shadow` is not set, the markup is placed in the Shadow DOM; otherwise, it is directly in the global DOM context.
    - Make sure to call `super.connectedCallback()` **after** setting up the markup if it's initialized in the constructor.

2. Dynamic Attributes:
    - `label`, `max`, `min`, `step`, and `value` are dynamically set based on the component's attributes.

3. Button Functionality:
    - The increment (`stepUpButton`) and decrement (`stepDownButton`) buttons are initialized and set to adjust the number input value.

4. Styling with Shadow DOM:
    - If Shadow DOM is used and `no-styles` is **not set**, you can use `this.stylesheet.replaceSync` to apply scoped styles.
    - Example: `this.stylesheet.replaceSync(\::host { font-size: 1rem; }`);`.

5. Slots and Part Management:
    - Slots (`<slot>`) are used for icons and labels to allow flexible content insertion.
    - Parts (`part`) provide styling hooks for styling components via the shadow host.

## Usage

To use the `NumberSpinner` component:

```html
<number-spinner label="Quantity" min="1" max="100" step="1" value="10">
  <ui-icon type="minus" slot="icon-minus">-</ui-icon>
  <ui-icon type="plus" slot="icon-plus">+</ui-icon>
</number-spinner>

<script src="/path/numberspinner.js"></script>
<script>
  /* ... then, somewhere in your code, run: */
  NumberSpinner.mount();
</script>
```

## Conclusion

By following this guide, you can extend `WebComponentTemplate` to create your own custom web components with flexible configuration options for Shadow DOM usage, style inclusion, and slot management. The `NumberSpinner` example demonstrates how to create a functional and extendable custom element using the base template.