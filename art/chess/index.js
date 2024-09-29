import { commonConfig, handleGuiEvent, init } from '../common.js';
import { getViewBox } from '/assets/js/svgUtils.js';
import { random } from '/assets/js/utils.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const storageKey = 'chess';
const svg = document.getElementById('svg');

GUI.addRange('Grid Size', 15, '', { min: 3, max: 40, name: 'gridsize' });

GUI.addColor('Color 1', '#474747', '', { name: 'color1' });
GUI.addColor('Color 2', '#999999', '', { name: 'color2' });
GUI.addColor('Color 3', '#C2C2C2', '', { name: 'color3' });
GUI.addColor('Color 4', '#707070', '', { name: 'color4' });

commonConfig(GUI, '#EEEEEE');
GUI.addEventListener('gui-input', (event) => handleGuiEvent(event, svg, GUI, storageKey, chess));
init(GUI, storageKey, []);

/* === MAIN FUNCTION === */

function chess(svg, controls) {
	const { width, height } = getViewBox(svg);
	const gridSize = controls.gridsize.valueAsNumber;
	const color1 = controls.color1.value;
	const color2 = controls.color2.value;
	const color3 = controls.color3.value;
	const color4 = controls.color4.value;
	let svgRects = [];

	const drawRects = (rectWidth, rectHeight, gridsize, offsetX, offsetY, color1, color2, startWithAlternate) => {
		for (let row = 0; row < gridsize; row++) {
			for (let col = 0; col < gridsize; col++) {
				let x = col * rectWidth + offsetX;
				let y = row * rectHeight + offsetY;
				if (row === 0) {
					let fillColor = (col % 2 === 0) ? color1 : color2;
					svgRects.push(`<rect x="${x}" y="${y}" width="${rectWidth}" height="${rectHeight}" fill="${fillColor}" />`);
				} 
				else if (row === gridsize - 1) {
					let fillColor;
					if (startWithAlternate) {
						fillColor = (col % 2 === 0) ? color2 : color1;
					} else {
						fillColor = (col % 2 === 0) ? color1 : color2;
					}
					svgRects.push(`<rect x="${x}" y="${y}" width="${rectWidth}" height="${rectHeight}" fill="${fillColor}" />`);
				}
				else {
					if (col === 0 || col === gridsize - 1) {
						let fillColor = (row % 2 === 0) ? ((col % 2 === 0) ? color1 : color2) : ((col % 2 === 0) ? color2 : color1);
						svgRects.push(`<rect x="${x}" y="${y}" width="${rectWidth}" height="${rectHeight}" fill="${fillColor}" />`);
					}
				}
			}
		}
	};

	let currentWidth = width;
	let currentHeight = height;
	let currentGridSize = gridSize;
	let currentRectWidth = width / gridSize;
	let currentRectHeight = height / gridSize;
	let xOffset = 0;
	let yOffset = 0;
	let colorSwitch = true;

	while (currentGridSize > 1) {
		let startWithAlternate = currentGridSize % 2 === 0;

		if (colorSwitch) {
			drawRects(currentRectWidth, currentRectHeight, currentGridSize, xOffset, yOffset, color1, color2, startWithAlternate);
		} else {
			drawRects(currentRectWidth, currentRectHeight, currentGridSize, xOffset, yOffset, color3, color4, startWithAlternate);
		}

		currentWidth -= currentRectWidth * 2;
		currentHeight -= currentRectHeight * 2;
		xOffset += currentRectWidth;
		yOffset += currentRectHeight;
		currentGridSize -= 1;
		currentRectWidth = currentWidth / currentGridSize;
		currentRectHeight = currentHeight / currentGridSize;
		colorSwitch = !colorSwitch;
	}
	svg.innerHTML = svgRects.join('\n');
}
