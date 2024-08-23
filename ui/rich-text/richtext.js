/**
 * RichText
 * Rich Text Editor
 * @author Mads Stoumann
 * @version 1.0.03
 * @summary 17-06-2024
 * @class
 * @extends {HTMLElement}
 */
export class RichText extends HTMLElement {
	static observedAttributes = ['plaintext'];
	constructor() {
		super();
		this.contentID = `cnt${this.uuid()}`;
		this.inputTypes = this.getAttribute('input-types')?.split(',') || ['deleteByContent', 'deleteByCut', 'deleteByDrag', 'deleteContentBackward', 'deleteContentForward', 'deleteEntireSoftLine', 'deleteHardLineBackward', 'deleteHardLineForward', 'deleteSoftLineBackward', 'deleteSoftLineForward', 'deleteWordBackward', 'deleteWordForward', 'formatBackColor', 'formatBold', 'formatFontColor', 'formatFontName', 'formatIndent', 'formatItalic', 'formatJustifyCenter', 'formatJustifyFull', 'formatJustifyLeft', 'formatJustifyRight', 'formatOutdent', 'formatRemove', 'formatSetBlockTextDirection', 'formatSetInlineTextDirection', 'formatStrikethrough', 'formatSubscript', 'formatSuperscript', 'formatUnderline', 'historyRedo', 'historyUndo', 'insertCompositionText', 'insertFromComposition', 'insertFromDrop', 'insertFromPaste', 'insertFromYank', 'insertHorizontalRule', 'insertLineBreak', 'insertLink', 'insertOrderedList', 'insertParagraph', 'insertReplacementText', 'insertText', 'insertTranspose', 'insertUnorderedList'];
		this.toolbarItems = this.getAttribute('toolbar')?.split('|') || [];
		this.plaintextItems = this.getAttribute('plaintext-toolbar')?.split(',') || [];
		this.customToolbarItems = [];
	}

	connectedCallback() {
		const shadow = this.attachShadow({ mode: 'open' })
		shadow.adoptedStyleSheets = [stylesheet];
		shadow.innerHTML = this.renderTemplate();

		this.innerHTML = `
		<div contenteditable="true" style="outline:none;">${this.innerHTML}</div>
		<input type="hidden" name="${this.getAttribute('name')||'richtext'}" value="${this.innerHTML}">`;
		this.content = this.querySelector('[contenteditable]');
		this.content.id = this.contentID;
		this.input = this.querySelector('input[type=hidden]');
		this.content.addEventListener('beforeinput', this.handleBeforeInput.bind(this));
		this.content.addEventListener('click', () => this.highlightToolbar());
		this.content.addEventListener('input', () => { 
			this.input.value = this.plaintext ? this.content.textContent : this.content.innerHTML;
			this.dispatchEvent(new CustomEvent("richtext-content", {
				detail: {
					content: this.plaintext ? this.content.textContent : this.content.innerHTML
				},
			})
		)});
		this.content.addEventListener('keydown', () => this.highlightToolbar());
		
		this.customToolbar = shadow.querySelector(`[part=custom]`);
		this.highlight = this.commands.filter(command => command.highlight).map(command => command.command);
		this.htmlcode = shadow.querySelector(`[name=htmlcode]`);
		this.plaintext = false;
		this.toggle = shadow.querySelector(`[name=html]`);
		if (this.toggle) this.toggle.addEventListener('click', this.toggleHTML.bind(this));
		this.toolbar = shadow.querySelector(`[part=toolbar]`);
		this.toolbar.addEventListener('click', this.handleToolbarClick.bind(this));
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (!newValue || oldValue === newValue) return;
		if (name === 'plaintext') {
			this.plaintext = newValue === 'true';
			this.content.setAttribute('contenteditable', this.plaintext ? 'plaintext-only' : 'true');
			this.filterToolbar(this.plaintext)
		}
	}

	addCustomCommand(customCommand) {
		if (!this.commands.some(command => command.key === customCommand.key)) {
			this.commands.push(customCommand);
			this.customToolbarItems.push(customCommand.key);
			this.customToolbar.innerHTML = this.customToolbarItems.map((entry) => this.renderToolbarItem(entry)).join('');
		} else {
			console.error(`Command with key ${customCommand.key} already exists.`);
		}
	}

