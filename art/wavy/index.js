import { handleGuiEvent, init } from '../common.js';
import { hexToHSL } from '/assets/js/color.js';
import { createLinePath, getViewBox } from '/assets/js/svgUtils.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const storageKey = 'wavy';
const svg = document.getElementById('svg');

GUI.addRange('Amount', 90, '', { min: 2, max: 300, value: 90, name: 'amount' });
GUI.addRange('Rotation', 0, '', { min: 0, max: 35, value: 0, name: 'rotation' });
GUI.addRange('Stroke', 0, '', { min: 0, max: 100, step: 0.1, value: 0, name: 'pathstrokewidth' });
GUI.addRange('Amplitude', 20, '', { min: 0, max: 250, value: 20, name: 'amplitude' });
GUI.addRange('Frequency', 0.015, '', { min: 0, max: 0.1, step: 0.001, value: 0.015, name: 'frequency' });
GUI.addColor('Start Hue', '#ff0000', '', { name: 'starthue' });
GUI.addColor('End Hue', '#ff00ff', '', { name: 'endhue' });
GUI.addColor('Canvas', '#000000', '', { name: 'canvas' });
GUI.addColor('Frame', '#f6c6a4', '--frame-c', { name: 'frame' });
GUI.addCheckbox('Round cap', 'round', '', { checked: 'checked', 'data-unchecked': 'butt', name: 'linecap' });
GUI.addSelect('Presets', '', '', { 
	options: [], 
	defaultOption: 'Select a preset',
	'data-action': 'load-preset',
	'name': 'presets'
});
GUI.addButton('Save', 'Save preset', 'button', { 'data-action': 'save-preset' });
GUI.addButton('Download', 'Download SVG', 'button', { 'data-action': 'download' });
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
		const pathAmplitude = amplitude + Math.random() * 5;
		const lineWidth = 2 + Math.random() * 1;
		const path = createLinePath(`line${i}`, -20, pathAmplitude, lineWidth + strokeWidth, frequency, height);
		defs.appendChild(path);
	}
	svg.appendChild(defs);

	let startX = -20;
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
			use.setAttribute("transform", `translate(${startX}, 0)`);
		}
		svg.appendChild(use);

		const lineWidth = parseFloat(svg.querySelector(`#line${i % 5}`).getAttribute("stroke-width"));
		startX += lineWidth * 0.8 + xAdd;
	}
}
