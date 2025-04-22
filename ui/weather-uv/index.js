import WeatherWidget from '../weather-widget/index.js';

const styles = `
	:host::part(uv-slider) {
		align-items: center;
		background: linear-gradient(to right, #55AF33, #A0C61B, #F7E98E, #F6E301, #FAB60D, #F88D2F, #F76D00, #E53015, #D90E21, #D80010, #8A4F9E);
		border-radius: 1ch;
		display: flex;
		height: 1ch;
		margin-block-start: var(--weather-widget-p);
		position: relative;
		width: 100%;
	}
	output[part="uv-slider"]::after {
		aspect-ratio: 1;
		background-color: rgba(255,255,255,.8);
		border: 2px solid var(--weather-widget-bgc);
		border-radius: 50%;
		box-sizing: border-box;
		content: "";
		display: block;
		inset-inline-start: var(--_p, 0%);
		position: absolute;
		width: 1.25ch;
	}
`;

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

const ICONS = {
	sun: 'M12 19a1 1 0 0 1 .993 .883l.007 .117v1a1 1 0 0 1 -1.993 .117l-.007 -.117v-1a1 1 0 0 1 1 -1z, M18.313 16.91l.094 .083l.7 .7a1 1 0 0 1 -1.32 1.497l-.094 -.083l-.7 -.7a1 1 0 0 1 1.218 -1.567l.102 .07z, M7.007 16.993a1 1 0 0 1 .083 1.32l-.083 .094l-.7 .7a1 1 0 0 1 -1.497 -1.32l.083 -.094l-.7 -.7a1 1 0 0 1 1.414 0z, M4 11a1 1 0 0 1 .117 1.993l-.117 .007h-1a1 1 0 0 1 -.117 -1.993l.117 -.007h1z, M21 11a1 1 0 0 1 .117 1.993l-.117 .007h-1a1 1 0 0 1 -.117 -1.993l.117 -.007h1z, M6.213 4.81l.094 .083l.7 .7a1 1 0 0 1 -1.32 1.497l-.094 -.083l-.7 -.7a1 1 0 0 1 1.217 -1.567l.102 .07z, M19.107 4.893a1 1 0 0 1 .083 1.32l-.083 .094l-.7 .7a1 1 0 0 1 -1.497 -1.32l.083 -.094l-.7 -.7a1 1 0 0 1 1.414 0z, M12 2a1 1 0 0 1 .993 .883l.007 .117v1a1 1 0 0 1 -1.993 .117l-.007 -.117v-1a1 1 0 0 1 1 -1z, M12 7a5 5 0 1 1 -4.995 5.217l-.005 -.217l.005 -.217a5 5 0 0 1 4.995 -4.783z'
};

class WeatherUv extends WeatherWidget {
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

		const uvIndex = parseFloat(this._data.current.uv, 10);
		const uvCategory = uvIndex < 3 ? 'uvLow' : 
											 uvIndex < 6 ? 'uvModerate' : 
											 uvIndex < 8 ? 'uvHigh' : 
											 uvIndex < 11 ? 'uvVeryHigh' : 'uvExtreme';

		this.root.innerHTML = `
			<div part="widget">
				<h2 part="title">${this.createIcon(ICONS.sun, 'icon')}
					${this.hasAttribute('label') ? this.getAttribute('label') : this.translate('uv')}
				</h2>
				<hgroup>
					<h3 part="header-lg">${uvIndex}</h3>
					<h4 part="header-md">${this.translate(uvCategory)}</h4>
				</hgroup>
				<output value="${uvIndex}" part="uv-slider" style="--_p:${Math.min((uvIndex / 10) * 100, 100)}%"></output>
			</div>`;

	}
}

customElements.define('weather-uv', WeatherUv);
