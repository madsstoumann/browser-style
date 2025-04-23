class WeatherWidgets extends HTMLElement {
	async connectedCallback() {
		if (!this.hasAttribute('units')) {
			this.setAttribute('units', 'metric');
		}
		const units = this.getAttribute('units');
		const url = this.getAttribute('url');
		if (!url) return;

		// Dynamically import each unique child component
		const imports = Array.from(this.children)
			.map(child => child.tagName.toLowerCase())
			.filter(tag => tag.startsWith('weather-'))
			.filter((tag, i, arr) => arr.indexOf(tag) === i);

		await Promise.all(imports.map(async tag => {
			if (tag === 'weather-widgets') return;
			await import(`../${tag}/index.js`);
		}));

		this.switcherWidget = Array.from(this.children).find(child => child.hasAttribute('switcher')) || null;
		if (this.switcherWidget) {
			this.switcherWidget.addEventListener('click', () => {
				const currentUnits = this.switcherWidget.getAttribute('units');
				Array.from(this.children).forEach(widget => {
					if (widget !== this.switcherWidget) {
						widget.setAttribute('units', currentUnits);
					}
				});
			});
		}

		try {
			const res = await fetch(url);
			const data = await res.json();

			Array.from(this.children).forEach(widget => {
				widget.setAttribute('units', units);
				if ('data' in widget) {
					widget.data = data;
				}
			});
		} catch (e) {
			console.error('Failed to load weather data:', e);
		}
	}
}
customElements.define('weather-widgets', WeatherWidgets);