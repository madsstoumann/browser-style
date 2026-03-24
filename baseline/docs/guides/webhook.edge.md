---
sidebar_label: Webhook & Edge Delivery
---

# Webhook & Edge Delivery

> How Baseline CMS content models flow from CMS to runtime via webhooks, edge stores, and generated files.
>
> For platform-specific implementation (webhook handlers, middleware, route handlers, edge store clients), see:
> - [Vercel (Next.js)](./vercel.md)
> - [Cloudflare (Workers)](./cloudflare.md)
> - [Markdown Endpoints](./markdown-endpoints.md)

---

## 1. Principle

**Nothing is fetched from the CMS at request time.** Content flows through four delivery channels, chosen by update frequency and payload size:

| Channel | Latency | Redeploy? | Best for |
|---------|---------|-----------|----------|
| **Edge store** (Edge Config / KV) | < 1ms read | No | Small config (headers, personas, site settings) |
| **Framework cache + tags** | 0ms (cached) / seconds (revalidated) | No | Shared data needed per-request but rarely changing (navigation) |
| **Generated files** | Next build | Yes (deploy hook) | Large aggregated output (sitemap, llms.txt, locale files) |
| **ISR / Cache API** | Seconds | No | Page content |

---

## 2. Delivery Matrix

| Content Type | Singleton? | Webhook Action | Delivery Channel | Runtime Access |
|---|---|---|---|---|
| `site` | Yes | Batch write to edge store | Edge store | Layout reads at build/ISR |
| `headers-config` | Yes | Batch write 5 keys (csp, permissions, referrer, hsts, cors) | Edge store | Middleware sets HTTP headers per request |
| `security-config` | Yes | Write to edge store | Edge store | Route handler serves `/.well-known/security.txt` |
| `crawler-config` | Yes | Batch write to edge store; deploy hook if sitemap/llms settings changed | Edge store + generated files | Route handlers for `robots.txt`, `manifest.json`; static files for `sitemap.xml`, `llms.txt` |
| `persona` | No | Write all personas to edge store | Edge store | Search UI reads persona list |
| `external-script` | No | Re-resolve site refs, write to edge store | Edge store | Layout reads script list |
| `social-link` | No | Re-resolve site refs, write to edge store | Edge store | Footer reads social links |
| `error-page` | No | Re-resolve site refs, write error map to edge store | Edge store | Error handler maps status code → page |
| `translation-namespace` | No | Deploy hook → prebuild generates locale files | Generated files (`locales/*.json`) | App i18n provider reads at build |
| `navigation` | No | Invalidate cache tag `navigation` | Framework cache | Layout reads cached, tag-revalidated on publish |
| `navigation-item` | No | Invalidate cache tag `navigation` | Framework cache | Same — any item change invalidates all nav caches |
| `page` | No | ISR revalidation by path (HTML + markdown) | ISR / Cache API | Normal rendering |
| `layout` | No | ISR revalidation of parent pages (HTML + markdown); deploy hook if `includeInMarkdown` changed | ISR / Cache API + generated files | Normal rendering |

---

## 3. Shared Utilities

### 3.1 Deploy Hook Trigger

```ts
// lib/deploy-hook.ts
const DEPLOY_HOOK_URL = process.env.VERCEL_DEPLOY_HOOK_URL
  ?? process.env.PAGES_BUILD_HOOK_URL;

export async function triggerDeploy(reason: string) {
  if (!DEPLOY_HOOK_URL) {
    console.warn(`Deploy hook not configured, skipping: ${reason}`);
    return;
  }
  await fetch(DEPLOY_HOOK_URL, { method: 'POST' });
  console.log(`Deploy triggered: ${reason}`);
}
```

### 3.2 CMS Adapter

Abstract CMS fetch — adapter pattern matches UCM's existing architecture:

```ts
// lib/cms.ts
import { getAdapter } from '@/adapters';

const cms = getAdapter(process.env.CMS_PLATFORM);

export async function fetchEntry(contentType: string, entryId: string) {
  return cms.getEntry(contentType, entryId);
}

export async function fetchAllEntries(contentType: string, options?: {
  locale?: string;
  resolve?: string[];
}) {
  return cms.getEntries(contentType, options);
}
```

