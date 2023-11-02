export const commands = [
	{
		name: 'backColor',
		icon: `M12 21a9 9 0 0 1 0 -18c4.97 0 9 3.582 9 8c0 1.06 -.474 2.078 -1.318 2.828c-.844 .75 -1.989 1.172 -3.182 1.172h-2.5a2 2 0 0 0 -1 3.75a1.3 1.3 0 0 1 -1 2.25,M8.5 10.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0,M12.5 7.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0,M16.5 10.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0`
	},
	{
		name: 'bold',
		icon: `M7 5h6a3.5 3.5 0 0 1 0 7h-6z,M13 12h1a3.5 3.5 0 0 1 0 7h-7v-7`
	},
	{
		name: 'code',
		icon: `M7 8l-4 4l4 4,M17 8l4 4l-4 4,M14 4l-4 16`
	},
	{
		name: 'createLink',
		icon: `M9 15l6 -6,M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464,M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463`,
		prompt: 'Enter a URL:',
	},
	{
		name: 'fontName',
		options: 'serif|sans-serif|monospace|cursive|fantasy'
	},
	{
		name: 'fontSize',
		options: '1|2|3|4|5|6|7'
	},
	{
		name: 'foreColor',
		icon: `M9 15v-7a3 3 0 0 1 6 0v7,M9 11h6,M5 19h14`
	},
	{
		name: 'insertHorizontalRule',
		icon: `M7 12l10 0`
	},
	{
		name: 'insertImage',
		icon: `M15 8h.01,M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12z,M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5,M14 14l1 -1c.928 -.893 2.072 -.893 3 0l3 3`,
		prompt: 'Enter an image URL:'
	},
	{
		name: 'insertOrderedList',
		icon: `M11 6h9,M11 12h9,M12 18h8,M4 16a2 2 0 1 1 4 0c0 .591 -.5 1 -1 1.5l-3 2.5h4,M6 10v-6l-2 2`
	},
	{
		name: 'insertUnorderedList',
		icon: `M9 6l11 0,M9 12l11 0,M9 18l11 0,M5 6l0 .01,M5 12l0 .01,M5 18l0 .01`
	},
	{
		name: 'italic',
		icon: `M11 5l6 0,M7 19l6 0,M14 5l-4 14`
	},
	{
		name: 'justifyCenter',
		icon: `M4 6l16 0,M8 12l8 0,M6 18l12 0`
	},
	{
		name: 'justifyFull',
		icon: `M4 6l16 0,M4 12l16 0,M4 18l12 0`
	},
	{
		name: 'justifyLeft',
		icon: `M4 6l16 0,M4 12l10 0,M4 18l14 0`
	},
	{
		name: 'justifyRight',
		icon: `M4 6l16 0,M10 12l10 0,M6 18l14 0`
	},
	{
		name: 'removeFormat',
		icon: `M17 15l4 4m0 -4l-4 4,M7 6v-1h11v1,M7 19l4 0,M13 5l-4 14`
	},
	{
		name: 'strikeThrough',
		icon: `M5 12l14 0,M16 6.5a4 2 0 0 0 -4 -1.5h-1a3.5 3.5 0 0 0 0 7h2a3.5 3.5 0 0 1 0 7h-1.5a4 2 0 0 1 -4 -1.5`
	},
	{
		name: 'subscript',
		icon: `M5 7l8 10m-8 0l8 -10,M21 20h-4l3.5 -4a1.73 1.73 0 0 0 -3.5 -2`
	},
	{
		name: 'superscript',
		icon: `M5 7l8 10m-8 0l8 -10,M21 11h-4l3.5 -4a1.73 1.73 0 0 0 -3.5 -2`
	},
	{
		name: 'underline',
		icon: `M7 5v5a5 5 0 0 0 10 0v-5,M5 19h14`
	}
]