	filterToolbar() {
		[...this.toolbar.elements].forEach(item => {
			item.hidden = (this.plaintext && !this.plaintextItems.includes(item.name));
			if (!item.hidden && item.parentNode.tagName === 'FIELDSET') item.parentNode.hidden = false;
		});
	}

	handleBeforeInput(event) {
		if (!this.inputTypes.includes(event.inputType)) {
			event.preventDefault();
		}
	}

	handleToolbarClick(e) {
		const node = e.target;
		const rule = this.commands.find((item) => item.key === node.name);
		if (!rule) return;
		if (rule.fn) {
			rule.fn(node);
		} else {
			document.execCommand(rule.command, true, null);
			this.highlightToggle(rule.command, node);
		}
	}

	highlightToggle = (command, node) => {
		const isActive = document.queryCommandState(command);
		node.classList.toggle('--active', isActive);
	}

	highlightToolbar = () => {
		[...this.toolbar.elements].forEach(item => {
			if (this.highlight.includes(item.dataset.command)) {
				this.highlightToggle(item.dataset.command, item);
			}
		})
	}

	renderCommand(obj) {
		return `<button type="button" name="${obj.key}"${obj.title ? ` title="${obj.title}"` : ''}${obj.highlight ? ` data-command="${obj.command}"` : ''}>${obj.icon ? this.renderIcon(obj.icon) : ''}</button>`;
	}

	renderIcon(paths) {
		return `<svg viewBox="0 0 24 24">${paths.split(',').map((path) => `<path d="${path}"></path>`).join('')}</svg>`;
	}

	renderInput(obj) {
		return obj.inputType ? `<input type="${obj.inputType}" oninput="document.execCommand('${obj.command}', true, this.value)" data-sr>` : '';
	}

	renderSelect(obj) {
		return `<select onchange="document.execCommand('${obj.command}', true, this.value)">${obj.options.split('|').map((option) => {
			const [label, value] = option.split(';');
			return `<option value="${value}">${label}</option>`;
		}).join('')}</select>`;
	}

	// renderSkipToolbar() {
	// 	return `<a href="#${this.contentID}" part="skip">${this.getAttribute('skip-toolbar')||'Skip to content'}</a>`;
	// }

	renderSkipToolbar() {
		return `<button type="button" part="skip" onclick="document.getElementById('${this.contentID}').focus()">${this.getAttribute('skip-toolbar') || 'Skip to content'}</button>`;
	}
	

	renderTemplate() {
		return `<fieldset part="toolbar">${this.renderSkipToolbar()}${this.renderToolbar()}<fieldset part="custom"></fieldset></fieldset><slot></slot><textarea name="htmlcode" hidden></textarea>`;
	}

	renderToolbar() {
		return this.toolbarItems.map((group) => `<fieldset>${group.split(',').map((entry) => this.renderToolbarItem(entry)).join('')}</fieldset>`).join('');
	}

	renderToolbarItem(entry) {
		const obj = this.commands.find((item) => item.key === entry) || {};
		return obj.options ? this.renderSelect(obj) : this.renderCommand(obj) + this.renderInput(obj);
	}

	setContent(content, plaintextOnly = false) {
		const stripTags = (input) => input.replace(/<[^>]*>/g, '');
		this.setAttribute('plaintext', plaintextOnly);
		this.content[plaintextOnly ? 'textContent' : 'innerHTML'] = plaintextOnly ? stripTags(content) : content;
	}

	toggleHTML() {
		this.htmlcode.hidden = !this.htmlcode.hidden;
		this.content.contentEditable = this.htmlcode.hidden;

		[...this.toolbar.elements].forEach(item => {
			if (item.tagName !== 'FIELDSET' && item.name !== 'html') { 
				item.disabled = !this.htmlcode.hidden;
			}
		});

		if (this.htmlcode.hidden) {
			this.content.innerHTML = this.htmlcode.value;
			this.content.dispatchEvent(new Event('input'));
		} else {
			this.htmlcode.value = this.content.innerHTML;
		}
	}

	uuid() {
		return crypto.getRandomValues(new Uint32Array(1))[0] || Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
	}

