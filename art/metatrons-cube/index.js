import { commonConfig, handleGuiEvent, init } from '../common.js';
import { getViewBox } from '/assets/js/svgUtils.js';
import { hexToHSL } from '/assets/js/color.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const storageKey = 'metatron';
const svg = document.getElementById('svg');
GUI.addRange('Radius', 9, '', { min: 1, max: 50, step: 0.1, name: 'radius' });
GUI.addColor('Stroke', '#FFFFFF', '', { name: 'stroke' });
GUI.addRange('Opacity', 0.85, '', { min: 0.01, max: 1, step: 0.01, name: 'strokeopacity' });
GUI.addRange('Width', 0.15, '', { min: 0.01, max: 1, step: 0.01, name: 'linestrokewidth' });
GUI.addRange('Scale', 1, '', { min: 0, max: 2, step: 0.025, name: 'scale' });
commonConfig(GUI, '#080828');
GUI.addEventListener('gui-input', (event) => handleGuiEvent(event, svg, GUI, storageKey, metatronCube));
init(GUI, storageKey, []);

/* === MAIN FUNCTION === */

function metatronCube(svg, controls) {
  const { width, height } = getViewBox(svg);
  const radius = controls.radius.valueAsNumber;
  const scale = controls.scale.valueAsNumber;
	const stroke = controls.stroke.value;
	const strokeOpacity = controls.strokeopacity.valueAsNumber;
  const strokeWidth = controls.linestrokewidth.valueAsNumber;

	const [H, S, L] = hexToHSL(stroke);
	svg.style.setProperty('stroke', `hsla(${H}, ${S}%, ${L}%, ${strokeOpacity})`);
  
  const points = [
    { x: -2 * radius, y: Math.sqrt(3) * 2 * -radius, connect: 1 },
    { x: 0, y: Math.sqrt(3) * 2 * -radius },
    { x: 2 * radius, y: Math.sqrt(3) * 2 * -radius, connect: 1 },
    
    { x: -3 * radius, y: Math.sqrt(3) * -radius },
    { x: -1 * radius, y: Math.sqrt(3) * -radius },
    { x: 1 * radius, y: Math.sqrt(3) * -radius },
    { x: 3 * radius, y: Math.sqrt(3) * -radius }, 
    
    { x: -4 * radius, y: 0, connect: 1 },
    { x: -2 * radius, y: 0 },
    { x: 0, y: 0, connect: 1 }, /* center */
    { x: 2 * radius, y: 0 },
    { x: 4 * radius, y: 0, connect: 1 },

    { x: -3 * radius, y: Math.sqrt(3) * radius },
    { x: -1 * radius, y: Math.sqrt(3) * radius },
    { x: 1 * radius, y: Math.sqrt(3) * radius },
    { x: 3 * radius, y: Math.sqrt(3) * radius },

    { x: -2 * radius, y: Math.sqrt(3) * 2 * radius, connect: 1 },
    { x: 0, y: Math.sqrt(3) * 2 * radius },
    { x: 2 * radius, y: Math.sqrt(3) * 2 * radius, connect: 1 },
  ];

  
  const connect = points.filter(point => point.connect);
  const connected = [];
  for (let i = 0; i < connect.length; i++) {
    for (let j = i + 1; j < connect.length; j++) {
      connected.push({ x1: connect[i].x, y1: connect[i].y, x2: connect[j].x, y2: connect[j].y });
    }
  }

  // Additional connections around the center point
  const angleIncrement = 30; // 360 / 12 = 30 degrees for each point around the center
  for (let i = 0; i < 12; i++) {
    const angle = angleIncrement * i * Math.PI / 180;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    connected.push({ x1: 0, y1: 0, x2: x, y2: y }); // Connect the new points to the center point
    connect.forEach(point => {
      connected.push({ x1: point.x, y1: point.y, x2: x, y2: y });
    });
  }

  const circles = points.map(pos => 
    `<circle cx="${pos.x}" cy="${pos.y}" r="${radius}" stroke-width="${strokeWidth}" fill="none"></circle>`
  ).join('');

  const lines = connected.map(line =>
    `<line x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}" stroke-width="${strokeWidth}"></line>`
  ).join('');

  svg.innerHTML = `<g transform="translate(${width / 2} ${height / 2}) scale(${scale})">${circles}${lines}</g>`;
}
