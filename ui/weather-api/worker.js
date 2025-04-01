// Toggle this to true to disable domain validation while testing in Cloudflare worker panel
const DISABLE_DOMAIN_VALIDATION = false;

// Configuration of allowed domains for origin validation
const ALLOWED_DOMAINS = [
  'browser.style',
  '127.0.0.1:5500'
];

// Helper function to create CORS headers
const createCorsHeaders = (origin) => {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
};

// Helper function to filter weather data and remove detailed metrics
const filterWeatherData = (data) => {
  // Properties to remove from hourly forecast
  const hourlyPropsToRemove = [
    'wind_mph', 'wind_kph', 'wind_degree', 'wind_dir',
    'pressure_mb', 'pressure_in', 'precip_mm', 'precip_in',
    'snow_cm', 'humidity', 'cloud', 'feelslike_c', 'feelslike_f',
    'windchill_c', 'windchill_f', 'heatindex_c', 'heatindex_f',
    'dewpoint_c', 'dewpoint_f', 'will_it_rain', 'chance_of_rain',
    'will_it_snow', 'chance_of_snow', 'vis_km', 'vis_miles',
    'gust_mph', 'gust_kph', 'uv'
  ];

  // Check if the forecast data exists
  if (data.forecast && data.forecast.forecastday) {
    // For each forecast day
    data.forecast.forecastday.forEach(day => {
      // If there's hourly data
      if (day.hour && Array.isArray(day.hour)) {
        // For each hour, remove the specified properties
        day.hour = day.hour.map(hour => {
          const filteredHour = { ...hour };
          hourlyPropsToRemove.forEach(prop => {
            delete filteredHour[prop];
          });
          return filteredHour;
        });
      }
    });
  }

  return data;
};

export default {
  async fetch(request, env, ctx) {
    const originHeader = request.headers.get('origin') || '';
    const referrerHeader = request.headers.get('referer') || '';

    // Handle OPTIONS request for CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: createCorsHeaders(originHeader) });
    }

    // Validate request origin if needed
    if (!DISABLE_DOMAIN_VALIDATION) {
      const isAllowed = ALLOWED_DOMAINS.some(domain => {
        return (originHeader && originHeader.includes(domain)) || 
               (referrerHeader && referrerHeader.includes(domain));
      });

      if (!isAllowed) {
        return new Response('Access Denied', { 
          status: 403,
          headers: createCorsHeaders('*')
        });
      }
    }

    // Extract query params
    const url = new URL(request.url);
    const lang = url.searchParams.get('lang');
    const q = url.searchParams.get('q');

    try {
      // Fetch weather data
      const weatherAPI = `https://api.weatherapi.com/v1/forecast.json?key=${env.WEATHER_API_KEY}&${new URLSearchParams(url.searchParams)}`;
      const weatherResponse = await fetch(weatherAPI);

      if (!weatherResponse.ok) {
        throw new Error(`Weather API request failed with status ${weatherResponse.status}`);
      }

      const weatherData = await weatherResponse.json();

      // Try to enhance location data with OpenStreetMap if both q and lang are provided
      if (lang && q) {
        await enhanceWithOSMData(weatherData, lang, q, env, ctx);
      }
      
      // Filter the weather data to remove detailed metrics
      const filteredData = filterWeatherData(weatherData);

      // Return the filtered weather data with proper CORS headers
      return new Response(JSON.stringify(filteredData), {
        headers: {
          'Content-Type': 'application/json',
          ...createCorsHeaders(originHeader)
        }
      });
    } catch (error) {
      // Handle any errors with proper CORS headers
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch data', 
        details: error.message 
      }), { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...createCorsHeaders(originHeader)
        }
      });
    }
  },
};

// Helper function to enhance weather data with OpenStreetMap data
async function enhanceWithOSMData(weatherData, lang, q, env, ctx) {
  try {
    // Create a cache key based on the query and language
    const cacheKey = `osm:${q}:${lang}`;
    let cityRecord = null;

    // Try to get cached OSM data first if KV is available
    if (env.OSM_CACHE) {
      const cachedData = await env.OSM_CACHE.get(cacheKey, { type: 'json' });
      if (cachedData) {
        cityRecord = cachedData;
      }
    }
    
    // If no cached data, fetch from OpenStreetMap API
    if (!cityRecord) {
      const openStreetMapAPI = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${q}&accept-language=${lang}`;

      const osmResponse = await fetch(openStreetMapAPI, {
        headers: {
          'User-Agent': 'WeatherAPI-Component/1.0 (https://browser.style; contact@browser.style)'
        }
      });

      if (osmResponse.ok) {
        const osmData = await osmResponse.json();
        
        // Find a city or administrative record with importance > 0.5
        cityRecord = osmData.find(record => 
          (record.type === "city" || record.type === "administrative") && 
          record.importance > 0.5
        );

        // If we found a matching record, store it in cache without expiry
        if (cityRecord && cityRecord.address && env.OSM_CACHE) {
          // Store only the necessary address data to save storage space
          const locationData = {
            address: {
              city: cityRecord.address.city,
              state: cityRecord.address.state,
              country: cityRecord.address.country
            }
          };

          // Cache the OSM data without expiration (or use a very long expiration like 365 days)
          ctx.waitUntil(env.OSM_CACHE.put(cacheKey, JSON.stringify(locationData)));
        }
      }
    }

    // Enhance weather data with the city record (cached or fresh)
    if (cityRecord && cityRecord.address) {
      if (cityRecord.address.city) {
        weatherData.location.name = cityRecord.address.city;
      }
      
      if (cityRecord.address.state) {
        weatherData.location.region = cityRecord.address.state;
      }
      
      if (cityRecord.address.country) {
        weatherData.location.country = cityRecord.address.country;
      }
    }
  } catch (osmError) {
    // Silently continue - we'll use the original weather data
  }
}