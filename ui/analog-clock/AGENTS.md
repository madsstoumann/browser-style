# Analog Clock Component - Internal Architecture

## Overview

`<analog-clock>` is a custom element that renders a CSS-animated analog clock with configurable numerals, indices, time zones, and date display. The clock hands are driven entirely by CSS animations with JavaScript-calculated delay offsets.

**Version:** 1.0.4 (package.json)

**Component Type:** Autonomous custom element extending HTMLElement

**Key Characteristics:**
- Pure vanilla JavaScript, no dependencies
- Uses Shadow DOM with Constructable Stylesheets
- CSS-only animation for clock hands (no JS interval for updates)
- Supports multiple numbering systems via `Intl.NumberFormat`
- Time zone support with UTC offset
- Container query units (`cqi`) for responsive sizing

**Use Cases:**
- World clock displays showing multiple time zones
- Decorative clock elements
- Dashboard time widgets
- Timezone-aware time display

## Architecture Overview

### Component Structure

```
<analog-clock>                              ← Host element (circular, grid layout)
  #shadow-root
    ├── <ul part="indices">                 ← Tick marks container (60 or 12)
    │     └── <li part="index [hour]">      ← Individual tick marks
    ├── <ol part="numerals">                ← Numeral container (positioned absolutely)
    │     └── <li>                          ← Individual numerals (1-12)
    ├── <nav part="hands">                  ← Hands container (3-column grid)
    │     ├── <b part="seconds">            ← Second hand (CSS animated)
    │     ├── <b part="minutes">            ← Minute hand (CSS animated)
    │     ├── <b part="hours">              ← Hour hand (CSS animated)
    │     ├── <time part="date">            ← Date display
    │     └── ::after                       ← Center cap (pseudo-element)
    └── <span part="label">                 ← Clock label text
```

### Animation Technique

The clock uses CSS animations with negative `animation-delay` to position hands:

```css
/* Hour hand: 12-hour rotation (43200 seconds) */
:host::part(hours) {
  animation: turn 43200s linear infinite;
  animation-delay: var(--_dh, 0ms);  /* Set by JS */
}

/* Minute hand: 60-minute rotation with stepping */
:host::part(minutes) {
  animation: turn 3600s steps(60, end) infinite;
  animation-delay: var(--_dm, 0ms);
}

/* Second hand: 60-second rotation */
:host::part(seconds) {
  animation: turn 60s var(--_tf, linear) infinite;
  animation-delay: var(--_ds, 0ms);
}

@keyframes turn {
  to { transform: rotate(1turn); }
}
```

**How it works:**
1. JavaScript calculates current time in target timezone
2. Converts time to negative seconds offset
3. Sets CSS custom properties (`--_dh`, `--_dm`, `--_ds`)
4. Negative `animation-delay` "rewinds" animation to correct position
5. CSS handles continuous animation from that point

### Lifecycle Flow

```
constructor()
  ↓
  attachShadow({ mode: 'open' })
  adoptedStyleSheets = [styles]
  ↓
  Inject HTML template:
    - indices (if attribute present)
    - numerals (formatted by system)
    - hands (seconds, minutes, hours)
    - date display
    - label
  ↓
  Cache #date reference
  Set label text from attribute
  ↓
  If 'steps' attribute: set --_tf to 'steps(60)'
  ↓
  #updateClock()
    ↓
    Calculate timezone offset
    Convert to UTC, then to target timezone
    Calculate animation delays
    Set CSS custom properties
```

## Time Calculation

### Timezone Handling

```javascript
#updateClock() {
  const time = new Date();
  const tzOffset = this.#roundTzOffset(this.getAttribute('timezone') || '0');

  // Convert local time to UTC
  const utc = time.getTime() + (time.getTimezoneOffset() * 60000);

  // Apply target timezone offset
  const tzTime = new Date(utc + (3600000 * tzOffset));

  // Calculate negative delays (rewind animation)
  const hour = -3600 * (tzTime.getHours() % 12);  // 12-hour format
  const mins = -60 * tzTime.getMinutes();
  const secs = -tzTime.getSeconds();

  this.style.setProperty('--_dh', `${(hour+mins)}s`);
  this.style.setProperty('--_dm', `${mins}s`);
  this.style.setProperty('--_ds', `${secs}s`);
}
```

**Key insight:** The hour hand delay includes minutes (`hour+mins`) so the hour hand moves smoothly between hours, not just snapping to hour positions.

### Timezone Offset Rounding

```javascript
#roundTzOffset(offset) {
  return Math.round((parseFloat(offset) || 0) * 4) / 4;
}
```

