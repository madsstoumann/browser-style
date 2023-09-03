export default function uiPasswordToggle(node) {
	const input = node.querySelector('[type=password]');
	const toggle = node.querySelector('[type=checkbox]');
	toggle.addEventListener('change', () => {
		input.type = toggle.checked ? 'text' : 'password';
	});
}