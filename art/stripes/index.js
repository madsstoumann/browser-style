import { commonConfig, handleGuiEvent, init } from '../common.js';
import { getViewBox } from '/assets/js/svgUtils.js';
import { hexToHSL } from '/assets/js/color.js';
import random from '/assets/js/random.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const storageKey = 'stripes';
const svg = document.getElementById('svg');

GUI.addRange('Stripes', 35, '', { min: 4, max: 100, name: 'stripes' });
GUI.addCheckbox('Random', false, '', { name: 'randomwidth', checked: 'checked' });
GUI.addColor('Hue', '#00c8fa', '', { name: 'hue' });
GUI.addSelect('Palette', '', '', { 
  options: [
		{ key: 'Riley London', value: '#DE99B5 #E2A65E #E9C0BE #96C8D3 #E9C0BE #96C8D3 #E0A4BD #E2A35C #E9C0BE #E2A35C #92BFE9 #D58272 #E0A6BE #D6806F #61AB7A #D3A9BD #DC8E5E #9BA9D6 #87B43D #F0C713' },
    { key: 'Bauhaus Originals', value: '#e47a2c #baccc0 #6c958f #40363f #d7a26c #ae4935 #f7e6d4' }, 
    { key: 'Weimar Heritage', value: '#4f507d #aba59f #eba027 #1f1c16 #998a74 #e2471f #56704a #e2805f' },
    { key: 'Modernist Spectrum', value: '#D32F2F #1976D2 #FFC107 #388E3C #F57C00 #7B1FA2 #455A64 #FBC02D' },
    { key: 'Classic Bauhaus Tones', value: '#A63334 #3E5F8A #F2BF7C #7D807D #E7A95E #4C4B40 #83988E #D9C9A5' },
    { key: 'Dusty Weimar Shades', value: '#8D5A4A #526A82 #C4A981 #6A706E #B5803A #635D52 #A4B3A2 #CFC1A4' },
    { key: 'Industrial Grays', value: '#6B6E70 #4B4F52 #919497 #2D2E30 #A6A8AB #3A3C3F #C1C3C5 #787A7C' },
		{ key: 'Muted Blue', value: '#4A637D #6E8499 #98A9B5 #2F4A66 #5B7490 #7D92A6 #A3B3C0 #3E5C7A' },
    { key: 'Muted Terracotta', value: '#A2543A #B67F5E #D2A98A #8F6C5A #E8C3A6 #704B3E #C0876C #5A3D31' },
    { key: 'Autumn Modernism', value: '#7F4E2A #9B7042 #C49973 #5D6A5B #A77A4A #8C5B39 #B89675 #6E553C' },
    { key: 'Vintage Pastels', value: '#9A7F6B #A99488 #D1B5AC #82746E #B2A196 #C7B8AE #E3D4CD #746258' },
    { key: 'Olive & Ochre', value: '#5D5B39 #75744A #B3B077 #8A8558 #A39F6E #6E6C4D #D2CE98 #8F8D64' },
  ], 
  name: 'palette'
});
GUI.addCheckbox('Use palette', false, '', { name: 'usepalette' });
GUI.addCheckbox('Horizontal', false, '', { name: 'horizontal' });
commonConfig(GUI);
GUI.addEventListener('gui-input', (event) => handleGuiEvent(event, svg, GUI, storageKey, stripes));
init(GUI, storageKey, []);

/* === MAIN FUNCTION === */

function stripes(svg, controls) {
	const { width, height } = getViewBox(svg);
	const horizontal = controls.horizontal.checked;
	const palette = controls.palette.value.split(' ');
	const randomWidth = controls.randomwidth.checked;
	const stripes = controls.stripes.valueAsNumber;
	const usePalette = controls.usepalette.checked;
	const [H, _S, _L] = hexToHSL(controls.hue.value);

	let stripeWidths;

	if (randomWidth) {
		let relativeWidths = Array.from({ length: stripes }, () => Math.random());
		const totalRelativeWidth = relativeWidths.reduce((sum, val) => sum + val, 0);
		relativeWidths = relativeWidths.map(val => val / totalRelativeWidth);
		stripeWidths = relativeWidths.map(val => val * width);
	} else {
		const equalWidth = width / stripes;
		stripeWidths = Array(stripes).fill(equalWidth);
	}
	
	let currentX = 0;
	
	const stripesMarkup = stripeWidths.map((stripeWidth, index) => {
		const xPosition = currentX;
		currentX += stripeWidth;
		const fillColor = usePalette 
			? palette[index % palette.length]
			: `hsl(${H}, ${random(50, 100)}%, ${random(30, 90)}%)`;

		return `
			<rect
				width="${stripeWidth}"
				height="${height}"
				x="${xPosition}"
				y="0"
				fill="${fillColor}">
			</rect>`;
	}).join('');

	const rotation = horizontal ? `transform="rotate(90) translate(0, -${width})"` : '';
	svg.innerHTML = `<g ${rotation}>${stripesMarkup}</g>`;
	
}
