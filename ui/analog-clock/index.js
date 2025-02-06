const styles = new CSSStyleSheet();
styles.replaceSync(`
  :host {
    --analog-clock-num-sz: 15cqi;
    --_tf: linear;

    aspect-ratio: 1;
    background: var(--analog-clock-bg, light-dark(hsl(0, 0%, 95%), hsl(0, 0%, 15%)));
    border-radius: 50%;
    color: var(--analog-clock-c, light-dark(hsl(0, 0%, 15%), hsl(0, 0%, 85%)));
    color-scheme: light dark;
    container-type: inline-size;
    font-family: var(--analog-clock-ff, ui-sans-serif, system-ui, sans-serif);
    display: grid;
    grid-template-rows: repeat(3, 1fr);
    inline-size: 100%;
    overflow: clip;
    position: relative;
  }

  /* === Indices === */

  :host::part(indices) {
    aspect-ratio: 1;
    border-radius: 50%;
    color: var(--analog-clock-indices-c, #0005);
    font-size: var(--analog-clock-indices-fs, 6cqi);
    grid-area: 1 / 1 / 4 / 1;
    margin: var(--analog-clock-indices-m, 0);
    padding: 0;
  }
  :host::part(hour) {
    font-weight: var(--analog-clock-indices-hour-fw, 800);
  }
  :host [part~=indices] li {
    display: inline-block;
    list-style: none;
    offset-distance: var(--_d);
    offset-path: content-box;
    width: fit-content;
  }

  /* === Numerals === */

  :host::part(numerals) {
    display: contents;
  }

  :host [part~=numerals] li {
    --_r: calc((100% - var(--analog-clock-num-sz)) / 2);
    --_x: calc(var(--_r) + (var(--_r) * cos(var(--_d))));
    --_y: calc(var(--_r) + (var(--_r) * sin(var(--_d))));

    aspect-ratio: 1;
    display: grid;
    font-size: var(--analog-clock-fs, 6cqi);
    font-weight: var(--analog-clock-fw, 700);
    left: var(--_x);
    place-content: center;
    position: absolute;
    top: var(--_y);
    width: var(--analog-clock-num-sz);
  }

  /* === Hands and Date === */

  :host::part(hands) {
    display: grid;
    grid-area: 2 / 1 / 3 / 1;
    grid-template-columns: repeat(3, 1fr);
  }

  :host::part(hands)::after {
    aspect-ratio: 1;
    background-color: var(--analog-clock-cap, currentColor);
    border-radius: 50%;
    content: "";
    grid-area: 1 / 2 / 1 / 3;
    height: 8cqi;
    isolation: isolate;
    place-self: center;
  }

  :host [part~="hands"] b {
    border-radius: calc(var(--_w) * 2);
    display: block;
    height: var(--_h);
    left: calc((100% - var(--_w)) / 2);
    position: absolute;
    top: calc((100% / 2) - var(--_h));
    transform: rotate(0deg);
    transform-origin: bottom;
    width: var(--_w);
  }

  :host::part(hours) {
    --_h: 35%;
    --_w: 2cqi;
    animation: turn 43200s linear infinite;
    animation-delay: var(--_dh, 0ms);
    background-color: var(--analog-clock-hour, currentColor);
  }

  :host::part(minutes) {
    --_h: 45%;
    --_w: 2cqi;
    animation: turn 3600s steps(60, end) infinite;
    animation-delay: var(--_dm, 0ms);
    background-color: var(--analog-clock-minute, currentColor);
  }

  :host::part(seconds) {
    --_h: 45%;
    --_w: 1cqi;
    animation: turn 60s var(--_tf) infinite;
    animation-delay: var(--_ds, 0ms);
    background-color: var(--analog-clock-second, #ff8c05);
  }

  /* === Label and Date === */
 
  :host::part(date) { 
    border: .25cqi solid currentColor;
    color: var(--analog-clock-date-c, #888);
    font-family: var(--analog-clock-date-ff, ui-monospace, monospace);
    font-size: var(--analog-clock-date-fs, 5cqi);
    grid-area: 1 / 3 / 1 / 4;
    padding: 0 .6ch;
    place-self: center start;
  }

  :host::part(label) { 
    font-size: var(--analog-clock-label-fs, 5cqi);
    font-weight: var(--analog-clock-label-fw, 600);
    grid-area: 3 / 1 / 4 / 2;
    place-self: start center;
  }

  @keyframes turn {
    to { transform: rotate(1turn); }
  }
`);

