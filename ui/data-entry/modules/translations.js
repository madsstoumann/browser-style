const translations = {
	en: {
		add: 'Add',
		close: 'Close',
		details: 'Details',
		release_date: 'Release Date',
		reset: 'Reset',
	},
	da: {
		add: 'Tilføj',
		close: 'Luk',
		details: 'Detaljer',
		release_date: 'Udgivelsesdato',
		reset: 'Nulstil',
	},
	// Add more languages as needed
};

export function t(key, lang) {
	return translations[lang]?.[key] || key;
}
