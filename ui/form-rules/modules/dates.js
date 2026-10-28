/**
 * Date helpers for conditions and computed variables. Dates are ISO strings (YYYY-MM-DD);
 * "today" is always passed in (input.today), never read from a clock, so evaluation stays pure.
 */

/* An ISO date (YYYY-MM-DD) that exists, or null. */
export function isoDate(value) {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? ''));
	if (!match) return null;
	const [, y, m, d] = match.map(Number);
	const date = new Date(Date.UTC(y, m - 1, d));
	return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d ? match[0] : null;
}

/* Whole years from `from` to `to` (both ISO dates), or null. */
export function yearsBetween(from, to) {
	const a = isoDate(from);
	const b = isoDate(to);
	if (!a || !b) return null;
	const [ay, am, ad] = a.split('-').map(Number);
	const [by, bm, bd] = b.split('-').map(Number);
	return by - ay - (bm < am || (bm === am && bd < ad) ? 1 : 0);
}

export function daysBetween(from, to) {
	const a = isoDate(from);
	const b = isoDate(to);
	return a && b ? Math.round((Date.parse(b) - Date.parse(a)) / 864e5) : null;
}

const PARTS = ['year', 'month', 'day', 'weekday', 'week'];

/* One part of an ISO date as a number: year, month, day, weekday (Monday 1 … Sunday 7) or ISO week. */
export function datePart(value, part) {
	const date = isoDate(value);
	if (!date || !PARTS.includes(part)) return null;
	const [y, m, d] = date.split('-').map(Number);
	if (part === 'year') return y;
	if (part === 'month') return m;
	if (part === 'day') return d;
	const utc = new Date(Date.UTC(y, m - 1, d));
	const weekday = utc.getUTCDay() || 7;
	if (part === 'weekday') return weekday;
	utc.setUTCDate(d + 4 - weekday);
	const yearStart = Date.UTC(utc.getUTCFullYear(), 0, 1);
	return Math.ceil(((utc - yearStart) / 864e5 + 1) / 7);
}
