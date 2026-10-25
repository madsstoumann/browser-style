/**
 * Danish checks for @browser.style/form-rules: pass them as { functions } to evaluate(), validate(),
 * <form-flow> and <form-editor>, or let loadPackages() import them from types.json.
 *
 * - dk-cpr: field check for a CPR number. The modulus 11 part only warns, since some numbers issued since 2007 fail it.
 * - dk-cvr: field check for a CVR (company) number.
 * - cprDate: operator, the birth date in a CPR number as YYYY-MM-DD, e.g. for an age variable.
 */
const digits = value => String(value ?? '').replace(/[\s-]/g, '');
const weighted = (text, weights) => [...text].reduce((sum, digit, index) => sum + Number(digit) * weights[index], 0);

const isoDate = text => {
	const [y, m, d] = text.split('-').map(Number);
	const date = new Date(Date.UTC(y, m - 1, d));
	return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d ? text : null;
};

/* The birth date in a CPR number (DDMMYY-SSSS), using the 7th digit for the century. */
export function cprDate(value) {
	const cpr = digits(value);
	if (!/^\d{10}$/.test(cpr)) return null;
	const day = cpr.slice(0, 2);
	const month = cpr.slice(2, 4);
	const year = Number(cpr.slice(4, 6));
	const seventh = Number(cpr[6]);
	let century = 1900;
	if (seventh === 4 || seventh === 9) century = year <= 36 ? 2000 : 1900;
	else if (seventh >= 5 && seventh <= 8) century = year <= 57 ? 2000 : 1800;
	return isoDate(`${century + year}-${month}-${day}`);
}

export const functions = {
	cprDate,
	'dk-cpr': value => {
		const cpr = digits(value);
		if (!/^\d{10}$/.test(cpr)) return { code: 'dk-cpr', message: 'A CPR number has 10 digits: DDMMYY-XXXX' };
		if (!cprDate(cpr)) return { code: 'dk-cpr', message: 'The first six digits are not a valid date' };
		if (weighted(cpr, [4, 3, 2, 7, 6, 5, 4, 3, 2, 1]) % 11 !== 0) return { code: 'dk-cpr-mod11', level: 'warning', message: 'Please check the CPR number: it fails the modulus 11 check (some numbers issued since 2007 do)' };
		return null;
	},
	'dk-cvr': value => {
		const cvr = digits(value);
		if (!/^\d{8}$/.test(cvr)) return { code: 'dk-cvr', message: 'A CVR number has 8 digits' };
		return weighted(cvr, [2, 7, 6, 5, 4, 3, 2, 1]) % 11 === 0 ? null : { code: 'dk-cvr', message: 'This is not a valid CVR number' };
	}
};

export default functions;
