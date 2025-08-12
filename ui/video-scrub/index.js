const styles = `
:host {
  display: block;
  position: relative;
  mask: var(--video-scrub-mask, none) no-repeat 50% 50% / 100% 100%;
}

video {
  aspect-ratio: var(--video-scrub-aspect-ratio, none);
  display: block;  
  height: var(--video-scrub-h, auto);
  object-fit: var(--video-scrub-object-fit, cover);
  width: var(--video-scrub-w, 100%);
}

:host::after {
  background: var(--video-scrub-overlay, linear-gradient(to bottom, #0004, #0008 25%));  
  content: '';
  inset: 0;
  pointer-events: none;
  position: absolute;  
}
`;

/**
 * @module VideoScrub
 * @version 1.0.0
 * @author Mads Stoumann
 * @description A web component for scrubbing through video content with crossfade transitions.
 */
class VideoScrub extends HTMLElement {
  static get observedAttributes() {
    return ['min', 'max', 'src', 'value', 'poster'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Create two video elements for crossfading
    this._videoA = this._createVideoElement();
    this._videoB = this._createVideoElement();
    this._videoB.style.opacity = '0';
    
    // Track which video is currently active
    this._activeVideo = this._videoA;
    this._inactiveVideo = this._videoB;

    // Adopt component styles
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styles);
    this.shadowRoot.adoptedStyleSheets = [sheet];

    this.shadowRoot.appendChild(this._videoA);
    this.shadowRoot.appendChild(this._videoB);

    this._min = 0;
    this._max = 100;
    this._value = 0;
    this._isMetadataReady = false;
    this._lastSyncTime = 0;
    this._syncThreshold = 16; // ~60fps throttling
    this._currentAnimation = null;
    this._crossfadeDuration = 1000; // Default 1 second

    this._onMetadata = this._onMetadata.bind(this);
  }

  _createVideoElement() {
    const video = document.createElement('video');
    Object.assign(video, {
      playsInline: true,
      muted: true,
      preload: 'metadata',
      disablePictureInPicture: true,
      disableRemotePlayback: true,
      controls: false,
      tabIndex: -1
    });
    Object.assign(video.style, {
      position: 'absolute',
      inset: '0'
    });
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('aria-hidden', 'true');
    return video;
  }

  connectedCallback() {
    // Initialize from attributes
    this._min = Number(this.getAttribute('min')) || 0;
    this._max = Number(this.getAttribute('max')) || 100;
    this._value = Number(this.getAttribute('value')) || 0;
    
    const src = this.getAttribute('src');
    const poster = this.getAttribute('poster');
    const crossorigin = this.getAttribute('crossorigin') || 'anonymous';
    const preload = this.getAttribute('preload') || 'metadata';
    const crossfadeAttr = this.getAttribute('crossfade');
    const crossfade = crossfadeAttr ? Number(crossfadeAttr) : null;
    
    if (src) this._activeVideo.src = src;
    if (poster) this._activeVideo.poster = poster;
    
    this._activeVideo.crossOrigin = this._inactiveVideo.crossOrigin = crossorigin;
    this._activeVideo.preload = this._inactiveVideo.preload = preload;
    this._crossfadeDuration = (crossfade !== null && Number.isFinite(crossfade) && crossfade > 0) ? crossfade : 1000;

    try { this._activeVideo.load(); } catch {}

    this._activeVideo.addEventListener('loadedmetadata', this._onMetadata);
    this._activeVideo.addEventListener('durationchange', this._onMetadata);

    if (Number.isFinite(this._activeVideo.duration) && this._activeVideo.duration > 0) {
      this._isMetadataReady = true;
      this._syncCurrentTime();
    }
  }

