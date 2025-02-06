# Analog Clock

A customizable analog clock web component that displays time with support for multiple time zones, number systems, indices and visual styles.

## Installation

```bash
npm install @browser.style/analog-clock
```

## Basic Usage

```javascript
import '@browser.style/analog-clock';
```

```html
<analog-clock></analog-clock>
```

## Attributes

- `date`: Display date. Values: "day", "month", "year" or any combination
- `indices`: Show tick marks. Values: empty (60 marks) or "hours" (12 marks)
- `label`: Text label below the clock
- `marker`: Character used for indices (default: "|")
- `marker-hour`: Character used for hour indices (defaults to marker value)
- `numerals`: Number of numerals to display (1-12, default: 12)
- `steps`: Use stepping animation for seconds hand
- `system`: Number system. Values: "roman", "romanlow", or any valid [Intl numberingSystem](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#numberingsystem)
- `timezone`: UTC offset in hours (e.g., "-4", "+1", "+5.5")

## CSS Custom Properties

### Layout & Typography
- `--analog-clock-ff`: Font family (default: system-ui)
- `--analog-clock-fs`: Font size for numerals (default: 6cqi)
- `--analog-clock-fw`: Font weight for numerals (default: 700)

### Colors & Theme
- `--analog-clock-bg`: Background color/gradient (default: light-dark(hsl(0, 0%, 95%), hsl(0, 0%, 15%)))
- `--analog-clock-c`: Main color for numerals (default: light-dark(hsl(0, 0%, 15%), hsl(0, 0%, 85%)))
- `--analog-clock-cap`: Center cap color (default: currentColor)
- `--analog-clock-cap-sz`: Size of center cap (default: 8cqi)
- `--analog-clock-date-c`: Date color (default: #888)
- `--analog-clock-hour`: Hour hand color (default: currentColor)
- `--analog-clock-minute`: Minute hand color (default: currentColor)
- `--analog-clock-second`: Second hand color (default: #ff8c05)
- `--analog-clock-indices-c`: Indices color (default: #0005)

### Indices & Numerals
- `--analog-clock-indices-fs`: Indices font size (default: 6cqi)
- `--analog-clock-indices-m`: Indices margin (default: 0)
- `--analog-clock-indices-hour-fw`: Hour indices font weight (default: 800)
- `--analog-clock-indices-hour-c`: Hour indices color (default: #0005)
- `--analog-clock-numerals-m`: Numerals margin (default: 1ch)

### Date & Label Display
- `--analog-clock-date-ff`: Date font family (default: monospace)
- `--analog-clock-date-fs`: Date font size (default: 5cqi)
- `--analog-clock-label-fs`: Label font size (default: 5cqi)
- `--analog-clock-label-fw`: Label font weight (default: 600)

## Examples

```html
<!-- Basic clock with New York time -->
<analog-clock label="New York" timezone="-4"></analog-clock>

<!-- Gold-themed clock with Roman numerals and hour marks -->
<analog-clock 
  class="gold" 
  system="roman" 
  numerals="4"
  indices="hours"
  marker="●"
></analog-clock>

<!-- Clock with minute indices and date display -->
<analog-clock 
  indices 
  marker="|" 
  date="day month"
></analog-clock>

<!-- Clock with different markers for hours and minutes -->
<analog-clock 
  indices 
  marker="·" 
  marker-hour="●"
  date="day month"
></analog-clock>
```

```css
/* Gold theme example */
.gold {
  --_gold: #E2CA7D;
  --_dark: color-mix(in oklab, var(--_gold) 60%, black);
  --_accent: color-mix(in oklab, var(--_gold) 80%, maroon);
  
  --analog-clock-bg: radial-gradient(
    circle at 50% 50%,
    color-mix(in oklab, var(--_gold) 20%, white) 50%,
    var(--_gold) 51%,
    color-mix(in oklab, var(--_gold) 85%, black) 95%
  );
  --analog-clock-c: color-mix(in oklab, var(--_gold) 50%, black);
  --analog-clock-ff: "Didot", serif;
  --analog-clock-hour: var(--_dark);
  --analog-clock-minute: var(--_dark);
  --analog-clock-second: var(--_accent);
  --analog-clock-cap: color-mix(in oklab, var(--_dark), white 20%);
}
```
