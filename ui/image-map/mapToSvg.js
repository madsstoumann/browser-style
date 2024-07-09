export default function mapToSvg(node) {
	const map = node.querySelector('map');
	const img = document.querySelector(`[usemap="#${map.name}"]`);
	if (!img) return;
	img.removeAttribute('usemap');

	const areas = [...map.children].map(area => {
		/* Hook into popover api, by adding this:
		const id = area.getAttribute('href').replace('#', '');
		const elm = document.getElementById(id);
		if (elm) elm.setAttribute('popover', '');

		Then add `popovertarget="${id}"` to the shape.
		*/
		switch (area.shape) {
			case 'circle': {
				const [cx, cy, r] = area.coords.split(',');
				return `<circle cx="${cx}" cy="${cy}" r="${r}" />`;
			}
			case 'poly': {
				const points = area.coords.split(',');
				const pointsStr = points.reduce((acc, cur, i) => {
					if (i % 2 === 0) {
						return `${acc} ${cur},`;
					} else {
						return `${acc}${cur} `;
					}
				}, '').trim();
				return `<polygon points="${pointsStr}" />`;
			}
			case 'rect': {
				const [x, y, width, height] = area.coords.split(',');
				return `<rect x="${x}" y="${y}" width="${width}" height="${height}" />`;
			}
		}
	}).join('');

	map.outerHTML = `<svg viewBox="0 0 ${img.getAttribute('width') || img.naturalWidth} ${img.getAttribute('height') || img.naturalHeight}">${areas}</svg>`;

/*
If using popovers, iterate them and invoke with JS:
	const popovers = node.querySelectorAll('[popovertarget]');
		popovers.forEach(popover => {
			popover.addEventListener('click', () => {
				const target = document.getElementById(popover.getAttribute('popovertarget'));
				if (target) {
					target.showPopover();
				}
			});
		});
	}
*/
}