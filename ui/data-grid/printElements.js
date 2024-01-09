/* https://github.com/szepeshazi/print-elements/tree/master */

export default class PrintElements {
	constructor() {
		this.hideClass = "pe-no-print";
		this.preserveClass = "pe-preserve-print";
		this.ancestorClass = "pe-preserve-ancestor";
		this.stopNode = "BODY";
	}

	hide(element) {
		if (!element.classList.contains(this.preserveClass)) {
			element.classList.add(this.hideClass);
		}
	}

	preserve(element, isStartingElement) {
		element.classList.remove(this.hideClass);
		element.classList.add(this.preserveClass);
		if (!isStartingElement) {
			element.classList.add(this.ancestorClass);
		}
	}

	clean(element) {
		element.classList.remove(
			this.hideClass,
			this.preserveClass,
			this.ancestorClass
		);
	}

	walkSiblings(element, callback) {
		let sibling = element.previousElementSibling;
		while (sibling) {
			callback(sibling);
			sibling = sibling.previousElementSibling;
		}
		sibling = element.nextElementSibling;
		while (sibling) {
			callback(sibling);
			sibling = sibling.nextElementSibling;
		}
	}

	attachPrintClasses(element, isStartingElement) {
		this.preserve(element, isStartingElement);
		this.walkSiblings(element, this.hide.bind(this));
	}

	cleanup(element, isStartingElement) {
		this.clean(element);
		this.walkSiblings(element, this.clean.bind(this));
	}

	walkTree(element, callback) {
		let currentElement = element;
		callback(currentElement, true);
		currentElement = currentElement.parentElement;
		while (currentElement && currentElement.nodeName !== this.stopNode) {
			callback(currentElement, false);
			currentElement = currentElement.parentElement;
		}
	}

	print(elements) {
		elements.forEach((element) => {
			this.walkTree(element, this.attachPrintClasses.bind(this));
		});
		window.print();
		elements.forEach((element) => {
			this.walkTree(element, this.cleanup.bind(this));
		});
	}
}
