import { getSrcset } from '@browser.style/layout';
import { getStyle } from './utils.js';

export class BaseCard extends HTMLElement {
	_data; _settings; _root;

	static get observedAttributes() {
		return ['settings'];
	}

	constructor() {
		super();
		this.classList.add('cc');
	}

	_ensureSettingsInitialized() {
		if (this._settings === undefined) {
			let settingsAttr = this.getAttribute('settings');
			let parsedSettings = null;
			if (settingsAttr) {
				try {
					parsedSettings = JSON.parse(settingsAttr);
				} catch (e) {
					console.error('Failed to parse settings attribute JSON during init:', e);
				}
			}
			
			// Get global config including image transforms
			const globalConfig = window._layoutSrcsetData?.config;
			
			const defaultSettings = {
				styles: {},
				useSchema: true,
				// srcsetBreakpoints: [280, 500, 720, 1080, 1440], // Optional override
				srcsetBreakpoints: globalConfig?.settings?.defaultSrcsetBreakpoints || [280, 480, 900],
				imageTransformConfig: globalConfig?.imageTransforms || null
			};
			this._settings = { ...defaultSettings, ...(parsedSettings || {}) };
		}
	}

	set dataset(obj) {
		this._ensureSettingsInitialized();

		this._data = obj?.data || {};
		this._settings = { ...this._settings, ...(obj?.settings || {}) };

		this._prepareAndRender();
	}

	get dataset() {
		return { data: this._data, settings: this._settings };
	}

	get data() {
		return this._data;
	}

	get settings() {
		this._ensureSettingsInitialized();
		if (typeof this._settings.layoutIndex === 'number' && this._settings.layoutSrcsets && !this._settings.layoutSrcset) {
			try {
				const config = window._layoutSrcsetData?.config;
				const sizes = getSrcset(this._settings.layoutSrcsets, this._settings.layoutIndex, config);
				this._settings.layoutSrcset = sizes;
			} catch (error) {
			}
		}
		
		return this._settings;
	}

	getStyle(componentName) {
		this._ensureSettingsInitialized();
		return getStyle(componentName, this._settings);
	}

	_prepareAndRender() {
		if (this._data) {
			this._render();
		}
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (name === 'settings' && oldValue !== newValue) {
			this._settings = undefined; // Reset to force re-initialization
			this._prepareAndRender();
		}
	}

	connectedCallback() {
		this._prepareAndRender();
	}

	// Helper method to set up common render variables
	_setupRender() {
		if (!this.data) return null;
		
		const settings = this.settings;
		const useSchema = settings.useSchema;
		const { content = {} } = this.data;
		const headlineTag = content.headlineTag || 'h2';
		
		return { settings, useSchema, content, headlineTag };
	}

	// Helper method to set schema attributes
	_setSchema(schemaType) {
		const renderContext = this._setupRender();
		if (renderContext?.useSchema) {
			this.setAttribute('itemscope', '');
			this.setAttribute('itemtype', `https://schema.org/${schemaType}`);
		}
		return renderContext;
	}

	// Abstract method to be overridden by subclasses
	render() {
		throw new Error('render() method must be implemented by subclass');
	}

	_render() {
		const content = this.render();
		this.innerHTML = content;
	}
}