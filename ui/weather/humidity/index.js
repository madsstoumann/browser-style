import WeatherWidget from '../weather-widget/index.js';

const ICONS = {
	ripple: 'M3 7c3 -2 6 -2 9 0s6 2 9 0, M3 17c3 -2 6 -2 9 0s6 2 9 0, M3 12c3 -2 6 -2 9 0s6 2 9 0',
}

class WeatherHumidity extends WeatherWidget {
	constructor() {
		super();
	}
	
	connectedCallback() {
		super.connectedCallback();
		this.loadStyles();
	}
	
	render() {
		if (!this._data || !this._data.current) {
			return;
		}
		
		this.root.innerHTML = `
		<div part="humidity widget">
				<h2 part="title">${this.createIcon(ICONS.ripple, 'icon')}
					${this.hasAttribute('label') ? this.getAttribute('label') : this.translate('humidity')}</h2>
				<h3 part="header-lg">${this._data.current.humidity}%</h3>
				<p part="header-sm">${this.translate('dewPoint', { value: this.metric ? this._data.current.dewpoint_c : this._data.current.dewpoint_f })}</p>
			</div>`;
	}
}

customElements.define('weather-humidity', WeatherHumidity);
