const styles = `
:host {
  display: block;
  position: relative;
  mask: var(
    --video-scrub-mask,
    radial-gradient(
      circle at 50% 50%,
      #000 var(--video-scrub-mask-start, 50%),
      #0000 var(--video-scrub-mask-end, 80%)
    )
  ) no-repeat 50% 50% / 100% 100%;
}
video {
  aspect-ratio: var(--video-scrub-aspect-ratio, none);
  display: block;  
  height: auto;
  object-fit: var(--video-scrub-object-fit, cover);
  width: 100%;
}

:host::after {
  background: var(--video-scrub-overlay, linear-gradient(to bottom, #0004, #0008 25%));  
  content: '';
  inset: 0;
  pointer-events: none;
  position: absolute;  
}
`;

class VideoScrub extends HTMLElement {
  static get observedAttributes() {
    return ['min', 'max', 'src', 'value'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this._video = document.createElement('video');
    this._video.playsInline = true;
    this._video.setAttribute('playsinline', '');
    this._video.setAttribute('webkit-playsinline', '');
    this._video.muted = true;
    this._video.preload = 'metadata';
    this._video.disablePictureInPicture = true;
    this._video.disableRemotePlayback = true;
    this._video.controls = false;
    this._video.setAttribute('aria-hidden', 'true');
    this._video.tabIndex = -1;

    // Adopt component styles
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styles);
    this.shadowRoot.adoptedStyleSheets = [sheet];

    this.shadowRoot.appendChild(this._video);

    this._min = 0;
    this._max = 100;
    this._value = 0;
    this._isMetadataReady = false;

    this._onMetadata = this._onMetadata.bind(this);
  }

  connectedCallback() {
    // Initialize from attributes
    if (this.hasAttribute('min')) this._min = Number(this.getAttribute('min')) || 0;
    if (this.hasAttribute('max')) this._max = Number(this.getAttribute('max')) || 100;
    if (this.hasAttribute('value')) this._value = Number(this.getAttribute('value')) || 0;
    if (this.hasAttribute('src')) this._video.src = this.getAttribute('src');
    if (this.hasAttribute('poster')) this._video.poster = this.getAttribute('poster') || '';
    if (this.hasAttribute('crossorigin')) this._video.crossOrigin = this.getAttribute('crossorigin') || 'anonymous';
    if (this.hasAttribute('preload')) this._video.preload = this.getAttribute('preload') || 'metadata';

    this._video.addEventListener('loadedmetadata', this._onMetadata);
    this._video.addEventListener('durationchange', this._onMetadata);

    // If metadata is already available (cached), update immediately
    if (Number.isFinite(this._video.duration) && this._video.duration > 0) {
      this._isMetadataReady = true;
      this._syncCurrentTime();
    }
  }

  disconnectedCallback() {
    this._video.removeEventListener('loadedmetadata', this._onMetadata);
    this._video.removeEventListener('durationchange', this._onMetadata);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch (name) {
      case 'src':
        this._video.src = newValue ?? '';
        this._isMetadataReady = false;
        break;
      case 'poster':
        this._video.poster = newValue ?? '';
        break;
      case 'crossorigin':
        this._video.crossOrigin = newValue ?? 'anonymous';
        break;
      case 'preload':
        this._video.preload = newValue ?? 'metadata';
        break;
      case 'min':
        this._min = Number(newValue);
        break;
      case 'max':
        this._max = Number(newValue);
        break;
      case 'value':
        this._value = Number(newValue);
        break;
    }

    // Keep time in sync on any change
    this._syncCurrentTime();
  }

  // Properties for convenient programmatic control
  get src() { return this.getAttribute('src') ?? ''; }
  set src(v) {
    if (v == null) this.removeAttribute('src');
    else this.setAttribute('src', String(v));
  }

  get min() { return this._min; }
  set min(v) {
    const num = Number(v);
    this._min = Number.isFinite(num) ? num : 0;
    this.setAttribute('min', String(this._min));
    this._syncCurrentTime();
  }

  get max() { return this._max; }
  set max(v) {
    const num = Number(v);
    this._max = Number.isFinite(num) ? num : 100;
    this.setAttribute('max', String(this._max));
    this._syncCurrentTime();
  }

  get value() { return this._value; }
  set value(v) {
    const num = Number(v);
    this._value = Number.isFinite(num) ? num : 0;
    this.setAttribute('value', String(this._value));
    this._syncCurrentTime();
  }

  _onMetadata() {
    if (Number.isFinite(this._video.duration) && this._video.duration > 0) {
      this._isMetadataReady = true;
      this._syncCurrentTime();
    }
  }

  _syncCurrentTime() {
    if (!this._isMetadataReady) return;

    const range = this._max - this._min;
    const duration = this._video.duration;
    if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(range) || range <= 0) {
      return;
    }

    const clamped = Math.min(this._max, Math.max(this._min, this._value));
    const progress = (clamped - this._min) / range; // 0..1
    const newTime = progress * duration;

    if (Number.isFinite(newTime) && newTime >= 0 && newTime <= duration) {
      this._video.currentTime = newTime;
    }
  }
}

customElements.define('video-scrub', VideoScrub);
export default VideoScrub;
