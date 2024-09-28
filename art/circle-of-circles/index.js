import { commonConfig, handleGuiEvent, init } from '../common.js';
import { getViewBox } from '/assets/js/svgUtils.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const storageKey = 'circlecircles';
const svg = document.getElementById('svg');

GUI.addRange('Circles', 100, '', { min: 10, max: 200, name: 'numcircles' });
GUI.addRange('Min Radius', 1, '', { min: 1, max: 25, name: 'minradius' });
GUI.addRange('Max Radius', 15, '', { min: 2, max: 50, name: 'maxradius' });
GUI.addRange('Cycles', 5, '', { min: 1, max: 25, name: 'cycles' });
GUI.addColor('Line color', '#F075F0', '', { name: 'stroke' });
GUI.addRange('Line width', 0.15, '', { min: 0.05, max: 1, step: 0.01, name: 'linestrokewidth' });
GUI.addCheckbox('No fill', false, '', { name: 'nofill' });
GUI.addCheckbox('Layered', false, '', { name: 'layered' });
GUI.addRange('Scale', 1, '', { min: 0, max: 2, step: 0.025, name: 'scale' });
commonConfig(GUI, '#080828');
GUI.addEventListener('gui-input', (event) => handleGuiEvent(event, svg, GUI, storageKey, circleOfCircles));
init(GUI, storageKey, []);

/* === MAIN FUNCTION === */

function circleOfCircles(svg, controls) {
  const { width, height } = getViewBox(svg);
  const lineStrokeWidth = controls.linestrokewidth.valueAsNumber;
  const numCircles = controls.numcircles.valueAsNumber;
  const maxRadius = controls.maxradius.valueAsNumber;
  const minRadius = controls.minradius.valueAsNumber;
  const scale = controls.scale.valueAsNumber;
  const stroke = controls.stroke.value;
  const cycles = controls.cycles.valueAsNumber;
  const canvas = controls.canvas.value;
  const layered = controls.layered.checked;
  const noFill = controls.nofill.checked;

  svg.style.fill = noFill ? 'transparent' : canvas;
  svg.style.stroke = stroke;
  svg.style.strokeWidth = lineStrokeWidth;

  const placementRadius = Math.min(width, height) / 2 - maxRadius;
  const angleStep = (2 * Math.PI) / numCircles;

  const getCircleRadius = (index) => {
    const cycleLength = numCircles / (cycles * 2);
    const cyclePos = index % cycleLength;
    const isGrowing = Math.floor(index / cycleLength) % 2 === 0;
    const radiusDelta = (maxRadius - minRadius) * (cyclePos / cycleLength);
    return isGrowing ? minRadius + radiusDelta : maxRadius - radiusDelta;
  };

  let circles = Array.from({ length: numCircles }).map((_, index) => {
    const angle = index * angleStep;
    const x = placementRadius * Math.cos(angle);
    const y = placementRadius * Math.sin(angle);
    const radius = getCircleRadius(index);
    return { x, y, radius, index };
  });

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  // Calculate bounding box for centering
  circles.forEach(({ x, y, radius }) => {
    minX = Math.min(minX, x - radius);
    minY = Math.min(minY, y - radius);
    maxX = Math.max(maxX, x + radius);
    maxY = Math.max(maxY, y + radius);
  });

  const boundingBoxCenterX = (minX + maxX) / 2;
  const boundingBoxCenterY = (minY + maxY) / 2;

  const translateX = width / 2 - boundingBoxCenterX;
  const translateY = height / 2 - boundingBoxCenterY;

  if (layered) {
    circles = circles.slice().sort((a, b) => b.radius - a.radius);
  } 

  svg.innerHTML = `<g transform="translate(${translateX} ${translateY}) scale(${scale})">
  ${circles.map(({ x, y, radius }) =>
    `<circle cx="${x}" cy="${y}" r="${radius}"></circle>`
  ).join('')}</g>`;
}
