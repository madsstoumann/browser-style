// Create a stylesheet outside the component
const weatherStyles = new CSSStyleSheet();
weatherStyles.replaceSync(`
	:host {
		--weather-api-uv: #55AF33, #A0C61B, #F6E301, #FAB60D, #F0860E, #EA5916, #E53015, #D90E21, #E7338C, #7D59A1, #8B88C1;
		background: var(--weather-api-bg, light-dark(#EEE, #333));
		border-radius: var(--weather-api-bdrs, .66em);
		display: grid;
		font-family: var(--weather-api-ff, ui-sans-serif, system-ui);
		grid-template-columns: 1fr 1fr 1fr;
		padding: var(--weather-api-padding, 1em);
	}

	h2, h3, h4 {
		margin: unset;
		text-box: text;
	}

	:host::part(details) { grid-column: span 3; }
	:host::part(footer) { grid-column: span 3; }
	:host::part(header) { grid-column: span 2; }
	
	:host::part(forecast) {
		all: unset;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
	}
	:host::part(day) {
		display: grid;
		place-items: center;
		row-gap: 1ch;
		text-align: center;
	}
	:host::part(day-date) {
		font-size: var(--weather-api-day-date-fs, 80%);
		font-style: var(--weather-api-day-date-fs, normal);
		font-weight: var(--weather-api-day-date-fw, 300);
	
	}
	:host::part(day-name) {
		font-weight: var(--weather-api-day-fw, 500);
		text-transform: var(--weather-api-day-tt, uppercase);
	}
	:host::part(day-temp) {
		font-size: var(--weather-api-day-temp-fs, 200%);
		font-weight: var(--weather-api-day-temp-fw, 300);
	}
	:host::part(night-temp) {
		background: var(--weather-api-night-temp-bg, light-dark(#FEFEFE, #222));
		border-radius: var(--weather-api-night-temp-br, .25em);
		color: var(--weather-api-night-temp-color, inherit);
		font-size: var(--weather-api-night-temp-fs, 80%);
		font-weight: var(--weather-api-night-temp-fw, 400);
		padding: var(--weather-api-night-temp-padding, .5em);
	}

	:host::part(uv-index) {
		background: linear-gradient(var(--weather-api-uv)) no-repeat 0 calc(var(--_uv) * 100% / 10) / 100% calc(1px * infinity);
`);

// Default translations
const i18n = {
	'en': {
		feelsLike: 'Feels like',
		wind: 'Wind',
		humidity: 'Humidity',
		precipitation: 'Precipitation',
		forecast: 'Forecast',
		day: 'Day',
		night: 'Night',
		uvIndex: 'UV',
	}
};

