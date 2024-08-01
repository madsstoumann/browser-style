import { commonConfig, handleGuiEvent, init } from '../common.js';
import Delaunay from '/assets/js/delaunay.js';
import { getViewBox } from '/assets/js/svgUtils.js';
import { hexToHSL } from '/assets/js/color.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const storageKey = 'triangles';
const svg = document.getElementById('svg');

GUI.addRange('Points', 170, '', { min: 3, max: 512, name: 'numpoints' });
GUI.addCheckbox('Square', '1', '', { 'data-unchecked': '0', name: 'square' });
GUI.addColor('Stroke', '#FFFFFF', '', { name: 'stroke' });
GUI.addRange('Width', 0.1, '', { min: 0, max: 1.4, step: 0.01, name: 'strokewidth' });
GUI.addColor('Start Color', '#d92926', '', { name: 'startcolor' });
GUI.addColor('End Color', '#993366', '', { name: 'endcolor' });
commonConfig(GUI, '#bf4040');
GUI.addEventListener('gui-input', (event) => handleGuiEvent(event, svg, GUI, storageKey, drawTriangles));
init(GUI, storageKey, []);

/* === MAIN FUNCTION === */

function drawTriangles(svg, controls) {
	const { width, height } = getViewBox(svg);
	const endColor = controls.endcolor.value;
	const numPoints = controls.numpoints.valueAsNumber;
	const square = !controls.square.checked;
	const startColor = controls.startcolor.value;
	const [h1, s1, l1] = hexToHSL(startColor);
	const [h2, s2, l2] = hexToHSL(endColor);

	let vertices = new Array(numPoints).fill().map(() => {
		let x = Math.random() - 0.5, y = Math.random() - 0.5;
		if (square) {
			do {
				x = Math.random() - 0.5;
				y = Math.random() - 0.5;
			} while (x * x + y * y > 0.25);
		}
		x = (x * 0.96875 + 0.5) * width;
		y = (y * 0.96875 + 0.5) * height;
		return [x, y];
	});

	const triangles = Delaunay.triangulate(vertices);
	let output = '';

	for (let i = 0; i < triangles.length; i+=3) {
		let [x, y] = vertices[triangles[i]];
		let [a, b] = vertices[triangles[i+1]];
		let [c, d] = vertices[triangles[i+2]];

		// Interpolate a random color between startColor and endColor
		const t = Math.random();
		const h = h1 + t * (h2 - h1);
		const s = s1 + t * (s2 - s1);
		const l = l1 + t * (l2 - l1);
		output += `<path d="M${x} ${y} L${a} ${b} L${c} ${d}Z" fill="hsl(${h}, ${s}%, ${l}%)"></path>`;
	}
	svg.innerHTML = output;
}
