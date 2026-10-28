/**
 * EU checks for @browser.style/form-rules.
 * - euVat: a VAT number with its member-state prefix (DK12345678, DE123456789, …), checked against that state's format.
 *   Formats only: whether the number is registered is a VIES lookup, which belongs in a service.
 */
export const VAT_FORMATS = {
	AT: /^U\d{8}$/, BE: /^[01]\d{9}$/, BG: /^\d{9,10}$/, CY: /^\d{8}[A-Z]$/, CZ: /^\d{8,10}$/, DE: /^\d{9}$/,
	DK: /^\d{8}$/, EE: /^\d{9}$/, EL: /^\d{9}$/, ES: /^[A-Z\d]\d{7}[A-Z\d]$/, FI: /^\d{8}$/, FR: /^[A-HJ-NP-Z\d]{2}\d{9}$/,
	HR: /^\d{11}$/, HU: /^\d{8}$/, IE: /^\d[A-Z\d+*]\d{5}[A-Z]{1,2}$/, IT: /^\d{11}$/, LT: /^(\d{9}|\d{12})$/, LU: /^\d{8}$/,
	LV: /^\d{11}$/, MT: /^\d{8}$/, NL: /^\d{9}B\d{2}$/, PL: /^\d{10}$/, PT: /^\d{9}$/, RO: /^\d{2,10}$/, SE: /^\d{10}01$/,
	SI: /^\d{8}$/, SK: /^\d{10}$/, XI: /^(\d{9}|\d{12}|GD\d{3}|HA\d{3})$/
};

export const functions = {
	euVat: value => {
		const vat = String(value ?? '').replace(/[\s.-]/g, '').toUpperCase();
		const format = VAT_FORMATS[vat.slice(0, 2)];
		if (!format) return { code: 'eu-vat', message: 'Start with the country code, such as DK or DE' };
		return format.test(vat.slice(2)) ? null : { code: 'eu-vat', message: `This is not how a ${vat.slice(0, 2)} VAT number is written` };
	}
};

export default functions;
