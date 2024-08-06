import { commonConfig, handleGuiEvent, init } from '../common.js';
import { getViewBox } from '/assets/js/svgUtils.js';
import { hexToHSL } from '/assets/js/color.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const storageKey = 'ellipse';
const svg = document.getElementById('svg');
GUI.addRange('Ellipses', 5, '', { min: 3, max: 21, step: 2, name: 'ellipses' });
GUI.addColor('Stroke', '#00FFFF', '', { name: 'stroke' });
GUI.addRange('Opacity', 0.5, '', { min: 0.01, max: 1, step: 0.01, name: 'strokeopacity' });
GUI.addRange('Width', 0.25, '', { min: 0.01, max: 1, step: 0.01, name: 'linestrokewidth' });
GUI.addRange('Scale', .95, '', { min: 0, max: 2, step: 0.025, name: 'scale' });
commonConfig(GUI, '#080828');
GUI.addEventListener('gui-input', (event) => handleGuiEvent(event, svg, GUI, storageKey, ellipse));
init(GUI, storageKey, []);

/* === MAIN FUNCTION === */

function ellipse(svg, controls) {
  const { width, height } = getViewBox(svg);
	const numEllipses = controls.ellipses.valueAsNumber;
  const scale = controls.scale.valueAsNumber;
  const stroke = controls.stroke.value;
  const strokeOpacity = controls.strokeopacity.valueAsNumber;
  const strokeWidth = controls.linestrokewidth.valueAsNumber;

  const [H, S, L] = hexToHSL(stroke);
  svg.style.setProperty('stroke', `hsla(${H}, ${S}%, ${L}%, ${strokeOpacity})`);

  svg.innerHTML = `<g transform="translate(${width / 2} ${height / 2}) scale(${scale})">
    <circle cx="0" cy="0" r="50" stroke-width="${strokeWidth}" fill="none"></circle>
    ${Array.from({ length: numEllipses }).map((_sphere, index) => `<g transform="rotate(${360/numSpheres * index})">
			<ellipse cx="0" cy="0" rx="15" ry="50" stroke-width="${strokeWidth}" fill="hsla(${H}, ${S}%, ${L}%, .1)"></ellipse>
			<line x1="0" y1="-50" x2="0" y2="50" stroke-width="${strokeWidth}"></line>
		</g>
		`).join('')}
  </g>`;
}
