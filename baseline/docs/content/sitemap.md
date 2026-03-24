---
sidebar_label: Sitemap
---

# Sitemap

How `sitemap.xml` generation works with Baseline CMS — from CMS content to a valid XML sitemap served to search engine crawlers.

---

## How It Fits Together

Baseline CMS does not have a dedicated `sitemap-config` model. Instead, sitemaps are **generated from published pages** using data already in the content architecture:

| Source | What it provides |
|---|---|
| **Page** model | URL (`slug`), last modified date (`meta.updatedAt`), locale, `robots` directives |
| **Page** `robots` field | Pages with `noindex` are automatically excluded |
| **Crawler Config** `robots_txt` | The `Sitemap:` directive in robots.txt points crawlers to the sitemap URL |
| **Site** `NEXT_PUBLIC_SITE_URL` / env | The base URL for absolute `<loc>` entries |

The sitemap is a **build-time artifact** — generated once per deploy, not served dynamically. This is the right approach because page URLs change infrequently and search engines cache sitemaps aggressively.

---

## Sitemap XML Primer

A valid sitemap follows the [sitemaps.org protocol](https://www.sitemaps.org/protocol.html):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2026-03-20T10:00:00Z</lastmod>
  </url>
  <url>
    <loc>https://example.com/about</loc>
    <lastmod>2026-03-18T14:30:00Z</lastmod>
  </url>
</urlset>
```

Key constraints:
- Maximum **50,000 URLs** per sitemap file
- Maximum **50 MB** uncompressed per file
- For larger sites, use a **sitemap index** that references multiple sitemap files

### A Note on `changefreq` and `priority`

Google [ignores](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) `<changefreq>` and `<priority>`. Only `<loc>` and `<lastmod>` matter in practice. The examples in this guide include only these two fields.

---

## Vercel (Next.js)

Next.js has **built-in sitemap generation** via the App Router file convention. No prebuild script needed — Next.js generates and serves the sitemap as a special route handler.

### Basic: `app/sitemap.ts`

Create a single file that fetches all published pages from the CMS (or edge store) and returns them as sitemap entries:

```ts
// app/sitemap.ts
import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = await getAllPublishedPages()

  return pages
    .filter((page) => !page.robots?.includes('noindex'))
    .map((page) => ({
      url: `${BASE_URL}/${page.slug === 'index' ? '' : page.slug}`,
      lastModified: page.updatedAt,
    }))
}
```

This generates `/sitemap.xml` automatically — no route handler, no static file. Next.js caches it by default and regenerates on the next build or ISR revalidation.

### With locale alternates

If your site supports multiple locales, add `alternates` so search engines connect translated pages:

```ts
// app/sitemap.ts
import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'
const LOCALES = (process.env.ACTIVE_LOCALES || 'en-US').split(',')
const DEFAULT_LOCALE = LOCALES[0]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = await getAllPublishedPages()

  return pages
    .filter((page) => !page.robots?.includes('noindex'))
    .map((page) => {
      const slug = page.slug === 'index' ? '' : page.slug
      const languages: Record<string, string> = {}

      for (const locale of LOCALES) {
        const prefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`
        languages[locale] = `${BASE_URL}${prefix}/${slug}`
      }

      return {
        url: `${BASE_URL}/${slug}`,
        lastModified: page.updatedAt,
        alternates: { languages },
      }
    })
}
```

### With image sitemaps

If pages have OG images, include them for [Google image indexing](https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps):

```ts
return pages
  .filter((page) => !page.robots?.includes('noindex'))
  .map((page) => ({
    url: `${BASE_URL}/${page.slug === 'index' ? '' : page.slug}`,
    lastModified: page.updatedAt,
    images: page.og_image ? [page.og_image] : [],
  }))
```

### Large sites: multiple sitemaps

For sites with thousands of pages, use `generateSitemaps` to split into 50,000-URL chunks. Next.js creates a sitemap index automatically:

```ts
// app/sitemap.ts
import type { MetadataRoute } from 'next'

const URLS_PER_SITEMAP = 50000

export async function generateSitemaps() {
  const total = await getPublishedPageCount()
  const count = Math.ceil(total / URLS_PER_SITEMAP)
  return Array.from({ length: count }, (_, i) => ({ id: i }))
}

export default async function sitemap(
  props: { id: Promise<string> }
): Promise<MetadataRoute.Sitemap> {
  const id = Number(await props.id)
  const offset = id * URLS_PER_SITEMAP
  const pages = await getPublishedPages({ offset, limit: URLS_PER_SITEMAP })

  return pages
    .filter((page) => !page.robots?.includes('noindex'))
    .map((page) => ({
      url: `${BASE_URL}/${page.slug === 'index' ? '' : page.slug}`,
      lastModified: page.updatedAt,
    }))
}
```

This serves `/sitemap/0.xml`, `/sitemap/1.xml`, etc., with an auto-generated sitemap index at `/sitemap.xml`.

### Cache revalidation

`sitemap.ts` is cached by default. To refresh it when pages change, trigger ISR revalidation from the webhook handler:

```ts
// In your CMS webhook handler for page publishes:
import { revalidatePath } from 'next/cache'
revalidatePath('/sitemap.xml')
```

---

## Cloudflare (Workers / Pages)

Cloudflare has no built-in sitemap convention. Two approaches, depending on your setup:

### Option A: Prebuild script (static file)

Generate `sitemap.xml` at build time and deploy it as a static asset. Best for sites where pages don't change between deploys, or where you trigger a rebuild via deploy hook on page publish.

#### The prebuild script

```ts
// scripts/prebuild-sitemap.ts
import { writeFileSync } from 'node:fs'

const BASE_URL = process.env.SITE_URL || 'https://example.com'

interface Page {
  slug: string
  updatedAt: string
  robots?: string[]
}

async function generateSitemap() {
  // Fetch all published pages from your CMS
  const pages: Page[] = await fetchAllPublishedPages()

  const urls = pages
    .filter((page) => !page.robots?.includes('noindex'))
    .map((page) => {
      const loc = page.slug === 'index'
        ? BASE_URL
        : `${BASE_URL}/${page.slug}`
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${page.updatedAt}</lastmod>\n  </url>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`

  writeFileSync('public/sitemap.xml', xml, 'utf-8')
  console.log(`Sitemap generated: ${pages.length} URLs`)
}

generateSitemap()
```

Add to your build:

```json
{
  "scripts": {
    "prebuild:sitemap": "tsx scripts/prebuild-sitemap.ts",
    "build": "npm run prebuild:sitemap && <your-build-command>"
  }
}
```

The generated file at `public/sitemap.xml` is served as a static asset by Cloudflare Pages.

#### With locale alternates (prebuild)

```ts
const LOCALES = (process.env.ACTIVE_LOCALES || 'en-US').split(',')
const DEFAULT_LOCALE = LOCALES[0]

function buildUrlEntry(page: Page): string {
  const slug = page.slug === 'index' ? '' : page.slug
  const loc = `${BASE_URL}/${slug}`

  const alternates = LOCALES.map((locale) => {
    const prefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`
    return `    <xhtml:link rel="alternate" hreflang="${locale}" href="${BASE_URL}${prefix}/${slug}" />`
  }).join('\n')

  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${page.updatedAt}</lastmod>\n${alternates}\n  </url>`
}

// Update the XML namespace:
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>`
```

### Option B: Worker route (dynamic)

Serve the sitemap dynamically from a Worker that reads page data from KV. Best for sites where content changes frequently and you don't want to rebuild on every publish.

```ts
// In your Worker fetch handler, add a route for /sitemap.xml:

async function handleSitemap(env: Env): Promise<Response> {
  const BASE_URL = env.SITE_URL || 'https://example.com'

  // Read the page index from KV
  // The webhook handler writes this when pages are published
  const pageIndex = await env.CONTENT_KV.get('sitemap:pages', 'json') as PageEntry[] | null

  if (!pageIndex || pageIndex.length === 0) {
    return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
      headers: { 'Content-Type': 'application/xml' },
    })
  }

  const urls = pageIndex
    .map((page) => {
      const loc = page.slug === 'index'
        ? BASE_URL
        : `${BASE_URL}/${page.slug}`
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${page.updatedAt}</lastmod>\n  </url>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
```

#### Webhook: update the page index in KV

When a page is published or unpublished, update the sitemap page index stored in KV:

```ts
// In your webhook handler for page events:
async function updateSitemapIndex(env: Env) {
  // Fetch all published pages from CMS
  const pages = await fetchAllPublishedPages()

  const entries = pages
    .filter((page) => !page.robots?.includes('noindex'))
    .map((page) => ({
      slug: page.slug,
      updatedAt: page.updatedAt,
    }))

  await env.CONTENT_KV.put('sitemap:pages', JSON.stringify(entries))
}
```

---

## Vanilla / Self-Hosted

For any platform without a sitemap convention (Deno, Bun, Express, Fastify, static hosts), use the same prebuild script from Option A above. The only requirement is writing `sitemap.xml` to your public/static directory before deploy.

If your server supports dynamic routes, adapt Option B — read page data from your data store and return XML with `Content-Type: application/xml`.

---

## robots.txt Integration

Point crawlers to your sitemap by including a `Sitemap:` directive in `robots.txt`. This is configured in the [Crawler Config](./crawler-config.md) model's `robots_txt` field:

```
User-agent: *
Allow: /

Sitemap: https://example.com/sitemap.xml
```

The `Sitemap:` line uses the absolute URL. If you use multiple sitemaps (sitemap index), point to the index file — crawlers will discover the individual sitemaps from there.

---

## Sitemap Index (large sites)

If your site exceeds 50,000 URLs, split into multiple sitemaps and serve a sitemap index:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://example.com/sitemap/0.xml</loc>
    <lastmod>2026-03-20T10:00:00Z</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://example.com/sitemap/1.xml</loc>
    <lastmod>2026-03-20T10:00:00Z</lastmod>
  </sitemap>
</sitemapindex>
```

Next.js handles this automatically via `generateSitemaps`. For Cloudflare/vanilla, generate the index file alongside the individual sitemaps in your prebuild script or serve it as a Worker route.

---

## Platform Comparison

| Concern | Vercel (Next.js) | Cloudflare | Vanilla |
|---|---|---|---|
| Generation | Built-in `app/sitemap.ts` | Prebuild script or Worker route | Prebuild script or dynamic route |
| Image sitemaps | `images` array in return type | `<image:image>` in XML template | `<image:image>` in XML template |
| Locale alternates | `alternates.languages` in return type | `<xhtml:link>` in XML template | `<xhtml:link>` in XML template |
| Multiple sitemaps | `generateSitemaps()` — auto index | Manual sitemap index generation | Manual sitemap index generation |
| Revalidation | `revalidatePath('/sitemap.xml')` | Rebuild via deploy hook, or KV update + Cache API purge | Rebuild and redeploy |
| Serving | Automatic route handler | Static asset (Pages) or Worker | Static file or server route |
