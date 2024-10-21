export default function handleKeyboardEvents(event, context) {
	const { key, ctrlKey, metaKey, shiftKey } = event;
	const { editable: isEditable, selectable: isSelectable } = context.options;
	const { cellIndex, cols, editing, pageItems, rowIndex } = context.state;
	const node = event.target;

	const handleSpaceKey = () => {
		if (node.nodeName === 'TH') {
			if (isSelectable && cellIndex === 0) {
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
			if (cellIndex === 0 || shiftKey) {
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
			context.state.rowIndex = Math.min(rowIndex + 1, pageItems);
		} else if (direction === 'ArrowUp') {
			context.state.rowIndex = Math.max(rowIndex - 1, 0);
		} else if (direction === 'ArrowRight' && !editing) {
			if (shiftKey && node.nodeName === 'TH') {
				return context.resizeColumn(cellIndex, 1);
			}
			context.state.cellIndex = Math.min(cellIndex + 1, cols - 1);
		} else if (direction === 'ArrowLeft' && !editing) {
			if (shiftKey && node.nodeName === 'TH') {
				return context.resizeColumn(cellIndex, -1);
			}
			context.state.cellIndex = Math.max(cellIndex - 1, 0);
		}
	};

	const handleEndKey = () => {
		event.preventDefault();
		if (!shiftKey) {
			context.state.cellIndex = cols - 1;
		}
		if (ctrlKey || metaKey || shiftKey) {
			context.state.rowIndex = pageItems;
		}
	};

	const handleEnterKey = () => {
		const row = node.closest('tr');
		if (!row) return;

		if (shiftKey) {
			// Trigger dg:rowclick when Shift + Enter is pressed
			if (row && row.dataset.uid) {
				event.preventDefault();
				context.dispatch('dg:rowclick', { detail: { id: row.dataset.uid } });
			}
		} else if (ctrlKey || metaKey) {
			// Trigger the popover when Ctrl + Enter (or Cmd + Enter) is pressed
			const popoverButton = row.querySelector('button[popovertarget]');
			if (popoverButton) {
				event.preventDefault();
				popoverButton.click();
			}
		}
	};

	const handleHomeKey = () => {
		event.preventDefault();
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
		event.preventDefault();
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
		if (context.state.editing) {
			event.preventDefault();
			context.state.editing = false;
			node.toggleAttribute('contenteditable', context.state.editing);
		}
	};

	switch (key) {
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
		case 'Enter': handleEnterKey(); break;
	}

	if (!editing) context.setActive();
}
