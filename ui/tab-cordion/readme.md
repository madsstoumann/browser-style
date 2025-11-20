# Tab Cordion

A hybrid UI component that functions as an **Accordion** when narrow and transforms into **Tabs** when its container width is >= 700px. It is built using standard `<details>` and `<summary>` elements for accessibility and semantics, enhanced with modern CSS features like Container Queries, Anchor Positioning, and Scope.

## Usage

```html
<tab-cordion from="breakout elevated" to="highlight shadow rounded">
  <cq-box>
    <details name="my-group" open>
      <summary>Tab 1<ui-icon type="user"></ui-icon></summary>
      <div class="content">Content for tab 1</div>
    </details>
    <details name="my-group">
      <summary>Tab 2<ui-icon type="settings"></ui-icon></summary>
      <div class="content">Content for tab 2</div>
    </details>
  </cq-box>
</tab-cordion>
```

## Attributes

The component uses two main attributes to control its appearance in different states. These attributes accept a space-separated list of "tokens".

### `from` (Accordion Mode)
Controls the appearance when in the "Accordion" state (default, or when container width < 700px).

| Token | Description |
| :--- | :--- |
| **`background`** | Adds a background color and padding to the container. |
| **`breakout`** | The open item visually "breaks out" by pushing subsequent items down. |
| **`contain`** | Wraps the entire group in a border. |
| **`divided`** | Adds separator lines between items. |
| **`elevated`** | (Requires `breakout`) Adds a shadow to the open item instead of a border. |
| **`rounded`** | Rounds the corners of items. |
| **`separate`** | Separates items into distinct cards with spacing between them. |

### `to` (Tabs Mode)
Controls the appearance when in the "Tabs" state (container width >= 700px).

| Token | Description |
| :--- | :--- |
| **`background`** | Adds a background color to the tab header area. |
| **`compact`** | Compresses tab headers to their intrinsic width instead of equal width. |
| **`highlight`** | Adds a sliding "pill" background behind the active tab. |
| **`line`** | Adds a sliding underline indicator instead of a pill. |
| **`noicons`** | Hides `ui-icon` elements within the tab summaries. |
| **`panel-bg`** | Applies a shared background color to the tab headers and the content panel. |
| **`rounded`** | Rounds the tab headers/pill. |
| **`shadow`** | Adds a drop shadow to the content panel. |

## Custom Properties

The component exposes several CSS custom properties for theming.

### Colors & Basics
| Property | Default | Description |
| :--- | :--- | :--- |
| `--tc-accent` | `hsl(210, 100%, 45%)` | Main accent color. |
| `--tc-bg` | `#EEE` / `#222` | Background color for accordion items. |
| `--tc-tabs-bg` | `#EAEAEA` / `#222` | Background for tab header area. |
| `--tc-tabs-panel-bg` | `#f7f7f7` / `#1c1c1c` | Background for content panel. |

### Hover States (Tabs Mode)
| Property | Default | Description |
| :--- | :--- | :--- |
| `--tc-tab-hover-c` | `var(--tc-accent)` | Text color on hover. |
| `--tc-tab-hover-bg` | `rgba(0,0,0,0.05)` | Background color on hover (inactive tabs only). |
| `--tc-tab-hover-td` | `none` | Text decoration on hover. |
| `--tc-tab-hover-trs` | `200ms` | Transition duration for hover effects. |

### Dimensions
| Property | Default | Description |
| :--- | :--- | :--- |
| `--tc-item-bdrs` | `1em` | Border radius for accordion items. |
| `--tc-tabs-bdrs` | `3em` | Border radius for tabs. |
| `--tc-item-trsdu` | `300ms` | Global transition duration. |

## Browser Support

This component relies on cutting-edge CSS features:
*   **CSS Container Queries** (`@container`)
*   **CSS Anchor Positioning** (`anchor()`, `anchor-size()`)
*   **CSS Scope** (`@scope`)
*   **CSS Nesting**
*   **CSS `:has()`**
*   **CSS `:where()`**

Ensure your target browsers support these features.