# Pocket Synth - Internal Architecture

## Overview

`<ui-pocket-synth>` is a custom HTML element that provides a touch-based audio synthesizer similar to the Korg Kaossilator. It uses the Web Audio API to generate sound with configurable waveforms and filters, controlled via an XY pad interface.

**Version:** 1.0.00 (index.js header)

**Component Type:** Web Component (Custom Element with Shadow DOM)

**Key Characteristics:**
- Shadow DOM encapsulation with Constructable Stylesheets
- Web Audio API for sound generation
- Uses `<x-y>` component for 2D frequency/filter control
- Four oscillator waveforms (sine, sawtooth, square, triangle)
- Four filter types (allpass, lowpass, highpass, bandpass)
- Keyboard accessible via spacebar toggle

**Dependencies:**
- `@browser.style/xy` (x-y controller component)
- `@browser.style/base` (peer dependency for CSS variables)

## Architecture Overview

### Component Structure

```
<ui-pocket-synth>
  #shadow-root
    ├── <x-y part="xy">           ← 2D controller for frequency/Q
    └── <form part="controls">
          ├── <fieldset>          ← Waveform selection (radio buttons)
          │     └── <label> × 4   ← sine, sawtooth, square, triangle
          ├── <fieldset>          ← Filter selection (radio buttons)
          │     └── <label> × 4   ← allpass, lowpass, highpass, bandpass
          └── <label>
                └── <input part="gain">  ← Gain slider
```

### Audio Signal Chain

```
Oscillator → BiquadFilter → GainNode → AudioContext.destination
    ↑             ↑            ↑
    │             │            └── Volume control (gain slider)
    │             └── Filter type + frequency + Q (XY position)
    └── Waveform type (radio buttons)
```

## Audio Components

### Oscillator

Created on `xydown`, destroyed on `xyup`:

```javascript
this.oscillator = this.context.createOscillator();
this.oscillator.connect(this.filter);
this.oscillator.frequency.value = 220;  // Default, updated by Y position
this.oscillator.type = this.controls.elements.wave.value;
this.oscillator.start();
```

**Waveform Options:**
| Type | Description |
|------|-------------|
| `sine` | Pure tone, no harmonics |
| `sawtooth` | Bright, buzzy (default) |
| `square` | Hollow, clarinet-like |
| `triangle` | Soft, flute-like |

### BiquadFilter

Persistent filter node, type set on each `xydown`:

```javascript
this.filter = this.context.createBiquadFilter();
this.filter.connect(this.gainNode);
```

**Filter Options:**
| Type | Description |
|------|-------------|
| `allpass` | Passes all frequencies, shifts phase |
| `lowpass` | Cuts high frequencies |
| `highpass` | Cuts low frequencies (default) |
| `bandpass` | Passes frequencies around center |

### Gain Node

Persistent gain control:

```javascript
this.gainNode = this.context.createGain();
this.gainNode.connect(this.context.destination);
this.gainNode.gain.value = 0.5;
```

## XY Controller Mapping

The x-y component controls frequency and filter parameters:

| Axis | Range | Controls |
|------|-------|----------|
| Y | 27.5 - 440 Hz | Oscillator frequency |
| X | 0 - 100 | Filter Q value (÷4) |

```javascript
// In move() handler:
this.oscillator.frequency.value = e.detail.y;      // Y → oscillator freq
this.filter.frequency.value = e.detail.y * 4;      // Y → filter freq (scaled)
this.filter.Q.value = e.detail.x / 4;              // X → filter Q
```

The Y range (27.5-440 Hz) covers A0 to A4 (about 4 octaves).

## Event Handlers

### XY Events

| Event | Action |
|-------|--------|
| `xydown` | Create oscillator, set waveform/filter, start sound |
| `xymove` | Update frequency and filter parameters |
| `xyup` | Stop and destroy oscillator |
| `xytoggle` | Toggle sound on/off (spacebar) |

### Form Events

| Element | Event | Action |
|---------|-------|--------|
| Wave radios | (none) | Read on `xydown` |
| Filter radios | (none) | Read on `xydown` |
| Gain slider | `input` | Update `gainNode.gain.value` |

## CSS Custom Properties

### Host Styling

| Property | Default | Description |
|----------|---------|-------------|
| `--ui-pocket-synth-bg` | `var(--CanvasGray)` | Background color |
| `--ui-pocket-synth-bdc` | `var(--ButtonText)` | Border/control color |
| `--ui-pocket-synth-bdw` | `1px` | Border width |
| `--ui-pocket-synth-w` | `250px` | Component width |
| `--ui-pocket-synth--active-bg` | `var(--ButtonText)` | Active button background |
| `--ui-pocket-synth--active-c` | `#FFF` | Active button text color |

### XY Controller Overrides

The component sets these on the x-y element:

```css
--ui-xy-bg: var(--ButtonText);
--ui-xy-point-bdw: 2px;
--ui-xy-point-bg: #0000;
--ui-xy-point-sz: 24px;
```

## CSS Parts

| Part | Element | Description |
|------|---------|-------------|
| `xy` | `<x-y>` | The XY controller pad |
| `controls` | `<form>` | Form containing all controls |
| `gain` | `<input type="range">` | Volume slider |

## Usage Patterns

### Basic Usage

```html
<ui-pocket-synth></ui-pocket-synth>
```

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

## Keyboard Navigation

When the XY pad has focus:

| Key | Action |
|-----|--------|
| Space | Toggle sound on/off |
| Arrow keys | Move cursor position |
| Shift + Arrow | Faster movement |

## Gotchas & Edge Cases

1. **AudioContext autoplay**: Browsers require user interaction before playing audio. The first touch/click will activate the AudioContext.

2. **leave="false"**: The x-y controller is configured with `leave="false"` so sound only stops on actual pointer up, not when leaving the pad area.

3. **No disconnectedCallback**: Audio nodes are not explicitly disconnected when the element is removed from DOM.

4. **Oscillator recreation**: A new oscillator is created for each touch/click. Oscillators cannot be restarted once stopped.

5. **Default filter**: `highpass` is selected by default, which may sound thin at low frequencies.

6. **Gain range**: The gain slider goes 0-100 but maps directly to gain value (not decibels), so 100 may be very loud.

7. **Frequency range**: 27.5-440 Hz is limited to 4 octaves. For wider range, modify `min-y` and `max-y` attributes on the x-y element.
