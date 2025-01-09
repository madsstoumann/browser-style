/**
 * FormControl
 * @description Base class for web components behaving like form controls.
 * @author Mads Stoumann
 * @version 1.0.0
 * @class FormControl
 * @extends {HTMLElement}
 */
export class FormControl extends HTMLElement {

	/* === 1. STATIC PROPERTIES & METHODS === */

	static formAssociated = true;

	static toKebabCase(str) {
		return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
	}

	static register() {
		const kebabCase = this.toKebabCase(this.name);
		if (!customElements.get(kebabCase)) {
			customElements.define(kebabCase, this);
		}
		return kebabCase;
	}

	/* === 2. PRIVATE PROPERTIES === */

	#initialized = false;
	#isFormControl;
	#internals;
	#root;

	/* === 3. CONSTRUCTOR === */

	constructor() {
		super();
		this.#isFormControl = !this.hasAttribute('noform');
		this.#internals = this.#isFormControl ? this.attachInternals() : null;

		if (!this.hasAttribute('nomount')) {
			this.#initialize().then(() => {
				if (this.isConnected) {
					this.connectedCallback();
				}
			});
		}
	}

	/* === 4. GETTERS & SETTERS === */

	// Core form properties
	get form() { 
		return this.#isFormControl ? this.#internals.form : null; 
	}

	get name() { 
		return this.#isFormControl ? this.getAttribute('name') : null; 
	}

	get type() { 
		return this.localName; 
	}

	get value() {
		return this.#isFormControl ? 
			(this.#internals?.elementInternals?.value ?? this.getAttribute('value') ?? '') : 
			null;
	}

	set value(v) {
		if (!this.#isFormControl) return;
		const name = this.getAttribute('name');
		this.#internals.setFormValue(v, name || '');
		this.setAttribute('value', v || '');
	}

	// Value transformations
	get valueAsDate() {
		const value = this.value;
		return value === null ? null : new Date(value);
	}

	set valueAsDate(v) {
		this.value = v instanceof Date ? v.toISOString() : null;
	}

	get valueAsNumber() {
		const value = this.value;
		return value === null ? NaN : Number(value);
	}

	set valueAsNumber(v) {
		this.value = String(v);
	}

	// Component state
	get initialized() {
		return this.#initialized;
	}

	get isFormControl() {
		return this.#isFormControl;
	}

	get root() {
		return this.#root;
	}

	/* === 5. LIFECYCLE METHODS === */

	connectedCallback() {
		if (!this.#initialized) return;
		if (!this.hasAttribute('noshadow') && this.#isFormControl && this.#internals.form) {
			this.#internals.form.addEventListener('reset', this.formReset.bind(this));
		}
	}

	disconnectedCallback() {
		if (!this.hasAttribute('noshadow') && this.#isFormControl && this.#internals.form) {
			this.#internals.form.removeEventListener('reset', this.formReset);
		}
	}

	/* === 6. PUBLIC METHODS === */

	/**
	 * Hook for form reset functionality
	 * Override in child classes to handle reset behavior
	 */
	formReset() { }

	/**
	 * Hook for component initialization
	 * Override in child classes to add component-specific initialization
	 */
	initializeComponent() { }

	/**
	 * Manually mounts the component if it has the `nomount` attribute
	 * @returns {Promise<void>}
	 */
	async mount() {
		if (!this.#initialized) {
			await this.#initialize();
			if (this.isConnected) {
				this.connectedCallback();
			}
		}
	}

	/**
	 * Converts a string to kebab-case
	 * @param {string} str - The string to convert
	 * @returns {string} The kebab-cased string
	 */
	toKebabCase(str) {
		return this.constructor.toKebabCase(str);
	}

	/**
	 * Generates a short unique ID using crypto
	 * @returns {string} An 8-character unique ID
	 */
	uuid() {
		return crypto.getRandomValues(new Uint8Array(4))
			.reduce((acc, val) => acc + val.toString(36).padStart(2, '0'), '');
	}

	/* === 7. PRIVATE METHODS === */

	async #initialize() {
		if (this.#initialized) return;

		this.#root = this.hasAttribute('noshadow') ? this : this.attachShadow({ mode: 'open' });

		if (!this.hasAttribute('noshadow')) {
			await this.#loadComponentStyles();
		}

		this.initializeComponent();
		this.#initialized = true;
	}

	async #loadComponentStyles() {
		try {
			if (!this.hasAttribute('styles')) return;

			const cssPath = this.getAttribute('styles') || 'index.css';
			const response = await fetch(cssPath);
			
			if (response.ok) {
				const css = await response.text();
				const sheet = new CSSStyleSheet();
				sheet.replaceSync(css);
				this.#root.adoptedStyleSheets = [sheet];
			}
		} catch (error) {
			// Silently fail
		}
	}
}
