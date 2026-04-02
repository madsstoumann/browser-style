/**
 * @file Standalone parser functions for product taxonomy files.
 * @author Mads Stoumann
 * @version 1.4.0
 * @summary 05-11-2025
 */

/**
 * Parses a line from a Google-formatted taxonomy file.
 * Example line: `123 - Electronics > Audio > Headphones`
 * @param {string} line - A single line from the taxonomy file.
 * @returns {object|null} A structured taxonomy item or null if parsing fails.
 */
export const googleTaxonomyParser = (line) => {
	const match = line.match(/^(\d+)\s*-\s*(.+)$/);
	if (!match) return null;
	const [, id, path] = match;
	const categories = path.split('>').map(c => c.trim());
	return { id, name: categories[categories.length - 1], path, categories };
};

/**
 * Parses a line from a Facebook-formatted taxonomy file.
 * Example line: `123,Electronics > Audio > Headphones`
 * @param {string} line - A single line from the taxonomy file.
 * @returns {object|null} A structured taxonomy item or null if parsing fails.
 */
export const facebookTaxonomyParser = (line) => {
	// Find the first comma to correctly handle paths that might contain commas.
	const firstCommaIndex = line.indexOf(',');
	if (firstCommaIndex === -1) return null;

	const id = line.substring(0, firstCommaIndex).trim();
	// The path is everything after the first comma.
	const path = line.substring(firstCommaIndex + 1).trim().replace(/"/g, ''); // Also remove quotes
	const categories = path.split('>').map(c => c.trim());
	return { id, name: categories[categories.length - 1], path, categories };
};
