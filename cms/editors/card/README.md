# Editor Card

`<editor-card>` — the card model's **`schemaType` + `details` editor** for CMS embedding.

The card content model (`cms/baseline/models/card.schema.json`) is **one** model for all 54
schema.org card types: shared envelope fields are native CMS fields, and everything
type-specific lives in a single JSON field called `details`, discriminated by `schemaType`.
This component edits exactly that pair — a dropdown of every schema type (grouped by the
eleven subject sections of `ui/card/demo/schema.html`) and a per-type form for `details` —
so a CMS needs one card content type, not fifty-four.

## Usage

```html
<script type="importmap">
	{ "imports": { "@browser.style/editor-shared": "https://browser.style/cms/editors/shared/index.js" } }
</script>
<script type="module" src="https://browser.style/cms/editors/card/src/index.js"></script>

<editor-card></editor-card>
```

## Value contract

The payload is `{ schemaType, details }`.

- **`value` property (setter)** accepts an object *or* a JSON string — Contentful hands the
  stored object over directly, Umbraco/Optimizely/Storyblok store stringified JSON.
- **`value` property (getter)** and the form-associated value are a **JSON string**.
- **`change` / `input` events** (`bubbles`, `composed`) carry an **object**
  `detail: { schemaType, details }` — pass it straight to a JSON field's `setValue()`.
- **`ready`** — a promise resolved once styles are adopted and the first render is done
  (the Umbraco wrapper awaits it).
- **`locked` attribute** — disables the schemaType dropdown. Locking is **opt-in** (the 1.x
  editor auto-locked on load); the whole point of one model + a dropdown is that authors
  pick the type.

### Round-trip guarantees

- **Unknown `details` keys pass through untouched** — renderer-only keys, future keys, or a
  team's own extensions survive an edit session verbatim, key order included.
- A key is only written when the user edits its field; clearing a field **deletes** the key,
  unless the loaded payload carried it explicitly (an explicit `false` can differ from a
  renderer default, e.g. `ordered`).
- Machine date-times render as text inputs, not `datetime-local` — corpus values carry
  seconds and timezone offsets the native control cannot represent.

### Legacy payloads

A 1.x payload (`{ type, article: {…} }`) loads without loss: a known `type` is adopted as
`schemaType` and every other key is preserved verbatim under `details`. The old nested
shapes map to no panel fields — the data is kept, not migrated.

## Where the form comes from

`src/details.data.js` is **generated** — do not edit it. The source of truth is
`ui/card/data/details.json` (the details manifest); `node ui/card/details.build.js`
regenerates the schemas, the grouped dropdown and every lookup vocabulary
(`SUBTYPES`, `ATTENDANCE_MODES`, `MEDICAL_SPECIALTIES`, … from `ui/card/render.js`, icon
names from `ui/icon/icons.data.js`), and `node ui/card/details.lint.js` fails the build
when the manifest, the renderer and the `ui/card/data/` corpus disagree. Adding a schema
type is the `add-schema` skill; the editor picks it up by regeneration, never by hand.

Conditional behaviour, all declared in the manifest: the details panel swaps per type;
`subtype` appears only on the nine `SUBTYPES` families; `paywalled` is injected on every
`PAYWALL_TYPES` member; `requires` gates (e.g. `places.slide` needs `slides`) hide fields
until their sibling is set; the four `SUBHEADLINE_SLOT` types show a hint that their
brand/artist/jobTitle fields fill the envelope subheadline. Free-shape fields
(`places.items`, `map`, `mapMedia`, `geo.links`) render as raw JSON textareas.

## CMS wrappers

`cms/integrations/contentful/card/` and `cms/integrations/umbraco/card/` bind this
component to a JSON field and denormalise the chosen `schemaType` into a sibling field so
the CMS can filter on it. See `cms/integrations/AGENTS.md` for the pattern (it ports
directly to Contentstack and Storyblok).

## Demo

`demo.html` loads any instance from `ui/card/data/` and shows a live round-trip readout;
`index.html` is a bare usage page.
