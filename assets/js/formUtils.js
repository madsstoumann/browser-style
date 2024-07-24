export function serializeForm(form) {
	const formData = {};
	for (const element of form.elements) {
		if (element.name) {
			formData[element.name] = element.value;
		}
	}
	return formData;
}

export function storeFormData(form, keyName, storageKey) {
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

export function updatePresetOptions(selectElement, storageKey) {
	const presets = JSON.parse(localStorage.getItem(storageKey)) || [];
	selectElement.options.length = 1;

	presets.forEach(preset => {
		const option = document.createElement('option');
		option.value = JSON.stringify(preset.value);
		option.textContent = preset.key;
		selectElement.appendChild(option);
	});
}

export function loadStoredForm(form, preset) {
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