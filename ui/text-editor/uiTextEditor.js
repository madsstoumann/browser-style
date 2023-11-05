import { commands } from './commands.js';
export default function uiTextEditor(node, args) {
	const settings = Object.assign({
		editableClass: 'ui-editable',
		editableText: 'Type here...',
		htmlClass: '',
		htmlLabel: 'HTML',
		htmlToggle: true,
		inputTypes: 'deleteByContent,deleteByCut,deleteByDrag,deleteContentBackward,deleteContentForward,deleteEntireSoftLine,deleteHardLineBackward,deleteHardLineForward,deleteSoftLineBackward,deleteSoftLineForward,deleteWordBackward,deleteWordForward,formatBackColor,formatBold,formatFontColor,formatFontName,formatIndent,formatItalic,formatJustifyCenter,formatJustifyFull,formatJustifyLeft,formatJustifyRight,formatOutdent,formatRemove,formatSetBlockTextDirection,formatSetInlineTextDirection,formatStrikethrough,formatSubscript,formatSuperscript,formatUnderline,historyRedo,historyUndo,insertCompositionText,insertFromComposition,insertFromDrop,insertFromPaste,insertFromYank,insertHorizontalRule,insertLineBreak,insertLink,insertOrderedList,insertParagraph,insertReplacementText,insertText,insertTranspose,insertUnorderedList',
		toolbarClass: 'ui-toolbar',
		toolbarItems: 'h1,h2,h3,h4,h5,h6|bgc|fc,fn,fs|undo,redo|paste,copy,cut|indent,outdent|b,i,u,s|sub,sup|ol,ul,hr,img|left,center,right,justify|link,unlink|remove,html'
	}, (typeof args === 'object') ? args : node.dataset || {})

	const editable = document.createElement('div');
	editable.className = settings.editableClass;
	editable.contentEditable = true;
	editable.textContent = settings.editableText;

	const inputTypes = settings?.inputTypes.split(',') || [];
	const toolbarItems = settings?.toolbarItems.split('|') || [];

	const renderCommand = obj => 
		`<button type="button" id="${obj.id}" data-command="${
			obj.inputType ||obj.command}"${
			obj.prompt ? ` data-prompt="${obj.prompt}"` :''}${
			obj.value ? ` data-value="${obj.value}"` :''}>${
			obj.icon ? renderIcon(obj.icon) : ''}
		</button>`
	
	const renderIcon = (data) => `<svg viewBox="0 0 24 24" class="ui-icon">${data.split(',').map(path => `<path d="${path}"></path>`)}</svg>`
	const renderInput = obj => `<input type="${obj.inputType}" oninput="document.execCommand('${obj.command}', true, this.value)" data-sr>`
	const renderSelect = obj => `<select onchange="document.execCommand('${obj.command}', true, this.value)">${obj.options.split('|').map(option => `<option value="${option}">${option}</option>`)}</select>`
	//`<ul id="${obj.command}" popover anchor="${obj.id}">${obj.options.split('|').map(item => `<li>${item}</li>`).join('')}</ul>`

	if (toolbarItems.length) {

		const toolbar = document.createElement('nav');
		toolbar.className = settings.toolbarClass;
		node.append(toolbar)

		toolbar.innerHTML = toolbarItems.map((group) => `
		<fieldset>${group
			.split(",")
			.map(entry => {
				const obj = commands.find((item) => item.key === entry) || {}
				obj.id = crypto.randomUUID()
				return `${renderCommand(obj)}
				${obj.inputType ? renderInput(obj): ''}
				${obj.options ? renderSelect(obj) : ''}
					
					`
				
			}).join('')}
		</fieldset>`).join('')

		toolbar.addEventListener('click', e => {
			const node = e.target
			const data = node.dataset
				switch (data.command) {
					case 'html': {
						html.hidden = !html.hidden
						editable.contentEditable = html.hidden
						html.hidden ? editable.innerHTML = html.value : html.value = editable.innerHTML
					}
					break;
					case 'color': {
						if ("showPicker" in HTMLInputElement.prototype) {
							node.nextElementSibling.showPicker()
						}
					}
					break;
				default: {
					document.execCommand(data.command, true, data.prompt ? prompt(data.prompt) : data.value || null)
				}
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
	}
}