Rounds to nearest 15 minutes (0.25 hours) to support timezones like +5:30 (India) and +5:45 (Nepal).

## Numeral Systems

### Supported Systems

```javascript
#formatNumber(num) {
  const system = this.getAttribute('system') || 'latn';

  // Roman numerals (special handling)
  if (system === 'roman') return this.#romanNumerals[num - 1];
  if (system === 'romanlow') return this.#romanNumerals[num - 1].toLowerCase();

  // All other systems via Intl.NumberFormat
  if (!this.#numberFormatter) {
    this.#numberFormatter = new Intl.NumberFormat('en', {
      numberingSystem: system
    });
  }
  return this.#numberFormatter.format(num);
}
```

**Available systems:**
- `latn` (default): 1, 2, 3...
- `roman`: I, II, III, IV, V...
- `romanlow`: i, ii, iii, iv, v...
- `arab`: ١, ٢, ٣... (Arabic-Indic)
- `thai`: ๑, ๒, ๓... (Thai)
- `hans`: 一, 二, 三... (Simplified Chinese)
- Any valid `Intl.NumberFormat` numberingSystem

### Numeral Positioning

Numerals are positioned using CSS trigonometry:

```css
:host [part~=numerals] li {
  --_r: calc((100% - 15cqi) / 2);  /* Radius from center */
  --_x: calc(var(--_r) + (var(--_r) * cos(var(--_d))));
  --_y: calc(var(--_r) + (var(--_r) * sin(var(--_d))));
  left: var(--_x);
  top: var(--_y);
}
```

```javascript
#generateNumerals(count) {
  count = Math.min(12, Math.max(1, parseInt(count) || 12));
  const step = 360 / count;
  return Array.from({ length: count }, (_, i) => {
    const deg = ((i * step) + 270) % 360;  // Start at 12 o'clock (270°)
    const num = ((i * (12 / count))) % 12 || 12;
    return `<li style="--_d:${deg}deg">${this.#formatNumber(num)}</li>`;
  }).join('');
}
```

**Why 270°?** CSS angles start at 3 o'clock (East). Adding 270° rotates to 12 o'clock position.

## Indices Generation

### Tick Mark Rendering

```javascript
#generateIndices() {
  if (!this.hasAttribute('indices')) return '';

  const isHours = this.getAttribute('indices') === 'hours';
  const count = isHours ? 12 : 60;  // 12 or 60 marks
  const step = 100 / count;
  const marker = this.getAttribute('marker') || '|';
  const markerHour = this.getAttribute('marker-hour') || marker;

  return Array.from({ length: count }, (_, i) => {
    const percentage = `${(i * step)}%`;
    const isHourMark = isHours || i % 5 === 0;  // Every 5th is hour mark
    const part = isHourMark ? 'part="index hour"' : 'part="index"';
    const currentMarker = isHourMark ? markerHour : marker;
    return `<li style="--_d:${percentage}" ${part}>${currentMarker}</li>`;
  }).join('');
}
```

### Indices Positioning (CSS offset-path)

```css
:host [part~=indices] li {
  offset-distance: var(--_d);  /* Percentage along path */
  offset-path: content-box;    /* Follow element's content box (circle) */
}
```

The `offset-path: content-box` makes elements flow along the circular border of the `<ul>`, creating a ring of tick marks.

## Date Formatting

```javascript
#formatDate(tzTime) {
  const date = this.getAttribute('date');
  if (!date) {
    this.#date.hidden = true;
    return '';
  }

  this.#date.hidden = false;
  const parts = {
    day: tzTime.getDate().toString().padStart(2, '0'),
    month: (tzTime.getMonth() + 1).toString().padStart(2, '0'),
    year: tzTime.getFullYear().toString()
  };

  // Parse attribute like "day month" or "day"
  return date.split(' ')
    .map(part => parts[part])
    .filter(Boolean)
    .join(' ');
}
```

**Supported tokens:** `day`, `month`, `year` (space-separated combination)

## Attributes Reference

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `date` | String | — | Date format tokens: "day", "month", "year" or combinations |
| `indices` | Boolean/String | — | Show tick marks; "hours" for 12 marks, empty for 60 |
| `label` | String | — | Text label displayed below clock |
| `marker` | String | `"\|"` | Character for minute tick marks |
| `marker-hour` | String | (marker) | Character for hour tick marks |
| `numerals` | Number | `12` | Number of numerals to display (1-12) |
| `steps` | Boolean | `false` | Use stepping animation for seconds hand |
| `system` | String | `"latn"` | Numbering system (roman, romanlow, or Intl system) |
| `timezone` | Number | `0` | UTC offset in hours (e.g., -4, +5.5, +9) |

## CSS Custom Properties Reference

### Host Element
| Property | Default | Description |
|----------|---------|-------------|
| `--analog-clock-bg` | `light-dark(hsl(0, 0%, 95%), hsl(0, 0%, 15%))` | Background color/gradient |
| `--analog-clock-c` | `light-dark(hsl(0, 0%, 15%), hsl(0, 0%, 85%))` | Main text color |
| `--analog-clock-ff` | `ui-sans-serif, system-ui, sans-serif` | Font family |

### Numerals
| Property | Default | Description |
|----------|---------|-------------|
| `--analog-clock-fs` | `6cqi` | Numeral font size |
| `--analog-clock-fw` | `700` | Numeral font weight |
| `--analog-clock-numerals-m` | `0` | Numerals container margin |

### Indices
| Property | Default | Description |
|----------|---------|-------------|
| `--analog-clock-indices-c` | `light-dark(hsl(0, 0%, 85%), hsl(0, 0%, 35%))` | Indices color |
| `--analog-clock-indices-fs` | `6cqi` | Indices font size |
| `--analog-clock-indices-p` | `0` | Indices container padding |
| `--analog-clock-indices-hour-c` | `light-dark(hsl(0, 0%, 15%), hsl(0, 0%, 85%))` | Hour mark color |
| `--analog-clock-indices-hour-fw` | `800` | Hour mark font weight |

### Hands
| Property | Default | Description |
|----------|---------|-------------|
| `--analog-clock-hour` | `currentColor` | Hour hand color |
| `--analog-clock-minute` | `currentColor` | Minute hand color |
| `--analog-clock-second` | `#ff8c05` | Second hand color |
| `--analog-clock-cap` | `currentColor` | Center cap color |
| `--analog-clock-cap-sz` | `8cqi` | Center cap size |

