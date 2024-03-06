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

export function debounce(func, delay) {
	let timeoutId;
	return function () {
		const context = this;
		const args = arguments;
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			func.apply(context, args);
		}, delay);
	};
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

export function parseResponse(response) {
	let result;

	try {
		// Attempt to parse as JSON
		const parsedObject = JSON.parse(response);

		// Check if it's an object and has a single property
		if (typeof parsedObject === 'object' && Object.keys(parsedObject).length === 1) {
			const propertyName = Object.keys(parsedObject)[0];
			const propertyValue = parsedObject[propertyName];

			// Check if the property value is an array
			if (Array.isArray(propertyValue)) {
				result = propertyValue;
			} else {
				result = response; // Not an array, keep the original text
			}
		} else {
			result = response; // Not an object with a single property, keep the original text
		}
	} catch (error) {
		result = response; // Parsing as JSON failed, keep the original text
	}

	return result;
}

export function replacePlaceholder(obj, placeholder, replacement) {
	if (typeof obj === 'object') {
		for (let key in obj) {
			if (obj.hasOwnProperty(key)) {
				obj[key] = replacePlaceholder(obj[key], placeholder, replacement);
			}
		}
	} else if (typeof obj === 'string') {
		obj = obj.replace(new RegExp(placeholder, 'g'), replacement);
	}
	return obj;
}

export function getNestedProperty(obj, path) {
	const keys = path.split('.');
	let currentObject = obj;

	for (const key of keys) {
		if (currentObject && key.includes('[')) {
			const [arrayKey, index] = key.split(/[\[\]]/).filter(Boolean);
			currentObject = currentObject[arrayKey] && currentObject[arrayKey][parseInt(index, 10)];
		} else {
			currentObject = currentObject && currentObject[key];
		}

		if (currentObject === undefined) {
			return { foundObject: undefined, keys };
		}
	}

	return { foundObject: currentObject, keys };
}

export function setNestedProperty(obj, keys, value) {
	let currentObject = obj;

	for (let i = 0; i < keys.length - 1; i++) {
		const key = keys[i];

		if (key.includes('[')) {
			const [arrayKey, index] = key.split(/[\[\]]/).filter(Boolean);

			if (!currentObject[arrayKey]) {
				currentObject[arrayKey] = [];
			}

			currentObject = currentObject[arrayKey][parseInt(index, 10)];
		} else {
			if (!currentObject[key]) {
				currentObject[key] = {};
			}

			currentObject = currentObject[key];
		}

		if (currentObject === undefined) {
			return;
		}
	}

	const lastKey = keys[keys.length - 1];

	if (lastKey.includes('[')) {
		const [arrayKey, index] = lastKey.split(/[\[\]]/).filter(Boolean);

		if (!currentObject[arrayKey]) {
			currentObject[arrayKey] = [];
		}

		currentObject[arrayKey][parseInt(index, 10)] = value;
	} else {
		currentObject[lastKey] = value;
	}
}

export function uuid() {
	return crypto.getRandomValues(new Uint32Array(1))[0] || Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}

// export function setDataUid(element, blacklist = ['ui-editor', 'style', 'script']) {
// 	try {
// 		if (element && element.nodeType === Node.ELEMENT_NODE && !blacklist.includes(element.tagName.toLowerCase())) {
// 			element.dataset.uid = uuid();
// 			for (const childNode of element.childNodes) {
// 				setDataUid(childNode, blacklist);
// 			}
// 		}
// 	} catch (e) {
// 		console.error(e);
// 	}
// }
