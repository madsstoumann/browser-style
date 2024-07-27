export function brightness(r, g, b) {
	return (299 * r + 587 * g + 114 * b) / 1000
}

export function hexToHSL(hex) {
	hex = hex.replace(/^#/, '');
	if (hex.length === 3) {
		hex = hex.split('').map(x => x + x).join('');
	}
	const r = parseInt(hex.slice(0, 2), 16) / 255;
	const g = parseInt(hex.slice(2, 4), 16) / 255;
	const b = parseInt(hex.slice(4, 6), 16) / 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h, s, l = (max + min) / 2;
	if (max === min) {
		h = s = 0;
	} else {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case r: h = (g - b) / d + (g < b ? 6 : 0); break;
			case g: h = (b - r) / d + 2; break;
			case b: h = (r - g) / d + 4; break;
		}
		h /= 6;
	}
	return [h * 360, s * 100, l * 100];
}

export function strToHEX(str) {
	const hash = strToHash(str, 5)
	const c = (hash & 0x00FFFFFF)
		.toString(16)
		.toUpperCase()
	return `#${'00000'.substring(0, 6 - c.length) + c}`
}

export function strToHSL(str, saturation = 50, lightness = 50) {
	const hash = strToHash(str, 25)
	return `hsl(${Math.abs(hash % 360)}, ${saturation}%, ${lightness}%)`
}

export function strToRGB(str) {
	const hash = strToHash(str, 10)
	const rgb = [];
	for (let i = 0; i < 3; i++) {
		const value = (hash >> (i * 8)) & 0xFF;
		rgb.push(value);
	}
	return rgb
}

function strToHash(str, lshift = 15) {
	let hash = 0
	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << lshift) - hash)
	}
	return hash
}

export function interpolate(start, end, factor) { return start + (end - start) * factor; }
export function interpolateColor(startColor, endColor, factor) {
	const parseColor = color => color.match(/\w\w/g).map(c => parseInt(c, 16));
	const toHex = num => num.toString(16).padStart(2, '0');
	
	const [r1, g1, b1] = parseColor(startColor);
	const [r2, g2, b2] = parseColor(endColor);

	const r = Math.round(interpolate(r1, r2, factor));
	const g = Math.round(interpolate(g1, g2, factor));
	const b = Math.round(interpolate(b1, b2, factor));

	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};