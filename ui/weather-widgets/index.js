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
		feelsLikeActual: 'Feels same as actual temperature',
		feelsLikeColder: 'Feels colder than actual temperature',
		feelsLikeWarmer: 'Feels warmer than actual temperature',
		forecastDays: 'Forecast for {{value}} days',
		forecastHours: 'Forecast for {{value}} hours',
		gusts: 'Gusts',
		humidity: 'Humidity',
		high: 'H',
		illumination: 'Illumination',
		low: 'L',
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
		visibilityVeryPoor: 'Very poor visibility',
		visibilityPoor: 'Poor visibility',
		visibilityModerate: 'Moderate visibility',
		visibilityGood: 'Good visibility',
		west: 'W',
		wind: 'Wind',
	}
};

const ICONS = {
	arrowup: 'M12 5l0 14, M18 11l-6 -6, M6 11l6 -6',
	calendar: 'M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z, M16 3v4, M8 3v4, M4 11h16, M7 14h.013, M10.01 14h.005, M13.01 14h.005, M16.015 14h.005, M13.015 17h.005, M7.01 17h.005, M10.01 17h.005',
	clock: 'M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0, M12 12h3.5, M12 7v5',
	eye: 'M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0, M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6',
	gauge: 'M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0, M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0, M13.41 10.59l2.59 -2.59, M7 12a5 5 0 0 1 5 -5',
	moon: 'M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z',
	precipitation: 'M10.708 2.372a2.382 2.382 0 0 0 -.71 .686l-4.892 7.26c-1.981 3.314 -1.22 7.466 1.767 9.882c2.969 2.402 7.286 2.402 10.254 0c2.987 -2.416 3.748 -6.569 1.795 -9.836l-4.919 -7.306c-.722 -1.075 -2.192 -1.376 -3.295 -.686z',
	ripple: 'M3 7c3 -2 6 -2 9 0s6 2 9 0, M3 17c3 -2 6 -2 9 0s6 2 9 0, M3 12c3 -2 6 -2 9 0s6 2 9 0',
	sun: 'M12 19a1 1 0 0 1 .993 .883l.007 .117v1a1 1 0 0 1 -1.993 .117l-.007 -.117v-1a1 1 0 0 1 1 -1z, M18.313 16.91l.094 .083l.7 .7a1 1 0 0 1 -1.32 1.497l-.094 -.083l-.7 -.7a1 1 0 0 1 1.218 -1.567l.102 .07z, M7.007 16.993a1 1 0 0 1 .083 1.32l-.083 .094l-.7 .7a1 1 0 0 1 -1.497 -1.32l.083 -.094l-.7 -.7a1 1 0 0 1 1.414 0z, M4 11a1 1 0 0 1 .117 1.993l-.117 .007h-1a1 1 0 0 1 -.117 -1.993l.117 -.007h1z, M21 11a1 1 0 0 1 .117 1.993l-.117 .007h-1a1 1 0 0 1 -.117 -1.993l.117 -.007h1z, M6.213 4.81l.094 .083l.7 .7a1 1 0 0 1 -1.32 1.497l-.094 -.083l-.7 -.7a1 1 0 0 1 1.217 -1.567l.102 .07z, M19.107 4.893a1 1 0 0 1 .083 1.32l-.083 .094l-.7 .7a1 1 0 0 1 -1.497 -1.32l.083 -.094l-.7 -.7a1 1 0 0 1 1.414 0z, M12 2a1 1 0 0 1 .993 .883l.007 .117v1a1 1 0 0 1 -1.993 .117l-.007 -.117v-1a1 1 0 0 1 1 -1z, M12 7a5 5 0 1 1 -4.995 5.217l-.005 -.217l.005 -.217a5 5 0 0 1 4.995 -4.783z',
	sunset: 'M4 16a1 1 0 0 1 0 2h-1a1 1 0 0 1 0 -2z, M21 16a1 1 0 0 1 0 2h-1a1 1 0 0 1 0 -2z, M6.307 9.893l.7 .7a1 1 0 0 1 -1.414 1.414l-.7 -.7a1 1 0 0 1 1.414 -1.414, M19.107 9.893a1 1 0 0 1 0 1.414l-.7 .7a1 1 0 0 1 -1.414 -1.414l.7 -.7a1 1 0 0 1 1.414 0, M12 2a1 1 0 0 1 1 1v3.584l1.293 -1.291a1 1 0 0 1 1.32 -.083l.094 .083a1 1 0 0 1 0 1.414l-3 3a.98 .98 0 0 1 -.767 .293l-.124 -.017l-.127 -.032l-.104 -.04l-.115 -.063a1 1 0 0 1 -.151 -.114l-3.026 -3.027a1 1 0 0 1 1.414 -1.414l1.293 1.292v-3.585a1 1 0 0 1 1 -1, M3 20h18a1 1 0 0 1 0 2h-18a1 1 0 0 1 0 -2, M12 12a5 5 0 0 1 4.583 7.002h-9.166a5 5 0 0 1 4.583 -7.002',
	temperature: 'M10 13.5a4 4 0 1 0 4 0v-8.5a2 2 0 0 0 -4 0v8.5, M10 9l4 0',
	wind: 'M5 8h8.5a2.5 2.5 0 1 0 -2.34 -3.24, M3 12h15.5a2.5 2.5 0 1 1 -2.34 3.24, M4 16h5.5a2.5 2.5 0 1 1 -2.34 3.24'
}

