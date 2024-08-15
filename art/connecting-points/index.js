import { commonConfig, handleGuiEvent, init } from '../common.js';
import { random } from '/assets/js/utils.js';
import { getViewBox } from '/assets/js/svgUtils.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const storageKey = 'connect';
const svg = document.getElementById('svg');

GUI.addRange('Points', 16, '', { min: 3, max: 42, name: 'numpoints' });
GUI.addColor('Line color', '#0dccf2', '', { name: 'stroke' });
GUI.addRange('Line width', 0.1, '', { min: 0, max: 1, step: 0.01, value: 0, name: 'linestrokewidth' });
GUI.addCheckbox('Randomize', false, '', { name: 'randomize' });
GUI.addRange('Scale', 0.95, '', { min: 0, max: 2, step: 0.025, name: 'scale' });
commonConfig(GUI, '#270c0c');
GUI.addEventListener('gui-input', (event) => handleGuiEvent(event, svg, GUI, storageKey, connectPoints));
init(GUI, storageKey, []);

/* === MAIN FUNCTION === */

function connectPoints(svg, controls) {
  const { width, height } = getViewBox(svg);
  const numPoints = controls.numpoints.valueAsNumber;
  const randomize = controls.randomize.checked;
  const scale = controls.scale.valueAsNumber;
  const lineStrokeWidth = controls.linestrokewidth.valueAsNumber;

  const polarToCartesian = (r, degrees) => {
    const radians = degrees * Math.PI / 180.0;
    return [r * Math.cos(radians), r * Math.sin(radians)];
  };

  const renderLines = (X, Y) => {
    return data.map(entry => {
      const [x, y] = entry;
      const stroke = `hsl(${random(0, 360)}, ${random(50, 100)}%, ${random(30, 90)}%)`;
      const strokeWidth = random(3, 30) / width;
      svg.style.setProperty('stroke-width', lineStrokeWidth);
      if (randomize) {
        // svg.style.removeProperty('stroke-width');
      } else {
        
      }
      if (X !== x && Y !== y) {
        return `<line x1="${X}" y1="${Y}" x2="${x}" y2="${y}" ${randomize ? `stroke="${stroke}"` : ''}></line>`;
      }
    }).join('');
  };

  const radius = Math.min(width, height) / 2;

  const data = [...new Array(numPoints)].map((_a, index) => {
    const angle = 360 / numPoints;
    const radian = angle * (index + 1);
    return polarToCartesian(radius, radian);
  });

  svg.innerHTML = `<g transform="translate(${width / 2} ${height / 2}) scale(${scale})">${data.map(entry => {
    const [x, y] = entry;
    return renderLines(x, y);
  }).join('')}</g>`;
}
