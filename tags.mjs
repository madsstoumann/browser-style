import { FORM } from '/attributes_form.js';
import { MEDIA } from '/attributes_media.js';

export const TAGS = {
	a: {
		attributes: [
			{
				name: 'download',
				type: 'text'
			},
			{
				name: 'href',
				type: 'text'
			},
			MEDIA.referrerpolicy,
			FORM.target,
		],
		group: 'inline-text-semantics',
		icon: 'link',
		name: 'The Anchor element',
		tag: 'a'
	},
	abbr: {
		attributes: [],
		group: 'inline-text-semantics', 
		icon: 'abc',
		name: 'The Abbreviation element',
		tag: 'abbr'
	},
	address: {
		attributes: [],
		group: 'sectioning-content',
		icon: 'map',
		name: 'The Contact Address element',
		tag: 'address'
	},
	article: {
		attributes: [],
		group: 'sectioning-content',
		icon: 'article',
		name: 'The Article Contents element',
		tag: 'article'
	},
	aside: {
		attributes: [],
		group: 'sectioning-content',
		icon: 'layout-sidebar',
		name: 'The Aside element',
		tag: 'aside'
	},
	audio: {
		attributes: [
			MEDIA.autoplay,
			MEDIA.controls,
			MEDIA.loop,
			MEDIA.muted,
			MEDIA.crossorigin,
			MEDIA.preload,
			MEDIA.src
		],
		group: 'image-multimedia',
		icon: 'music',
		name: 'The Embed Audio element',
		tag: 'audio'
	},
	b: {
		attributes: [],
		group: 'inline-text-semantics',
		icon: 'bold',
		name: 'The Bring Attention To element',
		tag: 'b'
	},
	blockquote: {
		attributes: [
			{
				name: 'cite',
				type: 'text'
			}
		],
		group: 'text-content',
		icon: 'blockquote',
		name: 'The Block Quotation element',
		tag: 'blockquote'
	},
	button: {
		attributes: [
			FORM.disabled,
			FORM.formnovalidate,
			FORM.form,
			FORM.formaction,
			FORM.formenctype,
			FORM.formmethod,
			FORM.formtarget,
			FORM.name,
			FORM.value,
			{
				name: 'type',
				type: 'select',
				values: [
					'button',
					'reset',
					'submit'
				]
			}
		],
		group: 'form-elements',
		icon: 'button',
		name: 'The Button element',
		tag: 'button'
	},
	cite: {
		attributes: [],
		group: 'inline-text-semantics',
		icon: 'quote',
		name: 'The Citation element',
		tag: 'cite'
	},
	code: {
		attributes: [],
		group: 'inline-text-semantics',
		icon: 'code',
		name: 'The Inline Code element',
		tag: 'code'
	},
	data: {
		attributes: [
			FORM.value
		],
		group: 'inline-text-semantics',
		icon: 'database',
		name: 'The Data element',
		tag: 'data'
	},
	datalist: {
		attributes: [],
		group: 'form-elements',
		icon: 'file-stack',
		name: 'The HTML Data List element',
		tag: 'datalist'
	},
	del: {
		attributes: [
			{
				name: 'cite',
				type: 'text'
			},
			{
				name: 'datetime',
				type: 'text'
			}
		],
		group: 'demarcating-edits',
		icon: 'backspace',
		name: 'The Deleted Text element',
		tag: 'del'
	},
	details: {
		attributes: [
			{
				name: 'open',
				type: 'checkbox',
				value: 'open'
			}
		],
		group: 'interactive-elements',
		icon: 'layout-navbar-expand',
		name: 'The Details disclosure element',
		tag: 'details'
	},
	dfn: {
		attributes: [],
		group: 'inline-text-semantics',
		icon: 'input-search',
		name: 'The Definition element',
		tag: 'dfn'
	},
	dialog: {
		attributes: [
			{
				name: 'open',
				type: 'checkbox',
				value: 'open'
			}
		],
		group: 'interactive-elements',
		icon: 'app-window',
		name: 'The Dialog element',
		tag: 'dialog'
	},
	div: {
		attributes: [],
		group: 'text-content',
		icon: 'separator',
		name: 'The Content Division element',
		tag: 'div'
	},
	dl: {
		attributes: [],
		group: 'text-content',
		icon: 'list-search',
		name: 'The Description List element',
		tag: 'dl'
	},
	em: {
		attributes: [],
		group: 'inline-text-semantics',
		icon: 'italic',
		name: 'The Emphasis element',
		tag: 'em'
	},
	fieldset: {
		attributes: [
			FORM.disabled,
			FORM.form,
			FORM.name
		],
		group: 'form-elements',
		icon: 'layout-list',
		name: 'The Field Set element',
		tag: 'fieldset'
	},
	figcaption: {
		attributes: [],
		group: 'text-content',
		icon: 'caption',
		name: 'The Figure Caption element',
		tag: 'figcaption'
	},
	figure: {
		attributes: [],
		group: 'text-content',
		icon: 'layout-collage',
		name: 'The Figure with Optional Caption element',
		tag: 'figure'
	},
	footer: {
		attributes: [],
		group: 'sectioning-content',
		icon: 'layout-bottombar',
		name: 'The Footer Element',
		tag: 'footer'
	},
	form: {
		attributes: [
			FORM.novalidate,
			FORM.acceptCharset,
			FORM.autocomplete,
			FORM.name,
			FORM.rel,
			FORM.action,
			FORM.enctype,
			FORM.method,
			FORM.target
		],
		group: 'form-elements',
		icon: 'forms',
		name: 'The Form Element'
	},
	h1: {
		attributes: [],
		group: 'sectioning-content',
		icon: 'h-1',
		name: 'The HTML Section Heading elements',
		tag: 'h1'
	},
	h2: {
		attributes: [],
		group: 'sectioning-content',
		icon: 'h-2',
		name: 'The HTML Section Heading elements',
		tag: 'h2'
	},
	h3: {
		attributes: [],
		group: 'sectioning-content',
		icon: 'h-3',
		name: 'The HTML Section Heading elements',
		tag: 'h3'
	},
	h4: {
		attributes: [],
		group: 'sectioning-content',
		icon: 'h-4',
		name: 'The HTML Section Heading elements',
		tag: 'h4'
	},
	h5: {
		attributes: [],
		group: 'sectioning-content',
		icon: 'h-5',
		name: 'The HTML Section Heading elements',
		tag: 'h5'
	},
	h6: {
		attributes: [],
		group: 'sectioning-content',
		icon: 'h-6',
		name: 'The HTML Section Heading elements',
		tag: 'h6'
	},
	header: {
		attributes: [],
		group: 'sectioning-content',
		icon: 'layout-navbar',
		name: 'The Header Element',
		tag: 'header'
	},
	hr: {
		attributes: [],
		group: 'text-content',
		icon: 'minus',
		name: 'The Thematic Break (Horizontal Rule) element',
		tag: 'hr'
	},
	i: {
		attributes: [],
		group: 'inline-text-semantics',
		icon: 'italic',
		name: 'The Idiomatic Text element',
		tag: 'i'
	},
	iframe: {
		attributes: [
			{
				name: 'allow',
				type: 'text'
			},
			MEDIA.height,
			MEDIA.loading,
			MEDIA.referrerpolicy,
			FORM.name,
			MEDIA.sandbox,
			MEDIA.src,
			MEDIA.srcdoc,
			MEDIA.width
		],
		group: 'embedded-content',
		icon: 'frame',
		name: 'The Inline Frame element',
		tag: 'iframe'
	},
	img: {
		attributes: [
			MEDIA.ismap,
			MEDIA.alt,
			MEDIA.crossorigin,
			MEDIA.decoding,
			MEDIA.height,
			MEDIA.loading,
			MEDIA.referrerpolicy,
			MEDIA.sizes,
			MEDIA.src,
			MEDIA.srcset,
			MEDIA.usemap,
			MEDIA.width
		],
		group: 'image-multimedia',
		icon: 'photo',
		name: 'The Image Embed element',
		tag: 'img'
	},
	inputCheckbox: {
		attributes: [
			FORM.checked,
			FORM.disabled,
			FORM.required,
			FORM.form,
			FORM.name,
			FORM.value,
			{
				name: 'type',
				type: 'hidden',
				value: 'checkbox'
			}
		],
		group: 'form-elements',
		icon: 'checkbox',
		name: 'Checkbox',
		tag: 'input'
	},
	inputColor: {
		attributes: [
			FORM.autocomplete,
			FORM.disabled,
			FORM.form,
			FORM.list,
			FORM.name,
			FORM.value,
			{
				name: 'type',
				type: 'hidden',
				value: 'color'
			}
		],
		group: 'form-elements',
		icon: 'palette',
		name: 'Color',
		tag: 'input'
	},
	inputDate: {
		attributes: [
			FORM.disabled,
			FORM.readonly,
			FORM.required,
			FORM.autocomplete,
			FORM.form,
			FORM.list,
			FORM.name,
			{
				name: 'min',
				placeholder: 'yyyy-mm-dd',
				type: 'text'
			},
			{
				name: 'max',
				placeholder: 'yyyy-mm-dd',
				type: 'text'
			},
			FORM.step,
			FORM.value,
			{
				name: 'type',
				type: 'hidden',
				value: 'date'
			}
		],
		group: 'form-elements',
		icon: 'calendar',
		name: 'Date',
		tag: 'input'
	},
	inputDateTimeLocal: {
		attributes: [
			FORM.disabled,
			FORM.readonly,
			FORM.required,
			FORM.autocomplete,
			FORM.form,
			FORM.list,
			FORM.name,
			{
				name: 'min',
				placeholder: 'yyyy-mm-ddThh:mm',
				type: 'text'
			},
			{
				name: 'max',
				placeholder: 'yyyy-mm-ddThh:mm',
				type: 'text'
			},
			FORM.step,
			FORM.value,
			{
				name: 'type',
				type: 'hidden',
				value: 'datetimelocal'
			}
		],
		group: 'form-elements',
		icon: 'calendar-time',
		name: 'Date Time Local',
		tag: 'input'
	},
	inputEmail: {
		attributes: [
			FORM.disabled,
			FORM.multiple,
			FORM.readonly,
			FORM.required,
			FORM.autocomplete,
			FORM.form,
			FORM.list,
			FORM.maxlength,
			FORM.minlength,
			FORM.name,
			FORM.pattern,
			FORM.placeholder,
			FORM.size,
			FORM.value,
			{
				name: 'type',
				type: 'hidden',
				value: 'email'
			}
		],
		group: 'form-elements',
		icon: 'mail',
		name: 'Email',
		tag: 'input'
	},
	inputFile: { 
		attributes: [
			FORM.disabled,
			FORM.multiple,
			FORM.readonly,
			FORM.required,
			FORM.accept,
			FORM.autocomplete,
			FORM.capture,
			FORM.form,
			FORM.name,
			FORM.value,
			{
				name: 'type',
				type: 'hidden',
				value: 'file'
			}
		],
		group: 'form-elements',
		icon: 'file-upload',
		name: 'File Upload',
		tag: 'input'
	},
	inputHidden: {
		attributes: [
			{
				name: 'type',
				type: 'hidden',
				value: 'hidden'
			}
		],
		group: 'form-elements',
		icon: 'eye-off',
		name: 'Hidden',
		tag: 'input'
	},
	inputImage: {
		attributes: [
			FORM.disabled,
			FORM.formnovalidate,
			MEDIA.alt,
			FORM.autocomplete,
			FORM.form,
			FORM.formaction,
			FORM.formenctype,
			FORM.formmethod,
			FORM.formtarget,
			MEDIA.height,
			FORM.list,
			FORM.name,
			MEDIA.src,
			FORM.value,
			MEDIA.width,
			{
				name: 'type',
				type: 'hidden',
				value: 'image'
			}
		],
		group: 'form-elements',
		icon: 'photo',
		name: 'Form Image',
		tag: 'input'
	},
	inputMonth: {
		attributes: [
			FORM.disabled,
			FORM.readonly,
			FORM.required,
			FORM.autocomplete,
			FORM.form,
			FORM.list,
			FORM.name,
			{
				name: 'min',
				placeholder: 'yyyy-mm',
				type: 'text'
			},
			{
				name: 'max',
				placeholder: 'yyyy-mm',
				type: 'text'
			},
			FORM.step,
			FORM.value,
			{
				name: 'type',
				type: 'hidden',
				value: 'month'
			}
		],
		group: 'form-elements',
		icon: 'calendar-event',
		name: 'Month',
		tag: 'input'
	},
	inputNumber: {
		attributes: [
			FORM.disabled,
			FORM.readonly,
			FORM.required,
			FORM.autocomplete,
			FORM.form,
			FORM.list,
			FORM.name,
			FORM.placeholder,
			{
				name: 'min',
				type: 'number'
			},
			{
				name: 'max',
				type: 'number'
			},
			FORM.step,
			FORM.value,
			{
				name: 'type',
				type: 'hidden',
				value: 'number'
			}
		],
		group: 'form-elements',
		icon: 'sort-0-9',
		name: 'Number',
		tag: 'input'
	},
	inputPassword: {
		attributes: [
			FORM.disabled,
			FORM.readonly,
			FORM.required,
			FORM.autocomplete,
			FORM.form,
			FORM.maxlength,
			FORM.minlength,
			FORM.name,
			FORM.pattern,
			FORM.placeholder,
			FORM.value,
			{
				name: 'type',
				type: 'hidden',
				value: 'password'
			}
		],
		group: 'form-elements',
		icon: 'password',
		name: 'Password',
		tag: 'input'
	},
	inputRadio: {
		attributes: [
			FORM.checked,
			FORM.disabled,
			FORM.required,
			FORM.form,
			FORM.name,
			FORM.value,
			{
				name: 'type',
				type: 'hidden',
				value: 'radio'
			}
		],
		group: 'form-elements',
		icon: 'circle-dot',
		name: 'Radio-button',
		tag: 'input'
	},
	inputRange: {
		attributes: [
			FORM.disabled,
			FORM.autocomplete,
			FORM.form,
			FORM.list,
			FORM.name,
			{
				name: 'min',
				type: 'number'
			},
			{
				name: 'max',
				type: 'number'
			},
			FORM.step,
			FORM.value,
			{
				name: 'type',
				type: 'hidden',
				value: 'range'
			}
		],
		group: 'form-elements',
		icon: 'adjustments-horizontal',
		name: 'Range Slider',
		tag: 'input'
	},
	inputReset: {
		attributes: [
			FORM.disabled,
			FORM.form,
			FORM.formtarget,
			FORM.name,
			FORM.value,
			{
				name: 'type',
				type: 'hidden',
				value: 'reset'
			}
		],
		group: 'form-elements',
		icon: 'reset',
		name: 'Reset',
		tag: 'input'
	},
	inputSearch: {
		attributes: [
			FORM.disabled,
			FORM.readonly,
			FORM.required,
			FORM.autocomplete,
			FORM.dirname,
			FORM.form,
			FORM.list,
			FORM.maxlength,
			FORM.minlength,
			FORM.name,
			FORM.pattern,
			FORM.placeholder,
			FORM.size,
			FORM.value,
			{
				name: 'type',
				type: 'hidden',
				value: 'search'
			}
		],
		group: 'form-elements',
		icon: 'search',
		name: 'Search',
		tag: 'input'
	},
	inputSubmit: {
		attributes: [
			FORM.disabled,
			FORM.formnovalidate,
			FORM.form,
			FORM.formaction,
			FORM.formenctype,
			FORM.formmethod,
			FORM.formtarget,
			FORM.name,
			FORM.value,
			{
				name: 'type',
				type: 'hidden',
				value: 'submit'
			}
		],
		group: 'form-elements',
		icon: 'button',
		name: 'Submit',
		tag: 'input'
	},
	inputTel: {
		attributes: [
			FORM.disabled,
			FORM.readonly,
			FORM.required,
			FORM.autocomplete,
			FORM.form,
			FORM.list,
			FORM.maxlength,
			FORM.minlength,
			FORM.name,
			FORM.pattern,
			FORM.placeholder,
			FORM.size,
			FORM.value,
			{
				name: 'type',
				type: 'hidden',
				value: 'tel'
			}
		],
		group: 'form-elements',
		icon: 'phone',
		name: 'Telephone',
		tag: 'input'
	},
	inputText: {
		attributes: [
			FORM.disabled,
			FORM.readonly,
			FORM.required,
			FORM.autocomplete,
			FORM.dirname,
			FORM.form,
			FORM.list,
			FORM.maxlength,
			FORM.minlength,
			FORM.name,
			FORM.pattern,
			FORM.placeholder,
			FORM.size,
			FORM.value,
			{
				name: 'type',
				type: 'hidden',
				value: 'text'
			}
		],
		group: 'form-elements',
		icon: 'align-left',
		name: 'Text',
		tag: 'input'
	},
	inputTime: {
		attributes: [
			FORM.disabled,
			FORM.readonly,
			FORM.required,
			FORM.autocomplete,
			FORM.form,
			FORM.list,
			FORM.name,
			{
				name: 'min',
				placeholder: 'hh:mm',
				type: 'text'
			},
			{
				name: 'max',
				placeholder: 'hh:mm',
				type: 'text'
			},
			FORM.step,
			FORM.value,
			{
				name: 'type',
				type: 'hidden',
				value: 'time'
			}
		],
		group: 'form-elements',
		icon: 'clock',
		name: 'Time',
		tag: 'input'
	},
	inputUrl: {
		attributes: [
			FORM.disabled,
			FORM.readonly,
			FORM.required,
			FORM.autocomplete,
			FORM.form,
			FORM.list,
			FORM.maxlength,
			FORM.minlength,
			FORM.name,
			FORM.pattern,
			FORM.placeholder,
			FORM.size,
			FORM.value,
			{
				name: 'type',
				type: 'hidden',
				value: 'url'
			}
		],
		group: 'form-elements',
		icon: 'link',
		name: 'URL',
		tag: 'input'
	},
	inputWeek: {
		attributes: [
			FORM.disabled,
			FORM.readonly,
			FORM.required,
			FORM.autocomplete,
			FORM.form,
			FORM.list,
			FORM.name,
			{
				name: 'min',
				placeholder: 'yyyy-W##',
				type: 'text'
			},
			{
				name: 'max',
				placeholder: 'yyyy-W##',
				type: 'text'
			},
			FORM.step,
			FORM.value,
			{
				name: 'type',
				type: 'hidden',
				value: 'week'
			}
		],
		group: 'form-elements',
		icon: 'calendar-event',
		name: 'Week',
		
		tag: 'input',
		type: 'week'
	},
	ins: {
		attributes: [
			{
				name: 'cite',
				type: 'text'
			},
			{
				name: 'datetime',
				type: 'text'
			}
		],
		group: 'demarcating-edits',
		icon: 'column-insert-left',
		name: 'The Inserted Text element',
		tag: 'ins'
	},
	kbd: {
		attributes: [],
		group: 'inline-text-semantics',
		icon: 'keyboard',
		name: 'The Keyboard Input element',
		tag: 'kbd'
	},
	label: {
		attributes: [
			{
				name: 'for',
				type: 'text'
			}
		],
		group: 'form-elements',
		icon: 'heading',
		name: 'The Input Label element',
		tag: 'label'
	},
	legend: {
		attributes: [],
		group: 'form-elements',
		icon: 'heading',
		name: 'The Field Set Legend element',
		tag: 'legend'
	},
	main: {
		attributes: [],
		group: 'sectioning-content',
		icon: 'section',
		name: 'The Main Element',
		tag: 'main'
	},
	mark: {
		attributes: [],
		group: 'inline-text-semantics',
		icon: 'highlight',
		name: 'The Mark Text element',
		tag: 'mark'
	},
	menu: {
		attributes: [],
		group: 'text-content',
		icon: 'menu',
		name: 'The Menu element',
		tag: 'menu'
	},
	meter: {
		attributes: [
			FORM.value,
			{
				name: 'min',
				type: 'number'
			},
			{
				name: 'max',
				type: 'number'
			},
			{
				name: 'low',
				type: 'number'
			},
			{
				name: 'high',
				type: 'number'
			},
			{
				name: 'optimum',
				type: 'number'
			}
		],
		group: 'form-elements',
		icon: '',
		name: 'The HTML Meter element',
		tag: 'meter'
	},
	nav: {
		attributes: [],
		group: 'sectioning-content',
		icon: 'menu',
		name: 'The Menu element',
		tag: 'nav'
	},
	object: {
		attributes: [
			{
				name: 'data',
				type: 'text'
			},
			FORM.form,
			MEDIA.height,
			FORM.name,
			FORM.type,
			MEDIA.usemap,
			MEDIA.width
		],
		group: 'embedded-content',
		icon: 'code-asterix',
		name: 'The External Object element'
	},
	ol: {
		attributes: [
			{
				name: 'reversed',
				type: 'checkbox',
				value: 'reversed'
			},
			{
				name: 'start',
				type: 'select',
				values: [
					'a', 'A', 'i', 'I', 'l'
				]
			}
		],
		group: 'text-content',
		icon: 'list-numbers',
		name: 'The Ordered List element',
		tag: 'ol'
	},
	p: {
		attributes: [],
		group: 'text-content',
		icon: 'paragraph',
		name: 'The Paragraph element',
		tag: 'p'
	},
	picture: {
		attributes: [],
		group: 'embedded-content',
		icon: 'photo',
		name: 'The Picture element',
		tag: 'picture'
	},
	portal: {
		attributes: [
			MEDIA.referrerpolicy,
			MEDIA.src
		],
		group: 'embedded-content',
		icon: 'frame',
		name: 'The Portal element',
		tag: 'portal'
	},
	pre: {
		attributes: [],
		group: 'text-content',
		icon: 'txt',
		name: 'The Preformatted Text element',
		tag: 'pre'
	},
	progress: {
		attributes: [
			{
				name: 'max',
				type: 'number'
			},
			FORM.value
		],
		group: 'form-elements',
		icon: 'progress',
		name: 'The Progress Indicator element',
		tag: 'progress'
	},
	q: {
		attributes: [
			{
				name: 'cite',
				type: 'text'
			}
		],
		group: 'inline-text-semantics',
		icon: 'quote',
		name: 'The Inline Quotation element',
		tag: 'q'
	},
	s: {
		attributes: [],
		group: 'inline-text-semantics',
		icon: 'strikethrough',
		name: 'The Strikethrough element',
		tag: 's'
	},
	samp: {
		attributes: [],
		group: 'inline-text-semantics',
		icon: 'keyboard',
		name: 'The Sample Output element',
		tag: 'samp'
	},
	section: {
		attributes: [],
		group: 'sectioning-content',
		icon: 'section',
		name: 'he Generic Section element',
		tag: 'section'
	},
	select: {
		attributes: [
			FORM.disabled,
			FORM.multiple,
			FORM.readonly,
			FORM.required,
			FORM.autocomplete,
			FORM.form,
			FORM.name,
			FORM.size
		],
		group: 'form-elements',
		icon: 'select',
		name: 'The HTML Select element',
		tag: 'select'
	},
	small: {
		attributes: [],
		group: 'inline-text-semantics',
		icon: 'text-decrease',
		name: 'The side comment element',
		tag: 'small'
	},
	span: {
		attributes: [],
		group: 'inline-text-semantics',
		icon: '',
		name: 'The Content Span element',
		tag: 'span'
	},
	strong: {
		attributes: [],
		group: 'inline-text-semantics',
		icon: 'bold',
		name: 'The Strong Importance element',
		tag: 'strong'
	},
	sub: {
		attributes: [],
		group: 'inline-text-semantics',
		icon: 'subscript',
		name: 'The Subscript element',
		tag: 'sub'
	},
	sup: {
		attributes: [],
		group: 'inline-text-semantics',
		icon: 'superscript',
		name: 'The Superscript element',
		tag: 'sup'
	},
	table: {
		attributes: [],
		group: 'table-content',
		icon: 'table',
		name: '',
		tag: 'table'
	},
	time: {
		attributes: [
			{
				name: 'datetime',
				type: 'text'
			}
		],
		group: 'inline-text-semantics',
		icon: 'calendar-time',
		name: 'The (Date) Time element',
		tag: 'time'
	},
	textarea: {
		attributes: [
			FORM.disabled,
			FORM.readonly,
			FORM.required,
			FORM.autocomplete,
			{
				name: 'cols',
				type: 'number'
			},
			FORM.form,
			FORM.maxlength,
			FORM.minlength,
			FORM.name,
			FORM.placeholder,
			{
				name: 'rows',
				type: 'number'
			},
			{
				name: 'spellcheck',
				type: 'select',
				values: [
					'default',
					'false',
					'true'
				]
			},
			{
				name: 'wrap',
				type: 'select',
				values: [
					'hard',
					'off',
					'soft'
				]
			}
		],
		group: 'form-elements',
		icon: 'text-plus',
		name: 'The Textarea element',
		tag: 'textarea'
	},
	u: {
		attributes: [],
		group: 'inline-text-semantics',
		icon: 'underline',
		name: 'The Unarticulated Annotation (Underline) element',
		tag: 'u'
	},
	ul: {
		attributes: [],
		group: 'text-content',
		icon: 'list',
		name: 'The Unordered List element',
		tag: 'ul'
	},
	var: {
		attributes: [],
		group: 'inline-text-semantics',
		icon: 'variable',
		name: 'The Variable element',
		tag: 'var'
	},
	video: {
		attributes: [
			MEDIA.autoplay,
			MEDIA.controls,
			MEDIA.loop,
			MEDIA.muted,
			{
				name: 'playsinline',
				type: 'checkbox',
				value: 'playsinline'
			},
			MEDIA.crossorigin,
			MEDIA.height,
			{
				name: 'poster',
				type: 'text'
			},
			MEDIA.preload,
			MEDIA.src,
			MEDIA.width
		],
		group: 'image-multimedia',
		icon: 'video',
		name: 'The Video Embed element',
		tag: 'video'
	},
	wbr: {
		attributes: [],
		group: 'inline-text-semantics',
		icon: 'arrow-wave-right',
		name: 'The Line Break Opportunity element',
		tag: 'wbr'
	}
}