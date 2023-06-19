export default function map2svg(map) {
	const link = (area, content) => `<a href="${area.href}" title="${area.alt}"${area.target ? ` target="${area.target}"` : ''}>${content}</a>`
	const img = document.querySelector(`[usemap="#${map.name}"]`)
	if (!img) return

	const viewBox = `0 0 ${img.getAttribute('width')||img.naturalWidth} ${img.getAttribute('height')||img.naturalHeight}`
	img.removeAttribute('usemap')

	const areas = [...map.children].map(area => {
		switch (area.shape) {
			case 'circle': {
				const [cx, cy, r] = area.coords.split(',')
				return link(area, `<circle cx="${cx}" cy="${cy}" r="${r}" />`)
				break
			}
			case 'poly': {
				const points = area.coords.split(',')
				const pointsStr = points.reduce((acc, cur, i) => {
					if (i % 2 === 0) {
						return `${acc} ${cur},`
					} else {
						return `${acc}${cur} `
					}
				}, '').trim()
				return link(area, `<polygon points="${pointsStr}" />`)
				break
			}
			case 'rect': {
				const [x, y, width, height] = area.coords.split(',')
				return link(area, `<rect x="${x}" y="${y}" width="${width}" height="${height}" />`)
				break
			}
		}
	}).join('')
	map.outerHTML = `<svg viewBox="${viewBox}">${areas}</svg>`
}