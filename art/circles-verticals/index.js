import { commonConfig, handleGuiEvent, init } from '../common.js';
import { getViewBox } from '/assets/js/svgUtils.js';
import { hexToHSL } from '/assets/js/color.js';
import random from '/assets/js/random.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const storageKey = 'circlesverticals';
const svg = document.getElementById('svg');

GUI.addRange('Elements', 15, '', { min: 1, max: 100, name: 'numelements' });
GUI.addSelect('Palette', '', '', { 
  options: [
    { key: 'Fransiska Clausen', value: '#6d7678 #c7bfb4 #bfb9bb #b73825 #332822 #c1b6b2' },
    { key: 'Bauhaus Originals', value: '#f1e3d7 #e47a2c #baccc0 #6c958f #40363f #d7a26c #ae4935 #f7e6d4' }, 
    { key: 'Weimar Heritage', value: '#e3d4be #4f507d #aba59f #eba027 #1f1c16 #998a74 #e2471f #56704a #e2805f' },
    { key: 'Modernist Spectrum', value: '#e5e5e5 #D32F2F #1976D2 #FFC107 #388E3C #F57C00 #7B1FA2 #455A64 #FBC02D' },
    { key: 'Classic Bauhaus Tones', value: '#e8dcc5 #A63334 #3E5F8A #F2BF7C #7D807D #E7A95E #4C4B40 #83988E #D9C9A5' },
    { key: 'Dusty Weimar Shades', value: '#d3c7b6 #8D5A4A #526A82 #C4A981 #6A706E #B5803A #635D52 #A4B3A2 #CFC1A4' },
    { key: 'Industrial Grays', value: '#d4d4d4 #6B6E70 #4B4F52 #919497 #2D2E30 #A6A8AB #3A3C3F #C1C3C5 #787A7C' },
    { key: 'Muted Blue', value: '#d0d8e0 #4A637D #6E8499 #98A9B5 #2F4A66 #5B7490 #7D92A6 #A3B3C0 #3E5C7A' },
    { key: 'Muted Terracotta', value: '#dccbc0 #A2543A #B67F5E #D2A98A #8F6C5A #E8C3A6 #704B3E #C0876C #5A3D31' },
    { key: 'Autumn Modernism', value: '#d1b8a5 #7F4E2A #9B7042 #C49973 #5D6A5B #A77A4A #8C5B39 #B89675 #6E553C' },
    { key: 'Vintage Pastels', value: '#e9dfd7 #9A7F6B #A99488 #D1B5AC #82746E #B2A196 #C7B8AE #E3D4CD #746258' },
    { key: 'Olive & Ochre', value: '#d9d6b8 #5D5B39 #75744A #B3B077 #8A8558 #A39F6E #6E6C4D #D2CE98 #8F8D64' },
  ], 
  name: 'palette'
});
GUI.addRange('Rotate', 0, '', { min: 0, max: 359, name: 'rotate', value: 0 });
commonConfig(GUI, '#6d7678', '#000000');
GUI.addEventListener('gui-input', (event) => handleGuiEvent(event, svg, GUI, storageKey, circlesVerticals));
init(GUI, storageKey, []);

/* === MAIN FUNCTION === */

function circlesVerticals(svg, controls) {
  const { width, height } = getViewBox(svg);
  const colors = controls.palette.value.split(' ');
  const numElements = controls.numelements.valueAsNumber;
  const rotate = controls.rotate.valueAsNumber;

  const coords = new Array(numElements).fill().map(() => {
    let x = Math.random() - 0.5, y = Math.random() - 0.5;
    x = (x * 0.96875 + 0.5) * width;
    y = (y * 0.96875 + 0.5) * height;
    return [x, y];
  });

  const backgroundColor = colors.shift();
  controls.canvas.value = backgroundColor;
  svg.style.backgroundColor = backgroundColor;

  svg.innerHTML = 
    coords.map(coord => {
      const [x, y] = [...coord];
      const rectWidth = random(1, 10);
      const rectHeight = Math.max(random(1, 45), rectWidth * 3);

      let rectFill = colors[Math.floor(Math.random() * colors.length)];
      let circleFill;
      do {
        circleFill = colors[Math.floor(Math.random() * colors.length)];
      } while (circleFill === rectFill);

      return `
        <g transform="translate(${x},${y}) rotate(${rotate})">
          <rect y="${rectWidth / 2}" width="${rectWidth}" height="${rectHeight - rectWidth}" fill="${rectFill}" />
          <circle r="${rectWidth / 2}" cx="${rectWidth / 2}" cy="${rectWidth / 2}" fill="${circleFill}" />
          <circle r="${rectWidth / 2}" cx="${rectWidth / 2}" cy="${rectHeight - (rectWidth / 2)}" fill="${circleFill}" />
        </g>`;
    }).join('');
}
