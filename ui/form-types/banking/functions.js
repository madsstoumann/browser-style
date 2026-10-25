/**
 * Banking checks for @browser.style/form-rules: pass them as { functions }, or let loadPackages() import them from types.json.
 *
 * - iban: field check for an International Bank Account Number (mod 97).
 * - luhn: field check for numbers with a Luhn check digit (card numbers, some customer numbers).
 */
const digits = value => String(value ?? '').replace(/[\s-]/g, '');

export const functions = {
	iban: value => {
		const iban = String(value ?? '').replace(/\s/g, '').toUpperCase();
		if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return { code: 'iban', message: 'This does not look like an IBAN' };
		const numeric = (iban.slice(4) + iban.slice(0, 4)).replace(/[A-Z]/g, char => String(char.charCodeAt(0) - 55));
		const remainder = [...numeric].reduce((rest, char) => (rest * 10 + Number(char)) % 97, 0);
		return remainder === 1 ? null : { code: 'iban', message: 'The IBAN check digits do not match' };
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
	}
};

export default functions;
