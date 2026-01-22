# Multi-Site Design Token Architecture

## Executive Summary

This document defines an architecture for a design system serving multiple websites. Each site maintains its own "raw tokens" (colors, fonts, sizes), while sharing a unified design system layer. The architecture accounts for Figma's limitations with design tokens.

---

## Compatibility with `<web-config-tokens>`

This architecture is **fully compatible** with the existing `web-config-tokens` component ecosystem:

| Component | Role | Compatibility |
|-----------|------|---------------|
| `<web-config-tokens>` | Visual editor for token files | Loads/saves `design.tokens.json` |
| `<design-token>` | Individual token display/edit | Renders any W3C token type |
| `design-token-utils` | Token processing | Builds registry, generates CSS |
| `design-token-editors` | Advanced editors | Color picker, future editors |
| `design-token-styles` | Shared CSS | Type-specific previews |

### CMS Integration Flow

```
CMS Page
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  <web-config-tokens src="/api/tokens/site-a">               │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │<design-token│  │<design-token│  │<design-token│         │
│  │ type=color  │  │ type=number │  │ type=font   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  Uses: design-token-utils (buildRegistry, exportTokensToCSS)│
│  Uses: design-token-editors (edit-color, future editors)    │
└─────────────────────────────────────────────────────────────┘
    │
    │ User edits token → token-changed event
    │ User saves → toJSON() → webhook POST
    ▼
┌─────────────────────────────────────────────────────────────┐
│  CMS Backend / Webhook Handler                              │
│                                                             │
│  POST /api/tokens/site-a                                    │
│  Body: { raw: { color: {...}, font: {...} }, ... }          │
│                                                             │
│  1. Validate token structure                                │
│  2. Save to site-a/design.tokens.json                       │
│  3. Trigger build pipeline (optional)                       │
│  4. Invalidate CDN cache (optional)                         │
└─────────────────────────────────────────────────────────────┘
```

### Key Integration Points

1. **Loading**: `<web-config-tokens src="...">` fetches JSON via `src` attribute
2. **Registry**: `buildRegistry()` creates Map for reference resolution
3. **CSS Generation**: `exportTokensToCSS()` generates CSS custom properties
4. **Editing**: `<design-token>` dispatches `token-changed` events
5. **Saving**: `toJSON()` reconstructs the token object from DOM state

---

## The Core Problem

You need:
1. **Multiple sites** with unique brand identities (colors, fonts, spacing)
2. **One design system** that provides consistent component styling
3. **Figma compatibility** for designer workflows
4. **W3C compliance** for interoperability

---

## Figma's Variable Limitations

Figma supports **only 4 variable types**:

| Figma Type | Supported Values | W3C Token Types |
|------------|------------------|-----------------|
| **Color** | Solid colors only (`#FFCD29`) | `color` (primitives only) |
| **Number** | Integers/decimals (`24`, `12.75`) | `dimension`, `number`, `fontWeight` |
| **String** | Text sequences | `fontFamily`, `fontStyle` |
| **Boolean** | `true`/`false` | N/A |

**What Figma CANNOT store as Variables:**
- Gradients (linear, radial, conic)
- Shadows (box-shadow, drop-shadow)
- Typography composites (font shorthand)
- Borders
- Transitions/animations
- Cubic bezier curves
- Aspect ratios

These must be exported as **Figma Styles** instead, or handled purely in code.

---

## Three-Layer Token Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                      LAYER 1: RAW TOKENS                        │
│            (Per-site: site-a/design.tokens.json)                │
│                                                                 │
│  Primitive values: colors, font families, base sizes            │
│  100% Figma-compatible (color, number, string only)             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   LAYER 2: SEMANTIC TOKENS                      │
│            (Shared: design-system/semantic.tokens.json)         │
│                                                                 │
│  References to raw tokens: {raw.color.brand.500}                │
│  Partially Figma-compatible                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  LAYER 3: COMPONENT TOKENS                      │
│            (Shared: design-system/component.tokens.json)        │
│                                                                 │
│  Component-specific: button, card, input                        │
│  May include composites (NOT Figma-compatible)                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
/your-project/
├── sites/
│   ├── site-a/
│   │   └── design.tokens.json      ← Raw tokens for Site A
│   ├── site-b/
│   │   └── design.tokens.json      ← Raw tokens for Site B
│   └── site-c/
│       └── design.tokens.json      ← Raw tokens for Site C
│
├── design-system/
│   ├── semantic.tokens.json        ← Shared semantic layer
│   ├── component.tokens.json       ← Shared component layer
│   └── composites.tokens.json      ← Typography, shadows, etc.
│
└── build/
    ├── site-a/
    │   ├── tokens.css              ← Generated CSS
    │   └── figma.tokens.json       ← Figma-compatible export
    ├── site-b/
    │   └── ...
    └── site-c/
        └── ...
