import { commonConfig, handleGuiEvent, init } from '../common.js';
import { getViewBox } from '/assets/js/svgUtils.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const storageKey = 'theray';
const svg = document.getElementById('svg');
GUI.addRange('Lines', 120, '', { min: 2, max: 200, name: 'lines' });
GUI.addColor('Stripe', '#444444', '', { name: 'stripe' });
GUI.addColor('Ray', '#E4473D', '', { name: 'ray' });
GUI.addRange('Ray width', 20, '', { min: 1, max: 100, name: 'raywidth' });
commonConfig(GUI);
GUI.addEventListener('gui-input', (event) => handleGuiEvent(event, svg, GUI, storageKey, theRay));
GUI.addEventListener('canvas-updated', () => { theRay(svg, GUI.form.elements)});
init(GUI, storageKey, []);

/* === MAIN FUNCTION === */

function theRay(svg, controls) {
	const { width, height } = getViewBox(svg);
	const { canvas, lines, raywidth, stripe, ray } = controls;
	const offset = height / lines.valueAsNumber;
	const rayWidth = (raywidth.valueAsNumber / 100) * width;
	const xPos = (width - rayWidth) / 2;
	const yPos = Math.floor(height / 2 / offset) * offset;

	const createPattern = (fill1, fill2) => `
		<pattern id="stripes-${fill1}-${fill2}" width="100%" height="${offset * 2}" patternUnits="userSpaceOnUse">
			<rect width="100%" height="${offset}" fill="${fill1}"/>
			<rect y="${offset}" width="100%" height="${offset}" fill="${fill2}"/>
		</pattern>`;

	svg.innerHTML = `
		<defs>
			${createPattern(stripe.value, canvas.value)}
			${createPattern(ray.value, canvas.value)}
			${createPattern(stripe.value, ray.value)}
		</defs>
		<rect width="100%" height="100%" fill="url(#stripes-${stripe.value}-${canvas.value})"/>
		<rect x="${xPos}" width="${rayWidth}" height="${yPos}" fill="url(#stripes-${ray.value}-${canvas.value})"/>
		<rect x="${xPos}" y="${yPos}" width="${rayWidth}" height="${yPos}" fill="url(#stripes-${stripe.value}-${ray.value})"/>`;
}
