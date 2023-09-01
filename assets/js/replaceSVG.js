export default function replaceSVG(img) {
	fetch(img.src).then(response => response.text()).then(svg => img.outerHTML = svg)
}