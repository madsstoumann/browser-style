/**
 * @function htmlToMarkdown
 * @description Transforms HTML to Markdown
 * @param {String} html
 */
export function htmlToMarkdown(html) {
	const obj = {
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
		/* TODO! read dataset of table and create alignment-separator */
		table: n => `${[...n.querySelectorAll('tr')].map((row, index) => {
			const rowContent = `|${[...row.cells].map(td => td.textContent).join('|')}|`
			const separator = `|${[ ...Array(row.cells.length).keys() ].map(() => '---').join('|')}|`
			return index === 1 ? separator + '\r\n' + rowContent : rowContent }
		).join('\r\n')}\r\n`,
		u: n => H('__', n),
		ul: n => `\r\n${[...n.querySelectorAll('li')].map((li) => H('\r\n - ', li, 0)).join('')}\r\n`
	}

	const parser = new DOMParser();
	const doc = parser.parseFromString(html, 'text/html');
	Object.keys(obj).forEach(tag => {
		[...doc.body.getElementsByTagName(tag)].forEach(node => {
			try { node.innerHTML = obj[tag](node) } 
			catch (err) { console.log(err) }
		})
	})
	return doc.body.textContent.trim()
}

/**
 * @function markdownToHtml
 * @description Transforms a Markdown-string to HTML
 * @param {String} str
 */
export function markdownToHtml(str) {
	const arr = [
		/* <ol> || <ul> */
		{
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
				return `${generateList(tree[0]).outerHTML}\r\n`
			}
		},
		/* <table> */
		{ re: /((\|.*?\|\n)+)/gs, fn: (_match, table) => {
			const separator = table.match(/^.*\n( *\|( *\:?-+\:?-+\:? *\|)* *\n|)/)[1];
			const align = separator?.split('|').slice(1, -1).map((str, index) => {
				const c = str.trim()
				const a = c.at(0) === ':' && c.at(-1) === ':' ? 'center'
				: c.at(0) === ':' ? 'start'
				: c.at(-1) === ':' ? 'end'
				: 'start';
				return ` data-c${index + 1}="${a}"`
			}).join(' ') || ''

			return `<table${align}>${
				table.replace(/.*\n/g, (row, rowIndex) => row === separator ? '' :
				`<tr>${
					row.replace(/\||(.*?[^\\])\|/g, (_match, cell, cellIndex) => cellIndex ? 
					separator && !rowIndex ? `<th>${cell}</th>` : `<td>${cell}</td>` : '')
				}</tr>`)
			}</table>\r\n`
		}},
		{ re: /\n>(.*)/g, tg: 'blockquote' },
		/* <pre> */
		{
			re: /\n((```|~~~)(.*)\n?([^]*?)\n?\2|((    .*?\n)+))/g,
			fn: (_match, _g0, _g1, lang, text) => {
				return `<pre${lang ? ` class="highlight ${lang}"`:''}>${removeTags(text)}</pre>\r\n`
			}
		},
		/* <h1>-<h6> */
		{
			re: /(^#{1,6}) (.*)\n/gm,
			fn: (_match, tag, text) => `<h${tag.length}>${text}</h${tag.length}>\r\n`
		},
		/* <img> */
		{ re: /!\[(.*)\]\((.*)\)/g, fn: (_match, alt, src) => `\r\n<img src="${src}" alt="${alt}">\r\n` },
		/* <a> */
		{ re: /\[(.*)\]\((.*)\)/g, fn: (_match, title, href) => `<a href="${href}">${title}</a>` },

		{ re: /\*\*\*(.*?)\*\*\*/g, fn: (_match, text) => `<b><i>${text}</i></b>` },
		{ re: /\*\*(.*?)\*\*/g, tg: 'strong' },
		{ re: /\*(.*?)\*/g, tg: 'em' },
		{ re: /(  \n)/g, fn: () => `<br>` },
		{ re: /`(.*?)`/g, fn: (_match, text) => `<code>${removeTags(text)}</code>` },
		{ re: /==(.*)==/g, tg: 'mark' },
		{ re: /\^\^(.*)\^\^/g, tg: 'sup' },
		{ re: /\~\~(.*)\~\~/g, tg: 's' },
		{ re: /---(.*)---/g, tg: 'del' },
		{ re: /---/g, fn: () => `<hr>\r\n` },
		{ re: /--(.*)--/g, tg: 'sub' },
		{ re: /__(.*)__/g, tg: 'u' },
		{ re: /_(.*?)_/g, tg: 'em' },
		{ re: /\n\n(.*?)\n\n/g, tg: 'p' },
		{ re: /{% (.*)\s(.*) %}/gm, fn: (_match, tag, text) => liquidTag(tag, text) },
	]

	arr.forEach(obj => {
		try { str = str.replaceAll(obj.re, obj.fn || ((_match, text) => text ? `<${obj.tg}>${text}</${obj.tg}>`:'')) } 
		catch (err) { console.log(err) }
	})
	return str
}

/*
---------
 Helpers
---------
*/

const H = (prefix, node, suffix) => `${prefix}${node.innerHTML}${suffix === 0 ? '' : suffix || prefix }`

const addItem = (list, level, type, text) => {
	if (level === 0) {
		if (list.type === type) list.children.push({ text, nested: [] })
		return
	}
	const listItem = list.children.at(-1)
	const nestedList = listItem.nested.at(-1)
	if (!nestedList || level === 1 && nestedList.type !== type) 
		listItem.nested.push({
			type,
			children: [],
		})
	addItem(listItem.nested.at(-1), level - 1, type, text)
}
const generateList = (list) => {
  const listElement = document.createElement(list.type);
  generateListItems(list.children, listElement);
  return listElement;
}
const generateListItems = (listItems, parentElement) => {
  for (const listItem of listItems) {
    const listItemElement = document.createElement('li');
    listItemElement.textContent = listItem.text;
    parentElement.appendChild(listItemElement);
    listItem.nested.forEach(list => {
    	listItemElement.appendChild(generateList(list))
    })
  }
}
const liquidTag = (tag, text) => {
	let allow = '', w = `100%`, h, src;
	switch (tag) {
		case 'codepen':
			h = `600`
			src = `codepen.io/${text.replace('/pen/', '/embed/')}?height=${h}&amp;default-tab=result&amp;embed-version=2`
			break;
		case 'jsfiddle':
			h = `300`
			src = `jsfiddle.net/${text}/embedded/`
			break;
		case 'youtube':
			allow = 'autoplay; encrypted-media; picture-in-picture'
			w = `560`
			h = `315`
			src = `www.youtube.com/embed/${text}`
			break;
		}
	return `<iframe width="${w}" height="${h}" src="https://${src}" loading="lazy"${allow ? ` allow="${allow}"`:''} allowfullscreen></iframe>\r\n`
}
const removeTags = s => s.replace(/</g, '&lt;').replace(/>/g, '&gt;')