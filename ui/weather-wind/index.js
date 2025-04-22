import WeatherWidget from '../weather-widget/index.js';
import '../nav-compass/index.js';

const styles = `
  :host::part(wind-wrapper) {
		column-gap: var(--weather-api-wind-gap, 1rem);
		display: grid;
	}
	nav-compass {
		--nav-compass-bg: var(--weather-api-widget-bgc);
		--nav-compass-c: var(--weather-api-widget-c);
		margin: 0 auto;
		max-width: 300px;
	}
	@container (width > 400px) {
		:host::part(wind-wrapper), [part~="wind-wrapper"] {
			grid-template-columns: 1fr 1fr;
		}
	}
`;

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

const ICONS = {
  wind: 'M5 8h8.5a2.5 2.5 0 1 0 -2.34 -3.24, M3 12h15.5a2.5 2.5 0 1 1 -2.34 3.24, M4 16h5.5a2.5 2.5 0 1 1 -2.34 3.24'
};

class WeatherWind extends WeatherWidget {
  constructor() {
    super();
  }
  
  connectedCallback() {
    super.connectedCallback();
    this.loadStyles(sheet);
  }

  render() {
    if (!this._data || !this._data.current) {
      return;
    }
    
    const current = this._data.current;
    const windSpeed = this.formatWindSpeed(this.metric ? current.wind_kph : current.wind_mph);
    const gustSpeed = this.formatWindSpeed(this.metric ? current.gust_kph : current.gust_mph);
    
    this.root.innerHTML = `
      <div part="widget">
        <h4 part="title">
          ${this.createIcon(ICONS.wind, 'icon')}
          ${this.hasAttribute('label') ? this.getAttribute('label') : this.translate('wind')}
          ${this.hasAttribute('switcher') ? this.renderUnitSwitcher('m/s', 'mph') : ''}
        </h4>
        <div part="wind-wrapper">
          <ul part="list">
            <li part="list-item"><strong part="list-item-key">${this.translate('wind')}</strong><span part="list-item-value">${windSpeed} ${this.units.wind}</span></li>
            <li part="list-item"><strong part="list-item-key">${this.translate('gusts')}</strong><span part="list-item-value">${gustSpeed} ${this.units.wind}</span></li>
            <li part="list-item"><strong part="list-item-key">${this.translate('direction')}</strong><span part="list-item-value">${current.wind_degree}°${current.wind_dir}</span></li>
          </ul>
          <nav-compass 
            degree="${current.wind_degree}" 
            lang="${this._lang}" 
            value="${windSpeed}" 
            label="${this.units.wind}" 
            mode="bearing">
          </nav-compass>
        </div>
      </div>
    `;
  }
}

customElements.define('weather-wind', WeatherWind);
