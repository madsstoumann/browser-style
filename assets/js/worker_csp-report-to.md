# CSP Report-To Cloudflare Worker

A Cloudflare Worker that receives, validates, and stores Content Security Policy (CSP) violation reports.

## Features

✅ **Domain Allowlist** - Only accepts reports from specified domains
✅ **Secure Storage** - Stores violations in Cloudflare KV
✅ **Per-Domain Reports** - Retrieve violations filtered by domain
✅ **Auto-Expiration** - Violations expire after 30 days
✅ **FIFO Storage** - Keeps most recent 100 violations per domain
✅ **Admin Authentication** - Secured with admin key

## Setup

### 1. Create KV Namespace

```bash
# Create KV namespace for storing violations
wrangler kv:namespace create "CSP_VIOLATIONS"
```

### 2. Configure wrangler.toml

```toml
name = "csp-report-to"
main = "worker_csp-report-to.js"
compatibility_date = "2024-01-01"

kv_namespaces = [
  { binding = "CSP_VIOLATIONS", id = "your-kv-namespace-id" }
]

[vars]
ADMIN_KEY = "your-secret-admin-key-here"
```

### 3. Update Allowed Domains

Edit the `ALLOWED_DOMAINS` array in `worker_csp-report-to.js`:

```javascript
const ALLOWED_DOMAINS = [
	'yourdomain.com',
	'www.yourdomain.com',
	'staging.yourdomain.com'
];
```

### 4. Deploy

```bash
wrangler deploy
```

## Usage

### Configure CSP Header

Add the worker endpoint to your CSP header:

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  report-to csp-endpoint;

Report-To: {
  "group": "csp-endpoint",
  "max_age": 86400,
  "endpoints": [{
    "url": "https://your-worker.workers.dev/report"
  }]
}
```

Or using the older `report-uri` directive:

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  report-uri https://your-worker.workers.dev/report;
```

## API Endpoints

### POST /report

Receive CSP violation reports (called by browsers automatically).

**Request:**
```json
{
  "csp-report": {
    "document-uri": "https://example.com/page",
    "violated-directive": "script-src 'self'",
    "blocked-uri": "https://evil.com/script.js",
    "source-file": "https://example.com/page",
    "line-number": 42,
    "column-number": 12
  }
}
```

**Response:**
```json
{
  "status": "received"
}
```

### GET /reports

Retrieve violations for a domain (admin only).

**Request:**
```
GET /reports?domain=example.com&key=your-admin-key
```

**Response:**
```json
{
  "domain": "example.com",
  "count": 2,
  "violations": [
    {
      "timestamp": 1704067200000,
      "date": "2024-01-01T00:00:00.000Z",
      "report": {
        "csp-report": {
          "document-uri": "https://example.com/page",
          "violated-directive": "script-src 'self'",
          "blocked-uri": "https://evil.com/script.js"
        }
      }
    }
  ]
}
```

### GET /clear

Clear all violations for a domain (admin only).

**Request:**
```
GET /clear?domain=example.com&key=your-admin-key
```

**Response:**
```json
{
  "status": "cleared",
  "domain": "example.com"
}
```

## Configuration Options

### In worker_csp-report-to.js:

```javascript
// Add/remove allowed domains
const ALLOWED_DOMAINS = [
	'example.com',
	'www.example.com'
];

// Max violations stored per domain
const MAX_VIOLATIONS_PER_DOMAIN = 100;

// How long to keep violations (30 days)
const VIOLATION_TTL = 30 * 24 * 60 * 60;
```

## Security

- ✅ Only accepts reports from domains in `ALLOWED_DOMAINS`
- ✅ Admin endpoints require `ADMIN_KEY` authentication
- ✅ CORS enabled for legitimate domains
- ✅ Automatic rejection of unauthorized domains
- ✅ No personally identifiable information (PII) stored

## Monitoring

### View All Violations

```bash
# Get violations for a specific domain
curl "https://your-worker.workers.dev/reports?domain=example.com&key=your-admin-key"
```

### Dashboard Script

Create a simple dashboard to view violations:

```html
<!DOCTYPE html>
<html>
<head>
	<title>CSP Violations Dashboard</title>
</head>
<body>
	<h1>CSP Violations</h1>
	<select id="domain">
		<option value="example.com">example.com</option>
		<option value="www.example.com">www.example.com</option>
	</select>
	<button onclick="loadViolations()">Load Violations</button>
	<button onclick="clearViolations()">Clear Violations</button>
	<pre id="output"></pre>

	<script>
		const WORKER_URL = 'https://your-worker.workers.dev';
		const ADMIN_KEY = 'your-admin-key';

		async function loadViolations() {
			const domain = document.getElementById('domain').value;
			const response = await fetch(
				`${WORKER_URL}/reports?domain=${domain}&key=${ADMIN_KEY}`
			);
			const data = await response.json();
			document.getElementById('output').textContent = JSON.stringify(data, null, 2);
		}

		async function clearViolations() {
			const domain = document.getElementById('domain').value;
			if (!confirm(`Clear all violations for ${domain}?`)) return;
			const response = await fetch(
				`${WORKER_URL}/clear?domain=${domain}&key=${ADMIN_KEY}`
			);
			const data = await response.json();
			alert(data.status);
		}
	</script>
</body>
</html>
```

## Example Violations

Common CSP violations you might see:

### Inline Script Violation
```json
{
  "violated-directive": "script-src",
  "blocked-uri": "inline",
  "source-file": "https://example.com/page"
}
```

### External Resource Violation
```json
{
  "violated-directive": "img-src",
  "blocked-uri": "https://untrusted.com/image.jpg"
}
```

### Eval() Violation
```json
{
  "violated-directive": "script-src",
  "blocked-uri": "eval"
}
```

## Troubleshooting

**No reports arriving:**
- Check domain is in `ALLOWED_DOMAINS`
- Verify CSP header is correctly configured
- Check browser console for CSP errors
- Ensure worker URL is correct in `report-to`

**401 Unauthorized on /reports:**
- Verify `ADMIN_KEY` matches in wrangler.toml and request

**403 Forbidden:**
- Domain not in allowlist - add to `ALLOWED_DOMAINS`

## Production Best Practices

1. **Use environment-specific configs:**
   ```bash
   wrangler deploy --env production
   ```

2. **Rotate admin keys periodically**

3. **Monitor KV storage usage** (free tier: 1GB)

4. **Set up alerts** for unusual violation patterns

5. **Review violations weekly** to catch CSP misconfigurations

## License

MIT
