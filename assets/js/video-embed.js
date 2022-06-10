document.querySelectorAll('vimeo-embed, youtube-embed').forEach(v => {
	const [poster, src] = v.tagName === 'VIMEO-EMBED' ?
		[`vumbnail.com/${v.id}.jpg`, 'player.vimeo.com/video'] :
		[`i.ytimg.com/vi/${v.id}/hqdefault.jpg`, 'www.youtube.com/embed'];

	v.innerHTML = `<img loading="lazy" src="https://${poster}" alt="${v.title}"><button aria-label="${v.dataset.label}"></button>`;
	v.children[1].addEventListener('click', () => v.innerHTML = `<iframe allow="autoplay ${v.allow||''}" allowfullscreen src="https://${src}/${v.id}?autoplay=1&${v.dataset.params||''}"></iframe>`)
})