### Date & Label
| Property | Default | Description |
|----------|---------|-------------|
| `--analog-clock-date-c` | `#888` | Date text color |
| `--analog-clock-date-ff` | `ui-monospace, monospace` | Date font family |
| `--analog-clock-date-fs` | `5cqi` | Date font size |
| `--analog-clock-label-c` | `currentColor` | Label text color |
| `--analog-clock-label-fs` | `5cqi` | Label font size |
| `--analog-clock-label-fw` | `600` | Label font weight |

## CSS Parts

| Part | Description |
|------|-------------|
| `indices` | Tick marks container (`<ul>`) |
| `index` | Individual tick mark |
| `hour` | Hour tick mark (combined with `index`) |
| `numerals` | Numerals container (`<ol>`) |
| `hands` | Hands container (`<nav>`) |
| `seconds` | Second hand |
| `minutes` | Minute hand |
| `hours` | Hour hand |
| `date` | Date display (`<time>`) |
| `label` | Label text (`<span>`) |

## Usage Patterns

### Basic World Clock

```html
<analog-clock label="New York" timezone="-5"></analog-clock>
<analog-clock label="London" timezone="0"></analog-clock>
<analog-clock label="Tokyo" timezone="+9"></analog-clock>
```

### Roman Numerals with Hour Marks

```html
<analog-clock
  system="roman"
  numerals="4"
  indices="hours"
  marker="●"
></analog-clock>
```

### Full-featured Clock

```html
<analog-clock
  label="Copenhagen"
  timezone="+1"
  indices
  marker="·"
  marker-hour="●"
  date="day month"
  steps
></analog-clock>
```

### Custom Themed Clock

```css
analog-clock.gold {
  --_gold: #E2CA7D;
  --analog-clock-bg: radial-gradient(
    circle,
    color-mix(in oklab, var(--_gold) 20%, white) 50%,
    var(--_gold)
  );
  --analog-clock-c: color-mix(in oklab, var(--_gold) 50%, black);
  --analog-clock-second: maroon;
}
```

## Gotchas & Edge Cases

1. **One-time initialization**: Clock time is set once in constructor. It doesn't update if you change the `timezone` attribute after creation.

2. **No live updates**: The clock relies on CSS animation from initial position. If the page is backgrounded for a long time, animation may drift slightly.

3. **12-hour format only**: Hours are always displayed modulo 12.

4. **Numeral count flexibility**: Setting `numerals="4"` shows only 12, 3, 6, 9 (evenly spaced subset).

5. **Container queries required**: Uses `cqi` units - requires browser support for container queries.

6. **Steps attribute**: Only affects seconds hand. Minutes hand always steps. Hours hand always smooth.

7. **Timezone precision**: Supports 15-minute increments (0.25 hours) for zones like +5:30 or +5:45.

8. **CSS offset-path**: Indices use `offset-path: content-box` which requires modern browser support.
