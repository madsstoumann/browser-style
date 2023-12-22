import { brightness, strToRGB } from './../../assets/js/color.js';
export default function uiAvatar(node) {
	const str = node.querySelector('abbr')?.getAttribute('title') || node.textContent;
	const rgb = strToRGB(str);
	const contrast = brightness(...rgb);
	node.style.setProperty('--ui-avatar-bg', `rgb(${rgb.join(', ')})`);
	node.style.setProperty('--ui-avatar-c', contrast <= 127 ? `#FFF` : `#000`);
}