	/* === DEFAULT COMMANDS === */
	commands = [
		{
			command: 'backColor',
			icon: `M12 21a9 9 0 0 1 0 -18c4.97 0 9 3.582 9 8c0 1.06 -.474 2.078 -1.318 2.828c-.844 .75 -1.989 1.172 -3.182 1.172h-2.5a2 2 0 0 0 -1 3.75a1.3 1.3 0 0 1 -1 2.25,M8.5 10.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0,M12.5 7.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0,M16.5 10.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0`,
			inputType: 'color',
			key: 'bgc',
			fn: (node) => {
				if ("showPicker" in HTMLInputElement.prototype) {
					node.nextElementSibling.showPicker()
				}
			},
			title: 'Background Color'
		},
		{
			command: 'bold',
			highlight: true,
			icon: `M7 5h6a3.5 3.5 0 0 1 0 7h-6z,M13 12h1a3.5 3.5 0 0 1 0 7h-7v-7`,
			key: 'b',
			title: 'Bold'
		},
		{
			command: 'copy',
			icon: `M8 8m0 2a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2z,M16 8v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2`,
			key: 'copy',
			title: 'Copy'
		},
		{
			key: 'link',
			icon: `M9 15l6 -6,M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464,M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463`,
			fn: () => {
				const url = prompt('Enter a link URL:', 'https://')
				if (url) document.execCommand('createLink', false, url)
			},
			title: 'Insert Link'
		},
		{
			command: 'cut',
			icon: `M6 7m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0,M6 17m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0,M8.6 8.6l10.4 10.4,M8.6 15.4l10.4 -10.4`,
			key: 'cut',
			title: 'Cut'
		},
		{
			command: 'fontName',
			options: 'Font Name;unset|Times;serif|Arial;sans-serif|Monopsace;monospace|Cursive;cursive',
			key: 'fn',
			title: 'Font Name'
		},
		{
			command: 'fontSize',
			options: 'Size;unset|xx-small;1|x-small;2|small;3|medium;4|large;5|x-large;6|xx-large;7',
			key: 'fs',
			title: 'Font Size'
		},
		{
			command: 'foreColor',
			icon: `M9 15v-7a3 3 0 0 1 6 0v7,M9 11h6,M5 19h14`,
			inputType: 'color',
			key: 'fc',
			fn: (node) => {
				if ("showPicker" in HTMLInputElement.prototype) {
					node.nextElementSibling.showPicker()
				}
			},
			title: 'Font Color'
		},
		{
			key: 'blockquote',
			icon: `M6 15h15,M21 19h-15,M15 11h6,M21 7h-6,M9 9h1a1 1 0 1 1 -1 1v-2.5a2 2 0 0 1 2 -2,M3 9h1a1 1 0 1 1 -1 1v-2.5a2 2 0 0 1 2 -2`,
			fn: () => document.execCommand('formatBlock', false, 'BLOCKQUOTE'),
			title: 'Blockquote'
		},
		{
			key: 'h1',
			icon: `M19 18v-8l-2 2,M4 6v12,M12 6v12,M11 18h2,M3 18h2,M4 12h8,M3 6h2,M11 6h2`,
			fn: () => document.execCommand('formatBlock', false, 'H1'),
			title: 'Heading 1'
		},
		{
			key: 'h2',
			icon: `M17 12a2 2 0 1 1 4 0c0 .591 -.417 1.318 -.816 1.858l-3.184 4.143l4 0,M4 6v12,M12 6v12,M11 18h2,M3 18h2,M4 12h8,M3 6h2,M11 6h2`,
			fn: () => document.execCommand('formatBlock', false, 'H2'),
			title: 'Heading 2'
		},
		{
			key: 'h3',
			icon: `M19 14a2 2 0 1 0 -2 -2,M17 16a2 2 0 1 0 2 -2,M4 6v12,M12 6v12,M11 18h2,M3 18h2,M4 12h8,M3 6h2,M11 6h2`,
			fn: () => document.execCommand('formatBlock', false, 'H3'),
			title: 'Heading 3'
		},
		{
			key: 'h4',
			icon: `M20 18v-8l-4 6h5,M4 6v12,M12 6v12,M11 18h2,M3 18h2,M4 12h8,M3 6h2,M11 6h2`,
			fn: () => document.execCommand('formatBlock', false, 'H4'),
			title: 'Heading 4'
		},
		{
			key: 'h5',
			icon: `M17 18h2a2 2 0 1 0 0 -4h-2v-4h4",M4 6v12",M12 6v12",M11 18h2",M3 18h2",M4 12h8",M3 6h2",M11 6h2`,
			fn: () => document.execCommand('formatBlock', false, 'H5'),
			title: 'Heading 5'
		},
		{
			key: 'h6',
			icon: `M19 14a2 2 0 1 0 0 4a2 2 0 0 0 0 -4z",M21 12a2 2 0 1 0 -4 0v4",M4 6v12",M12 6v12",M11 18h2",M3 18h2",M4 12h8",M3 6h2",M11 6h2`,
			fn: () => document.execCommand('formatBlock', false, 'H6'),
			title: 'Heading 6'
		},
		{
			key: 'html',
			icon: `M7 8l-4 4l4 4,M17 8l4 4l-4 4,M14 4l-4 16`,
			title: 'Toggle HTML',
		},
		{
			command: 'indent',
			icon: `M20 6l-11 0,M20 12l-7 0",M20 18l-11 0,M4 8l4 4l-4 4`,
			key: 'indent',
			title: 'Indent'
		},
		{
			command: 'insertHorizontalRule',
			icon: `M7 12l10 0`,
			key: 'hr',
			title: 'Horizontal Rule'
		},
		{
			key: 'img',
			icon: `M15 8h.01,M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12z,M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5,M14 14l1 -1c.928 -.893 2.072 -.893 3 0l3 3`,
			fn: () => {
				const url = prompt('Enter an image URL:')
				if (url) document.execCommand('insertHTML', false, `<img src="${url}" alt="image" loading="lazy">`)
			},
			title: 'Insert Image'
		},
		{
			command: 'insertOrderedList',
			highlight: true,
			icon: `M11 6h9,M11 12h9,M12 18h8,M4 16a2 2 0 1 1 4 0c0 .591 -.5 1 -1 1.5l-3 2.5h4,M6 10v-6l-2 2`,
			key: 'ol',
			title: 'Ordered List'
		},
		{
			command: 'insertUnorderedList',
			highlight: true,
			icon: `M9 6l11 0,M9 12l11 0,M9 18l11 0,M5 6l0 .01,M5 12l0 .01,M5 18l0 .01`,
			key: 'ul',
			title: 'Unordered List'
		},
		{
			command: 'italic',
			highlight: true,
			icon: `M11 5l6 0,M7 19l6 0,M14 5l-4 14`,
			key: 'i',
			title: 'Italic'
		},
		{
			command: 'justifyCenter',
			highlight: true,
			icon: `M4 6l16 0,M8 12l8 0,M6 18l12 0`,
			key: 'center',
			title: 'Center'
		},
		{
			command: 'justifyFull',
			highlight: true,
			icon: `M4 6l16 0,M4 12l16 0,M4 18l12 0`,
			key: 'justify',
			title: 'Justify'
		},
		{
			command: 'justifyLeft',
			highlight: true,
			icon: `M4 6l16 0,M4 12l10 0,M4 18l14 0`,
			key: 'left',
			title: 'Left'
		},
		{
			command: 'justifyRight',
			highlight: true,
			icon: `M4 6l16 0,M10 12l10 0,M6 18l14 0`,
			key: 'right',
			title: 'Right'
		},
		{
			command: 'outdent',
			icon: `M20 6l-7 0,M20 12l-9 0,M20 18l-7 0,M8 8l-4 4l4 4`,
			key: 'outdent',
			title: 'Outdent'
		},
		{
			command: 'paste',
			icon: `M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2,M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z`,
			key: 'paste',
			title: 'Paste'
		},
		{
			command: 'redo',
			icon: `M15 14l4 -4l-4 -4,M19 10h-11a4 4 0 1 0 0 8h1`,
			key: 'redo',
			title: 'Redo'
		},
		{
			command: 'removeFormat',
			icon: `M17 15l4 4m0 -4l-4 4,M7 6v-1h11v1,M7 19l4 0,M13 5l-4 14`,
			key: 'remove',
			title: 'Remove Formatting'
		},
		{
			command: 'save',
			icon: `M6 4h10l4 4v10a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2,M12 14m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0,M14 4l0 4l-6 0l0 -4`,
			key: 'save',
			fn: () => {
				this,this.dispatchEvent(new CustomEvent("richtext-save", {
					detail: {
						content: this.plaintext ? this.content.textContent : this.content.innerHTML
					}
				}));
			},
		},
		{
			command: 'strikeThrough',
			highlight: true,
			icon: `M5 12l14 0,M16 6.5a4 2 0 0 0 -4 -1.5h-1a3.5 3.5 0 0 0 0 7h2a3.5 3.5 0 0 1 0 7h-1.5a4 2 0 0 1 -4 -1.5`,
			key: 's',
			title: 'Strike Through'
		},
		{
			command: 'subscript',
			highlight: true,
			icon: `M5 7l8 10m-8 0l8 -10,M21 20h-4l3.5 -4a1.73 1.73 0 0 0 -3.5 -2`,
			key: 'sub',
			title: 'Subscript'
		},
		{
			command: 'superscript',
			highlight: true,
			icon: `M5 7l8 10m-8 0l8 -10,M21 11h-4l3.5 -4a1.73 1.73 0 0 0 -3.5 -2`,
			key: 'sup',
			title: 'Superscript'
		},
		{
			command: 'underline',
			highlight: true,
			icon: `M7 5v5a5 5 0 0 0 10 0v-5,M5 19h14`,
			key: 'u',
			title: 'Underline'
		},
		{
			command: 'unlink',
			icon: `M17 22v-2,M9 15l6 -6,M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464,M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463,M20 17h2,M2 7h2,M7 2v2`,
			key: 'unlink',
			title: 'Remove Link'
		},
		{
			command: 'undo',
			icon: `M9 14l-4 -4l4 -4,M5 10h11a4 4 0 1 1 0 8h-1`,
			key: 'undo',
			title: 'Undo'
		}
	]
}

