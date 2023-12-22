/**
 * @function htmlToMarkdown
 * @description Transforms HTML to Markdown
 * @param {String} html
 * @returns {String} html
 */
export function htmlToMarkdown(html) {
	const parser = new DOMParser()
	const doc = parser.parseFromString(html, 'text/html')
	arrHTML.forEach((obj) => {
		const selector = obj.id === 'ol' ? ':not(li)>ol' : obj.id === 'ul' ? ':not(li)>ul' : obj.id
		;[...doc.body.querySelectorAll(selector)].forEach((node) => {
			try {
				node.innerHTML = obj.fn(node)
			} catch (err) {
				console.log(err)
			}
		})
	})
	return doc.body.textContent.trim()
}

/**
 * @const arrHTML
 * @description Array with HTML-rules. Note, that rules are *run* in the order they are defined
 */
const arrHTML = [
	{ id: 'b', fn: (n) => md('**', n) },
	{ id: 'br', fn: () => `  \r\n` },
	{ id: 'code', fn: (n) => md('`', n) },
	{ id: 'del', fn: (n) => md('---', n) },
	{ id: 'em', fn: (n) => md('*', n) },
	{ id: 'h1', fn: (n) => md('# ', n, 0) },
	{ id: 'h2', fn: (n) => md('## ', n, 0) },
	{ id: 'h3', fn: (n) => md('### ', n, 0) },
	{ id: 'h4', fn: (n) => md('#### ', n, 0) },
	{ id: 'h5', fn: (n) => md('##### ', n, 0) },
	{ id: 'h6', fn: (n) => md('###### ', n, 0) },
	{ id: 'hr', fn: () => `\r\n---\r\n` },
	{ id: 'i', fn: (n) => md('*', n) },
	{ id: 'iframe', fn: (n) => `{% ${n.dataset.tag} ${n.dataset.text} %}` },
	{ id: 'img', fn: (n) => `![${n.alt}](${n.src})` },
	{ id: 'mark', fn: (n) => md('==', n) },
	
	{ id: 'pre', fn: (n) => md('\r\n```\r\n', n) },
	{ id: 's', fn: (n) => md('~~', n) },
	{ id: 'strong', fn: (n) => md('**', n) },
	{ id: 'style', fn: () => `` },
	{ id: 'sub', fn: (n) => md('--', n) },
	{ id: 'sup', fn: (n) => md('^^', n) },
	{ id: 'u', fn: (n) => md('__', n) },

	{ id: 'a', fn: (n) => `[${n.innerHTML}](${n.getAttribute('href')})` },
	{ id: 'blockquote', fn: (n) => md('\r\n> ', n, '\r\n') },
	{ id: 'ol', fn: (n) => `${list(n)}\r\n` },
	{ id: 'ul', fn: (n) => `${list(n)}\r\n` },
	{ id: 'table', fn: (n) =>
		`${[...n.querySelectorAll('tr')]
			.map((row, index) => {
				const rowContent = `|${[...row.cells]
					.map((td) => td.textContent)
					.join('|')}|`
				const separator = `|${[...Array(row.cells.length).keys()]
					.map((index) => {
						const align = n.getAttribute(`data-c${index + 1}`) || 'start'
						return align === 'start'
							? '---'
							: align === 'end'
							? '---:'
							: ':---:'
					})
					.join('|')}|`
				return index === 1 ? separator + '\r\n' + rowContent : rowContent
			})
			.join('\r\n')}\r\n\n` },
	{ id: 'p', fn: (n) => md('\r\n\n\n', n) },
]

/**
 * @function markdownToHtml
 * @description Transforms a Markdown-string to HTML
 * @param {String} str
 * @returns {String} str
 */
export function markdownToHtml(str) {
	arrMarkdown.forEach((obj) => {
		try {
			str = str.replaceAll(
				obj.re,
				obj.fn ||
					((_match, text) => (text ? `<${obj.tg}>${text}</${obj.tg}>` : ''))
			)
		} catch (err) {
			console.log(err)
		}
	})
	return str
}


/**
 * @const arrMarkdown
 * @description Array with Markdown-rules. Note, that rules are *run* in the order they are defined
 */
