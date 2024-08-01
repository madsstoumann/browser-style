import { commonConfig, handleGuiEvent, init } from '../common.js';
import { getViewBox } from '/assets/js/svgUtils.js';
import { interpolateColor } from '/assets/js/color.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const storageKey = 'flower';
const svg = document.getElementById('svg');

GUI.addRange('Petals', 10, '', { min: 5, max: 30, name: 'petals' });
GUI.addRange('Petal Height', 15, '', { min: 2, max: 25, step: 0.1, value: 10, name: 'petalheight' });
GUI.addRange('Petal Width', 5, '', { min: 0, max: 10, step: 0.1, value: 0, name: 'petalwidth' });
GUI.addRange('Rings', 1, '', { min: 1, max: 10, name: 'rings' });

GUI.addRange('Radius Min', 2, '', { min: 0, max: 40, name: 'radiusmin' });
// GUI.addRange('Radius Max', 50, '', { min: 10, max: 100, name: 'radiusmax' });
GUI.addRange('Scale', 1, '', { min: 0, max: 2, step: 0.025, name: 'scale' });

GUI.addColor('Stroke', '#6c3361', '', { name: 'stroke' });
GUI.addRange('Str. Width', 0, '', { min: 0, max: 5, value: 0, step: 0.01, name: 'strokewidth' });

GUI.addColor('Start Color', '#ff3773', '', { name: 'startcolor' });
GUI.addColor('End Color', '#8c9dd9', '', { name: 'endcolor' });

commonConfig(GUI, '#326748');
GUI.addEventListener('gui-input', (event) => handleGuiEvent(event, svg, GUI, storageKey, drawFlower));
init(GUI, storageKey, []);

/* === MAIN FUNCTION === */

function drawFlower(svg, controls) {
	const { width, height } = getViewBox(svg);
	const numPetals = controls.petals.valueAsNumber;
	const petalWidth = controls.petalwidth.valueAsNumber;
	const petalHeight = controls.petalheight.valueAsNumber;
	const numRings = controls.rings.valueAsNumber;
	const radiusMin = controls.radiusmin.valueAsNumber;
	const scale = controls.scale.valueAsNumber;

	const ellipseRx = petalWidth ? petalWidth : 22 / numPetals;
	const ellipseRy = petalHeight;

	const polarToCartesian = (r, degrees) => {
		const radians = degrees * Math.PI / 180.0;
		return [r * Math.cos(radians), r * Math.sin(radians), degrees];
	};

	const data = Array.from({ length: numRings }, (_, ringIndex) => {
		const currentRadius = radiusMin + ringIndex * (ellipseRy * 0.2); // Incremental radius for each ring
		const currentNumPetals = numPetals;
		const angleOffset = (360 / (currentNumPetals * 2)) * ringIndex; // Offset to stagger petals
	
		// Generate petal positions for the current ring
		return Array.from({ length: currentNumPetals }, (_, index) => {
			const angle = (360 / currentNumPetals) * index + angleOffset;
			return polarToCartesian(currentRadius, angle);
		});
	});

	svg.innerHTML = `<g transform="translate(${width / 2} ${height / 2}) scale(${scale})">${
		data.reverse().map(ring => `
			<g>
				${ring.map(([x, y, angle]) => {
					const rotation = angle + 90;
					return `<ellipse cx="${x}" cy="${y - ellipseRy}" rx="${ellipseRx}" ry="${ellipseRy}" transform="rotate(${rotation} ${x} ${y})" fill="hsl(${angle}, 80%, 50%)"/>`;
				}).join('')}
			</g>`).join('')
	}</g>`;
}
