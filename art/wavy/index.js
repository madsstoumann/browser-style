import { commonConfig, handleGuiEvent, init } from '../common.js';
import { hexToHSL } from '/assets/js/color.js';
import { createLinePath, getViewBox } from '/assets/js/svgUtils.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const storageKey = 'wavy';
const svg = document.getElementById('svg');

GUI.addRange('Amount', 90, '', { min: 2, max: 300, value: 90, name: 'amount' });
GUI.addRange('Rotation', 0, '', { min: 0, max: 35, value: 0, name: 'rotation' });
GUI.addRange('Stroke', 0, '', { min: 0, max: 10, step: 0.01, value: 0, name: 'pathstrokewidth' });
GUI.addRange('Amplitude', 2, '', { min: 0, max: 25, value: 2, name: 'amplitude' });
GUI.addRange('Frequency', 0.1, '', { min: 0, max: 0.2, step: 0.001, value: 0.015, name: 'frequency' });
GUI.addColor('Start Hue', '#ff0000', '', { name: 'starthue' });
GUI.addColor('End Hue', '#ff00ff', '', { name: 'endhue' });
GUI.addCheckbox('Round cap', 'round', '', { checked: 'checked', 'data-unchecked': 'butt', name: 'linecap' });
commonConfig(GUI, '#000000');
GUI.addEventListener('gui-input', (event) => handleGuiEvent(event, svg, GUI, storageKey, drawWavy));
init(GUI, storageKey, []);

/* === MAIN FUNCTION === */

function drawWavy(svg, controls) {
	const { width, height } = getViewBox(svg);
	const lineCount = controls.amount.valueAsNumber;
	const startHue = hexToHSL(controls.starthue.value)[0];
	const endHue = hexToHSL(controls.endhue.value)[0];
	const rotationMax = controls.rotation.valueAsNumber;
	const amplitude = controls.amplitude.valueAsNumber;
	const frequency = controls.frequency.valueAsNumber;
	const strokeWidth = controls.pathstrokewidth.valueAsNumber;

	svg.innerHTML = '';
	const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");

	for (let i = 0; i < 5; i++) {
		const pathAmplitude = amplitude + Math.random() * 0.5;
		const lineWidth = 0.2 + Math.random() * 0.2;
		const path = createLinePath(`line${i}`, 0, pathAmplitude, lineWidth + strokeWidth, frequency, height);
		defs.appendChild(path);
	}
	svg.appendChild(defs);

	let startX = 0;
	const xAdd = width / lineCount;

	for (let i = 0; i < lineCount; i++) {
		const hue = startHue + ((endHue - startHue) * (i / lineCount));
		const saturation = 40 + Math.random() * 40;
		const lightness = 30 + Math.random() * 30;

		const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
		use.setAttribute("href", `#line${i % 5}`);
		use.setAttribute("stroke", `hsl(${hue}, ${saturation}%, ${lightness}%)`);
		if (rotationMax !== 0) {
			const rotation = Math.random() * 2 * rotationMax - rotationMax;
			use.setAttribute("transform", `translate(${startX}, 0) rotate(${rotation}, ${startX + width / 2}, ${height / 2})`);
		} else {
			use.setAttribute("transform", `translate(${startX}, 0.5)`);
		}
		svg.appendChild(use);

		const lineWidth = parseFloat(svg.querySelector(`#line${i % 5}`).getAttribute("stroke-width"));
		startX += lineWidth * 0.2 + xAdd;
	}
}
