import { commonConfig, handleGuiEvent, init } from '../common.js';
import { getViewBox } from '/assets/js/svgUtils.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const storageKey = 'circlegrid';
const svg = document.getElementById('svg');

GUI.addRange('Cols', 4, '', { min: 10, max: 50, name: 'columns' });
GUI.addColor('Line color', '#f075f0', '', { name: 'stroke' });
GUI.addRange('Line width', 0.5, '', { min: 0.01, max: 1, step: 0.01, name: 'linestrokewidth' });
GUI.addColor('Grid color', '#cccccc', '', { name: 'strokegrid' });
GUI.addRange('Grid width', 0.05, '', { min: 0, max: .5, step: 0.01, name: 'gridstrokewidth' });
GUI.addCheckbox('Fixed angles', '0', '', { name: 'angles', checked: 'checked' });

commonConfig(GUI, '#ffffff');
GUI.addEventListener('gui-input', (event) => handleGuiEvent(event, svg, GUI, storageKey, circleGrid));
init(GUI, storageKey, []);

/* === MAIN FUNCTION === */

function circleGrid(svg, controls) {
	const { width, height } = getViewBox(svg);
	const angleFixed = controls.angles.checked;
	const columns = controls.columns.valueAsNumber;
	const gridColor = controls.strokegrid.value;
	const gridWidth = controls.gridstrokewidth.valueAsNumber;
	const stroke = controls.stroke.value;
	const strokeWidth = controls.linestrokewidth.valueAsNumber;

	const boxSize = width / columns;
	const clipPathId = 'clipPath' + (crypto.getRandomValues(new Uint32Array(1))[0] % 9000 + 1000);

	// Define the possible rotation values
	const rotationOptions = [0, 90, 180, 270];

	const elements = [...new Array(columns * columns)].map((_cell, cellIndex) => {
		const colIndex = cellIndex % columns;
		const rowIndex = Math.floor(cellIndex / columns);

		// Determine the rotation angle
		const angle = angleFixed ? rotationOptions[Math.floor(Math.random() * rotationOptions.length)] : Math.floor(Math.random() * 360);

		return `
			<g transform="translate(${colIndex * boxSize}, ${rowIndex * boxSize}) rotate(${angle}, ${boxSize / 2}, ${boxSize / 2})" clip-path="url(#${clipPathId})">
				<rect width="${boxSize}" height="${boxSize}" fill="none" stroke="${gridColor}" stroke-width="${gridWidth}" />
				<circle cx="0" cy="0" r="${boxSize / 2}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" />
				<circle cx="${boxSize}" cy="${boxSize}" r="${boxSize / 2}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" />
			</g>`;
	}).join('');

	svg.innerHTML = `
	<defs>
		<clipPath id="${clipPathId}">
			<rect width="${boxSize}" height="${boxSize}" />
		</clipPath>
	</defs>
	<g>
		${elements}
	</g>`;
}
