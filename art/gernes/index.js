import { commonConfig, handleGuiEvent, init } from '../common.js';
import { getViewBox } from '/assets/js/svgUtils.js';
import { hexToHSL } from '/assets/js/color.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const storageKey = 'gernes';
const svg = document.getElementById('svg');

GUI.addRange('Cols', 5, '', { min: 1, max: 12, name: 'columns' });
GUI.addRange('Rows', 5, '', { min: 1, max: 12, name: 'rows' });
GUI.addSelect('Render', '', '', { 
  options: [
		{
			key: 'Squares',
			value: 'squares'
		},
		{
			key: 'Square Circle',
			value: 'squarecircle'
		},
		{
			key: 'Lines',
			value: 'lines'
		}
  ], 
  name: 'render'
});
GUI.addSelect('Palette', '', '', { 
  options: [
		{
			key: 'Untitled 1966—67 A',
			value: '#A0262A #7C6E2E #C586B2 #7B6D2C #D5E7E3 #E6EDEA #B57D33 #E8F0EC #7F6626 #ECF1ED #A12728 #C19739 #C98BB3 #C19A3A #D5E9E6 #13366A #B68234 #13366A #836B28 #143869 #A5282B #090B0F #CC8CB4 #08090D #D8EAE5'
		},
		{
			key:  'Untitled 1966—67 B',
			value: '#514F5F #787683 #B6B3C7 #797784 #434645 #9BA7C8 #898098 #95A1C0 #3D413F #919EBA #555363 #525659 #BBB4CB #4C5153 #434645 #FFFFFF #908AA1 #FFFFFF #3C4240 #FFFFFF #525060 #6C6A79 #B9B2CA #6B687A #444746'
		},
		{
			key: 'Untitled 1966—67 C',
			value: '#D4AD61 #59240E #F6DAB2 #5A250E #F0E2C3 #F4F2ED #441215 #F5F3EF #2B0F16 #F6F5EF #D5AD5F #0C0B0E #F6DBB6 #0D0C0F #EEE2C5 #AC7F32 #451316 #AC7F32 #2B0F16 #B28334 #D2A95D #140D12 #F1D5AD #170E13 #EEDEC1'
		},
		{
			key: 'Untitled 1966—67 D',
			value: '#D1AF40 #F1CDCD #D8B041 #F5D5D5 #143945 #E0C0D7 #6E9999 #E5C3D7 #162867 #E6C6DC #D4B141 #15396C #DAB142 #173F75 #163E4C #2C673F #71999A #2D6840 #162867 #306E42 #CFAD40 #7B1A1D #D9B041 #7C1B27 #18414E'
		},
		{
			key:  'Pink Caviar',
			value: '#DDC09B #DDD8B9 #4B3985 #D96028 #3B0B04 #9F9C99 #437D3D #F7C945 #F3F0E7 #020003 #191B59 #A22017'
		},
		{
			key:  'Masonite', 
			value: '#BB3331 #8A8D95 #F3D654 #882D2F #463781 #A16834 #47A2CD #C75C91 #E2713C #273D78 #999DA1 #DF6738 #885F54 #204E3E #D1C74C #2B6767',
			extra: '#141414 #C13431 #3581C0 #2C674A #28638A #C74533 #66589F #E37242 #9594A1 #2A634A #7A8EAD #C4893D #244C94 #BB7142 #E9973E #D75235',
		}
  ],
  name: 'palette'
});
GUI.addColor('Scheme', '#DAA00E', '', { name: 'scheme' });
GUI.addSelect('Schemetype', '', '', { 
  options: [
		{
			key: 'Analogous',
			value: 'analogous'
		},
		{
			key: 'Complementary',
			value: 'complementary'
		},
		{
			key: 'Triadic',
			value: 'triadic'
		},
		{
			key: 'Monochromatic',
			value: 'monochromatic'
		}
  ], 
  name: 'schemetype'
});
GUI.addCheckbox('Use Scheme', false, '', { name: 'usescheme' });
GUI.addCheckbox('Filter', false, '', { name: 'filter' });
GUI.addRange('Scale', 0.9, '', { min: 0, max: 1, step: 0.025, name: 'scale' });
commonConfig(GUI, '#FFFFFF');
GUI.addEventListener('gui-input', (event) => handleGuiEvent(event, svg, GUI, storageKey, gernes));
init(GUI, storageKey, []);

