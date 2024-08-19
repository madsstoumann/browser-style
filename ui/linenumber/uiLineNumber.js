export default function uiLineNumber(element, numLines = 50, inline = false) {
	const prefix = '--linenum-';

	if (!inline) {
		const styleString = document.body.getAttribute('style') || '';
		const regex = new RegExp(`${prefix}[^:]*`, 'g');
		const match = styleString.match(regex);

		if (match) {
			element.style.backgroundImage = `var(${match[0]})`;
			return;
		}
	}

	const bgColor = getComputedStyle(element).borderColor;
	const fillColor = getComputedStyle(element).color;
	const fontFamily = getComputedStyle(element).fontFamily;
	const fontSize = parseFloat(getComputedStyle(element).fontSize);
	const lineHeight = parseFloat(getComputedStyle(element).lineHeight) / fontSize;
	const paddingTop = parseFloat(getComputedStyle(element).paddingTop) / 2;
	const translateY = (fontSize * lineHeight).toFixed(2);

	/* Note: In Safari, deduct `(paddingTop / 10)` from translateY */

	const id = `${prefix}${Math.random().toString(36).substr(2, 6)}`;
	const svg = `<svg xmlns="http://www.w3.org/2000/svg">
		<style>
			svg { background: ${bgColor}; }
			text {
				fill: hsl(from ${fillColor} h s l / 50%);
				font-family: ${fontFamily};
				font-size: ${fontSize}px;
				line-height: ${lineHeight};
				text-anchor: end;
				translate: 0 calc((var(--n) * ${translateY}px) + ${paddingTop}px);
			}
		</style>
		${Array.from({ length: numLines }, (_, i) => `<text x="90%" style="--n:${i + 1};">${i + 1}</text>`).join("")}
	</svg>`;

	const encodedURI = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
	const target = inline ? element : document.body;
	target.style.setProperty(id, encodedURI);
	element.style.backgroundImage = `var(${id})`;
}