```

---

## Token File Specifications

### Layer 1: Raw Tokens (Per-Site)

**File:** `sites/site-a/design.tokens.json`

```json
{
  "$extensions": {
    "export": {
      "layer": "raw-tokens",
      "selector": ":root"
    },
    "figma": {
      "collection": "Site A - Raw Tokens"
    }
  },
  "raw": {
    "color": {
      "$type": "color",
      "$extensions": { "ui": { "title": "Brand Colors" } },
      "brand": {
        "100": { "$value": "#E3F2FD" },
        "200": { "$value": "#BBDEFB" },
        "300": { "$value": "#90CAF9" },
        "400": { "$value": "#64B5F6" },
        "500": { "$value": "#1976D2" },
        "600": { "$value": "#1565C0" },
        "700": { "$value": "#0D47A1" }
      },
      "neutral": {
        "0": { "$value": "#FFFFFF" },
        "50": { "$value": "#FAFAFA" },
        "100": { "$value": "#F5F5F5" },
        "200": { "$value": "#EEEEEE" },
        "900": { "$value": "#212121" },
        "1000": { "$value": "#000000" }
      }
    },
    "font": {
      "$type": "fontFamily",
      "heading": { "$value": ["Playfair Display", "serif"] },
      "body": { "$value": ["Inter", "system-ui", "sans-serif"] },
      "mono": { "$value": ["JetBrains Mono", "monospace"] }
    },
    "size": {
      "$type": "dimension",
      "base": { "$value": "16px" },
      "scale": {
        "xs": { "$value": "0.75rem" },
        "sm": { "$value": "0.875rem" },
        "md": { "$value": "1rem" },
        "lg": { "$value": "1.25rem" },
        "xl": { "$value": "1.5rem" },
        "2xl": { "$value": "2rem" },
        "3xl": { "$value": "3rem" }
      }
    },
    "spacing": {
      "$type": "dimension",
      "0": { "$value": "0" },
      "1": { "$value": "0.25rem" },
      "2": { "$value": "0.5rem" },
      "3": { "$value": "0.75rem" },
      "4": { "$value": "1rem" },
      "6": { "$value": "1.5rem" },
      "8": { "$value": "2rem" },
      "12": { "$value": "3rem" },
      "16": { "$value": "4rem" }
    },
    "radius": {
      "$type": "dimension",
      "none": { "$value": "0" },
      "sm": { "$value": "0.25rem" },
      "md": { "$value": "0.5rem" },
      "lg": { "$value": "1rem" },
      "full": { "$value": "9999px" }
    },
    "weight": {
      "$type": "fontWeight",
      "regular": { "$value": 400 },
      "medium": { "$value": 500 },
      "semibold": { "$value": 600 },
      "bold": { "$value": 700 }
    },
    "duration": {
      "$type": "duration",
      "instant": { "$value": "0ms" },
      "fast": { "$value": "100ms" },
      "normal": { "$value": "200ms" },
      "slow": { "$value": "300ms" }
    }
  }
}
```

**Key Points:**
- All values are **Figma-compatible** primitives
- Uses `$type` inheritance for cleaner structure
- `$extensions.figma.collection` maps to Figma Variable Collection
- `$extensions.ui.title` provides display names in `<web-config-tokens>`

---

### Layer 2: Semantic Tokens (Shared)

**File:** `design-system/semantic.tokens.json`

```json
{
  "$extensions": {
    "export": {
      "layer": "semantic-tokens",
      "selector": ":root"
    }
  },
  "color": {
    "$type": "color",
    "text": {
      "primary": { "$value": "{raw.color.neutral.900}" },
      "secondary": { "$value": "{raw.color.neutral.600}" },
      "muted": { "$value": "{raw.color.neutral.400}" },
      "inverse": { "$value": "{raw.color.neutral.0}" },
      "brand": { "$value": "{raw.color.brand.500}" }
    },
    "background": {
      "default": { "$value": "{raw.color.neutral.0}" },
      "subtle": { "$value": "{raw.color.neutral.50}" },
      "muted": { "$value": "{raw.color.neutral.100}" },
      "inverse": { "$value": "{raw.color.neutral.900}" },
      "brand": { "$value": "{raw.color.brand.500}" }
    },
    "border": {
      "default": { "$value": "{raw.color.neutral.200}" },
      "strong": { "$value": "{raw.color.neutral.400}" },
      "brand": { "$value": "{raw.color.brand.500}" }
    },
    "interactive": {
      "default": { "$value": "{raw.color.brand.500}" },
      "hover": { "$value": "{raw.color.brand.600}" },
      "active": { "$value": "{raw.color.brand.700}" },
      "disabled": { "$value": "{raw.color.neutral.300}" }
    }
  },
  "font": {
    "$type": "fontFamily",
    "heading": { "$value": "{raw.font.heading}" },
    "body": { "$value": "{raw.font.body}" },
    "code": { "$value": "{raw.font.mono}" }
  },
  "size": {
    "$type": "dimension",
    "text": {
      "xs": { "$value": "{raw.size.scale.xs}" },
      "sm": { "$value": "{raw.size.scale.sm}" },
      "base": { "$value": "{raw.size.scale.md}" },
      "lg": { "$value": "{raw.size.scale.lg}" },
      "xl": { "$value": "{raw.size.scale.xl}" },
      "heading": {
        "sm": { "$value": "{raw.size.scale.lg}" },
        "md": { "$value": "{raw.size.scale.xl}" },
        "lg": { "$value": "{raw.size.scale.2xl}" },
        "xl": { "$value": "{raw.size.scale.3xl}" }
      }
    }
  },
  "spacing": {
    "$type": "dimension",
    "inline": {
      "xs": { "$value": "{raw.spacing.1}" },
      "sm": { "$value": "{raw.spacing.2}" },
      "md": { "$value": "{raw.spacing.4}" },
      "lg": { "$value": "{raw.spacing.6}" }
    },
    "block": {
      "xs": { "$value": "{raw.spacing.2}" },
      "sm": { "$value": "{raw.spacing.4}" },
      "md": { "$value": "{raw.spacing.6}" },
      "lg": { "$value": "{raw.spacing.8}" },
      "xl": { "$value": "{raw.spacing.12}" }
    }
  }
}
```

---

### Layer 3: Component Tokens (Shared)

**File:** `design-system/component.tokens.json`

```json
{
  "$extensions": {
    "export": {
      "layer": "component-tokens",
      "selector": ":root"
    }
  },
  "button": {
    "primary": {
      "background": { "$type": "color", "$value": "{color.interactive.default}" },
      "backgroundHover": { "$type": "color", "$value": "{color.interactive.hover}" },
      "backgroundActive": { "$type": "color", "$value": "{color.interactive.active}" },
      "text": { "$type": "color", "$value": "{color.text.inverse}" },
      "borderRadius": { "$type": "dimension", "$value": "{raw.radius.md}" },
      "paddingX": { "$type": "dimension", "$value": "{spacing.inline.md}" },
      "paddingY": { "$type": "dimension", "$value": "{spacing.inline.sm}" },
      "fontSize": { "$type": "dimension", "$value": "{size.text.base}" },
      "fontWeight": { "$type": "fontWeight", "$value": "{raw.weight.medium}" }
    },
    "secondary": {
      "background": { "$type": "color", "$value": "transparent" },
      "backgroundHover": { "$type": "color", "$value": "{color.background.subtle}" },
      "text": { "$type": "color", "$value": "{color.interactive.default}" },
      "border": { "$type": "color", "$value": "{color.border.brand}" }
    }
  },
  "card": {
    "background": { "$type": "color", "$value": "{color.background.default}" },
    "borderRadius": { "$type": "dimension", "$value": "{raw.radius.lg}" },
    "padding": { "$type": "dimension", "$value": "{spacing.block.md}" },
    "border": { "$type": "color", "$value": "{color.border.default}" }
  },
  "input": {
    "background": { "$type": "color", "$value": "{color.background.default}" },
    "border": { "$type": "color", "$value": "{color.border.default}" },
    "borderFocus": { "$type": "color", "$value": "{color.interactive.default}" },
    "borderRadius": { "$type": "dimension", "$value": "{raw.radius.md}" },
    "padding": { "$type": "dimension", "$value": "{spacing.inline.sm}" },
    "text": { "$type": "color", "$value": "{color.text.primary}" },
    "placeholder": { "$type": "color", "$value": "{color.text.muted}" }
  }
}
```

---

### Layer 3b: Composite Tokens (Code-Only)

**File:** `design-system/composites.tokens.json`

These tokens are **NOT Figma-compatible** and should be excluded from Figma exports.

```json
{
  "$extensions": {
    "export": {
      "layer": "composite-tokens",
      "selector": ":root"
    },
    "figma": {
      "skip": true
    }
  },
  "typography": {
    "$type": "typography",
    "heading": {
      "xl": {
        "$value": {
          "fontFamily": "{font.heading}",
          "fontSize": "{size.text.heading.xl}",
          "fontWeight": "{raw.weight.bold}",
          "lineHeight": 1.2,
          "letterSpacing": "-0.02em"
        }
      },
      "lg": {
        "$value": {
          "fontFamily": "{font.heading}",
          "fontSize": "{size.text.heading.lg}",
          "fontWeight": "{raw.weight.bold}",
          "lineHeight": 1.25,
          "letterSpacing": "-0.01em"
        }
      }
    },
    "body": {
      "default": {
        "$value": {
          "fontFamily": "{font.body}",
          "fontSize": "{size.text.base}",
          "fontWeight": "{raw.weight.regular}",
          "lineHeight": 1.5
        }
      }
    }
  },
  "shadow": {
    "$type": "shadow",
    "sm": {
      "$value": {
        "offsetX": "0px",
        "offsetY": "1px",
        "blur": "2px",
        "spread": "0px",
        "color": "rgba(0, 0, 0, 0.05)"
      }
    },
    "md": {
      "$value": [
        { "offsetX": "0px", "offsetY": "4px", "blur": "6px", "spread": "-1px", "color": "rgba(0, 0, 0, 0.1)" },
        { "offsetX": "0px", "offsetY": "2px", "blur": "4px", "spread": "-2px", "color": "rgba(0, 0, 0, 0.1)" }
      ]
    },
    "lg": {
      "$value": [
        { "offsetX": "0px", "offsetY": "10px", "blur": "15px", "spread": "-3px", "color": "rgba(0, 0, 0, 0.1)" },
        { "offsetX": "0px", "offsetY": "4px", "blur": "6px", "spread": "-4px", "color": "rgba(0, 0, 0, 0.1)" }
      ]
    }
  },
  "border": {
    "$type": "border",
    "default": {
      "$value": {
        "width": "1px",
        "style": "solid",
        "color": "{color.border.default}"
      }
    }
  },
  "transition": {
    "$type": "transition",
    "default": {
      "$value": {
        "duration": "{raw.duration.normal}",
        "delay": "0ms",
        "timingFunction": [0.4, 0, 0.2, 1]
      }
    }
  }
}
```

---

## CMS Integration with `<web-config-tokens>`

### HTML Setup

```html
<!-- In CMS admin panel -->
<web-config-tokens
  src="/api/tokens/site-a/design.tokens.json"
  id="token-editor">
