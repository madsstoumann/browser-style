---
slug: /
sidebar_label: Introduction
sidebar_position: 1
---

# Baseline CMS Documentation

CMS-agnostic content architecture — models, content examples, and documentation for a complete site system.

---

## Getting Started

- [**Getting Started**](./getting-started.md) — Zero to working site: clone, configure UCM, sync schemas to your CMS, set up your frontend

## Editor Roles

- [**Editor Roles**](./content/editor-roles.md) — Role-based access control: 🔴 Admin, 🟠 Site Editor, 🟢 Content Editor, 🔵 Translator — mapped to CMS-native permissions

## Site Structure

How the content model is organized, from the global site singleton down to individual pages.

- 🔴 [**Site**](./content/site.md) — Global singleton: identity, icons, SEO defaults, navigation, error pages, and references to all configuration
- 🟢 [**Page**](./content/page.md) — URL-addressable unit: SEO metadata, layouts, robots directives, navigation overrides, and the fallback chain from page to site
- 🟠 [**Error Page**](./content/error-page.md) — Maps HTTP status codes (401, 403, 404, 500, 503) to custom page entries

## Layouts

- 🟢 [**Layout**](./content/layout.md) — Content sections on a page: hero banners, card grids, feature lists, etc.
- 🟠 [**Layout Config**](./content/layout-config.md) — Layout configuration presets: responsive breakpoints, spacing, grid settings, animations, and overflow

## Navigation

- 🟠 [**Navigation**](./content/navigation.md) — Navigation containers and items: simple menus, dropdown menus, mega menus with columns and promotional slots, footer columns, and sidebar trees

## Configuration

Referenced singletons for infrastructure settings, each with a dedicated visual editor and independent webhook lifecycle.

- 🔴 [**Crawler Config**](./content/crawler-config.md) — robots.txt, web app manifest (manifest.json), and LLM index (llms.txt / llms-full.txt)
- 🔴 [**Sitemap**](./content/sitemap.md) — sitemap.xml generation: Vercel (built-in), Cloudflare (prebuild or Worker), and vanilla
- 🔴 [**Headers Config**](./content/headers-config.md) — Content Security Policy, Permissions-Policy, and Referrer-Policy
- 🔴 [**Security Config**](./content/security-config.md) — security.txt for vulnerability disclosure (RFC 9116)
- 🔴 [**External Scripts**](./content/external-script.md) — Third-party script management: analytics, consent, marketing, support

## Content Features

- 🟠 [**Personas**](./content/persona.md) — Audience-specific search experiences with LLM system prompts and content retrieval bias
- 🔵 [**Translations**](./content/translation-namespace.md) — Namespace-based UI string localization, built into flat locale files at deploy time

## Specifications

Core UCM specifications and platform-specific details are maintained in the sibling [Unified Content Model](https://github.com/user/unified-content-model) project (`@browser.style/unified-content`).

- [UCM Specification](./UCM.md) — Unified type system and CMS platform mappings
- [UCF Specification](./UCF.md) — Unified Content Format for portable content instances

## Platform Guides

Detailed implementation guides for each deployment platform — how to serve robots.txt, security headers, navigation, pages, and more.

- [**Vercel (Next.js)**](./guides/vercel.md) — Edge Config, route handlers, middleware, ISR
- [**Cloudflare (Workers / Pages)**](./guides/cloudflare.md) — Workers KV, fetch handlers, Cache API

## Implementation Plans

Architecture plans and setup checklists.

- [**Webhook & Edge Delivery**](./guides/webhook.edge.md) — Architecture plan: webhooks, edge stores, and generated files
- [**Markdown Endpoints**](./guides/markdown-endpoints.md) — Serve pages as clean markdown for LLM consumption
