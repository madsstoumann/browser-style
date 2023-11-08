export function htmlToMarkdown(html) {
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, 'text/html');
	Object.keys(markdown).forEach(tag => {
		[...doc.body.getElementsByTagName(tag)].forEach(node => {
			node.innerHTML = markdown[tag](node)
		})
	})
	return doc.body.textContent.replace(/\t+/g, '').trim()
}

export function markdownToHtml(str) {
	Object.keys(html).forEach(tag => {
		str = str.replaceAll(html[tag].re, html[tag].fn || ((_match, text) => text ? `<${tag}>${text}</${tag}>`:''))
	})
	return str
}

/* HTML to Markdown */
const markdown = {
	a: (node) => `[${node.innerHTML}](${node.href})`,
	b: (node) => `**${node.innerHTML}**`,
	blockquote: (node) => `\r\n> ${node.innerHTML.replace(/\r|\n/g, '\r\n> ')}\r\n`,
	br: () => `  \r\n`,
	code: (node) => `\`${node.innerHTML.replace(/\r|\n/g, '').replace(/^\s*(.*)\s*$/, '$1')}\``,
	del: (node) => `---${node.innerHTML}---`,
	h1: (node) => `# ${node.innerHTML}`,
	h2: (node) => `## ${node.innerHTML}`,
	h3: (node) => `### ${node.innerHTML}`,
	h4: (node) => `#### ${node.innerHTML}`,
	h5: (node) => `##### ${node.innerHTML}`,
	h6: (node) => `###### ${node.innerHTML}`,
	hr: () => `\r\n---\r\n`,
	i: (node) => `*${node.innerHTML}*`,
	img: (node) => `![${node.alt}](${node.src})`,
	mark: (node) => `==${node.innerHTML}==`,
	ol: (node) => `\r\n${[...node.querySelectorAll('li')].map((li, index) => `\r\n${index+1}. ${li.innerHTML}`).join('')}\r\n`,
	pre: (node) => `\r\n\`\`\`\r\n${node.innerHTML}\r\n\`\`\`\r\n`,
	s: (node) => `~~${node.innerHTML}~~`,
	sub: (node) => `--${node.innerHTML}--`,
	sup: (node) => `^^${node.innerHTML}^^`,
	table: (node) => `${[...node.querySelectorAll('tr')].map((row, index) => {
		const rowContent = `|${[...row.cells].map(td => td.textContent).join('|')}|`
		const separator = `|${[ ...Array(row.cells.length).keys() ].map(() => '---').join('|')}|`
		return index === 1 ? separator + '\r\n' + rowContent : rowContent }
	).join('\r\n')}\r\n`,
	u: (node) => `__${node.innerHTML}__`,
	ul: (node) => `\r\n${[...node.querySelectorAll('li')].map((li) => `\r\n - ${li.innerHTML}`).join('')}\r\n`,
	p: (node) => `\r\n\r\n${node.innerHTML}\r\n\r\n`,
}

/* Markdown to HTML */
const html = {
	img: { re: /!\[(.*)\]\((.*)\)/gi, fn: (_match, alt, src) => `\r\n<img src="${src}" alt="${alt}">\r\n` },
	a: { re: /\[(.*)\]\((.*)\)/gi, fn: (_match, title, href) => `<a href="${href}">${title}</a>` },
	bi: { re: /\*\*\*(.*?)\*\*\*/gi, fn: (_match, text) => `<b><i>${text}</i></b>` },
	b: { re: /\*\*(.*?)\*\*/gi },
	i: { re: /\*(.*?)\*/gi },
	blockquote: { re: /\n>(.*)/gi },
	br: { re: /(  \n)/gi, fn: () => `<br>` },
	pre: { re: /\n((```|~~~).*\n?([^]*?)\n?\2|((    .*?\n)+))/g, fn: (_match, _g0, _g1, text) => `<pre>${text}</pre>\r\n` },
	code: { re: /`(.*)`/gi },
	h: { /* H1-H6 */
		re: /(?=^|>|\n)([>\s]*?)(#{1,6}) (.*?)( #*)? *(?=\n|$)/gi,
		fn: (_match, _0, tag, text) => `\r\n<h${tag.length}>${text}</h${tag.length}>\r\n`
	},
	mark: { re: /==(.*)==/gi },
	sup: { re: /\^\^(.*)\^\^/gi },
	s: { re: /\~\~(.*)\~\~/gi },
	table: { re: /((\|.*\|\n)+)/gs, fn: (_match, table) => {
		const separator = table.match(/^.*\n( *\|( *\:?-+\:?-+\:? *\|)* *\n|)/)[1];
		return `<table>${
			table.replace(/.*\n/g, (row, rowIndex) => row === separator ? '' :
			`<tr>${
				row.replace(/\||(.*?[^\\])\|/g, (_match, cell, cellIndex) => cellIndex ? separator && !rowIndex ? `<th>${cell}</th>` : `<td>${cell}</td>` : '')
			}</tr>`)
		}</table>\r\n`
	}},
	hr: { re: /---/gi, fn: () => `<hr>\r\n` },
	sub: { re: /--(.*)--/gi },
	u: { re: /__(.*)__/gi },
	em: { re: /_(.*?)_/gi },
	list: {
		re: /\n( *)(?:[*\-+]|((\d+)|([a-z])|[A-Z])[.)]) +([^]*?)(?=(\n|$){2})/g,
		fn: (_match, _, isOL) => isOL ? `\r\n<ol>${_match}\r\n</ol>\r\n` : `\r\n<ul>${_match}\r\n</ul>\r\n`
	},
	ol: { re: /(^\d+)\.\s(.*)/gm, fn: (_match, index, text) => `<li value="${index}">${text}</li>` },
	ul: { re: /\-\s(.*)/gi, fn: (_match, text) => `<li>${text}</li>` },
	p: { re: /\n\n(.*?)\n\n/gi },
}