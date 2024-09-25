import { commonConfig, handleGuiEvent, init } from '../common.js';
import { getViewBox } from '/assets/js/svgUtils.js';
import { hexToHSL } from '/assets/js/color.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const storageKey = 'goldenratio';
const svg = document.getElementById('svg');

GUI.addSelect('Palette', '', '', { 
  options: [
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
		{ key: 'Untitled 1966—67 A', value: '#A0262A #7C6E2E #C586B2 #7B6D2C #D5E7E3 #E6EDEA #B57D33 #E8F0EC #7F6626 #ECF1ED #A12728 #C19739 #C98BB3 #C19A3A #D5E9E6 #13366A #B68234 #13366A #836B28 #143869 #A5282B #090B0F #CC8CB4 #08090D #D8EAE5' },
		{ key: 'Untitled 1966—67 B', value: '#514F5F #787683 #B6B3C7 #797784 #434645 #9BA7C8 #898098 #95A1C0 #3D413F #919EBA #555363 #525659 #BBB4CB #4C5153 #434645 #FFFFFF #908AA1 #FFFFFF #3C4240 #FFFFFF #525060 #6C6A79 #B9B2CA #6B687A #444746' },
		{ key: 'Untitled 1966—67 C', value: '#D4AD61 #59240E #F6DAB2 #5A250E #F0E2C3 #F4F2ED #441215 #F5F3EF #2B0F16 #F6F5EF #D5AD5F #0C0B0E #F6DBB6 #0D0C0F #EEE2C5 #AC7F32 #451316 #AC7F32 #2B0F16 #B28334 #D2A95D #140D12 #F1D5AD #170E13 #EEDEC1' },
		{ key: 'Untitled 1966—67 D', value: '#D1AF40 #F1CDCD #D8B041 #F5D5D5 #143945 #E0C0D7 #6E9999 #E5C3D7 #162867 #E6C6DC #D4B141 #15396C #DAB142 #173F75 #163E4C #2C673F #71999A #2D6840 #162867 #306E42 #CFAD40 #7B1A1D #D9B041 #7C1B27 #18414E' },
		{ key: 'Pink Caviar', value: '#DDC09B #DDD8B9 #4B3985 #D96028 #3B0B04 #9F9C99 #437D3D #F7C945 #F3F0E7 #020003 #191B59 #A22017' },
		{ key: 'Masonite', value: '#BB3331 #8A8D95 #F3D654 #882D2F #463781 #A16834 #47A2CD #C75C91 #E2713C #273D78 #999DA1 #DF6738 #885F54 #204E3E #D1C74C #2B6767' }
  ],
  name: 'palette'
});
GUI.addCheckbox('Circles', false, '', { name: 'circles', checked: true });
GUI.addRange('Opacity', 0.25, '', { min: 0.025, max: 1, step: 0.025, name: 'opacity' });
GUI.addCheckbox('Clip', false, '', { name: 'clip', checked: true });
GUI.addRange('Scale', 0.9, '', { min: 0, max: 1, step: 0.025, name: 'scale' });
commonConfig(GUI, '#F7E6D4');
GUI.addEventListener('gui-input', (event) => handleGuiEvent(event, svg, GUI, storageKey, goldenRatio));
init(GUI, storageKey, []);

/* === MAIN FUNCTION === */

function goldenRatio(svg, controls) {
	const { width, height } = getViewBox(svg);
	const clip = controls.clip.checked;
	const colors = controls.palette.value.split(' ');
	const opacity = controls.opacity.valueAsNumber;
	const scale = controls.scale.valueAsNumber;
	const showCircles = controls.circles.checked;

	let circles = '';
	let rects = '';

	const clippaths = [];
	const elements = [
		{ x: 0,  y: 0,  w: 21, cx: 21, cy: 21 },
		{ x: 21, y: 0,  w: 13, cx: 21, cy: 13 },
		{ x: 26, y: 13, w: 8,  cx: 26, cy: 13 },
		{ x: 21, y: 16, w: 5,  cx: 26, cy: 16 },
		{ x: 21, y: 13, w: 3,  cx: 24, cy: 16 },
		{ x: 24, y: 13, w: 2,  cx: 24, cy: 15 },
		{ x: 24, y: 15, w: 1,  cx: 25, cy: 15 },
		{ x: 25, y: 15, w: 1,  cx: 25, cy: 15 }
	];

	const unit = width / 34;
	const unitMax = unit * 21;
	const centerX = (width - width * scale) / 2;
	const centerY = (height - (unitMax * scale)) / 2;

	elements.forEach((elm, index) => {
		const clipPathId = 'cp' + crypto.getRandomValues(new Uint32Array(1))[0] % 9000 + 1000;
		const color = colors[index % colors.length];
		const rect = `<rect x="${elm.x * unit}" y="${elm.y * unit}" width="${elm.w * unit}" height="${elm.w * unit}" fill="${color}" />`;
		rects += rect;
		if (showCircles) circles += `<circle cx="${elm.cx * unit}" cy="${elm.cy * unit}" r="${elm.w * unit}" ${clip ? `clip-path="url(#${clipPathId})"`:''} fill="rgba(255, 255, 255, ${opacity})" />`;
		if (clip) clippaths.push(`<clipPath id="${clipPathId}">${rect}</clipPath>`);
	})

	svg.innerHTML = `<defs>${clippaths.join('')}</defs>
	<g transform="translate(${centerX} ${centerY}) scale(${scale})">${rects + circles}</g>`;
}
