---
sidebar_label: Page
---

# 🟢 Page

A `page` is the URL-addressable unit of the site. It carries SEO metadata and references an ordered array of layouts that contain the actual content.

Schema: [`models/page.schema.json`](../../models/page.schema.json)

---

## Fields

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `description` | text | yes | Meta description for search results |
| `title` | string | yes | Page title, used in `<title>` tag |
| `url` | string | yes | URL path, e.g. `/about`, `/products/widgets` |
| `canonical_url` | url | | Canonical URL override (see below) |
| `csp` | object | | Page-level Content Security Policy override |
| `footer_nav_id` | ref ► navigation | | Override the site default footer navigation |
| `header_nav_id` | ref ► navigation | | Override the site default header navigation |
| `layouts` | ref[] ► layout | | Ordered content sections (hero, grid, feature list, etc.) |
| `og_description` | text | | Open Graph description |
| `og_image` | media | | Open Graph image |
| `og_title` | string | | Open Graph title |
| `og_type` | select | | `website`, `article`, `product`, or `profile` |
| `robots` | checkbox | | Crawling directives (see below) |

---

## Fallback Chain

Several page fields fall back to site-level defaults when not set:

| Page field | Falls back to |
|------------|--------------|
| `canonical_url` | `site.site_url` + `page.url` |
| `og_title` | `page.title` |
| `og_description` | `page.description` |
| `og_image` | `site.og_image` |
| `header_nav_id` | `site.header_nav_id` |
| `footer_nav_id` | `site.footer_nav_id` |
| `csp` | `headers_config.csp` (global) |

This means most pages need only `title`, `url`, and `description`. Everything else is inherited unless explicitly overridden.

---

## Canonical URL

The `canonical_url` field is optional. When not set, the canonical URL is computed as `site.site_url + page.url` (e.g. `https://example.com/about`).

Set it explicitly when:
- **Paginated content** — `/blog/page/2` should canonicalize to `/blog`
- **Cross-domain syndication** — the same article appears on multiple domains
- **Query parameter variants** — `/products?color=red` should canonicalize to `/products`

---

## Robots Directives

The `robots` field is a checkbox group (multi-select) controlling search engine behavior for the page. When empty, the page defaults to `index, follow`.

| Directive | Effect |
|-----------|--------|
| `noarchive` | Don't show a cached copy in search results |
| `nofollow` | Don't follow outbound links on this page |
| `noimageindex` | Don't index images on this page |
| `noindex` | Don't index this page in search results. Also excludes the page from `sitemap.xml`. |
| `nosnippet` | Don't show a text snippet or video preview in search results |
| `notranslate` | Don't offer page translation in search results |

Common combinations:
- Error pages (404, 500): `["noindex", "nofollow"]`
- Legal pages (privacy, terms): `["noindex"]`
- Gated or preview content: `["noindex", "nofollow"]`

---

## Open Graph Type

The `og_type` field controls how social platforms display the shared link:

| Value | Use for |
|-------|---------|
| `article` | Blog posts, news articles, documentation pages |
| `product` | Product pages, pricing pages |
| `profile` | Team member pages, author pages |
| `website` | Default — home page, landing pages, general content |

---

## Page-Level CSP

The `csp` field allows a page to override or extend the global Content Security Policy from `headers-config`. This is useful for pages that embed third-party widgets, iframes, or scripts not covered by the global policy.

The merge strategy (replace vs. append) is determined at the application level in middleware.

---

## Layouts

A page references an ordered array of `layout` entries. Each layout is a content section on the page — a hero banner, a card grid, a feature list, a testimonial carousel, etc.

```
Page
├── Layout: "Hero Banner"
│   ├── layout-config (full-width, no padding)
│   └── content-card[] (one hero card)
│
├── Layout: "Feature Grid"
│   ├── layout-config (3-column grid, medium gap)
│   └── content-card[] (three feature cards)
│
└── Layout: "CTA Section"
    ├── layout-config (centered, large padding)
    └── content-card[] (one CTA card)
```

Each layout has:
- A `config_id` reference to a `layout-config` (grid settings, spacing, breakpoints)
- A `content` array of polymorphic references to content models
- An `includeInMarkdown` boolean controlling whether this section appears in `.md` endpoints and `llms.txt`

---

## Rendering

Page data is fetched per route and cached independently. When a page is published in the CMS, the webhook invalidates only that page's cache — the site shell, navigation, and all other pages remain cached.

```
Route: /{slug}
│
├── getPage(slug)  → read from edge store / cache
│
├── <head> metadata (title, description, og_*, canonical, robots)
│
└── layouts.map(layout =>
      <Section config={layout.config}>
        {layout.content.map(card => <Card {...card} />)}
      </Section>
    )
```

For full implementation details:

- [Vercel: Pages (ISR)](../guides/vercel.md#pages-isr) — `revalidateTag('page:{slug}')` for instant ISR revalidation
- [Cloudflare: Pages](../guides/cloudflare.md#pages) — KV write on webhook, Worker reads from KV
