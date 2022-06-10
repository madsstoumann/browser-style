jsIndeterminate.indeterminate = true;

// const clickOutside = (node) => document.addEventListener('click', (event) => event.target.contains(node));

document.querySelectorAll('select[is="custom"]').forEach(select => select.addEventListener('pointerdown', (event) => {
	const node = event.target;
	if (node.tagName === 'OPTION') {
		// event.target.setAttribute('selected', 'selected')
		select.value = node.value;
		select.removeAttribute('size');
	}
	else {
		select.size = 3
	}
}))