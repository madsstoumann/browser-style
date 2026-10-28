# Form types: European Union

EU field types for [`@browser.style/form-rules`](../../form-rules/): **EU VAT number** (`eu/vat`), with the `euVat` check: the country prefix (`DK`, `DE`, `EL`, `XI`, …) and that member state's format.

```bash
npm install @browser.style/form-types-eu
```

| File | Holds |
| --- | --- |
| `types.json` | The type package |
| `functions.js` | `VAT_FORMATS` and the `euVat` check |

The check is about the format only. Whether a number is registered is a VIES lookup, which belongs in a service the rules call (`fetch` with `wait`), not in a check.

The [forms guide](../../../docs/forms.md#field-types-and-packages) explains type packages.
