import WeatherWidget from '../weather-widget/index.js';

const styles = `
	:host::part(graph-temperature) {
		display: none;
	}
	@container (width > 400px) {
		:host::part(header-lg) {
			display: none;
		}
		:host::part(graph-temperature) {
			display: block;
		}
	}
`;

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

const ICONS = {
	temperature: 'M10 13.5a4 4 0 1 0 4 0v-8.5a2 2 0 0 0 -4 0v8.5, M10 9l4 0',
}

class WeatherTemperature extends WeatherWidget {
	constructor() {
		super();
	}
	
	connectedCallback() {
		super.connectedCallback();
		this.loadStyles(sheet);
	}
	
	render() {
		if (!this._data || !this._data.current || !this._data.forecast) {
			return;
		}
		
		const temperature = this.metric ? this._data.current.temp_c : this._data.current.temp_f;		
		
		this.root.innerHTML = `
		<div part="widget">
			<h2 part="title">${this.createIcon(ICONS.temperature, 'icon')}
				${this.hasAttribute('label') ? this.getAttribute('label') : this.translate('temperature')}
				${this.hasAttribute('switcher') ? this.renderUnitSwitcher() : ''}
			</h2>
			<h3 part="header-lg">${temperature}${this.units.temperature}</h3>
	
		</div>
		`;
	}
}

customElements.define('weather-temperature', WeatherTemperature);