</web-config-tokens>

<button id="save-btn">Save Changes</button>

<script type="module">
  import '/ui/web-config-tokens/src/index.js';

  const editor = document.getElementById('token-editor');
  const saveBtn = document.getElementById('save-btn');

  saveBtn.addEventListener('click', async () => {
    const tokens = editor.toJSON();

    await fetch('/api/tokens/site-a', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tokens)
    });

    alert('Tokens saved!');
  });
</script>
```

### Webhook Handler (Example)

```javascript
// /api/tokens/[site].js
export async function POST(request) {
  const site = request.params.site;
  const tokens = await request.json();

  // 1. Validate token structure
  const { validateTokenStructure } = await import('@browser.style/design-token-utils');
  const validation = validateTokenStructure(tokens);
  if (!validation.valid) {
    return Response.json({ error: validation.errors }, { status: 400 });
  }

  // 2. Save to file system or database
  await saveTokens(site, tokens);

  // 3. Optionally trigger build
  await triggerBuild(site);

  return Response.json({ success: true });
}
```

---

## Build Pipeline

### Token Resolution Order

```
1. Load site-specific raw tokens
2. Load shared semantic tokens (resolve {raw.*} references)
3. Load shared component tokens (resolve {color.*}, {spacing.*} references)
4. Load composite tokens (resolve all references)
5. Generate outputs:
   - CSS custom properties
   - Figma-compatible JSON (primitives only)
   - TypeScript types (optional)
