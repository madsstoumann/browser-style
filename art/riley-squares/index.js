import { commonConfig, handleGuiEvent, init } from '../common.js';
import { getViewBox } from '/assets/js/svgUtils.js';
import { interpolateColor } from '../../assets/js/color.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const storageKey = 'rileysquares';
const svg = document.getElementById('svg');

GUI.addRange('Cols', 16, '', { min: 2, max: 48, name: 'cols' });
GUI.addRange('Rows', 16, '', { min: 2, max: 48, name: 'rows' });
GUI.addRange('Vanish Size', 0.25, '', { min: 0.25, max: 50, step: 0.25,  name: 'vanishsize' });
GUI.addRange('Rotate', 0, '', { min: 0, max: 180, name: 'rotate', value: 0 });
GUI.addColor('Fill', '#111111', '', { name: 'fill' });
GUI.addRange('Scale', 0.925, '', { min: 0, max: 2, step: 0.025, name: 'scale' });
commonConfig(GUI, '#FFFFFF', '#0c0b0b');
GUI.addEventListener('gui-input', (event) => handleGuiEvent(event, svg, GUI, storageKey, rileySquares));
init(GUI, storageKey, []);

/* === MAIN FUNCTION === */

function rileySquares(svg, controls) {
  const { width, height } = getViewBox(svg);
  const cols = controls.cols.valueAsNumber * 2;
  const rows = controls.rows.valueAsNumber;
  const rotate = controls.rotate.valueAsNumber;
  const scale = controls.scale.valueAsNumber;
  const vanishSize = controls.vanishsize.valueAsNumber;

  const defaultSizeX = (width / cols) * 2;
  const sizeY = height / rows;

  let squares = [];
  let currentX = -width / 2;
  let totalWidth = 0;

  for (let col = 0; col < cols; col++) {
    let adjustedSizeX;
    if (vanishSize <= defaultSizeX) {
      if (col < cols / 2) {
        const shrinkFactor = (cols / 2 - col) / (cols / 2);
        adjustedSizeX = vanishSize + (defaultSizeX * 2 - vanishSize) * shrinkFactor;
      } else {
        const growFactor = (col - cols / 2) / (cols / 2);
        adjustedSizeX = vanishSize + (defaultSizeX * 2 - vanishSize) * growFactor;
      }
    } else {
      if (col < cols / 2) {
        const growFactor = col / (cols / 2);
        adjustedSizeX = defaultSizeX + (vanishSize - defaultSizeX) * growFactor;
      } else {
        const shrinkFactor = (col - cols / 2) / (cols / 2);
        adjustedSizeX = vanishSize - (vanishSize - defaultSizeX) * shrinkFactor;
      }
    }
    totalWidth += adjustedSizeX;
  }

  const scaleFactor = width / totalWidth;

  for (let row = 0; row < rows; row++) {
    currentX = -width / 2;

    for (let col = 0; col < cols; col++) {
      let adjustedSizeX;

      if (vanishSize <= defaultSizeX) {
        if (col < cols / 2) {
          const shrinkFactor = (cols / 2 - col) / (cols / 2);
          adjustedSizeX = vanishSize + (defaultSizeX * 2 - vanishSize) * shrinkFactor;
        } else {
          const growFactor = (col - cols / 2) / (cols / 2);
          adjustedSizeX = vanishSize + (defaultSizeX * 2 - vanishSize) * growFactor;
        }
      } else {
        if (col < cols / 2) {
          const growFactor = col / (cols / 2);
          adjustedSizeX = defaultSizeX + (vanishSize - defaultSizeX) * growFactor;
        } else {
          const shrinkFactor = (col - cols / 2) / (cols / 2);
          adjustedSizeX = vanishSize - (vanishSize - defaultSizeX) * shrinkFactor;
        }
      }

      adjustedSizeX *= scaleFactor;

      if ((row + col) % 2 === 0) {
        squares.push({
          x: currentX,
          y: (row * sizeY) - (height / 2),
          width: adjustedSizeX,
          height: sizeY
        });
      }
      currentX += adjustedSizeX;
    }
  }

  const translateX = width / 2;
  const translateY = height / 2;

  svg.style.fill = controls.fill.value;
  svg.innerHTML = `<g transform="translate(${translateX} ${translateY}) scale(${scale}) rotate(${rotate})">
    ${squares.map(square => `
      <rect x="${square.x}" y="${square.y}" width="${square.width}" height="${square.height}" />
    `).join('')}
  </g>`;
}
