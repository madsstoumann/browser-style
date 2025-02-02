import { FormElement } from '../../common/form.element.js';
import { commands } from './commands.js';

/**
 * RichText
 * Rich Text Editor
 * @author Mads Stoumann
 * @version 1.0.10
 * @summary 10-01-2025
 * @class RichText
 * @extends {FormElement}
 */
export class RichText extends FormElement {

	get basePath() {
		return new URL('.', import.meta.url).href;
	}

	constructor() {
		super();
	}

	initializeComponent() {
		this.commands = commands.map(command => {
			if (command.fn) {
				const origFn = command.fn;
				command.fn = (...args) => origFn.apply(this, args);
			}
			return command;
		});

		this.contentID = `cnt${this.uuid()}`;
		this.customToolbarItems = [];
		this.eventMode = this.getAttribute('event-mode') || 'both';
		this.inputTypes = this.getAttribute('input-types')?.split(',') || ['deleteByContent', 'deleteByCut', 'deleteByDrag', 'deleteContentBackward', 'deleteContentForward', 'deleteEntireSoftLine', 'deleteHardLineBackward', 'deleteHardLineForward', 'deleteSoftLineBackward', 'deleteSoftLineForward', 'deleteWordBackward', 'deleteWordForward', 'formatBackColor', 'formatBold', 'formatFontColor', 'formatFontName', 'formatIndent', 'formatItalic', 'formatJustifyCenter', 'formatJustifyFull', 'formatJustifyLeft', 'formatJustifyRight', 'formatOutdent', 'formatRemove', 'formatSetBlockTextDirection', 'formatSetInlineTextDirection', 'formatStrikethrough', 'formatSubscript', 'formatSuperscript', 'formatUnderline', 'historyRedo', 'historyUndo', 'insertCompositionText', 'insertFromComposition', 'insertFromDrop', 'insertFromPaste', 'insertFromYank', 'insertHorizontalRule', 'insertLineBreak', 'insertLink', 'insertOrderedList', 'insertParagraph', 'insertReplacementText', 'insertText', 'insertTranspose', 'insertUnorderedList'];
		this.toolbarItems = this.getAttribute('toolbar')?.split('|') || ['b,i,u'];
		this.plaintext = this.hasAttribute('plaintext') || false;

		this.initialValue = this.plaintext ? this.textContent : this.innerHTML;
		this.root.innerHTML = this.template();

		if (this.isFormElement) super.value = this.initialValue;

		this.addRefs();
		this.addEvents();
	}

	addEvents() {
		this.addEventListener('rt:clear', () => this.resetContent(true));
		this.addEventListener('rt:reset', () => this.resetContent(false));
		this.content.addEventListener('beforeinput', this.handleBeforeInput.bind(this));
		this.content.addEventListener('click', () => this.highlightToolbar());
		this.content.addEventListener('input', (e) => {
			if (!this.isFormElement) e.stopPropagation();
			const content = this.plaintext ? this.content.textContent : this.content.innerHTML;
			if (this.isFormElement) super.value = content;
			this.dispatchEvent(new CustomEvent("rt:content", { detail: { content } }));
		});
		this.content.addEventListener('keydown', () => this.highlightToolbar());
		if (this.toggle) this.toggle.addEventListener('click', this.toggleHTML.bind(this));
		this.toolbar.addEventListener('click', this.handleToolbarClick.bind(this));
	}

	addRefs() {
		this.content = this.root.querySelector('[contenteditable]');
		this.customToolbar = this.root.querySelector(`[part=custom]`);
		this.htmlcode = this.root.querySelector(`[name=htmlcode]`);
		this.toggle = this.root.querySelector(`[name=html]`);
		this.toolbar = this.root.querySelector(`[part=toolbar]`);
		this.highlight = this.commands.filter(command => command.highlight).map(command => command.command);
	}

	formReset() {
		super.value = this.initialValue;
		this.setContent(this.initialValue, this.plaintext);
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
		return `<button type="button" name="${obj.key}"${obj.title ? ` title="${obj.title}"` : ''}${obj.highlight ? ` data-command="${obj.command}"` : ''}>${obj.icon ? this.icon(obj.icon, 'svg') : ''}</button>`;
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

	renderSkipToolbar() {
		return `<button type="button" part="skip" onclick="document.getElementById('${this.contentID}').focus()">${this.getAttribute('skip-toolbar') || 'Skip to content'}</button>`;
	}

	renderToolbar() {
		return this.toolbarItems.map((group) => `<fieldset>${group.split(',').map((entry) => this.renderToolbarItem(entry)).join('')}</fieldset>`).join('');
	}

	renderToolbarItem(entry) {
		const obj = this.commands.find((item) => item.key === entry) || {};
		return obj.options ? this.renderSelect(obj) : this.renderCommand(obj) + this.renderInput(obj);
	}

	resetContent(clear = false) {
		const content = clear ? '' : this.defaultValue;
		this.setContent(content, this.plaintext);
		if (this.isFormElement) {
			super.value = this.plaintext ? this.content.textContent : this.content.innerHTML;
		}
	}

	setContent(content, plaintextOnly = false) {
		const stripTags = (input) => input.replace(/<[^>]*>/g, '');
		this.setAttribute('plaintext', plaintextOnly);
		this.content[plaintextOnly ? 'textContent' : 'innerHTML'] = plaintextOnly ? stripTags(content) : content;
	}

	template() {
		return `
		<fieldset part="toolbar">
			${this.renderSkipToolbar()}
			${this.renderToolbar()}
			<fieldset part="custom"></fieldset>
		</fieldset>
		<textarea name="htmlcode" hidden part="html"></textarea>
		<div contenteditable="${this.plaintext ? 'plaintext-only': ''}" style="outline:none;" part="content">${this.initialValue}</div>`;
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
}

RichText.register();