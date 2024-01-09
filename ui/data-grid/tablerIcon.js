export default function tablerIcon(paths) {
	if (!paths.length) return
	return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
		${paths.map(path => `<path d="${path}"></path>`).join('')}
	</svg>`
}