const style = `
  :host * { box-sizing: border-box; text-box: text; }
  button { border: 0; }
  fieldset:popover-open {
    border: 1px solid light-dark(#DDD, #333);
    border-radius: .5em;
    box-shadow: 0 4px 8px #0001;
    font-size: small;
    gap: .5em;
    inset: auto;
    left: anchor(left);
    top: anchor(bottom);
    padding: 1em;
    width: 300px;
  }
  label {
    display: grid;
    input, select { grid-area: 2 / 1 / 3 / 3; }
  }
  legend { display: contents; font-weight: 700; }
  nav { align-items: center; display: flex; gap: 0.5ch; margin-block: 1em; }
  output { text-align: end; }
  select { font: inherit; }
  svg { fill: currentColor; height: 1.5em; width: 1.5em; }

  [part="controls-button"] { anchor-name: --rt; background: none; text-decoration: underline; }
  [part="play"] .pause, [part="play"].paused .play { display: none; }
  [part="play"].paused .pause { display: inline-grid; }
  [part="play"] {
    aspect-ratio: 1;
    background: light-dark(#DDD, #333);
    border-radius: 50%;
    color: light-dark(#333, #DDD);
    display: inline-grid; 
    place-content: center;
  }

  :host([position*="center"]) nav { justify-content: center; }
  :host([position*="end"]) nav { justify-content: end; }
`;

class ReadThis extends HTMLElement {
  static #current = null;
  static #voices = [];
  static #voicesPromise = null;
  static i18n = { 
    'en-US': { 
      play: 'Play', pause: 'Pause', resume: 'Resume', controls: 'Controls', 
      speed: 'Speed', pitch: 'Pitch', volume: 'Volume', voice: 'Voice' 
    }
  };
  static observedAttributes = ['pitch', 'rate', 'voice', 'volume'];

