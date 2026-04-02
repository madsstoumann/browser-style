# Vercel Edge Config Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement Vercel Edge Config integration so that CMS content changes (headers-config, crawler-config, security-config, site, personas) are written to Edge Config via webhooks and served at sub-millisecond latency — no CMS calls at request time.

**Architecture:** CMS publishes content → Contentful webhook POSTs to `/api/webhook/cms` → webhook handler fetches the entry from Contentful CMA → handler writes config to Vercel Edge Config via the Vercel API → Edge runtime reads Edge Config for middleware (headers) and route handlers (robots.txt, manifest.json, security.txt). Navigation uses `unstable_cache` with tag-based revalidation. Pages use ISR with per-path revalidation.

**Tech Stack:** Next.js 16 (App Router, Edge Runtime), Vercel Edge Config (`@vercel/edge-config`), Contentful CMA, TypeScript

**Project:** Scripts live in `/Users/Mads.Stoumann/Downloads/browser-style/baseline/scripts/`. The consuming Next.js app is at `/Users/Mads.Stoumann/GitHub/akqa-dk-wpp-com/apps/web/`.

---

## Vercel Setup Steps (Manual — do these in the Vercel Dashboard)

Before any code is written, the Vercel project must be configured. These are manual steps.

### S1. Create Edge Config Database

