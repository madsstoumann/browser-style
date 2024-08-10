import { commonConfig, handleGuiEvent, init } from '../common.js';
import { getViewBox } from '/assets/js/svgUtils.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const storageKey = 'bauhaus';
const svg = document.getElementById('svg');

GUI.addRange('Cols/rows', 4, '', { min: 1, max: 10,name: 'columns' });
GUI.addCheckbox('Randomize', '', '', { name: 'randomize' });
commonConfig(GUI);
GUI.addEventListener('gui-input', (event) => handleGuiEvent(event, svg, GUI, storageKey, bauhaus));
init(GUI, storageKey, []);

/* === MAIN FUNCTION === */

function bauhaus(svg, controls) {
  const { width, height } = getViewBox(svg);
  const columns = controls.columns.valueAsNumber;
  const randomize = controls.randomize.checked;

  const clipPathId = 'clipPath' + crypto.getRandomValues(new Uint32Array(1))[0] % 9000 + 1000;
  const colors = ['#e47a2c', '#baccc0', '#6c958f', '#40363f', '#d7a26c', '#ae4935', '#f7e6d4', '#ad4835'];
  const colWidth = width / columns;
  const rowHeight = height / columns;
  const saturation = 50 + Math.random() * 30;

  const elements = [...new Array(columns * columns)].map((_cell, cellIndex) => {
    const colIndex = cellIndex % columns;
    const rowIndex = Math.floor(cellIndex / columns);
    let rectFill, circleFill;

    if (randomize) {
      const hue = Math.random() * 360;
      rectFill = `hsl(${hue}, ${saturation}%, 50%)`;
      circleFill = `hsl(${hue - 180}, ${saturation}%, 50%)`;
    } else {
      // Ensure that rectFill and circleFill are different colors
      const [color1, color2] = colors.sort(() => 0.5 - Math.random()).slice(0, 2);
      rectFill = color1;
      circleFill = color2;
    }

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
      <g transform="translate(${colIndex * colWidth}, ${rowIndex * rowHeight})" clip-path="url(#${clipPathId})">
        <rect width="${colWidth}" height="${rowHeight}" fill="${rectFill}" />
        <circle cx="${circlePosX}" cy="${circlePosY}" r="${radius}" fill="${circleFill}"  />
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
