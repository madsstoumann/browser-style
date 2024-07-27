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

// export function drawMesh(coords, xLines = 10, yLines = 10) {
// 	const [c1, c2, c3, c4] = coords;
// 	const lines = [];
// 	const G = document.createElementNS("http://www.w3.org/2000/svg", "g");

// 	for (let i = 0; i <= xLines; i++) {
// 		const t = i / xLines;
// 		const xStart = (1 - t) * c1[0] + t * c2[0];
// 		const yStart = (1 - t) * c1[1] + t * c2[1];
// 		const xEnd = (1 - t) * c4[0] + t * c3[0];
// 		const yEnd = (1 - t) * c4[1] + t * c3[1];

// 		const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
// 		line.setAttribute("x1", xStart);
// 		line.setAttribute("y1", yStart);
// 		line.setAttribute("x2", xEnd);
// 		line.setAttribute("y2", yEnd);
// 		G.appendChild(line);
// 	}

// 	for (let i = 0; i <= yLines; i++) {
// 		const t = i / yLines;
// 		const xStart = (1 - t) * c1[0] + t * c4[0];
// 		const yStart = (1 - t) * c1[1] + t * c4[1];
// 		const xEnd = (1 - t) * c2[0] + t * c3[0];
// 		const yEnd = (1 - t) * c2[1] + t * c3[1];

// 		const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
// 		line.setAttribute("x1", xStart);
// 		line.setAttribute("y1", yStart);
// 		line.setAttribute("x2", xEnd);
// 		line.setAttribute("y2", yEnd);

// 		G.appendChild(line);
// 	}
// 	return G;
// }

export function drawMeshRect(coords, xLines = 10, yLines = 10, hueStart = 0, hueEnd = 360) {
	const [c1, c2, c3, c4] = coords;
	const G = document.createElementNS("http://www.w3.org/2000/svg", "g");

	for (let i = 0; i < xLines; i++) {
		for (let j = 0; j < yLines; j++) {
			const t1 = i / xLines;
			const t2 = (i + 1) / xLines;
			const u1 = j / yLines;
			const u2 = (j + 1) / yLines;

			const x1 = (1 - t1) * c1[0] + t1 * c2[0];
			const y1 = (1 - t1) * c1[1] + t1 * c2[1];
			const x2 = (1 - t2) * c1[0] + t2 * c2[0];
			const y2 = (1 - t2) * c1[1] + t2 * c2[1];

			const x3 = (1 - t1) * c4[0] + t1 * c3[0];
			const y3 = (1 - t1) * c4[1] + t1 * c3[1];
			const x4 = (1 - t2) * c4[0] + t2 * c3[0];
			const y4 = (1 - t2) * c4[1] + t2 * c3[1];

			const xTopLeft = (1 - u1) * x1 + u1 * x3;
			const yTopLeft = (1 - u1) * y1 + u1 * y3;
			const xTopRight = (1 - u1) * x2 + u1 * x4;
			const yTopRight = (1 - u1) * y2 + u1 * y4;

			const xBottomLeft = (1 - u2) * x1 + u2 * x3;
			const yBottomLeft = (1 - u2) * y1 + u2 * y3;
			const xBottomRight = (1 - u2) * x2 + u2 * x4;
			const yBottomRight = (1 - u2) * y2 + u2 * y4;

			const rect = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
			rect.setAttribute("points", `${xTopLeft},${yTopLeft} ${xTopRight},${yTopRight} ${xBottomRight},${yBottomRight} ${xBottomLeft},${yBottomLeft}`);
			const hue = hueStart + Math.random() * (hueEnd - hueStart);
			const saturation = 40 + Math.random() * 40;
			const lightness = 30 + Math.random() * 30;
			rect.setAttribute("fill", `hsl(${hue}, ${saturation}%, ${lightness}%)`);

			G.appendChild(rect);
		}
	}
	return G;
}


export function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
	let angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
	return {
			x: centerX + (radius * Math.cos(angleInRadians)),
			y: centerY + (radius * Math.sin(angleInRadians))
	};
}