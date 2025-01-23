export default class DataPrint extends HTMLElement {
  static #pageStyleId;
  static #id;
  static #instance = null;
  static #printStyleId;
  
  static {
    const id = [...crypto.getRandomValues(new Uint8Array(4))]
      .map(n => n.toString(16).padStart(2, '0')).join('');
    this.#id = `dp${id}`;
    this.#pageStyleId = `style-${id}`;
    this.#printStyleId = `print-${this.#id}`;
  }

  static get id() { return this.#id; }

  static observedAttributes = [
    'paper-size', 'orientation', 
    'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 
    'template', 'use-template', 'lang', 'font-size', 'font-family'
  ];

  static #icons = {
    close: 'M18 6l-12 12, M6 6l12 12',
    fontfamily: 'M4 20l3 0, M14 20l7 0, M6.9 15l6.9 0, M10.2 6.3l5.8 13.7, M5 20l6 -16l2 0l7 16',
    fontsize: 'M3 7v-2h13v2, M10 5v14, M12 19h-4, M15 13v-1h6v1, M18 12v7, M17 19h2',
    margin: 'M3 5a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z',
    paper: 'M14 3v4a1 1 0 0 0 1 1h4, M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z',
    printer: 'M17 17h2a2 2 0 0 0 2 -2v-4a2 2 0 0 0 -2 -2h-14a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h2, M17 9v-4a2 2 0 0 0 -2 -2h-6a2 2 0 0 0 -2 2v4, M7 13m0 2a2 2 0 0 1 2 -2h6a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-6a2 2 0 0 1 -2 -2z'
  };

  static #paperSizes = {
    A5: { width: '148mm', height: '210mm', ratio: 210/148 },
    A4: { width: '210mm', height: '297mm', ratio: 297/210 },
    A3: { width: '297mm', height: '420mm', ratio: 420/297 },
    B5: { width: '176mm', height: '250mm', ratio: 250/176 },
    B4: { width: '250mm', height: '353mm', ratio: 353/250 },
    'JIS-B5': { width: '182mm', height: '257mm', ratio: 257/182 },
    'JIS-B4': { width: '257mm', height: '364mm', ratio: 364/257 },
    letter: { width: '8.5in', height: '11in', ratio: 11/8.5 },
    legal: { width: '8.5in', height: '14in', ratio: 14/8.5 },
    ledger: { width: '11in', height: '17in', ratio: 17/11 }
  };

  static #i18n = {
    en: {
      bottom: 'Bottom',
      close: 'Close',
      errors: {
        single_instance: 'Only one <data-print> element is allowed',
        body_child: '<data-print> must be a direct child of <body>'
      },
      font_family: 'Font Family',
      font_size: 'Font Size',
      left: 'Left',
      orientation: 'Orientation',
      orientation_landscape: 'Landscape',
      orientation_portrait: 'Portrait',
      paper_size: 'Paper Size',
      print: 'Print',
      right: 'Right',
      top: 'Top'
    }
  };

  static get i18n() { return this.#i18n; }
  static set i18n(value) { this.#i18n = { ...this.#i18n, ...value }; }

  #isPrinting = false;
  #lang = 'en';
  #t = () => DataPrint.#i18n[this.#lang];
  
  get marginBottom() { return this.getAttribute('margin-bottom') ?? '10mm'; }
  get marginLeft() { return this.getAttribute('margin-left') ?? '10mm'; }
  get marginRight() { return this.getAttribute('margin-right') ?? '10mm'; }
  get marginTop() { return this.getAttribute('margin-top') ?? '10mm'; }
  get orientation() { return this.getAttribute('orientation') ?? 'portrait'; }
  get paperSize() { return this.getAttribute('paper-size') ?? 'A4'; }
  get template() { return this.getAttribute('template') ?? 'default'; }
  get useTemplate() { return this.hasAttribute('use-template'); }
  get fontSize() { return this.getAttribute('font-size') ?? 'medium'; }
  get fontFamily() { return this.getAttribute('font-family') ?? 'ff-inherit'; }

  set data(value) {
    this._data = value;
    this.#renderContent();
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._templates = new Map();
    this.#lang = this.getAttribute('lang') ?? 'en';
    
    this.shadowRoot.innerHTML = '<form></form><paper-tray></paper-tray>';
    this.content = this.shadowRoot.querySelector('paper-tray');
    
    this.#loadStyles();
    this.#setupEventListeners();
    
    // Listen for system print
    window.addEventListener('beforeprint', () => {
      if (!this.hasAttribute('mode')) {
        this.setAttribute('mode', 'hidden');
      }
    });
    window.addEventListener('afterprint', () => {
      this.removeAttribute('mode');
    });
  }

  attributeChangedCallback(name) {
    if (name === 'lang') {
      this.#lang = this.getAttribute('lang') ?? 'en';
      this.#renderForm();
    } else if (['paper-size', 'orientation', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'font-size', 'font-family'].includes(name)) {
      this.#updatePageStyles();
    }
  }

  connectedCallback() {
    if (DataPrint.#instance || this.parentElement !== document.body) {
      console.error(this.#t()[DataPrint.#instance ? 'errors.single_instance' : 'errors.body_child']);
      this.#cleanup();
      return;
    }

    this.id = DataPrint.id;
    DataPrint.#instance = this;
    this.setAttribute('popover', '');
    this.#addPageStyles();
    this.#renderForm();
    this.#renderContent();
  }

  disconnectedCallback() {
    this.#cleanup();
  }

  /* === private methods === */

  #addPageStyles() {
    if (!document.getElementById(DataPrint.#pageStyleId)) {
      const style = document.createElement('style');
      style.id = DataPrint.#pageStyleId;
      document.head.appendChild(style);
      this.#updatePageStyles();
    }
  }

  #addPrintStyle() {
    if (!document.getElementById(DataPrint.#printStyleId)) {
      const style = document.createElement('style');
      style.id = DataPrint.#printStyleId;
      style.textContent = `
        @media print { 
          body:has(data-print) > *:not(data-print) { display: none !important; }
        }
        @page {
          margin: ${this.marginTop} ${this.marginRight} ${this.marginBottom} ${this.marginLeft};
          size: ${this.paperSize} ${this.orientation};
        }
      `;
      document.head.appendChild(style);
    }
  }

  #cleanup = () => {
    document.getElementById(DataPrint.#pageStyleId)?.remove();
    if (DataPrint.#instance === this) DataPrint.#instance = null;
    this.remove();
  };

  #handleFormChange = {
    'paper-size': value => this.setAttribute('paper-size', value),
    orientation: value => this.setAttribute('orientation', value),
    'margin-bottom': value => this.setAttribute('margin-bottom', `${value}mm`),
    'margin-left': value => this.setAttribute('margin-left', `${value}mm`),
    'margin-right': value => this.setAttribute('margin-right', `${value}mm`),
    'margin-top': value => this.setAttribute('margin-top', `${value}mm`),
    'font-size': value => this.setAttribute('font-size', value),
    'font-family': value => this.setAttribute('font-family', value)
  };

  #icon(paths, part) {
    return `<svg viewBox="0 0 24 24"${part ? ` part="${part}"` : ''}>${
      paths.split(',').map(path => `<path d="${path}"></path>`).join('')
    }</svg>`;
  }

  async #loadStyles() {
    try {
      const cssPath = this.getAttribute('styles') || 
        (this.basePath ? `${this.basePath}index.css` : 'index.css');
      const response = await fetch(cssPath);
      if (response.ok) {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(await response.text());
        this.shadowRoot.adoptedStyleSheets = [sheet];
      }
    } catch (_) {}
  }

  #removePrintStyle() {
    document.getElementById(DataPrint.#printStyleId)?.remove();
  }

  #renderContent() {
    if (this.useTemplate && !this._data) return;
    const templateFn = this._templates.get(this.template) || this.defaultTemplate;
    this.content.innerHTML = this.useTemplate && this._data ? 
      templateFn(this._data) : '<slot></slot>';
  }

  #renderForm() {
    const t = this.#t();
    this.shadowRoot.querySelector('form').innerHTML = `
      <label aria-label="${t.paper_size}">
        ${this.#icon(DataPrint.#icons.paper, 'paper')}
        <select name="paper-size">
          ${Object.keys(DataPrint.#paperSizes)
            .map(size => `<option value="${size}"${size === this.paperSize ? ' selected' : ''}>${size}</option>`)
            .join('')}
        </select>
      </label>

      <label aria-label="${t.orientation}">
        ${this.#icon(DataPrint.#icons.paper, 'paper')}
        <select name="orientation">
          <option value="portrait"${this.orientation === 'portrait' ? ' selected' : ''}>${t.orientation_portrait}</option>
          <option value="landscape"${this.orientation === 'landscape' ? ' selected' : ''}>${t.orientation_landscape}</option>
        </select>
      </label>

      <label aria-label="${t.font_family}">
        ${this.#icon(DataPrint.#icons.fontfamily, 'fontsize')}
        <select name="font-family">
          ${['Antique', 'Classical', 'Code', 'Didone', 'Geometric', 'Grotesque', 'Handwritten', 'Humanist', 'Industrial', 'Inherit', 'Monospace', 'Old Style', 'Rounded', 'Slab', 'System', 'Transitional']
            .map(family => {
              const value = `ff-${family.toLowerCase().replace(/\s+/g, '-')}`;
              return `<option value="${value}"${value === this.fontFamily ? ' selected' : ''}>${family}</option>`;
            }).join('')}
        </select>
      </label>

      <label aria-label="${t.font_size}">
        ${this.#icon(DataPrint.#icons.fontsize, 'fontsize')}
        <select name="font-size">
          ${['xx-small', 'x-small', 'small', 'medium', 'large', 'x-large', 'xx-large']
            .map(size => `<option value="${size}"${size === this.fontSize ? ' selected' : ''}>${size}</option>`)
            .join('')}
        </select>
      </label>

      <fieldset>
        ${this.#icon(DataPrint.#icons.margin, 'margin')}
        ${['top', 'right', 'bottom', 'left'].map(pos => `
          <label aria-label="${t[pos]}">
            ${t[pos][0]}
            <input type="number" value="${parseInt(this[`margin${pos.charAt(0).toUpperCase() + pos.slice(1)}`])}" 
              min="0" max="100" name="margin-${pos}">
          </label>
        `).join('')}
      </fieldset>
      
      <button type="button" data-action="print" aria-label="${t.print}">
        ${this.#icon(DataPrint.#icons.printer, 'printer')}
      </button>

      <button type="button" data-action="close" aria-label="${t.close}">
        ${this.#icon(DataPrint.#icons.close, 'close')}
      </button>
    `;
  }

  #setupEventListeners() {
    this.shadowRoot.addEventListener('submit', e => e.preventDefault());
    this.shadowRoot.addEventListener('change', e => {
      const handler = this.#handleFormChange[e.target.name];
      if (handler) {
        handler(e.target.value, e.target);
        this.#updatePageStyles();
      }
    });
    this.shadowRoot.addEventListener('click', e => {
      const action = e.target.closest('button')?.dataset.action;
      if (action === 'print') this.print();
      if (action === 'close') this.hidePopover();
    });
  }

  #updatePageStyles() {
    const style = document.getElementById(DataPrint.#pageStyleId);
    const { width, height, ratio } = DataPrint.#paperSizes[this.paperSize] ?? {};
    if (!style || !width) return;

    const isLandscape = this.orientation === 'landscape';
    const cssVars = {
      '--page-width': isLandscape ? height : width,
      '--page-height': isLandscape ? width : height,
      '--page-ratio': isLandscape ? 1/ratio : ratio,
      '--page-margin-top': this.marginTop,
      '--page-margin-right': this.marginRight,
      '--page-margin-bottom': this.marginBottom,
      '--page-margin-left': this.marginLeft,
      '--page-root-size': this.fontSize,
      '--page-font': `var(--${this.fontFamily})`,

      '--ff-system-ui': 'system-ui, sans-serif',
      '--ff-transitional': 'Charter, "Bitstream Charter", "Sitka Text", Cambria, serif',
      '--ff-old-style': '"Iowan Old Style", "Palatino Linotype", "URW Palladio L", P052, serif',
      '--ff-humanist': 'Seravek, "Gill Sans Nova", Ubuntu, Calibri, "DejaVu Sans", source-sans-pro, sans-serif',
      '--ff-geometric': 'Avenir, Montserrat, Corbel, "URW Gothic", source-sans-pro, sans-serif',
      '--ff-classical': 'Optima, Candara, "Noto Sans", source-sans-pro, sans-serif',
      '--ff-grotesque': 'Inter, Roboto, "Helvetica Neue", "Arial Nova", "Nimbus Sans", Arial, sans-serif',
      '--ff-monospace': '"Nimbus Mono PS", "Courier New", monospace',
      '--ff-code': 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Consolas, "DejaVu Sans Mono", monospace',
      '--ff-industrial': 'Bahnschrift, "DIN Alternate", "Franklin Gothic Medium", "Nimbus Sans Narrow", sans-serif-condensed, sans-serif',
      '--ff-rounded': 'ui-rounded, "Hiragino Maru Gothic ProN", Quicksand, Comfortaa, Manjari, "Arial Rounded MT", "Arial Rounded MT Bold", Calibri, source-sans-pro, sans-serif',
      '--ff-slab': 'Rockwell, "Rockwell Nova", "Roboto Slab", "DejaVu Serif", "Sitka Small", serif',
      '--ff-antique': 'Superclarendon, "Bookman Old Style", "URW Bookman", "URW Bookman L", "Georgia Pro", Georgia, serif',
      '--ff-didone': 'Didot, "Bodoni MT", "Noto Serif Display", "URW Palladio L", P052, Sylfaen, serif',
      '--ff-handwritten': '"Segoe Print", "Bradley Hand", Chilanka, TSCu_Comic, casual, cursive',
      '--ff-inherit': 'inherit'
    };

    style.textContent = `
      
      :root {
        ${Object.entries(cssVars).map(([key, value]) => `${key}: ${value};`).join('\n')}
      }
    `;
  }


  /* === Public API === */

  addTemplate(name, template) {
    this._templates.set(name, template);
  }

  defaultTemplate(data) {
    return `<pre>${JSON.stringify(data, null, 2)}</pre>`;
  }

  print() {
    this.#addPrintStyle();
    this.setAttribute('mode', 'printing');

    const cleanup = () => {
      this.#removePrintStyle();
      this.removeAttribute('mode');
      window.removeEventListener('afterprint', cleanup);
      window.removeEventListener('focus', cleanup);
    };

    window.addEventListener('afterprint', cleanup, { once: true });
    window.addEventListener('focus', cleanup, { once: true }); // Catches print dialog cancellation
    
    window.print();
  }

  setContent(html) {
    this.content.innerHTML = html;
  }
}

customElements.define('data-print', DataPrint);