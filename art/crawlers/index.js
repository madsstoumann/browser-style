import { commonConfig, handleGuiEvent, init } from '../common.js';
import { getViewBox } from '/assets/js/svgUtils.js';
import { random } from '/assets/js/utils.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const storageKey = 'crawlers';
const svg = document.getElementById('svg');

GUI.addRange('Crawlers', 5, '', { min: 1, max: 20, name: 'crawlers' });
GUI.addRange('Lines', 25, '', { min: 4, max: 100, name: 'lines' });
GUI.addColor('Line color', '#333333', '', { name: 'stroke' });
GUI.addCheckbox('Rdm Color', false, '', { name: 'randomize' });
GUI.addRange('Line width', 0.1, '', { min: 0, max: 1, step: 0.01, value: 0, name: 'linestrokewidth' });
commonConfig(GUI, '#EEEEEE');
GUI.addEventListener('gui-input', (event) => handleGuiEvent(event, svg, GUI, storageKey, crawlers));
init(GUI, storageKey, []);

/* === MAIN FUNCTION === */

function crawlers(svg, controls) {
	const { width, height } = getViewBox(svg);
	const crawlers = controls.crawlers.valueAsNumber;
	const lines = controls.lines.valueAsNumber;
	const lineStrokeWidth = controls.linestrokewidth.valueAsNumber;
	const randomize = controls.randomize.checked;
	const gridWidth = width / crawlers;
	const gridHeight = height / crawlers;
	const stepX = width / lines;
	const stepY = height / lines;
	
	const stroke = () => randomize ? `hsl(${random(0, 360)}, ${random(50, 100)}%, ${random(30, 60)}%)` : controls.stroke.value;
	svg.style.strokeWidth = lineStrokeWidth;
	const svgLines = [];

	for (let row = 0; row < crawlers; row++) {
		for (let col = 0; col < crawlers; col++) {

			const x = col * gridWidth + Math.random() * gridWidth;
			const y = row * gridHeight + Math.random() * gridHeight;
			const xStart = col * gridWidth;
			const yStart = row * gridHeight;
			const xEnd = xStart + gridWidth;
			const yEnd = yStart + gridHeight;

			for (let i = 0; i <= gridWidth; i += stepX) {
				// Top and bottom edges
				svgLines.push(`<line x1="${x}" y1="${y}" x2="${xStart + i}" y2="${yStart}" stroke="${stroke()}"/>`);
				svgLines.push(`<line x1="${x}" y1="${y}" x2="${xStart + i}" y2="${yEnd}" stroke="${stroke()}"/>`);
			}

			for (let i = 0; i <= gridHeight; i += stepY) {
				// Left and right edges
				svgLines.push(`<line x1="${x}" y1="${y}" x2="${xStart}" y2="${yStart + i}" stroke="${stroke()}"/>`);
				svgLines.push(`<line x1="${x}" y1="${y}" x2="${xEnd}" y2="${yStart + i}" stroke="${stroke()}"/>`);
			}
		}
	}

	svg.innerHTML = svgLines.join('\n');
}

