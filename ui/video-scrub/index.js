const styles = `
:host {
  aspect-ratio: var(--video-scrub-aspect-ratio, 16/9);
  display: block;
  position: relative;
  mask: var(--video-scrub-mask, none) no-repeat 50% 50% / 100% 100%;
}

video {
  aspect-ratio: var(--video-scrub-aspect-ratio, 16/9);
  display: block;  
  height: var(--video-scrub-h, auto);
  object-fit: var(--video-scrub-object-fit, cover);
  pointer-events: none;
  width: var(--video-scrub-w, 100%);
}

:host::after {
  background: var(--video-scrub-overlay, none);  
  content: '';
  inset: 0;
  pointer-events: none;
  position: absolute;  
}
`;

/**
 * @module VideoScrub
 * @version 1.0.1
 * @author Mads Stoumann
 * @description A web component for scrubbing through video content with crossfade transitions.
 */
class VideoScrub extends HTMLElement {
  static get observedAttributes() {
    return ['min', 'max', 'src', 'value', 'poster', 'prefetch'];
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

    // Create hidden lazy-loading sensor
    this._lazySensor = document.createElement('img');
    this._lazySensor.loading = 'lazy';
    this._lazySensor.src = 'data:image/svg+xml,<svg/>';
    this._lazySensor.style.cssText = 'position:absolute;opacity:0;pointer-events:none;width:1px;height:1px';
    this._lazySensor.onload = () => this._startPrefetch();
    this.shadowRoot.appendChild(this._lazySensor);

    this._min = 0;
    this._max = 100;
    this._value = 0;
    this._isMetadataReady = false;
    this._currentAnimation = null;
    this._crossfadeDuration = 1000;
    this._prefetchStarted = false;
    this._prefetchedVideos = new Set();

    this._onMetadata = this._onMetadata.bind(this);
  }

  _createVideoElement() {
    const video = document.createElement('video');
    video.muted = video.playsInline = true;
    video.preload = 'metadata';
    video.style.cssText = 'position:absolute;inset:0';
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
    const prefetch = this.getAttribute('prefetch');
    const crossorigin = this.getAttribute('crossorigin') || 'anonymous';
    const preload = this.getAttribute('preload') || 'metadata';
    const crossfadeAttr = this.getAttribute('crossfade');
    const crossfade = crossfadeAttr ? Number(crossfadeAttr) : null;
    
    if (src) this._activeVideo.src = src;
    if (poster) this._activeVideo.poster = poster;
    
    this._activeVideo.crossOrigin = this._inactiveVideo.crossOrigin = crossorigin;
    this._crossfadeDuration = (crossfade !== null && Number.isFinite(crossfade) && crossfade > 0) ? crossfade : 1000;

    // Set preload behavior based on prefetch attribute
    if (prefetch) {
      // If prefetch exists, only load metadata initially, full loading happens in viewport
      this._activeVideo.preload = this._inactiveVideo.preload = 'metadata';
    } else {
      // No prefetch, use specified preload behavior
      this._activeVideo.preload = this._inactiveVideo.preload = preload;
      try { this._activeVideo.load(); } catch {}
    }

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
      case 'prefetch':
        // If prefetch is added/changed after initialization, trigger prefetch if already in viewport
        if (newValue && this._prefetchStarted) {
          this._prefetchStarted = false; // Reset to allow re-running
          this._startPrefetch();
        }
        break;
    }

    // Keep time in sync on any change
    this._syncCurrentTime();
  }

  get src() { return this.getAttribute('src') ?? ''; }
  set src(v) { v ? this.setAttribute('src', v) : this.removeAttribute('src'); }

  get poster() { return this.getAttribute('poster') ?? ''; }
  set poster(v) { v ? this.setAttribute('poster', v) : this.removeAttribute('poster'); }

  get min() { return this._min; }
  set min(v) { this._min = Number(v) || 0; this.setAttribute('min', this._min); this._syncCurrentTime(); }

  get max() { return this._max; }
  set max(v) { this._max = Number(v) || 100; this.setAttribute('max', this._max); this._syncCurrentTime(); }

  get value() { return this._value; }
  set value(v) { this._value = Number(v) || 0; this.setAttribute('value', this._value); this._syncCurrentTime(); }

  get crossfade() { return this._crossfadeDuration; }
  set crossfade(v) { this._crossfadeDuration = Number(v) || 1000; this.setAttribute('crossfade', this._crossfadeDuration); }

  _startPrefetch() {
    if (this._prefetchStarted) return;
    this._prefetchStarted = true;

    const prefetch = this.getAttribute('prefetch');
    const currentSrc = this.getAttribute('src');
    
    if (!prefetch) return;
    const prefetchUrls = prefetch.split(',').map(url => url.trim()).filter(Boolean);
    if (currentSrc && this._activeVideo.preload === 'metadata') {
      this._prefetchVideo(currentSrc);
    }
    prefetchUrls.forEach(url => this._prefetchVideo(url));
  }

  _prefetchVideo(url) {
    if (this._prefetchedVideos.has(url)) return;
    this._prefetchedVideos.add(url);

    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.style.display = 'none';
    video.src = url;
    
    video.onloadeddata = video.onerror = () => {
      console.log(`${video.error ? '❌' : '✅'} Video ${video.error ? 'failed' : 'fetched'}: ${url}`);
      video.remove();
    };
    
    document.body.appendChild(video);
  }

  _onMetadata() {
    if (Number.isFinite(this._activeVideo.duration) && this._activeVideo.duration > 0) {
      this._isMetadataReady = true;
      this._syncCurrentTime();
    }
  }

  _syncCurrentTime() {
    if (!this._isMetadataReady) return;

    const range = this._max - this._min;
    const duration = this._activeVideo.duration;
    if (duration <= 0 || range <= 0) return;

    const progress = (Math.min(this._max, Math.max(this._min, this._value)) - this._min) / range;
    const newTime = progress * duration;

    if (Math.abs(this._activeVideo.currentTime - newTime) > 0.1) {
      this._activeVideo.currentTime = newTime;
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