1. Go to [Vercel Dashboard → Storage](https://vercel.com/~/stores)
2. Click **Create Database** → select **Edge Config**
3. Name it (e.g. `wpp-edge-config`)
4. Copy the **Connection String** — this becomes `EDGE_CONFIG`
5. Copy the **Store ID** (from the URL: `ecfg_xxxx`) — this becomes `EDGE_CONFIG_ID`

### S2. Create Vercel API Token

1. Go to [Account Settings → Tokens](https://vercel.com/account/tokens)
2. Create a new token with **Full Account** scope (or scoped to the project)
3. Copy the token — this becomes `VERCEL_API_TOKEN`

### S3. Connect Edge Config to Project

1. Go to your Vercel project → **Storage** tab
2. Click **Connect Store** → select the Edge Config store you just created
3. This auto-injects the `EDGE_CONFIG` env var into your project

### S4. Create Deploy Hook

1. Go to your Vercel project → **Settings → Git → Deploy Hooks**
2. Create a hook named `cms-rebuild` for the `main` branch
3. Copy the URL — this becomes `VERCEL_DEPLOY_HOOK_URL`

### S5. Set Environment Variables

In your Vercel project → **Settings → Environment Variables**, add:

| Variable | Value | Environments |
|----------|-------|-------------|
| `EDGE_CONFIG` | _(auto-set by step S3)_ | All |
| `EDGE_CONFIG_ID` | `ecfg_xxxx` from step S1 | All |
| `VERCEL_API_TOKEN` | Token from step S2 | All |
| `VERCEL_DEPLOY_HOOK_URL` | URL from step S4 | All |
| `CMS_WEBHOOK_SECRET` | A strong random string you generate | All |

Also add to your local `.env.local` in `apps/web/`.

### S6. Configure Contentful Webhook

1. Go to Contentful → **Settings → Webhooks**
2. Create a new webhook:
   - **Name:** `Edge Config Sync`
   - **URL:** `https://your-vercel-domain.vercel.app/api/webhook/cms`
   - **Triggers:** Entry → Publish, Unpublish (for all content types, or filter to: `site`, `headers-config`, `crawler-config`, `security-config`, `persona`, `navigation`, `page`)
   - **Headers:** Add `x-cms-webhook-secret` with the value from step S5
   - **Content type:** `application/json`
   - **Payload:** Use default (full entry payload)

---

## Code Tasks

All scripts/utilities go in the baseline project: `/Users/Mads.Stoumann/Downloads/browser-style/baseline/scripts/`

### Task 1: Edge Config Client Library

**Files:**
- Create: `scripts/lib/edge-config.ts`

**Step 1: Create the Edge Config client**

```ts
// scripts/lib/edge-config.ts
import { createClient } from '@vercel/edge-config';

const client = createClient(process.env.EDGE_CONFIG);

/** Read a single key from Edge Config (sub-ms at the edge) */
export async function edgeGet<T>(key: string): Promise<T | undefined> {
  return client.get<T>(key);
}

/** Batch-read multiple keys in a single call */
export async function edgeGetAll(keys: string[]): Promise<Map<string, unknown>> {
  const entries = await client.getAll(keys);
  return new Map(Object.entries(entries));
}

/** Batch-write (upsert/delete) items to Edge Config via Vercel API */
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

**Step 2: Commit**

```bash
git add scripts/lib/edge-config.ts
git commit -m "feat: add Edge Config client library (read + batch write)"
```

---

### Task 2: Webhook Validation Utility

**Files:**
- Create: `scripts/lib/webhook-validate.ts`

**Step 1: Create webhook signature validation**

```ts
// scripts/lib/webhook-validate.ts
import { type NextRequest } from 'next/server';

/**
 * Validates inbound CMS webhook requests.
 * Returns true if the shared secret matches.
 */
export function validateWebhook(request: NextRequest): boolean {
  const secret = request.headers.get('x-cms-webhook-secret');
  return !!secret && secret === process.env.CMS_WEBHOOK_SECRET;
}
```

**Step 2: Commit**

```bash
git add scripts/lib/webhook-validate.ts
git commit -m "feat: add webhook signature validation utility"
```

---

### Task 3: Content-Type Webhook Handlers

These handlers are called by the main webhook router when a specific content type is published.

**Files:**
- Create: `scripts/handlers/headers-config.ts`
- Create: `scripts/handlers/crawler-config.ts`
- Create: `scripts/handlers/security-config.ts`
- Create: `scripts/handlers/site-config.ts`
- Create: `scripts/handlers/persona.ts`

**Step 1: Headers Config handler**

```ts
// scripts/handlers/headers-config.ts
import { edgeWrite } from '../lib/edge-config';

interface HeadersConfigFields {
  title: string;
  csp: Record<string, { added?: string[] }>;
  permissions_policy: Record<string, string[]>;
  referrer_policy: string;
  hsts_max_age: number;
  hsts_include_sub_domains: boolean;
  hsts_preload: boolean;
  cors: {
    allowed_origins: string[];
    allowed_methods: string[];
    allowed_headers: string[];
    expose_headers: string[];
    max_age: number;
    allow_credentials: boolean;
  };
}

/**
 * Transforms CSP from the UCM "added" format into flat directive arrays.
 * The baseline defaults ('self') are prepended; the CMS only supplies additions.
 */
function buildCspDirectives(
  csp: Record<string, { added?: string[] }>
): Record<string, string[]> {
  const defaults: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'nonce-{nonce}'"],
    'style-src': ["'self'"],
    'img-src': ["'self'"],
    'font-src': ["'self'"],
    'connect-src': ["'self'"],
    'frame-src': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
  };

  const result: Record<string, string[]> = { ...defaults };

  for (const [directive, config] of Object.entries(csp)) {
    const base = defaults[directive] ?? [];
    result[directive] = [...base, ...(config.added ?? [])];
  }

  return result;
}

/**
 * Transforms permissions_policy from { feature: string[] } into
 * the format middleware expects: { feature: "(self)" | "()" | "(origin ...)" }
 */
function buildPermissionsPolicy(
  pp: Record<string, string[]>
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [feature, allowlist] of Object.entries(pp)) {
    if (allowlist.length === 0) {
      result[feature] = '()';
    } else {
      result[feature] = `(${allowlist.join(' ')})`;
    }
  }
  return result;
}

