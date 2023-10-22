export default function uiColorInput(node) {
	const rgb = window.getComputedStyle(node).getPropertyValue('background-color')
	if (rgb) {
		const [r,g,b] = rgb.replace(/[^\d,]/g, '').split(',')
		const brightness = (299 * r + 587 * g + 114 * b) / 1000
		node.style.setProperty('--_c',  brightness <= 127 ? `#FFF` : `#000`);
	}
	else {
		return '#EEE'
	}
}