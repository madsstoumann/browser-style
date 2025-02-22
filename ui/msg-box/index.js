const styles = `
  :host {
    border: 0;
    border-radius: 8px;
    margin: auto;
    max-inline-size: min(480px, 100vw - 2rem);
    padding: 1.5rem;
  }
  :host::backdrop {
    background: rgb(0 0 0 / .5);
    backdrop-filter: blur(2px);
  }
  header {
    display: flex;
    gap: 1ch;
    justify-content: space-between;
    margin-block-end: 1rem;
  }
  h2 {
    font-size: 1.25rem;
    margin: 0;
  }
  button {
    background: #0000;
    border: 0;
    border-radius: 50%;
    color: inherit;
    cursor: pointer;
    font-size: 1.25rem;
    padding: .25rem;
  }
  button:hover {
    background: rgb(0 0 0 / .1);
  }
  footer {
    display: flex;
    gap: 1ch;
    justify-content: flex-end;
    margin-block-start: 1rem;
  }
`;

export class MsgBox extends HTMLDialogElement {
  static #VALID_CLOSEBY = ['none', 'closerequest', 'any'];
  static #VALID_TYPES = ['alert', 'confirm', 'prompt'];
  #initialized = false;
  #shadow;

  static get observedAttributes() {
    return ['alert', 'closeby', 'confirm', 'prompt'];
  }

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: 'open' });
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styles);
    this.#shadow.adoptedStyleSheets = [sheet];
  }

  connectedCallback() {
    if (this.#initialized) return;
    this.#initialize();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    if (name === 'closeby') {
      const value = newValue?.toLowerCase();
      if (!MsgBox.#VALID_CLOSEBY.includes(value)) {
        console.warn(`Invalid closeby value: ${value}. Must be one of: ${MsgBox.#VALID_CLOSEBY.join(', ')}`);
        this.setAttribute('closeby', 'any');
      }
    } else if (MsgBox.#VALID_TYPES.includes(name)) {
      // Ensure only one type attribute is present
      MsgBox.#VALID_TYPES
        .filter(type => type !== name)
        .forEach(type => {
          if (this.hasAttribute(type)) {
            console.warn(`Cannot have multiple dialog types. Removing "${type}" attribute.`);
            this.removeAttribute(type);
          }
        });
    }
  }

  #initialize() {
    if (!this.hasAttribute('closeby')) {
      this.setAttribute('closeby', 'any');
    }

    // Count type attributes
    const typeCount = MsgBox.#VALID_TYPES
      .filter(type => this.hasAttribute(type))
      .length;

    if (typeCount === 0) {
      console.warn('No dialog type specified. Add alert, confirm, or prompt attribute.');
    } else if (typeCount > 1) {
      // Keep only the first type attribute found
      const firstType = MsgBox.#VALID_TYPES.find(type => this.hasAttribute(type));
      MsgBox.#VALID_TYPES
        .filter(type => type !== firstType)
        .forEach(type => this.removeAttribute(type));
    }

    this.#initialized = true;
  }
}

if (!customElements.get('msg-box')) {
  customElements.define('msg-box', MsgBox, { extends: 'dialog' });
}
