// Create a stylesheet outside the component
const styles = new CSSStyleSheet();
styles.replaceSync(`
	:host {
		--weather-api-light-text: color-mix(in srgb, currentColor, 50% transparent);
		background: var(--weather-api-bg, light-dark(#EEE, #222));
		border-radius: var(--weather-api-bdrs, .66em);
		color: var(--weather-api-c, light-dark(#222, #EEE));
		container-type: inline-size;
		display: grid;
		font-family: var(--weather-api-ff, ui-sans-serif, system-ui);
		font-size: var(--weather-api-fs, clamp(.75rem, 3.5cqi, 1rem));
		padding: var(--weather-api-padding, 1em);
		row-gap: var(--weather-api-rg, 1em);
	}

	:host * {
		box-sizing: border-box;
	}

	h2, h3, h4 {
		margin: unset;
		text-box: text;
	}

	/* === Header === */
	:host::part(header) {
		display: grid;
		grid-template-columns: 1fr auto;
	}
	:host::part(hgroup) {
		align-content: start;
		display: grid;
		row-gap: var(--weather-api-header-rg, .5ch);
	}
	:host::part(location) {
		font-size: var(--weather-api-location-fs, clamp(1rem, 4cqi, 4rem));
		font-weight: var(--weather-api-location-fw, 300);
	}
	:host::part(temperature) {
		font-size: var(--weather-api-temperature-value-fs, clamp(1.625rem, 6.5cqi, 6.5rem));
		font-weight: var(--weather-api-temperature-value-fw, 400);
	}
	:host::part(feels-like) {
		font-size: var(--weather-api-feels-like-fs, inherit);
		font-weight: var(--weather-api-feels-like-fw, 500);
	}
	:host::part(date) {
		color: var(--weather-api-date-color, var(--weather-api-light-text));
		font-size: var(--weather-api-date-fs, inherit);
		font-weight: var(--weather-api-date-fw, 300);
		text-box: text;
	}

	/* === Condition === */
	:host::part(condition) {
		align-content: start;
		display: grid;
		justify-items: end;
		margin: 0;
		row-gap: var(--weather-api-header-rg, .5ch);
		text-align: end;
	}
	:host::part(condition-icon) {
		width: var(--weather-api-condition-icon-w, clamp(2rem, 10cqi, 4rem));
	}
	:host::part(condition-text) {
		font-size: var(--weather-api-condition-text-fs, inherit);
		text-box: text;
	}
	:host::part(lowhigh) {
		color: var(--weather-api-lowhigh-color, var(--weather-api-light-text));
		font-size: var(--weather-api-lowhigh-fs, inherit);
		text-box: text;
	}
	:host::part(wind) {
		align-items: center;
		display: flex;
		font-size: var(--weather-api-wind-fs, small);
	}
	:host::part(icon) {
		fill: none;
		height: 1.5rem;
		pointer-events: none;
		stroke: currentColor;
		stroke-width: 1.25;
		width: 1.5rem;
	}

/* === UV Index === */
	:host::part(uv-index) {
		background: var(--_bg);
		border-radius: var(--weather-api-uv-bdrs, .25em);
		color: var(--_c);
		font-size: small;
		padding: .25ch .5ch;
		text-box: text;
		text-wrap: nowrap;
	}
	:host::part(uv-0)  { --_bg: #55AF33; --_c: #FFF; }
	:host::part(uv-1)  { --_bg: #A0C61B; --_c: #FFF; }
	:host::part(uv-2)  { --_bg: #F7E98E; --_c: #000; }
	:host::part(uv-3)  { --_bg: #F6E301; --_c: #000; }
	:host::part(uv-4)  { --_bg: #FAB60D; --_c: #000; }
	:host::part(uv-5)  { --_bg: #F88D2F; --_c: #FFF; }
	:host::part(uv-6)  { --_bg: #F76D00; --_c: #FFF; }
	:host::part(uv-7)  { --_bg: #E53015; --_c: #FFF; }
	:host::part(uv-8)  { --_bg: #D90E21; --_c: #FFF; }
	:host::part(uv-9)  { --_bg: #D80010; --_c: #FFF; }
	:host::part(uv-10) { --_bg: #8A4F9E; --_c: #FFF; }

	/* === Footer === */
	:host::part(footer) {
		color: var(--weather-api-footer-color, var(--weather-api-light-text));
		font-size: var(--weather-api-footer-fs, 60%);
	}
	:host::part(footer-link) { color: inherit; }



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



	:host::part(forecast-graph) {
		fill: none;
		stroke: var(--weather-api-graph-color, #FFCC00);
		stroke-width: var(--weather-api-graph-stroke-width, 3);
	}
	
	:host::part(forecast-graph-fill) {
		fill: var(--weather-api-graph-fill, rgba(255, 204, 0, 0.2));
		stroke: none;
	}
	
	:host::part(forecast-temp) {
		fill: var(--weather-api-temp-color, var(--weather-api-light-text));
		font-family: inherit;
		font-size: var(--weather-api-temp-fs, 8px);
		text-anchor: middle;
		dominant-baseline: middle;
		stroke: none;
		stroke-width: 0;
	}

	:host::part(forecast-hour) {
		fill: var(--weather-api-hour-color, var(--weather-api-light-text));
		font-family: inherit;
		font-size: var(--weather-api-hour-fs, 7px);
		text-anchor: start;
		stroke: none;
		stroke-width: 0;
	}
`);