export async function handleHeadersConfig(fields: HeadersConfigFields) {
  await edgeWrite([
    { operation: 'upsert', key: 'headers:csp', value: buildCspDirectives(fields.csp) },
    { operation: 'upsert', key: 'headers:permissions', value: buildPermissionsPolicy(fields.permissions_policy) },
    { operation: 'upsert', key: 'headers:referrer', value: { policy: fields.referrer_policy } },
    {
      operation: 'upsert',
      key: 'headers:hsts',
      value: {
        max_age: fields.hsts_max_age,
        include_sub_domains: fields.hsts_include_sub_domains,
        preload: fields.hsts_preload,
      },
    },
    { operation: 'upsert', key: 'headers:cors', value: fields.cors },
  ]);
}
```

**Step 2: Crawler Config handler**

```ts
// scripts/handlers/crawler-config.ts
import { edgeWrite } from '../lib/edge-config';

interface CrawlerConfigFields {
  title: string;
  robots_txt: string;
  manifest: Record<string, unknown>;
  app_icon_small?: { url: string };
  app_icon_medium?: { url: string };
  app_icon_large?: { url: string };
  llms_enabled: boolean;
  llms_preamble: string;
  llms_exclude_patterns: string[];
}

export async function handleCrawlerConfig(fields: CrawlerConfigFields) {
  const icons: Array<{ src: string; sizes: string; type: string }> = [];
  if (fields.app_icon_small) icons.push({ src: fields.app_icon_small.url, sizes: '192x192', type: 'image/png' });
  if (fields.app_icon_medium) icons.push({ src: fields.app_icon_medium.url, sizes: '384x384', type: 'image/png' });
  if (fields.app_icon_large) icons.push({ src: fields.app_icon_large.url, sizes: '512x512', type: 'image/png' });

  await edgeWrite([
    { operation: 'upsert', key: 'crawler:robots', value: fields.robots_txt },
    { operation: 'upsert', key: 'crawler:manifest', value: { ...fields.manifest, icons } },
    {
      operation: 'upsert',
      key: 'crawler:llms:config',
      value: {
        enabled: fields.llms_enabled,
        preamble: fields.llms_preamble,
        exclude_patterns: fields.llms_exclude_patterns,
      },
    },
  ]);
}
```

**Step 3: Security Config handler**

```ts
// scripts/handlers/security-config.ts
import { edgeWrite } from '../lib/edge-config';

interface SecurityConfigFields {
  title: string;
  security_txt: string;
}

export async function handleSecurityConfig(fields: SecurityConfigFields) {
  await edgeWrite([
    { operation: 'upsert', key: 'security:txt', value: fields.security_txt },
  ]);
}
```

**Step 4: Site Config handler**

```ts
// scripts/handlers/site-config.ts
import { edgeWrite } from '../lib/edge-config';

interface SiteConfigFields {
  site_name: string;
  site_url: string;
  site_description?: string;
  default_locale: string;
  legal_name?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  favicon?: { url: string };
  favicon_svg?: { url: string };
  apple_touch_icon?: { url: string };
  og_image?: { url: string };
  error_pages?: Array<{ status_code: number; slug: string }>;
  [key: string]: unknown;
}

export async function handleSiteConfig(fields: SiteConfigFields) {
  // Build error pages map: { "404": "/error-404", "500": "/error-500" }
  const errorPagesMap: Record<string, string> = {};
  if (fields.error_pages) {
    for (const ep of fields.error_pages) {
      errorPagesMap[String(ep.status_code)] = `/${ep.slug}`;
    }
  }

  await edgeWrite([
    {
      operation: 'upsert',
      key: 'site',
      value: {
        site_name: fields.site_name,
        site_url: fields.site_url,
        site_description: fields.site_description,
        default_locale: fields.default_locale,
        legal_name: fields.legal_name,
        contact_email: fields.contact_email,
        contact_phone: fields.contact_phone,
        address: fields.address,
        favicon: fields.favicon?.url,
        favicon_svg: fields.favicon_svg?.url,
        apple_touch_icon: fields.apple_touch_icon?.url,
        og_image: fields.og_image?.url,
        error_pages: errorPagesMap,
      },
    },
  ]);
}
```

**Step 5: Persona handler**

```ts
// scripts/handlers/persona.ts
import { edgeWrite } from '../lib/edge-config';

