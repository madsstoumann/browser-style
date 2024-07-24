import { hexToHSL } from './color.js';

export function createLinePath(id, startX, amplitude, lineWidth, frequency, height) {
	let d = '';
	for (let y = 0; y < height; y++) {
		const x = startX + Math.sin(y * frequency) * amplitude;
		if (y === 0) {
			d += `M${x},${y}`;
		} else {
			d += ` L${x},${y}`;
		}
	}

	const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
	path.setAttribute("id", id);
	path.setAttribute("d", d);
	path.setAttribute("stroke-width", lineWidth);
	path.setAttribute("fill", "none");
	return path;
}

export function createDefs(svg, amplitude, frequency, strokeWidth, height) {
	const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");

	for (let i = 0; i < 5; i++) {
		const pathAmplitude = amplitude + Math.random() * 5;
		const lineWidth = 2 + Math.random() * 1;
		const path = createLinePath(`line${i}`, -20, pathAmplitude, lineWidth + strokeWidth, frequency, height);
		defs.appendChild(path);
	}

	svg.appendChild(defs);
}

export function drawWavyLines(svg, lineCount, width, height, startHue, endHue, rotationMax, amplitude, frequency, strokeWidth) {
	svg.innerHTML = '';
	createDefs(svg, amplitude, frequency, strokeWidth, height);

	let startX = -20;
	const xAdd = width / lineCount;

	for (let i = 0; i < lineCount; i++) {
		const hue = startHue + ((endHue - startHue) * (i / lineCount));
		const saturation = 40 + Math.random() * 40;
		const lightness = 30 + Math.random() * 30;

		const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
		use.setAttribute("href", `#line${i % 5}`);
		use.setAttribute("stroke", `hsl(${hue}, ${saturation}%, ${lightness}%)`);
		if (rotationMax !== 0) {
			const rotation = Math.random() * 2 * rotationMax - rotationMax;
			use.setAttribute("transform", `translate(${startX}, 0) rotate(${rotation}, ${startX + width / 2}, ${height / 2})`);
		} else {
			use.setAttribute("transform", `translate(${startX}, 0)`);
		}
		svg.appendChild(use);

		const lineWidth = parseFloat(svg.querySelector(`#line${i % 5}`).getAttribute("stroke-width"));
		startX += lineWidth * 0.8 + xAdd;
	}
}
