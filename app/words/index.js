import downloadContent from '/assets/js/downloadContent.js';
import { formDataToObject, loadStoredForm, mergePresets, storeFormData, updatePresetOptions } from '/assets/js/formUtils.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const controls = GUI.form.elements;
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
GUI.addSelect('Case', '', '', { 
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
GUI.addColor('Background', '#EAE8DF', '', { name: 'background' });
GUI.addColor('Frame', '#f6c6a4', '--frame-c', { name: 'frame' });

GUI.addSelect('Presets', '', '', { 
	options: [], 
	defaultOption: 'Select a preset',
	'data-action': 'load-preset',
	'name': 'presets'
});
GUI.addButton('Save', 'Save preset', 'button', { 'data-action': 'save-preset' });
GUI.addButton('Download', 'Download SVG', 'button', { 'data-action': 'download' });

GUI.addEventListener('gui-input', (event) => {
	const { action, input, value } = event.detail;

	switch (action) {
		case 'download':
			downloadContent(svg.outerHTML, `${storageKey}.svg`);
			break;
		case 'load-preset':
			const preset = JSON.parse(value);
			loadStoredForm(GUI.form, preset);
			break;
		case 'save-preset':
			const keyName = prompt('Please enter a name for this preset:');
			if (keyName) {
				storeFormData(GUI.form, keyName, storageKey);
				updatePresetOptions(GUI.form.elements.presets, storageKey);
			}
			break;
		default:
			switch (input.name) {
				case 'background':
					svg.style.backgroundColor = value;
					break;
				case 'fontfamily':
					svg.style.fontFamily = value;
					break;
				case 'frame':
					break;
				case 'texttransform':
					svg.style.textTransform = value;
					break;
				default:
					drawWords(svg, 
						controls.sizestart.valueAsNumber, 
						controls.sizeend.valueAsNumber,
						controls.density.valueAsNumber,
						controls.startcolor.value,
						controls.endcolor.value,
						controls.lines.valueAsNumber,
						controls.words.value ? controls.words.value.split(/\s+/) : positiveWords,
						controls.scale.valueAsNumber
					);
			}
	}
});

function drawWords(svg, startFontSize, endFontSize, charDensity, startColor, endColor, lines, words, scale) {
	const interpolate = (start, end, factor) => start + (end - start) * factor;
	const interpolateColor = (startColor, endColor, factor) => {
		const parseColor = color => color.match(/\w\w/g).map(c => parseInt(c, 16));
		const toHex = num => num.toString(16).padStart(2, '0');
		
		const [r1, g1, b1] = parseColor(startColor);
		const [r2, g2, b2] = parseColor(endColor);

		const r = Math.round(interpolate(r1, r2, factor));
		const g = Math.round(interpolate(g1, g2, factor));
		const b = Math.round(interpolate(b1, b2, factor));

		return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
	};

	let output = '';
	let totalFontSize = 0;
	const maxHeight = 100;
	const textLength = 100;

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

	const centerX = (100 - 100 * scale) / 2;
	const centerY = (100 - 100 * scale) / 2;
	const svgContent = `
	<defs>
		<style type="text/css">
			@import url('https://fonts.googleapis.com/css2?family=Just+Another+Hand&display=swap');
		</style>
	</defs>
	<g transform="translate(${centerX} ${centerY}) scale(${scale})">${output}</g>`;
	svg.innerHTML = svgContent;
}

// Init
const defaultPresets = [
	{
		"key": "Default",
		"value": {
			"lines": "25",
			"sizestart": "1",
			"sizeend": "12",
			"density": "4",
			"fontfamily": "Just Another Hand, cursive",
			"texttransform": "normal",
			"scale": "1",
			"words": "abundance accomplish achievement action adventureaffection ambition appreciation articulate aspirationawesome balance beauty believe blissbrilliant calm carefree celebrate charmcheerful clarity comfort compassion confidencecourage creativity delight determination dignitydream dynamic eager ecstasy eleganceembrace empower enchanting enthusiasm epicexcellent exuberant fabulous faith fantasticflourish fortune freedom friendly fulfillmentgenerous genius genuine glory gracegratitude harmony happiness healing heartwarminghope ideal imagination inspiration integrityjoy jubilant kindness laughter libertylively love magnificent marvelous miraclemotivation noble optimism passion peaceperseverance playful positive prosperity radiantremarkable resilient serenity sincere spectacularstrength success sunshine tranquil triumphvibrant victory wisdom wonderful zest",
			"startcolor": "#263773",
			"endcolor": "#8c9dd9",
			"background": "#eae8df",
			"frame": "#f6c6a4"
		}
	}
];
document.addEventListener('DOMContentLoaded', () => {
	const existingPresets = JSON.parse(localStorage.getItem(storageKey)) || [];
	localStorage.setItem(storageKey, JSON.stringify(mergePresets(existingPresets, defaultPresets)));
	updatePresetOptions(GUI.form.elements.presets, storageKey);
	loadStoredForm(GUI.form, formDataToObject(new FormData(GUI.form)));
});
