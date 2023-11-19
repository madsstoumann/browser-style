import { commands } from './commands.js';
export default function uiTextEditor(node, args) {
	const settings = Object.assign({
		editableClass: '',
		editableText: 'Type here...',
		htmlClass: '',
		htmlLabel: 'HTML',
		htmlToggle: false,
		inputTypes: 'formatBold,formatItalic,formatUnderline',
		toolbarClass: 'ui-toolbar',
		toolbarInactive: '--inactive',
		toolbarItemActive: '--active',
		toolbarItems: 'b,i,u'
	}, (typeof args === 'object') ? args : node.dataset || {})

	const editable = document.createElement('div');
	editable.className = settings.editableClass;
	editable.contentEditable = true;

	if (node.innerHTML.trim().length) {
		editable.innerHTML = node.innerHTML;
		node.innerHTML = '';
	}
	else {
		editable.textContent = settings.editableText;
	}

	const inputTypes = settings?.inputTypes.split(',') || [];
	const toolbarItems = settings?.toolbarItems.split('|') || [];
	const toolbar = document.createElement('form');

	const renderCommand = obj => 
		`<button type="button" name="${obj.key}"${
			obj.highlight ? ` data-command="${obj.command}"` :''}>${
			obj.icon ? renderIcon(obj.icon) : ''}
		</button>`
	
	const renderIcon = paths => `<svg viewBox="0 0 24 24" class="ui-icon">${paths.split(',').map(path => `<path d="${path}"></path>`)}</svg>`
	const renderInput = obj => obj.inputType ? `<input type="${obj.inputType}" oninput="document.execCommand('${obj.command}', true, this.value)" data-sr>`:''
	const renderSelect = obj => `<select onchange="document.execCommand('${obj.command}', true, this.value)">${
		obj.options.split('|').map(option => { const [label, value] = option.split(';');
		 return `<option value="${value}">${label}</option>`})
		}</select>`

	if (toolbarItems.length) {
		toolbar.className = settings.toolbarClass;
		node.append(toolbar)

		toolbar.innerHTML = toolbarItems.map((group) => `
		<fieldset>${group
			.split(",")
			.map(entry => {
				const obj = commands.find((item) => item.key === entry) || {}
				return obj.options ? renderSelect(obj) : renderCommand(obj) + renderInput(obj)
			}).join('')}
		</fieldset>`).join('')

		/* Highlight toolbar buttons, based on caret-position / selection */
		const highlight = commands.filter(command => command.highlight).map(command => command.command)
		const highlightToggle = (command, node) => {
			const isActive = document.queryCommandState(command)
			node.classList.toggle(settings.toolbarItemActive, isActive)
		}
		const highlightToolbar = () => {
			[...toolbar.elements].forEach(item => {
				if (highlight.includes(item.dataset.command)) {
					highlightToggle(item.dataset.command, item)
				}
			})
		}

		editable.addEventListener('click', () => highlightToolbar())
		editable.addEventListener('keydown', () => highlightToolbar())

		toolbar.addEventListener('click', e => {
			const node = e.target
			const rule = commands.find(item => item.key === node.name)
			if (!rule) return
			if (rule && rule.fn) {
				rule.fn(node)
			} else {
				document.execCommand(rule.command, true, null)
				highlightToggle(rule.command, node)
			}
		})
	}

	node.append(editable);
	editable.addEventListener('beforeinput', (event) => {
		if (!inputTypes.includes(event.inputType)) {
			event.preventDefault()
			return
		}
	})

	if (settings.htmlToggle) {
		const html = document.createElement('textarea');
		html.className = settings.htmlClass;
		html.hidden = true;
		node.append(html)

		html.addEventListener('input', () => {
			editable.innerHTML = html.value
		})

		const htmlToggle = toolbar?.elements?.html
		if (htmlToggle) {
			htmlToggle.addEventListener('click', () => {
				html.hidden = !html.hidden
				editable.contentEditable = html.hidden
				html.hidden ? editable.innerHTML = html.value : html.value = editable.innerHTML
				htmlToggle.classList.toggle(settings.toolbarItemActive, !html.hidden)
				toolbar.classList.toggle(settings.toolbarInactive, !html.hidden)
			})
		}
	}
}