interface PersonaFields {
  slug: string;
  display_name: string;
  system_prompt: string;
  search_bias?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Personas are written as an array — the webhook fetches ALL persona entries
 * and writes the full set. The caller is responsible for passing the
 * resolved array of persona fields.
 */
export async function handlePersonas(personas: PersonaFields[]) {
  await edgeWrite([
    { operation: 'upsert', key: 'personas', value: personas },
  ]);
}
```

**Step 6: Commit**

```bash
git add scripts/handlers/
git commit -m "feat: add Edge Config webhook handlers for all config singletons"
```

---

### Task 4: Webhook Router (API Route)

This is the main entry point called by Contentful. It validates the webhook, determines the content type, fetches the full entry from the CMA, and delegates to the appropriate handler.

**Files:**
- Create: `scripts/api/webhook-cms.ts`

**Step 1: Create the webhook router**

```ts
// scripts/api/webhook-cms.ts
//
// Copy this file to: apps/web/src/app/api/webhook/cms/route.ts
// in the consuming Next.js project.

import { type NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { validateWebhook } from '../../lib/webhook-validate';
import { edgeWrite } from '../../lib/edge-config';
import { handleHeadersConfig } from '../../handlers/headers-config';
import { handleCrawlerConfig } from '../../handlers/crawler-config';
import { handleSecurityConfig } from '../../handlers/security-config';
import { handleSiteConfig } from '../../handlers/site-config';
import { handlePersonas } from '../../handlers/persona';

// --- CMS Adapter (Contentful) ---

interface ContentfulWebhookPayload {
  sys: {
    type: string;
    id: string;
    contentType: { sys: { id: string } };
  };
  fields?: Record<string, Record<string, unknown>>; // { fieldName: { locale: value } }
}

/**
 * Flattens Contentful's locale-keyed fields to a flat object.
 * Uses en-US by default; extend for multi-locale.
 */
function flattenFields(
  fields: Record<string, Record<string, unknown>>,
  locale = 'en-US'
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, locales] of Object.entries(fields)) {
    result[key] = locales[locale];
  }
  return result;
}

// --- Route Handler ---

