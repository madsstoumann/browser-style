export default function uiWordWheel(node) {
	const length = node.children.length;
	let max = 0;
	[...node.children].forEach((child, index) => {
		max = Math.max(max, child.textContent.length);
		child.style.setProperty('--_deg', `${index * 360 / length}deg`)
	});
	node.style.setProperty('--_max', max);
}