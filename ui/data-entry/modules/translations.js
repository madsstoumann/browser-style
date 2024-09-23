const translations = {
	en: {
		close: 'Close',
		reset: 'Reset',
		add: 'Add',
		release_date: 'Release Date',
		details: 'Details',
	},
	da: {
		close: 'Luk',
		reset: 'Nulstil',
		add: 'Tilføj',
		release_date: 'Udgivelsesdato',
		details: 'Detaljer',
	},
	// Add more languages as needed
};

export function t(key, lang) {
	return translations[lang]?.[key] || key;
}