/* === MAIN FUNCTION === */

function gernes(svg, controls) {
	const { width, height } = getViewBox(svg);
	const columns = controls.columns.valueAsNumber;
	const rows = controls.rows.valueAsNumber;
	let colors = controls.palette.value.split(' ');
	let contrasts = controls.palette.selectedOptions[0].dataset.extra ? controls.palette.selectedOptions[0].dataset.extra.split(' ') : [];
	const filter = controls.filter.checked;
	const scale = controls.scale.valueAsNumber;
	const render = controls.render.value;
	const rootColor = controls.scheme.value;
	const schemeType = controls.schemetype.value;
	const useScheme = controls.usescheme.checked;

	if (useScheme) {
		colors = generateColorScheme(rootColor, schemeType, columns * rows);
	}

	const rectHeight = height / rows;
	const rectWidth = width / columns;
	const circleRadius = rectWidth / 10;
	let elements = [];

	switch(render) {
		case 'squares':
			elements = [...new Array(columns * rows)].map((_cell, cellIndex) => {
				const color = colors[cellIndex % colors.length];
				const x = (cellIndex % columns) * rectWidth;
				const y = Math.floor(cellIndex / columns) * rectHeight;
				return `<rect x="${x}" y="${y}" width="${rectWidth}" height="${rectHeight}" fill="${color}" />`;
			});
			break;
		case 'lines':
			elements = [...new Array(rows)].map((_row, rowIndex) => {
				const color = colors[rowIndex % colors.length];
				const y = rowIndex * rectHeight;
				return `<rect x="0" y="${y}" width="${width}" height="${rectHeight}" fill="${color}" />`;
			});
			break;
			case 'squarecircle':
				elements = [...new Array(columns * rows)].map((_cell, cellIndex) => {
					const color = colors[cellIndex % colors.length];
					const contrast = contrasts.length? contrasts[cellIndex % contrasts.length] : `hsl(from ${color} calc(h + 180) s l)`;
					const x = (cellIndex % columns) * rectWidth;
					const y = Math.floor(cellIndex / columns) * rectHeight;
					const cx = x + rectWidth / 2;
					const cy = y + rectHeight / 2;
					return `
						<rect x="${x}" y="${y}" width="${rectWidth}" height="${rectHeight}" fill="${color}" />
						<circle cx="${cx}" cy="${cy}" r="${circleRadius}" fill="${contrast}" />
					`;
				});
				break;
	}

	const centerX = (width - width * scale) / 2;
	const centerY = (height - height * scale) / 2;

	svg.innerHTML = `
		<defs>
			<filter id="squiggle">
				<feTurbulence
					type="fractalNoise"
					id="turbulence"
					baseFrequency=".01"
					numOctaves="5"
				/>
				<feDisplacementMap
					id="displacement"
					in="SourceGraphic"
					scale="4"
				/>
			</filter>
		</defs>
		<g transform="translate(${centerX} ${centerY}) scale(${scale})" filter="${filter ? 'url(#squiggle)' : 'none'}">${elements.join('')}</g>`;
}

function generateColorScheme(rootHex, schemeType, numColors = 25) {
	let [h, s, l] = hexToHSL(rootHex);
	let colors = [];
	let colorCount = numColors;

	for (let i = 0; i < colorCount; i++) {
		let hueShift, lightness, saturation;

		if (schemeType === 'analogous') {
			hueShift = (h + (i * 10) - (colorCount * 5)) % 360; // Shift hue gradually
			lightness = (l + (i % 2 === 0 ? 10 : -10)) % 100; // Alternate lightness for variety
			saturation = s;
		} else if (schemeType === 'complementary') {
			hueShift = (h + (i % 2 === 0 ? 0 : 180)) % 360; // Every alternate color is complementary
			lightness = l;
			saturation = s;
		} else if (schemeType === 'triadic') {
			hueShift = (h + ((i % 3) * 120)) % 360; // Every 3rd color shifts by 120 degrees
			lightness = l;
			saturation = s;
		} else if (schemeType === 'monochromatic') {
			hueShift = h;
			lightness = Math.max(0, Math.min(100, l + (i * 3) - 36)); // Shift lightness gradually
			saturation = s;
		}
		colors.push(`hsl(${hueShift}, ${saturation}%, ${lightness}%)`);
	}
	return colors;
}