### 3.3 Webhook Validation

```ts
// lib/webhook.ts
import { createHmac } from 'crypto';

const WEBHOOK_SECRET = process.env.CMS_WEBHOOK_SECRET;

export function validateWebhook(request: Request, body: string): boolean {
  const signature = request.headers.get('x-contentful-signature')
    ?? request.headers.get('x-webhook-signature')
    ?? '';
  const expected = createHmac('sha256', WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');
  return signature === expected;
}

/**
 * Extract the content type ID from the webhook payload.
 * CMS-specific: adapters normalize the payload shape.
 */
export function extractContentType(payload: any): string {
  // Contentful
  if (payload?.sys?.contentType?.sys?.id) {
    return payload.sys.contentType.sys.id;
  }
  // Storyblok
  if (payload?.story?.content?.component) {
    return payload.story.content.component;
  }
  // Fallback: UCM-normalized webhook payloads
  return payload?.contentType ?? 'unknown';
}

export function extractEntryId(payload: any): string {
  return payload?.sys?.id ?? payload?.entry?.uid ?? payload?.story?.uuid ?? '';
}
```

---

## 4. Webhook Endpoint

Single serverless function receives all CMS publish events and routes to the appropriate handler:

```ts
// app/api/webhook/cms/route.ts (Vercel)
// src/webhook/index.ts (Cloudflare)
import { NextResponse } from 'next/server';
import { validateWebhook, extractContentType, extractEntryId } from '@/lib/webhook';
import {
  handleSite,
  handleHeadersConfig,
  handleSecurityConfig,
  handleCrawlerConfig,
  handlePersona,
  handleTranslations,
  handleNavigation,
  handlePage,
  handleLayout,
} from './handlers';

const handlers: Record<string, (entryId: string, payload: any) => Promise<void>> = {
  'site':                   handleSite,
  'headers-config':         handleHeadersConfig,
  'security-config':        handleSecurityConfig,
  'crawler-config':         handleCrawlerConfig,
  'persona':                handlePersona,
  'translation-namespace':  handleTranslations,
  'navigation':             handleNavigation,
  'navigation-item':        handleNavigation,
  'page':                   handlePage,
  'layout':                 handleLayout,
};

export async function POST(request: Request) {
  const body = await request.text();

  if (!validateWebhook(request, body)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const payload = JSON.parse(body);
  const contentType = extractContentType(payload);
  const entryId = extractEntryId(payload);

  const handler = handlers[contentType];
  if (!handler) {
    return NextResponse.json({ skipped: true, contentType }, { status: 200 });
  }

  try {
    await handler(entryId, payload);
    return NextResponse.json({ ok: true, contentType, entryId });
  } catch (err) {
    console.error(`Webhook handler failed for ${contentType}:`, err);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }
}
```

For the full implementation of each handler, see [Vercel](./vercel.md) or [Cloudflare](./cloudflare.md).

---

## 5. Build-Time Generation (Prebuild)

Generates files too large for the edge store. Runs as part of `npm run build` via the `prebuild` script.

### 5.1 Translations

<details>
<summary><code>scripts/prebuild/translations.ts</code></summary>

```ts
import { fetchAllEntries } from '@/lib/cms';
import { writeFileSync, mkdirSync } from 'fs';

export async function generateLocaleFiles(locales: string[]) {
  const namespaces = await fetchAllEntries('translation-namespace');

  for (const locale of locales) {
    const flat: Record<string, string> = {};

    for (const ns of namespaces) {
      const strings = ns.fields.strings?.[locale]
        ?? ns.fields.strings?.['en-US']
        ?? {};

      for (const [key, value] of Object.entries(strings)) {
        flat[`${ns.fields.namespace}.${key}`] = value as string;
      }
    }

    mkdirSync('./locales', { recursive: true });
    writeFileSync(
      `./locales/${locale}.json`,
      JSON.stringify(flat, null, 2)
    );
    console.log(`Generated locales/${locale}.json (${Object.keys(flat).length} keys)`);
  }
}
```

