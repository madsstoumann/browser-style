/**
 * Postcode checks for @browser.style/form-rules, one per country: postcodeDk, postcodeUk, … (see FORMATS).
 * Formats only: a check never says a postcode exists, only that it is written the way the country writes them.
 * Add a country by adding a line to FORMATS and a type to types.json.
 */
export const FORMATS = {
	at: { pattern: /^\d{4}$/, example: '1010' },
	be: { pattern: /^\d{4}$/, example: '1000' },
	ch: { pattern: /^\d{4}$/, example: '8001' },
	de: { pattern: /^\d{5}$/, example: '10115' },
	dk: { pattern: /^\d{4}$/, example: '2100' },
	es: { pattern: /^(0[1-9]|[1-4]\d|5[0-2])\d{3}$/, example: '28001' },
	fi: { pattern: /^\d{5}$/, example: '00100' },
	fr: { pattern: /^\d{5}$/, example: '75001' },
	it: { pattern: /^\d{5}$/, example: '00118' },
	nl: { pattern: /^\d{4} ?[A-Z]{2}$/i, example: '1011 AB' },
	no: { pattern: /^\d{4}$/, example: '0150' },
	pl: { pattern: /^\d{2}-\d{3}$/, example: '00-950' },
	se: { pattern: /^\d{3} ?\d{2}$/, example: '114 55' },
	uk: { pattern: /^([A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}|GIR ?0AA)$/i, example: 'SW1A 1AA' },
	us: { pattern: /^\d{5}(-\d{4})?$/, example: '20500' }
};

const checkFor = country => value => (FORMATS[country].pattern.test(String(value ?? '').trim())
	? null
	: { code: `postcode-${country}`, message: `Write the postcode like ${FORMATS[country].example}` });

export const functions = Object.fromEntries(Object.keys(FORMATS).map(country => [`postcode${country[0].toUpperCase()}${country.slice(1)}`, checkFor(country)]));

export default functions;
