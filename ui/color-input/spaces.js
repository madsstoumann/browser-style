export const spaces = {
	hsl: {
		h: { min: 0, max: 360, step: 1, value: 0, label: 'H' },
		s: { min: 0, max: 100, step: 1, value: 100, label: 'S', suffix: '%' },
		l: { min: 0, max: 100, step: 1, value: 50, label: 'L', suffix: '%' },
		alpha: { min: 0, max: 1, step: 0.01, value: 1, label: 'Alpha', prefix: '/ ' }
	},
	hwb: {
		h: { min: 0, max: 360, step: 1, value: 0, label: 'H' },
		w: { min: 0, max: 100, step: 1, value: 0, label: 'W', suffix: '%' },
		b: { min: 0, max: 100, step: 1, value: 0, label: 'B', suffix: '%' },
		alpha: { min: 0, max: 1, step: 0.01, value: 1, label: 'Alpha', prefix: '/ ' }
	},
	rgb: {
		spaces: [
			'hex',
			'rgb',
			{ name: 'srgb-linear', format: 'color' },
			{ name: 'display-p3', format: 'color' },
			{ name: 'a98-rgb', format: 'color' },
			{ name: 'prophoto-rgb', format: 'color' },
			{ name: 'rec2020', format: 'color' }
		],
		r: { min: 0, max: 100, step: 0.1, value: 0, label: 'R', suffix: '%' },
		g: { min: 0, max: 100, step: 0.1, value: 0, label: 'G', suffix: '%' },
		b: { min: 0, max: 100, step: 0.1, value: 0, label: 'B', suffix: '%' },
		alpha: { min: 0, max: 1, step: 0.01, value: 1, label: 'Alpha', prefix: '/ ' }
	},
	lab: {
		l: { min: 0, max: 100, step: 1, value: 50, label: 'L' },
		a: { min: -125, max: 125, step: 1, value: 0, label: 'a' },
		b: { min: -125, max: 125, step: 1, value: 0, label: 'b' },
		alpha: { min: 0, max: 1, step: 0.01, value: 1, label: 'Alpha', prefix: '/ ' }
	},
	oklab: {
		l: { min: 0, max: 1, step: 0.01, value: 0.5, label: 'L' },
		a: { min: -0.4, max: 0.4, step: 0.01, value: 0, label: 'a' },
		b: { min: -0.4, max: 0.4, step: 0.01, value: 0, label: 'b' },
		alpha: { min: 0, max: 1, step: 0.01, value: 1, label: 'Alpha', prefix: '/ ' }
	},
	lch: {
		l: { min: 0, max: 100, step: 1, value: 50, label: 'L' },
		c: { min: 0, max: 150, step: 1, value: 0, label: 'C' },
		h: { min: 0, max: 360, step: 1, value: 0, label: 'H' },
		alpha: { min: 0, max: 1, step: 0.01, value: 1, label: 'Alpha', prefix: '/ ' }
	},
	oklch: {
		l: { min: 0, max: 1, step: 0.01, value: 0.5, label: 'L' },
		c: { min: 0, max: 0.4, step: 0.01, value: 0, label: 'C' },
		h: { min: 0, max: 360, step: 1, value: 0, label: 'H' },
		alpha: { min: 0, max: 1, step: 0.01, value: 1, label: 'Alpha', prefix: '/ ' }
	},
	xyz: {
		format: 'color',
		spaces: ['xyz', 'xyz-d50', 'xyz-d65'],
		x: { min: 0, max: 1, step: 0.01, value: 0, label: 'X' },
		y: { min: 0, max: 1, step: 0.01, value: 0, label: 'Y' },
		z: { min: 0, max: 1, step: 0.01, value: 0, label: 'Z' },
		alpha: { min: 0, max: 1, step: 0.01, value: 1, label: 'Alpha', prefix: '/ ' }
	}
};