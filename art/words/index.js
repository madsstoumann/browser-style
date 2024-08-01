import { commonConfig, handleGuiEvent, init } from '../common.js';
import { interpolate } from '/assets/js/utils.js';
import { interpolateColor } from '/assets/js/color.js';
import { getViewBox } from '/assets/js/svgUtils.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const storageKey = 'words';
const svg = document.getElementById('svg');

GUI.addRange('Lines', 25, '', { min: 2, max: 50, name: 'lines' });
GUI.addRange('Size Start', 1, '', { min: 0.1, max: 20, step: 0.1, name: 'sizestart' });
GUI.addRange('Size End', 12, '', { min: 0.1, max: 20, step: 0.1, name: 'sizeend' });
GUI.addRange('Density', 4, '', { min: 1, max: 6, step: 0.1, name: 'density' });
GUI.addSelect('Font Family', 'fontfamily', '', { 
	options: [
		{ key: "Just Another Hand", value: "Just Another Hand, cursive" },
		{ key: 'Antique', value: "Superclarendon, Bookman Old Style, URW Bookman, URW Bookman L, Georgia Pro, Georgia, serif" },
		{ key: 'Code', value: "ui-monospace, Cascadia Code, Source Code Pro, Menlo, Consolas, DejaVu Sans Mono, monospace" },
		{ key: 'Handwritten', value: "Segoe Print, Bradley Hand, Chilanka, TSCu_Comic, casual, cursive" },
		{ key: 'Impact', value: 'Impact' }
	],
	'name': 'fontfamily'
});
GUI.addSelect('Case', 'uppercase', '', { 
	options: [
		{ key: 'none', value: 'normal' },
		{ key: 'lowercase', value: 'lowercase' },
		{ key: 'uppercase', value: 'uppercase' },
		{ key: 'capitalize', value: 'capitalize' }
	],
	'name': 'texttransform'
});
GUI.addRange('Scale', 1, '', { min: 0, max: 1, step: 0.025, name: 'scale' });
GUI.addTextArea('Words', 'abundance accomplish achievement action adventureaffection ambition appreciation articulate aspirationawesome balance beauty believe blissbrilliant calm carefree celebrate charmcheerful clarity comfort compassion confidencecourage creativity delight determination dignitydream dynamic eager ecstasy eleganceembrace empower enchanting enthusiasm epicexcellent exuberant fabulous faith fantasticflourish fortune freedom friendly fulfillmentgenerous genius genuine glory gracegratitude harmony happiness healing heartwarminghope ideal imagination inspiration integrityjoy jubilant kindness laughter libertylively love magnificent marvelous miraclemotivation noble optimism passion peaceperseverance playful positive prosperity radiantremarkable resilient serenity sincere spectacularstrength success sunshine tranquil triumphvibrant victory wisdom wonderful zest', '', { name: 'words' });
GUI.addColor('Start Color', '#263773', '', { name: 'startcolor' });
GUI.addColor('End Color', '#8c9dd9', '', { name: 'endcolor' });
commonConfig(GUI, '#EAE8DF');
GUI.addEventListener('gui-input', (event) => handleGuiEvent(event, svg, GUI, storageKey, drawWords));
init(GUI, storageKey, []);

/*=== MAIN FUNCTION ===*/

function drawWords(svg, controls) {
	const { width, height } = getViewBox(svg);
	const charDensity = controls.density.valueAsNumber;
	const endColor = controls.endcolor.value;
	const endFontSize = controls.sizeend.valueAsNumber;
	const lines = controls.lines.valueAsNumber;
	const scale = controls.scale.valueAsNumber;
	const startColor = controls.startcolor.value;
	const startFontSize = controls.sizestart.valueAsNumber;
	const words = controls.words.value.split(/\s+/);

	let output = '';
	let totalFontSize = 0;
	const maxHeight = height;
	const textLength = width;

	for (let i = 0; i < lines; i++) {
		const factor = i / (lines - 1);
		totalFontSize += interpolate(startFontSize, endFontSize, factor);
	}

	let accumulatedHeight = 0;

	for (let i = 0; i < lines; i++) {
		const factor = i / (lines - 1);
		const fontSize = interpolate(startFontSize, endFontSize, factor);
		const normalizedFontSize = (fontSize / totalFontSize) * maxHeight;
		const color = interpolateColor(startColor, endColor, factor);
		const charLength = Math.round((textLength / fontSize) * charDensity);

		let sentence = '';
		while (sentence.length < charLength) {
			const randomIndex = Math.floor(Math.random() * words.length);
			const word = words[randomIndex];
			if ((sentence.length + word.length + 1) <= charLength) {
				sentence += (sentence ? ' ' : '') + word;
			} else {
				break;
			}
		}

		accumulatedHeight += normalizedFontSize;
		const yPosition = accumulatedHeight;

		const textElement = `<text y="${yPosition}" font-size="${fontSize}" fill="${color}" textLength="${textLength}">${sentence}</text>`;
		output += textElement;
	}

	const centerX = (width - width * scale) / 2;
	const centerY = (height - height * scale) / 2;
	const svgContent = `
	<defs>
		<style type="text/css">
			@import url('https://fonts.googleapis.com/css2?family=Just+Another+Hand&display=swap');
		</style>
	</defs>
	<g transform="translate(${centerX} ${centerY}) scale(${scale})">${output}</g>`;
	svg.innerHTML = svgContent;
}
