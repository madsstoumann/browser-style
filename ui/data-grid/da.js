export default config = {
	formatters: {
		bold: (value) => `<strong>${value}</strong>`,
		email: (value) => `<a href="mailto:${value}" tabindex="-1">${value}</a>`,
		semibold: (value) => `<b>${value}</b>`,
		gray: (value) => `<span class="dg-gray">${value}</span>`,
	},
	i18n: {
		da: {
			all: 'Alle',
			of: 'af',
			next: 'Næste',
			noResult: 'Ingen resultater',
			page: 'Side',
			prev: 'Forrige',
			selected: 'valgt',
			size: 'Rækker per side',
		},
	},
}