import { commonConfig, handleGuiEvent, init } from '../common.js';
import { hexToHSL } from '/assets/js/color.js';
import { getViewBox } from '/assets/js/svgUtils.js';
import random from '/assets/js/random.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const storageKey = 'bauhaus';
const svg = document.getElementById('svg');

GUI.addRange('Columns', 4, '', { min: 1, max: 10,name: 'columns' });
GUI.addRange('Rows', 4, '', { min: 1, max: 10, name: 'rows' });
GUI.addColor('Start Hue', '#ff0000', '', { name: 'starthue' });
GUI.addColor('End Hue', '#ff0080', '', { name: 'endhue' });
commonConfig(GUI);
GUI.addEventListener('gui-input', (event) => handleGuiEvent(event, svg, GUI, storageKey, bauhaus));
init(GUI, storageKey, []);

/* === MAIN FUNCTION === */

function bauhaus(svg, controls) {
  const { width, height } = getViewBox(svg);
  const columns = controls.columns.valueAsNumber;
  const rows = controls.rows.valueAsNumber;

	const clipPathId = 'clipPath' + crypto.getRandomValues(new Uint32Array(1))[0] % 9000 + 1000;
  const colWidth = width / columns;
  const rowHeight = height / rows;
  const saturation = 50 + Math.random() * 30;

  const elements = [...new Array(columns * rows)].map((_cell, cellIndex) => {
    const colIndex = cellIndex % columns;
    const rowIndex = Math.floor(cellIndex / columns);
		const hue = Math.random() * 360;
		const radius = Math.random() < 0.5 ? colWidth / 2 : colWidth;

    let positions;
    if (radius === colWidth / 2) {
      positions = [0, colWidth / 2, colWidth, rowHeight / 2];
    } else {
      positions = [0, colWidth];
    }

    // Randomly choose from predefined positions
    const circlePosX = positions[Math.floor(Math.random() * positions.length)];
    const circlePosY = positions[Math.floor(Math.random() * positions.length)];

    return `
      <g transform="translate(${colIndex * colWidth}, ${rowIndex * rowHeight})">
        <rect width="${colWidth}" height="${rowHeight}" fill="hsl(${hue}, ${saturation}%, 50%)" />
        <circle cx="${circlePosX}" cy="${circlePosY}" r="${radius}" fill="hsl(${hue - 180}, ${saturation}%, 50%)" clip-path="url(#${clipPathId})" />
      </g>`;
  }).join('');

  svg.innerHTML = `
    <defs>
      <clipPath id="${clipPathId}">
        <rect width="${colWidth}" height="${rowHeight}" />
      </clipPath>
    </defs>
    ${elements}
  `;
}

