/**
 * Shared translations for weather widget components
 */
export const defaultTranslations = {
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

// Singleton translation registry that can be shared across components
class TranslationRegistry {
  #translations = { ...defaultTranslations };
  #instances = new Set();
  
  /**
   * Register a component instance to receive translation updates
   */
  registerComponent(component) {
    this.#instances.add(component);
    component.setI18n(this.#translations);
    return this;
  }
  
  /**
   * Unregister a component
   */
  unregisterComponent(component) {
    this.#instances.delete(component);
    return this;
  }
  
  /**
   * Add or update translations
   */
  addTranslations(newTranslations) {
    Object.entries(newTranslations).forEach(([lang, texts]) => {
      this.#translations[lang] = { 
        ...this.#translations[lang] || {}, 
        ...texts 
      };
    });
    
    // Notify all registered components
    this.#instances.forEach(component => {
      component.setI18n(this.#translations);
    });
    
    return this;
  }
  
  /**
   * Get the current translations
   */
  getTranslations() {
    return this.#translations;
  }
}

// Create and export a singleton instance
export const translationRegistry = new TranslationRegistry();
