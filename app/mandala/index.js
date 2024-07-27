import downloadContent from '/assets/js/downloadContent.js';
import { formDataToObject, loadStoredForm, mergePresets, storeFormData, updatePresetOptions } from '/assets/js/formUtils.js';
import { polarToCartesian } from '/assets/js/svgUtils.js';
import { interpolate, interpolateColor } from '/assets/js/color.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const controls = GUI.form.elements;
const storageKey = 'mandala';
const svg = document.getElementById('svg');

GUI.addRange('Circles', 8, '', { min: 2, max: 20, name: 'circles' });
GUI.addRange('Arcs CW', 60, '', { min: 0, max: 100, name: 'arcscw' });
GUI.addRange('Arcs CCW', 60, '', { min: 0, max: 100, name: 'arcsccw' });
GUI.addRange('Radius Min', 5, '', { min: 0, max: 40, name: 'radiusmin' });
GUI.addRange('Radius Max', 45, '', { min: 10, max: 80, name: 'radiusmax' });
GUI.addColor('Stroke', '#444444', '', { name: 'stroke' });
GUI.addRange('Width', 0.15, '', { min: 0, max: 1.4, step: 0.01, name: 'strokewidth' });
GUI.addColor('Start Color', '#FF3773', '', { name: 'startcolor' });
GUI.addColor('End Color', '#8c9dd9', '', { name: 'endcolor' });
GUI.addColor('Canvas', '#EAE8DF', '', { name: 'canvas' });
GUI.addColor('Frame', '#f6c6a4', '--frame-c', { name: 'frame' });

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
			downloadContent(svg.outerHTML, `${storageKey}.svg`);
			break;
		case 'load-preset':
			const preset = JSON.parse(value);
			loadStoredForm(GUI.form, preset);
			break;
		case 'save-preset':
			const keyName = prompt('Please enter a name for this preset:');
			if (keyName) {
				storeFormData(GUI.form, keyName, storageKey);
				updatePresetOptions(GUI.form.elements.presets, storageKey);
			}
			break;
			
		default:
			switch (input.name) {
				case 'canvas':
					svg.style.backgroundColor = value;
					break;
				case 'frame':
					break;
				case 'stroke':
					svg.style.stroke = value;
					break;
				case 'strokewidth':
					svg.style.strokeWidth = value;
					break;
				default:
					drawMandala(svg, 
						controls.circles.valueAsNumber,
						controls.radiusmin.valueAsNumber,
						controls.radiusmax.valueAsNumber,
						controls.arcscw.valueAsNumber,
						controls.arcsccw.valueAsNumber,
						controls.startcolor.value,
						controls.endcolor.value
					);
			}
	}
});

function drawMandala(svg, circles, radiusmin, radiusmax, arcscw, arcsccw, startcolor, endcolor) {
	svg.innerHTML = '';
	const radiusStep = (radiusmax - radiusmin) / (circles - 1);

	for (let i = circles; i--; i >= 0) {
		let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		circle.setAttribute("cx", 50);
		circle.setAttribute("cy", 50);
		circle.setAttribute("r", radiusmin + (i * radiusStep));
		circle.setAttribute("fill", interpolateColor(startcolor, endcolor, i / circles));
		svg.appendChild(circle);
	}

	function arcGroup(sweepFlag = 1, arcs) {
		const arcGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
		for (let i = 0; i < arcs; i++) {
			const startAngle = i * (360 / arcs);
			const endAngle = startAngle + 360 / arcs;
			const start = polarToCartesian(50, 50, radiusmin, startAngle);
			const end = polarToCartesian(50, 50, radiusmax, endAngle);
			const arcPath = document.createElementNS("http://www.w3.org/2000/svg", "path");

			const pathData = [
				`M ${start.x} ${start.y}`,
				`A ${radiusmax} ${radiusmax} 0 0 ${sweepFlag} ${end.x} ${end.y}`
			].join(" ");
			
			arcPath.setAttribute("d", pathData);
			arcGroup.appendChild(arcPath);
		}
		return arcGroup;
	}

	svg.appendChild(arcGroup(1, arcscw));
	svg.appendChild(arcGroup(0, arcsccw));
}

// Init
const defaultPresets = [
	{
		"key": "Default",
		"value": {
			"circles": "8",
			"radiusmin": "5",
			"radiusmax": "50",
			"background": "#eae8df",
			"frame": "#f6c6a4"
		}
	}
];
document.addEventListener('DOMContentLoaded', () => {
	const existingPresets = JSON.parse(localStorage.getItem(storageKey)) || [];
	localStorage.setItem(storageKey, JSON.stringify(mergePresets(existingPresets, defaultPresets)));
	updatePresetOptions(GUI.form.elements.presets, storageKey);
	loadStoredForm(GUI.form, formDataToObject(new FormData(GUI.form)));
});
