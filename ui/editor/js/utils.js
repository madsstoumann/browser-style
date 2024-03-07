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
	handle.addEventListener('touchstart', (e) => e.preventDefault());
}

/**
 * Checks if the given node contains rich text.
 * @param {HTMLElement} node - The node to check.
 * @returns {boolean} - Returns true if the node contains rich text, otherwise false.
 */
export function containsRichText(node) {
	// Check if the node has innerHTML and if it contains any HTML tags
	return node && typeof node.innerHTML === 'string' && /<\/?[a-z][\s\S]*>/i.test(node.innerHTML);
}

/**
 * Debounces a function, ensuring it is only called after a specified delay.
 * @param {Function} func - The function to be debounced.
 * @param {number} delay - The delay in milliseconds.
 * @returns {Function} - The debounced function.
 */
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

/**
 * Fetches configuration files asynchronously.
 * @param {string[]} files - An array of file URLs to fetch.
 * @returns {Promise<Object>} A promise that resolves to an object containing configuration data.
 * @throws {Error} If an error occurs during the fetch operation for any file.
 */
export async function fetchFiles(files) {
	const configs = {};

	for (const fileName of files) {
		// Extracts the clean file name without the file extension.
		const cleanFileName = fileName.replace(/^.*\/([^/]+)\.[^/.]+$/, '$1');

		try {
			const response = await fetch(fileName);
			const config = await response.json();
			configs[cleanFileName] = config;
		} catch (error) {
			console.error(`Error fetching ${fileName}: ${error}`);
		}
	}
	return configs;
}

/**
 * Finds an object in the given data structure that matches the specified property name and value.
 * @param {Object|Array} data - The data structure to search in.
 * @param {string} propertyName - The name of the property to match.
 * @param {*} propertyValue - The value of the property to match.
 * @returns {Object|null} - The first object found that matches the property name and value, or null if no match is found.
 */
export function findObjectByProperty(data, propertyName, propertyValue) {
	if (typeof data !== "object" || data === null) {
		return null;
	}

	if (data[propertyName] === propertyValue) {
		return data;
	}

	if (Array.isArray(data)) {
		for (const item of data) {
			const result = findObjectByProperty(item, propertyName, propertyValue);
			if (result) {
				return result;
			}
		}
	} else if (typeof data === "object") {
		for (const key in data) {
			const value = data[key];
			const result = findObjectByProperty(value, propertyName, propertyValue);
			if (result) {
				return result;
			}
		}
	}
	return null;
}

/**
 * Recursively iterates over an object and invokes a callback function when a matching key is found.
 * @param {Object} obj - The object to iterate over.
 * @param {string} searchKey - The key to search for.
 * @param {Function} callback - The callback function to invoke when a matching key is found.
 * @returns {void}
 */
export function iterateObject(obj, searchKey, callback) {
	for (const key in obj) {
		if (typeof obj[key] === 'object' && obj[key] !== null) {
			iterateObject(obj[key], searchKey, callback);
		} else {
			if (key === searchKey) {
				callback(key, obj);
			}
		}
	}
}

/**
 * Parses the response and returns the result.
 * If the response can be parsed as JSON and it is an object with a single property,
 * the value of that property is returned as an array.
 * Otherwise, the original response is returned.
 * @param {string} response - The response to parse.
 * @returns {Array|string} - The parsed result.
 */
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

/**
 * Replaces a placeholder with a replacement value in an object or string.
 * If the input is an object, it recursively replaces placeholders in all its properties.
 * If the input is a string, it replaces all occurrences of the placeholder with the replacement value.
 * @param {object|string} obj - The object or string to perform the replacement on.
 * @param {string} placeholder - The placeholder value to be replaced.
 * @param {string} replacement - The replacement value.
 * @returns {object|string} - The object or string with the placeholder replaced.
 */
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

/**
 * Retrieves a nested property from an object based on a given path.
 * @param {object} obj - The object to retrieve the property from.
 * @param {string} path - The path to the nested property, using dot notation.
 * @returns {object} - An object containing the found property and the keys used to access it.
 */
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

/**
 * Sets a nested property value in an object.
 *
 * @param {object} obj - The object to set the property on.
 * @param {Array<string>} keys - An array of keys representing the nested property path.
 * @param {*} value - The value to set.
 */
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

/**
 * Generates a unique identifier using the crypto.getRandomValues method or Math.random.
 * @returns {number} The generated unique identifier.
 */
export function uuid() {
	return crypto.getRandomValues(new Uint32Array(1))[0] || Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}