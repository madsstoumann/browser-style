import { commonConfig, handleGuiEvent, init } from '../common.js';
import { getViewBox } from '/assets/js/svgUtils.js';
import { hexToHSL } from '/assets/js/color.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const storageKey = 'ripples';
const svg = document.getElementById('svg');

GUI.addRange('Bottom', 6, '', { max: 24, name: 'bottomcircles' });
GUI.addRange('Left', 6, '', { max: 24, name: 'leftcircles', value: 0 });
GUI.addRange('Right', 6, '', { max: 24, name: 'rightcircles', value: 0 });
GUI.addRange('Top', 6, '', { max: 24, name: 'topcircles', value: 0 });
GUI.addColor('Line color', '#00FFFF', '', { name: 'strokecolor' });
GUI.addRange('Line width', 0.25, '', { min: 0.01, max: 1, step: 0.01, name: 'linestrokewidth' });
GUI.addRange('Opacity', 0.5, '', { min: 0.01, max: 1, step: 0.01, name: 'strokeopacity' });
GUI.addCheckbox('Use Fill', '', '', { name: 'fillcolor', checked: 'checked' });
GUI.addRange('Scale', .95, '', { min: 0, max: 2, step: 0.025, name: 'scale' });
commonConfig(GUI, '#080828');
GUI.addEventListener('gui-input', (event) => handleGuiEvent(event, svg, GUI, storageKey, ripples));
init(GUI, storageKey, []);

/* === MAIN FUNCTION === */

function ripples(svg, controls) {
  const { width, height } = getViewBox(svg);
  const bottomCircles = controls.bottomcircles.valueAsNumber;
  const leftCircles = controls.leftcircles.valueAsNumber;
  const rightCircles = controls.rightcircles.valueAsNumber;
  const topCircles = controls.topcircles.valueAsNumber;
  const scale = controls.scale.valueAsNumber;
  const stroke = controls.strokecolor.value;
  const strokeOpacity = controls.strokeopacity.valueAsNumber;
  const strokeWidth = controls.linestrokewidth.valueAsNumber;
  const useFill = controls.fillcolor.checked; 

  const [H, S, L] = hexToHSL(stroke);
  const fill = useFill ? `hsla(${H}, ${S}%, ${L}%, .1)` : 'none';
  svg.style.setProperty('stroke', `hsla(${H}, ${S}%, ${L}%, ${strokeOpacity})`);
  svg.style.setProperty('stroke-width', strokeWidth);

  const outer = Math.min(width, height) / 2;

  svg.innerHTML = `<g transform="translate(${width / 2} ${height / 2}) scale(${scale})">
    <circle cx="0" cy="0" r="${outer}" fill="none"></circle>

    ${Array.from({ length: bottomCircles }).map((_c, index) => {
      const radius = (outer / (bottomCircles + 1)) * (index + 1);
      const cy = outer - radius;
      return `<circle cx="0" cy="${cy}" r="${radius}" fill="${fill}"></circle>`;
    }).join('')}

    ${Array.from({ length: leftCircles }).map((_c, index) => {
      const radius = (outer / (leftCircles + 1)) * (index + 1);
      const cx = radius - outer;
      return `<circle cx="${cx}" cy="0" r="${radius}" fill="${fill}"></circle>`;
    }).join('')}

    ${Array.from({ length: rightCircles }).map((_c, index) => {
      const radius = (outer / (rightCircles + 1)) * (index + 1);
      const cx = outer - radius;
      return `<circle cx="${cx}" cy="0" r="${radius}" fill="${fill}"></circle>`;
    }).join('')}

    ${Array.from({ length: topCircles }).map((_c, index) => {
      const radius = (outer / (topCircles + 1)) * (index + 1);
      const cy = radius - outer;
      return `<circle cx="0" cy="${cy}" r="${radius}" fill="${fill}"></circle>`;
    }).join('')}
  </g>`;
}
