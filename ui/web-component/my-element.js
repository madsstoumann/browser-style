import WebComponent from './index.js';

class MyElement extends WebComponent {
  static get observedAttributes() {
    // Include base class observedAttributes and any new ones
    return [...super.observedAttributes, 'name'];
  }

  constructor() {
    super();
  }

  _getTemplate() {
    const name = this.getAttribute('name') || 'World';
    return `
      <p>Hello, ${name}!</p>
      <slot></slot>
    `;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    super.attributeChangedCallback(name, oldValue, newValue); // Call super's method
    // if (name === 'name' && this.isConnected) { // Example of handling specific attribute
    //   this.render();
    // }
  }
}

customElements.define('my-element', MyElement);
