/**
 * Copies the classList of the active element as a string to the clipboard.
 * @throws {Error} Throws an error if the Clipboard API is not supported or if there is an issue copying to the clipboard.
 */
export function copyClasses(classes) {
	try {
		if (!navigator.clipboard) {
			throw new Error('Clipboard API is not supported in this browser.');
		}
		navigator.clipboard.writeText(classes);
	} catch (error) {
		console.error('Error in copyClasses:', error.message);
	}
}