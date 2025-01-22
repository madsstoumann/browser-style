export default class DataPrint extends HTMLElement {
  static observedAttributes = ['paper-size', 'orientation', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'template', 'use-template'];
  static #id = [...crypto.getRandomValues(new Uint8Array(4))].map(n => n.toString(16).padStart(2, '0')).join('');
  static id = 'dp' + DataPrint.#id;
  static #icons = {
    close: 'M18 6l-12 12, M6 6l12 12',
    paper: 'M14 3v4a1 1 0 0 0 1 1h4, M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z',
    printer: 'M17 17h2a2 2 0 0 0 2 -2v-4a2 2 0 0 0 -2 -2h-14a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h2, M17 9v-4a2 2 0 0 0 -2 -2h-6a2 2 0 0 0 -2 2v4, M7 13m0 2a2 2 0 0 1 2 -2h6a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-6a2 2 0 0 1 -2 -2z'
  };
  static #paperSizes = {
    A5: {
      width: '148mm',
      height: '210mm',
      ratio: 210/148
    },
    A4: {
      width: '210mm',
      height: '297mm',
      ratio: 297/210
    },
    A3: {
      width: '297mm',
      height: '420mm',
      ratio: 420/297
    },
    B5: {
      width: '176mm',
      height: '250mm',
      ratio: 250/176
    },
    B4: {
      width: '250mm',
      height: '353mm',
      ratio: 353/250
    },
    'JIS-B5': {
      width: '182mm',
      height: '257mm',
      ratio: 257/182
    },
    'JIS-B4': {
      width: '257mm',
      height: '364mm',
      ratio: 364/257
    },
    letter: {
      width: '8.5in',
      height: '11in',
      ratio: 11/8.5
    },
    legal: {
      width: '8.5in',
      height: '14in',
      ratio: 14/8.5
    },
    ledger: {
      width: '11in',
      height: '17in',
      ratio: 17/11
    }
  };
  static #pageStyleId = `style-${DataPrint.#id}`;
  static #instance = null;

  // Getters & Setters
  get marginBottom() { return this.getAttribute('margin-bottom') || '20mm'; }
  get marginLeft() { return this.getAttribute('margin-left') || '20mm'; }
  get marginRight() { return this.getAttribute('margin-right') || '20mm'; }
  get marginTop() { return this.getAttribute('margin-top') || '20mm'; }
  get orientation() { return this.getAttribute('orientation') || 'portrait'; }
  get paperSize() { return this.getAttribute('paper-size') || 'A4'; }
  get template() { return this.getAttribute('template') || 'default'; }
  get useTemplate() { return this.hasAttribute('use-template'); }

  set data(value) {
    this._data = value;
    this.#renderContent();
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._templates = new Map();
    this.#loadStyles();
    this.shadowRoot.innerHTML = `
      <form></form>
      <paper-tray></paper-tray>
    `;

    this.content = this.shadowRoot.querySelector('paper-tray');
    const form = this.shadowRoot.querySelector('form');

    form.addEventListener('submit', e => e.preventDefault());
    form.addEventListener('change', e => {
      const target = e.target;
      this.#handleFormChange(e);
    });
    form.addEventListener('click', e => {
      const button = e.target.closest('button');
      if (button) {
        e.preventDefault();
        if (button.dataset.action === 'print') this.print();
        if (button.dataset.action === 'close') this.#close();
      }
    });
  }

  // Lifecycle methods
  attributeChangedCallback(name) {
    if (['paper-size', 'orientation', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left'].includes(name)) {
      this.#updatePageStyles();
    }
  }

  connectedCallback() {
    if (DataPrint.#instance) {
      console.error('Only one <data-print> element is allowed');
      this.#cleanup();
      return;
    }
    
    if (this.parentElement !== document.body) {
      console.error('<data-print> must be a direct child of <body>');
      this.#cleanup();
      return;
    }

    if (!this.hasAttribute('popover')) {
      this.setAttribute('popover', '');
    }

    this.id = DataPrint.id;
    DataPrint.#instance = this;
    this.#addPageStyles();
    this.#renderForm();
    this.#renderContent();
  }

  disconnectedCallback() {
    this.#cleanup();
  }

  // Private methods
  #addPageStyles() {
    if (!document.getElementById(DataPrint.#pageStyleId)) {
      const style = document.createElement('style');
      style.id = DataPrint.#pageStyleId;
      document.head.appendChild(style);
    }
    this.#updatePageStyles();
  }

  #cleanup() {
    const style = document.getElementById(DataPrint.#pageStyleId);
    if (style) style.remove();

    this.remove();

    if (DataPrint.#instance === this) {
      DataPrint.#instance = null;
    }
  }

  #close() {
    this.hidePopover();
  }

  #getPaperSizeOptions() {
    return Object.entries(DataPrint.#paperSizes)
      .map(([size, _]) => `<option value="${size}"${size === this.paperSize ? ' selected' : ''}>${size}</option>`)
      .join('');
  }

  #handleFormChange(e) {
    const target = e.target;
    switch(target.name) {
      case 'paper-size':
        this.setAttribute('paper-size', target.value);
        break;
      case 'orientation':
        this.setAttribute('orientation', target.value);
        break;
      case 'actual-size':
        if (target.checked) {
          this.setAttribute('actual-size', '');
        } else {
          this.removeAttribute('actual-size');
        }
        break;
      case 'margin-bottom':
        this.setAttribute('margin-bottom', `${target.value}mm`);
        break;
      case 'margin-left':
        this.setAttribute('margin-left', `${target.value}mm`);
        break;
      case 'margin-right':
        this.setAttribute('margin-right', `${target.value}mm`);
        break;
      case 'margin-top':
        this.setAttribute('margin-top', `${target.value}mm`);
        break;
    }
    this.#updatePageStyles();
  }

  #icon(paths, part) {
    return `<svg viewBox="0 0 24 24"${part ? `part="${part}"`:''}>${paths.split(',').map((path) => `<path d="${path}"></path>`).join('')}</svg>`;
  }

  async #loadStyles() {
    try {
      let cssPath = this.getAttribute('styles') || 'index.css';
      if (cssPath === 'index.css' && this.basePath) {
        cssPath = `${this.basePath}${cssPath}`;
      }

      const response = await fetch(cssPath);
      if (response.ok) {
        const css = await response.text();
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(css);
        this.shadowRoot.adoptedStyleSheets = [sheet];
      }
    } catch (_) {}
  }

  #renderContent() {
    if (this.useTemplate && !this._data) return;
    const templateFn = this._templates.get(this.template) || this.defaultTemplate;
    this.content.innerHTML = this.useTemplate && this._data ? 
      templateFn(this._data, this._schema, this._formatters) : 
      '<slot></slot>';
  }

  #renderForm() {
    const form = this.shadowRoot.querySelector('form');
    form.innerHTML = `
      <label aria-label="Paper Size">
        ${this.#icon(DataPrint.#icons.paper, 'paper')}
        <select name="paper-size">
          ${this.#getPaperSizeOptions()}
        </select>
      </label>

      <label aria-label="Orientation">
        ${this.#icon(DataPrint.#icons.paper, 'paper')}
        <select name="orientation">
          <option value="portrait"${this.orientation === 'portrait' ? ' selected' : ''}>Portrait</option>
          <option value="landscape"${this.orientation === 'landscape' ? ' selected' : ''}>Landscape</option>
        </select>
      </label>

      <label aria-label="Top margin">
        T
        <input type="number" value="${parseInt(this.marginTop)}" 
          min="0" max="100" name="margin-top">
      </label>
      <label aria-label="Right margin">
        R
        <input type="number" value="${parseInt(this.marginRight)}" 
          min="0" max="100" name="margin-right">
      </label>
      <label aria-label="Bottom margin">
        B
        <input type="number" value="${parseInt(this.marginBottom)}" 
          min="0" max="100" name="margin-bottom">
      </label>
      <label aria-label="Left margin">
        L
        <input type="number" value="${parseInt(this.marginLeft)}" 
          min="0" max="100" name="margin-left">
      </label>

      <label aria-label="Use actual size">
        <input type="checkbox" name="actual-size"
          ${this.hasAttribute('actual-size') ? 'checked' : ''}>
      </label>

      <button type="button" data-action="print">
        ${this.#icon(DataPrint.#icons.printer, 'printer')}
      </button>

      <button type="button" data-action="close">
        ${this.#icon(DataPrint.#icons.close, 'close')}
      </button>
    `;
  }

  #updatePageStyles() {
    const style = document.getElementById(DataPrint.#pageStyleId);
    const paperData = DataPrint.#paperSizes[this.paperSize];
    if (style && paperData) {
      const { width, height, ratio } = paperData;
      const isActualSize = this.hasAttribute('actual-size');
      style.textContent = `
        @media print { body:has(data-print) > *:not(data-print) { display: none !important; }}
        @page {
          margin: ${this.marginTop} ${this.marginRight} ${this.marginBottom} ${this.marginLeft};
          size: ${this.paperSize} ${this.orientation};
        }
        :root {
          --page-width: ${this.orientation === 'portrait' ? width : height};
          --page-height: ${this.orientation === 'portrait' ? height : width};
          --page-ratio: ${this.orientation === 'portrait' ? ratio : 1/ratio};
          --page-actual-size: ${isActualSize ? 1 : 0};
          --page-margin-top: ${this.marginTop};
          --page-margin-right: ${this.marginRight};
          --page-margin-bottom: ${this.marginBottom};
          --page-margin-left: ${this.marginLeft};
        }
      `;
    }
  }

  // Public methods
  addTemplate(name, template) {
    this._templates.set(name, template);
  }

  defaultTemplate(data) {
    return `<pre>${JSON.stringify(data, null, 2)}</pre>`;
  }

  print() {
    window.print();
  }

  setContent(html) {
    this.content.innerHTML = html;
  }
}

customElements.define('data-print', DataPrint);
