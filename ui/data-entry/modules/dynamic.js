
export const dynamicFunctions = {
	/* === Date and Time Functions === */
	dateDifference: (startDate, endDate) => {
		const start = new Date(startDate);
		const end = new Date(endDate);
		const diffTime = Math.abs(end - start);
		return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Difference in days
	},
	now: (format = 'datetime-local') => {
		const now = new Date();
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const day = String(now.getDate()).padStart(2, '0');
		const hours = String(now.getHours()).padStart(2, '0');
		const minutes = String(now.getMinutes()).padStart(2, '0');
		const seconds = String(now.getSeconds()).padStart(2, '0');

		switch (format) {
			case 'date':
				return `${year}-${month}-${day}`;
			case 'time':
				return `${hours}:${minutes}:${seconds}`;
			case 'datetime-local':
				return `${year}-${month}-${day}T${hours}:${minutes}`;
			case 'iso':
				return now.toISOString();
			default:
				return `${year}-${month}-${day}T${hours}:${minutes}`;
		}
	},
	today: () => new Date().toISOString().split('T')[0], // Returns today's date

	/* === Formatters === */
	formatCurrency: (value, currencyCode = 'USD', locale = dynamicFunctions.getLocale()) => {
		return new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode.toUpperCase() }).format(value);
	},
	formatDate: (value, locale = 'en-US', options) => {
		const date = new Date(value);
		return date.toLocaleDateString(locale, options || {});
	},
	formatNumber: (value, decimals = 2) => {
		const num = parseFloat(value);
		return isNaN(num) ? '0.00' : num.toFixed(decimals);
	},

	/* === Random Generators === */
	randomNumber: (min = 0, max = 100) => {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	},
	uuid: () => crypto.randomUUID(), // Generates a unique UUID

	/* === String Formatters === */
	capitalizeFirst: (value) => {
		return value.charAt(0).toUpperCase() + value.slice(1);
	},
	lowercase: (value) => String(value).toLowerCase(),
	slugify: (value) => {
		return value
			.toString()
			.toLowerCase()
			.trim()
			.replace(/\s+/g, '-')
			.replace(/[^\w\-]+/g, '')
			.replace(/\-\-+/g, '-');
	},
	titleCase: (value) => {
		return value.replace(/\w\S*/g, (txt) => {
			return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
		});
	},
	uppercase: (value) => String(value).toUpperCase(),

	/* === Locale Functions === */
	getLocale: () => {
		return document.documentElement.lang || 'en-US';
	}
};

// Extend the dynamic functions object with new dynamic methods or formatters
export function extendDynamicFunction(name, func) {
	if (typeof func === 'function') {
		dynamicFunctions[name] = func;
	} else {
		console.error(`Failed to extend: ${name} is not a function`);
	}
}
