# Circular Range Web Component

A customizable, circular range slider web component.

## Usage

```html
<circular-range
  value="50"
  min="0"
  max="100"
  step="1"
  start="0"
  end="360"
  labels="0:Min,100:Max"
  indices="10"
  suffix="%"
  enable-min
></circular-range>
```

## Attributes

| Attribute    | Description                                                                                                | Default |
|--------------|------------------------------------------------------------------------------------------------------------|---------|
| `value`      | The current value of the slider.                                                                           | `0`       |
| `min`        | The minimum value of the slider.                                                                           | `0`       |
| `max`        | The maximum value of the slider.                                                                           | `100`     |
| `step`       | The stepping interval for the value.                                                                       | `1`       |
| `shift-step` | The stepping interval when using arrow keys with the Shift key.                                            | `step * 10` |
| `active-label` | The value of the label to be styled as active.                                                             | `null`    |
| `start`      | The start angle of the circular range in degrees.                                                          | `0`       |
| `end`        | The end angle of the circular range in degrees.                                                            | `360`     |
| `labels`     | Comma-separated value-label pairs to display around the slider. Example: `0:Low,50:Mid,100:High`.           | `null`    |
| `indices`    | The number of tick marks (indices) to display along the track. To get an indice for each step, you can calculate it as `(max - min) / step + 1`. For example, with `min="0"`, `max="100"`, and `step="5"`, you would need `(100 - 0) / 5 + 1 = 21` indices. | `0`       |
| `suffix`     | A string to append to the displayed value.                                                                 | `""`      |
| `enable-min` | A boolean attribute that, when present, applies a different style to the thumb when the value is at minimum. | `false`   |

## Styling

### CSS Parts

You can style the component's internal elements using the `::part()` pseudo-element.

| Part          | Description                  |
|---------------|------------------------------|
| `track`       | The background track.        |
| `fill`        | The value fill indicator.    |
| `thumb`       | The draggable thumb element. |
| `indices`     | The container for the indices. |
| `labels`      | The container for the labels.  |
| `first-label` | The first label element.     |
| `last-label`  | The last label element.      |
| `active-label`| The currently active label.  |

Example:
```css
circular-range::part(thumb) {
  background-color: red;
}
```

### CSS Custom Properties

Customize the component's appearance using these CSS custom properties.

| Property                           | Description                                  | Default     |
|------------------------------------|----------------------------------------------|-------------|
| `--circular-range-bg`              | The background color of the component.       | `#0000`     |
| `--circular-range-bg-mask`         | The mask for the background.                 | `none`      |
| `--circular-range-bg-scale`        | Scale the background.                        | `1`         |
| `--circular-range-fill`            | The fill color of the range.                 | `#0066cc`   |
| `--circular-range-fill-end`        | The end color of the fill gradient.          | `var(--circular-range-fill)` |
| `--circular-range-fill-middle`     | The middle color of the fill gradient.       | `var(--circular-range-fill)` |
| `--circular-range-fill-start`      | The start color of the fill gradient.        | `var(--circular-range-fill)` |
| `--circular-range-indice-bdrs`     | The border-radius of the indices.            | `0`         |
| `--circular-range-indice-c`        | The color of the indices.                    | `#d9d9d9`   |
| `--circular-range-indice-h`        | The height of the indices.                   | `5px`       |
| `--circular-range-indice-w`        | The width of the indices.                    | `1px`       |
| `--circular-range-indices-w`       | The width of the indices container.          | `80%`       |
| `--circular-range-labels-c`        | The color of the labels.                     | `light-dark(#333, #CCC)` |
| `--circular-range-labels-fs`       | The font-size of the labels.                 | `x-small`   |
| `--circular-range-labels-w`        | The width of the labels container.           | `70%`       |
| `--circular-range-output-ff`       | The font-family of the output value.         | `inherit`   |
| `--circular-range-output-fs`       | The font-size of the output value.           | `200%`      |
| `--circular-range-output-fw`       | The font-weight of the output value.         | `700`       |
| `--circular-range-output-gr`       | The grid-row for the output value.           | `2`         |
| `--circular-range-rows`            | The number of grid rows in the component.    | `5`         |
| `--circular-range-thumb`           | The color of the thumb.                      | `#0066cc`   |
| `--circular-range-thumb-min`       | The color of the thumb when at the minimum value and `enable-min` is set. | `#e0e0e0`   |
| `--circular-range-track`           | The color of the track.                      | `#f0f0f0`   |
| `--circular-range-track-sz`        | The size (thickness) of the track.           | `1.5rem`    |
| `--circular-range-w`               | The width of the component.                  | `320px`     |

## Parts

- `label-[value]` - The label for a specific value.
- `active-label` - The currently active label.
- `first-label` - The first label.
- `last-label` - The last label.
