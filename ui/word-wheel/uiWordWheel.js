export default function uiWordWheel(node) {
	const length = node.children.length;
	[...node.children].forEach((child, index) => {
		if (index !== 0) child.style.setProperty('--_deg', `${index * 360 / (length - 1)}deg`)
	})
}