# Baseline

Package: `@browser.style/baseline`
Part of the [browser-style](https://github.com/madsstoumann/browser-style) monorepo.
CMS-agnostic content architecture — models, content examples, and documentation for a complete site system.
Designed to work with [UCM](../unified-content-model) (Unified Content Model, `@browser.style/unified-content`) for syncing to any supported CMS.

## Project Structure

```
models/          # Content type schemas (JSON Schema draft-07)
content/         # UCF content examples, organized by model
docs/            # All documentation (flat — no subdirectories)
src/css/         # Docusaurus custom styles
```

## Documentation (Docusaurus)

- Built with Docusaurus, served at `https://browser.style/baseline/`
- `baseUrl: '/baseline/'` in `docusaurus.config.js`
- All doc pages live flat in `docs/` (no `content/` or `guides/` subdirectories)
- Build: `npm run build` — builds to `site/`, copies output to project root, removes `site/`
- Build artifacts (`index.html`, `404.html`, `sitemap.xml`, `assets/`) are committed to git for GitHub Pages
- Dev server: `npx docusaurus start` from this directory (uses root `node_modules` via workspaces)

## Validation

Schemas are validated from the sibling UCM project:
```bash
cd ../unified-content-model && npm run validate
```
The validate script points to `../baseline/models/*.schema.json`.

## Schema Conventions

- Every schema requires: `$schema`, `id`, `title`, `type`, `properties`
- `id` must match `^[a-z][a-z0-9-]*$` and the filename (`{id}.schema.json`)
- `$schema` is always `"http://json-schema.org/draft-07/schema#"`
- `contentTree` must be an object `{ "folder": "...", "path": "..." }` — never a plain string
- Singletons use `metadata.singleton: true` (site, crawler-config, headers-config, security-config)
- Fields with visual CMS editors use `type: "object"` + `ui.widget` referencing widget-registry
- Localization defaults: string/text/richtext are localized; number/boolean/date/media/reference are invariant
- Use `structure.layout` groups to organize fields in the CMS editor

## Type System

Core: `string`, `text`, `number`, `boolean`, `date`, `datetime`, `url`, `richtext`
Structural: `media`, `reference`, `array`, `select`, `object`
Special: `slug`, `tags`, `color`, `geopoint`

- `reference` with `options.multiple: true` for one-to-many relationships
- `select` with `options: [{ value, label }]` — works across all CMS platforms
- `media` for assets — use `$asset` syntax in content files
- Multi-select is NOT universal across CMS platforms — use checkbox groups instead

## Content File Conventions

- Path: `content/{model}/{id}.json`
- Locale variants: `{id}.da-DK.json`, `{id}.de-DE.json`
- Special syntax: `$ref` (references), `$asset` (media), `$richtext` (rich text)
- Every content file needs: `$schema`, `id`, `model`, `meta`, `fields`

## Architecture

### Global (cached once, invalidated via webhook)
- `site` — identity, icons, SEO defaults, external scripts, social links, navigation, error pages
- `error-page` — maps HTTP status code to a custom page (referenced from site)
- `crawler-config` — robots.txt, manifest.json + manifest icons, llms.txt settings
- `headers-config` — CSP, Permissions-Policy, Referrer-Policy, HSTS, CORS
- `security-config` — security.txt
- `navigation` / `navigation-item` — header + footer navs, supports mega-menu nesting
- `external-script` — analytics, CMP, marketing scripts (referenced from site)
- `social-link` — social media profile links (referenced from site)
- `persona` — AI search personas
- `translation-namespace` — i18n string bundles

### Per-page (fetched per route)
- `page` — slug, SEO fields, robots directives, canonical URL, layout references
- `layout` — content container on a page (hero, grid, feature list)
- `layout-config` — responsive breakpoints with integrated spacing tokens, 63+ layout patterns from browser-style. Spacing is per-breakpoint (e.g. `"columns(3) pi(2) pbs(1) cg(2)"`), not separate fields.
- `content-card` — polymorphic card model (article, product, event, faq, etc.)

## Key Decisions

- Browser icons (favicon, apple-touch) live on `site`; manifest/PWA icons live on `crawler-config` alongside manifest.json
- Error pages use a separate `error-page` model (status_code + page ref) instead of hardcoded `error_404_page_id` / `error_500_page_id` — open-ended for any HTTP status code
- External scripts are a separate model, not inline on site — enables per-script webhook granularity
- Page has `robots_directives` (checkbox group) instead of sitemap CMS fields — noindex per page is more intuitive
- Translation namespaces generate flat `locales/{locale}.json` files at build time, not from an edge store
- Social links have optional `icon` (media) with code-level fallback from platform name
- `og_type` on page is a `select`, not freeform string

## Dependencies

- [UCM](../unified-content-model) — schema validation, CMS sync, type system (`@browser.style/unified-content`)
- [browser-style layout system](ui/layout) — the `<lay-out>` custom element and 63+ CSS layout patterns that `layout-config` maps to

## Platform Support

Documentation and implementation plans cover multiple deployment targets:
- **Vercel** — Edge Config + Next.js ISR + middleware (primary, fully documented)
- **Cloudflare** — Workers KV + Pages (documented as alternative in all docs)
- Other platforms (AWS, Netlify, Deno) — same architecture, see `docs/webhook.edge.md`

## Gotchas

- `contentTree` as a string will fail validation — always use the object form
- The `/models/cards/` directory in UCM is OBSOLETE — all cards are in `content-card.schema.json`
- `demo.schema.json` and `demo.widgets.schema.json` are test/showcase models, not site models
- All doc pages are flat in `docs/` — do NOT create subdirectories like `docs/content/` or `docs/guides/`
- No local `node_modules` — dependencies are hoisted to the monorepo root via workspaces
