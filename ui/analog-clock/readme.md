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
- `numerals`: Number of numerals to display (1-12, default: 12)
- `steps`: Use stepping animation for seconds hand
- `system`: Number system. Values: "roman", "romanlow", or any valid [Intl numberingSystem](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#numberingsystem)
- `timezone`: UTC offset in hours (e.g., "-4", "+1", "+5.5")

## CSS Custom Properties

### Layout
- `--analog-clock-num-sz`: Size of numeral container (default: 15cqi)
- `--analog-clock-fs`: Font size for numerals (default: 6cqi)
- `--analog-clock-fw`: Font weight for numerals (default: 700)
- `--analog-clock-ff`: Font family (default: system-ui)

### Colors
- `--analog-clock-bg`: Background color/gradient
- `--analog-clock-c`: Main color for numerals
- `--analog-clock-cap`: Center cap color
- `--analog-clock-date-c`: Date color
- `--analog-clock-hour`: Hour hand color
- `--analog-clock-minute`: Minute hand color
- `--analog-clock-second`: Second hand color
- `--analog-clock-indices-c`: Indices color (default: #0005)

### Date Display
- `--analog-clock-date-ff`: Date font family (default: monospace)
- `--analog-clock-date-fs`: Date font size (default: 5cqi)

### Indices
- `--analog-clock-indices-fs`: Indices font size (default: 6cqi)
- `--analog-clock-indices-m`: Indices margin
- `--analog-clock-indices-hour-fw`: Hour indices font weight (default: 800)

### Label
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