</details>

### 5.2 Sitemap

<details>
<summary><code>scripts/prebuild/sitemap.ts</code></summary>

```ts
import { fetchAllEntries } from '@/lib/cms';
import { edgeGet } from '@/lib/edge-config';
import { writeFileSync } from 'fs';

export async function generateSitemap(siteUrl: string, locales: string[]) {
  const config = await edgeGet<any>('crawler:sitemap:config');
  if (!config?.enabled) {
    console.log('Sitemap generation disabled');
    return;
  }

  const pages = await fetchAllEntries('page');
  const excludes = config.exclude_patterns ?? [];

  const urls = pages
    .filter(p => !excludes.some((pat: string) => matchPattern(p.fields.url, pat)))
    .flatMap(p =>
      locales.map(locale => {
        const loc = locale === locales[0] ? '' : `/${locale}`;
        const pageUrl = p.fields.url === '/' ? '' : `/${p.fields.url}`;
        return `  <url>
    <loc>${siteUrl}${loc}${pageUrl}</loc>
    <lastmod>${p.sys?.updatedAt ?? new Date().toISOString()}</lastmod>
${locales.map(l => {
  const altLoc = l === locales[0] ? '' : `/${l}`;
  return `    <xhtml:link rel="alternate" hreflang="${l}" href="${siteUrl}${altLoc}${pageUrl}" />`;
}).join('\n')}
  </url>`;
      })
    );

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`;

  writeFileSync('./public/sitemap.xml', sitemap);
  console.log(`Generated sitemap.xml (${pages.length} pages × ${locales.length} locales)`);
}

function matchPattern(url: string, pattern: string): boolean {
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
  return regex.test(`/${url}`);
}
```

</details>

### 5.3 LLMs Files

<details>
<summary><code>scripts/prebuild/llms.ts</code></summary>

```ts
import { fetchAllEntries } from '@/lib/cms';
import { edgeGet } from '@/lib/edge-config';
import { layoutToMarkdown } from '@/lib/markdown';
import { writeFileSync } from 'fs';

export async function generateLlmsFiles(siteUrl: string) {
  const config = await edgeGet<any>('crawler:llms:config');
  if (!config?.enabled) {
    console.log('LLMs file generation disabled');
    return;
  }

  const pages = await fetchAllEntries('page', { resolve: ['layouts'] });
  const { preamble = '', exclude_patterns = [] } = config;

  const filtered = pages.filter(
    p => !exclude_patterns.some((pat: string) => matchPattern(p.fields.url, pat))
  );

  // llms.txt — index listing with .md URLs
  const index = [
    preamble,
    '',
    '## Pages',
    '',
    ...filtered.map(p => `- [${p.fields.title}](${siteUrl}/${p.fields.url}.md)`),
  ].join('\n');

  // llms-full.txt — full markdown body per page
  const full = [
    preamble,
    '',
    ...filtered.map(p => {
      const layouts = (p.fields.layouts ?? [])
        .filter((l: any) => l.fields?.includeInMarkdown !== false);

      if (layouts.length === 0) return null;

      const body = layouts
        .map((l: any) => layoutToMarkdown(l))
        .filter(Boolean)
        .join('\n\n---\n\n');

      return `# ${p.fields.title}\n\nSource: ${siteUrl}/${p.fields.url}\n\n${body}`;
    }).filter(Boolean),
  ].join('\n\n---\n\n');

  writeFileSync('./public/llms.txt', index);
  writeFileSync('./public/llms-full.txt', full);
  console.log(`Generated llms.txt (${filtered.length} pages) and llms-full.txt`);
}

function matchPattern(url: string, pattern: string): boolean {
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
  return regex.test(`/${url}`);
}
```

</details>

### 5.4 Prebuild Entry Point

```ts
// scripts/prebuild.ts
import { generateLocaleFiles } from './prebuild/translations';
import { generateSitemap } from './prebuild/sitemap';
import { generateLlmsFiles } from './prebuild/llms';
import { edgeGet } from '@/lib/edge-config';

