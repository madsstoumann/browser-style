import WeatherWidget from '../weather-widget/index.js';

const styles = `
	:host::part(graph-precipitation) {
		display: none;
	}
	@container (width > 400px) {
		:host::part(header-lg) {
			display: none;
		}
		:host::part(graph-precipitation) {
			display: block;
		}
	}
`;

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

const ICONS = {
	precipitation: 'M10.708 2.372a2.382 2.382 0 0 0 -.71 .686l-4.892 7.26c-1.981 3.314 -1.22 7.466 1.767 9.882c2.969 2.402 7.286 2.402 10.254 0c2.987 -2.416 3.748 -6.569 1.795 -9.836l-4.919 -7.306c-.722 -1.075 -2.192 -1.376 -3.295 -.686z',
}

class WeatherPrecipitation extends WeatherWidget {
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

		const precipitation = this.metric ? this._data.current.precip_mm : this._data.current.precip_in;

		this.root.innerHTML = `
		<div part="widget">
			<h2 part="title">${this.createIcon(ICONS.temperature, 'icon')}
				${this.hasAttribute('label') ? this.getAttribute('label') : this.translate('precipitation')}
				${this.hasAttribute('switcher') ? this.renderUnitSwitcher('mm', 'in') : ''}
			</h2>
			<h3 part="header-lg">${precipitation}${this.units.presipitation}</h3>
	
		</div>
		`;
	}
}

customElements.define('weather-precipitation', WeatherPrecipitation);
