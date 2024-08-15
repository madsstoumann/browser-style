import { commonConfig, handleGuiEvent, init } from '../common.js';
import { getViewBox } from '/assets/js/svgUtils.js';
import { hexToHSL } from '/assets/js/color.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const storageKey = 'metatron';
const svg = document.getElementById('svg');
GUI.addRange('Radius', 9, '', { min: 1, max: 50, step: 0.1, name: 'radius' });
GUI.addColor('Line color', '#f075f0', '', { name: 'stroke' });
GUI.addRange('Line opacity', 0.75, '', { min: 0.01, max: 1, step: 0.01, name: 'strokeopacity' });
GUI.addRange('Line width', 0.15, '', { min: 0.01, max: 1, step: 0.01, name: 'linestrokewidth' });
GUI.addRange('Scale', 1, '', { min: 0, max: 2, step: 0.025, name: 'scale' });
commonConfig(GUI, '#080828');
GUI.addEventListener('gui-input', (event) => handleGuiEvent(event, svg, GUI, storageKey, metatronCube));
init(GUI, storageKey, []);

/* === MAIN FUNCTION === */

function metatronCube(svg, controls) {
	const { width, height } = getViewBox(svg);
	const radius = controls.radius.valueAsNumber;
	const scale = controls.scale.valueAsNumber;
	const stroke = controls.stroke.value;
	const strokeOpacity = controls.strokeopacity.valueAsNumber;
	const strokeWidth = controls.linestrokewidth.valueAsNumber;

	const [H, S, L] = hexToHSL(stroke);
	svg.style.setProperty('stroke', `hsla(${H}, ${S}%, ${L}%, ${strokeOpacity})`);
	
	const points = [
		{ x: 0, y: Math.sqrt(4) * 2 * -radius },
		{ x: Math.sqrt(3) * 2 * -radius, y: Math.sqrt(4) * -radius },
		{ x: 0, y: Math.sqrt(4) * -radius },
		{ x: Math.sqrt(3) * 2 * radius, y: Math.sqrt(4) * -radius },
		{ x: Math.sqrt(3)  * -radius, y: -radius },
		{ x: 0, y: 0, connect: 1 }, /* center */
		{ x: Math.sqrt(3) * radius, y: -radius },
		{ x: Math.sqrt(3) * -radius, y: radius },
		{ x: Math.sqrt(3) * radius, y: radius },
		{ x: Math.sqrt(3) * 2 * -radius, y: Math.sqrt(4) * radius },
		{ x: 0, y: Math.sqrt(4) * radius },
		{ x: Math.sqrt(3) * 2 * radius, y: Math.sqrt(4) * radius },
		{ x: 0, y: Math.sqrt(4) * 2 * radius },
	];

	const connected = [];
	for (let i = 0; i < points.length; i++) {
		for (let j = i + 1; j < points.length; j++) {
			connected.push({ x1: points[i].x, y1: points[i].y, x2: points[j].x, y2: points[j].y });
		}
	}

	const circles = points.map(pos => 
		`<circle cx="${pos.x}" cy="${pos.y}" r="${radius}" stroke-width="${strokeWidth}" fill="none"></circle>`
	).join('');

	const lines = connected.map(line =>
		`<line x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}" stroke-width="${strokeWidth}"></line>`
	).join('');

	svg.innerHTML = `<g transform="translate(${width / 2} ${height / 2}) scale(${scale})">${circles}${lines}</g>`;
}
