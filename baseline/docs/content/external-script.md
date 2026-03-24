---
sidebar_label: External Script
---

# 🔴 External Script

Individual third-party script configurations, referenced as an array from the [site model](./site.md). Each script is a separate content entry, enabling granular control and independent webhook updates.

Schema: [`models/external-script.schema.json`](../../models/external-script.schema.json)
CMS location: `Configuration / External Scripts`

---

## Fields

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `name` | string | yes | Human-readable label, e.g. "Google Tag Manager" |
| `provider` | string | yes | Machine key, e.g. `gtm`, `cookiebot`, `hotjar` |
| `category` | select | | Loading and consent classification |
| `id` | string | | Provider-specific identifier, e.g. `GTM-XXXX`, `cbid-XXXX` |
| `integrity` | string | | Subresource Integrity (SRI) hash for tamper detection |
| `loading` | select | | How the script is loaded in the browser |
| `url` | url | | Full URL to the script file |

---

## Category

The category determines when and how the script is loaded relative to user consent:

| Value | Purpose | Consent required? |
|-------|---------|:-----------------:|
| `consent` | Consent management platform (e.g. Cookiebot, OneTrust). Must load before all other scripts. | No (it *provides* consent) |
| `analytics` | Page view tracking, heatmaps, session recording (e.g. GA4, Hotjar) | Yes |
| `marketing` | Ad pixels, retargeting, conversion tracking (e.g. Meta Pixel, Google Ads) | Yes |
| `support` | Live chat, help widgets (e.g. Intercom, Zendesk) | Depends on jurisdiction |
| `other` | Any script that doesn't fit the above | Depends |

The frontend uses this category to gate scripts behind the consent manager. Scripts with `category: "consent"` always load first. Scripts with `category: "analytics"` or `"marketing"` only load after the user has accepted the corresponding consent category.

---

## Loading Strategy

Controls how the `<script>` tag is rendered in the HTML:

| Value | HTML | Behavior |
|-------|------|----------|
| `blocking` | `<script src="...">` in `<head>` | Blocks page rendering until loaded. Use only for consent managers that must run before anything else. |
| `async` | `<script async src="...">` | Downloads in parallel, executes as soon as ready. Does not block rendering but may execute before DOM is complete. |
| `defer` | `<script defer src="...">` | Downloads in parallel, executes after HTML parsing is complete. Maintains script order. Recommended for most scripts. |

### Recommended combinations

| Script type | Category | Loading |
|-------------|----------|---------|
| Cookiebot / OneTrust | `consent` | `blocking` |
| Google Tag Manager | `analytics` | `async` |
| Hotjar / FullStory | `analytics` | `defer` |
| Intercom / Zendesk | `support` | `defer` |
| Meta Pixel | `marketing` | `defer` |

---

## Subresource Integrity (SRI)

The `integrity` field holds an SRI hash (e.g. `sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8w`). When set, the browser verifies that the downloaded script matches the hash before executing it. If the file has been tampered with (CDN compromise, supply chain attack), the browser refuses to run it.

SRI is most useful for scripts loaded from third-party CDNs. It is less practical for scripts that change frequently (like consent managers with rolling updates).

---

## Why Separate Entries?

Previous versions of the site model used inline fields (`analytics_provider`, `analytics_id`, `cmp_provider`, etc.) for a fixed set of scripts. The external-script model improves on this:

- **Unlimited scripts** — add as many as needed without schema changes
- **Granular webhooks** — publishing one script entry only invalidates that script's cache, not the entire site config
- **Self-documenting** — each entry has a name, category, and loading strategy visible in the CMS
- **Reusable** — the same script entry could be referenced from page-level overrides if needed
