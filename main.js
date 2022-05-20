// dialogOpen.addEventListener('click', () => dialog.open = true);

const inputs = document.querySelectorAll('[data-scope], [data-unit]');
inputs.forEach(input => { input.addEventListener('input', () => setCustomProperty(input)); input.dispatchEvent(new Event('input')); });

function setCustomProperty(input) {
	const scope = input.dataset.scope;
	const node = !scope ? document.documentElement : scope === 'self' ? input : scope === 'parent' ? input.parentNode : document.querySelector(scope);
	node.style.setProperty('--' + input.name, input.value + (input.dataset.unit || ''));
}