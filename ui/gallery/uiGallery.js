import random from './../../assets/js/random.js'
export default function uiGallery(grid) {
  [...grid.children].forEach(node => {
  node.style.cssText = `--gc:${
    Math.floor(random(1, 4))};--gr:${
		Math.floor(random(1, 4))}`
	})
}