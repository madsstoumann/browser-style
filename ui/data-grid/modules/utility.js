export function addEventListeners(element, events, handler) {
	events.forEach(event => element.addEventListener(event, handler));
}

export function calculatePages(items, itemsPerPage) {
	if (itemsPerPage <= 0) {
		throw new Error('Invalid value: items per page should be greater than 0');
	}
	if (items === 0) return 0;
	return Math.ceil(items / itemsPerPage);
}

export function camelCase(str) {
	if (!str) return ''; // Handles null, undefined, or empty strings
	return str
		.toLowerCase()
		.split(' ')
		.map((word, index) => index === 0 ? word : capitalize(word))
		.join('');
}

export function capitalize(str) {
	if (typeof str !== 'string' || !str.length) return str;
	return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function consoleLog(message, bg = '#000', debug = false) {
	if (debug) {
		console.log(`%c${message}`, `background:${bg};color:#FFF;padding:0.5ch 1ch;`);
	}
}

export function getKeyValueObject(state, node) {
	try {
		const keyFields = state.thead.filter(cell => cell.key).map(cell => cell.field);
		const dataKeys = node.parentNode.dataset.keys;

		if (!dataKeys) {
			console.warn("No 'data-keys' attribute found on the provided node.");
			return null;
		}

		const keyParts = dataKeys.split(',').map(part => part.trim());

		const keyValueObject = keyFields.reduce((acc, field, index) => {
			acc[field] = isNaN(keyParts[index]) ? keyParts[index] : Number(keyParts[index]);
			return acc;
		}, {});

		return keyValueObject;
	} catch (error) {
		console.error(`Error creating key-value object: ${error}`);
		return null;
	}
}

export function getObj(state, node, typeCheck = false) {
	try {
		const keyFields = state.thead
			.filter(cell => cell.key)
			.map(cell => ({ field: cell.field, type: cell.type || 'string' }));
		const dataKeys = node.parentNode.dataset.keys;

		if (!dataKeys) {
			console.warn("No 'data-keys' attribute found on the provided node.");
			return null;
		}

		const keyParts = dataKeys.split(',').map(part => part.trim());

		// Find the row index and data that match the composite key
		const rowIndex = state.tbody.findIndex(row => 
			keyFields.every((keyConfig, index) => {
				const { field, type } = keyConfig;
				const rowValue = row[field];
				const keyPart = keyParts[index];
				
				// Perform type-aware comparison if typeCheck is true
				return typeCheck && type === 'number' 
					? Number(rowValue) === Number(keyPart)
					: String(rowValue).trim() === keyPart;
			})
		);

		if (rowIndex === -1) {
			return null;
		}

		// Return both the row data and its index
		return { row: state.tbody[rowIndex], rowIndex };
	} catch (error) {
		console.error(`Error retrieving object data: ${error}`);
		return null;
	}
}

export function t(key, lang, i18n) {
	if (!i18n || typeof i18n !== 'object') return key;
	return i18n[lang]?.[key] || key;
}
