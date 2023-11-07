export default function htmlToMarkdown(html) {
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, 'text/html');
	Object.keys(markdownMap).forEach(tag => {
		[...doc.body.getElementsByTagName(tag)].forEach(node => {
			node.innerHTML = markdownMap[tag](node)
		})
	})
	return doc.body.textContent.replace(/\t+/g, '').trim()
}

export function markdownToHTML(str) {
	// const replace = (match, p1, p2, p3, offset, string) => [p1, p2, p3].join(" - ");
	
	Object.keys(htmlMap).forEach(entry => {
		str = str.replaceAll(htmlMap[entry], `<${entry}>$1</${entry}>`)
	})
	console.log(str)
}

const markdownMap = {
	a: (node) => `[${node.innerHTML}](${node.href})`,
	b: (node) => `**${node.innerHTML}**`,
	blockquote: (node) => `> ${node.innerHTML.replace(/\r|\n/g, '\r\n> ')}\r\n`,
	br: () => `  \r\n`,
	code: (node) => `\`\`${node.innerHTML.replace(/\r|\n/g, '').replace(/^\s*(.*)\s*$/, '$1')}\`\``,
	del: (node) => `---${node.innerHTML}---`,
	h1: (node) => `# ${node.innerHTML}\r\n`,
	h2: (node) => `## ${node.innerHTML}\r\n`,
	h3: (node) => `### ${node.innerHTML}\r\n`,
	h4: (node) => `#### ${node.innerHTML}\r\n`,
	h5: (node) => `##### ${node.innerHTML}\r\n`,
	h6: (node) => `###### ${node.innerHTML}\r\n`,
	hr: () => `---\r\n`,
	i: (node) => `*${node.innerHTML}*`,
	img: (node) => `![alt text](${node.src})`,
	ol: (node) => node.children.map((li, index) => `${index}. ${li.innerHTML}\r\n`).join(''),
	p: (node) => `\r\n\r\n${node.innerHTML}\r\n\r\n`,
	pre: (node) => `\r\n${node.innerHTML}\r\n`,
	s: (node) => `---${node.innerHTML}---`,
	sub: (node) => `<sub>${node.innerHTML}</sub>`,
	sup: (node) => `<sup>${node.innerHTML}</sup>`,
	u: (node) => `__${node.innerHTML}__`,
	ul: (node) => node.children.map(li => ` - ${li.innerHTML}\r\n`).join('')
}

const htmlMap = {
	// p: /\r\n(.*)\r\n/gi,
	// a: '/\[(.*)\]\((.*)\)/',
	b: /\*\*(.*?)\*\*/gi,
	blockquote: /\n>(.*)/gi,
	br: /(  \n)/gi,
	code: /`(.*)`/gi,
	h6: /######\s(.*)/gi,
	h5: /#####\s(.*)/gi,
	h4: /####\s(.*)/gi,
	h3: /###\s(.*)/gi,
	h2: /##\s(.*)/gi,
	h1: /#\s(.*)/gi,
	hr: /---/gi,
	i: /\*(.*?)\*/gi,
	sub: /--(.*)--/gi,
	sup: /\^\^(.*)\^\^/gi,
	// img: '/!\[.*\]\((.*)\)/',
	// ol: '/(\d+)\.\s(.*)/',
	
	// pre: '/\n(.*)\n/',
	s: /\~\~(.*)\~\~/gi,
	// strong: '/\*\*(.*)\*\*/',
	// u: '/__(.*)__/',
	// ul: '/\-\s(.*)/',
}