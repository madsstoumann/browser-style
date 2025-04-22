import WeatherWidget from '../weather-widget/index.js';
import '../sun-phase/index.js';

const styles = `
  sun-phase {
    --sun-phase-bdrs: .5rem;
    margin-block: 1ch;
  }
`;

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

const ICONS = {
  sunset: 'M4 16a1 1 0 0 1 0 2h-1a1 1 0 0 1 0 -2z, M21 16a1 1 0 0 1 0 2h-1a1 1 0 0 1 0 -2z, M6.307 9.893l.7 .7a1 1 0 0 1 -1.414 1.414l-.7 -.7a1 1 0 0 1 1.414 -1.414, M19.107 9.893a1 1 0 0 1 0 1.414l-.7 .7a1 1 0 0 1 -1.414 -1.414l.7 -.7a1 1 0 0 1 1.414 0, M12 2a1 1 0 0 1 1 1v3.584l1.293 -1.291a1 1 0 0 1 1.32 -.083l.094 .083a1 1 0 0 1 0 1.414l-3 3a.98 .98 0 0 1 -.767 .293l-.124 -.017l-.127 -.032l-.104 -.04l-.115 -.063a1 1 0 0 1 -.151 -.114l-3.026 -3.027a1 1 0 0 1 1.414 -1.414l1.293 1.292v-3.585a1 1 0 0 1 1 -1, M3 20h18a1 1 0 0 1 0 2h-18a1 1 0 0 1 0 -2, M12 12a5 5 0 0 1 4.583 7.002h-9.166a5 5 0 0 1 4.583 -7.002'
};

class WeatherSunphase extends WeatherWidget {
  constructor() {
    super();
  }
  
  connectedCallback() {
    super.connectedCallback();
    this.loadStyles(sheet);
  }

  render() {
    if (!this._data || !this._data.forecast || !this._data.forecast.forecastday || !this._data.forecast.forecastday.length) {
      return;
    }

    const astro = this._data.forecast.forecastday[0].astro;
    const currentTime = this.get24HourTime(this._data.location.localtime);
    const sunset = this.metric ? this.to24Hour(astro.sunset) : astro.sunset;
    const sunrise = this.metric ? this.to24Hour(astro.sunrise) : astro.sunrise;

    this.root.innerHTML = `
      <div part="widget">
        <h4 part="title">
          ${this.createIcon(ICONS.sunset, 'icon')}
          ${this.hasAttribute('label') ? this.getAttribute('label') : this.translate('sunset')}
          ${this.hasAttribute('switcher') ? this.renderUnitSwitcher('24h', '12h') : ''}
        </h4>
        <div part="sunphase-wrapper">
          <h3 part="header-lg">${this.metric ? sunset : astro.sunset}</h3>
          <sun-phase 
            sunrise="${this.to24Hour(astro.sunrise)}" 
            sunset="${this.to24Hour(astro.sunset)}" 
            time="${currentTime}"
            units="${this.metric ? 'metric' : 'imperial'}">
          </sun-phase>
          <p part="light-text">${this.translate('sunrise')}: ${this.metric ? sunrise : astro.sunrise}</p>
        </div>
      </div>
    `;
  }
}

customElements.define('weather-sunphase', WeatherSunphase);