// Weather App Web Component
class WeatherApp extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.adoptedStyleSheets = [weatherStyles];
		this._data = null;
		this._isMetric = this.determineUnitSystem();
		this._i18n = { ...i18n };
		this._lang = this.getAttribute('lang') || document.documentElement.lang || navigator.language;
	}

	/**
	 * @param {{ [s: string]: any; } | ArrayLike<any>} customTranslations
	 */
	set translations(customTranslations) {
		for (const [lang, texts] of Object.entries(customTranslations)) {
			if (!this._i18n[lang]) {
				this._i18n[lang] = {};
			}
			Object.assign(this._i18n[lang], texts);
		}
		if (this._data) this.render();
	}

	async connectedCallback() {
		const city = this.getAttribute('city');
		if (!city) {
			this.shadowRoot.innerHTML = '<em part="error">Please provide a city attribute</em>';
			return;
		}
		
		try {
			this._data = await this.fetchData(city);
			this.render();
		} catch (error) {
			console.error('Error fetching weather data:', error);
			this.shadowRoot.innerHTML = `<em part="error">Failed to load weather data for ${city}</em>`;
		}
	}

	determineUnitSystem() {
		const imperialLocales = ['en-US', 'en-LR', 'en-MM'];
		return !imperialLocales.includes(navigator.language);
	}

	async fetchData(city) {
		const mode = this.getAttribute('mode') || 'proxy';
		
		switch (mode) {
			case 'proxy':
				return this.fetchFromProxy(city);
			case 'direct':
				return this.fetchDirect(city);
			case 'local':
				return this.fetchLocal();
			default:
				throw new Error(`Unknown mode: ${mode}`);
		}
	}
	async fetchFromProxy(city) {
		const apiType = 'weather';
		const params = { q: city, days: 3 };
		
		// Get endpoint from attribute or use default
		const endpoint = this.getAttribute('endpoint') || 'current';
		params.endpoint = endpoint;
		
		// Try to parse additional params if provided
		try {
			const additionalParams = this.getAttribute('params');
			if (additionalParams) {
				const parsedParams = JSON.parse(additionalParams);
				Object.assign(params, parsedParams);
			}
		} catch (e) {
			console.warn('Failed to parse params attribute:', e);
		}
		
		const apiUrl = this.getAttribute('url') || '';
		
		// Construct URL with API type and parameters
		const urlParams = new URLSearchParams(params);
		urlParams.set('api', apiType);
		
		const response = await fetch(
			`${apiUrl}?${urlParams}`,
			{ method: 'GET' }
		);
		
		if (!response.ok) {
			throw new Error('API request failed');
		}
		
		return response.json();
	}
	
	// Direct mode: Use direct API access with template URL
	async fetchDirect(city) {
		let urlTemplate = this.getAttribute('url-template');
		if (!urlTemplate) {
			throw new Error('url-template attribute is required for direct mode');
		}
		
		// Replace template variables
		urlTemplate = urlTemplate.replace('{city}', encodeURIComponent(city));
		
		const apiKey = this.getAttribute('api-key');
		if (apiKey) {
			urlTemplate = urlTemplate.replace('{apiKey}', apiKey);
		}
		
		// Try to add query parameters from params attribute
		try {
			const additionalParams = this.getAttribute('params');
			if (additionalParams) {
				const parsedParams = JSON.parse(additionalParams);
				const searchParams = new URLSearchParams();
				
				for (const [key, value] of Object.entries(parsedParams)) {
					searchParams.append(key, value);
				}
				
				// Add params to URL, handling existing query string
				const separator = urlTemplate.includes('?') ? '&' : '?';
				urlTemplate += `${separator}${searchParams.toString()}`;
			}
		} catch (e) {
			console.warn('Failed to parse params attribute:', e);
		}
		
		const response = await fetch(urlTemplate, { method: 'GET' });
		
		if (!response.ok) {
			throw new Error('API request failed');
		}
		
		return response.json();
	}
	
	// Local mode: Use a local JSON file
	async fetchLocal() {
		const url = this.getAttribute('url') || '';
		const response = await fetch(url);
		
		if (!response.ok) {
			throw new Error('Failed to load local data');
		}
		
		return response.json();
	}

	formatDate(dateStr) {
		try {
			const date = new Date(dateStr);
			return new Intl.DateTimeFormat(this._lang, {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			}).format(date);
		} catch (e) {
			console.warn('Date formatting error:', e);
			return dateStr;
		}
	}

	render() {
		if (!this._data) return;
		const { location, current, forecast } = this._data;
		const temperature = this._isMetric ? current.temp_c : current.temp_f;
		const tempUnit = this._isMetric ? '°C' : '°F';
		const feelsLike = this._isMetric ? current.feelslike_c : current.feelslike_f;
		const wind = this._isMetric ? current.wind_kph : current.wind_mph;
		const windUnit = this._isMetric ? 'km/h' : 'mph';
		const precipitation = this._isMetric ? current.precip_mm : current.precip_in;
		const precipUnit = this._isMetric ? 'mm' : 'in';
		
		// Format the local time with Intl
		const formattedTime = this.formatDate(location.localtime);
		
		 // Calculate the UV index for the CSS variable (rounded and clamped between 0-10)
		const uvValue = Math.min(10, Math.max(0, Math.round(current.uv)));
		
		// Update HTML without including styles
		this.shadowRoot.innerHTML = `
		<header part="header">
			<h2 part="location">${location.name}</h2>
			<em part="country">${location.country}</em>
			<em part="date">${formattedTime}</em>
		</header>

		<figure part="temperature">
			<h3 part="temperature-value">${temperature}${tempUnit}</h3>
			<img part="icon" src="https:${current.condition.icon}" alt="${current.condition.text}">
			<span part="uv-index" style="--_uv:${uvValue};">${this.t('uvIndex')}: ${current.uv}</span>
			<figcaption part="condition">${current.condition.text}</figcaption>
		</figure>

		<dl part="details">
			<dt part="feels-like">${this.t('feelsLike')}</dt>
			<dd part="feels-like-value">${feelsLike}${tempUnit}</dd>
			<dt part="wind">${this.t('wind')}</dt>
			<dd part="wind-value">${wind} ${windUnit} ${current.wind_dir}</dd>
			<dt part="humidity">${this.t('humidity')}</dt>
			<dd part="humidity-value">${current.humidity}%</dd>
			<dt part="precipitation">${this.t('precipitation')}</dt>
			<dd part="precipitation-value">${precipitation} ${precipUnit}</dd>
		</dl>

		<footer part="footer">
		<h3 part="forecast-title">${this.t('forecast')}</h3>
			<ul part="forecast">
				${forecast ? forecast.forecastday.map(day => {
					const dayTemp = this._isMetric ? day.day.maxtemp_c : day.day.maxtemp_f;
					const nightTemp = this._isMetric ? day.day.mintemp_c : day.day.mintemp_f;
					const dayName = new Intl.DateTimeFormat(
						this._lang,
						{ weekday: 'long' }
					).format(new Date(day.date));
					
					// Format short numeric date
					const shortDate = new Intl.DateTimeFormat(
						this._lang,
						{ day: 'numeric', month: 'numeric' }
					).format(new Date(day.date));
					return `
						<li part="day" title="${day.day.condition.text}">
							<strong part="day-name">${dayName}</strong>
							<em part="day-date">${shortDate}</em>
							<img part="day-icon" src="https:${day.day.condition.icon}" alt="${day.day.condition.text}">
							<h3 part="day-temp">${dayTemp}${tempUnit}</h3>
							<h4 part="night-temp">${nightTemp}${tempUnit}</h4>
						</li>
					`;
				}).join('') : ''}
			</ul>
			<small part="footer-text"><a href="https://www.weatherapi.com/" target="_blank">WeatherAPI</a></small>
		</footer>`;
	}

	t(key) {
		if (this._i18n[this._lang] && this._i18n[this._lang][key]) {
			return this._i18n[this._lang][key];
		}
		return this._i18n['en'][key] || key;
	}

}

customElements.define('weather-app', WeatherApp);