export async function POST(request: NextRequest) {
  if (!validateWebhook(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload: ContentfulWebhookPayload = await request.json();
    const contentType = payload.sys.contentType.sys.id;
    const entryId = payload.sys.id;

    // Flatten Contentful's locale-keyed fields
    const fields = payload.fields ? flattenFields(payload.fields) : {};

    console.log(`[webhook] ${contentType} (${entryId})`);

    switch (contentType) {
      case 'headersConfig':
      case 'headers-config':
        await handleHeadersConfig(fields as any);
        break;

      case 'crawlerConfig':
      case 'crawler-config':
        await handleCrawlerConfig(fields as any);
        break;

      case 'securityConfig':
      case 'security-config':
        await handleSecurityConfig(fields as any);
        break;

      case 'siteSettings':
      case 'site':
        await handleSiteConfig(fields as any);
        break;

      case 'persona':
        // For persona, we'd need to fetch ALL personas — this is a TODO
        // For now, write just this one as a placeholder
        await handlePersonas([fields as any]);
        break;

      case 'navigation':
      case 'mainNavigation':
      case 'navigation-item':
        revalidateTag('navigation');
        break;

      case 'page':
        // ISR — revalidate the specific page path
        const slug = fields.slug as string;
        if (slug) {
          revalidatePath(`/${slug}`);
        }
        break;

      case 'translationNamespace':
      case 'translation-namespace':
        // Requires full rebuild — trigger deploy hook
        await triggerDeployHook();
        break;

      default:
        console.log(`[webhook] Unhandled content type: ${contentType}`);
    }

    return NextResponse.json({
      success: true,
      contentType,
      entryId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[webhook] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function triggerDeployHook() {
  const url = process.env.VERCEL_DEPLOY_HOOK_URL;
  if (!url) {
    console.warn('[webhook] VERCEL_DEPLOY_HOOK_URL not set — skipping deploy');
    return;
  }
  await fetch(url, { method: 'POST' });
}
```

**Step 2: Commit**

```bash
git add scripts/api/webhook-cms.ts
git commit -m "feat: add CMS webhook router with content-type dispatch"
```

---

### Task 5: Edge Route Handlers

These are the route handlers that serve config from Edge Config at the edge.

**Files:**
- Create: `scripts/routes/robots-txt.ts`
- Create: `scripts/routes/manifest-json.ts`
- Create: `scripts/routes/security-txt.ts`

**Step 1: robots.txt route handler**

```ts
// scripts/routes/robots-txt.ts
//
// Copy to: apps/web/src/app/robots.txt/route.ts

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

**Step 2: manifest.json route handler**

```ts
// scripts/routes/manifest-json.ts
//
// Copy to: apps/web/src/app/manifest.json/route.ts

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

**Step 3: security.txt route handler**

```ts
// scripts/routes/security-txt.ts
//
// Copy to: apps/web/src/app/.well-known/security.txt/route.ts

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

**Step 4: Commit**

```bash
git add scripts/routes/
git commit -m "feat: add edge route handlers for robots.txt, manifest.json, security.txt"
```

---

### Task 6: Middleware (Security Headers from Edge Config)

**Files:**
- Create: `scripts/middleware/headers-middleware.ts`

**Step 1: Create the middleware**

```ts
// scripts/middleware/headers-middleware.ts
//
// Copy to: apps/web/middleware.ts (root of the Next.js app, NOT inside src/)

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
  const hsts = config.get('headers:hsts') as {
    max_age: number;
    include_sub_domains?: boolean;
    preload?: boolean;
  } | undefined;
  const cors = config.get('headers:cors') as {
    allowed_origins: string[];
    allowed_methods: string[];
    allowed_headers: string[];
    expose_headers?: string[];
    max_age?: number;
    allow_credentials?: boolean;
  } | undefined;

  // --- CSP with per-request nonce ---
  if (csp) {
    const nonce = generateNonce();
    response.headers.set('Content-Security-Policy', buildCspString(csp, nonce));
    response.headers.set('x-nonce', nonce);
  }

  // --- Permissions-Policy ---
  if (permissions) {
    const pp = Object.entries(permissions)
      .map(([feature, allowlist]) => `${feature}=${allowlist}`)
      .join(', ');
    response.headers.set('Permissions-Policy', pp);
  }

  // --- Referrer-Policy ---
  if (referrer?.policy) {
    response.headers.set('Referrer-Policy', referrer.policy);
  }

  // --- HSTS ---
  if (hsts) {
    let value = `max-age=${hsts.max_age}`;
    if (hsts.include_sub_domains) value += '; includeSubDomains';
    if (hsts.preload) value += '; preload';
    response.headers.set('Strict-Transport-Security', value);
  }

  // --- CORS (cross-origin requests only) ---
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
      const resolved = values.map((v) => v.replace('{nonce}', nonce));
      return `${directive} ${resolved.join(' ')}`;
    })
    .join('; ');
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
```

**Step 2: Commit**

```bash
git add scripts/middleware/
git commit -m "feat: add middleware for Edge Config-driven security headers"
```

---

### Task 7: Seed Script (Local Testing)

A script that reads the demo content JSON files from `content/` and writes them to Edge Config — useful for initial population and testing.

**Files:**
- Create: `scripts/seed-edge-config.ts`

**Step 1: Create the seed script**

```ts
// scripts/seed-edge-config.ts
//
// Usage: npx tsx scripts/seed-edge-config.ts
// Requires: EDGE_CONFIG_ID and VERCEL_API_TOKEN in .env.local

import * as fs from 'node:fs';
import * as path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const EDGE_CONFIG_ID = process.env.EDGE_CONFIG_ID;
const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;

if (!EDGE_CONFIG_ID || !VERCEL_API_TOKEN) {
  console.error('Missing EDGE_CONFIG_ID or VERCEL_API_TOKEN in .env.local');
  process.exit(1);
}

async function edgeWrite(
  items: Array<{ operation: string; key: string; value?: unknown }>
) {
  const res = await fetch(
    `https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items }),
    }
  );
  if (!res.ok) {
    throw new Error(`Edge Config write failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

function readContent(filePath: string): Record<string, unknown> {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

async function seed() {
  const contentDir = path.resolve(__dirname, '../content');

  // --- Headers Config ---
  const headers = readContent(path.join(contentDir, 'headers-config/default.json'));
  const hf = headers.fields as any;
  console.log('Seeding headers-config...');
  await edgeWrite([
    { operation: 'upsert', key: 'headers:csp', value: hf.csp },
    { operation: 'upsert', key: 'headers:permissions', value: hf.permissions_policy },
    { operation: 'upsert', key: 'headers:referrer', value: { policy: hf.referrer_policy } },
    {
      operation: 'upsert',
      key: 'headers:hsts',
      value: {
        max_age: hf.hsts_max_age,
        include_sub_domains: hf.hsts_include_sub_domains,
        preload: hf.hsts_preload,
      },
    },
    { operation: 'upsert', key: 'headers:cors', value: hf.cors },
  ]);

  // --- Crawler Config ---
  const crawler = readContent(path.join(contentDir, 'crawler-config/default.json'));
  const cf = crawler.fields as any;
  console.log('Seeding crawler-config...');
  await edgeWrite([
    { operation: 'upsert', key: 'crawler:robots', value: cf.robots_txt },
    { operation: 'upsert', key: 'crawler:manifest', value: cf.manifest },
    {
      operation: 'upsert',
      key: 'crawler:llms:config',
      value: {
        enabled: cf.llms_enabled,
        preamble: cf.llms_preamble,
        exclude_patterns: cf.llms_exclude_patterns,
      },
    },
  ]);

  // --- Security Config ---
  const security = readContent(path.join(contentDir, 'security-config/default.json'));
  const sf = security.fields as any;
  console.log('Seeding security-config...');
  await edgeWrite([
    { operation: 'upsert', key: 'security:txt', value: sf.security_txt },
  ]);

  // --- Site Config ---
  const site = readContent(path.join(contentDir, 'site/config.json'));
  const sitef = site.fields as any;
  console.log('Seeding site...');
  await edgeWrite([
    {
      operation: 'upsert',
      key: 'site',
      value: {
        site_name: sitef.site_name,
        site_url: sitef.site_url,
        site_description: sitef.site_description,
        default_locale: sitef.default_locale,
        legal_name: sitef.legal_name,
        contact_email: sitef.contact_email,
        contact_phone: sitef.contact_phone,
        address: sitef.address,
      },
    },
  ]);

  console.log('Done! All config seeded to Edge Config.');
}

seed().catch(console.error);
```

**Step 2: Commit**

```bash
git add scripts/seed-edge-config.ts
git commit -m "feat: add seed script to populate Edge Config from demo content"
```

---

### Task 8: Update .env.local.example

**Files:**
- Modify: `backup/.env.local.example` (already exists — verify it has all needed vars)

**Step 1: Verify and update**

The existing file at `backup/.env.local.example` already has all the required variables. No changes needed — just confirm it covers:

- `EDGE_CONFIG`
- `EDGE_CONFIG_ID`
- `VERCEL_API_TOKEN`
- `VERCEL_DEPLOY_HOOK_URL`
- `CMS_WEBHOOK_SECRET`

---

### Task 9: Integration into the WPP Project

This task is about wiring the baseline scripts into the actual Next.js app at `akqa-dk-wpp-com`.

**Files to create in the WPP project:**
- `apps/web/src/lib/edge-config.ts` — copy from `scripts/lib/edge-config.ts`
- `apps/web/src/app/api/webhook/cms/route.ts` — adapted from `scripts/api/webhook-cms.ts`
- `apps/web/src/app/robots.txt/route.ts` — from `scripts/routes/robots-txt.ts`
- `apps/web/src/app/manifest.json/route.ts` — from `scripts/routes/manifest-json.ts`
- `apps/web/src/app/.well-known/security.txt/route.ts` — from `scripts/routes/security-txt.ts`
- `apps/web/middleware.ts` — from `scripts/middleware/headers-middleware.ts`

**Step 1: Install `@vercel/edge-config` in the web app**

```bash
cd apps/web && npm install @vercel/edge-config
```

**Step 2: Add Edge Config env vars to `.env.example`**

Append to `apps/web/.env.example`:

```
########################################################
# Vercel Edge Config
########################################################
EDGE_CONFIG=
EDGE_CONFIG_ID=
VERCEL_API_TOKEN=
VERCEL_DEPLOY_HOOK_URL=
CMS_WEBHOOK_SECRET=
```

**Step 3: Copy / adapt files**

Each file from `scripts/` should be copied and import paths adjusted to use `@/lib/edge-config` (the Next.js alias). The webhook router imports should be adjusted to inline or reference the handlers from a local `lib/webhook-handlers/` directory.

**Step 4: Commit**

```bash
git add apps/web/src/lib/edge-config.ts apps/web/src/app/api/ apps/web/src/app/robots.txt/ apps/web/src/app/manifest.json/ apps/web/src/app/.well-known/ apps/web/middleware.ts apps/web/.env.example
git commit -m "feat: integrate Edge Config into WPP Next.js app"
```

---

## Edge Config Key Reference

| Key | Source Content Type | Written By | Read By |
|-----|-------------------|------------|---------|
| `site` | site | `handleSiteConfig` | Layout, error pages |
| `headers:csp` | headers-config | `handleHeadersConfig` | `middleware.ts` |
| `headers:permissions` | headers-config | `handleHeadersConfig` | `middleware.ts` |
| `headers:referrer` | headers-config | `handleHeadersConfig` | `middleware.ts` |
| `headers:hsts` | headers-config | `handleHeadersConfig` | `middleware.ts` |
| `headers:cors` | headers-config | `handleHeadersConfig` | `middleware.ts` |
| `security:txt` | security-config | `handleSecurityConfig` | `/.well-known/security.txt` route |
| `crawler:robots` | crawler-config | `handleCrawlerConfig` | `/robots.txt` route |
| `crawler:manifest` | crawler-config | `handleCrawlerConfig` | `/manifest.json` route |
| `crawler:llms:config` | crawler-config | `handleCrawlerConfig` | Prebuild script |
| `personas` | persona | `handlePersonas` | Search API |

---

## Verification Checklist

After implementation, verify:

- [ ] `curl -I https://your-domain/` shows CSP, Permissions-Policy, HSTS, Referrer-Policy headers
- [ ] `curl https://your-domain/robots.txt` returns CMS-managed robots.txt
- [ ] `curl https://your-domain/manifest.json` returns CMS-managed manifest
- [ ] `curl https://your-domain/.well-known/security.txt` returns CMS-managed security.txt
- [ ] Publishing `headers-config` in Contentful → headers update within seconds (no redeploy)
- [ ] Publishing `crawler-config` in Contentful → robots.txt updates within 60s
- [ ] Publishing `navigation` in Contentful → nav refreshes without rebuild
- [ ] Publishing a `page` in Contentful → ISR revalidates that path
