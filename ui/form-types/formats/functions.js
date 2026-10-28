/**
 * Format checks for @browser.style/form-rules: pass them as { functions }, or let loadPackages() import them from types.json.
 *
 * - isbn: ISBN-10 or ISBN-13, with its check digit.
 * - gtin: GTIN / EAN barcodes (8, 12, 13 or 14 digits), with the check digit.
 * - ipv4: a dotted IPv4 address.
 */
const compact = value => String(value ?? '').replace(/[\s-]/g, '').toUpperCase();

const gtinValid = digits => {
	const sum = [...digits.slice(0, -1)].reverse().reduce((total, char, index) => total + Number(char) * (index % 2 ? 1 : 3), 0);
	return (10 - (sum % 10)) % 10 === Number(digits.at(-1));
};

export const functions = {
	isbn: value => {
		const isbn = compact(value);
		if (/^\d{9}[\dX]$/.test(isbn)) {
			const sum = [...isbn].reduce((total, char, index) => total + (char === 'X' ? 10 : Number(char)) * (10 - index), 0);
			return sum % 11 === 0 ? null : { code: 'isbn', message: 'The ISBN check digit does not match' };
		}
		if (/^97[89]\d{10}$/.test(isbn)) return gtinValid(isbn) ? null : { code: 'isbn', message: 'The ISBN check digit does not match' };
		return { code: 'isbn', message: 'An ISBN has 10 or 13 digits' };
	},
	gtin: value => {
		const gtin = compact(value);
		if (!/^(\d{8}|\d{12,14})$/.test(gtin)) return { code: 'gtin', message: 'A barcode number has 8, 12, 13 or 14 digits' };
		return gtinValid(gtin) ? null : { code: 'gtin', message: 'The barcode check digit does not match' };
	},
	ipv4: value => {
		const parts = String(value ?? '').trim().split('.');
		const valid = parts.length === 4 && parts.every(part => /^(0|[1-9]\d{0,2})$/.test(part) && Number(part) <= 255);
		return valid ? null : { code: 'ipv4', message: 'Write an IP address as four numbers from 0 to 255, such as 192.168.0.1' };
	}
};

export default functions;
