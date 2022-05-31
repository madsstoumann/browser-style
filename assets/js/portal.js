document.querySelectorAll('portal').forEach(portal => portal.addEventListener('click', event => {
	event.preventDefault();
	portal.style = 'position: fixed; inset: 0; block-size: 1vw; inline-size: 1vh; overflow: hidden;';
	portal.animate([
		{
			height: '100vh',
			width: '100vw'
		}], 
		{
			duration: 500,
			fill: 'forwards'
		}).finished;
		setTimeout(() => { portal.activate() }, 600);
}));