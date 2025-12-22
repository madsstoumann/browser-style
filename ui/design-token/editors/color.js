import { spaces } from '../../color-token/spaces.js';
import Color from "https://colorjs.io/dist/color.js";

export default function renderColorEditor(token) {
	if (token.$type !== 'color') {
		console.error(`renderColorEditor called for non-color token: ${token.name || 'unknown'} (${token.$type})`, token);
		return '';
	}

	const container = document.createElement('div');
	container.className = 'editor-color';
	
	let color;
	let isAlias = false;

	// Check for alias first
	if (typeof token.$value === 'string' && token.$value.startsWith('{') && token.$value.endsWith('}')) {
		isAlias = true;
		color = new Color("black"); // Fallback for alias
	} else {
		try {
			if (typeof token.$value === 'string') {
				// Handle empty strings or obvious non-colors
				if (!token.$value || !token.$value.trim()) throw new Error("Empty color string");
				color = new Color(token.$value);
			} else if (token.$value && typeof token.$value === 'object') {
				const { colorSpace, components, alpha } = token.$value;
				// Map 'rgb' to 'srgb' for Color.js if needed
				let spaceId = colorSpace === 'rgb' ? 'srgb' : colorSpace;
				
				// Handle display-p3 specifically if needed, or ensure it's registered
				// Color.js usually supports 'p3' or 'display-p3' but might need explicit handling
				if (spaceId === 'display-p3') spaceId = 'p3';

				color = new Color(spaceId, components, alpha ?? 1);
			} else {
				color = new Color("black");
			}
		} catch (e) {
			console.warn(`Failed to parse color for token "${token.name || 'unknown'}":`, token.$value, e);
			color = new Color("black");
		}
	}

	// UI Elements
	if (isAlias) {
		const msg = document.createElement('p');
		msg.style.color = 'orange';
		msg.textContent = `Alias: ${token.$value} (Editing disabled)`;
		container.append(msg);
		// We can still show the sliders but maybe disabled? 
		// For now, let's just return the message or continue with disabled inputs.
	}

	const spaceSelect = document.createElement('select');
	if (isAlias) spaceSelect.disabled = true;
	
	// Add 'hex' option manually
	const hexOption = document.createElement('option');
	hexOption.value = 'hex';
	hexOption.textContent = 'hex';
	spaceSelect.append(hexOption);

	Object.keys(spaces).forEach(space => {
		const option = document.createElement('option');
		option.value = space;
		option.textContent = space;
		// Map srgb to rgb for selection match
		const currentSpaceId = color.spaceId === 'srgb' ? 'rgb' : color.spaceId;
		option.selected = space === currentSpaceId;
		spaceSelect.append(option);
	});

	// Check if initial value was hex to select it
	if (typeof token.$value === 'string' && token.$value.startsWith('#')) {
		spaceSelect.value = 'hex';
	}

	// Preview Element
	const preview = document.createElement('div');
	preview.style.height = '3rem';
	preview.style.borderRadius = '4px';
	preview.style.border = '1px solid #ccc';
	preview.style.marginBottom = '1rem';
	preview.style.backgroundColor = color.toString(); // Initial color

	const slidersContainer = document.createElement('div');
	slidersContainer.style.display = 'grid';
	slidersContainer.style.gap = '0.5rem';
	slidersContainer.style.marginTop = '1rem';

	function renderSliders(spaceName) {
		slidersContainer.innerHTML = '';
		
		// Use rgb definition for hex
		const effectiveSpaceName = spaceName === 'hex' ? 'rgb' : spaceName;
		const spaceDef = spaces[effectiveSpaceName];
		
		if (!spaceDef) return;

		// Get channel keys (excluding 'spaces' array)
		const channels = Object.keys(spaceDef).filter(k => k !== 'spaces');
		
		// Get current coords in the selected space
		// Handle srgb <-> rgb mapping
		const targetSpace = (effectiveSpaceName === 'rgb') ? 'srgb' : effectiveSpaceName;
		
		// Convert color to target space if not already
		if (color.spaceId !== targetSpace) {
			color = color.to(targetSpace);
		}

		const coords = color.coords;
		const alpha = color.alpha;

		channels.forEach((channel, index) => {
			const def = spaceDef[channel];
			const isAlpha = channel === 'alpha';
			
			let val;
			if (isAlpha) {
				val = alpha;
			} else {
				val = coords[index];
				// Handle scaling for RGB (0-1 in Color.js -> 0-100 in spaces.js)
				if (effectiveSpaceName === 'rgb') val *= 100;
			}
			
			// Ensure value is within UI bounds (or at least safe)
			if (isNaN(val)) val = def.value || 0;

			const row = document.createElement('div');
			row.style.display = 'grid';
			row.style.gridTemplateColumns = '4ch 1fr 8ch';
			row.style.gap = '0.5rem';
			row.style.alignItems = 'center';

			const label = document.createElement('label');
			label.textContent = def.label || channel;

			const range = document.createElement('input');
			range.type = 'range';
			range.min = def.min;
			range.max = def.max;
			range.step = def.step || 1;
			range.value = val;

			const num = document.createElement('input');
			num.type = 'number';
			num.min = def.min;
			num.max = def.max;
			num.step = def.step || 1;
			num.value = val; // Round for display?

			// Sync inputs
			range.oninput = () => { 
				num.value = range.value; 
				updateValue(); 
			};
			num.oninput = () => { 
				range.value = num.value; 
				updateValue(); 
			};

			row.append(label, range, num);
			slidersContainer.append(row);
		});
	}

	function updateValue() {
		const inputs = slidersContainer.querySelectorAll('input[type="number"]');
		const newComponents = [];
		let newAlpha = 1;
		const spaceName = spaceSelect.value;
		
		// Use rgb definition for hex
		const effectiveSpaceName = spaceName === 'hex' ? 'rgb' : spaceName;
		const spaceDef = spaces[effectiveSpaceName];
		const channels = Object.keys(spaceDef).filter(k => k !== 'spaces');

		inputs.forEach((input, idx) => {
			const val = Number(input.value);
			// Check if this input corresponds to the alpha channel
			// The channels array contains keys like 'r', 'g', 'b', 'alpha'
			if (channels[idx] === 'alpha') {
				newAlpha = val;
			} else {
				// Handle scaling for RGB
				newComponents.push(effectiveSpaceName === 'rgb' ? val / 100 : val);
			}
		});
		
		color.coords = newComponents;
		color.alpha = newAlpha;

		let cssString;
		if (spaceName === 'hex') {
			// Force srgb conversion for hex output
			cssString = color.to('srgb').toString({ format: "hex" });
		} else if (spaceName === 'rgb') {
			cssString = color.to('srgb').toString({ format: "rgb" });
		} else {
			cssString = color.toString();
		}

		// Update preview
		preview.style.backgroundColor = cssString;

		// Dispatch event
		container.dispatchEvent(new CustomEvent('editor-change', { 
			bubbles: true, 
			detail: { 
				space: spaceName, 
				components: newComponents, 
				alpha: newAlpha,
				css: cssString
			} 
		}));
	}

	// Event Listeners
	spaceSelect.onchange = () => {
		renderSliders(spaceSelect.value);
		updateValue();
	};

	// Listen for external updates (e.g. from the main input field)
	container.addEventListener('update-from-input', (e) => {
		const newVal = e.detail.value;
		try {
			// Try to parse the new value
			const newColor = new Color(newVal);
			// If successful, update our internal color object
			color = newColor;
			
			// Update UI to match
			// We might need to switch space if the input was in a different format
			// But usually we want to keep the editor's current space unless explicitly changed?
			// Let's try to convert the new color to the current editor space
			let targetSpace = spaceSelect.value;
			if (targetSpace === 'rgb') targetSpace = 'srgb';
			
			if (color.spaceId !== targetSpace) {
				color = color.to(targetSpace);
			}
			
			// Update preview
			preview.style.backgroundColor = color.toString();
			
			renderSliders(spaceSelect.value);
		} catch (err) {
			// Invalid color string, ignore or show error
			console.debug('Invalid color input update', err);
		}
	});

	// Initial Render
	container.append(preview, spaceSelect, slidersContainer);
	// Determine initial space name from color object
	let initialSpace = color.spaceId === 'srgb' ? 'rgb' : color.spaceId;
	// If the token specified a space that isn't in our list, default to rgb or keep it?
	if (!spaces[initialSpace]) initialSpace = 'rgb';
	
	spaceSelect.value = initialSpace;
	renderSliders(initialSpace);

	return container;
}

export function formatValue(value) {
	if (!value) return '';
	if (typeof value === 'string') return value;
	
	try {
		const { colorSpace, components, alpha } = value;
		let spaceId = colorSpace === 'rgb' ? 'srgb' : colorSpace;
		if (spaceId === 'display-p3') spaceId = 'p3';
		const color = new Color(spaceId, components, alpha ?? 1);
		return color.toString();
	} catch (e) {
		return JSON.stringify(value);
	}
}

export function parseValue(value) {
	if (!value) return null;
	try {
		const color = new Color(value);
		return {
			colorSpace: color.spaceId === 'srgb' ? 'rgb' : color.spaceId,
			components: color.coords,
			alpha: color.alpha
		};
	} catch (e) {
		return value;
	}
}