---
sidebar_label: Vercel (Next.js)
---

# Platform: Vercel (Next.js)

How to serve Baseline CMS configuration singletons and page content on Vercel using Next.js, Edge Config, and ISR.

For architecture context, see [Webhook & Edge Delivery](./webhook.edge.md).

---

## Overview

| What | How | Latency |
|------|-----|---------|
| Config singletons (site, headers, crawler, security, personas) | Edge Config | < 1ms read |
| Navigation | `unstable_cache` with tag-based revalidation | 0ms cached |
| Pages | ISR with per-path revalidation | 0ms cached / seconds on revalidation |
| Translations, sitemap, llms.txt | Generated files (prebuild) | 0ms (static) |

The principle: **nothing is fetched from the CMS at request time**. CMS webhooks write to Edge Config or trigger ISR revalidation. Prebuild scripts generate static files for large aggregated output.

---

## robots.txt

The `robots_txt` field on the `crawler-config` singleton holds the full content of `/robots.txt`. Editors manage it via a visual editor (<a href="https://browser.style/ui/editor-robots" target="_blank"><code>editor-robots</code></a>) in the CMS.

### Flow

```
CMS publish (crawler-config)
    → Webhook POST /api/webhook/cms
    → handleCrawlerConfig()
    → edgeWrite({ key: 'crawler:robots', value: robots_txt })

Browser request GET /robots.txt
    → Next.js route handler
    → edgeGet('crawler:robots')
    → return plain text response
```

### Webhook Handler

When the `crawler-config` entry is published, the webhook writes robots.txt, manifest, and llms config to Edge Config in a single atomic batch.

<details>
<summary><code>handleCrawlerConfig</code></summary>

```ts
// app/api/webhook/cms/handlers/crawler-config.ts
import { fetchEntry } from '@/lib/cms';
import { edgeWrite } from '@/lib/edge-config';

export async function handleCrawlerConfig(entryId: string) {
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

  await edgeWrite([
    { operation: 'upsert', key: 'crawler:robots', value: robots_txt },
    { operation: 'upsert', key: 'crawler:manifest', value: { ...manifest, icons } },
    { operation: 'upsert', key: 'crawler:llms:config', value: {
      enabled: llms_enabled,
      preamble: llms_preamble,
      exclude_patterns: llms_exclude_patterns,
    }},
  ]);
}
```

</details>

### Route Handler

```ts
// app/robots.txt/route.ts
import { edgeGet } from '@/lib/edge-config';

export const runtime = 'edge';

export async function GET() {
  const content = await edgeGet<string>('crawler:robots');

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

### Why Edge Config?

- **Instant updates** — no redeploy needed when editors change robots.txt
- **Sub-millisecond reads** — Edge Config is co-located with the edge runtime
- **No CMS call at request time** — the webhook pre-writes the value
- **Atomic** — the entire crawler-config is written in a single batch operation

### Cache-Control

`s-maxage=60, stale-while-revalidate=300` means:
- CDN caches for 60 seconds
- After 60s, serve stale while fetching fresh in the background
- After 300s, the stale response is no longer served

This is a good balance — robots.txt rarely changes, but when it does, the change propagates within a minute.

---

## manifest.json

### Flow

```
CMS publish (crawler-config)
    → Webhook writes manifest JSON + icons to Edge Config (same handler as robots.txt)

Browser request GET /manifest.json
    → Next.js route handler
    → edgeGet('crawler:manifest') — single key, icons included
    → return JSON response
```

### Route Handler

```ts
// app/manifest.json/route.ts
import { edgeGet } from '@/lib/edge-config';

export const runtime = 'edge';

