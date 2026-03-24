---
sidebar_label: Getting Started
sidebar_position: 2
---

# Getting Started

How to go from zero to a working site using **Baseline CMS** (content architecture) and **UCM** (Unified Content Model — the CLI that syncs schemas and content to any CMS).

---

## Prerequisites

- **Node.js 18+**
- A CMS account on one of the supported platforms:
  Contentful, Contentstack, Sanity, Storyblok, or Umbraco
- A deployment target: Vercel (Next.js), Cloudflare (Workers/Pages), or any static/SSR host

---

## 1. Clone and install

```bash
git clone <your-org>/baseline-cms.git
cd baseline-cms
npm install
```

---

## 2. Install unified-content

```bash
npm install @browser.style/unified-content
```

This adds the UCM CLI and all CMS adapters.

---

## 3. Configure your CMS

```bash
cp .cmsconfig.example .cmsconfig
```

Edit `.cmsconfig` and set:

1. **`CMS_PLATFORM`** — uncomment your CMS (`contentful`, `contentstack`, `sanity`, `storyblok`, or `umbraco`)
2. **Platform credentials** — fill in the API keys for your chosen CMS (see comments in the file)

```bash
# Example for Contentful
CMS_PLATFORM=contentful
CONTENTFUL_SPACE_ID=your_space_id
CONTENTFUL_ENVIRONMENT=master
CONTENTFUL_ACCESS_TOKEN=your_cma_token
```

---

## 4. Validate schemas

Before syncing to a CMS, verify the schemas are valid:

```bash
npx ucm validate
```

This runs AJV against the UCM meta-schema and reports any issues.

---

## 5. Preview changes (diff)

See what UCM would create or update in your CMS without making changes:

```bash
npx ucm diff
```

This compares local schemas with the content types already in your CMS and shows what would be created, updated, or skipped.

---

## 6. Sync schemas to your CMS

Push all content type definitions to your CMS:

```bash
npx ucm sync
```

UCM will:

1. Read every `.schema.json` from `models/`
2. Connect to your CMS using the configured credentials
3. Create content types that don't exist yet
4. Update content types that have changed
5. Skip content types that are identical

After sync, your CMS will have all 15 production content types: `site`, `page`, `layout`, `layout-config`, `content-card`, `navigation`, `navigation-item`, `error-page`, `crawler-config`, `headers-config`, `security-config`, `external-script`, `social-link`, `persona`, and `translation-namespace`.

---

## 7. Push demo content (optional)

Baseline CMS includes 130+ content examples. Push them to your CMS to get a working demo:

```bash
npx ucm content push --input content -y
```

This creates entries for every content example — site config, pages, layouts, cards, navigation, error pages, and all configuration singletons.

---

## 8. Set up your frontend

Create your application project and configure it to read from your CMS.

### Vercel (Next.js)

```bash
npx create-next-app@latest my-site
cd my-site
```

Set up Edge Config for configuration singletons and ISR for pages. See the [Vercel platform guide](./vercel.md) for complete implementation details.

Key environment variables (see `.env.local.example` in Baseline CMS):

```bash
CONTENTFUL_SPACE_ID=...
CONTENTFUL_ACCESS_TOKEN=...        # Content Delivery API token
CONTENTFUL_PREVIEW_TOKEN=...       # Content Preview API token
VERCEL_EDGE_CONFIG=...             # Edge Config connection string
VERCEL_EDGE_CONFIG_ID=...
VERCEL_API_TOKEN=...               # For Edge Config writes
NEXT_PUBLIC_SITE_URL=https://your-site.com
```

### Cloudflare (Workers / Pages)

Create a Workers or Pages project. Set up KV namespaces for configuration singletons and use the Cache API or KV for page content. See the [Cloudflare platform guide](./cloudflare.md) for complete implementation details.

### Other platforms

The same architecture applies — CMS webhooks write to an edge store, and the frontend reads from it at request time. The [Webhook & Edge Delivery plan](./webhook.edge.md) covers the platform-agnostic architecture.

---

## 9. Set up webhooks

Configure your CMS to send webhooks when content is published. The webhook handler dispatches by content type:

| Content type | What happens |
|---|---|
| `crawler-config` | Write robots.txt, manifest, llms config to edge store |
| `error-page` | Rebuild the error page map on the site payload |
| `headers-config` | Write CSP, Permissions-Policy, HSTS, CORS to edge store |
| `navigation` | Revalidate navigation cache tag or write resolved tree to KV |
| `page` | Revalidate the page path (Vercel ISR) or write to KV (Cloudflare) |
| `persona` | Write persona array to edge store |
| `security-config` | Write security.txt content to edge store |
| `site` | Resolve all refs, write full site payload to edge store |
| `translation-namespace` | Trigger deploy hook for static regeneration |

See [Webhook & Edge Delivery](./webhook.edge.md) for the full architecture and handler implementations.

---

## 10. Generate static files

Some files are generated at build time rather than served dynamically:

```bash
# These run as prebuild scripts in your frontend project
npm run prebuild:translations   # → locales/{locale}.json
npm run prebuild:sitemap        # → public/sitemap.xml
npm run prebuild:llms           # → public/llms.txt, public/llms-full.txt
```

See [Sitemap](./sitemap.md) for sitemap generation details, and [Crawler Config](./crawler-config.md) for llms.txt.

---

## Summary

```
              ┌──────────────────────────────────────┐
              │   Your project                       │
              │   (cloned from baseline-cms)         │
              │   + @browser.style/unified-content   │
              └──────────────────┬───────────────────┘
                               │ npx ucm validate + sync
              ┌────────────────▼────────────────┐
              │   Your CMS                      │
              │   (Contentful, Sanity, etc.)    │
              └────────────────┬────────────────┘
                               │ webhooks on publish
              ┌────────────────▼────────────────┐
              │   Your Frontend                 │
              │   (Next.js, Workers, etc.)      │
              │   + Edge Store                  │
              └─────────────────────────────────┘
```

| Step | Command |
|---|---|
| Validate schemas | `npx ucm validate` |
| Preview changes | `npx ucm diff` |
| Sync to CMS | `npx ucm sync` |
| Push content | `npx ucm content push --input content` |
| Pull from CMS | `npx ucm content pull` |
| Run dev server | `npm run dev` |
