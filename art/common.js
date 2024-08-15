import downloadContent from '/assets/js/downloadContent.js';

function serializeForm(form) {
	const formData = {};
	for (const element of form.elements) {
		if (element.name) {
			formData[element.name] = element.value;
		}
	}
	return formData;
}

 function storeFormData(form, keyName, storageKey) {
	const serializedData = serializeForm(form);
	const presets = JSON.parse(localStorage.getItem(storageKey)) || [];
	const newPreset = { key: keyName, value: serializedData };

	// Check if the preset already exists
	const existingIndex = presets.findIndex(preset => preset.key === keyName);
	if (existingIndex > -1) {
		presets[existingIndex] = newPreset;
	} else {
		presets.push(newPreset);
	}

	localStorage.setItem(storageKey, JSON.stringify(presets));
}

 function updatePresetOptions(selectElement, storageKey) {
	const presets = JSON.parse(localStorage.getItem(storageKey)) || [];
	selectElement.options.length = 1;

	presets.forEach(preset => {
		const option = document.createElement('option');
		option.value = JSON.stringify(preset.value);
		option.textContent = preset.key;
		selectElement.appendChild(option);
	});
}

function loadStoredForm(form, preset) {
	for (const [key, value] of Object.entries(preset)) {
		const input = form.elements[key];
		if (input) {
			if (input.type === 'checkbox') {
				input.checked = value === input.value;
			} else {
				input.value = value;
			}
			if (!input.dataset.action) input.dispatchEvent(new Event('input', { bubbles: true }));
		}
	}
}

export function commonConfig(GUI, canvasColor = '#ffffff', frameColor = '#f6c6a4') {
	const frameColors = [
		{ name: 'birch', value: '#f6c6a4' },
		{ name: 'maple', value: '#e1b382' },
		{ name: 'oak', value: '#d2b48c' },
		{ name: 'cherry', value: '#d2691e' },
		{ name: 'walnut', value: '#704214' },
		{ name: 'rosewood', value: '#65000b' },
		{ name: 'mahogany', value: '#4a2c2a' },
		{ name: 'ebony', value: '#0c0b0b' },
		{ name: 'brass', value: '#b5a642' },
		{ name: 'bronze', value: '#cd7f32' },
		{ name: 'silver', value: '#c0c0c0' },
		{ name: 'aluminum', value: '#a9a9a9' },
		{ name: 'gunmetal', value: '#2a3439' },
		{ name: 'black', value: '#000000' },
		{ name: 'white', value: '#ffffff' }
	];

	GUI.addDataList('framecolors', frameColors);
	GUI.addGroup('Settings & Tools', [
		(ul) => GUI.addColor('Canvas', canvasColor, '', { name: 'canvas' }, ul),
		(ul) => GUI.addColor('Frame', frameColor, '--frame-c', { name: 'frame', list: 'framecolors' }, ul),
		(ul) => GUI.addCheckbox('Show frame', '1em', '--frame-bdw', { name: 'showframe', checked: 'checked', 'data-unchecked': '0' }, ul),
		(ul) => GUI.addCheckbox('Full screen', '', '', { 'data-action': 'full-width' }, ul),
		(ul) => GUI.addSelect('Size', '', '', { 
			options: [
				{ key: '1:1 (square)', value: '0 0 100 100' },
				{ key: '1:1.25 (16x20in, 40.6x50.8cm)', value: '0 0 100 125' },
				{ key: '1.25:1 (20x16in, 50.8x40.6cm)', value: '0 0 125 100' },
				{ key: '1:1.33 (60x80cm, 23.6x31.5in)', value: '0 0 100 133' },
				{ key: '1.33:1 (80x60cm, 31.5x23.6in)', value: '0 0 133 100' },
				{ key: '1:1.4 (50x70cm, 19.7x27.6in)', value: '0 0 100 140' },
				{ key: '1.4:1 (70x50cm, 27.6x19.7in)', value: '0 0 140 100' },
				{ key: '1:1.5 (24x36in, 61x91.4cm)', value: '0 0 100 150' },
				{ key: '1.5:1 (36x24in, 91.4x61cm)', value: '0 0 150 100' },
			], 
			name: 'size'
		}, ul),
		(ul) => GUI.addSelect('Presets', '', '', { 
			options: [], 
			defaultOption: 'Select a preset',
			'data-action': 'load-preset',
			name: 'presets'
		}, ul),
		(ul) => GUI.addButton('Save', 'Save preset', 'button', { 'data-action': 'save-preset' }, ul),
		(ul) => GUI.addButton('Download', 'Download SVG', 'button', { 'data-action': 'download' }, ul)
	]);
}

export function formDataToObject(formData) {
	const obj = {};
	formData.forEach((value, key) => {
		obj[key] = value;
	});
	return obj;
}

export function mergePresets(existingPresets, defaultPresets) {
	const presetsMap = new Map();
	existingPresets.forEach(preset => presetsMap.set(preset.key, preset));
	defaultPresets.forEach(preset => presetsMap.set(preset.key, preset));
	return Array.from(presetsMap.values());
}

export function handleGuiEvent(event, svg, GUI, storageKey, drawFunction) {
	const { action, input, value } = event.detail;

	switch (action) {
		case 'download':
			downloadContent(svg.outerHTML, `${storageKey}.svg`);
			break;
		case 'full-width':
			document.body.classList.toggle('full-width');
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
				case 'canvas':
					svg.style.backgroundColor = value;
					break;
				case 'fontfamily':
					svg.style.fontFamily = value;
					break;
				case 'frame':
					break;
				case 'linecap':
					svg.setAttribute('stroke-linecap', value);
					break;
				case 'size':
					const [x, y, width, height] = value.split(' ');
					svg.style.setProperty('--frame-asr', `${width} / ${height}.`);
					svg.setAttribute('viewBox', value);
					drawFunction(svg, GUI.form.elements);
				case 'stroke':
					svg.style.stroke = value;
					break;
				case 'strokewidth':
					svg.style.strokeWidth = value;
					break;
				case 'texttransform':
					svg.style.textTransform = value;
					break;
				default:
					drawFunction(svg, GUI.form.elements);
			}
	}
}

export function init(GUI, storageKey, defaultPresets) {
	document.addEventListener('DOMContentLoaded', () => {
	const existingPresets = JSON.parse(localStorage.getItem(storageKey)) || [];
	localStorage.setItem(storageKey, JSON.stringify(mergePresets(existingPresets, defaultPresets)));
	updatePresetOptions(GUI.form.elements.presets, storageKey);
	loadStoredForm(GUI.form, formDataToObject(new FormData(GUI.form)));
});
}