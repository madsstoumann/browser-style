/**
 * Data format converters for DataMapper
 * Input: Array of objects
 * Output: String in specified format
 */
export const dataFormats = {
	csv: (data, options = {}) => {
		const {
			delimiter = ',',
			headers = true,
			quotes = true,
			replaceNewlines = true
		} = options;

		if (!data?.length) return '';
		const keys = Object.keys(data[0]);
		
		const escapeField = value => {
			if (value === null || value === undefined) return '';
			let str = String(value);
			// Replace newlines with spaces if option is enabled
			if (replaceNewlines) {
				str = str.replace(/\n/g, ' ');
			}
			const needsQuoting = str.includes(delimiter) || str.includes('\n') || str.includes('"');
			if (!needsQuoting && !quotes) return str;
			return `"${str.replace(/"/g, '""')}"`;
		};
		
		const rows = [
			headers ? keys.map(escapeField).join(delimiter) : '',
			...data.map(row => 
				keys.map(key => escapeField(row[key])).join(delimiter)
			)
		].filter(Boolean);

		return rows.join('\n');
	},

	json: (data, options = {}) => {
		const {
			pretty = true,
			space = 2
		} = options;
		
		return pretty ? 
			JSON.stringify(data, null, space) : 
			JSON.stringify(data);
	},

	ndjson: data => 
		data.map(row => JSON.stringify(row)).join('\n'),

	tsv: (data, options = {}) => {
		return dataFormats.csv(data, { 
			...options, 
			delimiter: '\t',
			quotes: true 
		});
	},

	yaml: (data, options = {}) => {
		const {
			flowStyle = false,
			indent = 2
		} = options;

		const makeIndent = level => ' '.repeat(level * indent);
		
		const convertValue = (value, level = 0) => {
			if (Array.isArray(value)) {
				if (flowStyle) {
					return `[${value.map(v => convertValue(v)).join(', ')}]`;
				}
				return value.map(v => 
					`\n${makeIndent(level)}- ${convertValue(v, level + 1)}`
				).join('');
			}
			if (typeof value === 'object' && value !== null) {
				if (flowStyle) {
					return `{ ${Object.entries(value)
						.map(([k, v]) => `${k}: ${convertValue(v)}`)
						.join(', ')} }`;
				}
				return Object.entries(value)
					.map(([k, v]) => 
						`\n${makeIndent(level)}${k}: ${convertValue(v, level + 1)}`)
					.join('');
			}
			return String(value ?? '');
		};

		return convertValue(data);
	},

	xml: (data, options = {}) => {
		const {
			root = 'root',
			item = 'item',
			pretty = true,
			indent = 2
		} = options;

		const makeIndent = level => pretty ? '\n' + ' '.repeat(level * indent) : '';
		
		const convertValue = (value, key, level = 0) => {
			if (Array.isArray(value)) {
				return value.map(v => 
					`${makeIndent(level)}<${item}>${convertValue(v, item, level + 1)}${makeIndent(level)}</${item}>`
				).join('');
			}
			if (typeof value === 'object' && value !== null) {
				return Object.entries(value)
					.map(([k, v]) => 
						`${makeIndent(level)}<${k}>${convertValue(v, k, level + 1)}${makeIndent(level)}</${k}>`)
					.join('');
			}
			return String(value ?? '');
		};

		return `<?xml version="1.0" encoding="UTF-8"?>${makeIndent(0)}<${root}>${
			convertValue(data, root, 1)
		}${makeIndent(0)}</${root}>`;
	}
};

export const mimeTypes = {
	csv: 'text/csv',
	json: 'application/json',
	ndjson: 'application/x-ndjson',
	tsv: 'text/tab-separated-values',
	yaml: 'application/x-yaml',
	xml: 'application/xml'
};

