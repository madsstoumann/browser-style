document.querySelectorAll('.details-drawer').forEach(details => details.addEventListener('toggle', () => {
	const [summary, panel] = details.children;
	slide(panel, details.open ? 1 : 0, (details.dataset.panelSide || 'right'))
}))

function slide(elm,  dir = 1, side, duration = 400) {
	const translate = 'bottom top'.includes(side) ? 'translateY' : 'translateX'
	let origin = '100vw'
	if (side === 'bottom') origin = '100vh'
	if (side === 'left') origin = '-100vw'
	if (side === 'top') origin = '-100vh'
	elm.animate([
			{ opacity: dir, transform: `${translate}(${dir === 1 ? '0px' : origin})` }
		], {
			fill: 'forwards',
			easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
			delay: 10,
			duration
		}
	)
}