import { handleSorting } from './data.js';

/**
 * Handles keyboard events for navigation, selection, sorting, and editing within the table.
 *
 * @param {KeyboardEvent} event - The keyboard event triggered by the user.
 * @param {Object} context - The context object containing the table state and options.
 */
export default function handleKeyboardEvents(event, context) {
	const { key, ctrlKey, metaKey, shiftKey } = event;
	const { selectable: isSelectable } = context.options;
	const { cellIndex, cols, pageItems, rowIndex } = context.state;
	const node = event.target;
	const editable = context.active?.isContentEditable;

	/* === Navigation === */

	/**
	 * Handles arrow key navigation and column resizing (Shift+Arrow).
	 *
	 * @param {string} direction - The arrow direction (ArrowUp, ArrowDown, ArrowLeft, ArrowRight).
	 */
	const handleArrowKeys = (direction) => {
		const metaKey = event.metaKey || event.ctrlKey;

		switch (direction) {
			case 'ArrowDown':
				event.preventDefault();
				context.state.rowIndex = Math.min(rowIndex + 1, pageItems);
				break;
			case 'ArrowUp':
				event.preventDefault();
				context.state.rowIndex = Math.max(rowIndex - 1, 0);
				break;
			case 'ArrowRight':
				if (shiftKey && node.nodeName === 'TH') {
					event.preventDefault();
					return context.resizeColumn(cellIndex, 1);
				}
				if (!editable) {
					event.preventDefault();
					context.state.cellIndex = Math.min(cellIndex + 1, cols - 1);
				}				
				break;
			case 'ArrowLeft':
				if (shiftKey && node.nodeName === 'TH') {
					event.preventDefault();
					return context.resizeColumn(cellIndex, -1);
				}
				if (!editable) {
					event.preventDefault();
					context.state.cellIndex = Math.max(cellIndex - 1, 0);
				}
				break;
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
				// Toggle select all rows, but only bulk select if Shift is held down
				const allRows = context.table.tBodies[0].rows;
				const selectAll = !context.toggle.checked;

				context.selectRows(allRows, selectAll, true, event.shiftKey);
				context.toggle.checked = selectAll;
			} else {
				// Sort the column if not in the first selectable column
				event.preventDefault();
				const index = node.dataset.sortIndex;
				handleSorting(context, index);
			}
		}

		if (node.nodeName === 'TD' && isSelectable) {
			// Select individual row if clicking a cell in the first column or Shift is held down
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
	 * Handles Tab key event when leaving edit mode.
	 */
	const handleTabKey = () => {
		if (editable) {
			event.preventDefault();
			context.state.cellIndex = Math.min(cellIndex + 1, cols - 1);
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
		case 'Tab': handleTabKey(); break;
		case 'Enter': handleEnterKey(); break;
	}

	context.setActive();
}
