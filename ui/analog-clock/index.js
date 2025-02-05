const styles = new CSSStyleSheet();
styles.replaceSync(`
  :host {
    --analog-clock-num-sz: 15cqi;
    --_c: light-dark(hsl(0, 0%, 15%), hsl(0, 0%, 85%));
    aspect-ratio: 1;
    background: light-dark(hsl(0, 0%, 95%), hsl(0, 0%, 15%));
    border-radius: 50%;
    color: var(--_c);
    color-scheme: light dark;
    container-type: inline-size;
    font-family: var(--analog-clock-ff, ui-sans-serif, system-ui, sans-serif);
    display: grid;
    grid-template-rows: repeat(3, 1fr);
    inline-size: 100%;
    position: relative;
  }

  :host::part(label) { 
    font-size: var(--analog-clock-label-fs, 5cqi);
    font-weight: var(--analog-clock-label-fw, 600);
    grid-area: 3 / 1 / 4 / 2;
    place-self: start center;
  }
  :host::part(numerals) {
    display: contents;
  }

  :host li {
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
    background-color: var(--_c);
    border-radius: 50%;
    content: "";
    grid-area: 1 / 2 / 1 / 3;
    height: 8cqi;
    isolation: isolate;
    place-self: center;
  }

  :host::part(date) { 
    border: .25cqi solid currentColor;
    color: var(--analog-clock-day-c, #888);
    display: grid;
    font-family: var(--analog-clock-day-ff, ui-monospace, monospace);
    font-size: var(--analog-clock-day-fs, 5cqi);
    grid-area: 1 / 3 / 1 / 4;
    padding: 0 1ch;
    place-content: center;
    place-self: center start;
  }
  :host b {
    background-color: var(--_bg, currentColor);
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
  }

  :host::part(minutes) {
    --_h: 45%;
    --_w: 2cqi;
    animation: turn 3600s steps(60, end) infinite;
    animation-delay: var(--_dm, 0ms);
  }

  :host::part(seconds) {
    --_bg: #ff8c05;
    --_h: 45%;
    --_w: 1cqi;
    animation: turn 60s linear infinite;
    animation-delay: var(--_ds, 0ms);
  }

  @keyframes turn {
    to { transform: rotate(1turn); }
  }
`);

export default class AnalogClock extends HTMLElement {
  #root;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: 'open' });
    this.#root.adoptedStyleSheets = [styles];
    this.#root.innerHTML = `
      <ol part="numerals">
        <li style="--_d:300deg">1</li>
        <li style="--_d:330deg">2</li>
        <li style="--_d:0deg">3</li>
        <li style="--_d:30deg">4</li>
        <li style="--_d:60deg">5</li>
        <li style="--_d:90deg">6</li>
        <li style="--_d:120deg">7</li>
        <li style="--_d:150deg">8</li>
        <li style="--_d:180deg">9</li>
        <li style="--_d:210deg">10</li>
        <li style="--_d:240deg">11</li>
        <li style="--_d:270deg">12</li>
      </ol>
      <nav part="hands">
        <b part="seconds"></b>
        <b part="minutes"></b>
        <b part="hours"></b>
        <time part="date"></time>
      </nav>
      <span part="label"></span>`;

    this.#root.querySelector('[part="label"]').textContent = this.getAttribute('label') || '';

    if (this.hasAttribute('steps')) {
      this.#root.querySelector('[part="seconds"]').style.animation = 'turn 60s steps(60) infinite';
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
    const day = tzTime.getDate().toString().padStart(2, '0');
    this.#root.querySelector('[part="date"]').textContent = day;

    this.style.setProperty('--_dh', `${(hour+mins)}s`);
    this.style.setProperty('--_dm', `${mins}s`);
    this.style.setProperty('--_ds', `${secs}s`);
  }
}

customElements.define('analog-clock', AnalogClock);