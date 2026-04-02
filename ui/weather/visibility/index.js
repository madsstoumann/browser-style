import WeatherWidget from '../weather-widget/index.js';

const ICONS = {
	eye: 'M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0, M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6'
}

class WeatherVisibility extends WeatherWidget {
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

		const visibility = this.metric ? this._data.current.vis_km : this._data.current.vis_miles;
		const thresholds = this.metric ? { veryPoor: 1, poor: 4, moderate: 10 } : { veryPoor: 0.6, poor: 2.5, moderate: 6 };
		const visibilityKey = visibility < thresholds.veryPoor ? 'visibilityVeryPoor'
		: visibility < thresholds.poor ? 'visibilityPoor'
		: visibility < thresholds.moderate ? 'visibilityModerate'
		: 'visibilityGood';
		
		
		this.root.innerHTML = `
		<div part="widget">
			<h2 part="title">
				${this.createIcon(ICONS.eye, 'icon')}
				${this.hasAttribute('label') ? this.getAttribute('label') : this.translate('visibility')}
				${this.hasAttribute('switcher') ? this.renderUnitSwitcher('km', 'mi') : ''}
			</h2>
			<h3 part="header-lg">${visibility} ${this.units.visibility}</h3>
				<p>${this.translate(visibilityKey)}</p>
		</div>`;
	}
}

customElements.define('weather-visibility', WeatherVisibility);
