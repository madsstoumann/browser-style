---
sidebar_label: Translation Namespace
---

# 🔵 Translation Namespace

Localized UI strings grouped by functional area (namespace). Used to generate flat locale files at build time, providing framework-agnostic internationalization for short strings like button labels, form placeholders, and navigation text.

Schema: [`models/translation-namespace.schema.json`](../../models/translation-namespace.schema.json)
CMS location: `Configuration / Translations`

---

## Fields

| Field | Type | Required | Localized | Description |
|-------|------|:--------:|:---------:|-------------|
| `namespace` | string | yes | no | Grouping key, e.g. `nav`, `card`, `form`, `error` |
| `strings` | object | yes | yes | Key-value pairs of translatable strings |

---

## How It Works

### 1. CMS entries

Editors create one entry per namespace. Each entry contains a flat object of string key-value pairs, localized per locale:

**Namespace: `nav`**

| Locale | Strings |
|--------|---------|
| en-US | `{ "home": "Home", "back": "Back", "menu": "Menu", "search": "Search" }` |
| da-DK | `{ "home": "Hjem", "back": "Tilbage", "menu": "Menu", "search": "Søg" }` |
| de-DE | `{ "home": "Startseite", "back": "Zurück", "menu": "Menü", "search": "Suche" }` |

**Namespace: `card`**

| Locale | Strings |
|--------|---------|
| en-US | `{ "add": "Add to cart", "remove": "Remove", "readMore": "Read more" }` |
| da-DK | `{ "add": "Tilføj til kurv", "remove": "Fjern", "readMore": "Læs mere" }` |

### 2. Build step

A prebuild script fetches all translation namespaces and flattens them into locale files with dot-prefix notation:

**`locales/en-US.json`**
```json
{
  "nav.home": "Home",
  "nav.back": "Back",
  "nav.menu": "Menu",
  "nav.search": "Search",
  "card.add": "Add to cart",
  "card.remove": "Remove",
  "card.readMore": "Read more"
}
```

**`locales/da-DK.json`**
```json
{
  "nav.home": "Hjem",
  "nav.back": "Tilbage",
  "nav.menu": "Menu",
  "nav.search": "Søg",
  "card.add": "Tilføj til kurv",
  "card.remove": "Fjern",
  "card.readMore": "Læs mere"
}
```

### 3. Frontend usage

The generated files are consumed by any i18n library (next-intl, react-i18next, or a simple lookup function):

```typescript
import locale from '@/locales/en-US.json';

function t(key: string): string {
  return locale[key] ?? key;
}

// Usage
t('card.add')       // → "Add to cart"
t('nav.search')     // → "Search"
```

---

## Namespace Naming

The `namespace` field must match `^[a-z][a-z0-9-]*$` and must be unique across all entries.

Recommended namespaces:

| Namespace | Purpose |
|-----------|---------|
| `auth` | Authentication strings (sign in, sign out, forgot password) |
| `card` | Content card actions (read more, add, remove) |
| `common` | Shared strings used across multiple contexts |
| `error` | Error messages (not found, server error, required field) |
| `footer` | Footer-specific strings (copyright, newsletter) |
| `form` | Form labels and validation messages |
| `nav` | Navigation labels (home, back, menu, close) |
| `search` | Search UI (placeholder, no results, filters) |

---

## Why Not an Edge Store?

Translation strings are baked into the frontend bundle at build time — they don't need runtime resolution. Storing them in an edge store (Vercel Edge Config, Cloudflare KV, etc.) would add unnecessary latency to every request for data that only changes on publish.

The workflow is:
1. Editor updates a translation namespace in the CMS
2. CMS webhook fires
3. Webhook triggers a rebuild (Vercel deploy hook, Cloudflare Pages build hook, or CI pipeline)
4. Prebuild script generates new locale files
5. The app builds with the updated strings

This ensures translations are always consistent within a deployment and don't require runtime fetching.

---

## Independent Model

Translation namespaces are **not referenced from the site model**. They exist independently in the CMS and are consumed only by the build process. This keeps the site model focused on runtime configuration and avoids coupling translations to the site singleton's webhook lifecycle.
