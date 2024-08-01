import { commonConfig, handleGuiEvent, init } from '../common.js';
import { getViewBox } from '/assets/js/svgUtils.js';
import { interpolateColor } from '/assets/js/color.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const storageKey = 'mandala';
const svg = document.getElementById('svg');

GUI.addRange('Circles', 15, '', { min: 2, max: 20, name: 'circles' });
GUI.addRange('Arcs CW', 48, '', { min: 0, max: 100, name: 'arcscw' });
GUI.addRange('Arcs CCW', 48, '', { min: 0, max: 100, name: 'arcsccw' });
GUI.addRange('Radius Min', 2, '', { min: 0, max: 40, name: 'radiusmin' });
GUI.addRange('Radius Max', 46, '', { min: 10, max: 100, name: 'radiusmax' });
GUI.addColor('Stroke', '#6c3361', '', { name: 'stroke' });
GUI.addRange('Width', 0.06, '', { min: 0, max: 1.4, step: 0.01, name: 'strokewidth' });
GUI.addColor('Start Color', '#ff3773', '', { name: 'startcolor' });
GUI.addColor('End Color', '#8c9dd9', '', { name: 'endcolor' });
commonConfig(GUI, '#6c3361');
GUI.addEventListener('gui-input', (event) => handleGuiEvent(event, svg, GUI, storageKey, drawMandala));
init(GUI, storageKey, []);

/* === MAIN FUNCTION === */

function drawMandala(svg, controls) {
  svg.innerHTML = '';
	const { width, height } = getViewBox(svg);
  const arcsccw = controls.arcsccw.valueAsNumber;
  const arcscw = controls.arcscw.valueAsNumber;
  const circles = controls.circles.valueAsNumber;
  const endcolor = controls.endcolor.value;
  const radiusmax = controls.radiusmax.valueAsNumber;
  const radiusmin = controls.radiusmin.valueAsNumber;
  const startcolor = controls.startcolor.value;

  const centerX = width / 2;
  const centerY = height / 2;
  const radiusStep = (radiusmax - radiusmin) / (circles - 1);

  for (let i = circles; i--; i >= 0) {
    let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", centerX);
    circle.setAttribute("cy", centerY);
    circle.setAttribute("r", radiusmin + (i * radiusStep));
    circle.setAttribute("fill", interpolateColor(startcolor, endcolor, i / circles));
    svg.appendChild(circle);
  }

  function polarToCartesian(cx, cy, radius, angleInDegrees) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: cx + (radius * Math.cos(angleInRadians)),
      y: cy + (radius * Math.sin(angleInRadians))
    };
  }

  function arcGroup(sweepFlag, arcs) {
    const arcGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    for (let i = 0; i < arcs; i++) {
      const startAngle = i * (360 / arcs);
      const endAngle = startAngle + 360 / arcs;
      const start = polarToCartesian(centerX, centerY, radiusmin, startAngle);
      const end = polarToCartesian(centerX, centerY, radiusmax, endAngle);
      const arcPath = document.createElementNS("http://www.w3.org/2000/svg", "path");

      const pathData = [
        `M ${start.x} ${start.y}`,
        `A ${radiusmax} ${radiusmax} 0 0 ${sweepFlag} ${end.x} ${end.y}`
      ].join(" ");
      
      arcPath.setAttribute("d", pathData);
      arcGroup.appendChild(arcPath);
    }
    return arcGroup;
  }

  svg.appendChild(arcGroup(1, arcscw));
  svg.appendChild(arcGroup(0, arcsccw));
}
