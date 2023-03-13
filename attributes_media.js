export const MEDIA = {
	alt: {
		name: 'alt',
		required: true,
		type: 'text'
	},
	autoplay: {
		name: 'autoplay',
		type: 'checkbox',
		value: 'autoplay'
	},
	controls: {
		name: 'controls',
		type: 'checkbox',
		value: 'controls'
	},
	crossorigin: {
		name: 'crossorigin',
		type: 'select',
		values: [
			'anonymous',
			'use-credentials'
		]
	},
	decoding: {
		name: 'decoding',
		type: 'select',
		values: [
			'async',
			'auto',
			'sync'
		]
	},
	height: { 
		name: 'height',
		type: 'number'
	},
	ismap: {
		name: 'ismap',
		type: 'checkbox',
		value: 'ismap'
	},
	loading: {
		name: 'loading',
		type: 'select',
		values: [
			'eager',
			'lazy'
		]
	},
	loop: {
		name: 'loop',
		type: 'checkbox',
		value: 'loop'
	},
	muted: {
		name: 'muted',
		type: 'checkbox',
		value: 'muted'
	},
	preload: {
		name: 'preload',
		type: 'select',
		values: [
			'auto',
			'metadata',
			'none'
		]
	},
	referrerpolicy: {
		name: 'referrerpolicy',
		type: 'select',
		values: [
			'no-referrer-when-downgrade',
			'no-referrer',
			'origin-when-cross-origin',
			'origin',
			'same-origin',
			'strict-origin-when-cross-origin',
			'strict-origin',
			'unsafe-url'
		]
	},
	sandbox: {
		name: 'sandbox',
		type: 'select',
		values: [
			'allow-downloads-without-user-activation',
			'allow-downloads',
			'allow-forms',
			'allow-modals',
			'allow-orientation-lock',
			'allow-pointer-lock',
			'allow-popups',
			'allow-popups-to-escape-sandbox',
			'allow-presentation',
			'allow-same-origin',
			'allow-scripts',
			'allow-storage-access-by-user-activation',
			'allow-top-navigation',
			'allow-top-navigation-by-user-activation'
		]
	},
	sizes: {
		name: 'src',
		type: 'text'
	},
	src: {
		name: 'src',
		required: true,
		type: 'text'
	},
	srcdoc: {
		name: 'src',
		type: 'text'
	},
	srcset: {
		name: 'srcset',
		type: 'text'
	},
	usemap: {
		name: 'usemap',
		type: 'text'
	},
	width: { 
		name: 'width',
		type: 'number'
	}
}