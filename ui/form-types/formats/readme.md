# Form types: Formats

Format field types for [`@browser.style/form-rules`](../../form-rules/): **ISBN** (`formats/isbn`), **barcode** (`formats/gtin`, EAN/GTIN 8, 12, 13 and 14), **IP address** (`formats/ipv4`), **UUID** (`formats/uuid`, a pattern) and **colour** (`formats/colour`, the browser's colour picker).

```bash
npm install @browser.style/form-types-formats
```

| File | Holds |
| --- | --- |
| `types.json` | The type package |
| `functions.js` | `isbn`, `gtin` and `ipv4` field checks (check digits, not only the shape) |

Load it with `loadPackages([…, '/ui/form-types/formats/types.json'])` from form-rules, or `import functions from '@browser.style/form-types-formats'`. The [forms guide](../../../docs/forms.md#field-types-and-packages) explains type packages.
