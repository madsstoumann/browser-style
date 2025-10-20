/**
 * Cloudflare Worker: CSP Report-To Endpoint
 * Receives and stores Content Security Policy violation reports
 *
 * Requirements:
 * - KV namespace binding: CSP_VIOLATIONS
 * - Environment variable: ADMIN_KEY (for accessing reports)
 *
 * Setup in wrangler.toml:
 * kv_namespaces = [
 *   { binding = "CSP_VIOLATIONS", id = "your-kv-id" }
 * ]
 *
 * [vars]
 * ADMIN_KEY = "your-secret-key-here"
 */

// Allowed domains that can submit CSP reports
const ALLOWED_DOMAINS = [
	'example.com',
	'www.example.com',
	'staging.example.com'
];

// Maximum violations to store per domain (FIFO)
const MAX_VIOLATIONS_PER_DOMAIN = 100;

// How long to store violations (in seconds) - 30 days
const VIOLATION_TTL = 30 * 24 * 60 * 60;

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		const path = url.pathname;

		// CORS headers for browser requests
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		};

		// Handle preflight requests
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		// POST /report - Receive CSP violations
		if (path === '/report' && request.method === 'POST') {
			return handleViolationReport(request, env, corsHeaders);
		}

		// GET /reports?domain=example.com&key=admin-key - Retrieve violations
		if (path === '/reports' && request.method === 'GET') {
			return handleGetReports(request, env, url, corsHeaders);
		}

		// GET /clear?domain=example.com&key=admin-key - Clear violations for domain
		if (path === '/clear' && request.method === 'GET') {
			return handleClearReports(request, env, url, corsHeaders);
		}

		// Default: API info
		return new Response(JSON.stringify({
			status: 'ok',
			endpoints: {
				report: 'POST /report - Submit CSP violation',
				reports: 'GET /reports?domain={DOMAIN}&key={ADMIN_KEY} - Get violations',
				clear: 'GET /clear?domain={DOMAIN}&key={ADMIN_KEY} - Clear violations'
			}
		}, null, 2), {
			headers: { 'Content-Type': 'application/json', ...corsHeaders }
		});
	}
};

/**
 * Handle incoming CSP violation reports
 */
async function handleViolationReport(request, env, corsHeaders) {
	try {
		const origin = request.headers.get('origin') || request.headers.get('referer');

		if (!origin) {
			return jsonResponse({ error: 'No origin header' }, 400, corsHeaders);
		}

		// Extract domain from origin
		const domain = new URL(origin).hostname;

		// Validate domain is in allowlist
		if (!ALLOWED_DOMAINS.includes(domain)) {
			console.log(`Rejected report from unauthorized domain: ${domain}`);
			return jsonResponse({ error: 'Unauthorized domain' }, 403, corsHeaders);
		}

		// Parse the CSP report
		const contentType = request.headers.get('content-type') || '';
		let report;

		if (contentType.includes('application/csp-report')) {
			// Standard CSP report format
			report = await request.json();
		} else if (contentType.includes('application/reports+json')) {
			// Reporting API format (newer)
			const body = await request.json();
			report = body;
		} else {
			// Try to parse as JSON anyway
			report = await request.json();
		}

		// Store the violation
		await storeViolation(env.CSP_VIOLATIONS, domain, report);

		return jsonResponse({ status: 'received' }, 200, corsHeaders);

	} catch (error) {
		console.error('Error handling violation report:', error);
		return jsonResponse({ error: 'Invalid report format' }, 400, corsHeaders);
	}
}

/**
 * Store violation in KV
 */
async function storeViolation(kv, domain, report) {
	const key = `violations:${domain}`;
	const timestamp = Date.now();

	// Create violation record
	const violation = {
		timestamp,
		date: new Date(timestamp).toISOString(),
		report
	};

	// Get existing violations
	const existing = await kv.get(key, { type: 'json' }) || [];

	// Add new violation at the beginning
	const updated = [violation, ...existing];

	// Keep only the most recent violations (FIFO)
	const trimmed = updated.slice(0, MAX_VIOLATIONS_PER_DOMAIN);

	// Store back in KV
	await kv.put(key, JSON.stringify(trimmed), {
		expirationTtl: VIOLATION_TTL
	});
}

/**
 * Handle GET /reports - Retrieve violations for a domain
 */
async function handleGetReports(request, env, url, corsHeaders) {
	const domain = url.searchParams.get('domain');
	const key = url.searchParams.get('key');

	// Validate admin key
	if (key !== env.ADMIN_KEY) {
		return jsonResponse({ error: 'Invalid admin key' }, 401, corsHeaders);
	}

	if (!domain) {
		return jsonResponse({ error: 'Domain parameter required' }, 400, corsHeaders);
	}

	// Validate domain is in allowlist
	if (!ALLOWED_DOMAINS.includes(domain)) {
		return jsonResponse({ error: 'Domain not in allowlist' }, 403, corsHeaders);
	}

	// Retrieve violations
	const violations = await env.CSP_VIOLATIONS.get(`violations:${domain}`, { type: 'json' }) || [];

	return jsonResponse({
		domain,
		count: violations.length,
		violations
	}, 200, corsHeaders);
}

/**
 * Handle GET /clear - Clear violations for a domain
 */
async function handleClearReports(request, env, url, corsHeaders) {
	const domain = url.searchParams.get('domain');
	const key = url.searchParams.get('key');

	// Validate admin key
	if (key !== env.ADMIN_KEY) {
		return jsonResponse({ error: 'Invalid admin key' }, 401, corsHeaders);
	}

	if (!domain) {
		return jsonResponse({ error: 'Domain parameter required' }, 400, corsHeaders);
	}

	// Validate domain is in allowlist
	if (!ALLOWED_DOMAINS.includes(domain)) {
		return jsonResponse({ error: 'Domain not in allowlist' }, 403, corsHeaders);
	}

	// Delete violations
	await env.CSP_VIOLATIONS.delete(`violations:${domain}`);

	return jsonResponse({
		status: 'cleared',
		domain
	}, 200, corsHeaders);
}

/**
 * Helper: Create JSON response
 */
function jsonResponse(data, status = 200, additionalHeaders = {}) {
	return new Response(JSON.stringify(data, null, 2), {
		status,
		headers: {
			'Content-Type': 'application/json',
			...additionalHeaders
		}
	});
}