  static #initVoices() {
    if (this.#voicesPromise) return this.#voicesPromise;
    
    return this.#voicesPromise = new Promise(resolve => {
      const setVoices = () => {
        this.#voices = speechSynthesis.getVoices();
        if (this.#voices.length) {
          speechSynthesis.onvoiceschanged = null;
          resolve();
        }
      };
      speechSynthesis.onvoiceschanged = setVoices;
      setVoices();
    });
  }

  #updating = false;
  #charIndex = 0;
  #config = { lang: 'en-US', rate: 1, pitch: 1, volume: 1, text: '', voice: null };
  #translations = {};
  #targetElement = null;
  #originalHTML = '';
  #words = [];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.synthesis = speechSynthesis;
    this.utterance = new SpeechSynthesisUtterance();
    
    this.utterance.onboundary = e => {
      this.#charIndex = e.charIndex;
      if (e.name === 'word') this.#highlightNextWord(e.charIndex);
    };
    
    this.utterance.onstart = () => { 
      this.#charIndex = 0; 
      this.#updateBtn(true);
      this.#setupHighlighting();
    };
    
    this.utterance.onend = () => { 
      this.#charIndex = 0; 
      this.#updateBtn(false); 
      this.#clearHighlighting();
      ReadThis.#current = null; 
    };
    
    this.utterance.onpause = () => this.#updateBtn(true, true);
    this.utterance.onresume = () => this.#updateBtn(true);
  }

  connectedCallback() {
    ReadThis.#initVoices().then(() => {
      this.#render();
      this.#update();
    });
  }

  attributeChangedCallback(name, old, val) {
    if (old === val) return;
    if (name === 'i18n' && val) {
      try { this.#translations = JSON.parse(val); } catch {}
    }
    if (!this.#updating) {
      this.#updating = true;
      queueMicrotask(() => { this.#update(); this.#updating = false; });
    }
  }

  #t(key) {
    const lang = this.getAttribute('lang') || 'en-US';
    return this.#translations[lang]?.[key] || ReadThis.i18n[lang]?.[key] || ReadThis.i18n['en-US'][key];
  }

  #render() {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(style);
    this.shadowRoot.adoptedStyleSheets = [sheet];
    
    const hasControls = this.hasAttribute('controls');
    const positionTop = this.getAttribute('position')?.includes('top');

    this.shadowRoot.innerHTML = `
      ${positionTop ? '' : '<slot></slot>'}
      <nav part="button-container">
        <button part="play" type="button" title="${this.#t('play')}">
          <svg viewBox="0 0 24 24" class="play"><path d="M8 5v14l11-7z"/></svg>
          <svg viewBox="0 0 24 24" class="pause"><path d="M6 4h4v16h-4zM14 4h4v16h-4z"/></svg>
        </button>
        ${hasControls ? `
        <button part="controls-button" type="button" popovertarget="controls-popover">${this.#t('controls')}</button>
        <fieldset id="controls-popover" popover part="controls">
          <legend>${this.#t('controls')}</legend>
          <label><span>${this.#t('speed')}:</span><input type="range" min="0.1" max="3" step="0.1" name="rate"><output></output></label>
          <label><span>${this.#t('pitch')}:</span><input type="range" min="0" max="2" step="0.1" name="pitch"><output></output></label>
          <label><span>${this.#t('volume')}:</span><input type="range" min="0" max="1" step="0.1" name="volume"><output></output></label>
          <label><span>${this.#t('voice')}:</span><select name="voice"></select></label>
        </fieldset>` : ''}
      </nav>
      ${positionTop ? '<slot></slot>' : ''}
    `;
    
    const playBtn = this.shadowRoot.querySelector('[part="play"]');
    const controls = this.shadowRoot.querySelector('[part="controls"]');
    
    playBtn.onclick = () => this.#toggle();
    
    if (hasControls && controls) {
      controls.oninput = e => {
        const { name, value } = e.target;
        if (name === 'voice') {
          this.setAttribute('voice', ReadThis.#voices[value].name);
        } else {
          this.setAttribute(name, value);
        }
        if (this.synthesis.speaking && ReadThis.#current === this && ['rate', 'pitch', 'volume'].includes(name)) {
          this.#restartFromCurrentPosition();
        }
      };
    }
  }

  #update() {
    const el = this.getAttribute('element');
    const text = el ? (document.querySelector(el)?.textContent || '').trim() : this.getAttribute('text') || this.textContent.trim();

    // Store target element for highlighting (only if highlight attribute is present and not using text attribute)
    this.#targetElement = this.hasAttribute('highlight') && !this.getAttribute('text') ? 
      (el ? document.querySelector(el) : this) : null;

    this.#config.lang = this.getAttribute('lang') || 'en-US';
    this.#config.rate = +(this.getAttribute('rate') ?? 1);
    this.#config.pitch = +(this.getAttribute('pitch') ?? 1);
    this.#config.volume = +(this.getAttribute('volume') ?? 1);
    this.#config.text = text;

    const voiceAttr = this.getAttribute('voice');
    if (ReadThis.#voices?.length) {
      this.#config.voice = voiceAttr ? 
        ReadThis.#voices.find(v => v.name === voiceAttr || v.lang === voiceAttr) :
        ReadThis.#voices.find(v => v.lang.startsWith(this.#config.lang.split('-')[0])) || ReadThis.#voices[0];
    }
    
    Object.assign(this.utterance, this.#config);
    
    if (this.hasAttribute('controls')) this.#updateUI();
    this.#updateBtn(this.synthesis.speaking, this.synthesis.paused);
  }
  
  #updateUI() {
    const controls = this.shadowRoot.querySelector('[part="controls"]');
    if (!controls) return;

    ['rate', 'pitch', 'volume'].forEach(prop => {
      const input = controls.elements[prop];
      if (input) {
        input.value = this.#config[prop];
        input.nextElementSibling.textContent = this.#config[prop];
      }
    });

    const select = controls.elements.voice;
    if (select && ReadThis.#voices?.length) {
      const langPrefix = this.#config.lang.split('-')[0].toLowerCase();
      const voicesToShow = ReadThis.#voices.filter(v => 
        v.lang.toLowerCase().startsWith(langPrefix)
      );
      
      const finalVoices = voicesToShow.length ? voicesToShow : ReadThis.#voices;
      select.innerHTML = finalVoices.map(voice => {
        const idx = ReadThis.#voices.indexOf(voice);
        const selected = voice === this.#config.voice ? ' selected' : '';
        return `<option value="${idx}"${selected}>${voice.name} (${voice.lang})</option>`;
      }).join('');
    }
  }

  #setupHighlighting() {
    if (!this.#targetElement) return;
    this.#originalHTML = this.#targetElement.innerHTML;
    
    // Pre-calculate word positions for more accurate highlighting
    const text = this.#targetElement.textContent;
    this.#words = [];
    
    const wordRegex = /\S+/g;
    let match;
    while ((match = wordRegex.exec(text)) !== null) {
      this.#words.push({
        word: match[0],
        start: match.index,
        end: match.index + match[0].length
      });
    }
  }

  #clearHighlighting() {
    if (!this.#targetElement || !this.#originalHTML) return;
    this.#targetElement.innerHTML = this.#originalHTML;
  }

  #highlightNextWord(currentCharIndex) {
    if (!this.#targetElement || !this.#words.length) return;
    
    // Find the next word to highlight (the one currently being spoken)
    const nextWord = this.#words.find(w => w.start >= currentCharIndex);
    if (!nextWord) return;
    
    const text = this.#targetElement.textContent;
    const beforeWord = text.slice(0, nextWord.start);
    const word = nextWord.word;
    const afterWord = text.slice(nextWord.end);
    
    this.#targetElement.innerHTML = 
      this.#escapeHtml(beforeWord) + 
      `<mark>${this.#escapeHtml(word)}</mark>` + 
      this.#escapeHtml(afterWord);
  }

  #escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  #toggle() {
    const { speaking, paused } = this.synthesis;
    const isCurrentInstance = ReadThis.#current === this;

    if (speaking && !isCurrentInstance) {
      ReadThis.#current?.stop();
      this.play();
    } else if (speaking && paused) {
      this.synthesis.resume();
    } else if (speaking) {
      this.synthesis.pause();
    } else {
      this.play();
    }
  }

  #updateBtn(speaking, paused = false) {
    const btn = this.shadowRoot.querySelector('[part="play"]');
    if (!btn) return;
    btn.classList.toggle('paused', speaking && !paused);
    btn.title = this.#t(speaking && !paused ? 'pause' : paused ? 'resume' : 'play');
  }

  #restartFromCurrentPosition() {
    this.synthesis.cancel();
    this.utterance.text = this.#config.text.slice(this.#charIndex);
    this.synthesis.speak(this.utterance);
  }

  // Public API methods
  play() {
    if (!this.#config?.text) return;
    this.utterance.text = this.#config.text;
    this.synthesis.cancel();
    this.synthesis.speak(this.utterance);
    ReadThis.#current = this;
  }

  pause() { this.synthesis.pause(); }
  
  stop() { 
    this.synthesis.cancel();
    this.#clearHighlighting();
  }
  
  setText(text) { this.setAttribute('text', text); }
  restartFromCurrentPosition() { this.#restartFromCurrentPosition(); }
}

customElements.define('read-this', ReadThis);