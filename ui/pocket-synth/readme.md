# Pocket Synth

A touch-based audio synthesizer custom element, similar to the Korg Kaossilator. Uses the Web Audio API with configurable waveforms and filters.

## Installation

```bash
npm install @browser.style/pocket-synth
```

For required dependencies and basic setup, see the [main documentation](../readme.md).

## Usage

Import the component:

```javascript
import '@browser.style/pocket-synth';
```

Or include via script tag:

```html
<script type="module" src="node_modules/@browser.style/pocket-synth/index.js"></script>
```

## Basic Example

```html
<ui-pocket-synth></ui-pocket-synth>
```

## How It Works

- **Touch/click** the XY pad to start sound
- **Drag** to change pitch (Y-axis) and filter resonance (X-axis)
- **Release** to stop sound
- Use **waveform buttons** to change timbre (sine, sawtooth, square, triangle)
- Use **filter buttons** to change filter type (allpass, lowpass, highpass, bandpass)
- Use **gain slider** to adjust volume

## Keyboard Navigation

When the XY pad has focus:

| Key | Action |
|-----|--------|
| Space | Toggle sound on/off |
| Arrow keys | Move cursor position |
| Shift + Arrow | Faster movement |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ui-pocket-synth-bg` | `var(--CanvasGray)` | Background color |
| `--ui-pocket-synth-bdc` | `var(--ButtonText)` | Border/control color |
| `--ui-pocket-synth-bdw` | `1px` | Border width |
| `--ui-pocket-synth-w` | `250px` | Component width |
| `--ui-pocket-synth--active-bg` | `var(--ButtonText)` | Active button background |
| `--ui-pocket-synth--active-c` | `#FFF` | Active button text color |

## CSS Parts

| Part | Description |
|------|-------------|
| `xy` | The XY controller pad |
| `controls` | Form containing all controls |
| `gain` | Volume slider |

## Examples

### Custom Width

```html
<ui-pocket-synth style="--ui-pocket-synth-w: 400px;"></ui-pocket-synth>
```

### Custom Colors

```html
<ui-pocket-synth style="
  --ui-pocket-synth-bg: #1a1a2e;
  --ui-pocket-synth-bdc: #00ff88;
"></ui-pocket-synth>
```

## Audio Details

- **Frequency range**: 27.5 Hz to 440 Hz (A0 to A4, about 4 octaves)
- **Waveforms**: sine, sawtooth (default), square, triangle
- **Filters**: allpass, lowpass, highpass (default), bandpass
- **Y-axis**: Controls oscillator frequency
- **X-axis**: Controls filter Q (resonance)

## Notes

- Requires user interaction before audio plays (browser autoplay policy)
- Uses the `<x-y>` component for the 2D controller
- Sound only stops on pointer up, not when leaving the pad area
