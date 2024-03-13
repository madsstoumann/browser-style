export function getXPath(element) {
	if (!element) return '';

	if (element.id && document.getElementById(element.id)) {
			return `//*[@id="${element.id}"]`;
	}

	const segments = [];
	let currentElement = element;

	while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE) {
		let index = 1;
		let sibling = currentElement.previousSibling;

		while (sibling) {
			if (sibling.nodeType === Node.ELEMENT_NODE && sibling.tagName === currentElement.tagName) {
				index++;
			}
			sibling = sibling.previousSibling;
		}

		const tagName = currentElement.tagName.toLowerCase();
		const pathSegment = `${tagName}[${index}]`;
		segments.unshift(pathSegment);
		currentElement = currentElement.parentNode;
	}

	return segments.length ? '/' + segments.join('/') : '';
}

export function getElementByXPath(xpath) {
	return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