export async function GET() {
  const manifest = await edgeGet<Record<string, unknown>>('crawler:manifest');

  return Response.json(manifest ?? {}, {
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
    → Webhook writes security.txt content to Edge Config

Browser request GET /.well-known/security.txt
    → Next.js route handler
    → edgeGet('security:txt')
    → return plain text response
```

### Webhook Handler

```ts
// app/api/webhook/cms/handlers/security-config.ts
import { fetchEntry } from '@/lib/cms';
import { edgeWrite } from '@/lib/edge-config';

export async function handleSecurityConfig(entryId: string) {
  const entry = await fetchEntry('security-config', entryId);
  await edgeWrite([
    { operation: 'upsert', key: 'security:txt', value: entry.fields.security_txt },
  ]);
}
```

### Route Handler

```ts
// app/.well-known/security.txt/route.ts
import { edgeGet } from '@/lib/edge-config';

export const runtime = 'edge';

export async function GET() {
  const content = await edgeGet<string>('security:txt');

  return new Response(content ?? '', {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
```

---

## HTTP Security Headers (CSP, Permissions-Policy, Referrer-Policy, HSTS, CORS)

Security headers are applied by **middleware** on every response. Middleware runs before the response body is generated, making it the right place for header injection.

### Flow

```
CMS publish (headers-config)
    → Webhook batch-writes 5 keys to Edge Config (atomic)

Every request
    → middleware.ts
    → Batch-read headers:csp, headers:permissions, headers:referrer, headers:hsts, headers:cors
    → Generate CSP nonce
    → Set headers on response
```

### Webhook Handler

```ts
// app/api/webhook/cms/handlers/headers-config.ts
import { fetchEntry } from '@/lib/cms';
import { edgeWrite } from '@/lib/edge-config';

export async function handleHeadersConfig(entryId: string) {
  const entry = await fetchEntry('headers-config', entryId);
  const { csp, permissions_policy, referrer_policy, hsts, cors } = entry.fields;

  // Atomic batch write — all five update together or not at all
  await edgeWrite([
    { operation: 'upsert', key: 'headers:csp', value: csp },
    { operation: 'upsert', key: 'headers:permissions', value: permissions_policy },
    { operation: 'upsert', key: 'headers:referrer', value: referrer_policy },
    { operation: 'upsert', key: 'headers:hsts', value: hsts },
    { operation: 'upsert', key: 'headers:cors', value: cors },
  ]);
}
```

### Middleware

<details>
<summary>Full source — <code>middleware.ts</code></summary>

```ts
// middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { edgeGetAll } from '@/lib/edge-config';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Batch-read all header keys in a single call (sub-ms)
  const config = await edgeGetAll([
    'headers:csp',
    'headers:permissions',
    'headers:referrer',
    'headers:hsts',
    'headers:cors',
  ]);

  const csp = config.get('headers:csp') as Record<string, string[]> | undefined;
  const permissions = config.get('headers:permissions') as Record<string, string> | undefined;
  const referrer = config.get('headers:referrer') as { policy: string } | undefined;
  const hsts = config.get('headers:hsts') as { max_age: number; include_sub_domains?: boolean; preload?: boolean } | undefined;
  const cors = config.get('headers:cors') as { allowed_origins: string[]; allowed_methods: string[]; allowed_headers: string[]; expose_headers?: string[]; max_age?: number; allow_credentials?: boolean } | undefined;

  // CSP with per-request nonce
  if (csp) {
    const nonce = generateNonce();
    response.headers.set('Content-Security-Policy', buildCspString(csp, nonce));
    response.headers.set('x-nonce', nonce);
  }

  // Permissions-Policy
  if (permissions) {
    const pp = Object.entries(permissions)
      .map(([feature, allowlist]) => `${feature}=${allowlist}`)
      .join(', ');
    response.headers.set('Permissions-Policy', pp);
  }

  // Referrer-Policy
  if (referrer?.policy) {
    response.headers.set('Referrer-Policy', referrer.policy);
  }

  // HSTS
  if (hsts) {
    let value = `max-age=${hsts.max_age}`;
    if (hsts.include_sub_domains) value += '; includeSubDomains';
    if (hsts.preload) value += '; preload';
    response.headers.set('Strict-Transport-Security', value);
  }

  // CORS — only on cross-origin requests
  const origin = request.headers.get('Origin');
  if (cors && origin && cors.allowed_origins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', cors.allowed_methods.join(', '));
    response.headers.set('Access-Control-Allow-Headers', cors.allowed_headers.join(', '));
    if (cors.expose_headers?.length) {
      response.headers.set('Access-Control-Expose-Headers', cors.expose_headers.join(', '));
    }
    if (cors.max_age) {
      response.headers.set('Access-Control-Max-Age', String(cors.max_age));
    }
    if (cors.allow_credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
  }

  return response;
}

function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

function buildCspString(csp: Record<string, string[]>, nonce: string): string {
  return Object.entries(csp)
    .map(([directive, values]) => {
      const resolved = values.map(v => v.replace('{nonce}', nonce));
      return `${directive} ${resolved.join(' ')}`;
    })
    .join('; ');
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
```

</details>

### Why Edge Config for Headers?

Middleware runs *before* the response — it cannot use React's `unstable_cache` or any server-component caching. Edge Config is the only option that provides sub-millisecond reads in the middleware context.

---

## Navigation

Navigation trees can be large (nested items across locales) and are needed on every page. They don't fit well in Edge Config (size limits) and don't need instant updates.

### Flow

```
CMS publish (navigation or navigation-item)
    → Webhook calls revalidateTag('navigation')

Every page request
    → Root layout calls getNavigation()
    → unstable_cache returns cached tree (0ms)
    → On first request after revalidation: fetches from CMS, re-caches
```

### Implementation

```ts
// lib/navigation.ts
import { unstable_cache } from 'next/cache';
import { fetchEntry } from '@/lib/cms';

export const getNavigation = unstable_cache(
  async (navId: string, locale: string) => {
    const entry = await fetchEntry('navigation', navId);
    return resolveNavTree(entry, locale);
  },
  ['navigation'],
  { tags: ['navigation'], revalidate: false }
);
```

```ts
// Webhook handler
import { revalidateTag } from 'next/cache';

export async function handleNavigation() {
  revalidateTag('navigation');
}
```

---

## Pages (ISR)

Page content is rendered via Incremental Static Regeneration. Each page has its own cache entry, revalidated independently.

### Flow

```
CMS publish (page)
    → Webhook calls revalidatePath('/{slug}')

Browser request GET /{slug}
    → Next.js serves cached page (0ms)
    → After revalidation: re-renders and caches the new version
```

---

## Error Pages

Custom error pages are resolved from the `error_pages` map on the site config. See [Error Page](./error-page.md) for the full model and all status code examples.

### Flow

```
Site webhook
    → Resolves error_pages refs into { "404": "/error-404", "500": "/error-500", "401": "/not-authenticated" }
    → Written as part of the site Edge Config payload

Error occurs (404, 401, 500, etc.)
    → Framework error handler or middleware
    → Reads error_pages map from site config
    → Renders the mapped page with the correct HTTP status code
```

### 404 — Not Found

```tsx
// app/not-found.tsx
import { edgeGet } from '@/lib/edge-config';
import { getPage } from '@/lib/pages';

export default async function NotFound() {
  const site = await edgeGet<{ error_pages: Record<string, string> }>('site');
  const url = site?.error_pages?.['404'];
  if (!url) return <h1>Page not found</h1>;

  const page = await getPage(url);
  return <PageRenderer page={page} />;
}
```

### 401 / 403 — Auth errors (middleware)

```ts
// middleware.ts — inside auth check
if (!session && protectedRoute) {
  const site = await edgeGet<{ error_pages: Record<string, string> }>('site');
  const errorUrl = site?.error_pages?.['401'];
  if (errorUrl) {
    return NextResponse.rewrite(new URL(errorUrl, request.url));
  }
  return NextResponse.redirect(new URL('/login', request.url));
}
```

Use `rewrite` (not `redirect`) to keep the original URL while serving the error content with the correct status code.

---

## llms.txt / llms-full.txt

Too large for Edge Config (aggregated from all pages). Generated at build time.

### Flow

```
CMS publish (page or layout with includeInMarkdown)
    → Webhook triggers deploy hook
    → Prebuild script generates public/llms.txt and public/llms-full.txt
    → Served as static files
```

---

## Translations

Build-time artifacts. No runtime fetching.

### Flow

```
CMS publish (translation-namespace)
    → Webhook triggers deploy hook
    → Prebuild script generates locales/{locale}.json
    → App builds with updated strings baked into the bundle
```

---

## Edge Config Client

Shared utility for all Edge Config reads/writes.

<details>
<summary>Full source — <code>lib/edge-config.ts</code></summary>

```ts
// lib/edge-config.ts
import { createClient } from '@vercel/edge-config';

const client = createClient(process.env.EDGE_CONFIG);

export async function edgeGet<T>(key: string): Promise<T | undefined> {
  return client.get<T>(key);
}

export async function edgeGetAll(keys: string[]): Promise<Map<string, unknown>> {
  const entries = await client.getAll(keys);
  return new Map(Object.entries(entries));
}

export async function edgeWrite(
  items: Array<{ operation: 'upsert' | 'delete'; key: string; value?: unknown }>
) {
  const res = await fetch(
    `https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items }),
    }
  );
  if (!res.ok) {
    throw new Error(`Edge Config write failed: ${res.status} ${await res.text()}`);
  }
}
```

</details>

---

## Edge Config Schema

All config singletons are stored under namespaced keys in a single Edge Config store:

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
```

---

## Environment Variables

See `.env.local.example` at the project root. Key variables:

| Variable | Purpose |
|----------|---------|
| `EDGE_CONFIG` | Edge Config connection string |
| `EDGE_CONFIG_ID` | Edge Config store ID (for write API) |
| `VERCEL_API_TOKEN` | Vercel API token (for Edge Config writes) |
| `VERCEL_DEPLOY_HOOK_URL` | Deploy hook URL (for triggering rebuilds) |
| `CMS_WEBHOOK_SECRET` | Shared secret for webhook signature validation |
| `CMS_PLATFORM` | CMS adapter identifier (e.g. `contentful`) |

---

## Setup Checklist

### Prerequisites

- [ ] Node.js 18+ installed
- [ ] Vercel CLI installed (`npm i -g vercel`) and authenticated (`vercel login`)
- [ ] Contentful space created
- [ ] Contentful CMA token generated (Settings → API Keys → Content management tokens)
- [ ] Vercel API token generated (Account Settings → Tokens)

### 1. Project Setup

- [ ] Clone the repo and install dependencies (`npm install`)
- [ ] Link project to Vercel (`vercel link`)
- [ ] Copy `.env.local.example` to `.env.local` and fill in credentials
- [ ] Create Edge Config store at https://vercel.com/~/stores

### 2. Push Schemas to CMS

- [ ] Validate schemas: `cd ../unified-content-model && npm run validate`
- [ ] Sync schemas to Contentful: `npm run sync`
- [ ] Verify content types in Contentful (site, page, layout, navigation, content-card, crawler-config, headers-config, security-config, persona, translation-namespace)

### 3. Create Content in Contentful

- [ ] Create **Site** singleton (site_name, site_url, default_locale)
- [ ] Create **Crawler Config** singleton (robots.txt rules, manifest settings)
- [ ] Create **Headers Config** singleton (CSP, permissions-policy, referrer-policy)
- [ ] Create **Security Config** singleton (security.txt)
- [ ] Create at least one **Navigation** entry (header)
- [ ] Link header/footer nav from Site entry

### 4. Verify End-to-End

- [ ] Publish Site entry → verify Edge Config updated
- [ ] Publish Headers Config → verify CSP headers in browser
- [ ] Publish Navigation → verify nav refreshes without full rebuild
- [ ] Publish Page → verify ISR revalidation
- [ ] Check `/robots.txt`, `/manifest.json`, `/security.txt` serve correctly