  disconnectedCallback() {
    this._activeVideo.removeEventListener('loadedmetadata', this._onMetadata);
    this._activeVideo.removeEventListener('durationchange', this._onMetadata);
    this._currentAnimation?.cancel();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch (name) {
      case 'src':
        if (oldValue && newValue) {
          this._crossfadeToNewVideo(newValue);
        } else {
          this._activeVideo.src = newValue ?? '';
          this._isMetadataReady = false;
        }
        break;
      case 'poster':
        this._activeVideo.poster = newValue ?? '';
        break;
      case 'crossorigin':
        const crossorigin = newValue ?? 'anonymous';
        this._activeVideo.crossOrigin = crossorigin;
        this._inactiveVideo.crossOrigin = crossorigin;
        break;
      case 'preload':
        const preload = newValue ?? 'metadata';
        this._activeVideo.preload = preload;
        this._inactiveVideo.preload = preload;
        break;
      case 'min':
      case 'max':
      case 'value':
        this[`_${name}`] = Number(newValue);
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

  get poster() { return this.getAttribute('poster') ?? ''; }
  set poster(v) {
    if (v == null) this.removeAttribute('poster');
    else this.setAttribute('poster', String(v));
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

  get crossfade() { return this._crossfadeDuration; }
  set crossfade(v) {
    const num = Number(v);
    this._crossfadeDuration = Number.isFinite(num) && num > 0 ? num : 1000;
    this.setAttribute('crossfade', String(this._crossfadeDuration));
  }

  _onMetadata() {
    if (Number.isFinite(this._activeVideo.duration) && this._activeVideo.duration > 0) {
      this._isMetadataReady = true;
      this._syncCurrentTime();
    }
  }

  _syncCurrentTime() {
    if (!this._isMetadataReady) return;

    // Throttle updates to prevent excessive seeking
    const now = performance.now();
    if (now - this._lastSyncTime < this._syncThreshold) return;
    this._lastSyncTime = now;

    const range = this._max - this._min;
    const duration = this._activeVideo.duration;
    if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(range) || range <= 0) {
      return;
    }

    const clamped = Math.min(this._max, Math.max(this._min, this._value));
    const progress = (clamped - this._min) / range; // 0..1
    const newTime = progress * duration;

    if (Number.isFinite(newTime) && newTime >= 0 && newTime <= duration) {
      // Only update if there's a meaningful difference to prevent micro-adjustments
      const timeDiff = Math.abs(this._activeVideo.currentTime - newTime);
      if (timeDiff > 0.1) { // 100ms threshold
        this._activeVideo.currentTime = newTime;
      }
    }
  }

  _crossfadeToNewVideo(newSrc) {
    this._currentAnimation?.cancel();

    this._inactiveVideo.src = newSrc;
    this._inactiveVideo.poster = '';
    this._inactiveVideo.style.opacity = '0';

    const handleNewVideoReady = () => {
      this._inactiveVideo.removeEventListener('loadedmetadata', handleNewVideoReady);
      this._inactiveVideo.removeEventListener('error', handleError);
      
      const range = this._max - this._min;
      const clamped = Math.min(this._max, Math.max(this._min, this._value));
      const progress = (clamped - this._min) / range;
      const targetTime = progress * this._inactiveVideo.duration;

      if (Number.isFinite(targetTime) && targetTime >= 0 && targetTime <= this._inactiveVideo.duration) {
        this._inactiveVideo.currentTime = targetTime;
        
        const performCrossfade = () => {
          this._inactiveVideo.removeEventListener('seeked', performCrossfade);
          
          const fadeOut = this._activeVideo.animate([
            { opacity: '1' },
            { opacity: '0' }
          ], {
            duration: this._crossfadeDuration,
            easing: 'ease-in-out'
          });

          this._inactiveVideo.animate([
            { opacity: '0' },
            { opacity: '1' }
          ], {
            duration: this._crossfadeDuration,
            easing: 'ease-in-out'
          });

          this._currentAnimation = fadeOut;

          fadeOut.addEventListener('finish', () => {
            // Swap video references
            [this._activeVideo, this._inactiveVideo] = [this._inactiveVideo, this._activeVideo];
            
            this._activeVideo.style.opacity = '1';
            this._inactiveVideo.style.opacity = '0';
            this._isMetadataReady = true;
            
            // Update event listeners
            this._inactiveVideo.removeEventListener('loadedmetadata', this._onMetadata);
            this._inactiveVideo.removeEventListener('durationchange', this._onMetadata);
            this._activeVideo.addEventListener('loadedmetadata', this._onMetadata);
            this._activeVideo.addEventListener('durationchange', this._onMetadata);
            
            this._currentAnimation = null;
          });
        };

        if (targetTime === 0) {
          performCrossfade();
        } else {
          this._inactiveVideo.addEventListener('seeked', performCrossfade);
        }
      } else {
        this._activeVideo.src = newSrc;
        this._isMetadataReady = false;
      }
    };

    const handleError = () => {
      this._inactiveVideo.removeEventListener('loadedmetadata', handleNewVideoReady);
      this._inactiveVideo.removeEventListener('error', handleError);
      this._activeVideo.src = newSrc;
      this._isMetadataReady = false;
    };

    this._inactiveVideo.addEventListener('loadedmetadata', handleNewVideoReady);
    this._inactiveVideo.addEventListener('error', handleError);
  }

}

customElements.define('video-scrub', VideoScrub);
export default VideoScrub;