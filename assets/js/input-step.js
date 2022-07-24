/**
 * @function inputStep
 * @param {Node} input
 * @param {Object} [config] Config (default from `input.dataset `)
 * @description Adds `stepUp`, `stepDown` and optional `first` and `last`-buttons to numeric input
*/
export default function inputStep(input, config) {
	const add = (icon, title, click, insertAfter = true) => {
		const b = document.createElement('button');
		b.addEventListener('click', () => { isNaN(click) ? input[click]() : input.value = click; input.dispatchEvent(new Event('input')) });
		if (icon) b.dataset[icon.startsWith('--') ? 'maskIcon' : 'cssIcon'] = icon;
		b.innerHTML = '<i></i>';
		b.title = title;
		b.type = 'button';
		insertAfter ? input.after(b) : input.before(b);
	}

	if (config.first) add(config.firstIcon, config.first, input.min-0, false);
	if (config.last) add(config.lastIcon, config.last, input.max-0);
	if (config.trash) add(config.trashIcon, config.trash, 0);
	add(config.downIcon||'minus', config.down, 'stepDown', false);
	add(config.upIcon||'plus', config.up, 'stepUp');

	if (config.max) {
		const o = document.createElement('output');
		o.htmlFor = input.id;
		o.title = config.max;
		o.value = input.max;
		input.after(o);
	}
}