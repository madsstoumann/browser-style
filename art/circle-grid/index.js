import { commonConfig, handleGuiEvent, init } from '../common.js';
import { getViewBox } from '/assets/js/svgUtils.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const storageKey = 'circlegrid';
const svg = document.getElementById('svg');

GUI.addRange('Cols', 15, '', { min: 1, max: 50, name: 'columns' });
GUI.addColor('Line color', '#f075f0', '', { name: 'linestroke' });
GUI.addCheckbox('Random', '0', '', { name: 'randomcolor' });
GUI.addRange('Line width', 0.35, '', { min: 0.01, max: 1, step: 0.01, name: 'linestrokewidth' });
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
	const randomColor = controls.randomcolor.checked;
	const stroke = controls.linestroke.value;
	const strokeWidth = controls.linestrokewidth.valueAsNumber;

	const boxSize = width / columns;
	const clipPathId = 'clipPath' + (crypto.getRandomValues(new Uint32Array(1))[0] % 9000 + 1000);
	const rows = Math.floor(height / boxSize);
	const verticalGap = (height - rows * boxSize) / 2;

	const elements = [...new Array(columns * rows)].map((_cell, cellIndex) => {
		const angle = angleFixed ? Math.random() < 0.5 ? 0 : 90 : Math.floor(Math.random() * 360);
		const color = randomColor ? `hsl(${Math.floor(Math.random() * 360)}, 80%, 50%)` : stroke;
		const colIndex = cellIndex % columns;
		const rowIndex = Math.floor(cellIndex / columns);

		return `
		<g transform="translate(${colIndex * boxSize}, ${verticalGap + rowIndex * boxSize}) rotate(${angle}, ${boxSize / 2}, ${boxSize / 2})" clip-path="url(#${clipPathId})">
			<rect width="${boxSize}" height="${boxSize}" fill="none" stroke="${gridColor}" stroke-width="${gridWidth}" />
			<circle cx="0" cy="0" r="${boxSize / 2}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" />
			<circle cx="${boxSize}" cy="${boxSize}" r="${boxSize / 2}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" />
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
