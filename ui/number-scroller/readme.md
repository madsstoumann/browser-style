# Number Scroller

A customizable, accessible number scroller/range input web component that supports advanced number formatting.

## Usage

To use the component, add the `<number-scroller>` tag to your HTML and configure its behavior using attributes.

```html
<number-scroller
	label="Your Monthly Salary"
	min="0"
	max="100000"
	step="1000"
	value="25000"
	snap-points="100"
	lang="en-US"
	format="currency"
	currency="USD"
	decimals="0"
	scroll-multiplier="1.5"
>
</number-scroller>
```


## CSS Custom Properties

You can customize the appearance of the number scroller using the following CSS custom properties:

| Property | Description | Default |
| --- | --- | --- |
| `--number-spinner-snap-minor-bg` | Minor snap line background color | `#CCC` |
| `--number-scroller-snap-minor-bdrs` | Minor snap line border radius | `1px` |
| `--number-scroller-snap-minor-h` | Minor snap line height | `70%` |
| `--number-scroller-snap-minor-w` | Minor snap line width | `1px` |
| `--number-spinner-snap-major-bg` | Major snap line background color | `#CCC` |
| `--number-scroller-snap-major-bdrs` | Major snap line border radius | `1px` |
| `--number-scroller-snap-major-h` | Major snap line height | `100%` |
| `--number-scroller-snap-major-w` | Major snap line width | `2px` |
| `--number-spinner-snap-bg` | Snap point background color | `#CCC` |
| `--number-scroller-snap-bdrs` | Snap point border radius | `1px` |
| `--number-scroller-snap-h` | Snap point height | `70%` |
| `--number-scroller-snap-w` | Snap point width | `1px` |
| `--number-scroller-label-c` | Label color | `inherit` |
| `--number-scroller-ff` | Font family | `ui-sans-serif, system-ui` |
| `--number-scroller-fieldset-rg` | Fieldset row gap | `1rem` |
| `--number-spinner-label-rg` | Label row gap | `.25rem` |
| `--number-scroller-indicator-bg` | Indicator background color | `hsl(219, 79%, 66%)` |
| `--number-scroller-indicator-bdrs` | Indicator border radius | `3px` |
| `--number-scroller-indicator-h` | Indicator height | `2rem` |
| `--number-scroller-indicator-w` | Indicator width | `5px` |
| `--number-scroller-triangle-bg` | Triangle background color | `hsl(219, 79%, 6%)` |
| `--number-scroller-triangle-h` | Triangle height | `5px` |
| `--number-scroller-triangle-w` | Triangle width | `10px` |
| `--number-scroller-focus-outline-c` | Focus outline color | `#CCC` |
| `--number-scroller-legend-c` | Legend color | `inherit` |
| `--number-scroller-legend-fw` | Legend font weight | `400` |
| `--number-scroller-legend-fs` | Legend font size | `.75rem` |
| `--number-scroller-out-c` | Output color | `inherit` |
| `--number-scroller-out-fs` | Output font size | `2rem` |
| `--number-scroller-out-fw` | Output font weight | `600` |
| `--number-scroller-w` | Scroller width | `200%` |
| `--number-scroller-mask` | Mask for scroll area | `linear-gradient(to right, #0000, #000 15%, #000 85%, #0000)` |
| `--number-scroller-ff` | Font family | `ui-sans-serif, system-ui` |
| `--number-scroller-fieldset-rg` | Fieldset row gap | `1rem` |
| `--number-scroller-focus-outline-c` | Focus outline color | `#CCC` |
| `--number-scroller-indicator-bg` | Indicator background color | `hsl(219, 79%, 66%)` |
| `--number-scroller-indicator-bdrs` | Indicator border radius | `3px` |
| `--number-scroller-indicator-h` | Indicator height | `2rem` |
| `--number-scroller-indicator-w` | Indicator width | `5px` |
| `--number-scroller-label-c` | Label color | `inherit` |
| `--number-scroller-legend-c` | Legend color | `inherit` |
| `--number-scroller-legend-fs` | Legend font size | `.75rem` |
| `--number-scroller-legend-fw` | Legend font weight | `400` |
| `--number-scroller-mask` | Mask for scroll area | `linear-gradient(to right, #0000, #000 15%, #000 85%, #0000)` |
| `--number-scroller-out-c` | Output color | `inherit` |
| `--number-scroller-out-fs` | Output font size | `2rem` |
| `--number-scroller-out-fw` | Output font weight | `600` |
| `--number-scroller-snap-bdrs` | Snap point border radius | `1px` |
| `--number-scroller-snap-h` | Snap point height | `70%` |
| `--number-scroller-snap-major-bdrs` | Major snap line border radius | `1px` |
| `--number-scroller-snap-major-h` | Major snap line height | `100%` |
| `--number-scroller-snap-major-w` | Major snap line width | `2px` |
| `--number-scroller-snap-minor-bdrs` | Minor snap line border radius | `1px` |
| `--number-scroller-snap-minor-h` | Minor snap line height | `70%` |
| `--number-scroller-snap-minor-w` | Minor snap line width | `1px` |
| `--number-scroller-snap-w` | Snap point width | `1px` |
| `--number-scroller-triangle-bg` | Triangle background color | `hsl(219, 79%, 6%)` |
| `--number-scroller-triangle-h` | Triangle height | `5px` |
| `--number-scroller-triangle-w` | Triangle width | `10px` |
| `--number-scroller-w` | Scroller width | `200%` |
| `--number-spinner-label-rg` | Label row gap | `.25rem` |
| `--number-spinner-snap-bg` | Snap point background color | `#CCC` |
| `--number-spinner-snap-major-bg` | Major snap line background color | `#CCC` |
| `--number-spinner-snap-minor-bg` | Minor snap line background color | `#CCC` |


