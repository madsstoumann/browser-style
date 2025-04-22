import { translationRegistry, defaultTranslations } from './translations.js';

/**
 * Base WeatherWidget component that provides common functionality for all weather components.
 * This serves as the foundation for specific weather widgets like temperature, wind, etc.
 */
class WeatherWidget extends HTMLElement {
  #root;
  #metric;

  /**
   * Define which attributes to observe for changes
   */
  static get observedAttributes() {
    return ['units', 'url'];
  }

  constructor() {
    super();
    this._data = null;
    this._locale = this.getAttribute('lang') || document.documentElement.lang || navigator.language;
    this._lang = this._locale.split('-')[0];
    this.#metric = this.#determineUnitSystem();
    
    // Initialize with default translations
    this._i18n = { ...defaultTranslations };
    
    // Register with translation registry for updates if in standalone mode
    if (!this.closest('weather-widgets')) {
      translationRegistry.registerComponent(this);
    }
  }

  /**
   * Lifecycle methods
   */
  
  connectedCallback() {
    this.#root = this.attachShadow({ mode: 'open' });
    
    // Check for URL attribute and fetch data if present
    const url = this.getAttribute('url');
    if (url) {
      this.fetchData(url);
    }
  }
  
  disconnectedCallback() {
    // Unregister from translation registry when removed from DOM
    translationRegistry.unregisterComponent(this);
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    if (name === 'units') {
      this.#metric = this.#determineUnitSystem();
      if (this.isConnected && this._data) {
        this.render();
      }
    } else if (name === 'url' && newValue) {
      this.fetchData(newValue);
    }
  }

  /**
   * Getters and Setters
   */
  
  get data() {
    return this._data;
  }
  
  set data(newData) {
    this._data = newData;
    if (this.isConnected) {
      this.render();
    }
  }
  
  get metric() {
    return this.#metric;
  }
  
  get units() {
    return {
      humidity: this.#metric ? 'g/m³' : 'g/ft³',
      presipitation: this.#metric ? 'mm' : 'in',
      pressure: this.#metric ? 'hPa' : 'inHg',
      temperature: this.#metric ? '°C' : '°F',
      visibility: this.#metric ? 'km' : 'miles',
      wind: this.#metric ? 'm/s' : 'mph',
    };
  }
  
  get root() {
    return this.#root;
  }
  
  get basePath() {
    return new URL('.', import.meta.url).href;
  }

  /**
   * Public methods
   */

  async fetchData(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch data: ${response.status}`);
      const data = await response.json();
      this.data = data;
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }
  }
  
  async loadStyles(componentSheet = null) {
    try {
      const cssPath = this.getAttribute('styles') || 
        (this.basePath ? `${this.basePath}index.css` : 'index.css');
      const response = await fetch(cssPath);
      if (response.ok) {
        const cssText = await response.text();
        const baseSheet = new CSSStyleSheet();
        baseSheet.replaceSync(cssText);
        this.shadowRoot.adoptedStyleSheets = componentSheet ? 
          [baseSheet, componentSheet] : [baseSheet];
      }
    } catch (error) {
      // Silently fail if styles cannot be loaded
    }
  }
  
  setI18n(i18n) {
    this._i18n = i18n;
  }
  
  updateData(data) {
    this._data = data;
    this.render();
  }

  /**
   * Utility methods
   */
  
  createIcon(paths, part) {
    if (!paths) return '';
    return `<svg viewBox="0 0 24 24"${part ? ` part="${part}"` : ''}>${
      paths.split(',').map(path => `<path d="${path}"></path>`).join('')
    }</svg>`;
  }
  
  formatDate(date, options = {}) {
    return new Intl.DateTimeFormat(this._locale, options).format(date);
  }
  
  /**
   * Converts time from 12-hour format (AM/PM) to 24-hour format
   * @param {string} time - Time string in "HH:MM AM/PM" format
   * @returns {string} Time in 24-hour format (HH:MM)
   */
  to24Hour(time) {
    const [_, hhmm, period] = time.match(/(\d+:\d+)\s*(AM|PM)/);
    let [hours, minutes] = hhmm.split(':');
    if (period === 'PM' && hours !== '12') hours = +hours + 12;
    if (period === 'AM' && hours === '12') hours = '00';
    return `${hours}:${minutes}`;
  }
  
  /**
   * Gets the current time in 24-hour format
   * @param {string} dateStr - Date string
   * @param {boolean} minutes - Whether to include minutes
   * @returns {string} Time in 24-hour format
   */
  get24HourTime(dateStr, minutes = true) {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: minutes ? '2-digit' : undefined
    });
  }
  
  /**
   * Formats an hour according to the user's unit system preference
   * @param {Date} date - The date object containing the hour to format
   * @returns {string} Formatted hour string (24h for metric, 12h for imperial)
   */
  formatHour(date) {
    if (this.metric) {
      return `${date.getHours().toString().padStart(2, '0')}:00`;
    } else {
      const hours = date.getHours();
      const period = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours % 12 || 12;
      return `${hour12}${period}`;
    }
  }
  
  formatWindSpeed(speed) {
    if (this.#metric) {
      // Convert kph to m/s (divide by 3.6)
      return (speed / 3.6).toFixed(1);
    } else {
      return speed;
    }
  }
  
  /**
   * Renders a unit switcher with customizable labels
   * @param {string} metricLabel - Label for metric units
   * @param {string} imperialLabel - Label for imperial units
   * @returns {string} HTML markup for unit switcher
   */
  renderUnitSwitcher(metricLabel = '°C', imperialLabel = '°F') {
    return `<span part="unit-switcher" class="unit-switcher" onclick="this.getRootNode().host.toggleUnits()">
        ${this.#metric ? 
          `${metricLabel} | <span part="light-text">${imperialLabel}</span>` : 
          `<span part="light-text">${metricLabel}</span> | ${imperialLabel}`
        }
      </span>`;
  }
  
  translate(key, values = {}) {
    if (!this._i18n || !key) return key;
    
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
   * Toggle between metric and imperial units
   */
  toggleUnits() {
    const newUnit = this.#metric ? 'imperial' : 'metric';
    this.setAttribute('units', newUnit);
  }

  /**
   * Should be implemented by subclasses
   */
  render() {
    console.warn('render() method not implemented');
  }
  
  /**
   * Private methods
   */
  #determineUnitSystem() {
    const units = this.getAttribute('units');
    return units ? units === 'metric' : !['en-US', 'en-LR', 'en-MM'].includes(navigator.language);
  }
}

export default WeatherWidget;