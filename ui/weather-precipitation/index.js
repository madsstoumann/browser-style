import WeatherWidget from '../weather-widget/index.js';
import '../column-chart/index.js';

const LABEL_INTERVAL = 2;

const styles = `
	column-chart {
		display: none;
	}
	@container (width > 400px) {
		:host::part(header-lg) {
			display: none;
		}
		column-chart {
			--column-chart-item-bg: #B0CCE8;
			--column-chart-item-c: #000;
			--column-chart-item-fs: 2cqi;
			--column-chart-item-miw: 7cqi;
			--column-chart-label-c: var(--weather-widget-light-text);
			display: grid;
			margin-block-start: 1em;
		}
	}
	@container (width > 600px) {
		column-chart {
			--column-chart-item-fs: 1.25cqi;
			--column-chart-item-miw: 3cqi;
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

	prepareGraphData(forecastDays) {
		if (!forecastDays || !forecastDays.length || !this._data?.location?.localtime) return [];
		const key = this.metric ? 'precip_mm' : 'precip_in';
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

		const precipitation = this.metric ? this._data.current.precip_mm : this._data.current.precip_in;
		const graphData = this.prepareGraphData(this._data.forecast.forecastday);

		this.root.innerHTML = `
		<div part="widget">
			<h2 part="title">${this.createIcon(ICONS.precipitation, 'icon')}
				${this.hasAttribute('label') ? this.getAttribute('label') : this.translate('precipitation')}
				${this.hasAttribute('switcher') ? this.renderUnitSwitcher('mm', 'in') : ''}
			</h2>
			<h3 part="header-lg">${precipitation}${this.units.presipitation}</h3>
			<column-chart></column-chart>
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

customElements.define('weather-precipitation', WeatherPrecipitation);