| Attribute | Description | Default |
| --- | --- | --- |
| `snap-to` | Controls snapping behavior for major lines. Allowed values: `major`, `none` | `` |
| `snap-major-interval` | Interval for major snap lines (used for CSS styling only, e.g. 2, 3, 4, 5, 10) | `none` |
| `scroll-width` | Width of the scroll area as a percentage | `200` |
| `snap-points` | The number of visual snap points to render in the scroller UI | `'0'` |
| `label` | The text displayed in the `<legend>` of the component. | `'Number Scroller'` |
| `min` | The minimum value of the range. | `'0'` |
| `max` | The maximum value of the range. | `'100'` |
| `step` | The increment value for the range. | `'1'` |
| `value` | The initial value of the component. | `'0'` |
| `snap-points` | The number of visual snap points to render in the scroller UI. | `'0'` |
| `lang` | The BCP 47 language tag for formatting (e.g., `en-US`, `da-DK`). | The document's language or `'en-US'`. |
| `format` | The number formatting style. See options below. | `'currency'` |
| `currency` | The 3-letter ISO 4217 currency code (e.g., `USD`, `EUR`, `DKK`). Required if `format` is `'currency'`. | `'USD'` |
| `decimals` | The number of decimal places to display. | `'0'` |
| `format` | The number formatting style. See options below. | `'currency'` |
| `label` | The text displayed in the `<legend>` of the component. | `'Number Scroller'` |
| `lang` | The BCP 47 language tag for formatting (e.g., `en-US`, `da-DK`). | The document's language or `'en-US'`. |
| `max` | The maximum value of the range. | `'100'` |
| `min` | The minimum value of the range. | `'0'` |
| `scroll-multiplier` | A multiplier to control the scroll speed when dragging. | `'2'` |
| `scroll-width` | Width of the scroll area as a percentage | `200` |
| `snap-major-interval` | Interval for major snap lines (used for CSS styling only, e.g. 2, 3, 4, 5, 10) | `none` |
| `snap-points` | The number of visual snap points to render in the scroller UI | `'0'` |
| `snap-to` | Controls snapping behavior for major lines. Allowed values: `major`, `none` | `none` |
| `step` | The increment value for the range. | `'1'` |
| `unit` | The unit identifier to use when `format` is `'unit'`. See options below. | `null` |
| `value` | The initial value of the component. | `'0'` |
| `currency` | The 3-letter ISO 4217 currency code (e.g., `USD`, `EUR`, `DKK`). Required if `format` is `'currency'`. | `'USD'` |
| `unit` | The unit identifier to use when `format` is `'unit'`. See options below. | `null` |
| `decimals` | The number of decimal places to display. | `'0'` |
| `scroll-multiplier` | A multiplier to control the scroll speed when dragging. | `'2'` |

---

## Formatting Options

The component uses the `Intl.NumberFormat` API for powerful and localized number formatting.

### `format` Attribute

This attribute controls the overall style of the number.

| Value | Description | Example |
| --- | --- | --- |
| `currency` | Formats the number as a currency. Requires the `currency` attribute. | `€1,234` |
| `decimal` | Formats as a plain number. | `1,234.56` |
| `percent` | Formats the number as a percentage. | `12%` |
| `unit` | Formats the number with a unit. Requires the `unit` attribute. | `12 km` |

### `unit` Attribute

When `format="unit"`, you must provide a valid unit identifier. The following are the most common supported values.

**Length**
* `centimeter`
* `foot`
* `inch`
* `kilometer`
* `meter`
* `mile`
* `millimeter`
* `yard`

**Mass**
* `gram`
* `kilogram`
* `ounce`
* `pound`
* `stone`

**Time**
* `day`
* `hour`
* `minute`
* `month`
* `second`
* `week`
* `year`

**Digital Storage**
* `bit` / `kilobit` / `megabit` / `gigabit` / `terabit`
* `byte` / `kilobyte` / `megabyte` / `gigabyte` / `terabyte` / `petabyte`

**Temperature**
* `celsius`
* `fahrenheit`

**Volume**
* `fluid-ounce`
* `gallon`
* `liter`
* `milliliter`

> For a complete list of all sanctioned unit identifiers, please refer to the official [ECMAScript Internationalization API Specification](https://tc39.es/ecma402/#sec-issanctionedsimpleunitidentifier).

