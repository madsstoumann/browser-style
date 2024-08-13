import { commonConfig, handleGuiEvent, init } from '../common.js';
import { getViewBox } from '/assets/js/svgUtils.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const storageKey = 'bauhaus';
const svg = document.getElementById('svg');

// #ad4835
// '#e9d3b0', bg colors

GUI.addRange('Cols', 4, '', { min: 1, max: 10, name: 'columns' });
GUI.addRange('Rows', 4, '', { min: 1, max: 10, name: 'rows' });
GUI.addSelect('Palette', '', '', { 
  options: [
    { key: 'Bauhaus Originals', value: '#e47a2c #baccc0 #6c958f #40363f #d7a26c #ae4935 #f7e6d4' }, 
    { key: 'Weimar Heritage', value: '#4f507d #aba59f #eba027 #1f1c16 #998a74 #e2471f #56704a #e2805f' },
    { key: 'Modernist Spectrum', value: '#D32F2F #1976D2 #FFC107 #388E3C #F57C00 #7B1FA2 #455A64 #FBC02D' },
    { key: 'Classic Bauhaus Tones', value: '#A63334 #3E5F8A #F2BF7C #7D807D #E7A95E #4C4B40 #83988E #D9C9A5' },
    { key: 'Dusty Weimar Shades', value: '#8D5A4A #526A82 #C4A981 #6A706E #B5803A #635D52 #A4B3A2 #CFC1A4' },
    { key: 'Industrial Grays', value: '#6B6E70 #4B4F52 #919497 #2D2E30 #A6A8AB #3A3C3F #C1C3C5 #787A7C' },
    { key: 'Muted Terracotta', value: '#A2543A #B67F5E #D2A98A #8F6C5A #E8C3A6 #704B3E #C0876C #5A3D31' },
    { key: 'Autumn Modernism', value: '#7F4E2A #9B7042 #C49973 #5D6A5B #A77A4A #8C5B39 #B89675 #6E553C' },
    { key: 'Vintage Pastels', value: '#9A7F6B #A99488 #D1B5AC #82746E #B2A196 #C7B8AE #E3D4CD #746258' },
    { key: 'Olive & Ochre', value: '#5D5B39 #75744A #B3B077 #8A8558 #A39F6E #6E6C4D #D2CE98 #8F8D64' },
  ], 
  name: 'palette'
});

commonConfig(GUI, '#40363f');
GUI.addEventListener('gui-input', (event) => handleGuiEvent(event, svg, GUI, storageKey, bauhaus));
init(GUI, storageKey, []);

/* === MAIN FUNCTION === */

function bauhaus(svg, controls) {
	const { width, height } = getViewBox(svg);
	const columns = controls.columns.valueAsNumber;
	const rows = controls.rows.valueAsNumber;
  const colors = controls.palette.value.split(' ');
	
	const boxWidth = Math.min(width / columns, height / rows);
	const clipPathId = 'clipPath' + crypto.getRandomValues(new Uint32Array(1))[0] % 9000 + 1000;

	const elements = [...new Array(columns * rows)].map((_cell, cellIndex) => {
		const colIndex = cellIndex % columns;
		const rowIndex = Math.floor(cellIndex / columns);
		const [color1, color2] = colors.sort(() => 0.5 - Math.random()).slice(0, 2);
    const bgFill = color1;
    const fgFill = color2;
		const radius = Math.random() < 0.5 ? boxWidth / 2 : boxWidth;

		let positions;
		if (radius === boxWidth / 2) {
			positions = [0, boxWidth / 2, boxWidth, boxWidth / 2];
		} else {
			positions = [0, boxWidth];
		}

		const circlePosX = positions[Math.floor(Math.random() * positions.length)];
		const circlePosY = positions[Math.floor(Math.random() * positions.length)];
		const randomValue = Math.random();
		const patternChoice = randomValue < 0.5 ? 0 : Math.floor(Math.random() * 8) + 1;

		let pattern;
		switch (patternChoice) {
			case 0:
				pattern = `<circle cx="${circlePosX}" cy="${circlePosY}" r="${radius}" fill="${fgFill}" />`;
				break;
			case 1:
				pattern = `<rect width="${boxWidth / 2}" height="${boxWidth}" fill="${fgFill}" />`;
				break;
			case 2:
				pattern = `<rect width="${boxWidth}" height="${boxWidth / 2}" fill="${fgFill}" />`;
				break;
			case 3:
				pattern = `<polygon points="0,0 ${boxWidth},0 ${boxWidth},${boxWidth}" fill="${fgFill}" />`;
				break;
			case 4:
				pattern = `<polygon points="${boxWidth},0 ${boxWidth},${boxWidth} 0,${boxWidth}" fill="${fgFill}" />`;
				break;
			case 5:
				pattern = `<circle cx="0" cy="${boxWidth / 2}" r="${boxWidth / 2}" fill="${fgFill}" />
									 <circle cx="${boxWidth}" cy="${boxWidth / 2}" r="${boxWidth / 2}" fill="${fgFill}" />`;
				break;
			case 6:
				pattern = `<circle cx="${boxWidth / 2}" cy="0" r="${boxWidth / 2}" fill="${fgFill}" />
									 <circle cx="${boxWidth / 2}" cy="${boxWidth}" r="${boxWidth / 2}" fill="${fgFill}" />`;
				break;
			case 7:
				pattern = `<rect width="${boxWidth / 2}" height="${boxWidth}" fill="${fgFill}" />
									<circle cx="${boxWidth / 2}" cy="${boxWidth}" r="${boxWidth / 2}" fill="${fgFill}" />;
									<circle cx="${boxWidth / 2}" cy="0" r="${boxWidth / 2}" fill="${bgFill}" />`;
				break;
			case 8:
				pattern = `<rect width="${boxWidth}" height="${boxWidth / 2}" fill="${fgFill}" />
									<circle cx="0" cy="${boxWidth / 2}" r="${boxWidth / 2}" fill="${fgFill}" />;
									<circle cx="${boxWidth}" cy="${boxWidth / 2}" r="${boxWidth / 2}" fill="${bgFill}" />`;
				break;
		}

		return `
			<g transform="translate(${colIndex * boxWidth}, ${rowIndex * boxWidth})" clip-path="url(#${clipPathId})">
				<rect width="${boxWidth}" height="${boxWidth}" fill="${bgFill}" />
				${pattern}
			</g>`;
	}).join('');

	// Calculate the dimensions of the grid
	const gridWidth = columns * boxWidth;
	const gridHeight = rows * boxWidth;

	// Centering translation
	const translateX = (width - gridWidth) / 2;
	const translateY = (height - gridHeight) / 2;

	// Apply the centering translation and scale to the entire grid
	svg.innerHTML = `
		<defs>
			<clipPath id="${clipPathId}">
				<rect width="${boxWidth}" height="${boxWidth}" />
			</clipPath>
		</defs>
		<g transform="translate(${translateX}, ${translateY})">
			${elements}
		</g>`;
}
