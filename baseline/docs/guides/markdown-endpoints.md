---
sidebar_label: Markdown Endpoints
---

# Markdown Endpoints

> Serve any page as clean markdown via `{url}.md`.
> Uses `includeInMarkdown` on Layout to control which sections appear.

---

## 1. URL Mapping

| Browser URL | Markdown URL | Resolved slug |
|---|---|---|
| `domain.com/` | `domain.com/index.md` | `/` |
| `domain.com/about` | `domain.com/about.md` | `about` |
| `domain.com/products/widget` | `domain.com/products/widget.md` | `products/widget` |

Rules:
- Homepage is always `index.md`, never `.md` or `/.md`
- Every other page appends `.md` to its existing slug
- The `.md` URL returns `text/markdown` — the HTML page continues to work at its normal URL
- Static files (`robots.txt`, `manifest.json`, images) are never matched

---

## 2. Design Decision

Several approaches were considered. The chosen approach — **request interception + dedicated route** — wins on all platforms because:

- **Per-slug cache** — each page gets its own cache entry at the edge
- **Live content** — cached responses are invalidated via webhook, not stale until redeploy
- **Minimal overhead** — a single `endsWith('.md')` check in the request handler
- **Homepage support** — `index.md` is normalised to slug `/` before routing

Alternatives rejected:
- **API route with query param** — defeats per-page edge caching, no ISR
- **Config-level rewrites** — can't handle `index.md`, no runtime logic
- **Content negotiation** (`Accept: text/markdown`) — crawlers and LLMs don't send this header; the `llms.txt` spec uses URL-based `.md` addressing
- **Static generation at build time** — stale until redeploy; webhook-driven caching gives both freshness and performance

---

## 3. Content-to-Markdown Conversion

This logic is shared across all platforms.

### Logic

1. Render page `title` as `# heading` and `description` as a blockquote
2. Iterate the page's `layouts[]` in order
3. **Skip** any layout where `includeInMarkdown` is not `true`
4. For each included layout, convert its CMS content to markdown (headings, paragraphs, images, links, etc.)
5. Return the full page as a single markdown document

Set `includeInMarkdown: false` on decorative or interactive sections (hero animations, image carousels, embedded widgets) to exclude them from the markdown output.

### Reference Implementation — `lib/markdown.ts`

<details>
<summary>Full source — <code>lib/markdown.ts</code></summary>

```ts
// lib/markdown.ts

interface Page {
  fields: {
    title: string;
    url: string;
    description?: string;
    og_image?: { url: string; alt?: string };
    layouts?: Layout[];
  };
}

interface Layout {
  fields: {
    title?: string;
    includeInMarkdown?: boolean;
    content?: ContentCard[];
  };
}

interface ContentCard {
  fields: {
    headline?: string;
    subheadline?: string;
    summary?: string;
    category?: string;
    tags?: string[];
    media?: { url: string; alt?: string; title?: string };
    data?: Record<string, unknown>;
  };
}

/**
 * Convert a full page (with resolved references) to markdown.
 */
export function pageToMarkdown(page: Page): string {
  const { title, url, description, layouts = [] } = page.fields;

  const parts: string[] = [];

  // ── Front matter ────────────────────────────────────────────
  parts.push(buildFrontMatter({ title, url, description }));

  // ── Page heading ────────────────────────────────────────────
  parts.push(`# ${title}\n`);

  if (description) {
    parts.push(`> ${description}\n`);
  }

  // ── Layouts (only those marked for markdown) ────────────────
  const included = layouts.filter(
    (l) => l.fields?.includeInMarkdown !== false
  );

  for (const layout of included) {
    const section = layoutToMarkdown(layout);
    if (section) parts.push(section);
  }

  return parts.join('\n---\n\n');
}

/**
 * YAML-style front matter for tooling that parses it
 * (Obsidian, gray-matter, llm-context, etc.)
 */