/* === STYLES === */

const stylesheet = new CSSStyleSheet()
stylesheet.replaceSync(`
[hidden] { display: none; }
:host *, :host *::after, :host *::before { box-sizing: border-box; }
:host {
	--richtext-active-bg: var(--Highlight);
	--richtext-active-c: inherit;
	background: Canvas;
	color: CanvasText;
	color-scheme: inherit;
}
:host::part(skip) {
	background: color-mix(in oklab, #FF0 60%, Canvas);
	border: 1px solid CanvasText;
	font-size: smaller;
	height: auto;
	inset-block: -100vh auto;
	inset-inline: -100vw auto;
	padding: 1ch;
	position: absolute;
	text-decoration: underline;
	text-wrap: pretty;
	width: auto;
}
:host::part(skip):focus { 
	inset-block-start: 0;
	inset-inline-start: 0;
}
:host::part(toolbar) {
	align-items: center;
	flex-wrap: wrap;
	gap: .5em;
	position: relative;
}
button {
	all: unset;
	border: 1px solid color-mix(in srgb, Canvas, CanvasText 30%);
	display: inline-grid;
	height: 1.5em;
	place-content: center;
	width: 1.5em;
	&:not(:last-of-type) { border-inline-end-width: 0; }
	&:first-of-type { border-radius: .1875em 0 0 .1875em; }
	&:last-of-type { border-radius: 0 .1875em .1875em 0; }
	&:only-of-type { border-radius: .1875em; }
}
fieldset {
	all: unset;
	display: flex;
	& > *:only-child { border-radius: .1875em; }
	& fieldset > *:is(:focus-visible, :hover) {
		background: var(--richtext-active-bg);
		color: var(--richtext-active-c);
	}
	&:empty { display: none; }
}
select {
	border: 1px solid GrayText;
	border-radius: .1875em;
	font-size: .75em;
	height: 2em;
	padding: .125em .25em;
}
svg {
	fill: none;
	height: 1.5em;
	padding: 0.125em;
	pointer-events: none;
	stroke: currentColor;
	stroke-width: 1.25;
	width: 1.5em;
}
textarea {	
	color-scheme: dark;
	field-sizing: content;
	font-family: monospace, monospace;
	font-size: small;
	max-block-size: 25dvh;
	resize: vertical;
	width: 100%;
}
[data-sr] {
	border: 0;
	clip: rect(0 0 0 0);
	clip-path: inset(50%);
	height: 1px;
	overflow: clip;
	position: absolute;
	white-space: nowrap;
	width: 1px;
}
.--active {
	background: var(--richtext-active-bg);
	color: var(--richtext-active-c);
}
[disabled] {
	color: GrayText;
	pointer-events: none;
}
`)
customElements.define('rich-text', RichText);