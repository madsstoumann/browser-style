import { commonConfig, handleGuiEvent, init } from '../common.js';
import { getViewBox } from '/assets/js/svgUtils.js';
import { hexToHSL } from '/assets/js/color.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const storageKey = 'homagesquare';
const svg = document.getElementById('svg');

GUI.addRange('Squares', 4, '', { min: 2, max: 20, name: 'squares' });
GUI.addRange('Y Offset', 0.25, '', { min: -1, max: 1, step: 0.01, name: 'yoffset' });
GUI.addRange('Spacing', 1.5, '', { min: 1, max: 3, step: 0.1, name: 'spacing' });
GUI.addColor('Color', '#ff0055', '', { name: 'color' });
GUI.addRange('Light Factor', 0.75, '', { min: 0.1, max: 2, step: 0.01, name: 'lightnessfactor' });
GUI.addCheckbox('Reverse', '0', '', { name: 'reverse' });
commonConfig(GUI, '#080828');
GUI.addEventListener('gui-input', (event) => handleGuiEvent(event, svg, GUI, storageKey, homageSquare));
init(GUI, storageKey, []);

/* === MAIN FUNCTION === */

function homageSquare(svg, controls) {
	const { width, height } = getViewBox(svg);
	const squares = controls.squares.valueAsNumber;
	const [h, s, l] = hexToHSL(controls.color.value);
	const reverse = controls.reverse.checked;
	const lightnessFactor = controls.lightnessfactor.valueAsNumber;
	const yOffsetFactor = controls.yoffset.valueAsNumber;
	const spacingFactor = controls.spacing.valueAsNumber;
	const maxSquareSize = Math.min(width, height);
	const decrement = maxSquareSize / (squares * spacingFactor);

	const minLightness = l * (1 - lightnessFactor);
	const maxLightness = l;

	const elements = Array.from({ length: squares }, (_, index) => {
		const baseFactor = reverse ? ((squares - index - 1) / (squares - 1)) : (index / (squares - 1));
		const currentL = minLightness + (maxLightness - minLightness) * baseFactor;
		const squareSize = maxSquareSize - (index * decrement);
		const yOffset = index * decrement * yOffsetFactor;
		if (index === 0) svg.style.backgroundColor = `hsl(${h}, ${s}%, ${currentL}%)`;
		return `
			<rect
				width="${squareSize}"
				height="${squareSize}"
				x="${(width - squareSize) / 2}"
				y="${(height - squareSize) / 2 + yOffset}"
				fill="hsl(${h}, ${s}%, ${currentL}%)">
			</rect>`;
	}).join('');
	svg.innerHTML = `<g>${elements}</g>`;
}
