import { handleGuiEvent, init } from '../common.js';
import { hexToHSL } from '/assets/js/color.js';
import { meshPolygons, rotatePoint, scalePoint } from '/assets/js/svgUtils.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const storageKey = 'mesh';
const svg = document.getElementById('svg');

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
GUI.addEventListener('gui-input', (event) => handleGuiEvent(event, svg, GUI, storageKey, drawMesh));
init(GUI, storageKey, []);

/* === MAIN FUNCTION === */

function drawMesh(svg, controls) {
	svg.innerHTML = '';

	const xLines = controls.xlines.valueAsNumber;
	const yLines = controls.ylines.valueAsNumber;
	const startHue = hexToHSL(controls.starthue.value)[0];
	const endHue = hexToHSL(controls.endhue.value)[0];
	const rotation = controls.rotation.valueAsNumber;
	const scale = controls.scale.valueAsNumber;
	const centerX = controls.centerx.valueAsNumber;
	const centerY = controls.centery.valueAsNumber;

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
	svg.append(meshPolygons(coords1, xLines, yLines, startHue, endHue));
	svg.append(meshPolygons(coords2, xLines, yLines, startHue, endHue));
	svg.append(meshPolygons(coords3, xLines, yLines, startHue, endHue));
	svg.append(meshPolygons(coords4, xLines, yLines, startHue, endHue));
	svg.append(meshPolygons(coordsCenter, xLines, yLines, startHue, endHue));
}
