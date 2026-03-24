---
sidebar_label: Site
---

# 🔴 Site (Global Configuration)

The `site` model is a **singleton** — exactly one record exists per project. It holds everything that applies across all pages and acts as the central hub linking to all other global configuration.

Schema: [`models/site.schema.json`](../models/site.schema.json)

---

## Structure Overview

```
Site (singleton)
├── Identity & Business
│   ├── site_name, site_url, default_locale
│   ├── legal_name, contact_email, contact_phone, address
│   ├── privacy_policy_id ──────► Page
│   ├── terms_service_id ───────► Page
│   └── social_links[] ────────► Social Link
│
├── External Scripts
│   └── external_scripts[] ────► External Script
│
├── Icons
│   └── favicon, favicon_svg, apple_touch_icon
│
├── SEO & Social
│   ├── site_description
│   └── og_image
│
├── Navigation
│   ├── header_nav_id ─────────► Navigation
│   └── footer_nav_id ─────────► Navigation
│
├── Error Pages
│   └── error_pages[] ───────► Error Page (status_code + page_id)
│
├── Configuration (singletons)
│   ├── crawler_config_id ─────► Crawler Config
│   ├── headers_config_id ─────► Headers Config
│   └── security_config_id ────► Security Config
│
└── Personas
    └── personas[] ────────────► Persona
```

---

## Field Groups

### Identity & Business

Core site identity and legal information.

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `site_name` | string | yes | Display name of the site |
| `site_url` | string | yes | Base URL, e.g. `https://example.com` |
| `address` | text | | Physical business address (multiline) |
| `contact_email` | string | | Public-facing contact email |
| `contact_phone` | string | | Public-facing phone number |
| `default_locale` | string | | Fallback locale, e.g. `en-US` |
| `legal_name` | string | | Official registered business name |
| `privacy_policy_id` | ref ► page | | Link to the privacy policy page |
| `social_links` | ref[] ► social-link | | Social media profile links |
| `terms_service_id` | ref ► page | | Link to the terms of service page |

Each **social link** has three fields: `platform` (e.g. "LinkedIn", "GitHub"), `url`, and an optional `icon` (media asset, SVG recommended). When the icon is not set, the frontend falls back to a code-level icon derived from the platform name.

### External Scripts

Third-party scripts managed as individual content entries. See [External Scripts](./external-script.md) for details.

| Field | Type | Description |
|-------|------|-------------|
| `external_scripts` | ref[] ► external-script | Analytics, consent, marketing, and support scripts |

### Icons

Browser icons rendered in the HTML `<head>` on every page. PWA / manifest icons (`app_icon_small`, `app_icon_medium`, `app_icon_large`) live on [Crawler Config](./crawler-config.md) alongside the `manifest.json` configuration they belong to.

| Field | Type | Description |
|-------|------|-------------|
| `favicon` | media | Classic favicon (32x32 `.ico`) |
| `favicon_svg` | media | SVG favicon for modern browsers (scalable, supports dark mode via CSS `prefers-color-scheme`) |
| `apple_touch_icon` | media | iOS home screen icon (180x180 PNG) |

### SEO & Social

Site-wide fallback values for search engines and social sharing.

| Field | Type | Description |
|-------|------|-------------|
| `site_description` | string | Default `<meta name="description">` when a page has none |
| `og_image` | media | Default Open Graph image when a page has none |

### Navigation

Default header and footer navigation for all pages. Individual pages can override either or both.

| Field | Type | Description |
|-------|------|-------------|
| `header_nav_id` | ref ► navigation | Default header navigation |
| `footer_nav_id` | ref ► navigation | Default footer navigation |

See [Navigation](./navigation.md) for the full navigation and menu structure.

### Error Pages

Custom error pages mapped by HTTP status code. Each entry is an [Error Page](./error-page.md) that pairs a status code with a `page` reference. The referenced pages should have `robots: ["noindex", "nofollow"]` set to prevent search engine indexing.

| Field | Type | Description |
|-------|------|-------------|
| `error_pages` | ref[] ► error-page | Custom error pages (404, 500, 401, 403, 503, etc.) |

This is open-ended — add entries for any HTTP status code without schema changes. See [Error Page](./error-page.md) for the model and platform-specific handling.

### Configuration Singletons

Three dedicated singletons handle infrastructure configuration that rarely changes but needs granular webhook targeting. Each has its own visual editor in the CMS.

| Field | Type | Target | Docs |
|-------|------|--------|------|
| `crawler_config_id` | ref ► crawler-config | robots.txt, manifest.json, llms.txt | [Crawler Config](./crawler-config.md) |
| `headers_config_id` | ref ► headers-config | CSP, Permissions-Policy, Referrer-Policy | [Headers Config](./headers-config.md) |
| `security_config_id` | ref ► security-config | security.txt | [Security Config](./security-config.md) |

### Personas

Search personas for audience-specific content retrieval and AI-powered search.

| Field | Type | Description |
|-------|------|-------------|
| `personas` | ref[] ► persona | Persona definitions |

See [Personas](./persona.md) for details.

---

## Delivery Patterns

The site model is delivery-agnostic. How the data reaches the rendering code depends on the deployment architecture. Three patterns are common — all use the same content model.

### Runtime Data Boundaries

