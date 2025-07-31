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
			const defaultSettings = {
				styles: {},
				useSchema: true,
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
		return this._settings;
	}

	getStyle(componentName) {
		this._ensureSettingsInitialized();
		
		const styles = this._settings?.styles || {};
		const styleOverride = styles[componentName];

		if (styleOverride) {
			if (Array.isArray(styleOverride)) {
				return `class="${styleOverride.join(' ')}"`;
			} else if (typeof styleOverride === 'string') {
				return `class="${styleOverride}"`;
			} else if (typeof styleOverride === 'object') {
				const classes = styleOverride.class || '';
				const inlineStyle = styleOverride.style || '';
				return `class="${classes}" style="${inlineStyle}"`;
			}
		}

		return `class="${componentName}"`;
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

	// Helper method to clean up template whitespace
	cleanHTML(html) {
		return html.replace(/>\s+</g, '><').replace(/^\s+|\s+$/g, '');
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