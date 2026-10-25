# Form types: Banking

Banking field types for [`@browser.style/form-rules`](../../form-rules/): **IBAN** (`banking/iban`, privacy `personal`), with the `iban` (mod 97) and `luhn` checks.

```bash
npm install @browser.style/form-types-banking
```

| File | Holds |
| --- | --- |
| `types.json` | The type package |
| `functions.js` | `iban` and `luhn` field checks |

Load it with `loadPackages([…, '/ui/form-types/banking/types.json'])` from form-rules, or `import functions from '@browser.style/form-types-banking'`. The [forms guide](../../../docs/forms.md#field-types-and-packages) explains type packages.
