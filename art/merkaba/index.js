import { commonConfig, handleGuiEvent, init } from '../common.js';
import { getViewBox } from '/assets/js/svgUtils.js';
import { hexToHSL } from '/assets/js/color.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const storageKey = 'metatron';
const svg = document.getElementById('svg');
GUI.addColor('Stroke', '#00FFFF', '', { name: 'stroke' });
GUI.addRange('Opacity', 0.5, '', { min: 0.01, max: 1, step: 0.01, name: 'strokeopacity' });
GUI.addRange('Width', 0.5, '', { min: 0.01, max: 1, step: 0.01, name: 'linestrokewidth' });
GUI.addRange('Scale', 1, '', { min: 0, max: 2, step: 0.025, name: 'scale' });
commonConfig(GUI, '#080828');
GUI.addEventListener('gui-input', (event) => handleGuiEvent(event, svg, GUI, storageKey, merkaba));
init(GUI, storageKey, []);

/* === MAIN FUNCTION === */

function merkaba(svg, controls) {
  const { width, height } = getViewBox(svg);
  const scale = controls.scale.valueAsNumber;
  const stroke = controls.stroke.value;
  const strokeOpacity = controls.strokeopacity.valueAsNumber;
  const strokeWidth = controls.linestrokewidth.valueAsNumber;

  const [H, S, L] = hexToHSL(stroke);
  svg.style.setProperty('stroke', `hsla(${H}, ${S}%, ${L}%, ${strokeOpacity})`);

  const radius = 45;
  const sqrt3 = Math.sqrt(3);

  // Calculate the points for the triangles
	const points = [
    // Large Bottom-pointing triangle
    { x1: 0, y1: radius, x2: sqrt3 / 2 * radius, y2: -0.5 * radius },
    { x1: sqrt3 / 2 * radius, y1: -0.5 * radius, x2: -sqrt3 / 2 * radius, y2: -0.5 * radius },
    { x1: -sqrt3 / 2 * radius, y1: -0.5 * radius, x2: 0, y2: radius },

		// Top triangle
		{ x1: 0, y1: -radius, x2: -sqrt3 / 6 * radius, y2: 0.5 * -radius },
		{ x1: 0, y1: -radius, x2: sqrt3 / 6 * radius, y2: 0.5 * -radius },

		// Left bottom triangle
		{ x1: -sqrt3 / 2 * radius, y1: 0.5 * radius, x2: -sqrt3 / 3 * radius, y2: 0 },
		{ x1: -sqrt3 / 2 * radius, y1: 0.5 * radius, x2: -sqrt3 / 6 * radius, y2: 0.5 * radius },
	
		// Right bottom triangle
		{ x1: sqrt3 / 2 * radius, y1: 0.5 * radius, x2: sqrt3 / 3 * radius, y2: 0 },
		{ x1: sqrt3 / 2 * radius, y1: 0.5 * radius, x2: sqrt3 / 6 * radius, y2: 0.5 * radius },

		 // Connecting triangle
		 { x1: 0, y1: 0, x2: 0, y2: -radius },
		 { x1: -sqrt3 / 2 * radius, y1: 0.5 * radius, x2: 0, y2: 0 },
		 { x1: sqrt3 / 2 * radius, y1: 0.5 * radius, x2: 0, y2: 0 },

		// Inner triangle
		{ x1: 0, y1: -radius / 2, x2: -sqrt3 / 4 * radius, y2: radius / 4 },
		{ x1: 0, y1: -radius / 2, x2: sqrt3 / 4 * radius, y2: radius / 4 },
		{ x1: -sqrt3 / 4 * radius, y1: radius / 4, x2: sqrt3 / 4 * radius, y2: radius / 4 },
  ];

  svg.innerHTML = `<g transform="translate(${width / 2} ${height / 2}) scale(${scale})">
    <circle cx="0" cy="0" r="${radius}" stroke-width="${strokeWidth}" fill="none"></circle>
    ${points.map(line =>
		`<line x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}" stroke-width="${strokeWidth}" />`
		).join('')}
  </g>`;
}
