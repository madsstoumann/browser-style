// Navigator Consent API
navigator.consent = {
  // Core methods
  getPreferences(options = {}),
  setPreferences(preferences, options = {}),
  hasConsented(category, options = {}),
  hasConsentedToTechnology(techType, techId, options = {}),
  
  // Event handling
  addEventListener(event, callback),
  removeEventListener(event, callback),
  
  // For server-side verification
  generateConsentToken(),
  validateConsentToken(token),
  
  // Utility methods
  exportPreferences(),
  importPreferences(preferences),
  
  // Server request handling
  getConsentHeaders(),
  
  // Constants
  STATUS: {
    GRANTED: 'granted',
    DENIED: 'denied',
    UNKNOWN: 'unknown'
  }
};

// Listen for consent changes
navigator.consent.addEventListener('change', (event) => {
  console.log('Consent updated:', event.detail);
  // Update site behavior based on new consent
});

// Listen for consent prompts
navigator.consent.addEventListener('prompt', (event) => {
  // Custom handling of consent prompts
});

const headers = navigator.consent.getConsentHeaders();
fetch('/api/analytics', { headers });

// Server-side code (Node.js example)
app.use((req, res, next) => {
  // Extract consent information from headers
  const consentHeader = req.headers['x-consent-preferences'];
  if (consentHeader) {
    req.userConsent = JSON.parse(consentHeader);
  }
  next();
});

// In route handlers
app.get('/api/data', (req, res) => {
  // Check if analytics consent is granted
  if (req.userConsent?.analytics === 'granted') {
    // Process analytics
  }
  
  // Proceed with response
});

// This fetch would automatically be blocked or modified by the browser
// if the user hasn't consented to analytics tracking
fetch('https://analytics.example.com/track', {
  consentCategory: 'analytics' // New property to specify required consent
});

// Client-side
const token = await navigator.consent.generateConsentToken();
// Send token to your server with request

// Server-side then uses token when calling third-party APIs
headers['X-Consent-Token'] = token;
axios.post('https://third-party-api.com/endpoint', data, { headers });

// In a service worker
self.addEventListener('fetch', event => {
  // Check if request requires consent
  if (requiresConsent(event.request.url)) {
    // Verify consent before allowing request
    if (!hasRequiredConsent(event.request.url)) {
      event.respondWith(new Response('Consent required', { status: 451 }));
      return;
    }
  }
  
  // Continue with request
  event.respondWith(fetch(event.request));
});