/**
* Adds a scroll listener to the window and updates a CSS variable: `--scroll-y`
* on the specified node to reflect the current scroll position.
* @param {HTMLElement} node - The HTML element to update with scroll position. Defaults to document.body if not provided.
*/
export function addDocumentScroll(node = document.body) {
	let ticking = false;
	let scrollYcur = 0;
	let scrollY = 0;
	window.addEventListener('scroll', () => {
		scrollY = window.scrollY;
		if (scrollY < 0) { scrollY = 0; }
		if (!ticking) {
			window.requestAnimationFrame(() => {
				node.style.setProperty('--scroll-y', scrollY);
				scrollYcur = scrollY;
				// If we are in an iframe, also send the scroll position to the parent window.
				if (window !== window.parent) {
					window.parent.postMessage({ type: 'scroll', scrollY }, '*');
				}
				ticking = false;
			});
			ticking = true;
		}
	})
}

/**
* Makes an HTML element draggable using pointer events.
* @param {HTMLElement} handle - The element that serves as the draggable handle.
* @param {HTMLElement} panel - The element to be dragged.
*/
export function addDraggable(handle, panel, propX = '--uie-x', propY = '--uie-y') {
	let startX, startY;

	function start(e) {
		startX = e.clientX;
		startY = e.clientY;
		handle.setPointerCapture(e.pointerId);
		handle.addEventListener('pointermove', move);
	}

	function end() {
		handle.removeEventListener('pointermove', move);
	}

	function move(e) {
			e.preventDefault();

			const deltaX = startX - e.clientX;
			const deltaY = startY - e.clientY;
			startX = e.clientX;
			startY = e.clientY;

			let newX = panel.offsetLeft - deltaX;
			let newY = panel.offsetTop - deltaY;

			newX = Math.max(0, Math.min(newX, window.innerWidth - panel.offsetWidth));
			newY = Math.max(0, Math.min(newY, window.innerHeight - panel.offsetHeight));

			panel.style.setProperty(propX, newX + 'px');
			panel.style.setProperty(propY, newY + 'px');
	}

	handle.addEventListener('pointerdown', start);
	handle.addEventListener('pointerup', end);
	handle.addEventListener('pointercancel', end);
	// Prevents default touchstart behavior to avoid conflicts with pointer events.
	handle.addEventListener('touchstart', (e) => e.preventDefault());
}

export function findObjectByProperty(data, propertyName, propertyValue) {
	if (typeof data !== "object" || data === null) {
		return null; // Handle non-object or null data
	}

	if (data[propertyName] === propertyValue) {
		return data; // Base case: match found in current object
	}

	if (Array.isArray(data)) {
		for (const item of data) {
			const result = findObjectByProperty(item, propertyName, propertyValue); // Recursive call on each item
			if (result) {
				return result;
			}
		}
	} else if (typeof data === "object") {
		for (const key in data) {
			const value = data[key];
			const result = findObjectByProperty(value, propertyName, propertyValue); // Recursive call on each value
			if (result) {
				return result;
			}
		}
	}

	return null; // Not found
}

export function uuid() {
	return crypto.getRandomValues(new Uint32Array(1))[0] || Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}