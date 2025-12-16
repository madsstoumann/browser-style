/**
 * Web Config Tokens Component
 * Loads design tokens from a JSON file and generates CSS custom properties
 */
export default class WebConfigTokens extends HTMLElement {
	constructor() {
		super();
		this.tokens = null;
	}

	connectedCallback() {
		const src = this.getAttribute('src');
		if (src) {
			this._loadTokens(src);
		}
	}

	/**
	 * Load tokens from JSON file
	 */
	async _loadTokens(src) {
		try {
			const response = await fetch(src);
			if (!response.ok) {
				throw new Error(`Failed to load tokens: ${response.statusText}`);
			}
			this.tokens = await response.json();
			this._generateTokens();
		} catch (error) {
			console.error('Error loading tokens:', error);
		}
	}

	/**
	 * Generate CSS custom properties from tokens
	 */
	_generateTokens() {
		if (!this.tokens) return;

		const cssVars = [];

		// Process all tokens recursively
		this._processTokenGroup(this.tokens, [], cssVars);

		// Create style element and inject CSS
		const style = document.createElement('style');
		style.textContent = `:root {\n${cssVars.join('\n')}\n}`;

		// Append to component
		this.appendChild(style);

		// Also log for debugging
		console.log('Generated CSS Variables:', cssVars.length);
	}

	/**
	 * Recursively process token groups and generate CSS variable names
	 * @param {Object} obj - Current object being processed
	 * @param {Array} path - Current path in the token hierarchy
	 * @param {Array} cssVars - Array to collect generated CSS variables
	 */
	_processTokenGroup(obj, path, cssVars) {
		for (const [key, value] of Object.entries(obj)) {
			// Skip meta properties
			if (key.startsWith('$')) continue;

			// Check if this is a token with $value
			if (value && typeof value === 'object' && '$value' in value) {
				// This is a token - generate CSS variable
				const cssVarName = this._generateCSSVarName(path, key, value);

				// Check if token has cssFunc - if so, use function instead of plain value
				let cssValue;
				if (value.$extensions?.cssFunc) {
					cssValue = this._generateCSSFunction(value.$extensions.cssFunc);
				} else {
					cssValue = this._resolveCSSValue(value.$value);
				}

				if (cssValue) {
					cssVars.push(`  ${cssVarName}: ${cssValue};`);
				}

				// Handle color scheme variants (dark mode) - legacy approach
				if (value.$extensions?.colorScheme?.dark) {
					const darkValue = this._resolveCSSValue(value.$extensions.colorScheme.dark);
					if (darkValue) {
						// Generate dark mode CSS variable
						// We'll add this to a media query or data attribute selector later
						// For now, just log it
						console.log(`Dark mode variant: ${cssVarName} -> ${darkValue}`);
					}
				}
			} else if (value && typeof value === 'object') {
				// This is a group - recurse deeper
				this._processTokenGroup(value, [...path, key], cssVars);
			}
		}
	}

	/**
	 * Generate CSS variable name from token path
	 * Strategy: --{path-joined-with-hyphens}
	 * Example: color.raw.neutral.50 -> --color-raw-neutral-50
	 *
	 * Alternative strategies could be:
	 * - Skip "raw": color.raw.neutral.50 -> --neutral-50
	 * - Use custom name from $extensions.cssVar if present
	 *
	 * @param {Array} path - Token path
	 * @param {String} key - Token key
	 * @param {Object} token - Token object (in case we want to check for custom name)
	 * @returns {String} CSS variable name
	 */
	_generateCSSVarName(path, key, token) {
		// Option 1: Check if token specifies a custom CSS property name
		if (token.$extensions?.cssProp) {
			return token.$extensions.cssProp.startsWith('--')
				? token.$extensions.cssProp
				: `--${token.$extensions.cssProp}`;
		}

		// Legacy support: also check cssVar
		if (token.$extensions?.cssVar) {
			return token.$extensions.cssVar.startsWith('--')
				? token.$extensions.cssVar
				: `--${token.$extensions.cssVar}`;
		}

		// Option 2: Generate from path
		// For now, we'll use the full path for maximum clarity
		// But we could make this configurable
		const fullPath = [...path, key].join('-');
		return `--${fullPath}`;
	}

