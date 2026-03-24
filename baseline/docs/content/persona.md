---
sidebar_label: Persona
---

# 🟠 Persona

Personas define audience-specific search experiences for AI-powered site search. Each persona tailors the LLM system prompt and content retrieval to a specific audience segment.

Schema: [`models/persona.schema.json`](../../models/persona.schema.json)
CMS location: `Configuration / Personas`

---

## Fields

| Field | Type | Required | Localized | Description |
|-------|------|:--------:|:---------:|-------------|
| `displayName` | string | yes | yes | Name shown in the persona selector UI |
| `slug` | slug | yes | no | Machine key for query parameters and API calls, e.g. `investor`, `developer`, `hcp` |
| `systemPrompt` | text | yes | no | LLM system prompt prefix |
| `description` | text | | yes | Tooltip or helper text explaining this persona |
| `isDefault` | boolean | | no | Whether this persona is pre-selected on page load |
| `searchBias` | object | | no | Retrieval configuration (content types, tags, boost weights) |
| `sortOrder` | number | | no | Display order in the persona selector (lower = first) |

---

## How Personas Work

A typical AI-powered search flow:

1. User selects a persona from the search UI (or the default is used)
2. The frontend sends the search query with `?persona=developer`
3. The search API:
   - Prepends the persona's `systemPrompt` to the LLM context
   - Applies `searchBias` to weight content retrieval toward relevant topics
4. The response is tailored to that audience

### System Prompt

The `systemPrompt` is prepended to the LLM's system message before processing a search query. It tells the AI what perspective to adopt and what kind of answers to provide.

Example for a **Developer** persona:

```
You are a technical assistant for Generic Site. Focus on code examples,
API documentation, SDK usage, and integration guides. Use precise
technical language. When referencing configuration, show the actual
code or CLI commands. Prefer working examples over abstract descriptions.
```

Example for a **Designer** persona:

```
You are a design assistant for Generic Site. Focus on design tokens,
color palettes, typography scales, spacing systems, and layout patterns.
Reference visual examples and Figma-friendly token values. Explain
design decisions in terms of visual hierarchy, readability, and
accessibility (WCAG).
```

### Search Bias

The `searchBias` field is a JSON object that configures content retrieval weighting. The exact structure depends on the search backend, but a typical shape:

```json
{
  "contentTypes": ["page", "content-card"],
  "tags": ["api", "sdk", "integration"],
  "boostFields": {
    "category": { "documentation": 2.0, "tutorial": 1.5 }
  }
}
```

This biases the retrieval engine to surface documentation and tutorial content for the Developer persona, while a Designer persona might boost `design-tokens` and `accessibility` tags instead.

---

## Localization

`displayName` and `description` are localized — they appear in the UI and should be translated. `systemPrompt` and `searchBias` are **not localized** because they operate on the AI/retrieval layer, which typically processes content in the source language regardless of the user's UI locale.

---

## Default Persona

Exactly one persona should have `isDefault: true`. This persona is pre-selected when the user first opens the search interface. If no persona is marked as default, the frontend should fall back to an unbiased search (no system prompt prefix, no content weighting).

---

## Persona Selector

The frontend renders a selector (dropdown, tabs, or segmented control) from the persona list, ordered by `sortOrder`. Selecting a persona:
- Stores the selection in a cookie or URL parameter
- Re-runs the current query with the new persona's prompt and bias
- Persists across page navigation within the session
