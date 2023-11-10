export function htmlToMarkdown(html) {
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, 'text/html');
	Object.keys(markdown).forEach(tag => {
		[...doc.body.getElementsByTagName(tag)].forEach(node => {
			try { node.innerHTML = markdown[tag](node) } 
			catch (err) { console.log(err) }
		})
	})
	return doc.body.textContent.trim()
}

export function markdownToHtml(str) {
	Object.keys(html).forEach(tag => {
		try {
			str = str.replaceAll(html[tag].re, html[tag].fn || ((_match, text) => text ? `<${tag}>${text}</${tag}>`:'')) } 
		catch (err) { console.log(err) }
	})
	return str
}

/* HTML to Markdown */
const H = (prefix, node, suffix) => `${prefix}${node.innerHTML}${suffix === 0 ? '' : suffix || prefix }`
const markdown = {
	a: n => `[${n.innerHTML}](${n.href})`,
	b: n => H('**', n),
	blockquote: n => H('\r\n> ', n, '\r\n'),
	br: () => `  \r\n`,
	code: n => H('`', n),
	del: n => H('---', n),
	em: n => H('*', n),
	h1: n => H('# ', n, 0),
	h2: n => H('## ', n, 0),
	h3: n => H('### ', n, 0),
	h4: n => H('#### ', n, 0),
	h5: n => H('##### ', n, 0),
	h6: n => H('###### ', n, 0),
	hr: () => `\r\n---\r\n`,
	i: n => H('*', n),
	img: n => `![${n.alt}](${n.src})`,
	mark: n => H('==', n),
	ol: n => `\r\n${[...n.querySelectorAll('li')].map((li, index) => `\r\n${index+1}. ${li.innerHTML}`).join('')}\r\n`,
	p: n => H('\r\n\r\n', n),
	pre: n => H('\r\n```\r\n', n),
	s: n => H('~~', n),
	strong: n => H('**', n),
	style: n => ``, // ignore
	sub: n => H('--', n),
	sup: n => H('^^', n),
	table: n => `${[...n.querySelectorAll('tr')].map((row, index) => {
		const rowContent = `|${[...row.cells].map(td => td.textContent).join('|')}|`
		const separator = `|${[ ...Array(row.cells.length).keys() ].map(() => '---').join('|')}|`
		return index === 1 ? separator + '\r\n' + rowContent : rowContent }
	).join('\r\n')}\r\n`,
	u: n => H('__', n),
	ul: n => `\r\n${[...n.querySelectorAll('li')].map((li) => H('\r\n - ', li, 0)).join('')}\r\n`
}

/* Markdown to HTML */
const T = s => s.replace(/</g, '&lt;').replace(/>/g, '&gt;')
const html = {
	img: { re: /!\[(.*)\]\((.*)\)/gi, fn: (_match, alt, src) => `\r\n<img src="${src}" alt="${alt}">\r\n` },
	a: { re: /\[(.*)\]\((.*)\)/gi, fn: (_match, title, href) => `<a href="${href}">${title}</a>` },
	bi: { re: /\*\*\*(.*?)\*\*\*/gi, fn: (_match, text) => `<b><i>${text}</i></b>` },
	b: { re: /\*\*(.*?)\*\*/gi },
	i: { re: /\*(.*?)\*/gi },
	blockquote: { re: /\n>(.*)/gi },
	br: { re: /(  \n)/gi, fn: () => `<br>` },
	pre: {
		re: /\n((```|~~~).*\n?([^]*?)\n?\2|((    .*?\n)+))/g,
		fn: (_match, _g0, _g1, text) => `<pre>${T(text)}</pre>\r\n`
	},
	code: { re: /`(.*?)`/g, fn: (_match, text) => `<code>${T(text)}</code>` },
	h: {
		re: /(^#{1,6}) (.*)\n/gm,
		fn: (_match, tag, text) => `<h${tag.length}>${text}</h${tag.length}>\r\n`
	},
	mark: { re: /==(.*)==/gi },
	sup: { re: /\^\^(.*)\^\^/gi },
	s: { re: /\~\~(.*)\~\~/gi },
	table: { re: /((\|.*?\|\n)+)/gs, fn: (_match, table) => {
		const separator = table.match(/^.*\n( *\|( *\:?-+\:?-+\:? *\|)* *\n|)/)[1];
		return `<table>${
			table.replace(/.*\n/g, (row, rowIndex) => row === separator ? '' :
			`<tr>${
				row.replace(/\||(.*?[^\\])\|/g, (_match, cell, cellIndex) => cellIndex ? separator && !rowIndex ? `<th>${cell}</th>` : `<td>${cell}</td>` : '')
			}</tr>`)
		}</table>\r\n`
	}},
	del: { re: /---(.*)---/gi },
	hr: { re: /---/gi, fn: () => `<hr>\r\n` },
	sub: { re: /--(.*)--/gi },
	u: { re: /__(.*)__/gi },
	em: { re: /_(.*?)_/gi },
	list: {
		re: /^[0-9-+*]+[ .][\s\S]*?\n{2}/gm, fn: (list) => {
			const tag = parseInt(list.charAt(0)) > 0 ? 'ol' : 'ul'
			return `<${tag}>${
				list.replace(/^[\t0-9-+*]+[ .](.*)\n/gm, (_match, text) => {
					return `<li>${text}</li>`
				})
			}</${tag}>`
		}
	},
	p: { re: /\n\n(.*?)\n\n/gi },
}