class WeatherWidgets extends HTMLElement {
	#metric; #root; #units;
	constructor() {
		super();
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
		this.#root = this.hasAttribute('noshadow') ? this : this.attachShadow({ mode: 'open' });

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
				const cssText = await response.text();
				if (this.hasAttribute('noshadow')) {
					// Check if we already added these styles
					const styleId = `weather-widgets-styles-${cssPath.replace(/[^\w]/g, '-')}`;
					if (!document.getElementById(styleId)) {
						const style = document.createElement('style');
						style.id = styleId;
						style.textContent = cssText;
						document.head.appendChild(style);
					}
				} else {
					const sheet = new CSSStyleSheet();
					sheet.replaceSync(cssText);
					this.shadowRoot.adoptedStyleSheets = [sheet];
				}
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
	 * Converts wind speed to the appropriate unit based on the system
	 * @private
	 * @param {number} speed - Wind speed in kph (metric) or mph (imperial)
	 * @returns {string} Formatted wind speed in m/s or mph
	 */
	#formatWindSpeed(speed) {
		if (this.#metric) {
			// Convert kph to m/s (divide by 3.6)
			return (speed / 3.6).toFixed(1);
		} else {
			return speed;
		}
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
			'feels-like': () => this.#renderFeelsLike(current),
			'forecast-hours': () => this.#renderForecastHours(location, forecast.forecastday),
			'forecast-days': () => this.#renderForecastDays(forecast.forecastday),
			'humidity': () => this.#renderHumidity(current),
			'moonphase': () => this.#renderMoonPhase(forecast.forecastday[0].astro, location),
			'overview': () => this.#renderOverview(location, current, forecast),
			'precipitation': () => this.#renderPrecipitation(current, location, forecast.forecastday),
			'pressure': () => this.#renderPressure(current),
			'sunphase': () => this.#renderSunPhase(forecast.forecastday[0].astro, current.last_updated),
			'temperature': () => this.#renderTemperature(current, forecast.forecastday),
			'uv': () => this.#renderUV(current),
			'visibility': () => this.#renderVisibility(current),
			'wind': () => this.#renderWind(current)
		};

