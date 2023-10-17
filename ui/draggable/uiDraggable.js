export default function uiDraggable(node) {
	node.addEventListener('dragover', event => {
		event.preventDefault()
		const afterElement = getDragAfterElement(node, event.clientY)
		const draggable = document.querySelector('.--dragging')
		if (afterElement == null) {
			node.appendChild(draggable)
		} else {
			node.insertBefore(draggable, afterElement)
		}
	})

	Array.from(node.children).forEach(draggable => {
		draggable.addEventListener('dragstart', () => {
			draggable.classList.add('--dragging')
		})

		draggable.addEventListener('dragend', () => {
			draggable.classList.remove('--dragging')
		})
	})
	function getDragAfterElement(node, y) {
		const draggableElements = [...node.querySelectorAll('li:not(.dragging)')]
	
		return draggableElements.reduce((closest, child) => {
			const box = child.getBoundingClientRect()
			const offset = y - box.top - box.height / 2
			if (offset < 0 && offset > closest.offset) {
				return { offset: offset, element: child }
			} else {
				return closest
			}
		}, { offset: Number.NEGATIVE_INFINITY }).element
	}
}