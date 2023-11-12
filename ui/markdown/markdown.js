import { addItem, generateList } from './markdown.helpers.js'
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
		try { str = str.replaceAll(html[tag].re, html[tag].fn || ((_match, text) => text ? `<${tag}>${text}</${tag}>`:'')) } 
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
	style: n => ``,
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
	list: {
		re: /^[0-9-+*]+[ .][\s\S]*?\n{2}/gm, fn: (list) => {
			const tree = list.trim().split('\n').reduce((result, li) => {
				const length = li.length
				const tabs = li.replace(/\t/g, '')
				const type = parseInt(tabs.charAt(0)) > 0 ? 'ol' : 'ul'
				const level = length - tabs.length
				const text = li.replace(/^([\t]+)?[\d\*\+-][. ]/gm, '').trim()

				if (level === 0) {
					const last = result.at(-1)
					const item = { text, nested: [] }
					if (last && last.type === type) {
						last.children.push(item)
					} else {
						result.push({
							type,
							children: [item]
						})
					}
					return result
				}
				addItem(result.at(-1), level, type, text)
				return result
			}, [])
			return generateList(tree[0]).outerHTML
		}
	},
	table: { re: /((\|.*?\|\n)+)/gs, fn: (_match, table) => {
		const separator = table.match(/^.*\n( *\|( *\:?-+\:?-+\:? *\|)* *\n|)/)[1];
		return `<table>${
			table.replace(/.*\n/g, (row, rowIndex) => row === separator ? '' :
			`<tr>${
				row.replace(/\||(.*?[^\\])\|/g, (_match, cell, cellIndex) => cellIndex ? 
				separator && !rowIndex ? `<th>${cell}</th>` : `<td>${cell}</td>` : '')
			}</tr>`)
		}</table>\r\n`
	}},
	img: { re: /!\[(.*)\]\((.*)\)/g, fn: (_match, alt, src) => `\r\n<img src="${src}" alt="${alt}">\r\n` },
	a: { re: /\[(.*)\]\((.*)\)/g, fn: (_match, title, href) => `<a href="${href}">${title}</a>` },

	bi: { re: /\*\*\*(.*?)\*\*\*/g, fn: (_match, text) => `<b><i>${text}</i></b>` },
	b: { re: /\*\*(.*?)\*\*/g },
	i: { re: /\*(.*?)\*/g },
	blockquote: { re: /\n>(.*)/g },
	br: { re: /(  \n)/g, fn: () => `<br>` },
	pre: {
		re: /\n((```|~~~).*\n?([^]*?)\n?\2|((    .*?\n)+))/g,
		fn: (_match, _g0, _g1, text) => `<pre>${T(text)}</pre>\r\n`
	},
	code: { re: /`(.*?)`/g, fn: (_match, text) => `<code>${T(text)}</code>` },
	h: {
		re: /(^#{1,6}) (.*)\n/gm,
		fn: (_match, tag, text) => `<h${tag.length}>${text}</h${tag.length}>\r\n`
	},
	mark: { re: /==(.*)==/g },
	sup: { re: /\^\^(.*)\^\^/g },
	s: { re: /\~\~(.*)\~\~/g },

	del: { re: /---(.*)---/g },
	hr: { re: /---/g, fn: () => `<hr>\r\n` },
	sub: { re: /--(.*)--/g },
	u: { re: /__(.*)__/g },
	em: { re: /_(.*?)_/g },

	p: { re: /\n\n(.*?)\n\n/g },
}