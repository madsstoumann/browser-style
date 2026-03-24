---
sidebar_label: Cloudflare (Workers / Pages)
---

# Platform: Cloudflare (Workers / Pages)

How to serve Baseline CMS configuration singletons and page content on Cloudflare using Workers, KV, and Pages.

For architecture context, see [Webhook & Edge Delivery](./webhook.edge.md).

---

## Overview

| What | How | Latency |
|------|-----|---------|
| Config singletons (site, headers, crawler, security, personas) | Workers KV | < 1ms read (cached at edge) |
| Navigation | Workers KV | < 1ms read (cached at edge) |
| Pages | Workers KV or origin fetch + Cache API | 0ms cached / seconds on cache miss |
| Translations, sitemap, llms.txt | Generated files (build step) | 0ms (static via Pages or R2) |

The principle is the same as Vercel: **nothing is fetched from the CMS at request time**. CMS webhooks write to KV. Workers read from KV on each request.

### Key Differences from Vercel

| Concern | Vercel | Cloudflare |
|---------|--------|------------|
| Edge store | Edge Config (atomic batch writes) | Workers KV (eventual consistency, ~60s global propagation) |
| Middleware | `middleware.ts` (Next.js) | Worker fetch handler (runs before response by default) |
| ISR | `revalidatePath()` / `revalidateTag()` | KV write + Cache API purge |
| Deploy hook | Vercel deploy hook URL | Pages build hook or CI trigger |
| Atomic writes | Yes (Edge Config Items API) | No — use single-key JSON or the [bulk write API](https://developers.cloudflare.com/kv/api/write-key-value-pairs-in-bulk/) |

---

## robots.txt

The `robots_txt` field on the `crawler-config` singleton holds the full content of `/robots.txt`. Editors manage it via a visual editor (<a href="https://browser.style/ui/web-config-robots" target="_blank"><code>web-config-robots</code></a>) in the CMS.

### Flow

```
CMS publish (crawler-config)
    → Webhook POST https://{worker-domain}/webhook
    → handleCrawlerConfig()
    → KV.put('crawler:robots', robots_txt)

Browser request GET /robots.txt
    → Worker fetch handler matches route
    → KV.get('crawler:robots')
    → return plain text Response
```

### Webhook Handler

A Cloudflare Worker receives CMS webhooks and writes to KV. This can be the same Worker that serves the site, or a dedicated webhook Worker.

```ts
// src/webhook/handlers/crawler-config.ts
import { fetchEntry } from '../lib/cms';

interface Env {
  CONFIG_KV: KVNamespace;
}

export async function handleCrawlerConfig(entryId: string, env: Env) {
  const entry = await fetchEntry('crawler-config', entryId);
  const {
    robots_txt, manifest,
    app_icon_small, app_icon_medium, app_icon_large,
    llms_enabled, llms_preamble, llms_exclude_patterns,
  } = entry.fields;

  // Build manifest with icons included — single self-contained object
  const icons = [];
  if (app_icon_small) icons.push({ src: app_icon_small.url, sizes: '192x192', type: 'image/png' });
  if (app_icon_medium) icons.push({ src: app_icon_medium.url, sizes: '384x384', type: 'image/png' });
  if (app_icon_large) icons.push({ src: app_icon_large.url, sizes: '512x512', type: 'image/png' });

  // KV doesn't support atomic batch writes natively.
  // Write each key individually — order doesn't matter since they're independent.
  await Promise.all([
    env.CONFIG_KV.put('crawler:robots', robots_txt ?? ''),
    env.CONFIG_KV.put('crawler:manifest', JSON.stringify({ ...(manifest ?? {}), icons })),
    env.CONFIG_KV.put('crawler:llms:config', JSON.stringify({
      enabled: llms_enabled,
      preamble: llms_preamble,
      exclude_patterns: llms_exclude_patterns,
    })),
  ]);
}
```

### Route Handler

```ts
// src/routes/robots-txt.ts
interface Env {
  CONFIG_KV: KVNamespace;
}

export async function handleRobotsTxt(env: Env): Promise<Response> {
  const content = await env.CONFIG_KV.get('crawler:robots');

  if (!content) {
    return new Response('User-agent: *\nAllow: /\n', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
    },
  });
}
```

### Worker Entry Point (routing)

```ts
// src/index.ts
interface Env {
  CONFIG_KV: KVNamespace;
  CMS_WEBHOOK_SECRET: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Webhook endpoint
    if (url.pathname === '/webhook' && request.method === 'POST') {
      return handleWebhook(request, env);
    }

    // Config file routes
    if (url.pathname === '/robots.txt') {
      return handleRobotsTxt(env);
    }
    if (url.pathname === '/manifest.json') {
      return handleManifestJson(env);
    }
    if (url.pathname === '/.well-known/security.txt') {
      return handleSecurityTxt(env);
    }

    // All other requests: apply security headers, then serve page
    return handlePageRequest(request, env);
  },
};
```

### Why KV for robots.txt?

- **Edge-cached reads** — KV values are cached at the nearest Cloudflare PoP after first read, sub-millisecond thereafter
- **No CMS call at request time** — the webhook pre-writes the value
- **Instant updates** — no redeploy needed. KV propagation is typically < 60 seconds globally
- **Simple** — a single `KV.get()` call, no framework needed

### KV Propagation

Unlike Vercel Edge Config (which is strongly consistent), Cloudflare KV is **eventually consistent**. After a `KV.put()`, the new value propagates globally within ~60 seconds. For robots.txt this is perfectly fine — a 60-second delay on crawler directive changes is negligible.

For scenarios requiring stronger consistency (e.g. security headers), consider using the Cache API with `cache.delete()` to purge the old response immediately after writing to KV.

---

## manifest.json

### Flow

```
CMS publish (crawler-config)
    → Webhook writes manifest JSON + icons to KV (same handler as robots.txt)

Browser request GET /manifest.json
    → Worker reads crawler:manifest from KV (single key — icons included)
    → return JSON response
```

### Route Handler

```ts
// src/routes/manifest-json.ts
interface Env {
  CONFIG_KV: KVNamespace;
}

export async function handleManifestJson(env: Env): Promise<Response> {
  const manifestStr = await env.CONFIG_KV.get('crawler:manifest');
  const manifest = manifestStr ? JSON.parse(manifestStr) : {};

  return Response.json(manifest, {
    headers: {
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
```

---

## security.txt

### Flow

```
CMS publish (security-config)
    → Webhook writes security.txt content to KV

Browser request GET /.well-known/security.txt
    → Worker reads security:txt from KV
    → return plain text response
```

### Webhook Handler

```ts
// src/webhook/handlers/security-config.ts
export async function handleSecurityConfig(entryId: string, env: Env) {
  const entry = await fetchEntry('security-config', entryId);
  await env.CONFIG_KV.put('security:txt', entry.fields.security_txt ?? '');
}
```

### Route Handler

```ts
// src/routes/security-txt.ts
export async function handleSecurityTxt(env: Env): Promise<Response> {
  const content = await env.CONFIG_KV.get('security:txt');

  return new Response(content ?? '', {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
```

---

## HTTP Security Headers (CSP, Permissions-Policy, Referrer-Policy)

Cloudflare Workers run *before* the response by default, making them a natural fit for header injection — no separate "middleware" concept needed.

### Flow

```
CMS publish (headers-config)
    → Webhook writes 3 keys to KV

Every request (non-static)
    → Worker fetch handler
    → Read headers:csp, headers:permissions, headers:referrer from KV
    → Generate CSP nonce
    → Fetch origin response (or build page)
    → Set headers on response
    → Return modified response
```

### Webhook Handler

```ts
// src/webhook/handlers/headers-config.ts
export async function handleHeadersConfig(entryId: string, env: Env) {
  const entry = await fetchEntry('headers-config', entryId);
  const { csp, permissions_policy, referrer_policy, hsts, cors } = entry.fields;

  await Promise.all([
    env.CONFIG_KV.put('headers:csp', JSON.stringify(csp)),
    env.CONFIG_KV.put('headers:permissions', JSON.stringify(permissions_policy)),
    env.CONFIG_KV.put('headers:referrer', JSON.stringify(referrer_policy)),
    env.CONFIG_KV.put('headers:hsts', JSON.stringify(hsts)),
    env.CONFIG_KV.put('headers:cors', JSON.stringify(cors)),
  ]);
}
```

### Worker Header Injection

```ts
// src/lib/apply-headers.ts
interface Env {
  CONFIG_KV: KVNamespace;
}

export async function applySecurityHeaders(
  request: Request,
  response: Response,
  env: Env
): Promise<Response> {
  // Read all header configs from KV
  const [cspStr, permStr, refStr, hstsStr, corsStr] = await Promise.all([
    env.CONFIG_KV.get('headers:csp'),
    env.CONFIG_KV.get('headers:permissions'),
    env.CONFIG_KV.get('headers:referrer'),
    env.CONFIG_KV.get('headers:hsts'),
    env.CONFIG_KV.get('headers:cors'),
  ]);

  // Clone response to make headers mutable
  const res = new Response(response.body, response);

  // CSP with per-request nonce
  if (cspStr) {
    const csp = JSON.parse(cspStr) as Record<string, string[]>;
    const nonce = crypto.randomUUID();
    const cspString = Object.entries(csp)
      .map(([directive, values]) => {
        const resolved = values.map(v => v.replace('{nonce}', nonce));
        return `${directive} ${resolved.join(' ')}`;
      })
      .join('; ');
    res.headers.set('Content-Security-Policy', cspString);
    res.headers.set('x-nonce', nonce);
  }

  // Permissions-Policy
  if (permStr) {
    const permissions = JSON.parse(permStr) as Record<string, string>;
    const pp = Object.entries(permissions)
      .map(([feature, allowlist]) => `${feature}=${allowlist}`)
      .join(', ');
    res.headers.set('Permissions-Policy', pp);
  }

  // Referrer-Policy
  if (refStr) {
    const referrer = JSON.parse(refStr) as { policy: string };
    if (referrer.policy) {
      res.headers.set('Referrer-Policy', referrer.policy);
    }
  }

  // HSTS
  if (hstsStr) {
    const hsts = JSON.parse(hstsStr) as { max_age: number; include_sub_domains?: boolean; preload?: boolean };
    let value = `max-age=${hsts.max_age}`;
    if (hsts.include_sub_domains) value += '; includeSubDomains';
    if (hsts.preload) value += '; preload';
    res.headers.set('Strict-Transport-Security', value);
  }

  // CORS — only on cross-origin requests
  const origin = request.headers.get('Origin');
  if (corsStr && origin) {
    const cors = JSON.parse(corsStr) as { allowed_origins: string[]; allowed_methods: string[]; allowed_headers: string[]; expose_headers?: string[]; max_age?: number; allow_credentials?: boolean };
    if (cors.allowed_origins.includes(origin)) {
      res.headers.set('Access-Control-Allow-Origin', origin);
      res.headers.set('Access-Control-Allow-Methods', cors.allowed_methods.join(', '));
      res.headers.set('Access-Control-Allow-Headers', cors.allowed_headers.join(', '));
      if (cors.expose_headers?.length) {
        res.headers.set('Access-Control-Expose-Headers', cors.expose_headers.join(', '));
      }
      if (cors.max_age) {
        res.headers.set('Access-Control-Max-Age', String(cors.max_age));
      }
      if (cors.allow_credentials) {
        res.headers.set('Access-Control-Allow-Credentials', 'true');
      }
    }
  }

  return res;
}
```

### Usage in the Worker

```ts
// src/index.ts (page request handler)
async function handlePageRequest(request: Request, env: Env): Promise<Response> {
  // Build or fetch the page response
  const response = await buildPage(request, env);

  // Apply security headers from KV (request needed for CORS origin check)
  return applySecurityHeaders(request, response, env);
}
```

### Caching Header Configs

Reading 5 KV keys on every request is fast (sub-ms each), but you can optimize further with the Cache API:

```ts
// Cache headers config for 60 seconds to avoid KV reads on every request
const cache = caches.default;
const cacheKey = new Request('https://internal/headers-config');

let headersConfig = await cache.match(cacheKey);
if (!headersConfig) {
  // Fetch from KV, build a cached response
  const config = await readHeadersFromKV(env);
  headersConfig = new Response(JSON.stringify(config), {
    headers: { 'Cache-Control': 'max-age=60' },
  });
  await cache.put(cacheKey, headersConfig.clone());
}
```

---

## Navigation

Unlike Vercel (where navigation uses `unstable_cache` with tags), Cloudflare stores the full resolved navigation tree in KV.

### Flow

```
CMS publish (navigation or navigation-item)
    → Webhook fetches full nav tree from CMS
    → Resolves all nested items
    → Writes complete tree to KV

Every page request
    → Worker reads navigation:{id} from KV
    → Returns cached tree
```

### Webhook Handler

```ts
// src/webhook/handlers/navigation.ts
export async function handleNavigation(entryId: string, env: Env) {
  // Fetch the full navigation tree with resolved nested items
  const entry = await fetchEntry('navigation', entryId);
  const resolved = resolveNavTree(entry);

  await env.CONFIG_KV.put(`navigation:${entry.id}`, JSON.stringify(resolved));
}
```

The key difference from Vercel: on Cloudflare, the webhook does the work of resolving the full tree and writing it to KV. On Vercel, the webhook just invalidates a cache tag and the next request fetches fresh data.

---

## Pages

Page content can be served in several ways on Cloudflare:

### Option A: KV-backed pages (recommended for CMS-driven sites)

```
CMS publish (page)
    → Webhook fetches page with resolved layouts/content
    → Renders HTML
    → Writes to KV: page:{slug}

Browser request
    → Worker reads page:{slug} from KV
    → Returns cached HTML with security headers
```

### Option B: Pages Functions with Cache API

```
CMS publish (page)
    → Webhook purges cache for the page URL

Browser request
    → Pages Function fetches from CMS on cache miss
    → Caches response via Cache API
    → Returns cached HTML on subsequent requests
```

### Option C: Cloudflare Pages (static)

For fully static sites, generate all pages at build time using the CMS prebuild scripts. Deploy to Cloudflare Pages as static assets.

---

## Error Pages

Custom error pages are resolved from the `error_pages` map on the site config. See [Error Page](./error-page.md) for the full model and all status code examples.

### Flow

```
Site webhook
    → Resolves error_pages refs into { "404": "/error-404", "500": "/error-500", "401": "/not-authenticated" }
    → Written as part of the site KV payload

Error occurs (404, 401, 500, etc.)
    → Worker fetch handler
    → Reads error_pages map from site config in KV
    → Renders the mapped page with the correct HTTP status code
```

### Implementation

```ts
// src/lib/errors.ts
export async function renderErrorPage(
  statusCode: number,
  env: Env
): Promise<Response | null> {
  const siteStr = await env.CONFIG_KV.get('site');
  if (!siteStr) return null;

  const site = JSON.parse(siteStr);
  const errorUrl = site.error_pages?.[String(statusCode)];
  if (!errorUrl) return null;

  const pageStr = await env.CONFIG_KV.get(`page:${errorUrl}`);
  if (!pageStr) return null;

  return renderPage(JSON.parse(pageStr), {
    status: statusCode,
    headers: statusCode === 503 ? { 'Retry-After': '3600' } : {},
  });
}
```

```ts
// src/index.ts — inside fetch handler
const page = await getPage(slug, env);
if (!page) {
  const errorResponse = await renderErrorPage(404, env);
  if (errorResponse) return errorResponse;
  return new Response('Not Found', { status: 404 });
}
```

For auth errors, check authentication before routing:

```ts
// src/index.ts — auth check
const authError = await handleAuth(request, env);
if (authError) return authError; // Returns 401/403 error page
```

---

## llms.txt / llms-full.txt

Generated at build time, same as Vercel. Deploy as static assets via Cloudflare Pages or upload to R2.

---

## Translations

Build-time artifacts. Same workflow as Vercel — the webhook triggers a build hook instead of a deploy hook.

### Cloudflare Pages Build Hook

```ts
// src/webhook/handlers/translations.ts
export async function handleTranslations(env: Env) {
  // Trigger a Pages rebuild
  if (env.PAGES_BUILD_HOOK_URL) {
    await fetch(env.PAGES_BUILD_HOOK_URL, { method: 'POST' });
  }
}
```

---

## KV Client

Shared utility — simpler than the Vercel Edge Config client since KV is a native Workers binding:

```ts
// src/lib/kv.ts
interface Env {
  CONFIG_KV: KVNamespace;
}

export async function kvGet<T>(key: string, env: Env): Promise<T | undefined> {
  const value = await env.CONFIG_KV.get(key, 'json');
  return value as T | undefined;
}

export async function kvGetText(key: string, env: Env): Promise<string | null> {
  return env.CONFIG_KV.get(key, 'text');
}

export async function kvPut(key: string, value: unknown, env: Env): Promise<void> {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  await env.CONFIG_KV.put(key, serialized);
}

export async function kvPutBatch(
  items: Array<{ key: string; value: unknown }>,
  env: Env
): Promise<void> {
  await Promise.all(
    items.map(({ key, value }) => kvPut(key, value, env))
  );
}
```

---

## KV Schema

Same key structure as the Vercel Edge Config schema:

```
site                    → { site_name, site_url, default_locale, favicons, ... }
headers:csp             → { "default-src": ["'self'"], "script-src": [...] }
headers:permissions     → { "camera": "()", "microphone": "()" }
headers:referrer        → { "policy": "strict-origin-when-cross-origin" }
headers:hsts            → { "max_age": 63072000, "include_sub_domains": true, "preload": true }
headers:cors            → { "allowed_origins": [...], "allowed_methods": [...], ... }
security:txt            → "Contact: security@example.com\nExpires: ..."
crawler:robots          → "User-agent: *\nDisallow: /admin/\n..."
crawler:manifest        → { "name": "...", "short_name": "..." }
crawler:llms:config     → { enabled: true, preamble: "...", exclude_patterns: [...] }
personas                → [{ slug, displayName, systemPrompt, searchBias, ... }]
navigation:{id}         → { id, title, items: [...resolved tree] }
page:{slug}             → { ...rendered page HTML or JSON }
```

---

## Wrangler Configuration

```toml
# wrangler.toml
name = "baseline-cms"
main = "src/index.ts"
compatibility_date = "2025-01-01"

[[kv_namespaces]]
binding = "CONFIG_KV"
id = "your-kv-namespace-id"

[vars]
CMS_PLATFORM = "contentful"

# Secrets (set via `wrangler secret put`):
# CMS_WEBHOOK_SECRET
# CMS_ACCESS_TOKEN
# PAGES_BUILD_HOOK_URL
```

---

## Environment Variables

| Variable | Purpose | How to set |
|----------|---------|-----------|
| `CONFIG_KV` | KV namespace binding | `wrangler.toml` |
| `CMS_WEBHOOK_SECRET` | Shared secret for webhook validation | `wrangler secret put CMS_WEBHOOK_SECRET` |
| `CMS_ACCESS_TOKEN` | CMS API token for webhook handler | `wrangler secret put CMS_ACCESS_TOKEN` |
| `CMS_PLATFORM` | CMS adapter identifier | `wrangler.toml` vars |
| `PAGES_BUILD_HOOK_URL` | Build hook for triggering rebuilds | `wrangler secret put PAGES_BUILD_HOOK_URL` |
