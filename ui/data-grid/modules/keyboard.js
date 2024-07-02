export default function handleKeyboardEvents(event, context) {
	const { key, ctrlKey, metaKey, shiftKey } = event;
	const node = event.target;
	const isEditable = context.options.editable;
	const isSelectable = context.options.selectable;

	const handleSpaceKey = () => {
		if (node.nodeName === 'TH') {
			if (isSelectable && context.state.cellIndex === 0) {
				if (context.state.selected.size) {
					context.selectRows(context.table.tBodies[0].rows, false, true);
					context.toggle.checked = false;
				} else {
					context.selectRows(context.table.tBodies[0].rows, true, true);
					context.toggle.checked = true;
				}
			} else {
				event.preventDefault();
				const index = node.dataset.sortIndex;
				if (index !== undefined) {
					context.setAttribute('sortindex', parseInt(index, 10));
				}
			}
		}
		if (node.nodeName === 'TD' && isSelectable) {
			if ((context.state.cellIndex === 0) || shiftKey) {
				event.preventDefault();
				context.selectRows([node.parentNode], true);
			}
		}
	};

	const handleAKey = () => {
		if (isSelectable && (ctrlKey || metaKey)) {
			event.preventDefault();
			context.selectRows(context.table.tBodies[0].rows, false);
		}
	};

	const handleIKey = () => {
		if (isSelectable && (ctrlKey || metaKey) && shiftKey) {
			event.preventDefault();
			context.selectRows(context.table.tBodies[0].rows);
		}
	};

	const handleArrowKeys = (direction) => {
		event.preventDefault();
		if (direction === 'ArrowDown') {
			context.state.rowIndex = Math.min(context.state.rowIndex + 1, context.state.pageItems);
		} else if (direction === 'ArrowUp') {
			context.state.rowIndex = Math.max(context.state.rowIndex - 1, 0);
		} else if (direction === 'ArrowRight' && !context.state.editing) {
			if (shiftKey && node.nodeName === 'TH') {
				return context.resizeColumn(node.cellIndex, 1);
			}
			context.state.cellIndex = Math.min(context.state.cellIndex + 1, context.state.cols - 1);
		} else if (direction === 'ArrowLeft' && !context.state.editing) {
			if (shiftKey && node.nodeName === 'TH') {
				return context.resizeColumn(node.cellIndex, -1);
			}
			context.state.cellIndex = Math.max(context.state.cellIndex - 1, 0);
		}
	};

	const handleEndKey = () => {
		if (!shiftKey) {
			context.state.cellIndex = context.state.cols - 1;
		}
		if (ctrlKey || metaKey || shiftKey) {
			context.state.rowIndex = context.state.pageItems;
		}
	};

	const handleHomeKey = () => {
		if (!shiftKey) {
			context.state.cellIndex = 0;
		}
		if (ctrlKey || metaKey || shiftKey) {
			context.state.rowIndex = 0;
		}
	};

	const handlePKey = () => {
		if (ctrlKey || metaKey) {
			event.preventDefault();
			context.printTable();
		}
	};

	const handlePageKeys = (direction) => {
		if (direction === 'PageDown') {
			context.next();
		} else if (direction === 'PageUp') {
			context.prev();
		}
	};

	const handleF2Key = () => {
		if (!isEditable) return;
		context.editBegin();
	};

	const handleTabKey = () => {
		// TODO!
		// if (context.state.editing) {
		// 	event.preventDefault();
		// 	context.state.editing = false;
		// 	node.toggleAttribute('contenteditable', context.state.editing);
		// }
	};

	switch (event.key) {
		case ' ': handleSpaceKey(); break;
		case 'a': handleAKey(); break;
		case 'i': handleIKey(); break;
		case 'ArrowDown':
		case 'ArrowUp':
		case 'ArrowRight':
		case 'ArrowLeft': handleArrowKeys(key); break;
		case 'End': handleEndKey(); break;
		case 'Home': handleHomeKey(); break;
		case 'p': handlePKey(); break;
		case 'PageDown':
		case 'PageUp': handlePageKeys(key); break;
		case 'F2': handleF2Key(); break;
		case 'Tab': handleTabKey(); break;
	}

	if (!context.state.editing) context.setActive();
}