```

### Example Build Script

```javascript
// build-tokens.js
import { buildRegistry, exportTokensToCSS } from '@browser.style/design-token-utils';
import { readFileSync, writeFileSync } from 'fs';

const SITES = ['site-a', 'site-b', 'site-c'];

for (const site of SITES) {
  // 1. Load all token files
  const rawTokens = JSON.parse(readFileSync(`./sites/${site}/design.tokens.json`));
  const semanticTokens = JSON.parse(readFileSync('./design-system/semantic.tokens.json'));
  const componentTokens = JSON.parse(readFileSync('./design-system/component.tokens.json'));
  const compositeTokens = JSON.parse(readFileSync('./design-system/composites.tokens.json'));

  // 2. Merge tokens (raw first, then semantic references resolve against raw)
  const allTokens = {
    ...rawTokens,
    ...semanticTokens,
    ...componentTokens,
    ...compositeTokens
  };

  // 3. Build registry and export CSS
  const css = exportTokensToCSS(allTokens, {
    fileName: `./build/${site}/tokens.css`,
    layer: 'design-tokens',
    selector: ':root'
  });

  // 4. Export Figma-compatible subset
  const figmaTokens = extractFigmaCompatible(allTokens);
  writeFileSync(`./build/${site}/figma.tokens.json`, JSON.stringify(figmaTokens, null, 2));
}

