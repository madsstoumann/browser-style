blockquote: (node) => `\r\n> ${node.innerHTML.replace(/\r|\n/g, '\r\n> ')}\r\n`,
code: (node) => `\`${node.innerHTML.replace(/\r|\n/g, '').replace(/^\s*(.*)\s*$/, '$1')}\``,