const arrMarkdown = [
	{
		id: 'list',
		re: /^[0-9-+*]+[ .][\s\S]*?\n{2}/gm,
		fn: (list) => {
			const tree = list
				.trim()
				.split('\n')
				.reduce((result, li) => {
					const length = li.length
					const tabs = li.replace(/\t/g, '')
					const type = parseInt(tabs.charAt(0)) > 0 ? 'ol' : 'ul'
					const level = length - tabs.length
					const text = li.replace(/^([\t]+)?[\d*+-][. ]/gm, '').trim()

					if (level === 0) {
						const last = result.at(-1)
						const item = { text, nested: [] }
						if (last && last.type === type) {
							last.children.push(item)
						} else {
							result.push({
								type,
								children: [item],
							})
						}
						return result
					}
					addItem(result.at(-1), level, type, text)
					return result
				}, [])
			return `${genList(tree[0]).outerHTML}\r\n`
		},
	},
	{
		id: 'table',
		re: /((\|.*?\|\n)+)/gs,
		fn: (_match, table) => {
			const separator = table.match(/^.*\n( *\|( *:?-+:?-+:? *\|)* *\n|)/)[1]
			const align =
				separator
					?.split('|')
					.slice(1, -1)
					.map((str, index) => {
						const c = str.trim()
						const a =
							c.at(0) === ':' && c.at(-1) === ':'
								? 'center'
								: c.at(0) === ':'
								? 'start'
								: c.at(-1) === ':'
								? 'end'
								: 'start'
						return ` data-c${index + 1}="${a}"`
					})
					.join(' ') || ''

			return `<table${align}>${table.replace(/.*\n/g, (row, rowIndex) =>
				row === separator
					? ''
					: `<tr>${row.replace(/\||(.*?[^\\])\|/g, (_match, cell, cellIndex) =>
							cellIndex
								? separator && !rowIndex
									? `<th>${cell}</th>`
									: `<td>${cell}</td>`
								: ''
						)}</tr>`
			)}</table>\r\n`
		},
	},
	{ re: /\n>(.*)/g, tg: 'blockquote' },
	{
		id: 'pre',
		re: /\n((```|~~~)(.*)\n?([^]*?)\n?\2|(( {4}.*?\n)+))/g,
		fn: (_match, _g0, _g1, lang, text) => {
			return `<pre${lang ? ` class="highlight ${lang}"` : ''}>${rpTags(
				text
			)}</pre>\r\n`
		},
	},
	{
		id: 'headings',
		re: /(^#{1,6}) (.*)\n/gm,
		fn: (_match, tag, text) => `<h${tag.length}>${text}</h${tag.length}>\r\n`,
	},
	{
		id: 'img',
		re: /!\[(.*)\]\((.*)\)/g,
		fn: (_match, alt, src) => `\r\n<img src="${src}" alt="${alt}">\r\n`,
	},
	{
		id: 'a',
		re: /\[(.*)\]\((.*)\)/g,
		fn: (_match, title, href) => `<a href="${href}">${title}</a>`,
	},
	{
		id: 'bolditalic',
		re: /\*\*\*(.*?)\*\*\*/g,
		fn: (_match, text) => `<b><i>${text}</i></b>`,
	},
	{ id: 'strong', re: /\*\*(.*?)\*\*/g, tg: 'strong' },
	{ id: 'i', re: /\*(.*?)\*/g, tg: 'i' },
	{ id: 'br', re: /( {2}\n)/g, fn: () => `<br>` },
	{
		id: 'code',
		re: /`(.*?)`/g,
		fn: (_match, text) => `<code>${rpTags(text)}</code>`,
	},
	{ id: 'mark', re: /==(.*)==/g, tg: 'mark' },
	{ id: 'sup', re: /\^\^(.*)\^\^/g, tg: 'sup' },
	{ id: 's', re: /~~(.*)~~/g, tg: 's' },
	{ id: 'del', re: /---(.*)---/g, tg: 'del' },
	{ id: 'hr', re: /---/g, fn: () => `<hr>\r\n` },
	{ id: 'sub', re: /--(.*)--/g, tg: 'sub' },
	{ id: 'u', re: /__(.*)__/g, tg: 'u' },
	{ id: 'em', re: /_(.*?)_/g, tg: 'em' },
	{ id: 'p', re: /\n\n(.*?)\n\n/g, tg: 'p' },
	{
		id: 'iframe',
		re: /{% (.*)\s(.*) %}/gm,
		fn: (_match, tag, text) => iframe(tag, text),
	},
]

/**
 * @function addRule
 * @description Adds a rule to the arrHTML/arrMarkdown-arrays
 * @param {Array} arr
 * @param {Object} rule
 * @param {Number} index [optional, defaults to `0`]
 */
export function addRule(arr, rule, index = 0) {
	arr.splice(index, 0, rule)
}

/**
 * @function remRule
 * @description Removes a rule from the arrHTML/arrMarkdown-arrays
 * @param {Array} arr
 * @param {String} id
 */
export function remRule(id) {
	const index = arr.findIndex((obj) => obj.id === id)
	if (index > -1) arr.splice(index, 1)
}

/*
---------
 Helpers
---------
*/

/**
 * @function addItem
 * @description Adds an item to a list
 * @param {Node} list
 * @param {String} level
 * @param {String} type [ol|ul]
 * @param {String} text
 * @returns {String}
 */
const addItem = (list, level, type, text) => {
	if (level === 0) {
		if (list.type === type) list.children.push({ text, nested: [] })
		return
	}
	const listItem = list.children.at(-1)
	const nestedList = listItem.nested.at(-1)
	if (!nestedList || (level === 1 && nestedList.type !== type))
		listItem.nested.push({
			type,
			children: [],
		})
	addItem(listItem.nested.at(-1), level - 1, type, text)
}

/**
 * @function genList
 * @description Generates a list
 * @param {Node} list
 */
const genList = (list) => {
	const listElement = document.createElement(list.type)
	genListItems(list.children, listElement)
	return listElement
}

/**
 * @function genListItems
 * @description Generates list-items
 * @param {NodeList} listItems
 * @param {Node} parentElement
 */
const genListItems = (listItems, parentElement) => {
	for (const listItem of listItems) {
		const listItemElement = document.createElement('li')
		listItemElement.textContent = listItem.text
		parentElement.appendChild(listItemElement)
		listItem.nested.forEach((list) => {
			listItemElement.appendChild(genList(list))
		})
	}
}

/**
 * @function iframe
 * @description Based on Jekylls Liquid tags. Format is: {% tag text %}, example: {% youtube WK5fHV3Bm6M %}
 * @param {String} tag
 * @param {String} text
 * @returns {String} iframe
 */
const iframe = (tag, text) => {
	let allow = '',
		w = `100%`,
		h,
		src
	switch (tag) {
		case 'codepen':
			h = `600`
			src = `codepen.io/${text.replace(
				'/pen/',
				'/embed/'
			)}?height=${h}&amp;default-tab=result&amp;embed-version=2`
			break
		case 'jsfiddle':
			h = `300`
			src = `jsfiddle.net/${text}/embedded/`
			break
		case 'youtube':
			allow = 'autoplay; encrypted-media; picture-in-picture'
			w = `560`
			h = `315`
			src = `youtube.com/embed/${text}`
			break
	}
	return `<iframe width="${w}" height="${h}" src="https://${src}" loading="lazy"${
		allow ? ` allow="${allow}"` : ''
	} allowfullscreen data-tag="${tag}" data-text="${text}"></iframe>\r\n`
}

/**
 * @function list
 * @description Generates a list
 * @param {Node} olul
 * @param {Number} level [optional, defaults to `0`]
 */
function list(olul, level = 0) {
	return `${[...olul.children].map((li, index) => {
		return [...li.childNodes].map((node) => {
			if (node.tagName === 'OL' || node.tagName === 'UL') {
				return list(node, level + 1)
			}
			else {
				const content = node.textContent.trim()
				const prefix = olul.tagName === 'UL' ? '- ' : `${li.start ? li.start : index + 1}. `
				return content ? `\r\n${'\t'.repeat(level)}${prefix}${content}` : ''
			}
		}).join('')
	}).join('')}`
}

/**
 * @function md
 * @description Wraps a (markdown) prefix and optional suffix around a node. If suffix exists and equals `0`, it will be ignored
 * @param {String} prefix
 * @param {Node} node
 * @param {String} suffix [optional, defaults to `prefix`]
 * @returns {String}
 */
const md = (prefix, node, suffix) =>
	`${prefix}${node.innerHTML}${suffix === 0 ? '' : suffix || prefix}`

/**
 * @function rpTags
 * @description Replaces HTML-tags in a string with &lt; and &gt;
 * @param {String} s
 * @returns {String} s
 */
const rpTags = (s) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;')