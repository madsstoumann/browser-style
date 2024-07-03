export function addEventListeners(element, events, handler) {
	events.forEach(event => element.addEventListener(event, handler));
}

export function camelCase(str) {
	return str.split(' ')
		.map((word, index) => index === 0 ? word.toLowerCase() : capitalize(word))
		.join('');
}

export function capitalize(str) {
	if (typeof str !== 'string' || !str.length) return str;
	return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function consoleLog(message, bg = '#000', debug = false) {
	if (debug) {
		console.log(`%c${message}`, `background:${bg};color:#FFF;padding:0.5ch 1ch;`);
	}
}