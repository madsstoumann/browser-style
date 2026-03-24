---
sidebar_label: Headers Config
---

# 🔴 Headers Config

A **singleton** controlling HTTP security and privacy headers applied to every response via middleware.

Schema: [`models/headers-config.schema.json`](../models/headers-config.schema.json)
CMS location: `Configuration / Headers`

---

## Fields

| Field | Type | Widget | Description |
|-------|------|--------|-------------|
| `title` | string | | Editorial label |
| `cors` | object | <a href="https://browser.style/ui/web-config-cors" target="_blank">web-config-cors</a> | Cross-Origin Resource Sharing |
| `csp` | object | <a href="https://browser.style/ui/web-config-csp" target="_blank">web-config-csp</a> | Content Security Policy |
| `permissions_policy` | object | <a href="https://browser.style/ui/web-config-permissions-policy" target="_blank">web-config-permissions-policy</a> | Permissions-Policy header |
| `referrer_policy` | object | <a href="https://browser.style/ui/web-config-referrer-policy" target="_blank">web-config-referrer-policy</a> | Referrer-Policy header |

### HSTS fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `hsts_include_sub_domains` | boolean | `true` | Apply HSTS to all subdomains |
| `hsts_max_age` | number | `63072000` | Duration in seconds (default: 2 years) |
| `hsts_preload` | boolean | `true` | Opt-in to the HSTS Preload List |

Complex policy fields (CSP, Permissions-Policy, Referrer-Policy, CORS) use visual editors that produce structured JSON. HSTS is simple enough to use native CMS fields directly. The application middleware reads all fields and serializes them into HTTP headers.

---

## Content Security Policy (CSP)

CSP controls which resources (scripts, styles, images, fonts, frames, etc.) the browser is allowed to load. It is the primary defense against cross-site scripting (XSS) and data injection attacks.

The `csp` field stores the policy as a JSON object where keys are CSP directives and values are arrays of allowed sources:

```json
{
  "default-src": ["'self'"],
  "script-src": ["'self'", "'nonce-{NONCE}'", "https://cdn.example.com"],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", "data:", "https://images.ctfassets.net"],
  "font-src": ["'self'", "https://fonts.gstatic.com"],
  "connect-src": ["'self'", "https://api.example.com"],
  "frame-src": ["'none'"]
}
```

### Nonce-based script loading

The placeholder `'nonce-{NONCE}'` is replaced by the application middleware with a unique cryptographic nonce on every request. Only `<script>` tags with a matching `nonce` attribute will execute, preventing injected scripts from running.

### Page-level overrides

Individual pages can override or extend the global CSP using the `csp` field on the [page model](./page.md). The merge strategy (replace the global policy or append to specific directives) is determined at the application level.

---

## Permissions-Policy

The `Permissions-Policy` header controls which browser features (camera, microphone, geolocation, payment, etc.) the page is allowed to use. Disabling unused features reduces the attack surface if third-party scripts are compromised.

The `permissions_policy` field stores the configuration as a JSON object:

```json
{
  "camera": [],
  "microphone": [],
  "geolocation": ["self"],
  "payment": ["self", "https://checkout.stripe.com"],
  "fullscreen": ["self"],
  "autoplay": ["self"]
}
```

An empty array `[]` means the feature is disabled entirely. `["self"]` allows it only for the origin. Additional URLs grant the feature to specific third-party iframes.

Serialized header:
```
Permissions-Policy: camera=(), microphone=(), geolocation=(self), payment=(self "https://checkout.stripe.com"), fullscreen=(self), autoplay=(self)
```

---

## Referrer-Policy

The `Referrer-Policy` header controls how much referrer information is sent when navigating away from the site or loading external resources. This protects user privacy by preventing URL paths and query parameters from leaking to third parties.

The `referrer_policy` field stores the configuration as a JSON object:

```json
{
  "policy": "strict-origin-when-cross-origin"
}
```

Common values:

| Policy | Behavior |
|--------|----------|
| `no-referrer` | Never send referrer information |
| `origin` | Send only the origin (e.g. `https://example.com`) |
| `same-origin` | Full URL for same-origin requests, nothing for cross-origin |
| `strict-origin-when-cross-origin` | Full URL for same-origin, origin-only for cross-origin, nothing for downgrade (HTTPS to HTTP). This is the recommended default. |

---

## Strict-Transport-Security (HSTS)

