export default function uiWordWheel(node) {
	const length = node.children.length;
	[...node.children].forEach((child, index) => child.style.setProperty('--_deg', `${index * 360 / length}deg`));
}