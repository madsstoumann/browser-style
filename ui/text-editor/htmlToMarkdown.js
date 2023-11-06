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