		this.#root.innerHTML = this._widgets
			.map(widget => widgetRenderers[widget] ? widgetRenderers[widget]() : '')
			.join('');
	}

	#renderFeelsLike(current) {
		const actualTemp = this.#metric ? current.temp_c : current.temp_f;
		const feelsLikeTemp = this.#metric ? current.feelslike_c : current.feelslike_f;
		const tempDiff = feelsLikeTemp - actualTemp;
		const comparisonKey = Math.abs(tempDiff) < 1 ? 'feelsLikeActual' : tempDiff < 0 ? 'feelsLikeColder' : 'feelsLikeWarmer';
		return `
		<weather-widget part="feels-like-widget">
			<div part="feels-like widget">
				<h2 part="title">${this.#icon(ICONS.eye, 'icon feels-like-icon')}${this.#t('feelsLike')}</h2>
				<h3 part="header-lg">${feelsLikeTemp}${this.#units.temperature}</h3>
				<p part="light-text">${this.#t(comparisonKey)}</p>
			</div>
		</weather-widget>`;
	}

 	#renderForecastDays(forecast) {
		return `
		<weather-widget part="forecast-days-widget">
			<div part="forecast-days widget">
				<h4 part="title forecast-days-title">${this.#icon(ICONS.calendar, 'icon forecast-days-icon')}${this.#t('forecastDays', { value: forecast.length })}
					<span part="unit-switcher">°C | °F</span>
				</h4>
				<ul part="forecast-days-list">
					${forecast.map(day => {
						const dayTemp = this.#metric ? day.day.maxtemp_c : day.day.maxtemp_f;
						const nightTemp = this.#metric ? day.day.mintemp_c : day.day.mintemp_f;
						const date = new Date(day.date);
						const dayName = this.#formatDate(date, { weekday: 'short' });
						const shortDate = this.#formatDate(date, { day: 'numeric', month: 'numeric' });
						
						// Get wind speed and convert to appropriate units
						const windSpeed = this.#formatWindSpeed(this.#metric ? day.day.maxwind_kph : day.day.maxwind_mph);
						
						const windDegree = day.hour.length ? 
							day.hour.reduce((sum, hour) => sum + hour.wind_degree, 0) / day.hour.length : 
							0;
						
						return `
							<li part="forecast-day" title="${day.day.condition.text}">
								<strong part="forecast-day-name" title="${shortDate}">${dayName}</strong>
								<img part="forecast-day-icon condition-icon" src="https:${day.day.condition.icon}" alt="${day.day.condition.text}">
								<span part="forecast-day-night-temp light-text">${nightTemp}${this.#units.temperature}</span>
								<span part="forecast-day-temp">${dayTemp}${this.#units.temperature}</span>
								<span part="forecast-day-wind" style="--_r:${windDegree}deg;">${this.#icon(ICONS.arrowup, 'icon-lg')}${windSpeed}</span>
							</li>
						`;
					}).join('') || ''}
				</ul>
			</div>
		</weather-widget>`;
	}

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
		<weather-widget part="forecast-hours-widget">
			<div part="forecast-hours widget">
				<h4 part="title">${this.#icon(ICONS.clock, 'icon forecast-hours-icon')}${this.#t('forecastHours', { value: hours.length })}</h4>
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
			</div>
		</weather-widget>`;
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
				const x = dataIndex * (barWidth + gap) + (barWidth / 2);
				const y = isAutoTop ? 
					(height - bottom) - (item.value / max * graphHeight) - topOffset : topPadding - topOffset;
				return `<text text-anchor="middle" part="graph-text-top" x="${x}" y="${y}">${item.topLabel}</text>`;
			}).join('');

		// Generate bottom labels
		const bottomLabelsMarkup = data
			.filter((_, index) => index % bottomLabelInterval === 0)
			.slice(0, autoBottomLabels ? data.length : bottomLabels)
			.map((item, index) => {
				const dataIndex = index * bottomLabelInterval;
				const x = dataIndex * (barWidth + gap) + (barWidth / 2);
				return `<text text-anchor="middle" part="graph-text-bottom" x="${x}" y="${height - bottom + 10}">${item.bottomLabel}</text>`;
			}).join('');

		return `
			<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" part="graph${type ? '-' + type : ''}">
				${bars}
				${topLabelsMarkup}
				${bottomLabelsMarkup}
			</svg>`;
	}

	#renderHumidity(current) {
		const humidity = current.humidity;
		return `
		<weather-widget part="humidity-widget">
			<div part="humidity widget">
				<h2 part="title">${this.#icon(ICONS.ripple, 'icon humidity-icon')}${this.#t('humidity')}</h2>
				<h3 part="header-lg">${current.humidity}%</h3>
				<p part="header-sm">${this.#t('dewPoint', { value: this.#metric ? current.dewpoint_c : current.dewpoint_f })}</p>
			</div>
		</weather-widget>`;
	}

	#renderMoonPhase(astro, location) {
		const moonrise = this.#metric ? this.#to24Hour(astro.moonrise) : astro.moonrise;
		const moonset = this.#metric ? this.#to24Hour(astro.moonset) : astro.moonset;
		const hour = this.#get24HourTime(location.localtime, false);

		return `
		<weather-widget part="moonphase-widget">
			<div part="moonphase widget">
				<h4 part="title">${this.#icon(ICONS.moon, 'icon wind-icon')}${astro.moon_phase}</h4>
				<div part="moonphase-wrapper">
					<ul part="list">
						<li part="list-item"><strong part="list-item-key">${this.#t('moonrise')}</strong><span part="list-item-value">${moonrise}</span></li>
						<li part="list-item"><strong part="list-item-key">${this.#t('moonset')}</strong><span part="list-item-value">${moonset}</span></li>
						<li part="list-item"><strong part="list-item-key">${this.#t('illumination')}</strong><span part="list-item-value">${astro.moon_illumination}%</span></li>
					</ul>
					<moon-phase illumination="${astro.moon_illumination}" lat="${location.lat}" hour="${hour}" phase="${astro.moon_phase.toLowerCase()}"></moon-phase>
				</div>
			</div>
		</weather-widget>`;
	}

	#renderOverview(location, current, forecast) {
		const day = forecast.forecastday[0].day;
		return `
		<weather-widget part="overview-widget">
			<div part="overview widget">
				<h2 part="header-lg" title="${location.region}, ${location.country}">${location.name}</h2>
				<h3 part="header-xl">${this.#metric ? current.temp_c : current.temp_f}${this.#units.temperature}</h3>
				<ul part="overview-list light-text">
					<li>${this.#t('precipitation')}: ${this.#metric ? current.precip_mm : current.precip_in}${this.#units.presipitation}</li>
					<li>${this.#t('humidity')}: ${current.humidity}%</li>
					<li>${this.#t('wind')}: ${this.#formatWindSpeed(this.#metric ? current.wind_kph : current.wind_mph)} ${this.#units.wind}</li>
				</ul>
				<img part="condition-icon" src="https:${current.condition.icon}" alt="${current.condition.text}">
				<h4 part="header-md">${current.condition.text}</h4>
				<span part="overview-highlow light-text">
					${this.#t('high')}:${this.#metric ? day.maxtemp_c : day.maxtemp_f}${this.#units.temperature}
					${this.#t('low')}:${this.#metric ? day.mintemp_c : day.mintemp_f}${this.#units.temperature}</span>
			</div>
		</weather-widget>`;
	}


	#renderPrecipitation(current, location, forecast = {}) {
		const precipitation = this.#metric ? current.precip_mm : current.precip_in;
		return `
		<weather-widget part="precipitation-widget">
			<div part="precipitation widget">
				<h2 part="title">${this.#icon(ICONS.precipitation, 'icon humidity-icon')}${this.#t('precipitation')}</h2>
				<h3 part="header-lg">${precipitation}${this.#units.presipitation}</h3>
				${this.#renderGraph(
					this.#prepareGraphData(location, forecast, 'precipitation'), 
					{
						top: 10,
						topOffset: 5,
						bottom: 10,
						topLabels: 8,
						bottomLabels: 8,
						type: 'precipitation'
					}
				)}
			</div>
		</weather-widget>`;
	}

	#renderPressure(current) {
		const pressure = this.#metric ? current.pressure_mb : current.pressure_in;
		const minPressure = this.#metric ? 950 : 27;
		const maxPressure = this.#metric ? 1085 : 32;
		return `
		<weather-widget part="pressure-widget">
			<div part="pressure widget">
				<h4 part="title pressure-title">${this.#icon(ICONS.gauge, 'icon pressure-icon')}${this.#t('pressure')}</h4>
				<analog-gauge part="pressure-value" min=${minPressure} max=${maxPressure} value="${pressure}" label="${this.#units.pressure}" min-label="${this.#t('pressureLow')}" max-label="${this.#t('pressureHigh')}"></analog-gauge>
			</div>
		</weather-widget>`;
	}

	#renderSunPhase(astro, date) {
		const time = this.#get24HourTime(date);
		const sunset = this.#to24Hour(astro.sunset);
		const sunrise = this.#to24Hour(astro.sunrise);
		return `
		<weather-widget part="sunphase-widget">
			<div part="sunphase widget">
				<h4 part="title">${this.#icon(ICONS.sunset, 'icon sunset-icon')}${this.#t('sunset')}</h4>
				<h3 part="header-lg">${this.#metric ? sunset : astro.sunset}</h3>
				<sun-phase sunrise="${sunrise}" sunset="${sunset}" time="${time}"></sun-phase>
				<p>${this.#t('sunrise')}: ${this.#metric ? sunrise : astro.sunrise}</p>
			</div>
		</weather-widget>`;
	}

	#renderTemperature(current, forecast = {}) {
		const temperature = this.#metric ? current.temp_c : current.temp_f;
		return `
		<weather-widget part="temperature-widget">
			<div part="temperature widget">
				<h2 part="title">${this.#icon(ICONS.temperature, 'icon temperature-icon')}${this.#t('temperature')}</h2>
				<h3 part="header-lg">${temperature}${this.#units.temperature}</h3>
				${this.#renderGraph(
						this.#prepareGraphData(current, forecast, 'temperature'),
						{
							top: 'auto',
							bottom: 10,
							topLabels: 'auto',
							bottomLabels: 8,
							type: 'temperature'
						}
					)
				}
			</div>
		</weather-widget>`;
	}

	#renderUV(current) {
		const uvIndex = current.uv;
		const uvCategory = uvIndex < 3 ? 'uvLow' : 
											 uvIndex < 6 ? 'uvModerate' : 
											 uvIndex < 8 ? 'uvHigh' : 
											 uvIndex < 11 ? 'uvVeryHigh' : 'uvExtreme';

		return `
		<weather-widget part="uv-widget">
			<div part="uv widget">
				<h2 part="title">${this.#icon(ICONS.sun, 'icon uv-icon')}${this.#t('uv')}</h2>
				<hgroup>
					<h3 part="header-lg">${uvIndex}</h3>
					<h4 part="header-md">${this.#t(uvCategory)}</h4>
				</hgroup>
				<output value="${uvIndex}" part="uv-slider" style="--_p:${Math.min((uvIndex / 10) * 100, 100)}%"></output>
			</div>
		</weather-widget>`;
	}

	#renderVisibility(current) {
		const visibility = this.#metric ? current.vis_km : current.vis_miles;
		const thresholds = this.#metric ? { veryPoor: 1, poor: 4, moderate: 10 } : { veryPoor: 0.6, poor: 2.5, moderate: 6 };
		const visibilityKey = visibility < thresholds.veryPoor ? 'visibilityVeryPoor'
		: visibility < thresholds.poor ? 'visibilityPoor'
		: visibility < thresholds.moderate ? 'visibilityModerate'
		: 'visibilityGood';
		
		return `
		<weather-widget part="visibility-widget">
			<div part="visibility widget">
				<h4 part="title">${this.#icon(ICONS.eye, 'icon visibility-icon')}${this.#t('visibility')}</h4>
				<h3 part="header-lg">${visibility} ${this.#units.visibility}</h3>
				<p>${this.#t(visibilityKey)}</p>
			</div>
		</weather-widget>`;
	}

	#renderWind(current) {
		const windSpeed = this.#formatWindSpeed(this.#metric ? current.wind_kph : current.wind_mph);
		const gustSpeed = this.#formatWindSpeed(this.#metric ? current.gust_kph : current.gust_mph);
		
		return `
		<weather-widget part="wind-widget">
			<div part="wind widget">
				<h4 part="title wind-title">${this.#icon(ICONS.wind, 'icon wind-icon')}${this.#t('wind')}</h4>
				<div part="wind-wrapper">
					<ul part="list">
						<li part="list-item"><strong part="list-item-key">${this.#t('wind')}</strong><span part="list-item-value">${windSpeed} ${this.#units.wind}</span></li>
						<li part="list-item"><strong part="list-item-key">${this.#t('gusts')}</strong><span part="list-item-value">${gustSpeed} ${this.#units.wind}</span></li>
						<li part="list-item"><strong part="list-item-key">${this.#t('direction')}</strong><span part="list-item-value">${current.wind_degree}°${current.wind_dir}</span></li>
					</ul>
					<nav-compass degree="${current.wind_degree}" lang="${this._lang}" value="${windSpeed}" label="${this.#units.wind}" mode="bearing"></nav-compass>
				</div>
			</div>
		</weather-widget>`;
	}
}

customElements.define('weather-widgets', WeatherWidgets);