export const inputParsers = {
	csv: (text, options = {}) => {
		const { 
			delimiter = ',',
			headers = true,
			trim = true 
		} = options;

		const lines = text.trim().split('\n');
		if (!lines.length) return [];

		const headerRow = headers ? lines.shift() : null;
		const fields = headerRow ? 
			headerRow.split(delimiter).map(h => trim ? h.trim() : h) :
			Array.from({ length: lines[0].split(delimiter).length }, (_, i) => `field${i + 1}`);

		return lines.map(line => {
			const values = line.split(delimiter);
			return fields.reduce((obj, field, i) => {
				obj[field] = trim ? values[i]?.trim() : values[i];
				return obj;
			}, {});
		});
	},

	yaml: (text) => {
		const parseValue = (value) => {
			if (!value || value === '~') return null;
			if (value === 'true') return true;
			if (value === 'false') return false;
			if (/^-?\d+$/.test(value)) return parseInt(value, 10);
			if (/^-?\d*\.\d+$/.test(value)) return parseFloat(value);
			// Remove quotes if present
			return value.replace(/^["']|["']$/g, '');
		};

		const parseYamlObject = (lines, level = 0) => {
			const result = Array.isArray(level) ? [] : {};
			const baseIndent = lines[0]?.match(/^\s*/)[0].length || 0;
			let i = 0;

			while (i < lines.length) {
				const line = lines[i];
				const indent = line.match(/^\s*/)[0].length;
				
				// Skip empty lines and comments
				if (!line.trim() || line.trim().startsWith('#')) {
					i++;
					continue;
				}

				// Break if we're back to a lower indentation level
				if (indent < baseIndent) break;

				const match = line.trim().match(/^(-\s*)?([^:]+):\s*(.*)$/);
				if (match) {
					const [, isList, key, value] = match;
					const trimmedValue = value.trim();

					if (!trimmedValue) {
						// Nested object or array
						const nested = [];
						i++;
						while (i < lines.length && lines[i].match(/^\s*/)[0].length > indent) {
							nested.push(lines[i]);
							i++;
						}
						if (nested.length) {
							result[key.trim()] = parseYamlObject(nested, []);
							continue;
						}
					}

					if (Array.isArray(result)) {
						const obj = {};
						obj[key.trim()] = parseValue(trimmedValue);
						result.push(obj);
					} else {
						result[key.trim()] = parseValue(trimmedValue);
					}
				} else if (line.trim().startsWith('-')) {
					// Array item
					if (Array.isArray(result)) {
						const value = line.trim().slice(1).trim();
						result.push(parseValue(value));
					}
				}
				i++;
			}

			return result;
		};

		const parsed = parseYamlObject(text.split('\n'));
		
		// If parsed result is an array, return it
		if (Array.isArray(parsed)) return parsed;
		
		// If it's an object with a single key containing an array, return that array
		const values = Object.values(parsed);
		if (values.length === 1 && Array.isArray(values[0])) return values[0];
		
		// If it's a plain object, wrap it in an array
		return [parsed];
	},

	xml: (text) => {
		const parser = new DOMParser();
		const xmlDoc = parser.parseFromString(text, 'text/xml');
		
		const parseNode = (node) => {
			// Skip comments, processing instructions, etc.
			if (node.nodeType !== 1) return null;

			// Handle text-only nodes
			if (node.childNodes.length === 1 && node.childNodes[0].nodeType === 3) {
				const value = node.textContent.trim();
				// Try to convert to appropriate type
				if (value === 'true') return true;
				if (value === 'false') return false;
				if (/^\d+$/.test(value)) return parseInt(value, 10);
				if (/^\d*\.\d+$/.test(value)) return parseFloat(value);
				return value;
			}

			const result = {};
			const children = Array.from(node.children);

			// Group similar tags as arrays
			children.forEach(child => {
				const name = child.tagName;
				const value = parseNode(child);

				if (name in result) {
					if (!Array.isArray(result[name])) {
						result[name] = [result[name]];
					}
					result[name].push(value);
				} else {
					result[name] = value;
				}
			});

			// Handle attributes
			Array.from(node.attributes).forEach(attr => {
				result[`@${attr.name}`] = attr.value;
			});

			return Object.keys(result).length ? result : node.textContent.trim();
		};

		// Get root element and parse its children
		const root = xmlDoc.documentElement;
		const rootName = root.tagName;
		
		// Handle single root with array of similar children
		const children = Array.from(root.children);
		if (children.length && children.every(child => child.tagName === children[0].tagName)) {
			return children.map(child => parseNode(child));
		}
		
		// Handle regular XML structure
		return { [rootName]: parseNode(root) };
	}
};
