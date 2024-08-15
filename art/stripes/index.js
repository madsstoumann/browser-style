import { commonConfig, handleGuiEvent, init } from '../common.js';
import { getViewBox } from '/assets/js/svgUtils.js';
import { hexToHSL } from '/assets/js/color.js';
import random from '/assets/js/random.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const storageKey = 'stripes';
const svg = document.getElementById('svg');

GUI.addRange('Stripes', 35, '', { min: 4, max: 100, name: 'stripes' });
GUI.addColor('Hue', '#00c8fa', '', { name: 'hue' });
commonConfig(GUI);
GUI.addEventListener('gui-input', (event) => handleGuiEvent(event, svg, GUI, storageKey, stripes));
init(GUI, storageKey, []);

/* === MAIN FUNCTION === */

function stripes(svg, controls) {
	const { width, height } = getViewBox(svg);
	const stripes = controls.stripes.valueAsNumber;
	const [H, _S, _L] = hexToHSL(controls.hue.value);

	let relativeWidths = Array.from({ length: stripes }, () => Math.random());
	const totalRelativeWidth = relativeWidths.reduce((sum, val) => sum + val, 0);
	relativeWidths = relativeWidths.map(val => val / totalRelativeWidth);
	const stripeWidths = relativeWidths.map(val => val * width);
	let currentX = 0;

	svg.innerHTML = stripeWidths.map((stripeWidth, _index) => {
		const xPosition = currentX;
		currentX += stripeWidth;
		return `
			<rect
				width="${stripeWidth}"
				height="${height}"
				x="${xPosition}"
				y="0"
				fill="hsl(${H}, ${random(50, 100)}%, ${random(30, 90)}%)">
			</rect>`;
	}).join('');
}