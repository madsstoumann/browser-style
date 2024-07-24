import downloadContent from '/assets/js/downloadContent.js';
import { storeFormData, updatePresetOptions, loadStoredForm } from '/assets/js/formUtils.js';
import { hexToHSL } from '/assets/js/color.js';
import { drawMeshRect } from '/assets/js/svgUtils.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');

const svg = document.getElementById('svg');
const controls = GUI.form.elements;
const width = svg.getAttribute('width');
const height = svg.getAttribute('height');

GUI.addRange('Lines X', 10, '', { min: 1, max: 50, value: 10, name: 'xlines' });
GUI.addRange('Lines Y', 10, '', { min: 1, max: 50, value: 10, name: 'ylines' });

GUI.addRange('Rotation', 0, '', { min: -90, max: 90, name: 'rotation' });
GUI.addRange('Center X', 50, '', { min: 0, max: 100, name: 'centerx' });
GUI.addRange('Center Y', 50, '', { min: 0, max: 100, name: 'centery' });

GUI.addRange('Scale', 1, '', { min: 0, max: 5, step: 1, name: 'scale' });


GUI.addColor('Start Hue', '#ff0000', '', { name: 'starthue' });
GUI.addColor('End Hue', '#ff00ff', '', { name: 'endhue' });

GUI.addColor('Stroke', '#FFFFFF', '', { name: 'stroke' });
GUI.addRange('Width', 0.05, '', { min: 0, max: 3, step: 0.01, name: 'strokewidth' });

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
			downloadContent(svg.outerHTML, 'mesh.svg');
			break;

		case 'save-preset':
			const keyName = prompt('Please enter a name for this preset:');
			if (keyName) {
				storeFormData(GUI.form, keyName, 'mesh');
				updatePresetOptions(GUI.form.elements.presets, 'mesh');
			}
			break;

		case 'load-preset':
			const preset = JSON.parse(value);
			loadStoredForm(GUI.form, preset);
			break;

		default:
			switch (input.name) {
				case 'frame':
					break;
				case 'stroke':
					svg.style.stroke = value;
					break;
				case 'strokewidth':
					svg.style.strokeWidth = value;
					break;

				default:
					drawMesh(
						controls.xlines.valueAsNumber,
						controls.ylines.valueAsNumber,
						hexToHSL(controls.starthue.value)[0],
						hexToHSL(controls.endhue.value)[0],
						controls.rotation.valueAsNumber,
						controls.scale.valueAsNumber,
						controls.centerx.valueAsNumber,
						controls.centery.valueAsNumber
					);
			}
	}
});

// Load stored presets from local storage
updatePresetOptions(GUI.form.elements.presets, 'mesh');

function rotatePoint(cx, cy, x, y, angle) {
	const radians = (Math.PI / 180) * angle;
	const cos = Math.cos(radians);
	const sin = Math.sin(radians);
	const nx = (cos * (x - cx)) - (sin * (y - cy)) + cx;
	const ny = (sin * (x - cx)) + (cos * (y - cy)) + cy;
	return [nx, ny];
}

function scalePoint(cx, cy, x, y, scale) {
	const dx = x - cx;
	const dy = y - cy;
	return [cx + dx * scale, cy + dy * scale];
}

function drawMesh(xLines, yLines, hueStart, hueEnd, rotation = 0, scale = 1, centerX = 50, centerY = 50) {
	svg.innerHTML = '';

	let coords1 = [[0, 0], [40, 40], [40, 60], [0, 100]];
	let coords2 = [[100, 0], [60, 40], [60, 60], [100, 100]];
	let coords3 = [[0, 0], [40, 40], [60, 40], [100, 0]];
	let coords4 = [[0, 100], [40, 60], [60, 60], [100, 100]];
	let coordsCenter = [[40, 40], [60, 40], [60, 60], [40, 60]];

	if (scale !== 1) {
		coordsCenter = coordsCenter.map(([x, y]) => scalePoint(centerX, centerY, x, y, scale));
	}

	if (rotation !== 0) {
		coordsCenter = coordsCenter.map(([x, y]) => rotatePoint(centerX, centerY, x, y, rotation));
	}

	coords1[1] = coordsCenter[0];
	coords1[2] = coordsCenter[3];

	coords2[1] = coordsCenter[1];
	coords2[2] = coordsCenter[2];

	coords3[1] = coordsCenter[0];
	coords3[2] = coordsCenter[1];

	coords4[1] = coordsCenter[3];
	coords4[2] = coordsCenter[2];

	// Draw the meshes
	svg.append(drawMeshRect(coords1, xLines, yLines, hueStart, hueEnd));
	svg.append(drawMeshRect(coords2, xLines, yLines, hueStart, hueEnd));
	svg.append(drawMeshRect(coords3, xLines, yLines, hueStart, hueEnd));
	svg.append(drawMeshRect(coords4, xLines, yLines, hueStart, hueEnd));
	svg.append(drawMeshRect(coordsCenter, xLines, yLines, hueStart, hueEnd));
}

drawMesh(controls.xlines.valueAsNumber, controls.ylines.valueAsNumber, hexToHSL(controls.starthue.value)[0], hexToHSL(controls.endhue.value)[0]);