import WeatherWidget from '../weather-widget/index.js';

const styles = `
	:host::part(forecast-hours) {
		overflow: auto clip;
		scrollbar-color: #0001 #0000;
		scrollbar-width: thin;
		user-select: none;
	}
	:host::part(forecast-hours-scroll) {
		column-gap: var(--weather-api-forecast-hours-gap, 1ch);
		display: flex;
		margin: 0;
		padding: 0;
	}
	:host::part(forecast-hour-item) {
		display: grid;
		place-items: center;
	}
	:host::part(forecast-hour-time){
		color: var(--weather-api-hour-color, var(--weather-api-light-text));
	}
	:host::part(forecast-hour-temp) {
		font-weight: var(--weather-api-hour-temp-fw, 500);
	}
`;

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

const ICONS = {
  clock: 'M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0, M12 12h3.5, M12 7v5'
};

class WeatherForecastHours extends WeatherWidget {
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

    const localTime = new Date(this._data.location.localtime);
    const currentHour = localTime.getHours();

    const hours = [];
    const today = this._data.forecast.forecastday[0].hour.slice(currentHour);
    hours.push(...today);

    // If less than 24 hours total, get hours from next day
    if (hours.length < 24 && this._data.forecast.forecastday.length > 1) {
      const tomorrow = this._data.forecast.forecastday[1].hour.slice(0, 24 - hours.length);
      hours.push(...tomorrow);
    }
    
    this.root.innerHTML = `
      <div part="widget">
        <h4 part="title">
          ${this.createIcon(ICONS.clock, 'icon')}
          ${this.hasAttribute('label') ? this.getAttribute('label') : this.translate('forecastHours', { value: hours.length })}
          ${this.hasAttribute('switcher') ? this.renderUnitSwitcher() : ''}
        </h4>
        <div part="forecast-hours">
          <ul part="forecast-hours-scroll">
          ${hours.map(hour => {
            const hourTime = new Date(hour.time);
            return `
              <li part="forecast-hour-item" title="${hour.condition.text}">
                <span part="forecast-hour-time">${this.formatHour(hourTime)}</span>
                <img part="condition-icon" src="https:${hour.condition.icon}" alt="${hour.condition.text}">
                <span part="forecast-hour-temp">${this.metric ? hour.temp_c : hour.temp_f}${this.units.temperature}</span>
              </li>
            `;
          }).join('') || ''}
          </ul>
        </div>
      </div>
    `;
  }
}

customElements.define('weather-forecast-hours', WeatherForecastHours);