function buildFrontMatter(meta: {
  title: string;
  url: string;
  description?: string;
}): string {
  const lines = [
    '---',
    `title: "${escapeFM(meta.title)}"`,
    `url: "${meta.url}"`,
  ];
  if (meta.description) {
    lines.push(`description: "${escapeFM(meta.description)}"`);
  }
  lines.push('---', '');
  return lines.join('\n');
}

function escapeFM(s: string): string {
  return s.replace(/"/g, '\\"');
}

/**
 * Convert a single layout section to markdown.
 */
export function layoutToMarkdown(layout: Layout): string | null {
  const { title, content = [] } = layout.fields;

  if (content.length === 0) return null;

  const parts: string[] = [];

  if (title) {
    parts.push(`## ${title}\n`);
  }

  for (const card of content) {
    const md = cardToMarkdown(card);
    if (md) parts.push(md);
  }

  return parts.join('\n');
}

/**
 * Convert a content card to markdown.
 *
 * The mapping is intentionally simple — markdown is a text format.
 * Visual elements (animations, grid config, themes) are irrelevant here.
 */
export function cardToMarkdown(card: ContentCard): string | null {
  const { headline, subheadline, summary, media, tags, data } = card.fields;

  // Skip completely empty cards
  if (!headline && !summary && !data) return null;

  const parts: string[] = [];

  if (headline) parts.push(`### ${headline}\n`);
  if (subheadline) parts.push(`**${subheadline}**\n`);
  if (media?.url) {
    const alt = media.alt ?? media.title ?? headline ?? '';
    parts.push(`![${alt}](${media.url})\n`);
  }
  if (summary) parts.push(`${summary}\n`);

  // Type-specific data (see §3.3)
  if (data) {
    const extra = dataToMarkdown(data);
    if (extra) parts.push(extra);
  }

  if (tags?.length) {
    parts.push(`*Tags: ${tags.join(', ')}*\n`);
  }

  return parts.join('\n');
}

/**
 * Convert the polymorphic `data` JSON blob to markdown.
 * Each card category stores different fields in `data`.
 */
function dataToMarkdown(data: Record<string, unknown>): string | null {
  const parts: string[] = [];

  // ── Rich text / body ────────────────────────────────────────
  if (typeof data.body === 'string') {
    parts.push(data.body);
  }
  if (data.$richtext) {
    parts.push(richtextToMarkdown(data.$richtext));
  }

  // ── FAQ / accordion items ───────────────────────────────────
  if (Array.isArray(data.items)) {
    for (const item of data.items) {
      if (item.question && item.answer) {
        parts.push(`**Q: ${item.question}**\n\n${item.answer}\n`);
      }
    }
  }

  // ── Key-value pairs (specs, details) ────────────────────────
  if (data.specs && typeof data.specs === 'object') {
    for (const [key, value] of Object.entries(data.specs as Record<string, string>)) {
      parts.push(`- **${key}:** ${value}`);
    }
    parts.push('');
  }

  // ── Links / actions ─────────────────────────────────────────
  if (Array.isArray(data.actions)) {
    for (const action of data.actions) {
      if (action.url && action.label) {
        parts.push(`[${action.label}](${action.url})`);
      }
    }
    parts.push('');
  }

  // ── Price ───────────────────────────────────────────────────
  if (data.price != null) {
    const currency = (data.currency as string) ?? '';
    parts.push(`**Price:** ${currency} ${data.price}\n`);
  }

  // ── Date / event ────────────────────────────────────────────
  if (data.startDate) {
    const line = data.endDate
      ? `**Date:** ${data.startDate} — ${data.endDate}`
      : `**Date:** ${data.startDate}`;
    parts.push(`${line}\n`);
  }
  if (data.location) {
    parts.push(`**Location:** ${data.location}\n`);
  }

  return parts.length ? parts.join('\n') : null;
}

/**
 * Convert CMS rich text AST (Contentful format) to markdown.
 * For other CMS platforms, the adapter normalises to this shape.
 */
function richtextToMarkdown(node: any): string {
  if (typeof node === 'string') return node;
  if (!node || !node.nodeType) return '';

  switch (node.nodeType) {
    case 'document':
      return (node.content ?? []).map(richtextToMarkdown).join('\n\n');
    case 'paragraph':
      return (node.content ?? []).map(richtextToMarkdown).join('');
    case 'heading-1':
      return `# ${inlineContent(node)}`;
    case 'heading-2':
      return `## ${inlineContent(node)}`;
    case 'heading-3':
      return `### ${inlineContent(node)}`;
    case 'heading-4':
      return `#### ${inlineContent(node)}`;
    case 'heading-5':
      return `##### ${inlineContent(node)}`;
    case 'heading-6':
      return `###### ${inlineContent(node)}`;
    case 'unordered-list':
      return (node.content ?? [])
        .map((li: any) => `- ${inlineContent(li)}`)
        .join('\n');
    case 'ordered-list':
      return (node.content ?? [])
        .map((li: any, i: number) => `${i + 1}. ${inlineContent(li)}`)
        .join('\n');
    case 'list-item':
      return (node.content ?? []).map(richtextToMarkdown).join('');
    case 'blockquote':
      return (node.content ?? [])
        .map((c: any) => `> ${richtextToMarkdown(c)}`)
        .join('\n');
    case 'hr':
      return '---';
    case 'hyperlink':
      return `[${inlineContent(node)}](${node.data?.uri ?? ''})`;
    case 'embedded-asset-block': {
      const file = node.data?.target?.fields?.file;
      const alt = node.data?.target?.fields?.title ?? '';
      return file ? `![${alt}](${file.url})` : '';
    }
    case 'text': {
      let text = node.value ?? '';
      for (const mark of node.marks ?? []) {
        if (mark.type === 'bold') text = `**${text}**`;
        if (mark.type === 'italic') text = `*${text}*`;
        if (mark.type === 'code') text = `\`${text}\``;
      }
      return text;
    }
    default:
      return (node.content ?? []).map(richtextToMarkdown).join('');
  }
}

function inlineContent(node: any): string {
  return (node.content ?? []).map(richtextToMarkdown).join('');
}
```

</details>

---

## 4. Platform: Vercel (Next.js)

### 4.1 Middleware

The `.md` check is the **first** thing in middleware, before header injection. If the request is for markdown, rewrite immediately — no need to set CSP/permissions on a `text/markdown` response.

```ts
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { edgeGetAll } from '@/lib/edge-config';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Markdown rewrite ──────────────────────────────────────
  if (pathname.endsWith('.md')) {
    const slug = pathname === '/index.md'
      ? '/'
      : pathname.slice(1, -3);   // "about.md" → "about"

    const url = request.nextUrl.clone();
    url.pathname = `/_md/${slug}`;
    return NextResponse.rewrite(url);
  }

  // ── 2. Normal HTML requests — apply security headers ─────────
  const response = NextResponse.next();

  const config = await edgeGetAll([
    'headers:csp',
    'headers:permissions',
    'headers:referrer',
  ]);

  // ... header injection (see guides/vercel.md for full middleware)

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
```

The middleware rewrites `.md` requests to an internal `/_md/` prefix that is never exposed to the user. The user sees `about.md` in the address bar.

### 4.2 Route Handlers

```ts
// app/_md/[...slug]/route.ts
import { fetchPage } from '@/lib/cms';
import { pageToMarkdown } from '@/lib/markdown';

// ISR: cache for 1 hour at the edge, serve stale while revalidating
export const revalidate = 3600;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const path = slug.join('/');

  const page = await fetchPage(path);

  if (!page) {
    return new Response('# 404 — Page not found\n', {
      status: 404,
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
  }

  const markdown = pageToMarkdown(page);

  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
```

The catch-all `[...slug]` doesn't match `/` in Next.js. Add a sibling for the homepage:

```ts
// app/_md/route.ts
import { fetchPage } from '@/lib/cms';
import { pageToMarkdown } from '@/lib/markdown';

export const revalidate = 3600;

export async function GET() {
  const page = await fetchPage('/');
  if (!page) {
    return new Response('# 404\n', {
      status: 404,
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
  }
  return new Response(pageToMarkdown(page), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
```

### 4.3 Cache Invalidation

When a page or layout is published, the webhook handler revalidates both HTML and markdown:

```ts
// lib/webhook-handlers.ts
import { revalidatePath } from 'next/cache';

function revalidatePageAndMarkdown(slug: string) {
  revalidatePath(`/${slug}`);
  revalidatePath(`/_md/${slug}`);
}

async function handlePage(entryId: string) {
  const entry = await fetchEntry('page', entryId);
  const slug = entry?.fields?.url?.replace(/^\//, '') || '';
  revalidatePageAndMarkdown(slug);
}

async function handleLayout(entryId: string) {
  // A layout change could affect any page that uses it.
  // Look up which pages reference this layout, revalidate each.
  // Contentful: GET /entries?links_to_entry={layoutId}
  const pages = await fetchPagesUsingLayout(entryId);
  for (const page of pages) {
    const slug = page.fields?.url?.replace(/^\//, '') || '';
    revalidatePageAndMarkdown(slug);
  }
}
```

### 4.4 File Inventory

| File | Purpose |
|---|---|
| `middleware.ts` | Detect `.md` → rewrite to `/_md/{slug}` |
| `app/_md/route.ts` | Homepage markdown handler (`index.md`) |
| `app/_md/[...slug]/route.ts` | Catch-all markdown handler |
| `lib/markdown.ts` | `pageToMarkdown`, `layoutToMarkdown`, `cardToMarkdown`, `richtextToMarkdown` |
| `lib/cms.ts` | `fetchPage(slug)` — page with resolved layout + content references |
| `lib/webhook-handlers.ts` | `revalidatePageAndMarkdown(slug)` — invalidates both caches |

---

## 5. Platform: Cloudflare (Workers)

### 5.1 Worker Fetch Handler

On Cloudflare, the Worker fetch handler replaces Next.js middleware. The `.md` check is the first route matched, before security headers are applied.

```ts
// src/index.ts
interface Env {
  CONFIG_KV: KVNamespace;
  PAGES_KV: KVNamespace;
  CMS_WEBHOOK_SECRET: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    // ── 1. Markdown endpoint ─────────────────────────────────
    if (pathname.endsWith('.md')) {
      const slug = pathname === '/index.md'
        ? '/'
        : pathname.slice(1, -3);   // "about.md" → "about"

      return handleMarkdown(slug, env);
    }

    // ── 2. Webhook ───────────────────────────────────────────
    if (pathname === '/webhook' && request.method === 'POST') {
      return handleWebhook(request, env);
    }

    // ── 3. Config file routes ────────────────────────────────
    if (pathname === '/robots.txt') return handleRobotsTxt(env);
    if (pathname === '/manifest.json') return handleManifestJson(env);
    if (pathname === '/.well-known/security.txt') return handleSecurityTxt(env);

    // ── 4. Normal HTML — apply security headers ──────────────
    return handlePageRequest(request, env);
  },
};
```

### 5.2 Markdown Handler

```ts
// src/routes/markdown.ts
import { pageToMarkdown } from '../lib/markdown';

interface Env {
  PAGES_KV: KVNamespace;
}

export async function handleMarkdown(slug: string, env: Env): Promise<Response> {
  // Check Cache API first
  const cache = caches.default;
  const cacheKey = new Request(`https://internal/md/${slug}`);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  // Read page data from KV (pre-written by webhook)
  const key = slug === '/' ? 'page:/' : `page:${slug}`;
  const pageStr = await env.PAGES_KV.get(key);

  if (!pageStr) {
    return new Response('# 404 — Page not found\n', {
      status: 404,
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
  }

  const page = JSON.parse(pageStr);
  const markdown = pageToMarkdown(page);

  const response = new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
    },
  });

  // Store in Cache API for subsequent requests at this PoP
  await cache.put(cacheKey, response.clone());

  return response;
}
```

### 5.3 Cache Invalidation

When the webhook writes updated page data to KV, it also purges the Cache API entry for the markdown endpoint:

```ts
// src/webhook/handlers/page.ts
export async function handlePage(entryId: string, env: Env) {
  const entry = await fetchEntry('page', entryId);
  const slug = entry?.fields?.url?.replace(/^\//, '') || '';

  // Write updated page data to KV
  const resolved = await resolvePageWithLayouts(entry);
  await env.PAGES_KV.put(`page:${slug || '/'}`, JSON.stringify(resolved));

  // Purge markdown cache
  const cache = caches.default;
  await cache.delete(new Request(`https://internal/md/${slug}`));
}

export async function handleLayout(entryId: string, env: Env) {
  // Look up which pages reference this layout
  const pages = await fetchPagesUsingLayout(entryId);
  for (const page of pages) {
    await handlePage(page.sys.id, env);
  }
}
```

### 5.4 File Inventory

| File | Purpose |
|---|---|
| `src/index.ts` | Worker entry — detect `.md` → route to `handleMarkdown` |
| `src/routes/markdown.ts` | Markdown handler with Cache API |
| `src/lib/markdown.ts` | `pageToMarkdown`, `layoutToMarkdown`, `cardToMarkdown` (shared) |
| `src/webhook/handlers/page.ts` | KV write + Cache API purge on publish |

---

## 6. Pre-rendering Static Markdown Files

Instead of converting pages to markdown at request time, the build/SSR process can write physical `.md` files to the output directory. These are served directly from the CDN — zero runtime cost.

### When to Use

- Pages that rarely change (legal, about, company info)
- Sites where most content is public and crawlable
- When you want `.md` files available immediately without a first-request cache miss

For frequently updated content, the on-demand approach (§4/§5) with ISR or Cache API is better — it stays fresh via webhooks without a full rebuild.

### Vercel (Next.js)

Generate `.md` files during the build alongside HTML pages:

```ts
// scripts/prebuild-markdown.ts
import { fetchAllPages } from '@/lib/cms';
import { pageToMarkdown } from '@/lib/markdown';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';

async function generateMarkdownFiles() {
  const pages = await fetchAllPages();

  for (const page of pages) {
    const slug = page.fields.url?.replace(/^\//, '') || 'index';
    const md = pageToMarkdown(page);
    const outPath = join('public', `${slug}.md`);

    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, md, 'utf-8');
  }
}

generateMarkdownFiles();
```

Add to `package.json`:

```json
{
  "scripts": {
    "prebuild": "tsx scripts/prebuild-markdown.ts"
  }
}
```

The resulting files (`public/index.md`, `public/about.md`, etc.) are deployed as static assets. No middleware rewrite needed — Next.js serves them directly from the CDN.

To keep them fresh, the CMS webhook triggers a deploy hook, which re-runs the prebuild.

### Cloudflare (Pages)

Same prebuild script. The output goes into the Pages static asset directory and is deployed to Cloudflare's edge network. Alternatively, the webhook handler can write generated `.md` files to R2:

```ts
// src/webhook/handlers/page.ts
export async function handlePage(entryId: string, env: Env) {
  const page = await resolvePageWithLayouts(entryId);
  const slug = page.fields.url?.replace(/^\//, '') || 'index';
  const md = pageToMarkdown(page);

  // Write static .md to R2 — served by Pages or Worker
  await env.CONTENT_BUCKET.put(`${slug}.md`, md, {
    httpMetadata: { contentType: 'text/markdown; charset=utf-8' },
  });
}
```

### Hybrid Approach

Both strategies can coexist. Use the prebuild for pages that should always have a `.md` file ready, and the on-demand route (§4/§5) as a fallback for pages not pre-rendered:

```ts
// middleware.ts — Vercel example
if (pathname.endsWith('.md')) {
  // Static file exists in /public? Let Next.js serve it directly.
  // Otherwise, rewrite to the on-demand /_md/ handler.
  const slug = pathname === '/index.md'
    ? '/'
    : pathname.slice(1, -3);

  const url = request.nextUrl.clone();
  url.pathname = `/_md/${slug}`;
  return NextResponse.rewrite(url);
}
```

Next.js checks `public/` before middleware runs, so if `public/about.md` exists, it's served as a static file. If not, middleware rewrites to the on-demand handler. No extra logic needed.

---

## 7. Output Examples

### Request: `GET /about.md`

```markdown
---
title: "About Us"
url: "/about"
description: "Learn about our company and mission"
---

# About Us

> Learn about our company and mission

---

## Our Story

### Founded in 2020

**Building the future of content management**

![Team photo](https://images.ctfassets.net/xxx/team.jpg)

We started with a simple idea: content should be portable.

---

## Leadership

### Jane Doe

**CEO & Co-founder**

![Jane Doe](https://images.ctfassets.net/xxx/jane.jpg)

Jane brings 15 years of experience in content platforms.

[LinkedIn](https://linkedin.com/in/janedoe)

### John Smith

**CTO & Co-founder**

Building scalable content infrastructure since 2012.

---

## FAQ

**Q: What CMS platforms do you support?**

We support Contentful, ContentStack, Sanity, Storyblok, and Umbraco.

**Q: Is there a free tier?**

Yes, our open-source tools are free to use.
```

### Request: `GET /index.md`

```markdown
---
title: "Welcome to Acme Corp"
url: "/"
description: "The universal content platform"
---

# Welcome to Acme Corp

> The universal content platform

---

## Hero

### Content without borders

**One model. Every CMS. Zero lock-in.**

[Get started](/docs)  [View demo](/demo)
```

---

## 8. Edge Cases

| Case | Behaviour |
|---|---|
| Page has no layouts | Returns `# Title` + description only (still valid markdown) |
| All layouts have `includeInMarkdown: false` | Returns front matter + `# Title` only |
| Page not found | `404` with `# 404 — Page not found` |
| Layout has no content cards | Layout section skipped (returns `null`) |
| Content card has no textual fields | Card skipped |
| Richtext contains embedded entries | Recursively converts; unknown node types pass through as plain text |
| Media asset has no `alt` | Falls back to `title` → `headline` → empty string |
| Nested slug (`/products/widget`) | Handler strips `.md`, passes `products/widget` as slug segments |
| Trailing slash (`/about/`) | HTML page should canonicalise; `.md` endpoint only matches `about.md` |
| `robots.txt.md`, `manifest.json.md` | Not matched — these hit earlier route rules (Cloudflare) or are excluded by the matcher (Vercel) |

---

## 9. Relationship to llms.txt

The markdown endpoints and `llms.txt` / `llms-full.txt` serve related but distinct purposes:

| | `.md` endpoints | `llms.txt` | `llms-full.txt` |
|---|---|---|---|
| **When generated** | On demand (cached at edge) | Build time (prebuild script) | Build time (prebuild script) |
| **Freshness** | Live — updated via webhook | Stale until next deploy | Stale until next deploy |
| **Content** | Single page, full detail | Index of all pages (links only) | All pages, concatenated |
| **Use case** | AI agents fetching a specific page | Discovery: "what pages exist?" | Full-site context for LLMs |
| **Gated by** | `includeInMarkdown` on layout | `includeInMarkdown` on layout | `includeInMarkdown` on layout |

`llms.txt` references the `.md` endpoints:

```
# Acme Corp

## Pages

- [About Us](https://acme.com/about.md)
- [Products](https://acme.com/products.md)
- [Contact](https://acme.com/contact.md)
```

Both systems use the same `includeInMarkdown` flag and the same `pageToMarkdown` / `cardToMarkdown` conversion functions. The prebuild script imports from `lib/markdown.ts` directly.
