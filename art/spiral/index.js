import { commonConfig, handleGuiEvent, init } from '../common.js';
import { getViewBox } from '/assets/js/svgUtils.js';
import { interpolateColor } from '/assets/js/color.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const storageKey = 'spiral';
const svg = document.getElementById('svg');
GUI.addRange('Min. radius', 0.2, '', { min: 0.01, max: 5, step: 0.01, name: 'mincircle' });
GUI.addRange('Max. radius', 3.5, '', { min: 1, max: 5, step: 0.01, name: 'maxcircle' });
GUI.addRange('Angle step', 36, '', { min: 0, max: 72, step: 0.1, name: 'anglestep' });
GUI.addRange('Density', 8, '', { min: 1, max: 50, step: 0.1, name: 'density' });
GUI.addRange('Steps', 20, '', { min: 1, max: 50, step: 0.1, name: 'steps' });
GUI.addColor('Start color', '#ffd500', '', { name: 'startcolor' });
GUI.addColor('End color', '#f94306', '', { name: 'endcolor' });
GUI.addRange('Scale', 1, '', { min: 0, max: 2, step: 0.025, name: 'scale' });
commonConfig(GUI, '#323f67');
GUI.addEventListener('gui-input', (event) => handleGuiEvent(event, svg, GUI, storageKey, spiral));
init(GUI, storageKey, []);

/* === MAIN FUNCTION === */

function spiral(svg, controls) {
	const { width, height } = getViewBox(svg);
	const density = controls.density.valueAsNumber;
	const endcolor = controls.endcolor.value;
	const maxCircle = controls.maxcircle.valueAsNumber;
	const minCircle = controls.mincircle.valueAsNumber;
	const numAngleStep = controls.anglestep.valueAsNumber;
	const numSteps = controls.steps.valueAsNumber;
	const scale = controls.scale.valueAsNumber;
	const startcolor = controls.startcolor.value;

	const minRadius = 1;
	const maxRadius = (Math.min(width, height) / 2) - maxCircle; // Adjust to ensure the circles fit within the viewBox
	const points = [];
	const steps = Math.floor(density * numSteps);
	const radiusStep = (maxRadius - minRadius) / steps;
	const angleStep = (2 * Math.PI) / numAngleStep;

	for (let i = 0; i < steps; i++) {
		const radius = minRadius + i * radiusStep;
		const angle = i * angleStep;
		const x = radius * Math.cos(angle);
		const y = radius * Math.sin(angle);
		const t = i / steps;
		points.push({ x, y, t, radius });
	}

	const circles = points.map((pos, index) => {
		const fillColor = interpolateColor(startcolor, endcolor, pos.t);
		const circleRadius = minCircle + (maxCircle - minCircle) * pos.t;
		return `<circle cx="${pos.x}" cy="${pos.y}" r="${circleRadius}" fill="${fillColor}"></circle>`;
	}).join('');

	// Adjust the y-translation by subtracting a portion of maxCircle
	const yOffset = height / 2 - (maxCircle / 2);
	svg.innerHTML = `<g transform="translate(${width / 2} ${yOffset}) scale(${scale})">${circles}</g>`;
}
