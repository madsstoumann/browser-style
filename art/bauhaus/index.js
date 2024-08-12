import { commonConfig, handleGuiEvent, init } from '../common.js';
import { getViewBox } from '/assets/js/svgUtils.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const storageKey = 'bauhaus';
const svg = document.getElementById('svg');

GUI.addRange('Cols', 4, '', { min: 1, max: 10, name: 'columns' });
GUI.addRange('Rrows', 4, '', { min: 1, max: 10, name: 'rows' });
GUI.addCheckbox('Randomize', '', '', { name: 'randomize' });
commonConfig(GUI, '#40363f');
GUI.addEventListener('gui-input', (event) => handleGuiEvent(event, svg, GUI, storageKey, bauhaus));
init(GUI, storageKey, []);

/* === MAIN FUNCTION === */

function bauhaus(svg, controls) {
	const { width, height } = getViewBox(svg);
	const columns = controls.columns.valueAsNumber;
	const rows = controls.rows.valueAsNumber;
	const randomize = controls.randomize.checked;

	const boxWidth = Math.min(width / columns, height / rows);
	const clipPathId = 'clipPath' + crypto.getRandomValues(new Uint32Array(1))[0] % 9000 + 1000;
	const colors = ['#e47a2c', '#baccc0', '#6c958f', '#40363f', '#d7a26c', '#ae4935', '#f7e6d4', '#ad4835'];
	const saturation = 50 + Math.random() * 30;

	const elements = [...new Array(columns * rows)].map((_cell, cellIndex) => {
		const colIndex = cellIndex % columns;
		const rowIndex = Math.floor(cellIndex / columns);
		let bgFill, fgFill;

		if (randomize) {
			const hue = Math.random() * 360;
			bgFill = `hsl(${hue}, ${saturation}%, 50%)`;
			fgFill = `hsl(${hue - 180}, ${saturation}%, 50%)`;
		} else {
			const [color1, color2] = colors.sort(() => 0.5 - Math.random()).slice(0, 2);
			bgFill = color1;
			fgFill = color2;
		}

		const radius = Math.random() < 0.5 ? boxWidth / 2 : boxWidth;

		let positions;
		if (radius === boxWidth / 2) {
			positions = [0, boxWidth / 2, boxWidth, boxWidth / 2];
		} else {
			positions = [0, boxWidth];
		}

		const circlePosX = positions[Math.floor(Math.random() * positions.length)];
		const circlePosY = positions[Math.floor(Math.random() * positions.length)];
		const randomValue = Math.random();
		const patternChoice = randomValue < 0.7 ? 0 : Math.floor(Math.random() * 5) + 1;

		let pattern;
		switch (patternChoice) {
			case 0:
				pattern = `<circle cx="${circlePosX}" cy="${circlePosY}" r="${radius}" fill="${fgFill}" />`;
				break;
			case 1:
				pattern = `<rect width="${boxWidth / 2}" height="${boxWidth}" fill="${fgFill}" />`;
				break;
			case 2:
				pattern = `<rect width="${boxWidth}" height="${boxWidth / 2}" fill="${fgFill}" />`;
				break;
			case 3:
				pattern = `<polygon points="0,0 ${boxWidth},0 ${boxWidth},${boxWidth}" fill="${fgFill}" />`;
				break;
			case 4:
				pattern = `<polygon points="${boxWidth},0 ${boxWidth},${boxWidth} 0,${boxWidth}" fill="${fgFill}" />`;
				break;
			case 5:
				pattern = `<circle cx="0" cy="${boxWidth / 2}" r="${boxWidth / 2}" fill="${fgFill}" />
									 <circle cx="${boxWidth}" cy="${boxWidth / 2}" r="${boxWidth / 2}" fill="${fgFill}" />`;
				break;
			case 6:
				pattern = `<circle cx="${boxWidth / 2}" cy="0" r="${boxWidth / 2}" fill="${fgFill}" />
									 <circle cx="${boxWidth / 2}" cy="${boxWidth}" r="${boxWidth / 2}" fill="${fgFill}" />`;
				break;
		}

		return `
			<g transform="translate(${colIndex * boxWidth}, ${rowIndex * boxWidth})" clip-path="url(#${clipPathId})">
				<rect width="${boxWidth}" height="${boxWidth}" fill="${bgFill}" />
				${pattern}
			</g>`;
	}).join('');

	// Calculate the dimensions of the grid
	const gridWidth = columns * boxWidth;
	const gridHeight = rows * boxWidth;

	// Centering translation
	const translateX = (width - gridWidth) / 2;
	const translateY = (height - gridHeight) / 2;

	// Apply the centering translation and scale to the entire grid
	svg.innerHTML = `
		<defs>
			<clipPath id="${clipPathId}">
				<rect width="${boxWidth}" height="${boxWidth}" />
			</clipPath>
		</defs>
		<g transform="translate(${translateX}, ${translateY})">
			${elements}
		</g>`;
}