async function prebuild() {
  console.log('--- Prebuild start ---');

  const site = await edgeGet<any>('site');
  const siteUrl = site?.site_url ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com';
  const locales = (process.env.LOCALES ?? 'en-US').split(',').map(l => l.trim());

  await Promise.all([
    generateLocaleFiles(locales),
    generateSitemap(siteUrl, locales),
    generateLlmsFiles(siteUrl),
  ]);

  console.log('--- Prebuild complete ---');
}

prebuild().catch(err => {
  console.error('Prebuild failed:', err);
  process.exit(1);
});
```

```json
{
  "scripts": {
    "prebuild": "tsx scripts/prebuild.ts",
    "build": "npm run prebuild && next build"
  }
}
```

---

## 6. Webhook Configuration in CMS

### Contentful

Four webhooks, all pointing to the same endpoint. Contentful filters by content type natively — the handler routes internally.

| Webhook Name | Trigger | Content Type Filter |
|---|---|---|
| Config Sync | Entry publish | `site`, `headers-config`, `security-config`, `crawler-config`, `persona` |
| Translations | Entry publish | `translation-namespace` |
| Navigation | Entry publish | `navigation`, `navigation-item` |
| Content | Entry publish/unpublish | `page`, `layout` |

### Webhook URL

```
https://{your-domain}/api/webhook/cms
```

### Headers (all webhooks)

```
X-Webhook-Secret: {CMS_WEBHOOK_SECRET}
Content-Type: application/json
```

### Other CMS Platforms

The webhook payload format differs per CMS, but the routing logic is identical. The `extractContentType()` and `extractEntryId()` functions in `lib/webhook.ts` handle Contentful, Storyblok, and generic UCM payloads. Add platform-specific extraction as needed.

---

## 7. Fallback Strategy

If the edge store or webhooks fail, the system degrades gracefully:

| Scenario | Fallback | Recovery |
|----------|----------|----------|
| Edge store read fails | Middleware skips header injection; route handlers return empty/defaults | Automatic on next request when store recovers |
| Edge store write fails | Webhook returns 500; CMS retries (Contentful retries 3×) | Re-publish entry in CMS to retrigger |
| Deploy hook fails | Static files stale until next deploy | Manual deploy or re-publish triggering entry |
| ISR revalidation fails | Serves stale cached page | Next request triggers on-demand revalidation |
| CMS unreachable during prebuild | Build fails, previous deployment stays live | Fix CMS connectivity, redeploy |

### Manual recovery

```bash
# Trigger a deploy manually
curl -X POST $VERCEL_DEPLOY_HOOK_URL

# Revalidate a specific page
curl "https://{domain}/api/revalidate?path=/about&secret={REVALIDATION_SECRET}"
```

---

## 8. Summary

```
CMS Publish
    │
    ├─ site
    │     └─ Webhook → Edge store (batch write, instant)
    │
    ├─ headers-config
    │     └─ Webhook → Edge store (batch write, 5 keys atomic)
    │           └─ Middleware reads per request → sets HTTP headers
    │
    ├─ security-config
    │     └─ Webhook → Edge store
    │           └─ Route handler serves /.well-known/security.txt
    │
    ├─ crawler-config
    │     ├─ robots/manifest changed → Edge store only (instant)
    │     └─ sitemap/llms changed   → Edge store + deploy hook
    │           └─ Prebuild generates sitemap.xml, llms.txt, llms-full.txt
    │
    ├─ persona
    │     └─ Webhook → Edge store (all personas, sorted)
    │
    ├─ navigation / navigation-item
    │     └─ Webhook → Invalidate cache tag
    │           └─ Next request re-fetches and caches
    │
    ├─ translation-namespace
    │     └─ Webhook → Deploy hook
    │           └─ Prebuild generates locales/{locale}.json
    │
    └─ page / layout
          └─ Webhook → ISR revalidation (HTML + markdown, per-path)
                └─ If markdown-relevant → deploy hook for llms regeneration
```

Four channels. Batch writes. Smart diffing. Zero CMS calls at runtime.
