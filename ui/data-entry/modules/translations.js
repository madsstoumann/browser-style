const translations = {
	en: {
		close: 'Close',
		reset: 'Reset',
		add: 'Add',
	},
	da: {
		close: 'Luk',
		reset: 'Nulstil',
		add: 'Tilføj',
	},
	// Add more languages as needed
};

export function t(lang, key) {
	return translations[lang]?.[key] || key;
}
