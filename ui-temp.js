
/* https://developer.mozilla.org/en-US/docs/Web/HTML/Element */
/* https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input */
/* https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes */
/* OBJECT-To-HTML: https://gitlab.com/kuadrado-software/object-to-html-renderer#readme */



const UICONSTS = {
	cssprops: ['data-key', 'data-output', 'data-output-unit', 'data-scope', 'data-unit'],
	colors: ['primary', 'secondary', 'ternary'],
	sizes: ['small', 'medium', 'large']
}

const rangeSlider = {
	config: {
		color: 'secondary',
		label: 'Energy compsumtion',
		max: 100,
		min: 0,
		output: 'range-output-above-fill',
		outputUnit: '',
		showLabels: true,
		size: '',
		ticks: 'ticks',
		value: 50
	},
	group: 'form-elements',
	icon: 'range-slider',
	name: 'Range Slider',
	template: (data) => `
	<label data-bs="${data.size} ${data.color} ${data.showLabels?'range-labels':''} ${data.ticks}">
		<span ${data.output ? `data-bs="range-gap"`:''}>${data.label}</span>
		<input type="range" min="${data.min||0}" max="${data.max||100}" step="${data.step||1}" value="${data.value||50}" ${data.output ? `data-scope="next" data-output="next" data-output-unit="${data.outputUnit}"`:''}>
		${data.output ? `<span data-bs="${data.output}"></span>`:''}
	</label>`
}

const circularRange = {
	config: {
		color: UICONSTS.color,
		label: 'text',
		max: 'number',
		min: 'number',
		outputUnit: 'text',
		size: UICONSTS.sizes,
		value: 'number'
	},
	group: 'form-elements',
	icon: 'circle-range',
	name: 'Circular Range',
	template: (data) => `
	<label data-bs="${data.size} ${data.color} circular-range">
		<input type="range" min="${data.min}" max="${data.max}" value="${data.value}" data-scope="parent" data-output="next" data-output-unit="${data.outputUnit}">
		<strong data-bs="range-output-attr" data-output-value>${data.label}</strong>
		<span data-bs="range-output"></span>
	</label>`
}

const colorCompare = {
	config: {
		aspectRatio: 'widescreen',
		leftColor: '#EC7322',
		leftLabel: 'First color',
		rightColor: '#9285D6',
		rightLabel: 'Second color',
		imageAlt: 'Image of a car',
		imageSrc: '/demo/colors-base.webp',
		label: 'Slide to compare two colors against an image',
		value: 50
	},
	template: (data) => `
	<fieldset data-bs="color-compare" style="--_mask:url(${data.imageSrc});" data-ratio="${data.aspectRatio}">
		<label aria-label="${data.leftLabel}"><input type="color" value="${data.leftColor}" data-scope="fieldset" data-key="_c1"></label>
		<label aria-label="${data.rightLabel}"><input type="color" value="${data.rightColor}" data-scope="fieldset" data-key="_c2"></label>
		<img src="${data.imageSrc}" alt="${data.imageAlt}" loading="lazy" decoding="async">
		<div></div>
		<label aria-label="${data.label}">
			<input type="range" value="${data.value}" data-scope="fieldset" data-key="v1">
		</label>
	</fieldset>`
}

const labelInput = {
	config : {
		attributes: [
			{ autocomplete: 'off' },
			{ list: 'searchlist' },
			{ minlength: 3 },
			{ spellcheck: false },
			{ type: 'search' },
		],
		icon: '',
		iconPosition: '',
		label: 'Search this'
	},
	template: (data) => `
	<label>
		${data.label}
		<input ${data.icon ? `data-icon="${data.icon} ${data.iconPosition}"`:''}${data.attributes.map(attr => attribute(attr)).join('')}>
	</label>`
}



/*
COLOR: primary. secondary, ternary
SIZE: small, large
*/

// app.innerHTML = circularRange.template(circularRange.config)
// app.innerHTML = rangeSlider.template(rangeSlider.config)
// app.innerHTML = colorCompare.template(colorCompare.config)

// app.innerHTML = labelInput.template(labelInput.config)

// function attribute(obj) {
// 	const [key, value] = Object.entries(obj)[0];
// 	return value === key ? key : `${key}="${value}"`;
// }


// console.log(renderTag(TAGS.inputNumber));
// console.log(TAGS.inputNumber.attributes)
// app.innerHTML = configTag(TAGS.inputNumber);
