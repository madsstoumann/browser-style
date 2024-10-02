import { commonConfig, handleGuiEvent, init } from '../common.js';
import { getViewBox } from '/assets/js/svgUtils.js';
import { interpolateColor } from '../../assets/js/color.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const storageKey = 'circlecircles';
const svg = document.getElementById('svg');

GUI.addRange('Triangles', 12, '', { min: 3, max: 100, name: 'triangles' });
GUI.addRange('Inner Gap', 0, '', { min: 0, max: 25, name: 'innergap', value: 0 });
GUI.addColor('Line color', '#805280', '', { name: 'stroke' });
GUI.addRange('Line width', 0.1, '', { min: 0, max: 1, step: 0.01, name: 'linestrokewidth' });
GUI.addColor('Fill Start', '#7b3769', '', { name: 'fillstart' });
GUI.addColor('Fill End', '#1a1a3c', '', { name: 'fillend' });
GUI.addRange('Scale', 0.95, '', { min: 0, max: 2, step: 0.025, name: 'scale' });
commonConfig(GUI, '#282852');
GUI.addEventListener('gui-input', (event) => handleGuiEvent(event, svg, GUI, storageKey, anglesInOrbit));
init(GUI, storageKey, []);

/* === MAIN FUNCTION === */

function anglesInOrbit(svg, controls) {
	const { width, height } = getViewBox(svg);
	const triangles = controls.triangles.valueAsNumber;
	const fillEnd = controls.fillend.value;
	const fillStart = controls.fillstart.value;
	const innerGap = controls.innergap.valueAsNumber;
	const lineStrokeWidth = controls.linestrokewidth.valueAsNumber;
	
	const stroke = controls.stroke.value;
	const scale = controls.scale.valueAsNumber;

	svg.style.stroke = stroke;
	svg.style.strokeWidth = lineStrokeWidth;

	const radius = (Math.min(width, height) / 2);
	const translateX = width / 2;
	const translateY = height / 2;

	const angleStep = (2 * Math.PI) / triangles;
	const polygons = Array.from({ length: triangles }).map((_, index) => {
		const angle = index * angleStep;
		const factor = index / (triangles - 1);
		const fillColor = interpolateColor(fillStart, fillEnd, factor );
		const prevAngle = (index - 1 + triangles) % triangles * angleStep;
		const x1 = radius * Math.cos(angle);
		const y1 = radius * Math.sin(angle);
		const x2 = radius * Math.cos(prevAngle) / 2;
		const y2 = radius * Math.sin(prevAngle) / 2;
		return `<polygon points="0,0 ${x1},${y1} ${x2},${y2}" fill="${fillColor}"/>`;
	});

	svg.innerHTML = `
		<g transform="translate(${translateX}, ${translateY}) scale(${scale})">
			${polygons.join("")}
		</g>
	`;
}
