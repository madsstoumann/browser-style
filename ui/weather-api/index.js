import '../analog-gauge/index.js';
import '../moon-phase/index.js';
import '../nav-compass/index.js';
import '../sun-phase/index.js';

const i18n = {
	'en': {
		day: 'Day',
		dewPoint: 'Dew point is {{value}}°',
		direction: 'Direction',
		east: 'E',
		feelsLike: 'Feels like',
		forecastDays: 'Forecast for {{value}} days',
		forecastHours: 'Forecast for {{value}} hours',
		gusts: 'Gusts',
		humidity: 'Humidity',
		high: 'H',
		low: 'L',
		moonillumination: 'Moon illumination',
		moonrise: 'Moonrise',
		moonset: 'Moonset',
		night: 'Night',
		north: 'N',
		precipitation: 'Precipitation',
		pressure: 'Pressure',
		pressureHigh: 'High',
		pressureLow: 'Low',
		south: 'S',
		sunrise: 'Sunrise',
		sunset: 'Sunset',
		temperature: 'Temperature',
		uv: 'UV',
		uvLow: 'Low',
		uvModerate: 'Moderate',
		uvHigh: 'High',
		uvVeryHigh: 'Very High',
		uvExtreme: 'Extreme',
		visibility: 'Visibility',
		west: 'W',
		wind: 'Wind',
	}
};

const ICONS = {
	calendarWeek: 'M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z, M16 3v4, M8 3v4, M4 11h16, M7 14h.013, M10.01 14h.005, M13.01 14h.005, M16.015 14h.005, M13.015 17h.005, M7.01 17h.005, M10.01 17h.005',
	clock: 'M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0, M12 12h3.5, M12 7v5',
	eye: 'M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0, M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6',
	gauge: 'M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0, M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0, M13.41 10.59l2.59 -2.59, M7 12a5 5 0 0 1 5 -5',
	moon: 'M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z',
	precipitation: 'M10.708 2.372a2.382 2.382 0 0 0 -.71 .686l-4.892 7.26c-1.981 3.314 -1.22 7.466 1.767 9.882c2.969 2.402 7.286 2.402 10.254 0c2.987 -2.416 3.748 -6.569 1.795 -9.836l-4.919 -7.306c-.722 -1.075 -2.192 -1.376 -3.295 -.686z',
	ripple: 'M3 7c3 -2 6 -2 9 0s6 2 9 0, M3 17c3 -2 6 -2 9 0s6 2 9 0, M3 12c3 -2 6 -2 9 0s6 2 9 0',
	sun: 'M12 19a1 1 0 0 1 .993 .883l.007 .117v1a1 1 0 0 1 -1.993 .117l-.007 -.117v-1a1 1 0 0 1 1 -1z, M18.313 16.91l.094 .083l.7 .7a1 1 0 0 1 -1.32 1.497l-.094 -.083l-.7 -.7a1 1 0 0 1 1.218 -1.567l.102 .07z, M7.007 16.993a1 1 0 0 1 .083 1.32l-.083 .094l-.7 .7a1 1 0 0 1 -1.497 -1.32l.083 -.094l.7 -.7a1 1 0 0 1 1.414 0z, M4 11a1 1 0 0 1 .117 1.993l-.117 .007h-1a1 1 0 0 1 -.117 -1.993l.117 -.007h1z, M21 11a1 1 0 0 1 .117 1.993l-.117 .007h-1a1 1 0 0 1 -.117 -1.993l.117 -.007h1z, M6.213 4.81l.094 .083l.7 .7a1 1 0 0 1 -1.32 1.497l-.094 -.083l-.7 -.7a1 1 0 0 1 1.217 -1.567l.102 .07z, M19.107 4.893a1 1 0 0 1 .083 1.32l-.083 .094l-.7 .7a1 1 0 0 1 -1.497 -1.32l.083 -.094l-.7 -.7a1 1 0 0 1 1.414 0z, M12 2a1 1 0 0 1 .993 .883l.007 .117v1a1 1 0 0 1 -1.993 .117l-.007 -.117v-1a1 1 0 0 1 1 -1z, M12 7a5 5 0 1 1 -4.995 5.217l-.005 -.217l.005 -.217a5 5 0 0 1 4.995 -4.783z',
	sunrise: 'M4 16a1 1 0 0 1 0 2h-1a1 1 0 0 1 0 -2z, M12 12a5 5 0 0 1 5 5a1 1 0 0 1 -1 1h-8a1 1 0 0 1 -1 -1a5 5 0 0 1 5 -5, M21 16a1 1 0 0 1 0 2h-1a1 1 0 0 1 0 -2z, M6.307 9.893l.7 .7a1 1 0 0 1 -1.414 1.414l-.7 -.7a1 1 0 0 1 1.414 -1.414, M19.107 9.893a1 1 0 0 1 0 1.414l-.7 .7a1 1 0 0 1 -1.414 -1.414l.7 -.7a1 1 0 0 1 1.414 0, M12.707 2.293l3 3a1 1 0 1 1 -1.414 1.414l-1.293 -1.292v3.585a1 1 0 0 1 -.883 .993l-.117 .007a1 1 0 0 1 -1 -1v-3.586l-1.293 1.293a1 1 0 0 1 -1.414 -1.414l2.958 -2.96a1 1 0 0 1 .15 -.135l.127 -.08l.068 -.033l.11 -.041l.12 -.029c.3 -.055 .627 .024 .881 .278, M3 20h18a1 1 0 0 1 0 2h-18a1 1 0 0 1 0 -2, M12 12a5 5 0 0 1 4.583 7.002h-9.166a5 5 0 0 1 4.583 -7.002',
	sunset: 'M4 16a1 1 0 0 1 0 2h-1a1 1 0 0 1 0 -2z, M21 16a1 1 0 0 1 0 2h-1a1 1 0 0 1 0 -2z, M6.307 9.893l.7 .7a1 1 0 0 1 -1.414 1.414l-.7 -.7a1 1 0 0 1 1.414 -1.414, M19.107 9.893a1 1 0 0 1 0 1.414l-.7 .7a1 1 0 0 1 -1.414 -1.414l.7 -.7a1 1 0 0 1 1.414 0, M12 2a1 1 0 0 1 1 1v3.584l1.293 -1.291a1 1 0 0 1 1.32 -.083l.094 .083a1 1 0 0 1 0 1.414l-3 3a.98 .98 0 0 1 -.767 .293l-.124 -.017l-.127 -.032l-.104 -.04l-.115 -.063a1 1 0 0 1 -.151 -.114l-3.026 -3.027a1 1 0 0 1 1.414 -1.414l1.293 1.292v-3.585a1 1 0 0 1 1 -1, M3 20h18a1 1 0 0 1 0 2h-18a1 1 0 0 1 0 -2, M12 12a5 5 0 0 1 4.583 7.002h-9.166a5 5 0 0 1 4.583 -7.002',
	temperature: 'M10 13.5a4 4 0 1 0 4 0v-8.5a2 2 0 0 0 -4 0v8.5, M10 9l4 0',
	wind: 'M5 8h8.5a2.5 2.5 0 1 0 -2.34 -3.24, M3 12h15.5a2.5 2.5 0 1 1 -2.34 3.24, M4 16h5.5a2.5 2.5 0 1 1 -2.34 3.24'
}

