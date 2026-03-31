---
sidebar_label: 📐 Layout
---

# 📐 Layout 🟢

A `layout` is a content section on a page — a hero banner, a card grid, a feature list, a testimonial carousel, etc. Pages reference an ordered array of layouts, each containing a configuration preset and polymorphic content references.

Schema: [`models/layout.schema.json`](../models/layout.schema.json)

---

## Fields

| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| `title` | string | yes | Layout name, e.g. "Hero Section", "Feature Grid" |
| `config_id` | ref > layout-config | | Reference to a layout configuration preset |
| `content` | ref[] | | Polymorphic references to any content model (typically content-card) |
| `includeInMarkdown` | boolean | | Whether this layout's content appears in `.md` endpoints and `llms.txt` (default: `true`) |

---

## How It Works

```
Page
├── Layout: "Hero Banner"
│   ├── config_id ──► layout-config ("Full Width Hero")
│   └── content[] ──► content-card[] (one hero card)
│
├── Layout: "Feature Grid"
│   ├── config_id ──► layout-config ("3-Column Card Grid")
│   └── content[] ──► content-card[] (three feature cards)
│
└── Layout: "CTA Section"
    ├── config_id ──► layout-config ("Centered Narrow")
    └── content[] ──► content-card[] (one CTA card)
```

Each layout separates **what** (content) from **how** (config). The same content cards can appear in different layouts with different visual configurations.

---

## The `includeInMarkdown` Flag

When set to `false`, the layout's content is excluded from:
- **`.md` endpoints** — markdown representation of the page
- **`llms.txt` / `llms-full.txt`** — LLM index files

This is useful for decorative or interactive sections (hero animations, image carousels, embedded widgets) that add noise for AI consumers. Default is `true`.

---

## Layout Configuration

Each layout references a `layout-config` preset that controls the visual presentation: responsive grid, spacing, overflow behavior, animations, and more. See [Layout Config](./layout-config.md) for the full field reference.

---

## Content References

The `content` field is a polymorphic reference array — it can reference any content model, though in practice it typically references `content-card` entries. This enables a single layout to contain articles, products, events, FAQs, profiles, or any other card type.

See the page documentation for how layouts are [rendered on a page](./page.md#layouts).

