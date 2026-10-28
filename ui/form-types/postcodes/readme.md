# Form types: Postcodes

Postcode field types for [`@browser.style/form-rules`](../../form-rules/), one per country (`postcodes/dk`, `postcodes/uk`, `postcodes/us`, …, privacy `personal`), each with a check named `postcode<Country>` (`postcodeDk`, `postcodeUk`, …).

```bash
npm install @browser.style/form-types-postcodes
```

| File | Holds |
| --- | --- |
| `types.json` | The type package: one type per country |
| `functions.js` | `FORMATS` (pattern and example per country) and the checks made from it |

A check says a postcode is written the way its country writes it, not that it exists; that is a lookup for a service (a choice list from a service, or a type-ahead). To add a country, add a line to `FORMATS` and a type to `types.json`. Countries now: Austria, Belgium, Denmark, Finland, France, Germany, Italy, the Netherlands, Norway, Poland, Spain, Sweden, Switzerland, the United Kingdom and the United States.

The [forms guide](../../../docs/forms.md#field-types-and-packages) explains type packages.
