import { commonConfig, handleGuiEvent, init } from '../common.js';
import { getViewBox } from '/assets/js/svgUtils.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const storageKey = 'rileycircles';
const svg = document.getElementById('svg');

GUI.addRange('Cols', 10, '', { min: 2, max: 20, name: 'cols' });
GUI.addRange('Line Width', 0.5, '', { min: 0.125, max: 5, step: 0.125, name: 'linestrokewidth' });
GUI.addColor('Fill One', '#F8C706', '', { name: 'strokeone' });
GUI.addColor('Fill Two', '#E8E529', '', { name: 'stroketwo' });
GUI.addRange('Scale', 1, '', { min: 0, max: 2, step: 0.025, name: 'scale' });
commonConfig(GUI, '#FFFFFF', '#0c0b0b');
GUI.addEventListener('gui-input', (event) => handleGuiEvent(event, svg, GUI, storageKey, rileyCircles));
init(GUI, storageKey, []);

/* === MAIN FUNCTION === */

function rileyCircles(svg, controls) {
	const { width, height } = getViewBox(svg);
	const cols = controls.cols.valueAsNumber;
	const strokeOne = controls.strokeone.value;
	const strokeTwo = controls.stroketwo.value;
	const strokeWidth = controls.linestrokewidth.valueAsNumber;
	const scale = controls.scale.valueAsNumber;

	const sizeX = width / cols;
	const rows = height / sizeX;
	const radius = (sizeX - strokeWidth) / 2;

	let circles = Array.from({ length: cols * rows }, (_, index) => {
		const x = (index % cols) * sizeX + sizeX / 2;
		const y = Math.floor(index / cols) * sizeX + sizeX / 2;
		const stroke = Math.random() < 0.6 ? strokeOne : strokeTwo;
		return { x, y, stroke, radius };
	});

	function adjustXY(coordinate, radius) {
		return Math.random() > 0.5 ? coordinate + radius : coordinate - radius;
	}

	const translateX = width / 2;
	const translateY = height / 2;

	svg.style.fill = '#0000';
	svg.innerHTML = `<g transform="translate(${translateX} ${translateY}) scale(${scale})">
		${circles.map(circle => {
			const cx = adjustXY(circle.x - translateX, circle.radius / 2);
			const cy = adjustXY(circle.y - translateY, circle.radius / 2);
			return `<circle cx="${cx}" cy="${cy}" r="${circle.radius}" stroke="${circle.stroke}" stroke-width="${strokeWidth}" />`}).join('')}
	</g>`;
}
