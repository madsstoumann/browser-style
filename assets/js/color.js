export function brightness(r, g, b) {
	return (299 * r + 587 * g + 114 * b) / 1000
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