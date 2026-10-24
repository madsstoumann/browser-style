/**
 * Example functions for @browser.style/form-rules: pass them to evaluate() as
 * { functions } (and to <form-flow>/<form-editor> as .functions). Not part of the engine.
 *
 * A function is used two ways in the JSON:
 * - as an operator in a condition or variable: { "cprDate": [{ "var": "values.cpr" }] }
 * - as a field check: "validation": { "check": "dk-cpr" }. A check returns null when the
 *   value passes, or { code, message, level? }; level "warning" reports without blocking.
 */
import { isoDate } from '../../modules/dates.js';

const digits = value => String(value ?? '').replace(/[\s-]/g, '');
const weighted = (text, weights) => [...text].reduce((sum, digit, index) => sum + Number(digit) * weights[index], 0);

/* The birth date in a Danish CPR number (DDMMYY-SSSS), using the 7th digit for the century. */
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
	/* Since 2007 some valid CPR numbers fail modulus 11, so that part only warns. */
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
	},
	luhn: value => {
		const number = digits(value);
		if (!/^\d{2,19}$/.test(number)) return { code: 'luhn', message: 'Only digits are allowed' };
		const sum = [...number].reverse().reduce((total, char, index) => {
			let n = Number(char);
			if (index % 2) n = n * 2 > 9 ? n * 2 - 9 : n * 2;
			return total + n;
		}, 0);
		return sum % 10 === 0 ? null : { code: 'luhn', message: 'The number is not valid (check digit)' };
	},
	iban: value => {
		const iban = String(value ?? '').replace(/\s/g, '').toUpperCase();
		if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return { code: 'iban', message: 'This does not look like an IBAN' };
		const numeric = (iban.slice(4) + iban.slice(0, 4)).replace(/[A-Z]/g, char => String(char.charCodeAt(0) - 55));
		const remainder = [...numeric].reduce((rest, char) => (rest * 10 + Number(char)) % 97, 0);
		return remainder === 1 ? null : { code: 'iban', message: 'The IBAN check digits do not match' };
	}
};

export default functions;
