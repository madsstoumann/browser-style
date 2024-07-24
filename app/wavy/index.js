import downloadContent from '/assets/js/downloadContent.js';
import { storeFormData, updatePresetOptions, loadStoredForm } from '/assets/js/formUtils.js';
import { hexToHSL } from '/assets/js/color.js';
import { drawWavyLines } from '/assets/js/svgUtils.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');

const svg = document.getElementById('svg');
const controls = GUI.form.elements;
const width = svg.getAttribute('width');
const height = svg.getAttribute('height');

GUI.addRange('Amount', 90, '', { min: 2, max: 300, value: 90, name: 'amount' });
GUI.addRange('Rotation', 0, '', { min: 0, max: 35, value: 0, name: 'rotation' });
GUI.addRange('Stroke', 0, '', { min: 0, max: 100, step: 0.1, value: 0, name: 'strokewidth' });
GUI.addRange('Amplitude', 20, '', { min: 0, max: 250, value: 20, name: 'amplitude' });
GUI.addRange('Frequency', 0.015, '', { min: 0, max: 0.1, step: 0.001, value: 0.015, name: 'frequency' });
GUI.addColor('Start Hue', '#ff0000', '', { name: 'starthue' });
GUI.addColor('End Hue', '#ff00ff', '', { name: 'endhue' });
GUI.addColor('Canvas', '#000000', '', { name: 'canvasbg' });
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

GUI.addEventListener('gui-input', (event) => {
	const { action, input, value } = event.detail;

	switch (action) {
		case 'download':
			downloadContent(svg.outerHTML, 'wavy.svg');
			break;

		case 'save-preset':
			const keyName = prompt('Please enter a name for this preset:');
			if (keyName) {
				storeFormData(GUI.form, keyName, 'wavy');
				updatePresetOptions(GUI.form.elements.presets, 'wavy');
			}
			break;

		case 'load-preset':
			const preset = JSON.parse(value);
			loadStoredForm(GUI.form, preset);
			break;

		default:
			switch (input.name) {
				case 'canvasbg':
					svg.style.backgroundColor = value;
					break;

				case 'frame':
					break;

				case 'linecap':
					svg.setAttribute('stroke-linecap', value);
					break;

				default:
					drawWavyLines(svg, 
						controls.amount.valueAsNumber, 
						width, 
						height, 
						hexToHSL(controls.starthue.value)[0], 
						hexToHSL(controls.endhue.value)[0], 
						controls.rotation.valueAsNumber, 
						controls.amplitude.valueAsNumber, 
						controls.frequency.valueAsNumber, 
						controls.strokewidth.valueAsNumber
					);
			}
	}
});

// Load stored presets from local storage
updatePresetOptions(GUI.form.elements.presets, 'wavy');

// Initial draw
drawWavyLines(svg, controls.amount.valueAsNumber, width, height, hexToHSL(controls.starthue.value)[0], hexToHSL(controls.endhue.value)[0], controls.rotation.valueAsNumber, controls.amplitude.valueAsNumber, controls.frequency.valueAsNumber, controls.strokewidth.valueAsNumber);