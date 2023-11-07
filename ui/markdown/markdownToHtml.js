/* Re-written from https://adamvleggett.github.io/drawdown/ */
export function markdownToHtml(src) {
	const blockquote = (src) => src.replace(/\n *&gt; *([^]*?)(?=(\n|$){2})/g, (_, content) => node('blockquote', blockquote(inline(content.replace(/^ *&gt; */gm, '')))));
	const node = (tag, content) => `<${tag}>${content}</${tag}>`
	const replace = (rx, fn) => src = src.replace(rx, fn)
	const unEscape = (str) => str.replace(/\\([\\\|`*_{}\[\]()#+\-~])/g, '$1')

	function inline(src) {
		return src.replace(/(^|[^A-Za-z\d\\])(([*_])|(~)|(\^)|(--)|(\+\+)|`)(\2?)([^<]*?)\2\8(?!\2)(?=\W|_|$)/g, (all, _, p1, emp, sub, sup, small, big, p2, content) => {
			return _ + node(
					emp ? (p2 ? 'strong' : 'em')
				: sub ? (p2 ? 's' : 'sub')
				: sup ? 'sup'
				: small ? 'small'
				: big ? 'big'
				: 'code',
				inline(content)
			)
		})
	}
	function list(src) {
		return src.replace(/\n( *)(?:[*\-+]|((\d+)|([a-z])|[A-Z])[.)]) +([^]*?)(?=(\n|$){2})/g, (_, ind, ol, num, low, content) => {
			const entry = node('li', inline(content.split(RegExp('\n ?' + ind + '(?:(?:\\d+|[a-zA-Z])[.)]|[*\\-+]) +', 'g')).map(list).join('</li><li>')))
			return '\n' + (ol
			? '<ol start="' + (num ? ol + '">' : parseInt(ol,36) - 9 + '" style="list-style-type:' + (low ? 'low' : 'upp') + 'er-alpha">') + entry + '</ol>'
			: node('ul', entry))
		})
	}

	const stash = [];
	let si = 0;

	src = '\n' + src + '\n'
	replace(/</g, '&lt;')
	replace(/>/g, '&gt;')
	replace(/\t|\r|\uf8ff/g, '  ')

	// Blockquote
	src = blockquote(src)

	// Horizontal Rule
	replace(/^([*\-=_] *){3,}$/gm, '<hr>')

	// Lists
	src = list(src); replace(/<\/(ol|ul)>\n\n<\1>/g, '')

	// Code
	replace(/\n((```|~~~).*\n?([^]*?)\n?\2|((    .*?\n)+))/g, (_0, _1, _2, p3, p4) => {
		stash[--si] = node('pre', node('code', p3||p4.replace(/^    /gm, '')))
		return si + '\uf8ff'
	})

	// Link or Image
	replace(/((!?)\[(.*?)\]\((.*?)( ".*")?\)|\\([\\`*_{}\[\]()#+\-.!~]))/g, (_, _p1, p2, alt, src) => {
		stash[--si] = src
		? p2
		? `<img src="${src}" alt="${alt}">` : `<a href="${src}">${unEscape(inline(alt))}</a>`
		: '';
		return si + '\uf8ff'
	})

	// Table
	replace(/\n(( *\|.*?\| *\n)+)/g, (_, table) => {
		const sep = table.match(/^.*\n( *\|( *\:?-+\:?-+\:? *\|)* *\n|)/)[1];
		return '\n' + node('table',
			table.replace(/.*\n/g, (row, ri) => {
				return row === sep ? '' : node('tr', row.replace(/\||(.*?[^\\])\|/g, (_, cell, ci) =>
					ci ? node(sep && !ri ? 'th' : 'td', unEscape(inline(cell || ''))) : ''
				))
			})
		)
	})

	// Headings
	replace(/(?=^|>|\n)([>\s]*?)(#{1,6}) (.*?)( #*)? *(?=\n|$)/g, (_a, _, p1, p2) => _ + node('h' + p1.length, unEscape(inline(p2))))

	// Paragraph
	replace(/(?=^|>|\n)\s*\n+([^<]+?)\n+\s*(?=\n|<|$)/g, (_, content) => node('p', unEscape(inline(content))) )

	// Stash
	replace(/-\d+\uf8ff/g, all => stash[parseInt(all)] )

	return src.trim();
}