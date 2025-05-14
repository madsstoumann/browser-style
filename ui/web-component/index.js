export default class WebComponent extends HTMLElement {

	static observedAttributes = ['render-mode', 'styles', 'shared-styles-id'];
	static #loadedStylesheets = new Map(); // Cache for { sheet, cssText } per URL
	static #dsdStyleMarkerAttribute = 'data-webcomponent-dsd-style';

	// For shared styles mechanism
	static #registeredSharedStyleIds = new Set(); // Tracks if <style> content for an ID has been rendered
	static #sharedStyleSheets = new Map(); // Maps shared-styles-id to CSSStyleSheet object

	#root;
	#styleData = null; // Stores { sheet, cssText } for this instance

	// Cached attribute values
	#_renderMode;
	#_styles;
	#_isEffectivelyManual;
	#_sharedStylesId;
	
	constructor() {
		super();
		// Initial renderMode for shadow root decision - cannot wait for connectedCallback
		const initialRenderMode = this.getAttribute('render-mode') || 'shadow';
		if (initialRenderMode === 'shadow') {
			this.#root = this.attachShadow({ mode: 'open' });
		} else { // 'dom' or 'dsd'
			this.#root = this;
		}
		// Other attributes will be cached in connectedCallback/attributeChangedCallback
	}

	#updateAttributeCache() {
		this.#_renderMode = this.getAttribute('render-mode') || 'shadow';
		this.#_styles = this.getAttribute('styles');
		this.#_isEffectivelyManual = this.#_styles === 'none';
		this.#_sharedStylesId = this.getAttribute('shared-styles-id');
	}

	async #loadStyles() {
		// Uses: this.#_styles, this.#_isEffectivelyManual, this.#_renderMode
		let styleUrlToLoad;

		if (this.#_styles && !this.#_isEffectivelyManual) {
			styleUrlToLoad = this.#_styles; // User specified a URL
		} else {
			// Default case: styles attribute not set, or it's "none".
			// In both cases, we identify 'index.css' as the target,
			// but '#_isEffectivelyManual' will control its application.
			try {
				styleUrlToLoad = new URL('index.css', import.meta.url).href;
			} catch (e) {
				styleUrlToLoad = './index.css'; // Fallback
				// Warn only if styles attribute is not set at all (neither URL nor "none")
				// and import.meta.url failed. If styles="none", user expects manual control.
				if (this.#_styles === null || this.#_styles === undefined || this.#_styles === '') {
					console.warn('WebComponent: import.meta.url not available and "styles" attribute not set. Defaulting to relative "./index.css". This might not be found or be relative to the document.', this);
				}
			}
		}

		if (WebComponent.#loadedStylesheets.has(styleUrlToLoad)) {
			this.#styleData = WebComponent.#loadedStylesheets.get(styleUrlToLoad);
		} else {
			try {
				const response = await fetch(styleUrlToLoad);
				if (!response.ok) {
					throw new Error(`Failed to fetch styles from ${styleUrlToLoad}: ${response.statusText}`);
				}
				const cssText = await response.text();
				const sheet = new CSSStyleSheet();
				sheet.replaceSync(cssText);
				this.#styleData = { sheet, cssText };
				WebComponent.#loadedStylesheets.set(styleUrlToLoad, this.#styleData);
			} catch (error) {
				console.warn(`WebComponent: Could not load styles from ${styleUrlToLoad}:`, error, this);
				this.#styleData = null; // Ensure it's null if loading failed
				return; 
			}
		}

		// Apply to shadow DOM if appropriate (uses cached #_renderMode)
		if (!this.#_isEffectivelyManual && this.#styleData && this.#_renderMode === 'shadow') {
			if (this.#root instanceof ShadowRoot) {
				this.#root.adoptedStyleSheets = [this.#styleData.sheet];
			} else {
				console.warn('WebComponent: render-mode is "shadow" but no shadow root found to adopt styles.', this);
			}
		}
	}

	#performDsdClientSideEnhancements() {
		// Uses: this.#_renderMode, this.#_isEffectivelyManual, this.#_sharedStylesId
		if (this.#_renderMode === 'dsd' && !this.#_isEffectivelyManual) {
			const shadow = this.#root.shadowRoot;
			if (shadow) {
				if (this.#_sharedStylesId && this.#styleData) { // Using shared styles
					let sheet = WebComponent.#sharedStyleSheets.get(this.#_sharedStylesId);
					if (!sheet) { 
						if (this.#styleData.sheet) { 
							sheet = this.#styleData.sheet;
							WebComponent.#sharedStyleSheets.set(this.#_sharedStylesId, sheet);
						} else {
							console.warn(`WebComponent: Source for shared-style-id "${this.#_sharedStylesId}" did not have a loaded sheet for adoption.`, this);
							return; 
						}
					}
					shadow.adoptedStyleSheets = [sheet, ...shadow.adoptedStyleSheets.filter(s => s !== sheet)];
					const inlineStyle = shadow.querySelector(`style[id="${this.#_sharedStylesId}"]`);
					if (inlineStyle) {
						inlineStyle.remove();
					}
				} else if (!this.#_sharedStylesId && this.#styleData?.sheet) { // Using standard DSD client-side upgrade
					shadow.adoptedStyleSheets = [this.#styleData.sheet];
					const dsdStyleTag = shadow.querySelector(`style[${WebComponent.#dsdStyleMarkerAttribute}]`);
					if (dsdStyleTag) {
						dsdStyleTag.remove();
					}
				}
			}
		}
	}

	async connectedCallback() {
		this.#updateAttributeCache(); // Initial cache population
		
		await this.#loadStyles(); 
		
		let ssrDsdDetected = false;
		if (this.#_renderMode === 'dsd' && this.shadowRoot) {
			// DSD mode and shadowRoot already exists - likely SSR.
			// Skip client-side render(), but still need to enhance.
			ssrDsdDetected = true;
		}

		if (!ssrDsdDetected) {
			// Not SSR DSD, or not DSD at all. Proceed with client-side rendering.
			// If this.#_renderMode === 'dsd' and !this.shadowRoot, 
			// render() will now imperatively attach the shadow root.
			this.render(); 
		}
		
		this.#performDsdClientSideEnhancements();
		// Shadow DOM styles are adopted directly in #loadStyles if not manual
	}

	disconnectedCallback() {
		// Potential cleanup if needed
		// For example, if #registeredSharedStyleIds needs cleanup for dynamic scenarios,
		// but typically it's fine for page lifecycle.
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) return; // No actual change

		this.#updateAttributeCache(); // Update cache with new attribute values

		// Re-process if the component is connected to the DOM
		if (this.isConnected) {
			// Using an async IIFE to handle await within the synchronous callback
			(async () => {
				await this.#loadStyles(); // Re-evaluate styles based on new attributes
				
				// For attribute changes, we always re-render the content.
				// The render() method itself distinguishes between initial DSD setup (now imperative)
				// and updating an existing shadowRoot.
				this.render(); 

				// No specific microtask delay needed here for DSD parsing if render() is imperative for init.
				this.#performDsdClientSideEnhancements(); // Re-apply DSD enhancements
			})();
		}
	}

	render() {
		const content = this._getTemplate(); 
		
		if (this.#_renderMode === 'dsd') {
			let cssTextForBlock = '';
			let attrsForBlock = '';
			let completeStyleBlock = ''; // The full <style>...</style> string, or empty

			if (!this.#_isEffectivelyManual && this.#styleData?.cssText) {
				cssTextForBlock = this.#styleData.cssText;
				if (this.#_sharedStylesId) {
					attrsForBlock = `id="${this.#_sharedStylesId}"`;
				} else { // Non-shared DSD
					attrsForBlock = `${WebComponent.#dsdStyleMarkerAttribute}`;
				}
				completeStyleBlock = `<style ${attrsForBlock}>${cssTextForBlock}</style>`;
			} else if (!this.#_isEffectivelyManual && this.#_sharedStylesId && !this.#styleData?.cssText) {
				// Warn if shared styles are expected but not loaded for DSD
				console.warn(`WebComponent: Source for shared-style-id "${this.#_sharedStylesId}" failed to load its styles. No styles rendered in template for DSD.`, this);
			}

			if (!this.shadowRoot) {
				// Client-side DSD-like setup: Imperatively attach shadow and populate.
				// this.#root is 'this' (the host element) for DSD mode.
				const shadow = this.#root.attachShadow({ mode: 'open' }); 
				shadow.innerHTML = `${completeStyleBlock}${content}`;
				
				// If it was a shared style, and this is the first time we're "rendering" it client-side,
				// and the style content was actually generated, ensure it's registered.
				// This helps if the SSR version didn't render this specific shared ID first.
				if (this.#_sharedStylesId && cssTextForBlock && !WebComponent.#registeredSharedStyleIds.has(this.#_sharedStylesId)) {
					WebComponent.#registeredSharedStyleIds.add(this.#_sharedStylesId);
				}
			} else {
				// DSD already attached (either by server or previous client render), this is a client-side re-render.
				// Update the content of the existing shadow root.
				this.shadowRoot.innerHTML = `${completeStyleBlock}${content}`;
			}
		} else {
			// For 'shadow' or 'dom' mode
			// this.#root is shadowRoot for 'shadow', or 'this' for 'dom'.
			this.#root.innerHTML = content;
		}
	}

	// Method for subclasses to override to provide their HTML content
	_getTemplate() {
		return ''; // Default implementation returns empty content
	}
}

customElements.define('web-component', WebComponent);