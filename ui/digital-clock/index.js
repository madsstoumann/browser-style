const styles = new CSSStyleSheet();
styles.replaceSync(`
  :host {
    all: unset;
    background-color: var(--CanvasGray);
    border-radius: var(--input-bdrs);
    direction: ltr;
    display: grid;
    font-size: var(--ui-digital-clock-fs, larger);
    font-variant-numeric: tabular-nums;
    font-weight: var(--ui-digital-clock-fw, 700);
    grid-auto-flow: column;
    inline-size: min-content;
    padding: var(--ui-digital-clock-p, 1ch 2ch);
    color-scheme: light dark;
  }

  @property --seconds {
    syntax: "<integer>";
    initial-value: 0;
    inherits: false;
  }
  @property --minutes {
    syntax: "<integer>";
    initial-value: 0;
    inherits: false;
  }
  @property --hours {
    syntax: "<integer>";
    initial-value: 0;
    inherits: false;
  }

  ul {
    margin: 0;
    padding: 0;
    display: flex;
  }

  li {
    list-style: none;
    white-space: nowrap;
  }
  
  li:nth-of-type(1) {
    animation: hours 86400s steps(24, end) infinite;
    animation-delay: var(--delay-hours, 0s);
    counter-reset: hours var(--hours);
  }
  
  li:nth-of-type(1)::after {
    content: counter(hours, decimal-leading-zero) ' ';
  }
  
  li:nth-of-type(2) {
    animation: minutes 3600s steps(60, end) infinite;
    animation-delay: var(--delay-minutes, 0s);
    counter-reset: minutes var(--minutes);
  }
  
  li:nth-of-type(2)::before {
    content: ':';
  }
  
  li:nth-of-type(2)::after {
    content: counter(minutes, decimal-leading-zero) ' ';
  }
  
  li:nth-of-type(3) {
    animation: seconds 60s steps(60, end) infinite;
    animation-delay: var(--delay-seconds, 0s);
    counter-reset: seconds var(--seconds);
  }
  
  li:nth-of-type(3)::before {
    content: ':';
  }
  
  li:nth-of-type(3)::after {
    content: counter(seconds, decimal-leading-zero) ' ';
  }
  
  .date {
    display: block;
    font-size: 0.8em;
    margin-top: 0.5em;
    font-weight: normal;
    color: var(--digital-clock-date-color, currentColor);
  }

  .label {
    display: block;
    font-size: 0.9em;
    margin-bottom: 0.5em;
    font-weight: 600;
    color: var(--digital-clock-label-color, currentColor);
  }

  @keyframes hours {
    from { --hours: 0; }
    to { --hours: 24; } 
  }
  @keyframes minutes { 
    from { --minutes: 0; }
    to { --minutes: 60; } 
  }
  @keyframes seconds { 
    from { --seconds: 0;}
    to { --seconds: 60; }
  }
`);

export default class DigitalClock extends HTMLElement {
  #root;
  #dateEl;
  #labelEl;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: 'open' });
    this.#root.adoptedStyleSheets = [styles];
    
    // Create clock structure
    this.#root.innerHTML = `
      <div class="wrapper">
        <span class="label"></span>
        <ul>
          <li></li>
          <li></li>
          <li></li>
        </ul>
        <span class="date"></span>
      </div>
    `;
    
    this.#dateEl = this.#root.querySelector('.date');
    this.#labelEl = this.#root.querySelector('.label');
    
    // Set label if provided
    const label = this.getAttribute('label');
    if (label) {
      this.#labelEl.textContent = label;
    } else {
      this.#labelEl.style.display = 'none';
    }

    this.updateClock();
  }

  connectedCallback() {
    // Update every minute to keep date current
    this.interval = setInterval(() => this.updateClock(), 60000);
  }

  disconnectedCallback() {
    clearInterval(this.interval);
  }

  updateClock() {
    const time = new Date();
    const tzOffset = parseInt(this.getAttribute('timezone') || '0');
    
    // Convert to UTC first, then add timezone offset
    const utc = time.getTime() + (time.getTimezoneOffset() * 60000);
    const tzTime = new Date(utc + (3600000 * tzOffset));
    
    const hours = tzTime.getHours() * 3600;
    const minutes = tzTime.getMinutes() * 60;
    const seconds = tzTime.getSeconds();
    
    this.style.setProperty('--delay-hours', `-${hours + minutes + seconds}s`);
    this.style.setProperty('--delay-minutes', `-${minutes + seconds}s`);
    this.style.setProperty('--delay-seconds', `-${seconds}s`);
    
    // Update date display if needed
    this.#updateDate(tzTime);
  }
  
  #updateDate(tzTime) {
    const dateAttr = this.getAttribute('date');
    if (dateAttr) {
      this.#dateEl.textContent = dateAttr === 'full' 
        ? this.#formatFullDate(tzTime)
        : ''; // Could add other date format options here
      this.#dateEl.hidden = false;
    } else {
      this.#dateEl.hidden = true;
    }
  }
  
  #formatFullDate(date) {
    // Format full date using Intl API
    const options = { 
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return new Intl.DateTimeFormat(navigator.language, options).format(date);
  }
}

customElements.define('digital-clock', DigitalClock);
