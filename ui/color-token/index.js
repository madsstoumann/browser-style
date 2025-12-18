import { spaces } from './spaces.js';

/**
 * Color Token Custom Element
 * Displays a color token with its name and a visual button
 */

const styles = `
	:host {
		display: inline-grid;
		font-family: system-ui, sans-serif;
		font-size: 0.875rem;
		gap: 1ch;
	}
	button {
		width: 3rem;
		height: 3rem;
		border: none;
		border-radius: 0.25rem;
		background: var(--_c);
		cursor: pointer;
		transition: transform 0.2s;
	}
	button:hover {
		transform: scale(1.1);
	}
	input { min-width: 200px; }
	label { display: inline-grid; font-size: 12px; }
	span {
		font-weight: 500;
		word-break: break-all; 
	}
`;

export default class ColorToken extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });

		const sheet = new CSSStyleSheet();
		sheet.replaceSync(styles);
		this.shadowRoot.adoptedStyleSheets = [sheet];
	}

	connectedCallback() {
		if (this.hasOwnProperty('src')) {
			const value = this.src;
			delete this.src;
			this.src = value;
		}
		this.render();
	}

	set src(data) {
		this._src = data;
		this.render();
	}

	get src() {
		return this._src;
	}

	get #attrs() {
		let data = this._src;
		if (!data) {
			const attr = this.getAttribute('src');
			if (attr) try { data = JSON.parse(attr); } catch (e) { console.warn('Invalid JSON', e); }
		}

		let name = this.getAttribute('name');
		let value = this.getAttribute('value');
		let space = this.getAttribute('space') || 'srgb';
		let components = this.getAttribute('components');
		let alpha = this.getAttribute('alpha') || 1;

		if (data) {
			if (!data.$value) {
				const key = Object.keys(data)[0];
				if (key && data[key]?.$value) {
					name = name || key;
					data = data[key];
				}
			}
			
			const $v = data.$value;
			if ($v) {
				if (typeof $v === 'string') {
					value = $v;
				} else {
					value = null; // Clear value if we have components
					space = $v.colorSpace || space;
					components = Array.isArray($v.components) ? $v.components.join(' ') : $v.components;
					alpha = $v.alpha ?? alpha;
				}
			}
		}

		return { name: name || 'Unnamed', value, space, components, alpha };
	}

	getColorValue({ space, components, alpha, value } = this.#attrs) {
		if (value) {
			if (value.startsWith('#') && alpha != 1) {
				return `${value}${Math.round(Number(alpha) * 255).toString(16).padStart(2, '0')}`;
			}
			if (value.startsWith('{') && value.endsWith('}')) {
				return `var(--${value.slice(1, -1).replace(/\./g, '-')})`;
			}
			return value;
		}

		if (components) {
			if (space === 'hsl') {
				const [h, s, l] = components.split(/\s+/);
				return `hsl(${h} ${s}% ${l}% / ${alpha})`;
			}
			if (space === 'srgb') {
				const [r, g, b] = components.split(/\s+/).map(c => Math.round(parseFloat(c) * 100));
				return `rgb(${r}% ${g}% ${b}% / ${alpha})`;
			}
			return ['display-p3', 'a98-rgb', 'prophoto-rgb', 'rec2020', 'xyz', 'xyz-d50', 'xyz-d65'].includes(space)
				? `color(${space} ${components} / ${alpha})`
				: `${space}(${components} / ${alpha})`;
		}

		return '#000000';
	}

	#parseColor(str) {
		str = str.trim();
		
		// Hex
		if (str.startsWith('#')) {
			let hex = str.slice(1);
			if (hex.length === 3) hex = [...hex].map(x => x + x).join('');
			else if (hex.length === 4) hex = [...hex].map(x => x + x).join('');
			
			const r = parseInt(hex.slice(0, 2), 16) / 255;
			const g = parseInt(hex.slice(2, 4), 16) / 255;
			const b = parseInt(hex.slice(4, 6), 16) / 255;
			const a = hex.length === 8 ? (parseInt(hex.slice(6, 8), 16) / 255) : 1;
			return { colorSpace: 'srgb', components: [r, g, b], alpha: Number(a.toFixed(2)) };
		}

		// Functional syntax
		const match = str.match(/^([a-z0-9-]+)\((.+)\)$/i);
		if (match) {
			let [_, name, args] = match;
			// Normalize separators: replace commas with spaces
			args = args.replace(/,/g, ' ');
			
			// Split by slash to separate alpha if present
			let parts = args.split('/').map(s => s.trim()).filter(Boolean);
			let componentsStr = parts[0];
			let alphaStr = parts[1];
			
			let componentParts = componentsStr.split(/\s+/).filter(Boolean);
			let alpha = alphaStr ? parseFloat(alphaStr) : 1;

			// If no slash, check for legacy 4th argument for rgb/hsl
			if (!alphaStr && componentParts.length === 4 && (name.startsWith('rgb') || name.startsWith('hsl'))) {
				alpha = parseFloat(componentParts.pop());
			}

			// color(space ...)
			if (name === 'color') {
				const space = componentParts.shift();
				return { colorSpace: space, components: componentParts.map(p => parseFloat(p)), alpha };
			}

			// rgb
			if (name.startsWith('rgb')) {
				const comps = componentParts.map(p => {
					if (p.endsWith('%')) return parseFloat(p) / 100;
					return parseFloat(p) / 255;
				});
				return { colorSpace: 'srgb', components: comps, alpha };
			}

			// hsl
			if (name.startsWith('hsl')) {
				const comps = componentParts.map(p => parseFloat(p));
				return { colorSpace: 'hsl', components: comps, alpha };
			}

			// oklch, lab, etc.
			return { colorSpace: name, components: componentParts.map(p => parseFloat(p)), alpha };
		}
		return null;
	}

	render() {
		const attrs = this.#attrs;
		const colorValue = this.getColorValue(attrs);

		this.shadowRoot.innerHTML = `
			<button part="display" style="--_c: ${colorValue}" popovertarget="picker"></button>
			<span part="name">${attrs.name}</span>
			<form id="picker" popover>
				<fieldset>
					<legend>Color Token</legend>
					<label>Value
						<input type="text" value="${colorValue}" />
					</label>
				</fieldset>
			</form>
		`;

		this.shadowRoot.querySelector('form').addEventListener('change', (e) => {
			const parsed = this.#parseColor(e.target.value);
			if (parsed) {
				const newSrc = {
					[attrs.name]: {
						$value: parsed
					}
				};
				this.src = newSrc;
				this.dispatchEvent(new CustomEvent('change', { detail: newSrc }));
			}
		});
	}
}

customElements.define('color-token', ColorToken);
