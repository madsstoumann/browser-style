---
sidebar_label: Editor Roles
---

# Editor Roles

Role-based access control for Baseline CMS content models. Roles map to CMS-native permission systems — the exact implementation varies per platform (Contentful roles, Sanity access control, Storyblok permissions, etc.), but the intent is universal.

### Legend

Throughout the documentation, colored dots indicate the minimum role required to edit a model:

| Dot | Role | Scope |
|-----|------|-------|
| 🔴 | Admin | Infrastructure & identity |
| 🟠 | Site Editor | Global content structure |
| 🟢 | Content Editor | Per-page content |
| 🔵 | Translator | Localization |

---

## Roles

### 🔴 Admin

Full access. Controls infrastructure-level configuration that can break the site if misconfigured.

| Model | Access | Why restricted |
|-------|--------|----------------|
| `crawler-config` | Read / Write | robots.txt, manifest.json, llms.txt — misconfiguration delists from search engines |
| `external-script` | Read / Write | Third-party scripts — analytics, CMP, marketing — run on every page |
| `headers-config` | Read / Write | CSP, Permissions-Policy, HSTS, CORS — misconfiguration blocks resources or exposes vulnerabilities |
| `security-config` | Read / Write | security.txt — vulnerability disclosure policy |
| `site` | Read / Write | Identity, icons, SEO defaults, all global references |

Admins also have full access to all models below.

### 🟠 Site Editor

Manages global content structure that appears across pages. Cannot modify infrastructure configuration.

| Model | Access | Notes |
|-------|--------|-------|
| `error-page` | Read / Write | Maps HTTP status codes to custom pages |
| `layout-config` | Create / Read / Write | Layout presets: breakpoints, spacing, grid settings |
| `navigation` | Read / Write | Header, footer, sidebar menus |
| `navigation-item` | Read / Write | Menu entries within a navigation |
| `persona` | Read / Write | AI search personas |
| `social-link` | Read / Write | Social media profile links |

Site Editors also have full Content Editor access.

### 🟢 Content Editor

Creates and manages per-page content — the day-to-day editorial role.

| Model | Access | Notes |
|-------|--------|-------|
| `content-card` | Create / Read / Write | Polymorphic cards: article, product, event, FAQ, etc. |
| `layout` | Create / Read / Write | Content sections: hero, grid, feature list, etc. |
| `page` | Create / Read / Write | Full page lifecycle including slug, SEO fields, robots directives |

Content Editors can read (but not modify) all global configuration — `site`, `navigation`, singletons — so they understand the context their pages live in.

### 🔵 Translator

Manages localized content. Can edit translation namespaces and locale variants of any model, but cannot modify the default-locale version of content models.

| Model | Access | Notes |
|-------|--------|-------|
| Any model (locale variants) | Read / Write | e.g. `page.da-DK.json`, `content-card.de-DE.json` |
| `translation-namespace` | Create / Read / Write | UI string bundles by namespace |

---

## Role Hierarchy

```
Admin
└── Site Editor
    └── Content Editor
        └── Translator
```

Each role inherits read access from all roles below it. Write access is additive — a Site Editor can do everything a Content Editor can, plus manage navigation and error pages.

---

## CMS Platform Mapping

| Baseline Role | Contentful | Sanity | Storyblok |
|---------------|------------|--------|-----------|
| Admin | Admin role + custom policy | Administrator document permissions | Admin space role |
| Site Editor | Custom role scoped to navigation + error-page content types | Editor with filtered document types | Custom role with component restrictions |
| Content Editor | Custom role scoped to page + layout + content-card | Editor with filtered document types | Editor space role with folder restrictions |
| Translator | Custom role with locale-only write | Editor with language filter | Translator role (built-in) |

The exact configuration varies per CMS. See platform guides for implementation details:
- [Vercel (Next.js)](./vercel.md)
- [Cloudflare (Workers / Pages)](./cloudflare.md)

---

## Singleton Protection

The following singletons require **Admin** access. They are protected because a bad publish directly affects every response the site serves:

| Singleton | Risk |
|-----------|------|
| `crawler-config` | Search engine delisting, broken PWA install, AI index misconfiguration |
| `headers-config` | Blocked resources (CSP), privacy leaks (Referrer-Policy), security downgrade (HSTS) |
| `security-config` | Invalid vulnerability disclosure, compliance failure |
| `site` | Broken identity, missing icons, wrong SEO defaults |
