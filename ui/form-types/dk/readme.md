# Form types: Denmark

Danish field types for [`@browser.style/form-rules`](../../form-rules/): **CPR number** (`dk/cpr`, privacy `special`) and **CVR number** (`dk/cvr`), with their checks.

```bash
npm install @browser.style/form-types-dk
```

| File | Holds |
| --- | --- |
| `types.json` | The type package: what an editor offers, and the property a new field starts from |
| `functions.js` | `dk-cpr` and `dk-cvr` (field checks) and `cprDate` (operator: the birth date in a CPR number) |

```js
import { loadPackages } from '@browser.style/form-rules';

const { types, functions } = await loadPackages(['/ui/form-rules/types/core.json', '/ui/form-types/dk/types.json']);
```

Or pass the functions yourself: `import functions from '@browser.style/form-types-dk'`. The [forms guide](../../../docs/forms.md#field-types-and-packages) explains type packages.
