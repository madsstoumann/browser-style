/**
 * @function htmlToMarkdown
 * @description Transforms HTML to Markdown
 * @param {String} html
 * @returns {String} html
 */
export function htmlToMarkdown(html) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  Object.keys(objHTML).forEach((tag) => {
    ;[...doc.body.getElementsByTagName(tag)].forEach((node) => {
      try {
        node.innerHTML = objHTML[tag](node)
      } catch (err) {
        console.log(err)
      }
    })
  })
  return doc.body.textContent.trim()
}

/**
 * @function addHtmlRule
 * @description Adds a rule to the objHTML-object
 * @param {Object} rule
 */
export function addHtmlRule(rule) {
  objHTML[rule.tag] = rule.fn
}

/**
 * @function remHtmlRule
 * @description Removes a rule from the objHTML-object
 * @param {String} tag
 */
export function remHtmlRule(tag) {
  delete objHTML[tag]
}

/**
 * @const objHTML
 * @description Object with HTML-tags as keys and Markdown-functions as values
 */
const objHTML = {
  a: (n) => `[${n.innerHTML}](${n.href})`,
  b: (n) => md('**', n),
  blockquote: (n) => md('\r\n> ', n, '\r\n'),
  br: () => `  \r\n`,
  code: (n) => md('`', n),
  del: (n) => md('---', n),
  em: (n) => md('*', n),
  h1: (n) => md('# ', n, 0),
  h2: (n) => md('## ', n, 0),
  h3: (n) => md('### ', n, 0),
  h4: (n) => md('#### ', n, 0),
  h5: (n) => md('##### ', n, 0),
  h6: (n) => md('###### ', n, 0),
  hr: () => `\r\n---\r\n`,
  i: (n) => md('*', n),
  iframe: (n) => `{% ${n.dataset.tag} ${n.dataset.text} %}`,
  img: (n) => `![${n.alt}](${n.src})`,
  mark: (n) => md('==', n),
  ol: (n) => olul(n),
  p: (n) => md('\r\n\n\n', n),
  pre: (n) => md('\r\n```\r\n', n),
  s: (n) => md('~~', n),
  strong: (n) => md('**', n),
  style: () => ``,
  sub: (n) => md('--', n),
  sup: (n) => md('^^', n),
  table: (n) =>
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
      .join('\r\n')}\r\n\n`,
  u: (n) => md('__', n),
  ul: (n) => olul(n),
}

/**
 * @function markdownToHtml
 * @description Transforms a Markdown-string to HTML
 * @param {String} str
 * @returns {String} str
 */
export function markdownToHtml(str) {
  objMarkdown.forEach((obj) => {
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
 * @function addMdRule
 * @description Adds a rule to the objMarkdown-array
 * @param {Object} rule
 * @param {Number} index [optional, defaults to `0`]
 */
export function addMdRule(rule, index) {
  objMarkdown.splice(index, 0, rule)
}

/**
 * @function remMdRule
 * @description Removes a rule from the objMarkdown-array
 * @param {String} id
 */
export function remMdRule(id) {
  const index = objMarkdown.findIndex((obj) => obj.id === id)
  if (index > -1) objMarkdown.splice(index, 1)
}

/**
 * @const objMarkdown
 * @description Array with Markdown-rules
 */
const objMarkdown = [
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
 * @function olul
 * @description Generates a list
 * @param {Node} list
 * @param {Number} level [optional, defaults to `0`]
 */
function olul(list, level = 0) {
  return `\r\n${[...list.children]
    .map((li, index) => {
      const prefix =
        list.tagName === 'UL' ? '- ' : `${li.start ? li.start : index + 1}. `
      return li.children.length
        ? `\r\n${olul(li, level + 1)}`
        : `${'\t'.repeat(level)}${prefix}${li.innerHTML}\r\n`
    })
    .join('')}\r\n`
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
