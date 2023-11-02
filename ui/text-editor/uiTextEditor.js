import { commands } from './commands.js';
export default function uiTextEditor(node) {
	const editable = node.querySelector('[contenteditable]');
	const code = node.querySelector('textarea');
	const toolbar = node.querySelector('.ui-toolbar');
	const svgIcon = (data) => `<svg viewBox="0 0 24 24" class="ui-icon">${data.split(',').map(path => `<path d="${path}"></path>`)}</svg>`;

	toolbar.innerHTML = toolbar.dataset.commandList.split('|')
		.map((group) => `
		<fieldset>${group
			.split(",")
			.map(
				(command) => {
					const obj = commands.find((item) => item.name === command);
					return `<button type="button" data-command="${command}"${
						obj.prompt ? ` data-prompt="${obj.prompt}"` :''}${
						obj.value ? ` data-value="${obj.value}"` :''}>${
						obj.icon ? svgIcon(obj.icon) : ''}
					</button>`
				}).join('')}
		</fieldset>`).join('');

	toolbar.addEventListener('click', e => {
		const data = e.target.dataset
		if (data.command) {
			if (data.command === 'code') {
				code.hidden = !code.hidden
				editable.contentEditable = code.hidden
				code.hidden ? editable.innerHTML = code.value : code.value = editable.innerHTML
			}
			else {
				document.execCommand(data.command, true, data.prompt ? prompt(data.prompt) : data.value || null)
			}
		}
	})
}