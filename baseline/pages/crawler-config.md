---
sidebar_label: 🛠️ Crawler Config
---

# 🛠️ Crawler Config 🔴

A **singleton** controlling how the site interacts with search engine crawlers, AI agents, and PWA installation.

Schema: [`models/crawler-config.schema.json`](../models/crawler-config.schema.json)
CMS location: `Configuration / Crawler`

---

## Fields

| Field | Type | Widget | Description |
|-------|------|--------|-------------|
| `title` | string | | Editorial label |
| `robots_txt` | text | <a href="https://browser.style/ui/web-config-robots" target="_blank">web-config-robots</a> | Full `robots.txt` content |

### Manifest & Icons

| Field | Type | Widget | Description |
|-------|------|--------|-------------|
| `app_icon_large` | media | | PWA / manifest icon (512x512 PNG, also used for splash screens) |
| `app_icon_medium` | media | | PWA / manifest icon (384x384 PNG) |
| `app_icon_small` | media | | PWA / manifest icon (192x192 PNG) |
| `manifest` | object | <a href="https://browser.style/ui/web-config-manifest" target="_blank">web-config-manifest</a> | `manifest.json` configuration |

### LLM Index

| Field | Type | Widget | Description |
|-------|------|--------|-------------|
| `llms_enabled` | boolean | | Master toggle for llms.txt generation |
| `llms_exclude_patterns` | array | | URL patterns to exclude from LLM index |
| `llms_preamble` | text | | Introductory block at the top of llms.txt |

---

## robots.txt

The `robots_txt` field holds the complete content of the file served at `/robots.txt`. It is edited using a visual editor (<a href="https://browser.style/ui/web-config-robots" target="_blank"><code>web-config-robots</code></a>) that helps construct valid directives.

The content follows the [Robots Exclusion Protocol](https://www.robotstxt.org/). A typical configuration:

```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /preview/
Disallow: /api/

User-agent: GPTBot
Allow: /

Sitemap: https://example.com/sitemap.xml
```

Key directives:
- **User-agent** — which crawler the rules apply to (`*` for all)
- **Allow / Disallow** — which paths the crawler may or may not access
- **Sitemap** — pointer to the sitemap URL (helps crawlers discover content)

Note: `robots.txt` controls crawler *access*. To control *indexing*, use the `robots` field on the [page model](./page.md).

### Serving

`robots.txt` is served as a route handler that reads from the edge store. For full implementation details with code examples:

- [Vercel: robots.txt](./vercel.md#robotstxt) — Edge Config + Next.js route handler
- [Cloudflare: robots.txt](./cloudflare.md#robotstxt) — KV + Worker fetch handler

---

## Web App Manifest

The `manifest` field holds the JSON object served at `/manifest.json`. It is edited using a visual editor (<a href="https://browser.style/ui/web-config-manifest" target="_blank"><code>web-config-manifest</code></a>) that validates the structure.

The manifest enables Progressive Web App (PWA) features: "Add to Home Screen" prompts, standalone app windows, splash screens, and theme colors.

Key properties:

| Property | Description |
|----------|-------------|
| `background_color` | Background color during app load (splash screen) |
| `description` | App description |
| `display` | Display mode: `standalone`, `fullscreen`, `minimal-ui`, or `browser` |
| `name` | Full app name (shown in install prompts) |
| `short_name` | Shortened name (shown on home screen icons) |
| `start_url` | URL opened when the app launches (typically `/`) |
| `theme_color` | Browser UI color (address bar, task switcher) |

### Manifest Icons

The three `app_icon_*` fields live alongside the manifest so the `/manifest.json` route handler reads a single edge key. The icons array in the served manifest is built from these assets:

| Field | Sizes | Usage |
|-------|-------|-------|
| `app_icon_small` | 192x192 | Home screen icon, install prompt |
| `app_icon_medium` | 384x384 | Higher-DPI home screen icon |
| `app_icon_large` | 512x512 | Splash screen, app store listing |

Browser icons (favicon, SVG favicon, apple touch icon) remain on the [site model](./site.md) since they are rendered in the HTML `<head>` on every page.

### Serving

- [Vercel: manifest.json](./vercel.md#manifestjson) — Edge Config + site icon merge
- [Cloudflare: manifest.json](./cloudflare.md#manifestjson) — KV + site icon merge

---

## LLM Index (llms.txt)

The `llms.txt` specification ([llmstxt.org](https://llmstxt.org/)) defines a machine-readable index of a site's content, designed for consumption by large language models, AI agents, and RAG pipelines.

Baseline CMS supports two endpoints:
- **`/llms.txt`** — concise index: title, description, and URL for each page
- **`/llms-full.txt`** — expanded index: includes the full markdown content of each page

### `llms_enabled`

Master toggle. When `false`, both endpoints return 404. This lets editors disable LLM indexing without modifying code or deployment.

### `llms_preamble`

The preamble is a free-text block placed at the very top of the generated `llms.txt` file, before the page index. It tells AI consumers what the site is, who it's for, and what kind of content they'll find.

Example:

```
# Generic Site

> Generic Site provides developer tools, API documentation,
> and tutorials for building modern web applications.
> Content includes product guides, code examples, and a blog
> covering web development best practices.
```

This block is not generated — it is hand-written by editors to provide context that can't be inferred from individual page titles. Think of it as a site-level README for AI agents.

### `llms_exclude_patterns`

An array of URL patterns (glob syntax) to exclude from both `llms.txt` and `llms-full.txt`. Pages matching these patterns are omitted from the index regardless of their `robots` setting.

```json
["/admin/*", "/preview/*", "/api/*"]
```

This is in addition to page-level exclusion: any page with `noindex` in its `robots` field is also excluded.

### The `includeInMarkdown` field

Each [layout](./page.md) has an `includeInMarkdown` boolean (default: `true`). When set to `false`, that layout's content is excluded from the markdown representation used in `llms-full.txt` and `.md` endpoints. This is useful for decorative or interactive sections (hero animations, image carousels) that add noise for AI consumers.

### Serving

Both endpoints are generated at build time (prebuild script) or served as route handlers. On both platforms, they can also be pre-generated at build time and served as static assets.

- [Vercel: llms.txt](./vercel.md#llmstxt--llms-fulltxt) — prebuild script + static files
- [Cloudflare: llms.txt](./cloudflare.md#llmstxt--llms-fulltxt) — prebuild + Pages/R2 static assets
