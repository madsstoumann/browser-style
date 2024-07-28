import { handleGuiEvent, init } from '../common.js';
import { random } from '/assets/js/utils.js';
import { getViewBox } from '/assets/js/svgUtils.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const storageKey = 'kusama';
const svg = document.getElementById('svg');

GUI.addRange('Dots', 125, '', { min: 25, max: 400, name: 'numdots' });
GUI.addColor('Color', '#E4473D', '', { name: 'fill' });
GUI.addRange('Min Radius', 10, '', { min: 1, max: 50, name: 'minradius' });
GUI.addRange('Max Radius', 150, '', { min: 50, max: 200, name: 'maxradius' });
GUI.addColor('Canvas', '#FFFFFF', '', { name: 'canvas' });
GUI.addColor('Frame', '#F6C6A4', '--frame-c', { name: 'frame' });
GUI.addSelect('Presets', '', '', { 
	options: [], 
	defaultOption: 'Select a preset',
	'data-action': 'load-preset',
	'name': 'presets'
});
GUI.addButton('Save', 'Save preset', 'button', { 'data-action': 'save-preset' });
GUI.addButton('Download', 'Download SVG', 'button', { 'data-action': 'download' });
GUI.addEventListener('gui-input', (event) => handleGuiEvent(event, svg, GUI, storageKey, kusamaDots));
init(GUI, storageKey, []);

/* === MAIN FUNCTION === */

function kusamaDots(svg, controls) {
	const { width, height } = getViewBox(svg);
	const numDots = controls.numdots.valueAsNumber;
	const minRadius = controls.minradius.valueAsNumber;
	const maxRadius = controls.maxradius.valueAsNumber;
	const dots = [];

	svg.style.fill = controls.fill.value;

  function createDot() {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    const radius = Math.random() * (maxRadius - minRadius) + minRadius;
    const dot = { radius, x, y };
    if (!dots.some(c => intersects(dot, c))) {
      return dot;
    }
    return null;
  }

	function intersects(first, second) {
		const dx = first.x - second.x;
		const dy = first.y - second.y;
		const distance = Math.sqrt(dx * dx + dy * dy);
		const sumOfRadii = first.radius + second.radius;
		return distance <= sumOfRadii;
	}

  while (dots.length < numDots) {
    const dot = createDot();
    if (dot !== null) dots.push(dot);
  }
	svg.innerHTML = dots.map(dot => `<circle r="${dot.radius}" cx="${dot.x}" cy="${dot.y}"></circle>`).join('');
}
