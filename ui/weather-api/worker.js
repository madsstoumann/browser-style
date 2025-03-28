// Configuration of allowed domains for origin validation
const ALLOWED_DOMAINS = [
  'browser.style',   // Specific domain allowed
  'stoumann.dk',     // Another allowed domain
  '127.0.0.1:5500' // Local development environment
];

// API Configuration object
// Stores base URLs and API keys for different services
const API_CONFIGS = {
  weather: {
    baseUrl: 'https://api.weatherapi.com/v1',  // Base domain without specific endpoint
    endpoints: {
      current: '/current.json',
      forecast: '/forecast.json',
      history: '/history.json',
      marine: '/marine.json',
      future: '/future.json',
      sports: '/sports.json',
      astronomy: '/astronomy.json',
      // Add more endpoints as needed
    },
    // Environment variable for API key (set in Cloudflare dashboard)
		// @ts-ignore
    apiKey: WEATHER_API_KEY
  }
  // Can easily add more API configurations here
};

// Event listener for incoming fetch events
addEventListener('fetch', event => {
  // Special handling for CORS preflight OPTIONS requests
  if (event.request.method === 'OPTIONS') {
    event.respondWith(handleOptions(event.request));
    return;
  }
  
  // Handle all other request types
  event.respondWith(handleRequest(event.request));
});

// Main request handling function
async function handleRequest(request) {
  // Extract origin and referrer headers
  // These help identify the source of the request
  const originHeader = request.headers.get('origin') || '';
  const referrerHeader = request.headers.get('referer') || '';

  // Function to safely extract origin information from a URL
  const extractOrigin = (url) => {
    try {
      // Parse the URL and return hostname:port
      const parsedUrl = new URL(url);
      return `${parsedUrl.hostname}:${parsedUrl.port || (parsedUrl.protocol === 'https:' ? '443' : '80')}`;
    } catch (error) {
      // Fallback to original input if URL parsing fails
      return url;
    }
  };

  // Extract clean origin strings for validation
  const originOrigin = extractOrigin(originHeader);
  const referrerOrigin = extractOrigin(referrerHeader);

  // Validate if the request is from an allowed domain
  const isAllowedOrigin = ALLOWED_DOMAINS.some(domain => 
    originOrigin.includes(domain) || 
    referrerOrigin.includes(domain)
  );

  // Reject requests from unauthorized origins
  if (!isAllowedOrigin) {
    return new Response('Access Denied', { 
      status: 403, // Forbidden status
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  // Parse the incoming request URL
  const url = new URL(request.url);
  
  // Extract the API type from query parameters
  const apiType = url.searchParams.get('api');
  
  // Validate that a valid API type was provided
  if (!apiType || !API_CONFIGS[apiType]) {
    return new Response('Invalid API', { 
      status: 400, // Bad request status
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  // Get the configuration for the requested API
  const config = API_CONFIGS[apiType];
  
  // Get the endpoint type from query parameters or default to 'current'
  const endpoint = url.searchParams.get('endpoint') || 'current';
  
  // Validate the endpoint exists
  if (!config.endpoints[endpoint]) {
    return new Response('Invalid endpoint', { 
      status: 400, // Bad request status
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }
  
  // Prepare API parameters
  const apiParams = new URLSearchParams(url.searchParams);
  apiParams.delete('api'); // Remove the api type parameter
  apiParams.delete('endpoint'); // Remove the endpoint parameter
  
  // Construct the full API URL with domain, endpoint, key and parameters
  const apiUrl = `${config.baseUrl}${config.endpoints[endpoint]}?key=${config.apiKey}&${apiParams}`;

  try {
    // Fetch data from the target API
    const apiResponse = await fetch(apiUrl);
    
    // Throw an error if the API response is not successful
    if (!apiResponse.ok) {
      throw new Error('API request failed');
    }

    // Parse the API response JSON
    const data = await apiResponse.json();

    // Return the API data with CORS headers
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': originHeader || '*',
        'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
        'Access-Control-Max-Age': '86400', // Cache preflight response for 24 hours
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  } catch (error) {
    // Handle any errors in API request or processing
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch data', 
      details: error.message 
    }), { 
      status: 500, // Internal server error
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': originHeader || '*',
        'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }
}

// Handle CORS preflight requests
// This function responds to OPTIONS requests with appropriate CORS headers
async function handleOptions(request) {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
      'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
      'Access-Control-Max-Age': '86400', // Cache preflight response for 24 hours
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}