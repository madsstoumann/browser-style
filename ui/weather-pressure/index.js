import WeatherWidget from '../weather-widget/index.js';
import '../analog-gauge/index.js';

const styles = `
	analog-gauge {
		--analog-gauge-needle-bg: currentColor;
		--analog-gauge-segments: 10;
		margin: 0 auto;
		max-width: 300px;
	}
`;

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

const ICONS = {
  gauge: 'M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0, M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0, M13.41 10.59l2.59 -2.59, M7 12a5 5 0 0 1 5 -5'
};

class WeatherPressure extends WeatherWidget {
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

    const minPressureMetric = 950;
    const maxPressureMetric = 1085;
    const minPressureImperial = 27;
    const maxPressureImperial = 32;

    const normalizedPosition = (current.pressure_mb - minPressureMetric) / (maxPressureMetric - minPressureMetric);
    const displayValue = this.metric ? current.pressure_mb : current.pressure_in;
    const displayMinValue = this.metric ? minPressureMetric : minPressureImperial;
    const displayMaxValue = this.metric ? maxPressureMetric : maxPressureImperial;
    const positionValue = displayMinValue + normalizedPosition * (displayMaxValue - displayMinValue);
    
    this.root.innerHTML = `
      <div part="widget">
        <h4 part="title">
          ${this.createIcon(ICONS.gauge, 'icon')}
          ${this.hasAttribute('label') ? this.getAttribute('label') : this.translate('pressure')}
          ${this.hasAttribute('switcher') ? this.renderUnitSwitcher('hPa', 'inHg') : ''}
        </h4>
        <analog-gauge 
          part="pressure-value" 
          min="${displayMinValue}" 
          max="${displayMaxValue}" 
          value="${positionValue.toFixed(2)}" 
          display-value="${displayValue}"
          label="${this.units.pressure}" 
          min-label="${this.translate('pressureLow')}" 
          max-label="${this.translate('pressureHigh')}">
        </analog-gauge>
      </div>
    `;
  }
}

customElements.define('weather-pressure', WeatherPressure);
