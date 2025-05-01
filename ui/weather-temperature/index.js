import WeatherWidget from '../weather-widget/index.js';
import '../column-chart/index.js';

const styles = `
	column-chart {
		--column-chart-bar-bg: #FFF5CC;
		--column-chart-bar-c: #000;
		--column-chart-x-axis-c: #FFF5CC;
		display: none;
	}
	@container (width > 400px) {
		:host::part(header-lg) {
			display: none;
		}
		column-chart {
			display: grid;
			margin-block-start: 1em;
		}
	}
`;

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

const ICONS = {
	temperature: 'M10 13.5a4 4 0 1 0 4 0v-8.5a2 2 0 0 0 -4 0v8.5, M10 9l4 0',
}

const LABEL_INTERVAL = 2;

class WeatherTemperature extends WeatherWidget {
	constructor() {
		super();
	}
	
	connectedCallback() {
		super.connectedCallback();
		this.loadStyles(sheet);
	}

	prepareGraphData(forecastDays) {
		if (!forecastDays || !forecastDays.length || !this._data?.location?.localtime) return [];
		const key = this.metric ? 'temp_c' : 'temp_f';
		const localTime = new Date(this._data.location.localtime);
		const currentHour = localTime.getHours();
		const hours = [];

		const today = forecastDays[0]?.hour?.slice(currentHour) || [];
		hours.push(...today);

		if (hours.length < 24 && forecastDays.length > 1) {
			const tomorrow = forecastDays[1]?.hour?.slice(0, 24 - hours.length) || [];
			hours.push(...tomorrow);
		}

		return hours.slice(0, 24).map((hour, idx) => {
			const date = new Date(hour.time);
			let label;
			if (this.metric) {
				label = `${date.getHours().toString().padStart(2, '0')}:00`;
			} else {
				const h = date.getHours();
				const period = h >= 12 ? 'PM' : 'AM';
				const hour12 = h % 12 || 12;
				label = `${hour12}${period}`;
			}
			return {
				value: hour[key],
				label: idx % LABEL_INTERVAL === 0 ? label : ''
			};
		});
	}
	
	render() {
		if (!this._data || !this._data.current || !this._data.forecast) {
			return;
		}

		const graphData = this.prepareGraphData(this._data.forecast.forecastday);
		const temperature = this.metric ? this._data.current.temp_c : this._data.current.temp_f;		
		
		this.root.innerHTML = `
		<div part="widget">
			<h2 part="title">${this.createIcon(ICONS.temperature, 'icon')}
				${this.hasAttribute('label') ? this.getAttribute('label') : this.translate('temperature')}
				${this.hasAttribute('switcher') ? this.renderUnitSwitcher() : ''}
			</h2>
			<h3 part="header-lg">${temperature}${this.units.temperature}</h3>
			<column-chart display="value-labels x-labels" small="6" medium="12"></column-chart>
		</div>
		`;

		const chart = this.root.querySelector('column-chart');
		if (chart) {
			const maxValue = Math.max(...graphData.map(d => d.value));
			chart.dataset = {
				settings: {
					min: 0,
					max: maxValue
				},
				data: graphData
			};
		}
	}
}

customElements.define('weather-temperature', WeatherTemperature);
