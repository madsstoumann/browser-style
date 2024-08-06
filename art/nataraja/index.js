import { commonConfig, handleGuiEvent, init } from '../common.js';
import { hexToHSL } from '/assets/js/color.js';
import { getViewBox } from '/assets/js/svgUtils.js';
import random from '/assets/js/random.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const storageKey = 'mesh';
const svg = document.getElementById('svg');

GUI.addRange('Columns', 20, '', { min: 1, max: 50, value: 10, name: 'columns' });
GUI.addRange('Rows', 20, '', { min: 1, max: 50, value: 10, name: 'rows' });
GUI.addRange('Skew', -40, '', { min: -65, max: 65, name: 'skew' });

GUI.addColor('Start Hue', '#ff0000', '', { name: 'starthue' });
GUI.addColor('End Hue', '#ff0080', '', { name: 'endhue' });


commonConfig(GUI);
GUI.addEventListener('gui-input', (event) => handleGuiEvent(event, svg, GUI, storageKey, nataraja));
init(GUI, storageKey, []);

/* === MAIN FUNCTION === */

function nataraja(svg, controls) {
	const { width, height } = getViewBox(svg);
	const columns = controls.columns.valueAsNumber;
	const rows = controls.rows.valueAsNumber;
	const startHue = hexToHSL(controls.starthue.value)[0];
	const endHue = hexToHSL(controls.endhue.value)[0];
	const skew = controls.skew.valueAsNumber;

	const colWidth = width / columns;
	const rowHeight = height / rows;

	svg.innerHTML = [...new Array(columns)].map((_col, colIndex) => {
		const sign = skew > 0 ? -1 : 1;
		const translation = Math.abs(colIndex * colWidth * Math.tan(skew * Math.PI / 180)) * sign;

		let rowHTML = '';
		let rowIndex = 0;

		while (rowIndex < rows) {
			const span = Math.random() < 0.2 ? Math.floor(Math.random() * (3 - 2 + 1)) + 2 : 1;
			const actualSpan = Math.min(span, rows - rowIndex);
			rowHTML += `
				<rect width="${colWidth}" height="${rowHeight * actualSpan}" x="${colWidth * colIndex}" y="${rowHeight * rowIndex}" fill="hsl(${
					random(startHue, endHue)}, ${random(50, 80)}%, ${random(50, 80)}%)">
				</rect>`;
			rowIndex += actualSpan;
		}
//  scale(1 ${1 + (Math.abs(skew) / 65 * 0.3)})
		// return `<g transform="skewY(${skew}) translate(0, ${translation})">${rowHTML}</g>`;
		return `<g>${rowHTML}</g>`;
	}).join('');
}
