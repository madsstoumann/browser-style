export default function uiWordReplace(node) {
	const ul = node.querySelector("ul");
	if (!ul) return;
	const length = ul.children.length;
	node.style.setProperty("--_length", length);
	
	if (node.classList.contains('--spin')) {
		[...ul.children].forEach((li, index) => {
			li.style.setProperty("--_index", index);
			// const keyframes = [
			// 	{
			// 		offset: (1/(100/length)),
			// 		opacity: 1,
			// 		translate: 0,
			// 	},
			// 	{
			// 		offset: (1/(100/length/2)),
			// 		opacity: 0,
			// 		translate: "0 -1lh",
			// 	},
			// 	{
			// 		offset: 1,
			// 		opacity: 0
			// 	}
			// ]
			
			// li.animate(keyframes,
			// 	{
			// 		duration: 1000 * length,
			// 		easing: "cubic-bezier(0.075, 0.82, 0.165, 1)",
			// 		iterations: Infinity,
			// 	}
			// )
		})
	}
}