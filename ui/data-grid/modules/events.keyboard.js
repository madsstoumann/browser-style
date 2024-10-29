/**
 * Handles keyboard events for navigation, selection, sorting, and editing within the table.
 *
 * @param {KeyboardEvent} event - The keyboard event triggered by the user.
 * @param {Object} context - The context object containing the table state and options.
 */
export default function handleKeyboardEvents(event, context) {
	const { key, ctrlKey, metaKey, shiftKey } = event;
	const { editable: isEditable, selectable: isSelectable } = context.options;
	const { cellIndex, cols, editing, pageItems, rowIndex } = context.state;
	const node = event.target;

	/* === Navigation === */

	/**
	 * Handles arrow key navigation and column resizing (Shift+Arrow).
	 *
	 * @param {string} direction - The arrow direction (ArrowUp, ArrowDown, ArrowLeft, ArrowRight).
	 */
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

	/**
	 * Handles home key event for moving to the first cell or row.
	 */
	const handleHomeKey = () => {
		event.preventDefault();
		if (!shiftKey) {
			context.state.cellIndex = 0;
		}
		if (ctrlKey || metaKey || shiftKey) {
			context.state.rowIndex = 0;
		}
	};

	/**
	 * Handles end key event for moving to the last cell or row.
	 */
	const handleEndKey = () => {
		event.preventDefault();
		if (!shiftKey) {
			context.state.cellIndex = cols - 1;
		}
		if (ctrlKey || metaKey || shiftKey) {
			context.state.rowIndex = pageItems;
		}
	};

	/**
	 * Handles PageUp/PageDown key events for navigating pages.
	 *
	 * @param {string} direction - The direction to navigate (PageUp, PageDown).
	 */
	const handlePageKeys = (direction) => {
		event.preventDefault();
		if (direction === 'PageDown') {
			context.navigatePage(null, 'next')
		} else if (direction === 'PageUp') {
			context.navigatePage(null, 'prev')
		}
	};

	/*=== Selecting and sorting ===*/

	/**
	 * Handles space key events for sorting or row selection.
	 */
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
				const currentSortIndex = parseInt(context.getAttribute('sortindex'), 10);
				const currentSortOrder = parseInt(context.getAttribute('sortorder'), 10);
				
				if (index !== undefined) {
					if (currentSortIndex === parseInt(index, 10)) {
						if (currentSortOrder === 0) {
							context.setAttribute('sortorder', 1);
						} else if (currentSortOrder === 1) {
							context.removeAttribute('sortindex');
							context.removeAttribute('sortorder');
						}
					} else {
						context.setAttribute('sortindex', parseInt(index, 10));
						context.setAttribute('sortorder', 0);
					}
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

	/**
	 * Handles key event for selecting all rows (Ctrl+A or Cmd+A).
	 */
	const handleAKey = () => {
		if (isSelectable && (ctrlKey || metaKey)) {
			event.preventDefault();
			context.selectRows(context.table.tBodies[0].rows, false);
		}
	};

	/**
	 * Handles key event for inverting row selection (Ctrl+Shift+I or Cmd+Shift+I).
	 */
	const handleIKey = () => {
		if (isSelectable && (ctrlKey || metaKey) && shiftKey) {
			event.preventDefault();
			context.selectRows(context.table.tBodies[0].rows);
		}
	};

	/**
	 * Handles Enter key event for triggering row actions or expanding/popover rows.
	 */
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

	/* === Editing and actions === */

	/**
	 * Handles F2 key event for entering/exiting edit mode.
	 */
	const handleF2Key = () => {
		if (!isEditable) return;
		if (!context.active && node.nodeName === 'TD') {
			context.active = node;
		}
		context.state.editing ? context.editEnd(context.active) : context.editBegin();
	};

	/**
	 * Handles Tab key event when leaving edit mode.
	 */
	const handleTabKey = () => {
		if (context.state.editing) {
			event.preventDefault();
			context.state.editing = false;
			node.toggleAttribute('contenteditable', context.state.editing);
		}
	};

	/**
	 * Handles print key (Ctrl+P or Cmd+P).
	 */
	const handlePKey = () => {
		if (ctrlKey || metaKey) {
			event.preventDefault();
			context.printTable();
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
