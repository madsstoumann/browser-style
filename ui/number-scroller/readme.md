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

## Attributes

| Attribute | Description | Default |
| --- | --- | --- |
| `label` | The text displayed in the `<legend>` of the component. | `'Number Scroller'` |
| `min` | The minimum value of the range. | `'0'` |
| `max` | The maximum value of the range. | `'100'` |
| `step` | The increment value for the range. | `'1'` |
| `value` | The initial value of the component. | `'0'` |
| `snap-points` | The number of visual snap points to render in the scroller UI. | `'0'` |
| `lang` | The BCP 47 language tag for formatting (e.g., `en-US`, `da-DK`). | The document's language or `'en-US'`. |
| `format` | The number formatting style. See options below. | `'currency'` |
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

