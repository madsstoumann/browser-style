export async function go(u, t, o = {}) {
	try {
		const r = await fetch(u, o);
		if (!r.ok) throw new Error(`HTTP error:${r.status}`);
		return t === "json" ? await r.json() : t === "text" ? await r.text() : r;
	} catch (e) {
		throw e;
	}
}

export function processFiles(event, app) {
	const files = event.target.files;
	if (files.length === 1) {
		const reader = new FileReader();
		reader.addEventListener('load', event => {
			const data = JSON.parse(event.target.result);
			if (!data.tokens) return;
			app.innerHTML = renderTokens(data.tokens);
		})
		reader.readAsText(files[0]);
	}
};

function getTypeContent($type) {
	switch ($type) {
		case 'font-family':
			return `<ol>${('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890+=@#').split('').map(char => `<li>${char}</li>`).join('')}</ol>`;
		case 'font-size': case 'font-weight': case 'letter-spacing': case 'text-shadow':
			return `<div>The quick brown fox jumps over the lazy dog</div>`;
		default:
			return '';
	}
}

export function renderTokens(obj, level = 1) {
	const checkTokens = (obj) => Object.keys(obj).some((key) =>
		Object.prototype.hasOwnProperty.call(obj[key], '$type') &&
		Object.prototype.hasOwnProperty.call(obj[key], '$value')
	);
	const dl = arr => `<dl>${arr.map(([key, val] = item) => `<dt>${key}</dt><dd>${val}</dd>`).join('')}</dl>`;
	return Object.entries(obj)
	.map(([key, value]) => {
		if (typeof value === 'object' && !('$value' in value && '$type' in value)) {
			const hasTokens = checkTokens(obj[key]);
			return `
				<details class="ui-accordion"${level > 1 ? ` open` : ''} data-level="${level}">
					<summary>${key}<ui-icon type="${level === 1 ? `chevron down` : `plus-minus`}"></ui-icon></summary>
					${hasTokens ? `<ul>`:''}${renderTokens(value, level + 1)}${hasTokens ? `</ul>`:''}
				</details>`;
			} else {
			return `
				<li data-type="${value.render || value.$type}" data-key="${key}" style="--_v:${value.$value};">
					${getTypeContent(value.render || value.$type)}
					${dl([...(value.$description ? [['name', value.$description]] : []), ['key', key], ['value', value.$value], ['type', value.$type], ...(value.render ? [['render', value.render]] : [])])}
				</li>`;
			}
		})
	.join('');
}