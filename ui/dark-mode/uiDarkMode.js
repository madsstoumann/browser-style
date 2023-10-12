export default function uiDarkMode(node) {
	const colorScheme = localStorage.getItem('color-scheme') || 'auto'
	const input = node.querySelector(`[type=checkbox], [value="${colorScheme}"]`)

	document.body.style.colorScheme = colorScheme
	if (input.type === 'checkbox') {
		input.checked = colorScheme === 'dark'
	} else {
		input.checked = true
	}

	node.addEventListener('input', event => {
		const value = event.target.type ==='checkbox' ? event.target.checked ? 'dark' : 'light' : event.target.value
		localStorage.setItem('color-scheme', value)
		document.body.style.colorScheme = value
	})
}