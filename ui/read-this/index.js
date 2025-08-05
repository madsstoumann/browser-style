const style = `
  :host {
    display: block;
  }

  [part="content"] {
    margin-bottom: 0.75rem;
  }

  [part="button-container"] {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  [part="play-button"],
  [part="controls-button"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.375rem 0.75rem;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
  }

  [part="play-button"] .icon-pause,
  [part="play-button"]:not(.paused) .icon-play {
    display: none;
  }

  [part="play-button"].paused .icon-pause {
    display: inline-block;
  }

  [part="play-button"] {
    background: #007acc;
  }

  [part="controls-button"] {
    background: #6c757d;
  }

  [part="controls"] {
    padding: 1rem;
    border: 1px solid #ccc;
    border-radius: 8px;
    background: white;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    min-width: 300px;
  }

    [part="control-label"] {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

  [part="control-label"] span {
    min-width: 60px;
    font-weight: 500;
  }

  [part="control-label"] input[type="range"] {
    flex: 1;
  }

  [part="control-label"] select {
    flex: 1;
  }

  [part="control-output"] {
    min-width: 40px;
    text-align: center;
    font-family: monospace;
  }
  svg {
    width: 1.5em;
    height: 1.5em;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;

class ReadThis extends HTMLElement {
  static #icons = {
    controls: 'M14 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0, M4 6l8 0, M16 6l4 0, M8 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0, M4 12l2 0, M10 12l10 0, M17 18m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0, M4 18l11 0, M19 18l1 0',
    pause: 'M9 4h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2z, M17 4h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2z',
    play: 'M6 4v16a1 1 0 0 0 1.524 .852l13 -8a1 1 0 0 0 0 -1.704l-13 -8a1 1 0 0 0 -1.524 .852z'
  };
  static #voicesPromise = null;
  static #sharedVoices = [];
  static i18n = {
    'en-US': {
      play: 'Play',
      pause: 'Pause',
      resume: 'Resume',
      controls: 'Controls',
      speed: 'Speed',
      pitch: 'Pitch',
      volume: 'Volume',
      voice: 'Voice'
    }
  };

  static get observedAttributes() {
    return ['lang', 'voice', 'rate', 'pitch', 'volume', 'text', 'element'];
  }

  static async #loadVoicesShared() {
    if (ReadThis.#voicesPromise) return ReadThis.#voicesPromise;
    return (ReadThis.#voicesPromise = new Promise(resolve => {
      const setVoices = () => {
        ReadThis.#sharedVoices = window.speechSynthesis.getVoices();
        resolve(ReadThis.#sharedVoices);
      };
      if (window.speechSynthesis.getVoices().length) setVoices();
      else window.speechSynthesis.addEventListener('voiceschanged', setVoices, { once: true });
    }));
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this.synthesis = window.speechSynthesis;
    this.utterance = new SpeechSynthesisUtterance();
    this.currentCharIndex = 0;
    this.config = {};
  }

  #t(key) {
    const lang = this.getAttribute('lang') || 'en-US';
    return ReadThis.i18n[lang]?.[key] || ReadThis.i18n['en-US'][key];
  }

  #render() {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(style);
    this.shadowRoot.adoptedStyleSheets = [sheet];
    this.shadowRoot.innerHTML = `
      <slot></slot>
      <div part="button-container">
        <button part="play-button" type="button" title="${this.#t('play')}">
          ${this.#icon(ReadThis.#icons.play, 'icon-play')}
          ${this.#icon(ReadThis.#icons.pause, 'icon-pause')}
        </button>
        <button part="controls-button" type="button" popovertarget="controls-popover" title="${this.#t('controls')}">
          ${this.#icon(ReadThis.#icons.controls)}
        </button>
      </div>
      <fieldset id="controls-popover" popover part="controls">
        <legend>${this.#t('controls')}</legend>
        <label part="control-label">
          <span>${this.#t('speed')}:</span>
          <input type="range" min="0.1" max="3" step="0.1" data-control="rate">
          <output part="control-output"></output>
        </label>
        <label part="control-label">
          <span>${this.#t('pitch')}:</span>
          <input type="range" min="0" max="2" step="0.1" data-control="pitch">
          <output part="control-output"></output>
        </label>
        <label part="control-label">
          <span>${this.#t('volume')}:</span>
          <input type="range" min="0" max="1" step="0.1" data-control="volume">
          <output part="control-output"></output>
        </label>
        <label part="control-label">
          <span>${this.#t('voice')}:</span>
          <select part="control-select" data-control="voice"></select>
        </label>
      </fieldset>
    `;
  }

  async connectedCallback() {
    this.#render();
    
    this.elements = {
      playButton: this.shadowRoot.querySelector('[part="play-button"]'),
      controlsButton: this.shadowRoot.querySelector('[part="controls-button"]'),
      controls: this.shadowRoot.querySelector('[part="controls"]'),
      rate: this.shadowRoot.querySelector('[data-control="rate"]'),
      pitch: this.shadowRoot.querySelector('[data-control="pitch"]'),
      volume: this.shadowRoot.querySelector('[data-control="volume"]'),
      voice: this.shadowRoot.querySelector('[data-control="voice"]'),
    };

    await ReadThis.#loadVoicesShared();
    this.#updateConfig();
    this.#setupEventListeners();
  }

  attributeChangedCallback() {
    if(this.elements) {
      this.#updateConfig();
    }
  }

  #icon(paths, part) {
    return `<svg viewBox="0 0 24 24"${part ? ` class="${part}"` : ''}>${
      paths.split(',').map(path => `<path d="${path}"></path>`).join('')
    }</svg>`;
  }

  #updateConfig() {
    const elementAttr = this.getAttribute('element');
    const text = elementAttr ? (document.querySelector(elementAttr)?.textContent || '').trim() : this.getAttribute('text') || this.textContent.trim();

    const config = {
      lang: this.getAttribute('lang') || 'en-US',
      rate: parseFloat(this.getAttribute('rate')) || 1.0,
      pitch: parseFloat(this.getAttribute('pitch')) || 1.0,
      volume: parseFloat(this.getAttribute('volume')) || 1.0,
      text: text,
      voice: null,
    };

    const voiceAttr = this.getAttribute('voice');
    if (voiceAttr && ReadThis.#sharedVoices.length) {
      config.voice = ReadThis.#sharedVoices.find(v => v.name === voiceAttr || v.lang === voiceAttr) || ReadThis.#sharedVoices[0];
    } else if (ReadThis.#sharedVoices.length) {
      config.voice = ReadThis.#sharedVoices.find(v => v.lang.startsWith(config.lang.split('-')[0])) || ReadThis.#sharedVoices[0];
    }
    
    this.config = config;
    this.#updateUI();
    this.#updateUtterance();
  }
  
  #updateUI() {
    ['rate', 'pitch', 'volume'].forEach(prop => {
        if (this.elements[prop]) {
            this.elements[prop].value = this.config[prop];
            this.elements[prop].nextElementSibling.textContent = this.config[prop];
        }
    });

    if (this.elements.voice) {
        this.elements.voice.innerHTML = ReadThis.#sharedVoices.map((voice, index) => 
            `<option value="${index}" ${voice === this.config.voice ? 'selected' : ''}>${voice.name} (${voice.lang})</option>`
        ).join('');
    }
  }

  #updateUtterance() {
    this.utterance.text = this.config.text;
    this.utterance.lang = this.config.lang;
    this.utterance.rate = this.config.rate;
    this.utterance.pitch = this.config.pitch;
    this.utterance.volume = this.config.volume;
    this.utterance.voice = this.config.voice;

    this.utterance.onboundary = (e) => { this.currentCharIndex = e.charIndex; };
    this.utterance.onstart = () => {
        this.currentCharIndex = 0;
        this.#updatePlayButton(true);
    };
    this.utterance.onend = () => {
        this.currentCharIndex = 0;
        this.#updatePlayButton(false);
    };
    this.utterance.onpause = () => this.#updatePlayButton(true, true);
    this.utterance.onresume = () => this.#updatePlayButton(true);
  }

  #setupEventListeners() {
    this.elements.playButton.addEventListener('click', () => this.#togglePlayback());
    
    this.elements.controls.addEventListener('input', (event) => {
      const control = event.target.dataset.control;
      if (control) {
        this.setAttribute(control, event.target.value);
        if (this.synthesis.speaking) {
          const isLiveUpdate = ['rate', 'pitch', 'volume'].includes(control);
          this.synthesis.cancel();
          if (isLiveUpdate) {
            this.utterance.text = this.config.text.slice(this.currentCharIndex);
            this.synthesis.speak(this.utterance);
          }
        }
      }
    });
  }

  #togglePlayback() {
    if (this.synthesis.speaking && !this.synthesis.paused) {
      this.synthesis.pause();
    } else if (this.synthesis.paused) {
      this.synthesis.resume();
    } else {
      this.utterance.text = this.config.text; // Reset text before playing
      this.synthesis.cancel();
      this.synthesis.speak(this.utterance);
    }
  }

  #updatePlayButton(speaking, paused = false) {
    this.elements.playButton.classList.toggle('paused', speaking && !paused);
    if (speaking && !paused) {
      this.elements.playButton.setAttribute('aria-label', this.#t('pause'));
    } else if (paused) {
      this.elements.playButton.setAttribute('aria-label', this.#t('resume'));
    } else {
      this.elements.playButton.setAttribute('aria-label', this.#t('play'));
    }
  }

  play() { this.synthesis.speak(this.utterance); }
  pause() { this.synthesis.pause(); }
  stop() { this.synthesis.cancel(); }
  setText(text) { this.setAttribute('text', text); }
}

customElements.define('read-this', ReadThis);
