export default {
  async fetch(request, env, ctx) {
    // Get the client's IP address
    const clientIP = request.headers.get('CF-Connecting-IP');
    
    // Define the rate limit key based on the client's IP
    const rateLimitKey = `ratelimit:${clientIP}`;
    
    // Check rate limit in KV
    if (env.RATE_LIMIT) {
      // Fetch the current request count for the IP from KV
      const count = await env.RATE_LIMIT.get(rateLimitKey);
      const requestCount = parseInt(count || '0');
      
      // If rate limit exceeded (60 requests in a minute)
      if (requestCount >= 60) {
        return new Response('Too many requests. Please try again later.', {
          status: 429,
          headers: {
            'Content-Type': 'text/plain',
            'Retry-After': '60',
          },
        });
      }

      // Increment the request count and set expiration to 1 minute
      await env.RATE_LIMIT.put(rateLimitKey, (requestCount + 1).toString(), {
        expirationTtl: 60,
      });
    }

    // Maintenance page HTML
    const maintenanceHTML = `<!DOCTYPE html>
<html lang="en-US" dir="ltr">
<head>
  <title>Site Maintenance</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="description" content="Site is under maintenance">
  <meta name="view-transition" content="same-origin">
  <style>
    body {
      background: Canvas;
      color: CanvasText;
      color-scheme: light dark;
      font-family: system-ui;
      line-height: 1.6;
      margin: 0 auto;
      max-inline-size: 1024px;
      padding: 0ch 4ch
    }
    h1 {
      font-size: clamp(2em, 5vw, 4em);
      line-height: 1.1;
    }
    p {
      font-size: clamp(1em, 2.5vw, 1.5em);
    }
  </style>
</head>
<body>
  <h1>We'll Be Right Back</h1>
  <p>The site is currently undergoing maintenance. Please check back later.</p>	
</body>
</html>`;

    // Return the maintenance page immediately (no origin fetch)
    return new Response(maintenanceHTML, {
      status: 503,
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Retry-After': '3600',
      },
    });
  }
};