export default class AnalogClock extends HTMLElement {
  #root;
  #date;
  #numberFormatter;
  #romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

  #formatNumber(num) {
    const system = this.getAttribute('system') || 'latn';

    if (system === 'roman') return this.#romanNumerals[num - 1];
    if (system === 'romanlow') return this.#romanNumerals[num - 1].toLowerCase();
    
    if (!this.#numberFormatter) {
      this.#numberFormatter = new Intl.NumberFormat('en', { 
        numberingSystem: system
      });
    }
    return this.#numberFormatter.format(num);
  }

  #generateNumerals(count) {
    count = Math.min(12, Math.max(1, parseInt(count) || 12));
    const step = 360 / count;
    return Array.from({ length: count }, (_, i) => {
      const deg = ((i * step) + 270) % 360;
      const num = ((i * (12 / count))) % 12 || 12;
      return `<li style="--_d:${deg}deg">${this.#formatNumber(num)}</li>`;
    }).join('');
  }

  #generateIndices() {
    if (!this.hasAttribute('indices')) return '';
    const isHours = this.getAttribute('indices') === 'hours';
    const count = isHours ? 12 : 60;
    const step = 100 / count;
    const marker = this.getAttribute('marker') || '|';
    
    return Array.from({ length: count }, (_, i) => {
      const percentage = `${(i * step)}%`;
      const part = isHours || i % 5 === 0 ? 'part="index hour"' : 'part="index"';
      return `<li style="--_d:${percentage}" ${part}>${marker}</li>`;
    }).join('');
  }

  #formatDate(tzTime) {
    const date = this.getAttribute('date');
    if (!date) {
      this.#date.hidden = true;
      return '';
    }

    this.#date.hidden = false;
    const parts = {
      day: tzTime.getDate().toString().padStart(2, '0'),
      month: (tzTime.getMonth() + 1).toString().padStart(2, '0'),
      year: tzTime.getFullYear().toString()
    };

    return date.split(' ')
      .map(part => parts[part])
      .filter(Boolean)
      .join(' ');
  }

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: 'open' });
    this.#root.adoptedStyleSheets = [styles];
    this.#root.innerHTML = `
      <ul part="indices">${this.#generateIndices()}</ul>
      <ol part="numerals">${this.#generateNumerals(this.getAttribute('numerals'))}</ol>
      <nav part="hands">
        <b part="seconds"></b>
        <b part="minutes"></b>
        <b part="hours"></b>
        <time part="date"></time>
      </nav>
      <span part="label"></span>`;

    this.#date = this.#root.querySelector('[part="date"]');
    this.#root.querySelector('[part="label"]').textContent = this.getAttribute('label') || '';

    if (this.hasAttribute('steps')) {
      this.style.setProperty('--_tf', 'steps(60)');
    }

    this.updateClock();
  }

  updateClock() {
    const time = new Date();
    const tzOffset = parseInt(this.getAttribute('timezone') || '0');
    
    // Convert to UTC first, then add timezone offset
    const utc = time.getTime() + (time.getTimezoneOffset() * 60000);
    const tzTime = new Date(utc + (3600000 * tzOffset));

    const hour = -3600 * (tzTime.getHours() % 12);
    const mins = -60 * tzTime.getMinutes();
    const secs = -tzTime.getSeconds();

    // Update date display
    this.#date.textContent = this.#formatDate(tzTime);

    this.style.setProperty('--_dh', `${(hour+mins)}s`);
    this.style.setProperty('--_dm', `${mins}s`);
    this.style.setProperty('--_ds', `${secs}s`);
  }
}

customElements.define('analog-clock', AnalogClock);