import WeatherWidget from '../weather-widget/index.js';
import '../moon-phase/index.js';

const styles = `
	:host::part(moonphase-wrapper) {
		gap: 1rem;
	}
	moon-phase {
		--moon-phase-mask-bg: var(--weather-widget-bgc);
		--moon-phase-mask-opacity: 0.85;
		--moon-phase-blur: 3px;
		--moon-phase-filter: grayscale(.5) brightness(1.05);
		margin: 0 auto;
		max-width: 200px;
	}
	@container (width > 400px) {
		:host::part(moonphase-wrapper) {
			display: grid;
			grid-template-columns: 1fr 1fr;
		}
		moon-phase {
			min-width: 200px;
		}
	}
`;

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

const ICONS = {
  moon: 'M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z'
};

class WeatherMoonphase extends WeatherWidget {
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
    const location = this._data.location;
    const moonrise = this.metric ? this.to24Hour(astro.moonrise) : astro.moonrise;
    const moonset = this.metric ? this.to24Hour(astro.moonset) : astro.moonset;
    const hour = this.get24HourTime(location.localtime, false);

    this.root.innerHTML = `
      <div part="widget">
        <h4 part="title">
          ${this.createIcon(ICONS.moon, 'icon')}
          ${this.hasAttribute('label') ? this.getAttribute('label') : astro.moon_phase}
          ${this.hasAttribute('switcher') ? this.renderUnitSwitcher('24h', '12h') : ''}
        </h4>
        <div part="moonphase-wrapper">
          <ul part="list">
            <li part="list-item"><strong part="list-item-key">${this.translate('moonrise')}</strong><span part="list-item-value">${moonrise}</span></li>
            <li part="list-item"><strong part="list-item-key">${this.translate('moonset')}</strong><span part="list-item-value">${moonset}</span></li>
            <li part="list-item"><strong part="list-item-key">${this.translate('illumination')}</strong><span part="list-item-value">${astro.moon_illumination}%</span></li>
          </ul>
          <moon-phase 
            illumination="${astro.moon_illumination}" 
            lat="${location.lat}" 
            hour="${hour}" 
            phase="${astro.moon_phase.toLowerCase()}">
          </moon-phase>
        </div>
      </div>
    `;
  }
}

customElements.define('weather-moonphase', WeatherMoonphase);
