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