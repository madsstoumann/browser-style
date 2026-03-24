---
sidebar_label: Navigation
---

# 🟠 Navigation

The navigation system uses two models — `navigation` (container) and `navigation-item` (entry) — to build any menu structure: simple link lists, grouped dropdowns, full mega menus, footer column layouts, and sidebar trees.

Schemas: [`models/navigation.schema.json`](../models/navigation.schema.json), [`models/navigation-item.schema.json`](../models/navigation-item.schema.json)

---

## Navigation (Container)

A navigation is a named container holding an ordered list of top-level items.

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `name` | string | yes | Descriptive label, e.g. "Main Header", "Footer", "Sidebar" |
| `description` | text | | Internal note for CMS editors |
| `items` | ref[] ► navigation-item | | Ordered top-level items |

The site references two navigations by default (`header_nav_id`, `footer_nav_id`), but you can create as many as needed — sidebar menus, account menus, breadcrumb overrides, etc.

---

## Navigation Item

Each item has a `type` that determines its role:

| Type | Purpose |
|------|---------|
| `divider` | A visual separator (horizontal rule, spacer) |
| `group` | A label with children (dropdown, column, mega menu panel) |
| `link` | A clickable navigation link with a URL |

### Fields

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `label` | string | yes | Display text |
| `type` | select | yes | `link`, `group`, or `divider` |
| `badge` | string | | Badge text: "New", "Beta", "Sale", etc. |
| `children` | ref[] ► navigation-item | | Nested items (recursive — unlimited depth) |
| `description` | text | | Subtitle or tooltip (useful in mega menus) |
| `icon` | media | | Icon image or SVG |
| `image` | media | | Featured image (mega menu panels, promotional slots) |
| `is_featured` | boolean | | Highlight this item (render as CTA button, promotional card, etc.) |
| `target` | select | | `_self` (same window) or `_blank` (new window) |
| `url` | url | | Link destination (for `link` type) |

---

## Menu Patterns

### Simple Header

A flat list of links. No groups, no children.

```
Navigation: "Main Header"
├── [link] Home          → /
├── [link] Products      → /products
├── [link] About         → /about
└── [link] Contact       → /contact
```

### Dropdown Menu

Groups with one level of children. Renders as a traditional dropdown on hover or click.

```
Navigation: "Main Header"
├── [link] Home          → /
├── [group] Products
│   ├── [link] Widgets   → /products/widgets
│   ├── [link] Gadgets   → /products/gadgets
│   └── [link] Tools     → /products/tools
├── [group] Company
│   ├── [link] About     → /about
│   ├── [link] Careers   → /careers
│   └── [link] Press     → /press
└── [link] Contact       → /contact
```

### Mega Menu

Groups with children, descriptions, images, and featured items. The `image` and `description` fields on items enable rich visual panels.

```
Navigation: "Main Header"
├── [link] Home          → /
│
├── [group] Products                        ← triggers mega menu panel
│   ├── [group] "Categories"                ← column header
│   │   ├── [link] Widgets                  → /products/widgets
│   │   │   description: "Build custom interfaces"
│   │   │   icon: widgets.svg
│   │   ├── [link] Gadgets                  → /products/gadgets
│   │   │   description: "Smart devices for every need"
│   │   │   icon: gadgets.svg
│   │   └── [link] Tools                    → /products/tools
│   │       description: "Professional-grade tools"
│   │       icon: tools.svg
│   │
│   ├── [group] "Resources"                 ← second column
│   │   ├── [link] Documentation            → /docs
│   │   ├── [link] API Reference            → /docs/api
│   │   └── [link] Tutorials                → /tutorials
│   │
│   └── [link] "Spring Collection"          ← promotional slot
│       url: /products/spring-2026
│       image: spring-promo.jpg
│       is_featured: true
│       badge: "New"
│
├── [group] Company
│   ├── [link] About                        → /about
│   │   description: "Our story and mission"
│   ├── [link] Careers                      → /careers
│   │   badge: "Hiring"
│   ├── [divider]                           ← visual separator
│   └── [link] Press                        → /press
│
└── [link] "Get Started"                    → /signup
    is_featured: true                       ← renders as CTA button
```

In this structure:
- **Top-level groups** trigger mega menu panels
- **Nested groups** become column headers within the panel
- **`description`** on links shows subtitle text below the label
- **`icon`** on links shows an icon beside the label
- **`image`** on links renders a visual card (promotional slot)
- **`is_featured`** on a link renders it differently (CTA button, highlighted card)
- **`badge`** adds a small label chip ("New", "Hiring", "Sale")
- **`divider`** inserts a visual separator between items

### Footer with Columns

Footer navigation uses groups as column headers.

```
Navigation: "Main Footer"
├── [group] "Products"
│   ├── [link] Widgets           → /products/widgets
│   ├── [link] Gadgets           → /products/gadgets
│   └── [link] Tools             → /products/tools
│
├── [group] "Company"
│   ├── [link] About             → /about
│   ├── [link] Careers           → /careers
│   ├── [link] Press             → /press
│   └── [link] Blog              → /blog
│
├── [group] "Support"
│   ├── [link] Help Center       → /help
│   ├── [link] Documentation     → /docs
│   ├── [link] Status            → https://status.example.com
│   │   target: _blank
│   └── [link] Contact           → /contact
│
└── [group] "Legal"
    ├── [link] Privacy Policy    → /privacy-policy
    ├── [link] Terms of Service  → /terms-of-service
    └── [link] Cookie Settings   → #
        description: "Manage your cookie preferences"
```

### Sidebar / Documentation Menu

Deep nesting with recursive groups for multi-level trees.

```
Navigation: "Docs Sidebar"
├── [link] Getting Started       → /docs
├── [group] "Guides"
│   ├── [link] Installation      → /docs/guides/install
│   ├── [link] Configuration     → /docs/guides/config
│   └── [group] "Advanced"
│       ├── [link] Custom Adapters   → /docs/guides/adapters
│       └── [link] Webhooks          → /docs/guides/webhooks
├── [group] "API Reference"
│   ├── [link] REST API          → /docs/api/rest
│   └── [link] GraphQL           → /docs/api/graphql
└── [link] Changelog             → /docs/changelog
```

---

## Page-Level Overrides

The site provides default `header_nav_id` and `footer_nav_id` for all pages. A specific page can override either:

```
Site
  header_nav_id → "Main Header"        ← default for all pages
  footer_nav_id → "Main Footer"

Page: /landing/campaign
  header_nav_id → "Minimal Header"     ← override: simplified nav
  footer_nav_id → (not set)            ← inherits "Main Footer"
```

This is useful for campaign landing pages, checkout flows, or embedded views that need a different navigation context.

---

## Caching

Navigation data is cached and shared across all page requests. When an editor publishes a navigation or navigation-item change, the CMS webhook invalidates the cache.

Navigation items are resolved to their full depth (`include: 3` or higher in the CMS API call) so the entire tree is available in a single cached object.

For full implementation details:

- [Vercel: Navigation](./vercel.md#navigation) — `unstable_cache` with tag `navigation`, invalidated by `revalidateTag('navigation')`
- [Cloudflare: Navigation](./cloudflare.md#navigation) — full resolved tree written to KV on webhook
