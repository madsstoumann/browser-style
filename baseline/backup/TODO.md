# TODO

Features referenced in schemas, documentation, and platform guides that need implementation.

---

## Models

### Theme / Design Tokens

A `theme` singleton for brand configuration and design tokens. Draft schema exists in `/backup/models/theme.schema.json`.

**Purpose:** Store brand colors, spacing scales, typography settings, and dark mode configuration as CMS-editable design tokens that feed CSS custom properties at build time or via edge delivery.

**Open questions:**
- Single theme vs. multiple themes (light/dark/high-contrast)?
- Token format: flat key-value pairs or nested structure?
- Delivery: edge store (runtime swap) or build-time generation (static CSS)?

### Sitemap Configuration

Settings for `sitemap.xml` generation. Could be a new singleton or additional fields on `crawler-config`.

**Fields:**
- `default_changefreq` — select: `always`, `hourly`, `daily`, `weekly`, `monthly`, `yearly`, `never`
- `default_priority` — number 0.0–1.0 (default `0.5`)
- `exclude_patterns` — URL patterns to exclude (similar to `llms_exclude_patterns`)
- `include_images` — boolean (include `<image:image>` tags from page OG images)

**Behavior:**
- Sitemap is generated at build time from all published pages
- Pages with `noindex` in their `robots` field are automatically excluded
- Page-level `changefreq` and `priority` overrides could be added to the page model later

---

## Platform Implementation

Code referenced in platform guides (`docs/platform/vercel.md`, `docs/platform/cloudflare.md`) that needs to be built in the consuming application.

### Webhook Handler System

9 webhook handlers dispatched by content type:

| Handler | Trigger | Action |
|---------|---------|--------|
| `handleSite` | Site singleton published | Resolve refs, write rendering-ready payload to edge store |
| `handleCrawlerConfig` | Crawler config published | Write robots.txt, manifest + icons, llms config |
| `handleHeadersConfig` | Headers config published | Write CSP, Permissions-Policy, Referrer-Policy, HSTS, CORS |
| `handleSecurityConfig` | Security config published | Write security.txt content |
| `handleNavigation` | Navigation or nav-item published | Revalidate tag (Vercel) or write resolved tree to KV (Cloudflare) |
| `handlePage` | Page published | Revalidate path (Vercel) or write page to KV (Cloudflare) |
| `handleErrorPage` | Error page published | Triggers `handleSite` to rebuild the error page map |
| `handlePersona` | Persona published | Write persona array to edge store |
| `handleTranslation` | Translation namespace published | Trigger deploy/build hook for static regeneration |

### Edge Store Client Libraries

- **Vercel:** `lib/edge-config.ts` — `edgeGet()`, `edgeGetAll()`, `edgeWrite()` wrapping `@vercel/edge-config`
- **Cloudflare:** `src/lib/kv.ts` — typed KV helpers wrapping `KVNamespace`

### Middleware / Worker

- Security header injection (CSP nonce, Permissions-Policy, Referrer-Policy, HSTS, CORS)
- Error page routing (read error page map from site config, rewrite on error status codes)
- Auth checks → 401/403 error page rendering

### Route Handlers

| Route | Source | Content-Type |
|-------|--------|-------------|
| `/robots.txt` | `crawler:robots` | `text/plain` |
| `/manifest.json` | `crawler:manifest` | `application/json` |
| `/.well-known/security.txt` | `security:txt` | `text/plain` |

### Prebuild Scripts

| Script | Trigger | Output |
|--------|---------|--------|
| Translations | Deploy hook | `locales/{locale}.json` flat files |
| Sitemap | Deploy hook | `public/sitemap.xml` |
| llms.txt | Deploy hook | `public/llms.txt`, `public/llms-full.txt` |
| Markdown | Deploy hook | `public/{slug}.md` per page |
