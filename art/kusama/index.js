import { commonConfig, handleGuiEvent, init } from '../common.js';
import { getViewBox } from '/assets/js/svgUtils.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const storageKey = 'kusama';
const svg = document.getElementById('svg');

GUI.addRange('Dots', 100, '', { min: 25, max: 400, name: 'numdots' });
GUI.addColor('Color', '#E4473D', '', { name: 'fill' });
GUI.addRange('Min Radius', 1, '', { min: 0.1, max: 5, step: 0.1, name: 'minradius' });
GUI.addRange('Max Radius', 15, '', { min: 5, max: 20, step: 0.1, name: 'maxradius' });
commonConfig(GUI);
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
