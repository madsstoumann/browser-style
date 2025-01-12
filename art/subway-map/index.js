import { commonConfig, handleGuiEvent, init } from '../common.js';
import { getViewBox } from '/assets/js/svgUtils.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const storageKey = 'subwaymap';
const svg = document.getElementById('svg');

GUI.addRange('Lines', 8, '', { min: 2, max: 20, name: 'lines' });
commonConfig(GUI, '#E7E7E7');
GUI.addEventListener('gui-input', (event) =>
	handleGuiEvent(event, svg, GUI, storageKey, subwayMap)
);
init(GUI, storageKey, []);

/* === MAIN FUNCTION === */

function subwayMap(svg, controls) {
	const { width, height } = getViewBox(svg);
	const subwayLines = controls.lines.valueAsNumber;
	const margin = 5;
	const elements = [];
	
	// Original colors and their lighter versions
	const colors = [
		'#FF0A0A', '#008D41', '#009CD3', '#FFC600', '#FF6319', '#6CBE45',
		'#FF8080', '#80C6A0', '#80CEE9', '#FFE380', '#FFB18C', '#B5DFA2'
	];

	const generateSubwayLine = () => {
		const points = [];
		const numPoints = Math.floor(Math.random() * 3) + 3;
		for (let i = 0; i < numPoints; i++) {
			points.push({
				x: margin + Math.random() * (width - margin * 2),
				y: margin + Math.random() * (height - margin * 2),
			});
		}
		const path = points.reduce((acc, point, i) => {
			if (i === 0) return `M ${point.x} ${point.y}`;
			const prev = points[i - 1];
			const cpLen = Math.hypot(point.x - prev.x, point.y - prev.y) * 0.5;
			const cp1x = prev.x + cpLen;
			const cp1y = prev.y;
			const cp2x = point.x - cpLen;
			const cp2y = point.y;
			return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${point.x} ${point.y}`;
		}, '');
		return { path, points };
	};

	const paths = [];
	const stations = [];

	for (let i = 0; i < subwayLines; i++) {
		const color = colors[i % colors.length];
		const { path, points } = generateSubwayLine();
		const isDashed = i > 5 && Math.random() < 0.5 ? ' stroke-dasharray="2"' : '';
		
		paths.push(`<path d="${path}" fill="none" stroke="${color}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"${isDashed}/>`);
		stations.push(
			`<circle cx="${points[0].x}" cy="${points[0].y}" r="1" fill="white" stroke="black" stroke-width=".5"/>`,
			`<circle cx="${points[points.length - 1].x}" cy="${points[points.length - 1].y}" r="1" fill="white" stroke="black" stroke-width=".5"/>`
		);
	}

	svg.innerHTML = `<g>${paths.join('')}${stations.join('')}</g>`;
}
