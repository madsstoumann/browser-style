class CircularRange extends HTMLElement {
  static styles = `
    :host {
      --AccentColor: #0066cc;
      --ButtonFace: #f0f0f0;
      --Canvas: #ffffff;
      --input-thumb-sz: 20px;
      --_mask: radial-gradient(circle farthest-side at center, transparent calc(100% - var(--input-thumb-sz) - 1px), var(--AccentColor) calc(100% - var(--input-thumb-sz)));
      --_rad: calc(360deg / (var(--max, 100) - var(--min, 0)));
      
      display: grid;
      place-items: center;
      max-inline-size: 320px;
      rotate: -90deg;
      touch-action: none;
      width: 100%;
      aspect-ratio: 1 / 1;
    }

    :host::after {
      counter-reset: val var(--value);
      content: counter(val) "%";
      font-size: 200%;
      font-weight: 700;
      margin-top: 1.25ch;
      place-self: center;
      position: absolute;
      rotate: 90deg;
    }

    input {
			appearance: none;
      aspect-ratio: 1 / 1;
      background: conic-gradient(
        var(--AccentColor) calc(1% * var(--value)),
        var(--ButtonFace) calc(1% * var(--value))
      );
      border-radius: 50%;
      height: 100%;
      margin: 0;
      -webkit-mask: var(--_mask);
      mask: var(--_mask);
      pointer-events: none;
      rotate: 90deg;
      width: 100%;
      grid-column: 1 / -1;
      grid-row: 1 / -1;
    }

    input::-webkit-slider-thumb { display: none; }
    input::-moz-range-thumb { opacity: 0; }

    span {
      height: 100%;
      pointer-events: none;
      rotate: calc(90deg + (var(--_rad)) * var(--value));
      width: var(--input-thumb-sz);
      grid-column: 1 / -1;
      grid-row: 1 / -1;
    }

    span::before {
      aspect-ratio: 1;
      background-color: var(--AccentColor);
      border-radius: 50%;
      box-shadow: 0 0 0 2px var(--Canvas);
      content: '';
      display: block;
      width: 100%;
    }
  `;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Adopt styles
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(CircularRange.styles);
    this.shadowRoot.adoptedStyleSheets = [sheet];
  }

  connectedCallback() {
    const min = Number(this.getAttribute('min')) || 0;
    const max = Number(this.getAttribute('max')) || 100;
    const value = Number(this.getAttribute('value')) || 0;

    this.style.setProperty('--min', min);
    this.style.setProperty('--max', max);
    this.style.setProperty('--value', value);

    this.shadowRoot.innerHTML = `
      <input type="range" min="${min}" max="${max}" value="${value}">
      <span></span>
    `;

    const input = this.shadowRoot.querySelector('input');
    input.style.cssText = `--min: ${min}; --max: ${max};`;
    
    const CX = input.offsetWidth / 2;
    const CY = input.offsetHeight / 2;
    const radian = 360 / (max - min);

    const pointerMove = (event) => {
      const degree = (((Math.atan2(event.offsetY - CY, event.offsetX - CX) * 180 / Math.PI) + 360) % 360);
      const newValue = Math.round(degree / radian + min);
      
      input.value = Math.max(min, Math.min(max, newValue));
      this.style.setProperty('--value', input.value);
      this.setAttribute('value', input.value);
      
      this.dispatchEvent(new CustomEvent('change', { 
        detail: { value: Number(input.value) },
        bubbles: true 
      }));
      this.dispatchEvent(new CustomEvent('input', { 
        detail: { value: Number(input.value) },
        bubbles: true 
      }));
    };

    this.addEventListener('pointerdown', (e) => {
      this.setPointerCapture(e.pointerId);
      pointerMove(e);
      this.addEventListener('pointermove', pointerMove);
    });

    ['pointerup', 'pointercancel'].forEach(evt => {
      this.addEventListener(evt, (e) => {
        this.releasePointerCapture(e.pointerId);
        this.removeEventListener('pointermove', pointerMove);
      });
    });
  }

  static get observedAttributes() {
    return ['value', 'min', 'max'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.style.setProperty(`--${name}`, newValue);
      const input = this.shadowRoot?.querySelector('input');
      if (input && name === 'value') {
        input.value = newValue;
      }
    }
  }

  get value() {
    return Number(this.getAttribute('value')) || 0;
  }

  set value(val) {
    this.setAttribute('value', val);
  }
}

customElements.define('circular-range', CircularRange);