function extractFigmaCompatible(tokens) {
  // Filter to only color, number, string, boolean primitives
  // Skip typography, shadow, border, gradient, transition
}
```

---

## Figma Workflow

### What Goes to Figma Variables

| Token Category | Figma Variable Type |
|----------------|---------------------|
| `raw.color.*` | Color |
| `color.*` (semantic) | Color (as aliases) |
| `raw.size.*`, `spacing.*` | Number |
| `raw.radius.*` | Number |
| `raw.weight.*` | Number |
| `raw.font.*` | String |
| `raw.duration.*` | Number (in ms) |

### What Goes to Figma Styles

| Token Category | Figma Style Type |
|----------------|------------------|
| `typography.*` | Text Style |
| `shadow.*` | Effect Style |

### What Stays Code-Only

- `border.*` (composite)
- `transition.*`
- `gradient.*`
- Cubic bezier values

---

## Summary Table

| Aspect | Recommendation |
|--------|----------------|
| **Raw tokens location** | `sites/[site]/design.tokens.json` |
| **Shared tokens location** | `design-system/*.tokens.json` |
| **File format** | W3C DTCG JSON |
| **Visual editor** | `<web-config-tokens>` component |
| **Figma sync** | Tokens Studio plugin |
| **Composites** | Separate file, marked `skip: true` for Figma |
| **Build output** | CSS custom properties |
| **Layer structure** | Raw → Semantic → Component |

---

## Related Documentation

- [Brand Hierarchy](./brand-hierarchy.md) - Brand/sub-brand/site relationships
- [W3C Design Tokens Format](https://www.designtokens.org/TR/drafts/format/) - Official specification
- [Tokens Studio](https://tokens.studio/) - Figma plugin for token management
