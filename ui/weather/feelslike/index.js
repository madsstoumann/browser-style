import WeatherWidget from '../weather-widget/index.js';

const ICONS = {
	eye: 'M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0, M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6'
}

class WeatherFeelslike extends WeatherWidget {
	constructor() {
		super();
	}
	
	connectedCallback() {
		super.connectedCallback();
		this.loadStyles();
	}
	
	render() {
		if (!this._data || !this._data.current) {
			return;
		}

		const displayActualTemp = this.metric ? this._data.current.temp_c : this._data.current.temp_f;
		const displayFeelsLikeTemp = this.metric ? this._data.current.feelslike_c : this._data.current.feelslike_f;
		const actualTempC = this._data.current.temp_c;
		const feelsLikeTempC = this._data.current.feelslike_c;
		const tempDiffC = feelsLikeTempC - actualTempC;
		const comparisonKey = Math.abs(tempDiffC) < 1 ? 'feelsLikeActual' : tempDiffC < 0 ? 'feelsLikeColder' : 'feelsLikeWarmer';
		
		
		this.root.innerHTML = `
		<div part="widget">
			<h2 part="title">
				${this.createIcon(ICONS.eye, 'icon')}
				${this.hasAttribute('label') ? this.getAttribute('label') : this.translate('feelsLike')}
				${this.hasAttribute('switcher') ? this.renderUnitSwitcher() : ''}
			</h2>
			<h3 part="header-lg">${displayFeelsLikeTemp}${this.units.temperature}</h3>
			<p part="light-text">${this.translate(comparisonKey)}</p>
		</div>`;
	}
}

customElements.define('weather-feelslike', WeatherFeelslike);