Not every field on the site model is needed by the rendering code. Fields split into three tiers based on **who consumes them**:

| Tier | Fields | Consumer |
|------|--------|----------|
| **Rendering** | `site_name`, `site_url`, `default_locale`, `site_description`, `og_image`, `favicon`, `favicon_svg`, `apple_touch_icon`, `header_nav_id`, `footer_nav_id`, `error_pages[]`, `external_scripts[]`, `social_links[]`, `privacy_policy_id`, `terms_service_id`, `legal_name`, `contact_email`, `contact_phone`, `address`, `personas[]` | Root layout, `<head>`, footer, error handling, schema.org |
| **Infrastructure** | `crawler_config_id`, `headers_config_id`, `security_config_id` | Webhooks and dedicated route handlers / middleware — never the page rendering code |

Manifest icons (`app_icon_small`, `app_icon_medium`, `app_icon_large`) live on [Crawler Config](./crawler-config.md) alongside the manifest.json content, so the manifest route handler reads a single edge key.

Infrastructure fields exist on the site model for CMS editor convenience (one hub linking to everything). At runtime, these config singletons are served independently — see [Crawler Config](./crawler-config.md), [Headers Config](./headers-config.md), [Security Config](./security-config.md).

### Pattern 1: Headless + Edge Store

For decoupled frontends (Next.js, Astro, SvelteKit, Workers) backed by a headless CMS (Contentful, Sanity, Storyblok headless mode). The CMS is never called at request time.

```
CMS publish (site)
    → Webhook
    → Resolve references (scripts, social links, legal pages)
    → Write rendering-ready payload to edge store
    → Navigation trees written separately

Request
    → Root layout
    ├── getSiteConfig()         → edge store read (< 1ms)
    ├── getNavigation(headerId) → edge store / cache read (< 1ms)
    ├── getNavigation(footerId) → edge store / cache read (< 1ms)
    ├── <Header />
    ├── {children}              → page-specific content
    └── <Footer />
```

The webhook resolves all references *before* writing, so the rendering code gets a flat object — no secondary lookups:

```
edge key: site → {
  site_name, site_url, default_locale, site_description, og_image,
  favicon, favicon_svg, apple_touch_icon,
  header_nav_id, footer_nav_id,
  error_pages: { "404": "/error-404", "500": "/error-500", "401": "/not-authenticated", ... },
  external_scripts: [ { resolved script objects } ],
  social_links: [ { resolved social link objects } ],
  privacy_policy: { url, title },
  terms_service: { url, title },
  personas: [ { resolved persona objects } ],
  legal_name, contact_email, contact_phone, address
}
```

For full implementation details:

- [Vercel](./vercel.md) — Edge Config reads, `unstable_cache` with tag revalidation
- [Cloudflare](./cloudflare.md) — KV reads, Worker fetch handler

### Pattern 2: MVC / Server-Rendered CMS

For CMSes that are also the rendering engine (WordPress, Drupal, Craft CMS, Sitecore, Laravel-based). No webhook pipeline — the CMS fetches and resolves everything internally.

```
Request
    → CMS application server
    ├── getSiteConfig()      → database / internal cache
    ├── getNavigation()      → database / internal cache (eager-loaded)
    ├── render template with all data
    └── Apply headers (middleware / webserver config)
```

In this pattern, **all fields are relevant** — the CMS resolves references via its own ORM/query layer. Infrastructure config (`crawler_config_id`, `headers_config_id`, `security_config_id`) is resolved at render time rather than by webhooks. Headers are applied via the webserver (`.htaccess`, nginx) or CMS middleware. `robots.txt` and `security.txt` are served by CMS routes or webserver config.

### Pattern 3: Headless + API Cache (No Edge Store)

For headless CMSes where you want a simpler setup without an edge store layer. A thin server (Express, Hono, Fastify) calls the CMS API directly with aggressive caching.

```
Request
    → Application server
    ├── getSiteConfig()      → CMS API call, cached with TTL or stale-while-revalidate
    ├── getNavigation()      → CMS API call, cached with TTL
    ├── getPage(slug)        → CMS API call, cached with TTL
    └── Render

CMS publish (any entry)
    → Webhook
    → Purge relevant cache keys (or short TTL expires naturally)
```

This trades the edge store setup for slightly higher read latency (cached API calls are still fast, but not sub-millisecond). Works well for lower-traffic sites or when you want to avoid the webhook write pipeline.

### Choosing a Pattern

| | Headless + Edge | MVC | Headless + API Cache |
|---|---|---|---|
| **Best for** | High-traffic, global CDN, zero-CMS-at-runtime | CMS is the application | Simpler headless setups, lower traffic |
| **CMS examples** | Contentful, Sanity, Storyblok | WordPress, Drupal, Craft, Sitecore | Any headless CMS |
| **Read latency** | < 1ms (co-located edge store) | ~1ms (database + internal cache) | ~5–50ms (cached API, depends on CMS) |
| **Invalidation** | Webhook → edge store write | CMS internal cache clear | Webhook → cache purge or TTL expiry |
| **Complexity** | Higher (webhook pipeline, edge store) | Lowest (CMS handles everything) | Medium (caching layer, webhook handler) |
| **Infrastructure fields** | Stripped from rendering payload | Resolved by CMS internally | May be fetched or handled separately |
