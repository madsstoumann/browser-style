/**
 * ImageEdit - Web component for image transformations
 * Implements methods from Sharp image processing library
 * 
 * NOTE: This component cannot directly use the Sharp library in the browser because:
 * 1. Sharp is a Node.js library with native C++ dependencies that cannot run in browsers
 * 2. Sharp requires file system access not available in browsers
 * 3. Sharp uses Node.js-specific APIs
 * 
 * Instead, this component can be used in several ways:
 * - As a UI interface that sends requests to a server running Sharp
 * - With a serverless function that processes images with Sharp
 * - As a interface with a different client-side image processor like Canvas API
 */
class ImageEdit extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._transforms = [];
    this._originalSrc = '';
  }

  connectedCallback() {
    this._originalSrc = this.getAttribute('src') || '';
    this._render();

    // Create a MutationObserver to watch for attribute changes
    this._observer = new MutationObserver(this._handleMutations.bind(this));
    this._observer.observe(this, { attributes: true });
  }

  disconnectedCallback() {
    if (this._observer) {
      this._observer.disconnect();
    }
  }

  _handleMutations(mutations) {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
        this._originalSrc = this.getAttribute('src') || '';
        this._applyTransforms();
      }
    }
  }

  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          position: relative;
        }
        img {
          display: block;
          max-width: 100%;
          height: auto;
        }
      </style>
      <img src="${this._originalSrc}" alt="${this.getAttribute('alt') || ''}">
    `;
    this._img = this.shadowRoot.querySelector('img');
    this._applyTransforms();
  }
  
  _applyTransforms() {
    if (!this._originalSrc) return;
    
    // Reset transforms array if needed
    if (this._resetOnApply) {
      this._transforms = [];
      this._resetOnApply = false;
    }
    
    // Implementation options:
    // 1. Send transforms to a server API that uses Sharp
    // const endpoint = this.getAttribute('endpoint') || '/api/image-process';
    // const serverUrl = `${endpoint}?transforms=${encodeURIComponent(JSON.stringify(this._transforms))}&src=${encodeURIComponent(this._originalSrc)}`;
    // this._img.src = serverUrl;
    
    // 2. Use Canvas API for browser-side processing (limited compared to Sharp)
    // this._processWithCanvas();
    
    // For demonstration, just append transform info to URL
    let processedSrc = this._originalSrc;
    
    if (this._transforms.length > 0) {
      const transformsString = this._transforms
        .map(t => `${t.method}(${t.params.join(',')})`)
        .join('_');
      
      processedSrc = `${this._originalSrc}#${transformsString}`;
    }
    
    if (this._img) {
      this._img.src = processedSrc;
    }
  }

  // Example method for Canvas-based processing (more limited than Sharp)
  // _processWithCanvas() {
  //   // Create a canvas element
  //   const canvas = document.createElement('canvas');
  //   const ctx = canvas.getContext('2d');
  //   const img = new Image();
  //   
  //   img.onload = () => {
  //     canvas.width = img.width;
  //     canvas.height = img.height;
  //     ctx.drawImage(img, 0, 0);
  //     
  //     // Apply transforms using Canvas API
  //     this._transforms.forEach(transform => {
  //       // Apply each transform with Canvas
  //       // Limited functionality compared to Sharp
  //     });
  //     
  //     // Update the image source
  //     this._img.src = canvas.toDataURL();
  //   };
  //   
  //   img.src = this._originalSrc;
  // }

  // Helper method to add a transform
  _addTransform(method, ...params) {
    this._transforms.push({ method, params });
    this._applyTransforms();
    return this; // Allow chaining
  }

  // Reset all transforms
  reset() {
    this._transforms = [];
    if (this._img) {
      this._img.src = this._originalSrc;
    }
    return this;
  }

  /* COMMON METHODS (Shared with Cloudflare) */

  // Set background color for padding or compositing
  background(color) {
    return this._addTransform('background', color);
  }

  // Apply a blur effect to the image (sigma is the blur radius)
  blur(sigma = 1) {
    return this._addTransform('blur', sigma);
  }

  // Adjust image brightness (0 is black, 1 is normal, >1 is brighter)
  brightness(factor = 1) {
    return this._addTransform('brightness', factor);
  }

  // Adjust image contrast (0 is no contrast, 1 is normal, >1 is more contrast)
  contrast(factor = 1) {
    return this._addTransform('contrast', factor);
  }

  // Set how the image should fit within the dimensions (cover, contain, fill, inside, outside)
  fit(fitMethod = 'cover') {
    return this._addTransform('fit', fitMethod);
  }

  // Convert to a different format (jpeg, png, webp, avif, etc.)
  format(formatType = 'webp') {
    return this._addTransform('format', formatType);
  }

  // Apply gamma correction
  gamma(value = 2.2) {
    return this._addTransform('gamma', value);
  }

  // Control positioning during resize or composition
  gravity(position = 'center') {
    return this._addTransform('gravity', position);
  }

  // Alias for gravity
  position(position = 'center') {
    return this.gravity(position);
  }

  // Set the height for resizing
  height(pixels) {
    return this._addTransform('height', pixels);
  }

  // Handle image metadata (keep: true/false/string[])
  metadata(options) {
    return this._addTransform('metadata', JSON.stringify(options));
  }

  // Set compression quality (1-100)
  quality(value = 80) {
    return this._addTransform('quality', value);
  }

  // Rotate image (angle in degrees, options can include background color)
  rotate(angle, options = {}) {
    return this._addTransform('rotate', angle, JSON.stringify(options));
  }

  // Adjust color saturation (0 is grayscale, 1 is normal, >1 is more saturated)
  saturation(factor = 1) {
    return this._addTransform('saturation', factor);
  }

  // Sharpen the image (sigma, flat, jagged)
  sharpen(sigma = 1, flat = 1, jagged = 0) {
    return this._addTransform('sharpen', sigma, flat, jagged);
  }

  // Trim borders or whitespace
  trim(threshold = 10) {
    return this._addTransform('trim', threshold);
  }

  // Set the width for resizing
  width(pixels) {
    return this._addTransform('width', pixels);
  }

  /* SHARP-SPECIFIC METHODS */

  // Composite images together with various blend modes
  composite(images, options = {}) {
    return this._addTransform('composite', JSON.stringify(images), JSON.stringify(options));
  }
  
  // Add pixels to edges of image
  extend(options) {
    return this._addTransform('extend', JSON.stringify(options));
  }
  
  // Extract specific region of image
  extract(region) {
    return this._addTransform('extract', JSON.stringify(region));
  }
  
  // Convert to black and white
  grayscale(greyscale = true) {
    return this._addTransform('grayscale', greyscale);
  }
  
  // Alias for grayscale
  greyscale(grayscale = true) {
    return this.grayscale(grayscale);
  }
  
  // Invert colors
  negate(negate = true) {
    return this._addTransform('negate', negate);
  }
  
  // Set working colorspace for the processing pipeline
  pipelineColorspace(colorspace = 'srgb') {
    return this._addTransform('pipelineColorspace', colorspace);
  }
  
  // Apply color tinting to image
  tint(rgb) {
    return this._addTransform('tint', rgb);
  }
  
  // Set output colorspace
  toColorspace(colorspace = 'srgb') {
    return this._addTransform('toColorspace', colorspace);
  }
  
  // Convenience method to resize with both width and height
  resize(width, height, options = {}) {
    this._addTransform('width', width);
    this._addTransform('height', height);
    
    if (options.fit) {
      this._addTransform('fit', options.fit);
    }
    
    if (options.position || options.gravity) {
      this._addTransform('gravity', options.position || options.gravity);
    }
    
    return this;
  }
}

// Register the component
customElements.define('image-edit', ImageEdit);

export default ImageEdit;
