# Tab-Cordion Token System

A hybrid accordion/tabs component with a systematic token-based styling approach.

## Token Prefixes

The component uses 3-character prefixes to organize attributes by scope:

- **cnt-** Container (outer wrapper)
- **itm-** Items (individual accordion/tab items)
- **tab-** Tabs (clickable headers in tab mode)
- **pnl-** Panel (content area)
- **ind-** Indicator (active tab marker in tab mode)
- **hvr-** Hover (interaction states)

---

## Accordion Mode Tokens (`from` attribute)

Use these tokens to style the accordion appearance on mobile/narrow viewports.

### Container Styling
- `cnt-bg` — Apply background color to container
- `cnt-border` — Wrap entire group in a continuous border
- `cnt-rounded` — Round container corners

### Item Layout & Spacing
- `itm-divided` — Add dividing lines between items
- `itm-separate` — Space items apart as individual cards
- `itm-elevated` — Add box-shadow to items (pairs with `itm-breakout`)
- `itm-breakout` — Open item "breaks out" and pushes others down
- `itm-rounded` — Round item corners

### Interaction States
- `hvr-bg` — Background color change on hover (accordion mode)
- `hvr-accent` — Accent color change on hover (accordion mode)

**Example:**
```html
<tab-cordion from="cnt-bg itm-separate itm-rounded itm-elevated">
```

---

## Tab Mode Tokens (`to` attribute)

Use these tokens to style the tab appearance on desktop/wide viewports (≥700px).

### Tab Header Styling
- `tab-bg` — Apply background to tab header row
- `tab-compact` — Compress tabs to intrinsic width (not full-width)
- `tab-rounded` — Round tab button corners
- `tab-noicons` — Hide icons in tab headers

### Panel Styling
- `pnl-bg` — Apply background color to content panel
- `pnl-shadow` — Add drop shadow under active panel
- `pnl-rounded` — Round panel corners
- `pnl-slide` — Slide down panel when tab is activated
- `pnl-fade` — Fade in panel content on transition
- `pnl-scale` — Scale up panel slightly on transition

### Active Tab Indicator
- `ind-pill` — Sliding pill/highlight behind active tab
- `ind-line` — Underline beneath active tab
- `ind-rounded` — Round indicator corners (pairs with `ind-pill`)

### Layout Options
- `tab-border` — Wrap entire tabs component in a border

### Interaction States
- `hvr-bg` — Background color on tab hover
- `hvr-accent` — Accent color on tab hover
- `hvr-line` — Preview underline on tab hover (pairs well with `ind-line`)

**Example:**
```html
<tab-cordion to="tab-bg tab-rounded ind-pill pnl-bg pnl-slide pnl-shadow" to-hover="hvr-bg hvr-line">
```

---

## Complete Token Reference

### FROM tokens (Accordion mode)
| Current Name | New Token | Category | Description |
|-------------|-----------|----------|-------------|
| `background` | `cnt-bg` | Container | Container background |
| `contain` | `cnt-border` | Container | Continuous border wrap |
| `rounded` | `cnt-rounded` | Container | Rounded container |
| `divided` | `itm-divided` | Items | Dividing borders |
| `separate` | `itm-separate` | Items | Spaced card layout |
| `elevated` | `itm-elevated` | Items | Box shadow effect |
| `breakout` | `itm-breakout` | Items | Breakout animation |
| `rounded` | `itm-rounded` | Items | Rounded item corners |

### TO tokens (Tab mode)
| Current Name | New Token | Category | Description |
|-------------|-----------|----------|-------------|
| `background` | `tab-bg` | Tabs | Tab header background |
| `compact` | `tab-compact` | Tabs | Compressed tab width |
| `noicons` | `tab-noicons` | Tabs | Hide icons |
| `rounded` | `tab-rounded` | Tabs | Rounded tab buttons |
| `contain` | `tab-border` | Tabs | Border around component |
| `panel-bg` | `pnl-bg` | Panel | Panel background |
| `shadow` | `pnl-shadow` | Panel | Panel drop shadow |
| `rounded` | `pnl-rounded` | Panel | Rounded panel |
| — | `pnl-slide` | Panel | Slide down transition |
| — | `pnl-fade` | Panel | Fade in transition |
| — | `pnl-scale` | Panel | Scale up transition |
| `highlight` | `ind-pill` | Indicator | Pill highlight |
| `line` | `ind-line` | Indicator | Underline indicator |
| `rounded` | `ind-rounded` | Indicator | Rounded indicator |

### HOVER tokens (Both modes)
| Attribute | Token | Mode | Description |
|-----------|-------|------|-------------|
| `from-hover` | `hvr-bg` | Accordion | Background on hover |
| `from-hover` | `hvr-accent` | Accordion | Accent color on hover |
| `to-hover` | `hvr-bg` | Tabs | Tab background on hover |
| `to-hover` | `hvr-accent` | Tabs | Tab accent on hover |
| `to-hover` | `hvr-line` | Tabs | Preview line on hover |

---

## Migration Notes

### Context-Dependent Token Resolution

The `rounded` token currently maps to different prefixes based on context:
- In `from` attribute → `cnt-rounded` or `itm-rounded`
- In `to` attribute → `tab-rounded`, `pnl-rounded`, or `ind-rounded`

**Recommendation:** Allow multiple rounded tokens in the same attribute for granular control.

### New Panel Animation Tokens

The `pnl-*` animation tokens provide fine-grained control over panel transitions in tab mode:

- **`pnl-slide`** — Panel slides down from the tab header
- **`pnl-fade`** — Panel opacity transitions from 0 to 1
- **`pnl-scale`** — Panel scales from 0.98 to 1.0 for subtle zoom effect

These can be combined: `to="pnl-slide pnl-fade"` for compound animations.