	/**
	 * Resolve token value to CSS-compatible string
	 * Handles color objects, references, and primitive values
	 *
	 * @param {*} value - Token value
	 * @returns {String} CSS value
	 */
	_resolveCSSValue(value) {
		// Handle token references: {color.raw.neutral.50}
		if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
			// Extract reference path and convert to CSS var
			const refPath = value.slice(1, -1).replace(/\./g, '-');
			return `var(--${refPath})`;
		}

		// Handle color object with colorSpace
		if (value && typeof value === 'object' && 'colorSpace' in value) {
			return this._colorObjectToCSS(value);
		}

		// Handle dimension object
		if (value && typeof value === 'object' && 'value' in value && 'unit' in value) {
			return `${value.value}${value.unit}`;
		}

		// Handle primitive values
		if (typeof value === 'string' || typeof value === 'number') {
			return value.toString();
		}

		return null;
	}

	/**
	 * Generate CSS function from cssFunc object
	 * Supports light-dark(), clamp(), min(), max(), calc()
	 *
	 * @param {Object} cssFunc - Function definition with name and args
	 * @returns {String} CSS function string
	 */
	_generateCSSFunction(cssFunc) {
		if (!cssFunc || !cssFunc.name || !cssFunc.args) {
			return null;
		}

		const { name, args } = cssFunc;

		// Resolve each argument
		const resolvedArgs = args.map(arg => this._resolveFunctionArg(arg));

		// Generate function call
		return `${name}(${resolvedArgs.join(', ')})`;
	}

	/**
	 * Resolve a single function argument
	 * Can be a token reference, dimension object, or primitive value
	 *
	 * @param {*} arg - Function argument
	 * @returns {String} Resolved CSS value
	 */
	_resolveFunctionArg(arg) {
		// Handle token references: {color.raw.neutral.900}
		if (typeof arg === 'string' && arg.startsWith('{') && arg.endsWith('}')) {
			const refPath = arg.slice(1, -1).replace(/\./g, '-');
			return `var(--${refPath})`;
		}

		// Handle dimension objects: {value: 1, unit: "rem"}
		if (arg && typeof arg === 'object' && 'value' in arg && 'unit' in arg) {
			return `${arg.value}${arg.unit}`;
		}

		// Handle color objects
		if (arg && typeof arg === 'object' && 'colorSpace' in arg) {
			return this._colorObjectToCSS(arg);
		}

		// Handle primitive values (strings, numbers)
		if (typeof arg === 'string' || typeof arg === 'number') {
			return arg.toString();
		}

		return '';
	}

	/**
	 * Convert color object to CSS color value
	 * Supports srgb, hsl, oklch, etc.
	 *
	 * @param {Object} colorObj - Color object with colorSpace, components, alpha
	 * @returns {String} CSS color value
	 */
	_colorObjectToCSS(colorObj) {
		const { colorSpace, components, alpha = 1, hex } = colorObj;

		// For srgb, prefer hex if available, otherwise use rgb()
		if (colorSpace === 'srgb') {
			if (hex) {
				return alpha < 1 ? `${hex}${Math.round(alpha * 255).toString(16).padStart(2, '0')}` : hex;
			}
			// Convert 0-1 range to 0-255
			const [r, g, b] = components.map(c => Math.round(c * 255));
			return alpha < 1 ? `rgba(${r}, ${g}, ${b}, ${alpha})` : `rgb(${r}, ${g}, ${b})`;
		}

		// For HSL
		if (colorSpace === 'hsl') {
			const [h, s, l] = components;
			return alpha < 1 ? `hsla(${h}, ${s}%, ${l}%, ${alpha})` : `hsl(${h}, ${s}%, ${l}%)`;
		}

		// For OKLCH (modern color space)
		if (colorSpace === 'oklch') {
			const [l, c, h] = components;
			return alpha < 1 ? `oklch(${l} ${c} ${h} / ${alpha})` : `oklch(${l} ${c} ${h})`;
		}

		// For other color spaces, use color() function
		// color(display-p3 r g b / alpha)
		const componentStr = components.join(' ');
		return alpha < 1
			? `color(${colorSpace} ${componentStr} / ${alpha})`
			: `color(${colorSpace} ${componentStr})`;
	}
}

customElements.define('web-config-tokens', WebConfigTokens);
