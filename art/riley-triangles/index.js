import { commonConfig, handleGuiEvent, init } from '../common.js';
import { getViewBox } from '/assets/js/svgUtils.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const storageKey = 'rileytriangles';
const svg = document.getElementById('svg');

// Canvas: #ad4835, #e9d3b0

// GUI.addRange('Cols', 4, '', { min: 1, max: 10, name: 'columns' });
GUI.addRange('Rows', 8, '', { min: 3, max: 32, name: 'rows' });
GUI.addCheckbox('Triangle', '0', '', { name: 'triangle', checked: 'checked' });
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
  ], 
  name: 'palette'
});

commonConfig(GUI, '#ffffff');
GUI.addEventListener('gui-input', (event) => handleGuiEvent(event, svg, GUI, storageKey, rileyTriangles));
init(GUI, storageKey, []);

/* === MAIN FUNCTION === */

function rileyTriangles(svg, controls) {
	const { width, height } = getViewBox(svg);
	const rows = controls.rows.valueAsNumber;
	const triangle = controls.triangle.checked;
	const colors = controls.palette.value.split(' ');

	const aspectRatio = 1.155;
	const boxHeight = height / rows;
	const boxWidth = Math.min(width / rows, boxHeight * aspectRatio);
	const clipPathId = 'clipPath' + crypto.getRandomValues(new Uint32Array(1))[0] % 9000 + 1000;

	const elements = [...new Array(rows)].map((_row, rowIndex) => {
		const numOfTrianglesInRow = rows - rowIndex;
		const rowWidth = numOfTrianglesInRow * boxWidth;

		let rowElements = '';

		for (let colIndex = 0; colIndex < numOfTrianglesInRow; colIndex++) {
			const bgFill = '#fff';
			const fgFill = '#000';

			let pattern;
			if (colIndex === numOfTrianglesInRow - 1) {
				// Ensure the last item in the row is always a polygon
				pattern = `<polygon points="0,0 ${boxWidth / 2},${boxHeight} ${boxWidth},0" fill="${fgFill}" />`;
			} else {
				const randomValue = Math.random();
				if (randomValue < 0.6) {
					// Case 1: Polygon only (60%)
					pattern = `<polygon points="0,0 ${boxWidth / 2},${boxHeight} ${boxWidth},0" fill="${fgFill}" />`;
				}
				else if (randomValue < 0.9) {
						// Case 2: Polygon and Circle (30%)
					pattern = `
						<polygon points="0,0 ${boxWidth / 2},${boxHeight} ${boxWidth},0" fill="${fgFill}" />
						<circle cx="${boxWidth * 1.5}" cy="${boxHeight / aspectRatio}" r="${boxWidth}" fill="${bgFill}" />`;
				}
				else {
					// Case 3: Circle with cx=0 and fgFill, followed by polygon (10%)
					pattern = `
						<circle cx="0" cy="${Math.abs((boxHeight / aspectRatio) - boxHeight)}" r="${boxWidth}" fill="${fgFill}" />
						<polygon points="0,0 ${boxWidth / 2},${boxHeight} 0,${boxHeight}" fill="${bgFill}" />`;
				}
			}

			// Add the pattern to the row
			rowElements += `
			<g transform="translate(${colIndex * boxWidth}, 0)" clip-path="url(#${clipPathId})">
				<rect width="${boxWidth}" height="${boxHeight}" fill="${bgFill}" />
				${pattern}
			</g>`;
		}

		// Center the row within the available width
		const translateX = (width - rowWidth) / 2;

		return `
		<g transform="translate(${translateX}, ${rowIndex * boxHeight})">
			${rowElements}
		</g>`;
	}).join('');

	// Output the SVG with clipPath and grid
	svg.innerHTML = `
	<defs>
		<clipPath id="${clipPathId}">
			<rect width="${boxWidth}" height="${boxHeight}" />
		</clipPath>
	</defs>
	<g>
		${elements}
	</g>`;
}