class WeatherApi extends HTMLElement {
	#metric; #units;
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.#loadStyles();
		this._data = null;
		this._locale = this.getAttribute('lang') || document.documentElement.lang || navigator.language;
		this._lang = this._locale.split('-')[0];
		this._i18n = { ...i18n };

		this.#metric = this.#determineUnitSystem();
		this._widgets = this.getAttribute('widgets')?.split(' ') || [];
		
		// Initialize units
		this.#units = {
			humidity: this.#metric ? 'g/m³' : 'g/ft³',
			presipitation: this.#metric ? 'mm' : 'in',
			pressure: this.#metric ? 'hPa' : 'inHg',
			temperature: this.#metric ? '°C' : '°F',
			visibility: this.#metric ? 'km' : 'miles',
			wind: this.#metric ? 'm/s' : 'mph',
		};
	}

	get basePath() {
		return new URL('.', import.meta.url).href;
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

	/**
	 * Converts time from 12-hour format (AM/PM) to 24-hour format
	 * @private
	 * @param {string} time - Time string in "HH:MM AM/PM" format
	 * @returns {string} Time in 24-hour format (HH:MM)
	 */
	#to24Hour(time) {
		const [_, hhmm, period] = time.match(/(\d+:\d+)\s*(AM|PM)/);
		let [hours, minutes] = hhmm.split(':');
		if (period === 'PM' && hours !== '12') hours = +hours + 12;
		if (period === 'AM' && hours === '12') hours = '00';
		return `${hours}:${minutes}`;
	}

	/**
	 * Formats an hour according to the user's unit system preference
	 * @private
	 * @param {Date} date - The date object containing the hour to format
	 * @returns {string} Formatted hour string (24h for metric, 12h for imperial)
	 */
	#formatHour(date) {
		if (this.#metric) {
			return `${date.getHours().toString().padStart(2, '0')}:00`;
		} else {
			const hours = date.getHours();
			const period = hours >= 12 ? 'PM' : 'AM';
			const hour12 = hours % 12 || 12;
			return `${hour12}${period}`;
		}
	}

	#formatDate(dateStr, options = {}) {
		const date = new Date(dateStr);
		return new Intl.DateTimeFormat(this._locale, options).format(date);
	}

	#get24HourTime(date, minutes = true) {
		return new Date(date).toLocaleTimeString('en-US', {
			hour12: false,
			hour: '2-digit',
			minute: minutes ? '2-digit' : undefined
		});
	}

	#icon(paths, part) {
    return `<svg viewBox="0 0 24 24"${part ? ` part="${part}"` : ''}>${
      paths.split(',').map(path => `<path d="${path}"></path>`).join('')
    }</svg>`;
  }

	async #loadStyles() {
    try {
      const cssPath = this.getAttribute('styles') || 
        (this.basePath ? `${this.basePath}index.css` : 'index.css');
      const response = await fetch(cssPath);
      if (response.ok) {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(await response.text());
        this.shadowRoot.adoptedStyleSheets = [sheet];
      }
    } catch (_) {}
  }

	#t(key, values = {}) {
		let text = this._i18n[this._lang]?.[key] || this._i18n.en?.[key] || key;
		// Replace any {{placeholder}} with corresponding values
		if (values && Object.keys(values).length) {
			text = text.replace(/\{\{([^}]+)\}\}/g, (match, placeholder) => {
				return values[placeholder] !== undefined ? values[placeholder] : match;
			});
		}
		return text;
	}

	/**
 * Prepares data array for graph rendering
 * @private
 * @param {Object} location - Location object containing localtime
 * @param {Array} days - Array of daily forecasts, each containing hourly data
 * @param {string} type - Type of data to display (precipitation, temperature, etc.)
 * @returns {Array} Array of objects with value, topLabel and bottomLabel properties
 */
	#prepareGraphData(location, days, type = 'precipitation') {
		const localTime = new Date(location.localtime);
		const currentHour = localTime.getHours();
		const hoursArray = [];
		const todayHours = days[0].hour.slice(currentHour);
		let key, unit;

		hoursArray.push(...todayHours);

		if (hoursArray.length < 24 && days.length > 1) {
			const tomorrowHours = days[1].hour.slice(0, 24 - hoursArray.length);
			hoursArray.push(...tomorrowHours);
		}
		if (hoursArray.length === 0) return [];

		switch(type) {
			case 'precipitation':
				key = this.#metric ? 'precip_mm' : 'precip_in';
				unit = this.#units.presipitation;
				break;
			case 'temperature':
				key = this.#metric ? 'temp_c' : 'temp_f';
				unit = '°'; //this.#units.temperature;
				break;
			default:
				key = this.#metric ? 'temp_c' : 'temp_f';
				unit = this.#units.temperature;
		}

		return hoursArray.map(hour => {
			const value = hour[key];
			const hourTime = new Date(hour.time);
			
			return {
				value,         // The value to use for height calculations
				topLabel: `${value}${unit}`, // What to show in top label
				bottomLabel: this.#formatHour(hourTime), // What to show in bottom label
			};
		});
	}

	#render() {
		if (!this._data) return;
		const { location, current, forecast } = this._data;
		
		const widgetRenderers = {
			'overview': () => this.#renderOverview(location, current, forecast),
			'forecast-hours': () => this.#renderForecastHours(location, forecast.forecastday),
			'forecast-days': () => this.#renderForecastDays(forecast.forecastday),
			'humidity': () => this.#renderHumidity(current),
			'moonphase': () => this.#renderMoonPhase(forecast.forecastday[0].astro, location),
			'precipitation-sm': () => this.#renderPrecipitation(current),
			'precipitation-lg': () => this.#renderPrecipitation(location, forecast.forecastday, 'lg'),
			'pressure': () => this.#renderPressure(current),
			'sunset': () => this.#renderSunset(forecast.forecastday[0].astro, current.last_updated),
			'temperature': () => this.#renderTemperature(current),
			'temperature-lg': () => this.#renderTemperature(current, forecast.forecastday, 'lg'),
			'uv': () => this.#renderUV(current),
			'visibility': () => this.#renderVisibility(current),
			'wind': () => this.#renderWind(current)
		};
		
		this.shadowRoot.innerHTML = this._widgets
			.map(widget => widgetRenderers[widget] ? widgetRenderers[widget]() : '')
			.join('');
	}

	#renderLowHigh(forecast) {
		const day = forecast[0].day;
		const high = this.#metric ? day.maxtemp_c : day.maxtemp_f;
		const low = this.#metric ? day.mintemp_c : day.mintemp_f;
		const unit = this.#metric ? '°C' : '°F';
		return `<small part="lowhigh">${this.#t('high')}:${high}${unit} ${this.#t('low')}:${low}${unit}</small>`
	}

	#renderAstro(astro) {
		const sunrise = this.#metric ? this.#to24Hour(astro.sunrise) : astro.sunrise;
		const sunset = this.#metric ? this.#to24Hour(astro.sunset) : astro.sunset;
		return `<small part="astro">☀ ${sunrise} ☽ ${sunset}</small>`;
	}

	#renderFeelsLike(current) {
		return ``;
	}

	/**
	 * Renders a weather forecast for multiple days
	 * @private
	 * @param {Object[]} forecast - Array of forecast data objects
	 * @returns {string} HTML string containing the formatted weather forecast
	 */
 	#renderForecastDays(forecast) {
		return `
		<div part="forecast-days widget">
			<h4 part="title forecast-days-title">${this.#icon(ICONS.calendarWeek, 'icon forecast-days-icon')}${this.#t('forecastDays', { value: forecast.length })}</h4>
			<ul part="forecast-days-wrapper">
				${forecast.map(day => {
					const dayTemp = this.#metric ? day.day.maxtemp_c : day.day.maxtemp_f;
					const nightTemp = this.#metric ? day.day.mintemp_c : day.day.mintemp_f;
					const date = new Date(day.date);
					const dayName = this.#formatDate(date, { weekday: 'short' });
					const shortDate = this.#formatDate(date, { day: 'numeric', month: 'numeric' });
					
					return `
						<li part="forecast-day" title="${day.day.condition.text}">
							<strong part="forecast-day-name" title="${shortDate}">${dayName}</strong>
							<img part="forecast-day-icon condition-icon" src="https:${day.day.condition.icon}" alt="${day.day.condition.text}">
							<span part="forecast-day-night-temp">${nightTemp}${this.#units.temperature}</span>
							<span part="forecast-day-temp">${dayTemp}${this.#units.temperature}</span>
						</li>
					`;
				}).join('') || ''}
			</ul>
		</div>`;
	}

	/**
	 * Renders forecast hours for a given location.
	 * Takes hours from current hour until end of day, and if less than 24 hours,
	 * adds hours from next day to complete 24-hour forecast.
	 * @private
	 * @param {Object} location - Location object containing localtime
	 * @param {Array} days - Array of daily forecasts, each containing hourly data
	 * @returns {string} HTML string containing the forecast hours widget
	 */
	#renderForecastHours(location, days) {
		const localTime = new Date(location.localtime);
		const currentHour = localTime.getHours();
		const hours = [];
		const today = days[0].hour.slice(currentHour);
		hours.push(...today);

		if (hours.length < 24 && days.length > 1) {
			const tomorrow = days[1].hour.slice(0, 24 - hours.length);
			hours.push(...tomorrow);
		}

		return `
		<div part="forecast-hours widget">
			<h4 part="title forecast-hours-title">${this.#icon(ICONS.clock, 'icon forecast-hours-icon')}${this.#t('forecastHours', { value: hours.length })}</h4>
			<ul part="forecast-hours-scroll">
			${hours.map(hour => {
				const hourTime = new Date(hour.time);
				return `
					<li part="forecast-hour-item" title="${hour.condition.text}">
						<span part="forecast-hour-time">${this.#formatHour(hourTime)}</span>
						<img part="condition-icon" src="https:${hour.condition.icon}" alt="${hour.condition.text}">
						<span part="forecast-hour-temp">${this.#metric ? hour.temp_c : hour.temp_f}${this.#units.temperature}</span>
					</li>
				`;
			}).join('') || ''}
			</ul>
		</div>`;
	}

	/**
	 * Renders an SVG bar graph with customizable settings
	 * @param {Array<{value: number, topLabel: string, bottomLabel: string}>} data - Array of objects containing value and label data
	 * @param {Object} [settings={}] - Optional settings object
	 * @returns {string} SVG markup string or empty string if no data
	 */
	#renderGraph(data, settings = {}) {
		if (!data || data.length === 0) return '';
		
		// Default settings with object destructuring
		const {
			bottom = 10,
			bottomLabels = 8,
			gap = 2,
			height = 100,
			top = 10,
			topLabels = 8,
			topOffset = 5, 
			type = '',
			width = 500
		} = settings;

		// Calculate max value for scaling
		const max = Math.max(...data.map(item => item.value));

		// Calculate graph dimensions
		const isAutoTop = top === "auto";
		const topPadding = isAutoTop ? 20 : top;
		const graphHeight = height - topPadding - bottom;
		
		// Calculate label intervals
		const autoTopLabels = topLabels === "auto";
		const autoBottomLabels = bottomLabels === "auto";
		const topLabelInterval = autoTopLabels ? 1 : Math.floor(data.length / topLabels);
		const bottomLabelInterval = autoBottomLabels ? 1 : Math.floor(data.length / bottomLabels);

		// Calculate bar dimensions
		const barWidth = width / data.length - gap;

		// Generate bars
		const bars = data.map((item, index) => {
			const x = index * (barWidth + gap);
			const barHeight = item.value === 0 ? 0 : Math.max(1, (item.value / max) * graphHeight);
			const y = (height - bottom) - barHeight;
			return `<rect part="graph-bar" rx="2" x="${x}" y="${y}" width="${barWidth}" height="${barHeight+1}"></rect>`;
		}).join('');

		// Generate top labels
		const topLabelsMarkup = data
			.filter((_, index) => index % topLabelInterval === 0)
			.slice(0, autoTopLabels ? data.length : topLabels)
			.map((item, index) => {
				const dataIndex = index * topLabelInterval;
				const x = dataIndex * (barWidth + gap);
				const y = isAutoTop ? 
					(height - bottom) - (item.value / max * graphHeight) - topOffset : topPadding - topOffset;
				return `<text part="graph-text-top" x="${x}" y="${y}">${item.topLabel}</text>`;
			}).join('');

		// Generate bottom labels
		const bottomLabelsMarkup = data
			.filter((_, index) => index % bottomLabelInterval === 0)
			.slice(0, autoBottomLabels ? data.length : bottomLabels)
			.map((item, index) => {
				const dataIndex = index * bottomLabelInterval;
				const x = dataIndex * (barWidth + gap);
				return `<text part="graph-text-bottom" x="${x}" y="${height - bottom + 10}">${item.bottomLabel}</text>`;
			}).join('');

		return `
			<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" part="graph${type ? '-' + type : ''}">
				${bars}
				${topLabelsMarkup}
				${bottomLabelsMarkup}
			</svg>`;
	}

	/**
	 * Renders the humidity widget with current humidity data
	 * @private
	 * @param {Object} current - The current weather data object
	 * @returns {string} HTML string containing the humidity widget markup
	 */
	#renderHumidity(current) {
		const humidity = current.humidity;
		return `
			<div part="humidity widget widget-sm">
				<h2 part="title humidity-title">${this.#icon(ICONS.ripple, 'icon humidity-icon')}${this.#t('humidity')}</h2>
				<h3 part="humidity-value header-lg">${current.humidity}%</h3>
				<p part="humidity-depoint header-sm">${this.#t('dewPoint', { value: this.#metric ? current.dewpoint_c : current.dewpoint_f })}</p>
			</div>`;
	}

	#renderMoonPhase(astro, location) {
		const moonrise = this.#metric ? this.#to24Hour(astro.moonrise) : astro.moonrise;
		const moonset = this.#metric ? this.#to24Hour(astro.moonset) : astro.moonset;
		const hour = this.#get24HourTime(location.localtime, false);

		return `
		<div part="moonphase widget">
			<h4 part="title moonphase-title">${this.#icon(ICONS.moon, 'icon wind-icon')}${astro.moon_phase}</h4>
			<div part="moonphase-wrapper">
				<ul part="list">
					<li part="list-item"><strong part="list-item-key">${this.#t('moonrise')}</strong><span part="list-item-value">${moonrise}</span></li>
					<li part="list-item"><strong part="list-item-key">${this.#t('moonset')}</strong><span part="list-item-value">${moonset}</span></li>
				</ul>
				<moon-phase part="moon-phase" illumination="${astro.moon_illumination}" lat="${location.lat}" hour="${hour}" phase="${astro.moon_phase.toLowerCase()}"></moon-phase>
			</div>
		</div>`;
	}

	#renderOverview(location, current, forecast) {
		const tempUnit = this.#metric ? '°C' : '°F';
		const formattedTime = this.#formatDate(location.localtime, { 
			weekday: 'long', 
			hour: '2-digit', 
			minute: '2-digit',
			hour12: !this.#metric
		});

		return `
		<div part="overview widget">
			<hgroup part="overview-group">
				<h2 part="overview-location" title="${location.region}, ${location.country}">${location.name}</h2>
				<h3 part="overview-temperature">${this.#metric ? current.temp_c : current.temp_f}${tempUnit}</h3>
				<h4 part="overview-feels-like">${this.#t('feelsLike')}: ${this.#metric ? current.feelslike_c : current.feelslike_f}${tempUnit}</h4>
				<div part="overview-date">${formattedTime}</div>
			</hgroup>
			<figure part="overview-condition">
				<img part="condition-icon" src="https:${current.condition.icon}" alt="${current.condition.text}">
				<figcaption part="overview-condition-text">${current.condition.text}</figcaption>
				${forecast ? this.#renderLowHigh(forecast.forecastday) : ''}
				${forecast ? this.#renderAstro(forecast.forecastday[0].astro) : ''}
				<div part="overview-wind">
					<svg part="icon" viewBox="0 0 24 24" style="rotate:${current.wind_degree + 180}deg;">
						<path d="M12 5l0 14"/><path d="M16 9l-4 -4"/><path d="M8 9l4 -4"/>
					</svg>
					${this.#metric ? (current.wind_kph / 3.6).toFixed(1) : current.wind_mph} ${this.#metric ? 'm/s' : 'mph'}
				</div>
				<div part="overview-uv-index uv-${Math.min(Math.round(current.uv), 10)}">${this.#t('uv')}: ${current.uv}</div>
			</figure>
		</div>`;
	}

	#renderPrecipitation(current, forecast = {}, size = 'sm') {
		const precipitation = this.#metric ? current.precip_mm : current.precip_in;
		return `
			<div part="precipitation-${size} widget widget-sm">
				<h2 part="title precipitation-title">${this.#icon(ICONS.precipitation, 'icon humidity-icon')}${this.#t('precipitation')}</h2>
				${size === 'lg' ? 
					this.#renderGraph(
						this.#prepareGraphData(current, forecast, 'precipitation'), 
						{
							top: 10,
							topOffset: 5,
							bottom: 10,
							topLabels: 8,
							bottomLabels: 8,
							type: 'precipitation'
						}
					) : 
					`<h3 part="humidity-value header-lg">${precipitation}${this.#units.presipitation}</h3>`
				}
			</div>`;
	}

	/**
	 * Renders the pressure widget with an analog gauge
	 * @private
	 * @param {Object} current - The current weather data object
	 * @returns {string} HTML string containing the pressure widget markup
	 */
	#renderPressure(current) {
		const pressure = this.#metric ? current.pressure_mb : current.pressure_in;
		const minPressure = this.#metric ? 950 : 27;
		const maxPressure = this.#metric ? 1085 : 32;
		return `
			<div part="pressure widget">
				<h4 part="title pressure-title">${this.#icon(ICONS.gauge, 'icon pressure-icon')}${this.#t('pressure')}</h4>
				<analog-gauge part="pressure-value" min=${minPressure} max=${maxPressure} value="${pressure}" label="${this.#units.pressure}" min-label="${this.#t('pressureLow')}" max-label="${this.#t('pressureHigh')}"></analog-gauge>
			</div>`;
	}

	#renderSunset(astro, date) {
		const time = this.#get24HourTime(date);
		const sunset = this.#to24Hour(astro.sunset);
		const sunrise = this.#to24Hour(astro.sunrise);
		return `
			<div part="sunset widget">
				<h4 part="title sunset-title">${this.#icon(ICONS.sunset, 'icon sunset-icon')}${this.#t('sunset')}</h4>
				<h3 part="sunset-value header-lg">${this.#metric ? sunset : astro.sunset}</h3>
				<sun-phase part="sun-phase" sunrise="${sunrise}" sunset="${sunset}" time="${time}"></sun-phase>
				<p>${this.#t('sunrise')}: ${this.#metric ? sunrise : astro.sunrise}</p>
			</div>`;
	}

	#renderTemperature(current, forecast = {}, size = 'sm') {
		const temperature = this.#metric ? current.temp_c : current.temp_f;
		return `
			<div part="temperature-${size} widget">
				<h2 part="title precipitation-title">${this.#icon(ICONS.temperature, 'icon temperature-icon')}${this.#t('temperature')}</h2>
				${size === 'lg' ? 
					this.#renderGraph(
						this.#prepareGraphData(current, forecast, 'temperature'),
						{
							top: 'auto',
							bottom: 10,
							topLabels: 'auto',
							bottomLabels: 8,
							type: 'temperature'
						}
					) : 
					`<h3 part="temperature-value header-lg">${temperature}${this.#units.temperature}</h3>`
				}
			</div>`;
	}

	/**
	 * Renders a UV index widget with category and visual indicator
	 * @private
	 * @param {Object} current - The current weather data object
	 * @returns {string} HTML markup for the UV widget
	 */
	#renderUV(current) {
		const uvIndex = current.uv;
		const uvCategory = uvIndex < 3 ? 'uvLow' : 
											 uvIndex < 6 ? 'uvModerate' : 
											 uvIndex < 8 ? 'uvHigh' : 
											 uvIndex < 11 ? 'uvVeryHigh' : 'uvExtreme';

		return `
			<div part="uv widget widget-sm">
				<h2 part="title uv-title">${this.#icon(ICONS.sun, 'icon uv-icon')}${this.#t('uv')}</h2>
				<hgroup part="uv-wrapper">
					<h3 part="uv-value header-lg">${uvIndex}</h3>
					<h4 part="uv-category header-md">${this.#t(uvCategory)}</h4>
				</hgroup>
				<output value="${uvIndex}" part="uv-slider" style="--_p:${Math.min((uvIndex / 10) * 100, 100)}%"></output>
			</div>`;
	}

	/**
	 * Renders the visibility widget with current visibility conditions
	 * @private
	 * @param {Object} current - The current weather data object
	 * @returns {string} HTML string containing the visibility widget markup
	 */
	#renderVisibility(current) {
		const visibility = this.#metric ? current.vis_km : current.vis_miles;
		return `
			<div part="visibility widget widget-sm">
				<h4 part="title visibility-title">${this.#icon(ICONS.eye, 'icon visibility-icon')}${this.#t('visibility')}</h4>
				<h3 part="visibility-value header-lg">${visibility} ${this.#units.visibility}</h3>
				<p>Perfectly clear view</p>
			</div>`;
	}

	/**
	 * Renders the wind information section of the weather widget
	 * @private
	 * @param {Object} current - The current weather data object
	 * @returns {string} HTML markup for the wind widget section
	 */
	#renderWind(current) {
		const gusts = this.#metric ? current.gust_kph : current.gust_mph;
		const wind = this.#metric ? current.wind_kph : current.wind_mph;
		return `
			<div part="wind widget">
				<h4 part="title wind-title">${this.#icon(ICONS.wind, 'icon wind-icon')}${this.#t('wind')}</h4>
				<div part="wind-wrapper">
					<ul part="list">
						<li part="list-item"><strong part="list-item-key">${this.#t('wind')}</strong><span part="list-item-value">${wind} ${this.#units.wind}</span></li>
						<li part="list-item"><strong part="list-item-key">${this.#t('gusts')}</strong><span part="list-item-value">${gusts} ${this.#units.wind}</span></li>
						<li part="list-item"><strong part="list-item-key">${this.#t('direction')}</strong><span part="list-item-value">${current.wind_degree}°${current.wind_dir}</span></li>
					</ul>
					<nav-compass degree="${current.wind_degree}" lang="${this._lang}" value="${wind}" label="${this.#units.wind}" mode="bearing"></nav-compass>
				</div>
			</div>`;
	}

}

customElements.define('weather-api', WeatherApi);