HSTS tells browsers to *only* connect to the site over HTTPS. After the first visit, the browser refuses to use HTTP for the duration of `max-age` — even if the user types `http://`. This prevents SSL-stripping attacks where a man-in-the-middle downgrades the connection.

HSTS is a "set once and forget" header — unlike CSP or CORS, it rarely changes. The three fields are stored as flat properties on headers-config rather than a nested object with a custom widget:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `hsts_max_age` | number | `63072000` | Duration in seconds the browser remembers to use HTTPS (63072000 = 2 years) |
| `hsts_include_sub_domains` | boolean | `true` | Apply to all subdomains (e.g. `api.example.com`, `cdn.example.com`) |
| `hsts_preload` | boolean | `true` | Opt-in to the [HSTS Preload List](https://hstspreload.org/) — browsers ship with a built-in list of HSTS domains, eliminating even the first insecure request |

Serialized header:
```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

**Important:** Only enable HSTS when you are confident *all* subdomains support HTTPS. Once a browser caches the HSTS policy, HTTP connections will fail until `max-age` expires. Start with a short `max-age` (e.g. `86400` = 1 day) during initial setup.

To be included in the [HSTS Preload List](https://hstspreload.org/), all three conditions must be met: `hsts_max_age` ≥ `31536000` (1 year), `hsts_include_sub_domains: true`, and `hsts_preload: true`.

> **Note:** If your site is behind Cloudflare, HSTS can also be configured in the Cloudflare dashboard — in that case these fields are redundant. They exist for platforms (Vercel, self-hosted) where HSTS must be set in application middleware.

---

## CORS (Cross-Origin Resource Sharing)

CORS controls which external origins can access your site's resources (API endpoints, fonts, etc.). Without CORS headers, browsers block cross-origin requests by default.

The `cors` field stores the configuration as a JSON object:

```json
{
  "allowed_origins": ["https://app.example.com", "https://partner.example.com"],
  "allowed_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  "allowed_headers": ["Content-Type", "Authorization", "X-Requested-With"],
  "expose_headers": ["X-Total-Count"],
  "max_age": 86400,
  "allow_credentials": false
}
```

| Property | Type | Description |
|----------|------|-------------|
| `allow_credentials` | boolean | Allow cookies and auth headers in cross-origin requests. Cannot be used with `allowed_origins: ["*"]` |
| `allowed_headers` | string[] | Request headers the client is allowed to send |
| `allowed_methods` | string[] | HTTP methods allowed for cross-origin requests |
| `allowed_origins` | string[] | Origins allowed to make requests. Use `["*"]` for public APIs (not recommended with credentials) |
| `expose_headers` | string[] | Response headers the client is allowed to read |
| `max_age` | number | How long (seconds) the browser caches preflight results — reduces `OPTIONS` requests |

Serialized headers (on a matching request):
```
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
Access-Control-Expose-Headers: X-Total-Count
Access-Control-Max-Age: 86400
```

### When CORS applies

CORS headers are only needed on responses to *cross-origin* requests. Middleware should check the `Origin` header and only set CORS headers when the origin matches `allowed_origins`. For same-origin requests, no CORS headers are needed.

### Preflight requests

Browsers send an `OPTIONS` preflight request before non-simple cross-origin requests (e.g. `POST` with `Content-Type: application/json`). The `max_age` setting caches the preflight result so the browser doesn't repeat it on every request.

---

## How Headers Are Applied

Middleware (or its equivalent) reads the headers config from the edge store and applies the headers to every response. Headers must be applied *before* the response body is generated.

```
Request → Middleware / Worker
           ├── Read headers config from edge store (sub-ms)
           ├── Generate CSP nonce
           ├── Serialize CSP with nonce
           ├── Serialize Permissions-Policy
           ├── Set Referrer-Policy
           ├── Set HSTS from hsts_max_age / hsts_include_sub_domains / hsts_preload
           ├── Check Origin header → set CORS headers if matched
           └── Set headers on response
```

For full implementation details with code examples:

- [Vercel: HTTP Security Headers](./vercel.md#http-security-headers-csp-permissions-policy-referrer-policy) — Edge Config batch read in middleware, per-request nonce
- [Cloudflare: HTTP Security Headers](./cloudflare.md#http-security-headers-csp-permissions-policy-referrer-policy) — KV read in Worker fetch handler, `crypto.randomUUID()` nonce
