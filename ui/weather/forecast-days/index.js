import WeatherWidget from '../weather-widget/index.js';

const styles = `
	:host::part(forecast-days) {
		padding-block-end: 0;
	}
	:host::part(forecast-days-list) {
		column-gap: var(--weather-forecast-days-gap, 1ch);
		display: grid;
		grid-template-columns: auto 2fr 1fr 1fr;
		margin: 0;
		padding: 0;
	}
	:host::part(forecast-day) {
		align-items: center;
		border-style: solid;
		border-width: var(--weather-widget-bdw) 0 0 0;
		border-color: var(--weather-widget-bdc);
		display: grid;
		grid-column: span 4;
		grid-template-columns: subgrid;
		padding-block: var(--weather-forecast-day-p, .5ch);
	}
	:host::part(forecast-day-icon){
		place-self: center;
	}
	:host::part(forecast-day-name),
	:host::part(forecast-day-temp) {
		font-weight: var(--weather-widget-day-fw, 500);
	}
	:host::part(forecast-day-temp),
	:host::part(forecast-day-night-temp) {
		text-align: end;
	}
	:host::part(forecast-day-wind) {
		display: none;
	}
	[part~=forecast-days-list] li:first-of-type {
		border: 0;
	}
	@container (width > 500px) {
		:host::part(forecast-days-list) {
			grid-template-columns: repeat(auto-fit, minmax(50px, 1fr));
			padding-block: var(--weather-widget-p);
		}
		:host::part(forecast-day) {
			border-width: 0 0 0 var(--weather-widget-bdw);
			display: grid;
			grid-column: unset;
			justify-items: center;
			row-gap: var(--weather-widget-rg, .5ch);
		}
		:host::part(forecast-day-temp) {
			font-size: 150%;
		}
		:host::part(forecast-day-wind) {
			align-items: center;
			display: flex;
		}
	}
`;

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

const ICONS = {
  arrowup: 'M12 5l0 14, M18 11l-6 -6, M6 11l6 -6',
  calendar: 'M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z, M16 3v4, M8 3v4, M4 11h16, M7 14h.013, M10.01 14h.005, M13.01 14h.005, M16.015 14h.005, M13.015 17h.005, M7.01 17h.005, M10.01 17h.005'
};

class WeatherForecastDays extends WeatherWidget {
  constructor() {
    super();
  }
 
  connectedCallback() {
    super.connectedCallback();
    this.loadStyles(sheet);
  }

  render() {
    if (!this._data || !this._data.forecast || !this._data.forecast.forecastday) {
      return;
    }

    const forecast = this._data.forecast.forecastday.slice(0, this._days);

    this.root.innerHTML = `
      <div part="widget">
        <h4 part="title">
          ${this.createIcon(ICONS.calendar, 'icon')}
          ${this.hasAttribute('label') ? this.getAttribute('label') : this.translate('forecastDays', { value: forecast.length })}
          ${this.hasAttribute('switcher') ? this.renderUnitSwitcher() : ''}
        </h4>
        <ul part="forecast-days-list">
          ${forecast.map(day => {
            const dayTemp = this.metric ? day.day.maxtemp_c : day.day.maxtemp_f;
            const nightTemp = this.metric ? day.day.mintemp_c : day.day.mintemp_f;
            const date = new Date(day.date);
            const dayName = this.formatDate(date, { weekday: 'short' });
            const shortDate = this.formatDate(date, { day: 'numeric', month: 'numeric' });

            const windSpeed = this.formatWindSpeed(this.metric ? day.day.maxwind_kph : day.day.maxwind_mph);

            const windDegree = day.hour.length ? 
              day.hour.reduce((sum, hour) => sum + hour.wind_degree, 0) / day.hour.length : 0;
            
            return `
              <li part="forecast-day" title="${day.day.condition.text}">
                <strong part="forecast-day-name" title="${shortDate}">${dayName}</strong>
                <img part="forecast-day-icon condition-icon" src="https:${day.day.condition.icon}" alt="${day.day.condition.text}">
                <span part="forecast-day-night-temp light-text">${nightTemp}${this.units.temperature}</span>
                <span part="forecast-day-temp">${dayTemp}${this.units.temperature}</span>
                <span part="forecast-day-wind" style="--_r:${windDegree}deg;">${this.createIcon(ICONS.arrowup, 'icon-lg')}${windSpeed} ${this.units.wind}</span>
              </li>
            `;
          }).join('') || ''}
        </ul>
      </div>
    `;
  }
}

customElements.define('weather-forecast-days', WeatherForecastDays);
