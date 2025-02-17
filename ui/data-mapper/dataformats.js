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
      quotes = false
    } = options;

    if (!data?.length) return '';
    const keys = Object.keys(data[0]);
    const wrap = quotes ? str => `"${str}"` : str => str;
    
    const rows = [
      headers ? keys.map(wrap).join(delimiter) : '',
      ...data.map(row => 
        keys.map(key => wrap(row[key] ?? '')).join(delimiter)
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
      quotes: false 
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
