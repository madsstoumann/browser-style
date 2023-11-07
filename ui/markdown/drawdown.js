/**
* drawdown.js
* (c) Adam Leggett
*/
export function markdownToHTML(src) {
const rx = {
	lt: /</g,
	gt: />/g,
	space: /\t|\r|\uf8ff/g,
	escape: /\\([\\\|`*_{}\[\]()#+\-~])/g,
	
	listjoin: /<\/(ol|ul)>\n\n<\1>/g,
	inline: /(^|[^A-Za-z\d\\])(([*_])|(~)|(\^)|(--)|(\+\+)|`)(\2?)([^<]*?)\2\8(?!\2)(?=\W|_|$)/g,
	code: /\n((```|~~~).*\n?([^]*?)\n?\2|((    .*?\n)+))/g,
	
	table: /\n(( *\|.*?\| *\n)+)/g,
	thead: /^.*\n( *\|( *\:?-+\:?-+\:? *\|)* *\n|)/,
	row: /.*\n/g,
	cell: /\||(.*?[^\\])\|/g,
	heading: /(?=^|>|\n)([>\s]*?)(#{1,6}) (.*?)( #*)? *(?=\n|$)/g,
	para: /(?=^|>|\n)\s*\n+([^<]+?)\n+\s*(?=\n|<|$)/g,
	stash: /-\d+\uf8ff/g
}

const blockquote = (src) => src.replace(/\n *&gt; *([^]*?)(?=(\n|$){2})/g, (_, content) => node('blockquote', blockquote(inline(content.replace(/^ *&gt; */gm, '')))));
const node = (tag, content) => `<${tag}>${content}</${tag}>`
const replace = (rx, fn) => src = src.replace(rx, fn)
const unEscape = (str) => str.replace(rx.escape, '$1')

function inline(src) {
	return src.replace(rx.inline, function(all, _, p1, emp, sub, sup, small, big, p2, content) {
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
	return src.replace(/\n( *)(?:[*\-+]|((\d+)|([a-z])|[A-Z])[.)]) +([^]*?)(?=(\n|$){2})/g, function(_, ind, ol, num, low, content) {
		const entry = node('li', inline(content.split(RegExp('\n ?' + ind + '(?:(?:\\d+|[a-zA-Z])[.)]|[*\\-+]) +', 'g')).map(list).join('</li><li>')))
		return '\n' + (ol
		? '<ol start="' + (num ? ol + '">' : parseInt(ol,36) - 9 + '" style="list-style-type:' + (low ? 'low' : 'upp') + 'er-alpha">') + entry + '</ol>'
		: node('ul', entry))
	})
}


	let stash = [];
	let si = 0;

	src = '\n' + src + '\n';

	replace(rx.lt, '&lt;');
	replace(rx.gt, '&gt;');
	replace(rx.space, '  ');

	// blockquote
	src = blockquote(src);

	
	replace(/^([*\-=_] *){3,}$/gm, '<hr>');

	src = list(src); replace(/<\/(ol|ul)>\n\n<\1>/g, '');

	// code
	replace(rx.code, function(_0, _1, _2, p3, p4) {
		stash[--si] = node('pre', node('code', p3||p4.replace(/^    /gm, '')))
		return si + '\uf8ff'
	})

	// link or image
	replace(/((!?)\[(.*?)\]\((.*?)( ".*")?\)|\\([\\`*_{}\[\]()#+\-.!~]))/g, function(_, _p1, p2, alt, src) {
		stash[--si] = src
		? p2
		? `<img src="${src}" alt="${alt}">` : `<a href="${src}">${unEscape(inline(alt))}</a>`
		: '';
		return si + '\uf8ff'
	})

	// table
	replace(rx.table, function(_, table) {
		const sep = table.match(rx.thead)[1];
		return '\n' + node('table',
			table.replace(rx.row, function(row, ri) {
				return row === sep ? '' : node('tr', row.replace(rx.cell, (_, cell, ci) =>
					ci ? node(sep && !ri ? 'th' : 'td', unEscape(inline(cell || ''))) : ''
				))
			})
		)
	})

	// Headings
	replace(rx.heading, (_a, _, p1, p2) => _ + node('h' + p1.length, unEscape(inline(p2))))
	// Paragraph
	replace(rx.para, (_, content) => node('p', unEscape(inline(content))) )
	// stash
	// replace(rx.stash, (all) => stash[parseInt(all)] )

	return src.trim();
};