export const dynamicFunctions = {
	now: () => {
		const now = new Date();
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const day = String(now.getDate()).padStart(2, '0');
		const hours = String(now.getHours()).padStart(2, '0');
		const minutes = String(now.getMinutes()).padStart(2, '0');

		return `${year}-${month}-${day}T${hours}:${minutes}`;
	},
	uuid: () => crypto.randomUUID(),
	today: () => new Date().toISOString().split('T')[0],
};

/**
 * Extends the dynamic functions object with a new function.
 *
 * @param {string} name - The name of the function to add.
 * @param {Function} func - The function to add.
 * @throws Will log an error if `func` is not a function.
 */
export function extendDynamicFunction(name, func) {
	if (typeof func === 'function') {
		dynamicFunctions[name] = func;
	} else {
		console.error(`Failed to extend: ${name} is not a function`);
	}
}
