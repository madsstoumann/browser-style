import { commonConfig, handleGuiEvent, init } from '../common.js';
import { getViewBox } from '/assets/js/svgUtils.js';
import { hexToHSL } from '/assets/js/color.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const storageKey = 'circlelife';
const svg = document.getElementById('svg');

GUI.addRange('Circles', 42, '', { min: 1, max: 169, name: 'numcircles' });
GUI.addRange('Radius', 22, '', { min: 2, max: 100, name: 'radius' });
GUI.addColor('Stroke', '#F075F0', '', { name: 'stroke' });
GUI.addRange('Opacity', 0.5, '', { min: 0, max: 1, step: 0.01, name: 'strokeopacity' });
GUI.addColor('Fill', '#b814b8', '', { name: 'fill' });
GUI.addRange('Opacity', 0.1, '', { min: 0, max: 0.3, step: 0.01, name: 'fillopacity' });
GUI.addRange('Width', 0.15, '', { min: 0, max: 1, step: 0.01, name: 'linestrokewidth' });
GUI.addRange('Scale', 1, '', { min: 0, max: 2, step: 0.025, name: 'scale' });
commonConfig(GUI, '#080828');
GUI.addEventListener('gui-input', (event) => handleGuiEvent(event, svg, GUI, storageKey, circleOfLife));
init(GUI, storageKey, []);

/* === MAIN FUNCTION === */

function circleOfLife(svg, controls) {
  const { width, height } = getViewBox(svg);
  const fill = controls.fill.value;
  const fillOpacity = controls.fillopacity.valueAsNumber;
  const lineStrokeWidth = controls.linestrokewidth.valueAsNumber;
  const numCircles = controls.numcircles.valueAsNumber;
  const radius = controls.radius.valueAsNumber;
  const scale = controls.scale.valueAsNumber;
  const stroke = controls.stroke.value;
  const strokeOpacity = controls.strokeopacity.valueAsNumber;

  let [H, S, L] = hexToHSL(fill);
  svg.style.setProperty('fill', `hsla(${H}, ${S}%, ${L}%, ${fillOpacity})`);
  [H, S, L] = hexToHSL(stroke);
	svg.style.setProperty('stroke', `hsla(${H}, ${S}%, ${L}%, ${strokeOpacity})`);

  const positions = [];
  
  if (numCircles > 0) {
    positions.push({ x: 0, y: 0 });
  }
  if (numCircles > 1) {
    const angleIncrement = 360 / (numCircles - 1);
    for (let i = 1; i < numCircles; i++) {
      const angle = angleIncrement * i * Math.PI / 180;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      positions.push({ x, y });
    }
  }

  svg.innerHTML = `<g transform="translate(${width / 2} ${height / 2}) scale(${scale})">${
    positions.map((pos, index) => 
      `<circle cx="${pos.x}" cy="${pos.y}" r="${radius}" stroke-width="${index === 0 ? '0' : lineStrokeWidth}"></circle>`
    ).join('')
  }</g>`;
}
