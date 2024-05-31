	<script>
		const myRichText = document.querySelector('ui-richtext');
		myRichText.addCustomCommand(
			{
				key: 'video',
				icon: `M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z,M8 4l0 16,M16 4l0 16,M4 8l4 0,M4 16l4 0,M4 12l16 0,M16 8l4 0,M16 16l4 0`,
				fn: () => {
					const url = prompt('Enter a Video URL:', 'https://')
					if (url) document.execCommand('insertHTML', false, `<video controls><source src="${url}" type="video/mp4"></video>`)
				},
				title: 'Insert Video'
			}
		);
		myRichText.addCustomCommand(
			{
				key: 'youtube',
				icon: `M18 3a5 5 0 0 1 5 5v8a5 5 0 0 1 -5 5h-12a5 5 0 0 1 -5 -5v-8a5 5 0 0 1 5 -5zm-9 6v6a1 1 0 0 0 1.514 .857l5 -3a1 1 0 0 0 0 -1.714l-5 -3a1 1 0 0 0 -1.514 .857z`,
				fn: () => {
					const embedID = prompt('Enter a YouTube Embed ID:', '5b4YcLB4DVI')
					if (embedID) document.execCommand('insertHTML', false, `<iframe width="560" height="315" src="https://www.youtube.com/embed/${embedID}" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`)
				},
				title: 'Insert YouTube Video'
			}
		);
	</script>