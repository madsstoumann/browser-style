import WeatherWidget from '../weather-widget/index.js';

const styles = `
	:host::part(header-xl) {
		display: inline-block;
	}
	:host::part(overview-list) {
		display: none;
	}
	:host::part(unit-switcher) {
		font-size: 40%;
		vertical-align: super;
	}
	@container (width > 300px) {
		:host::part(widget) {
			grid-template-columns: 1fr auto;
		}
		:host::part(overview-list) {
			display: grid;
			list-style-type: none;
			margin: 0;
			padding: 0;
		}
		:host::part(header-xl),
		:host::part(overview-highlow) {
			text-align: end;
		}
		:host::part(condition-icon) {
			place-self: end; 
		}
	}
`;

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

class WeatherOverview extends WeatherWidget {
	constructor() {
		super();
	}
	
	connectedCallback() {
		super.connectedCallback();
		this.loadStyles(sheet);
	}
	
	render() {
		if (!this._data || !this._data.current || !this._data.location) {
			return;
		}
		
		const { current, location, forecast } = this._data;
		const day = forecast?.forecastday?.[0]?.day;
		
		this.root.innerHTML = `
			<div part="widget">
				<h2 part="header-lg" title="${location.region}, ${location.country}">
					${this.hasAttribute('label') ? this.getAttribute('label') : location.name}
					
				</h2>
				<h3 part="header-xl">${this.metric ? current.temp_c : current.temp_f}${this.hasAttribute('switcher') ? this.renderUnitSwitcher() : this.units.temperature}</h3>
				<ul part="overview-list light-text">
					<li>${this.translate('precipitation')}: ${this.metric ? current.precip_mm : current.precip_in}${this.units.presipitation}</li>
					<li>${this.translate('humidity')}: ${current.humidity}%</li>
					<li>${this.translate('wind')}: ${this.formatWindSpeed(this.metric ? current.wind_kph : current.wind_mph)} ${this.units.wind}</li>
				</ul>
				<img part="condition-icon" src="https:${current.condition.icon}" alt="${current.condition.text}">
				<h4 part="header-md">${current.condition.text}</h4>
				<span part="overview-highlow light-text">
					${this.translate('high')}: ${this.metric ? day.maxtemp_c : day.maxtemp_f}${this.units.temperature}
					${this.translate('low')}: ${this.metric ? day.mintemp_c : day.mintemp_f}${this.units.temperature}
				</span>
			</div>
		`;
	}
}

customElements.define('weather-overview', WeatherOverview);
