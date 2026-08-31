# Editor Card — internal architecture

`<editor-card>` edits the card model's `{ schemaType, details }` pair. Shadow DOM,
form-associated, one delegated listener set on the form. **v2** — the 1.x editor (25 legacy
`content-card` types, hand-written `schemas.js`, `{type, article:{…}}` payloads) is gone.

## Files

| File | Role |
|---|---|
| `src/index.js` | the component: grouped dropdown, per-type panel, value contract, events |
| `src/state.js` | pure helpers — `esc`, `parseValue` (incl. legacy adoption), `serializeValue`, `getPath`/`setPath`/`deletePath`, `emptyItemFor`. DOM-free, unit-tested |
| `src/details.data.js` | **GENERATED** by `ui/card/details.build.js` from `ui/card/data/details.json` — `SCHEMA_TYPE_GROUPS`, `DETAILS_SCHEMAS`, `LOOKUPS`, `TYPE_FLAGS`, `INJECTED`. Never edit; regenerate |
| `src/i18n.json` | UI strings, `createTranslator` shape (`{en: {...}}`) |
| `roundtrip.test.js` | `node --test` — value contract, legacy adoption, path ops, byte-equal round-trip over the whole `ui/card/data/` corpus |

## The invariants

1. **Round-trip is sacred.** `state.details` starts as the parsed input; rendering never
   writes to it; only user actions do (`_write`, add/remove). Unknown keys are never touched.
   `setPath` appends new keys after existing ones so key order survives serialization.
   `roundtrip.test.js` proves byte-equality over every corpus instance.
2. **Everything interpolated goes through `esc()`** — values, labels, lookup options, paths.
   The 1.x editor interpolated raw values (`value="${value}"`); that XSS class is closed.
3. **Deletion semantics**: empty input / empty select / unchecked toggle ⇒ `deletePath`,
   EXCEPT a toggle whose key existed in the loaded payload (`this._original`) writes `false`
   — explicit `false` differs from absence for renderer defaults like `ordered`.
4. **Delegated listeners** are bound once in `connectedCallback` and removed before every
   re-render (`_removeEventListeners`) — same discipline as 1.x, prevents stacking.
5. **Re-render only on structure changes** (type switch, add/remove, gate toggles) —
   typing never re-renders, so focus is preserved. Gate keys = the `requires` targets in
   the current schema (`_gateKeys`).
6. **`ready`** resolves after `adoptSharedStyles` + first render (editor-csp pattern);
   the Umbraco wrapper's `waitForReady` races it.

## Control mapping (from the generated field specs)

`select` (options from `LOOKUPS[field.lookup]`, off-list current value kept as an extra
option) · `toggle` (checkbox) · `textarea` · `date` (native when the value is a pure
`YYYY-MM-DD`, text otherwise) · `datetime` (text — timezone offsets don't fit
`datetime-local`) · `fieldset`/`geopoint` (nested `<fieldset>`) · `repeater` (array rows:
object rows as fieldsets, scalar rows as single inputs — a `scalar`-capable shape renders
the kind the data already has; new rows default per `emptyItemFor`) · `open: true` fields
(raw JSON textarea, `data-json`, `aria-invalid` on parse failure) · everything else →
`<input type=text|number|url|email|tel|time>`.

Injected cross-type field: `paywalled` renders on `TYPE_FLAGS.paywalled` members after the
declared fields. Envelope-only types with no fields render an explanatory hint.

## Events / data flow

```
value attr/property → parseValue → state {schemaType, details} + _original clone → render
user input → _handleInput/_handleChange/_handleClick → _write(path, value)
          → setPath/deletePath on state.details → _emitChange
_emitChange → setFormValue(JSON string) → preview → change + input events
              (detail = structuredClone({schemaType, details}))
```

## Gotchas

- `details.data.js` staleness is a **build failure** — `ui/card/details.lint.js` rule 9
  compares the committed file against an in-memory rebuild.
- `_itemsSpecAt(path)` re-derives the array item spec from the schema by walking the path
  (numeric segments step into `items`), so nested repeaters (loyalty tiers → benefits) work.
- The JSON preview `<details>` is presentation; the form value is `get value`.
- The schemaType dropdown's `<optgroup>` labels are the eleven `schema.html` section names,
  from the manifest's `groups` — order and membership are linted, don't hardcode either here.
