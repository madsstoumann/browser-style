export default function uiTableResize(node, minWidth = 5) {
	const table = node.querySelector('table')
	if (!table) return

	const cols = table.querySelectorAll('thead th')
	const tableWidth = table.offsetWidth
	let value = 0
	node.style.setProperty(`--_h`, `${table.offsetHeight}px`)

	cols.forEach((col, index) => {
		const colWidth = parseInt(100 / (tableWidth / col.offsetWidth))
		col.style.width = `calc(1% * var(--_c${index}))`
		node.style.setProperty(`--_c${index}`, colWidth)

		if (index > 0) {
			const input = document.createElement('input')
			input.setAttribute('aria-hidden', true)
			input.type = 'range'
			input.value = value
			node.appendChild(input)

			input.addEventListener('input', () => {
				if (input.value < minWidth) input.value = minWidth
				if (input.value > 100 - minWidth) input.value = 100 - minWidth
				const next = input.nextElementSibling
				const prev = input.previousElementSibling

				if (next?.nodeName === 'INPUT' && (input.valueAsNumber > (next.valueAsNumber - minWidth))) {
					input.value = next.valueAsNumber - minWidth
					return
				}
				if (prev?.nodeName === 'INPUT' && (input.valueAsNumber < (prev.valueAsNumber + minWidth))) {
					input.value = prev.valueAsNumber + minWidth
					return
				}

				node.style.setProperty(`--_c${index-1}`, prev?.nodeName === 'INPUT' ? input.valueAsNumber - prev.valueAsNumber : input.valueAsNumber)
				node.style.setProperty(`--_c${index}`, next?.nodeName === 'INPUT' ? next.valueAsNumber - input.valueAsNumber : 100 - input.valueAsNumber)
			})
		}
		value += colWidth
	})
}