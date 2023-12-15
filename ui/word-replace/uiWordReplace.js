export default function uiWordReplace(node) {
	const ul = node.querySelector(".ui-word-replace ul");
	if (!ul) return;
	const length = ul.children.length;
	node.style.setProperty("--_length", length);
	
	[...ul.children].forEach((li, index) => {
		li.style.setProperty("--_index", index);
	})
}