const i18n = {
	'en': {
		feelsLike: 'Feels like',
		wind: 'Wind',
		humidity: 'Humidity',
		precipitation: 'Precipitation',
		forecast: 'Forecast',
		day: 'Day',
		low: 'L',
		high: 'H',
		night: 'Night',
		poweredBy: 'Powered by',
		uvIndex: 'UV',
	}
};

class WeatherApi extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.adoptedStyleSheets = [styles];
		this._data = null;
		this._display = this.getAttribute('display') || 'current';
		this._locale = this.getAttribute('lang') || document.documentElement.lang || navigator.language;
		this._lang = this._locale.split('-')[0];
		this._i18n = { ...i18n };
		this._isMetric = this.#determineUnitSystem();
	}

	/**
	 * @param {{ [s: string]: any; } | ArrayLike<any>} customTranslations
	 */
	set i18n(customTranslations) {
		Object.entries(customTranslations).forEach(([lang, texts]) => {
			this._i18n[lang] = { ...this._i18n[lang] || {}, ...texts };
		});
		this._data && this.#render();
	}

	async connectedCallback() {
		try {
			if (!this.hasAttribute('url')) throw new Error('Missing URL attribute');
			const response = await fetch(this.getAttribute('url'));
			if (!response.ok) throw new Error('Failed to fetch data');
			this._data = await response.json();
			this.#render();
		} catch {}
	}

	#determineUnitSystem() {
		const units = this.getAttribute('units');
		return units ? units === 'metric' : !['en-US', 'en-LR', 'en-MM'].includes(navigator.language);
	}

	#formatDate(dateStr, options = {}) {
		const date = new Date(dateStr);
		return new Intl.DateTimeFormat(this._locale, options).format(date);
	}

	#t(key) {
		return this._i18n[this._lang]?.[key] || this._i18n.en?.[key] || key;
	}

	#render() {
		if (!this._data) return;
		
		const { location, current, forecast } = this._data;
		const isMetric = this._isMetric;

		const unitValues = {
			temperature: isMetric ? current.temp_c : current.temp_f,
			tempUnit: isMetric ? '°C' : '°F',
			feelsLike: isMetric ? current.feelslike_c : current.feelslike_f,
			wind: isMetric ? (current.wind_kph / 3.6).toFixed(1) : current.wind_mph,
			windUnit: isMetric ? 'm/s' : 'mph',
			precipitation: isMetric ? current.precip_mm : current.precip_in,
			precipUnit: isMetric ? 'mm' : 'in'
		};

		const formattedTime = this.#formatDate(location.localtime, { 
			weekday: 'long', 
			hour: '2-digit', 
			minute: '2-digit',
			hour12: !isMetric
		});

		const { temperature, tempUnit, feelsLike, wind, windUnit, precipitation, precipUnit } = unitValues;

		this.shadowRoot.innerHTML = `
		<header part="header">
			<hgroup part="hgroup">
				<h2 part="location" title="${location.region}, ${location.country}">${location.name}</h2>
				<h3 part="temperature">${temperature}${tempUnit}</h3>
				<h4 part="feels-like">${this.#t('feelsLike')}: ${feelsLike}${tempUnit}</h4>
				<div part="date">${formattedTime}</div>
			</hgroup>
			<figure part="condition">
				<img part="condition-icon" src="https:${current.condition.icon}" alt="${current.condition.text}">
				<figcaption part="condition-text">${current.condition.text}</figcaption>
				${forecast ? this.#renderLowHigh(forecast.forecastday) : ''}
				${forecast ? this.#renderAstro(forecast.forecastday[0].astro) : ''}
				<div part="wind">
					<svg part="icon" viewBox="0 0 24 24" style="rotate:${current.wind_degree + 180}deg;">
						<path d="M12 5l0 14"/><path d="M16 9l-4 -4"/><path d="M8 9l4 -4"/>
					</svg>
					${wind} ${windUnit}
				</div>
				<div part="uv-index uv-${Math.min(Math.round(current.uv), 10)}">${this.#t('uvIndex')}: ${current.uv}</div>
			</figure>
		</header>

		${this._display.includes('tempgraph') ? this.#renderTemperatureGraph(location, forecast.forecastday) : ''}
		${this._display.includes('forecast') ? this.#renderForecast(forecast.forecastday, isMetric, tempUnit) : ''}

		<footer part="footer">
			${this.#t('poweredBy')} <a href="https://www.weatherapi.com/" part="footer-link" target="_blank">WeatherAPI</a>
		</footer>`;
	}

	#renderLowHigh(forecast) {
		const day = forecast[0].day;
		const high = this._isMetric ? day.maxtemp_c : day.maxtemp_f;
		const low = this._isMetric ? day.mintemp_c : day.mintemp_f;
		const unit = this._isMetric ? '°C' : '°F';
		return `<small part="lowhigh">${this.#t('high')}:${high}${unit} ${this.#t('low')}:${low}${unit}</small>`
	}

	#renderAstro(astro) {
		const to24Hour = time => {
				const [_, hhmm, period] = time.match(/(\d+:\d+)\s*(AM|PM)/);
				let [hours, minutes] = hhmm.split(':');
				if (period === 'PM' && hours !== '12') hours = +hours + 12;
				if (period === 'AM' && hours === '12') hours = '00';
				return `${hours}:${minutes}`;
		};
		const sunrise = this._isMetric ? to24Hour(astro.sunrise) : astro.sunrise;
		const sunset = this._isMetric ? to24Hour(astro.sunset) : astro.sunset;
		return `<small part="astro">☀ ${sunrise} ☽ ${sunset}</small>`;
	}

 	#renderForecast(forecast, isMetric, tempUnit) {
		return `<ul part="forecast">
			${forecast.map(day => {
				const dayTemp = isMetric ? day.day.maxtemp_c : day.day.maxtemp_f;
				const nightTemp = isMetric ? day.day.mintemp_c : day.day.mintemp_f;
				const date = new Date(day.date);
				const dayName = this.#formatDate(date, { weekday: 'long' });
				const shortDate = this.#formatDate(date, { day: 'numeric', month: 'numeric' });
				
				return `
					<li part="day" title="${day.day.condition.text}">
						<strong part="day-name">${dayName}</strong>
						<em part="day-date">${shortDate}</em>
						<img part="day-icon" src="https:${day.day.condition.icon}" alt="${day.day.condition.text}">
						<h3 part="day-temp">${dayTemp}${tempUnit}</h3>
						<h4 part="night-temp">${nightTemp}${tempUnit}</h4>
					</li>
				`;
			}).join('') || ''}
		</ul>`;
	}

	#renderTemperatureGraph(location, days) {
		const tempKey = this._isMetric ? 'temp_c' : 'temp_f';
		const [minTemp, maxTemp] = days.reduce(
			([min, max], day) => [
				Math.min(min, Math.min(day.day[`max${tempKey}`], day.day[`min${tempKey}`])),
				Math.max(max, Math.max(day.day[`max${tempKey}`], day.day[`min${tempKey}`]))
			],
			[Infinity, -Infinity]
		);

		const localTime = new Date(location.localtime);
		const currentHour = localTime.getHours();

		const hoursArray = [];

		// Get hours from today
		const todayHours = days[0].hour.slice(currentHour);
		hoursArray.push(...todayHours);
		
		// If we need more hours to make 24, get them from tomorrow
		if (hoursArray.length < 24 && days.length > 1) {
			const tomorrowHours = days[1].hour.slice(0, 24 - hoursArray.length);
			hoursArray.push(...tomorrowHours);
		}

		// If no hours data, return empty string
		if (hoursArray.length === 0) return '';
		
		 // Reserve space at top (15px) and bottom (15px) for labels
		const topMargin = 15;
		const bottomMargin = 15;
		const graphHeight = 100 - topMargin - bottomMargin; // Actual height for the graph
		
		// Create points for polyline with adjusted y-coordinates to leave margins
		const points = hoursArray.map((hour, index) => {
			const temp = hour[tempKey];
			// Calculate x position with slight inset (5 units on each side)
			const x = 5 + ((index / (hoursArray.length - 1)) * 490);
			// Calculate y position with range topMargin to (100 - bottomMargin), inverted for SVG
			const normalizedTemp = (temp - minTemp) / (maxTemp - minTemp);
			const y = (100 - bottomMargin) - (normalizedTemp * graphHeight);
			return `${x},${y}`;
		}).join(' ');
		
		// Create polygon points by adding bottom corners to close the shape
		const polygonPoints = points + ` 495,${100 - bottomMargin} 5,${100 - bottomMargin}`;
		
		// Adjust temperature label positions and add hour labels
		const labelInterval = Math.floor(hoursArray.length / 8);
		const tempLabels = hoursArray
			.filter((_, index) => index % labelInterval === 0)
			.slice(0, 8) // Ensure we have max 8 labels
			.map((hour, index) => {
				const temp = hour[tempKey];
				const x = 5 + ((index * labelInterval) / (hoursArray.length - 1)) * 490;
				// Calculate y with the same normalization as for the points
				const normalizedTemp = (temp - minTemp) / (maxTemp - minTemp);
				const y = (100 - bottomMargin) - (normalizedTemp * graphHeight);
				
				// Format hour time for display
				const hourTime = new Date(hour.time);
				const formattedHour = hourTime.getHours().toString().padStart(2, '0');
				
				// Temperature label above points and hour label below the graph
				return `
					<text part="forecast-temp" x="${x}" y="${y - 7}">${Math.round(temp)}</text>
					<text part="forecast-hour" x="${x}" y="${100 - bottomMargin + 10}">${formattedHour}:00</text>
				`;
			}).join('');
		
		return `
			<svg viewBox="0 0 500 100" preserveAspectRatio="none" part="forecast-graph">
				<polygon points="${polygonPoints}" part="forecast-graph-fill"></polygon>
				<polyline points="${points}" vector-effect="non-scaling-stroke"></polyline>
				${tempLabels}
			</svg>`;
	}
}

customElements.define('weather-api', WeatherApi);
