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

export function meshPolygons(coords, xLines = 10, yLines = 10, hueStart = 0, hueEnd = 360) {
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

export function rotatePoint(cx, cy, x, y, angle) {
	const radians = (Math.PI / 180) * angle;
	const cos = Math.cos(radians);
	const sin = Math.sin(radians);
	const nx = (cos * (x - cx)) - (sin * (y - cy)) + cx;
	const ny = (sin * (x - cx)) + (cos * (y - cy)) + cy;
	return [nx, ny];
}

export function scalePoint(cx, cy, x, y, scale) {
	const dx = x - cx;
	const dy = y - cy;
	return [cx + dx * scale, cy + dy * scale];
}

export function getViewBox(svg) {
	const viewBox = svg.getAttribute("viewBox");
	if (!viewBox) {
			throw new Error("Invalid viewBox value");
	}

	const values = viewBox.split(' ').map(Number);
	if (values.length !== 4) {
			throw new Error("viewBox must have four values: min-x, min-y, width, and height");
	}

	const [minX, minY, width, height] = values;

	return { width, height };
}